// =============================================================================
// API Talentis simulée en mémoire.
// Reproduit les routes des contrôleurs ASP.NET Core (backend/src/API/Controllers/v1)
// et leurs réponses ApiResponse<T> { success, data, message }. Aucune requête
// ne quitte le navigateur ; les données repartent du jeu fictif au rechargement.
// =============================================================================
import { buildDb, COMPANY, COUNTRIES, DEPARTMENTS, JOBS, SITES, uid } from './seed';
import { calculatePayroll, detectOvertime, initialLeaveBalances, nextEmployeeNumber, onboardingTasks, round2, TO_XAF, WELCOME_DOCUMENTS, workingDays, ymd } from './rules';

export let db = buildDb();
export const CURRENT_EMPLOYEE_ID = 'e2';
export const DEMO_ACCOUNTS = [
  { email: 'rh@exemple.org', password: 'demo', fullName: 'Aline Mbarga', role: 'HRManager', mfa: false },
  { email: 'admin@exemple.org', password: 'demo', fullName: 'Administrateur Talentis', role: 'SuperAdmin', mfa: true },
];
export const DEMO_MFA_CODE = '123456';

export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
const ok = (data: any, message?: string, extra: Record<string, any> = {}) => ({ success: true, data, message, ...extra });
const fail = (status: number, message: string): never => { throw new HttpError(status, message); };

const emp = (id?: string) => db.employees.find((e) => e.id === id);
const fullName = (e?: any) => (e ? `${e.firstName} ${e.lastName}` : '');
const dept = (id: string) => DEPARTMENTS.find((x) => x.id === id);
const site = (id: string) => SITES.find((x) => x.id === id);
const job = (id: string) => JOBS.find((x) => x.id === id);
const country = (code: string) => COUNTRIES.find((c) => c.code === code)!;
const years = (from: string) => Math.max(0, Math.floor((Date.now() - new Date(from).getTime()) / (365.25 * 86400000)));
const today = () => ymd(new Date());
const daysLeft = (date: string) => Math.floor((new Date(date + 'T23:59:59').getTime() - Date.now()) / 86400000);

const STATUS_LABEL: Record<string, string> = { Active: 'Actif', OnLeave: 'En congé', Suspended: 'Suspendu', TrialPeriod: "Période d'essai", Resigned: 'Démissionné', Terminated: 'Terminé', Retired: 'Retraité' };
const CONTRACT_LABEL: Record<string, string> = { CDI: 'CDI', CDD: 'CDD', Freelance: 'Freelance', Internship: 'Stage', Apprenticeship: 'Alternance', PartTime: 'Temps partiel', Interim: 'Intérim' };
export const APP_STATUS_LABEL: Record<string, string> = { Received: 'Reçue', Shortlisted: 'Présélectionnée', Tested: 'Testée', Interviewed: 'Entretien', SecondInterview: '2e entretien', OfferSent: 'Offre envoyée', Hired: 'Embauché(e)', Rejected: 'Refusée', Withdrawn: 'Retirée' };

function listItem(e: any) {
  return {
    id: e.id, employeeNumber: e.employeeNumber, firstName: e.firstName, lastName: e.lastName, fullName: fullName(e),
    professionalEmail: e.professionalEmail, photoUrl: undefined, jobTitle: job(e.jobPositionId)?.title ?? '',
    departmentName: dept(e.departmentId)?.name ?? '', siteName: site(e.siteId)?.name ?? '', countryCode: e.countryCode,
    status: e.status, statusLabel: STATUS_LABEL[e.status], contractType: e.contractType, contractTypeLabel: CONTRACT_LABEL[e.contractType],
    hireDate: e.hireDate, seniority: years(e.hireDate), managerFullName: fullName(emp(e.managerId)) || undefined, workMode: e.workMode, hasActiveUser: true,
  };
}

function detail(e: any) {
  const c = country(e.countryCode);
  return {
    ...e, photoUrl: undefined, seniority: years(e.hireDate), companyId: COMPANY.id, companyName: COMPANY.name,
    siteName: site(e.siteId)?.name, departmentName: dept(e.departmentId)?.name, jobTitle: job(e.jobPositionId)?.title,
    managerFullName: fullName(emp(e.managerId)) || undefined, countryId: c.id, countryName: c.name,
    documents: [...e.documents], careerHistory: [...e.careerHistory],
    subordinates: db.employees.filter((x) => x.managerId === e.id && !x.isDeleted).map(listItem),
  };
}

function paged<T>(items: T[], q: URLSearchParams) {
  const page = Math.max(1, Number(q.get('page') || 1));
  const pageSize = Math.max(1, Number(q.get('pageSize') || 20));
  return { items: items.slice((page - 1) * pageSize, page * pageSize), totalCount: items.length, page, pageSize, totalPages: Math.max(1, Math.ceil(items.length / pageSize)) };
}

// ------------------------------------------------------------------ AUTH -----
function login(body: any) {
  const acc = DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === String(body?.email || '').toLowerCase() && a.password === body?.password);
  if (!acc) fail(401, 'Identifiants invalides. Comptes de démo : rh@exemple.org / demo.');
  if (acc!.mfa && !body.mfaCode) return { requiresMfa: true, message: 'Code MFA requis.' };
  if (acc!.mfa && body.mfaCode !== DEMO_MFA_CODE) fail(401, 'Code MFA invalide.');
  return {
    accessToken: 'demo.' + Math.random().toString(36).slice(2), expiresIn: 3600,
    user: { email: acc!.email, fullName: acc!.fullName, role: acc!.role, companyId: COMPANY.id },
  };
}

// --------------------------------------------------------------- PERSONNEL ---
function listEmployees(q: URLSearchParams) {
  let list = db.employees.filter((e) => !e.isDeleted);
  const s = (q.get('search') || '').toLowerCase().trim();
  if (s) list = list.filter((e) => [fullName(e), e.professionalEmail, e.employeeNumber, job(e.jobPositionId)?.title].join(' ').toLowerCase().includes(s));
  for (const k of ['status', 'contractType', 'workMode', 'departmentId', 'siteId', 'managerId'] as const) if (q.get(k)) list = list.filter((e) => e[k] === q.get(k));
  const sortBy = q.get('sortBy') || 'LastName', desc = q.get('sortDesc') === 'true';
  const key = (e: any) => sortBy === 'Department' ? dept(e.departmentId)?.name : sortBy === 'Status' ? e.status : sortBy === 'HireDate' ? e.hireDate : e.lastName;
  list = [...list].sort((a, b) => String(key(a)).localeCompare(String(key(b)), 'fr') * (desc ? -1 : 1));
  const p = paged(list.map(listItem), q);
  return ok(p, undefined, { totalCount: p.totalCount });
}

function createEmployee(b: any) {
  const errors: string[] = [];
  if (!b.firstName || b.firstName.length < 2 || b.firstName.length > 100) errors.push('Le prénom doit contenir entre 2 et 100 caractères.');
  if (!b.lastName || b.lastName.length < 2 || b.lastName.length > 100) errors.push('Le nom doit contenir entre 2 et 100 caractères.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(b.professionalEmail || '')) errors.push("L'e-mail professionnel doit être valide.");
  if (!b.departmentId) errors.push('Le département est obligatoire.');
  if (!b.jobPositionId) errors.push('Le poste est obligatoire.');
  if (!b.hireDate || b.hireDate < today()) errors.push("La date d'embauche ne peut pas être dans le passé.");
  if (errors.length) fail(400, errors.join(' '));
  if (db.employees.some((e) => e.professionalEmail.toLowerCase() === b.professionalEmail.toLowerCase())) fail(400, 'Cet email professionnel est déjà utilisé.');
  const s = site(b.siteId) || SITES[0];
  const e: any = {
    id: uid('e'), employeeNumber: nextEmployeeNumber(COMPANY.name, db.employees.map((x) => x.employeeNumber)),
    firstName: b.firstName, lastName: b.lastName, gender: b.gender || 'PreferNotToSay', dateOfBirth: b.dateOfBirth || '1995-01-01', nationality: b.nationality,
    personalEmail: b.personalEmail || b.professionalEmail, professionalEmail: b.professionalEmail, personalPhone: b.personalPhone, professionalPhone: b.professionalPhone,
    city: s.city, status: b.trialPeriodEndDate ? 'TrialPeriod' : 'Active', contractType: b.contractType || 'CDI', hireDate: b.hireDate,
    trialPeriodEndDate: b.trialPeriodEndDate || undefined, contractEndDate: b.contractEndDate || undefined, weeklyHours: Number(b.weeklyHours) || 40,
    workMode: b.workMode || 'OnSite', baseSalary: Number(b.baseSalary) || 0, currency: country(s.countryCode).currency, payrollFrequency: 'Monthly',
    siteId: s.id, departmentId: b.departmentId, jobPositionId: b.jobPositionId, managerId: b.managerId || undefined, countryCode: s.countryCode,
    preferredLanguage: 'fr', gdprConsentGiven: false, isDeleted: false, createdAt: new Date().toISOString(), documents: [],
    careerHistory: [{ id: uid('ch'), changeType: 'Embauche', newValue: job(b.jobPositionId)?.title, effectiveDate: b.hireDate, createdAt: today() }],
  };
  db.employees.push(e);
  for (const [type, total] of Object.entries(initialLeaveBalances(e.countryCode, e.contractType, e.hireDate)))
    db.leaveBalances.push({ employeeId: e.id, type, year: new Date().getFullYear(), totalDays: total, usedDays: 0 });
  return ok(detail(e), 'Employé créé avec succès.');
}

function orgNode(e: any): any {
  return { id: e.id, fullName: fullName(e), jobTitle: job(e.jobPositionId)?.title, departmentName: dept(e.departmentId)?.name, status: e.status, managerId: e.managerId,
    children: db.employees.filter((x) => x.managerId === e.id && !x.isDeleted && !['Resigned', 'Terminated'].includes(x.status)).map(orgNode) };
}

// --------------------------------------------------------------- REPORTING ---
function dashboard() {
  const active = db.employees.filter((e) => !e.isDeleted && ['Active', 'OnLeave', 'TrialPeriod', 'Suspended'].includes(e.status));
  const now = new Date(), ymPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const departures = db.employees.filter((e) => ['Resigned', 'Terminated'].includes(e.status) && (e.contractEndDate || '').startsWith(ymPrefix)).length;
  const departuresYear = db.employees.filter((e) => ['Resigned', 'Terminated'].includes(e.status) && (e.contractEndDate || '') >= ymd(new Date(now.getTime() - 365 * 86400000))).length;
  const by = (f: (e: any) => string) => active.reduce((m: Record<string, number>, e) => ((m[f(e)] = (m[f(e)] || 0) + 1), m), {});
  return ok({
    totalEmployees: active.length,
    newHiresThisMonth: active.filter((e) => e.hireDate.startsWith(ymPrefix)).length,
    departuresThisMonth: departures,
    turnoverRate: active.length ? (departuresYear / active.length) * 100 : 0,
    averageAbsenteeism: 0,
    totalPayrollCost: active.reduce((s, e) => s + e.baseSalary * (TO_XAF[e.currency] ?? 1), 0),
    openPositions: db.jobs.filter((j) => j.status === 'Published').length,
    pendingLeaveRequests: db.leaveRequests.filter((l) => l.status === 'Pending').length,
    employeesByDepartment: by((e) => dept(e.departmentId)!.name),
    employeesByContractType: by((e) => CONTRACT_LABEL[e.contractType]),
    employeesByCountry: by((e) => country(e.countryCode).name),
  });
}

/** Indicateurs calculés à partir du jeu de données fictif (aucun chiffre saisi à la main). */
function kpis() {
  const active = db.employees.filter((e) => !e.isDeleted && ['Active', 'OnLeave', 'TrialPeriod', 'Suspended'].includes(e.status));
  const hired = db.applications.filter((a) => a.status === 'Hired' && a.hiredAt);
  const tth = hired.length ? hired.reduce((s, a) => s + (new Date(a.hiredAt).getTime() - new Date(a.createdAt).getTime()) / 86400000, 0) / hired.length : 0;
  const trained = new Set(db.enrollments.map((x) => x.employeeId)).size;
  const women = active.filter((e) => e.gender === 'Female').length;
  const seniority = active.reduce((s, e) => s + years(e.hireDate), 0) / Math.max(1, active.length);
  const absentDays = db.leaveRequests.filter((l) => l.status === 'Approved' && l.type === 'Sick').reduce((s, l) => s + l.daysCount, 0);
  const otHours = db.overtimes.reduce((s, o) => s + o.hours, 0);
  return ok([
    { name: 'Délai moyen de recrutement', value: Math.round(tth), unit: 'jours', target: 45, trend: 'Stable' },
    { name: 'Collaborateurs formés (année)', value: Math.round((trained / Math.max(1, active.length)) * 100), unit: '%', target: 60, trend: 'Up' },
    { name: 'Part des femmes', value: Math.round((women / Math.max(1, active.length)) * 100), unit: '%', trend: 'Stable' },
    { name: 'Ancienneté moyenne', value: Math.round(seniority * 10) / 10, unit: 'ans', trend: 'Stable' },
    { name: 'Jours d\'arrêt maladie', value: absentDays, unit: 'jours', trend: 'Down' },
    { name: 'Heures supplémentaires détectées', value: round2(otHours), unit: 'h', trend: 'Up' },
  ]);
}

// -------------------------------------------------------------- RECRUTEMENT --
function appList(a: any) {
  const c = db.candidates.find((x) => x.id === a.candidateId)!; const j = db.jobs.find((x) => x.id === a.jobPostingId)!;
  return { id: a.id, jobPostingId: a.jobPostingId, jobTitle: j.title, candidateId: c.id, candidateName: `${c.firstName} ${c.lastName}`, candidateEmail: c.email, candidatePhone: c.phone, candidateCity: c.city,
    status: a.status, statusLabel: APP_STATUS_LABEL[a.status], isInternal: a.isInternal, source: a.source, assignedRecruiterName: a.assignedRecruiterName, createdAt: a.createdAt, notes: a.notes };
}
function jobList(j: any) {
  return { ...j, departmentName: dept(j.departmentId)?.name, statusLabel: j.status, applicationCount: db.applications.filter((a) => a.jobPostingId === j.id).length };
}
const PIPELINE: string[] = ['Received', 'Shortlisted', 'Tested', 'Interviewed', 'SecondInterview', 'OfferSent', 'Hired', 'Rejected', 'Withdrawn'];

// --------------------------------------------------------------------- PAIE --
function runDto(r: any) {
  const e = emp(r.employeeId)!;
  return { ...r, employeeNumber: e.employeeNumber, employeeName: fullName(e), departmentName: dept(e.departmentId)?.name, jobTitle: job(e.jobPositionId)?.title, countryCode: e.countryCode, period: `${String(r.month).padStart(2, '0')}/${r.year}` };
}

// ------------------------------------------------------------------ ROUTEUR --
type H = (m: RegExpMatchArray, q: URLSearchParams, b: any) => any;
const routes: [string, RegExp, H][] = [];
const on = (method: string, path: string, h: H) => routes.push([method, new RegExp('^' + path.replace(/:\w+/g, '([^/]+)') + '/?$'), h]);

// AUTH
on('POST', '/auth/login', (_m, _q, b) => login(b));
on('POST', '/auth/refresh-token', () => fail(401, 'Session expirée.'));
on('POST', '/auth/logout', () => ok(null, 'Déconnecté.'));

// EMPLOYEES
on('GET', '/employees', (_m, q) => listEmployees(q));
on('GET', '/employees/references', () => ok({
  departments: DEPARTMENTS.map((d) => ({ ...d, employeeCount: db.employees.filter((e) => e.departmentId === d.id && !e.isDeleted).length })),
  sites: SITES, jobPositions: JOBS.map((j) => ({ ...j, departmentName: dept(j.departmentId)?.name, currency: 'XAF' })), countries: COUNTRIES,
}));
on('GET', '/employees/alerts', (_m, q) => {
  const ahead = Number(q.get('daysAhead') || 30); const lim = ymd(new Date(Date.now() + ahead * 86400000));
  const live = db.employees.filter((e) => !e.isDeleted && !['Resigned', 'Terminated'].includes(e.status));
  return ok({
    expiringContracts: live.filter((e) => e.contractEndDate && e.contractEndDate >= today() && e.contractEndDate <= lim).map((e) => ({ id: e.id, employeeNumber: e.employeeNumber, fullName: fullName(e), contractEndDate: e.contractEndDate, daysLeft: daysLeft(e.contractEndDate), contractType: e.contractType })),
    expiringTrialPeriods: live.filter((e) => e.trialPeriodEndDate && e.trialPeriodEndDate >= today() && e.trialPeriodEndDate <= lim).map((e) => ({ id: e.id, employeeNumber: e.employeeNumber, fullName: fullName(e), trialPeriodEndDate: e.trialPeriodEndDate, daysLeft: daysLeft(e.trialPeriodEndDate), managerName: fullName(emp(e.managerId)) })),
  });
});
on('GET', '/employees/orgchart', () => ok(db.employees.filter((e) => !e.managerId && !e.isDeleted).map(orgNode)));
on('POST', '/employees', (_m, _q, b) => createEmployee(b));
on('GET', '/employees/:id', (m) => { const e = emp(m[1]); if (!e || e.isDeleted) fail(404, 'Employé introuvable.'); return ok(detail(e)); });
on('DELETE', '/employees/:id', (m) => { const e = emp(m[1]); if (!e) fail(404, 'Employé introuvable.'); e!.isDeleted = true; return ok(null, 'Employé archivé.'); });
on('GET', '/employees/:id/orgchart', (m) => ok(orgNode(emp(m[1]))));
on('GET', '/employees/:id/career-history', (m) => ok(emp(m[1])?.careerHistory ?? []));
on('POST', '/employees/:id/documents', (m, _q, b) => {
  const e = emp(m[1])!; const file = b instanceof FormData ? (b.get('file') as File) : null;
  const doc = { id: uid('doc'), documentType: (b instanceof FormData && b.get('documentType')) || 'Other', fileName: file?.name || 'document.pdf', description: 'Ajouté pendant la démo (non conservé)', fileSizeBytes: file?.size || 0, contentType: file?.type || 'application/octet-stream', isSignedElectronically: false, version: 1, createdAt: new Date().toISOString(), uploadedBy: 'Aline Mbarga' };
  e.documents.unshift(doc); return ok(doc, 'Document uploadé.');
});
on('DELETE', '/employees/:id/documents/:docId', (m) => { const e = emp(m[1])!; e.documents = e.documents.filter((x: any) => x.id !== m[2]); return ok(null, 'Document supprimé.'); });
on('POST', '/employees/:id/photo', () => fail(400, 'Les photos ne sont pas conservées dans la démo.'));
on('POST', '/employees/:id/gdpr/export', (m) => { const e = emp(m[1])!; const { documents, careerHistory, ...personal } = e; return ok({ exportedAt: new Date().toISOString(), notice: 'Export de démonstration : données fictives.', personal, documents, careerHistory, leaveRequests: db.leaveRequests.filter((l) => l.employeeId === e.id), payslips: db.payrollRuns.filter((r) => r.employeeId === e.id) }); });
on('DELETE', '/employees/:id/gdpr/anonymize', (m) => {
  const e = emp(m[1])!; if (!['Resigned', 'Terminated'].includes(e.status)) fail(400, "L'anonymisation n'est possible qu'après la fin du contrat.");
  Object.assign(e, { firstName: 'Anonyme', lastName: e.employeeNumber, personalEmail: `anonyme.${e.id}@exemple.org`, professionalEmail: `anonyme.${e.id}@exemple.org`, personalPhone: undefined, professionalPhone: undefined, address: undefined, emergencyContactName: undefined, emergencyContactPhone: undefined, dateOfBirth: '1900-01-01', nationality: undefined });
  return ok(null, 'Employé anonymisé.');
});
on('POST', '/employees/:id/mutation', (m, _q, b) => {
  const e = emp(m[1])!; const prev = site(e.siteId)?.name;
  if (b.toSiteId) { e.siteId = b.toSiteId; e.countryCode = SITES.find((s) => s.id === b.toSiteId)!.countryCode; }
  if (b.toDepartmentId) e.departmentId = b.toDepartmentId;
  e.careerHistory.unshift({ id: uid('ch'), changeType: 'Mutation', previousValue: prev, newValue: site(e.siteId)?.name, effectiveDate: b.effectiveDate || today(), comments: b.comments, createdAt: today() });
  return ok(null, 'Mutation enregistrée.');
});

// REPORTING
on('GET', '/reporting/dashboard', () => dashboard());
on('GET', '/reporting/kpis', () => kpis());

// RECRUITMENT
on('GET', '/recruitment/jobs', (_m, q) => { let l = db.jobs; if (q.get('status')) l = l.filter((j) => j.status === q.get('status')); return ok(paged(l.map(jobList), q)); });
on('GET', '/recruitment/jobs/:id', (m) => { const j = db.jobs.find((x) => x.id === m[1]); if (!j) fail(404, 'Offre introuvable.'); return ok({ ...jobList(j), applications: db.applications.filter((a) => a.jobPostingId === j!.id).map(appList) }); });
on('POST', '/recruitment/jobs/:id/publish', (m) => { const j = db.jobs.find((x) => x.id === m[1])!; j.status = 'Published'; j.publishedAt = today(); return ok(null, 'Offre publiée.'); });
on('POST', '/recruitment/jobs/:id/close', (m) => { const j = db.jobs.find((x) => x.id === m[1])!; j.status = 'Closed'; j.closedAt = today(); return ok(null, 'Offre clôturée.'); });
on('GET', '/recruitment/jobs/:id/pipeline', (m) => {
  const j = db.jobs.find((x) => x.id === m[1]); if (!j) fail(404, 'Offre introuvable.');
  const apps = db.applications.filter((a) => a.jobPostingId === j!.id);
  const columns: Record<string, any[]> = {}; const counts: Record<string, number> = {};
  for (const s of PIPELINE) { columns[s] = apps.filter((a) => a.status === s).map(appList); counts[s] = columns[s].length; }
  return ok({ jobPostingId: j!.id, jobTitle: j!.title, columns, counts });
});
on('GET', '/recruitment/candidates', (_m, q) => ok(paged(db.candidates.map((c) => ({ ...c, fullName: `${c.firstName} ${c.lastName}`, applicationCount: db.applications.filter((a) => a.candidateId === c.id).length })), q)));
on('POST', '/recruitment/candidates/:id/talent-pool', (m) => { db.candidates.find((c) => c.id === m[1])!.isInTalentPool = true; return ok(null, 'Ajouté à la CVthèque.'); });
on('DELETE', '/recruitment/candidates/:id/talent-pool', (m) => { db.candidates.find((c) => c.id === m[1])!.isInTalentPool = false; return ok(null, 'Retiré de la CVthèque.'); });
on('GET', '/recruitment/applications', (_m, q) => { let l = db.applications; if (q.get('jobPostingId')) l = l.filter((a) => a.jobPostingId === q.get('jobPostingId')); return ok(paged(l.map(appList), q)); });
on('PUT', '/recruitment/applications/:id', (m, _q, b) => {
  const a = db.applications.find((x) => x.id === m[1]); if (!a) fail(404, 'Candidature introuvable.');
  const old = a!.status; if (b.status) a!.status = b.status; if (b.status === 'Hired') a!.hiredAt = today();
  const c = db.candidates.find((x) => x.id === a!.candidateId)!;
  const mail: Record<string, string> = { Shortlisted: 'Félicitations ! Votre candidature a été présélectionnée.', Interviewed: 'Votre entretien a été programmé.', OfferSent: 'Nous sommes heureux de vous faire une offre !', Hired: "Bienvenue dans l'équipe !", Rejected: 'Après étude de votre candidature, nous ne donnons pas suite.' };
  const msg = b.status && b.status !== old ? `Candidature mise à jour. E-mail simulé à ${c.email} : « ${mail[b.status] || 'Votre candidature a été mise à jour.'} »` : 'Candidature mise à jour.';
  return ok(appList(a), msg);
});
on('POST', '/recruitment/applications/:id/notes', (m, _q, b) => { const a = db.applications.find((x) => x.id === m[1])!; const n = { id: uid('n'), content: b.content, isPrivate: !!b.isPrivate, authorId: CURRENT_EMPLOYEE_ID, authorName: 'Aline Mbarga', createdAt: new Date().toISOString() }; a.notes.push(n); return ok(n, 'Note ajoutée.'); });
on('GET', '/recruitment/analytics', () => {
  const byStatus: Record<string, number> = {}; const bySource: Record<string, number> = {};
  for (const a of db.applications) { byStatus[a.status] = (byStatus[a.status] || 0) + 1; bySource[a.source] = (bySource[a.source] || 0) + 1; }
  return ok({ totalJobPostings: db.jobs.length, activeJobPostings: db.jobs.filter((j) => j.status === 'Published').length, totalCandidates: db.candidates.length, talentPoolSize: db.candidates.filter((c) => c.isInTalentPool).length, totalApplications: db.applications.length, applicationsByStatus: byStatus, applicationsBySource: bySource });
});

// PAYROLL
on('GET', '/payroll/runs', (_m, q) => {
  let l = db.payrollRuns; if (q.get('year')) l = l.filter((r) => r.year === Number(q.get('year'))); if (q.get('month')) l = l.filter((r) => r.month === Number(q.get('month')));
  if (q.get('status')) l = l.filter((r) => r.status === q.get('status'));
  l = [...l].sort((a, b) => b.year - a.year || b.month - a.month || fullName(emp(a.employeeId)).localeCompare(fullName(emp(b.employeeId))));
  return ok(paged(l.map(runDto), q));
});
on('GET', '/payroll/runs/:id', (m) => { const r = db.payrollRuns.find((x) => x.id === m[1]); if (!r) fail(404, 'Paie introuvable.'); return ok(runDto(r)); });
on('POST', '/payroll/runs/calculate', (_m, _q, b) => {
  const year = Number(b.year), month = Number(b.month);
  if (db.payrollRuns.some((r) => r.employeeId === b.employeeId && r.year === year && r.month === month)) fail(400, 'La paie existe déjà pour cette période.');
  const e = emp(b.employeeId); if (!e) fail(404, 'Employé introuvable.');
  const bonusTotal = db.bonuses.filter((x) => x.employeeId === e!.id && x.isValidated && new Date(x.effectiveDate).getFullYear() === year && new Date(x.effectiveDate).getMonth() + 1 === month).reduce((s, x) => s + x.amount, 0);
  const r = { id: uid('pr'), employeeId: e!.id, year, month, ...calculatePayroll(e!.baseSalary, bonusTotal, e!.countryCode), currency: e!.currency, status: 'Draft', createdAt: new Date().toISOString() };
  db.payrollRuns.push(r); return ok(runDto(r), 'Paie calculée.');
});
on('POST', '/payroll/runs/:id/validate', (m) => { const r = db.payrollRuns.find((x) => x.id === m[1]); if (!r) fail(404, 'Paie introuvable.'); r!.status = 'Validated'; return ok(null, 'Paie validée.'); });
on('POST', '/payroll/runs/:id/pay', (m) => {
  const r = db.payrollRuns.find((x) => x.id === m[1]); if (!r) fail(404, 'Paie introuvable.');
  if (r!.status !== 'Validated') fail(400, 'La paie doit être validée avant paiement.');
  r!.status = 'Paid'; r!.paidAt = new Date().toISOString(); return ok(null, `Paiement enregistré. E-mail simulé envoyé à ${emp(r!.employeeId)!.professionalEmail}.`);
});
on('DELETE', '/payroll/runs/:id', (m) => { const r = db.payrollRuns.find((x) => x.id === m[1]); if (!r) fail(404, 'Paie introuvable.'); if (r!.status === 'Paid') fail(400, 'Impossible de supprimer une paie déjà payée.'); db.payrollRuns = db.payrollRuns.filter((x) => x !== r); return ok(null, 'Paie supprimée.'); });
on('GET', '/payroll/bonuses', () => ok(db.bonuses.map((b) => ({ ...b, employeeName: fullName(emp(b.employeeId)) }))));
on('POST', '/payroll/bonuses/:id/validate', (m) => { db.bonuses.find((x) => x.id === m[1])!.isValidated = true; return ok(null, 'Prime validée.'); });
on('GET', '/payroll/expenses', () => ok(db.expenses.map((x) => ({ ...x, employeeName: fullName(emp(x.employeeId)) }))));
const expense = (id: string) => { const x = db.expenses.find((e) => e.id === id); if (!x) fail(404, 'Note de frais introuvable.'); return x!; };
on('POST', '/payroll/expenses/:id/submit', (m) => { const x = expense(m[1]); if (!x.lines.length) fail(400, 'Ajoutez au moins une ligne de dépense.'); x.status = 'Submitted'; x.submittedAt = today(); return ok(null, 'Note de frais soumise.'); });
on('POST', '/payroll/expenses/:id/approve-manager', (m) => { const x = expense(m[1]); x.status = 'ApprovedByManager'; x.managerApprovedAt = today(); return ok(null, 'Approuvée par le manager.'); });
on('POST', '/payroll/expenses/:id/approve-hr', (m) => { const x = expense(m[1]); x.status = 'ApprovedByHR'; x.hrApprovedAt = today(); return ok(null, 'Approuvée par RH.'); });
on('POST', '/payroll/expenses/:id/reimburse', (m) => { const x = expense(m[1]); if (x.status !== 'ApprovedByHR') fail(400, 'La note doit être approuvée avant remboursement.'); x.status = 'Reimbursed'; x.reimbursedAt = today(); return ok(null, 'Remboursement effectué.'); });
on('POST', '/payroll/expenses/:id/reject', (m) => { const x = expense(m[1]); x.status = 'Rejected'; return ok(null, 'Note de frais rejetée.'); });

// ATTENDANCE
const activeEntry = (eid: string) => db.timeEntries.find((t) => t.employeeId === eid && !t.clockOut);
on('POST', '/attendance/clock-in', (_m, _q, b) => {
  if (activeEntry(CURRENT_EMPLOYEE_ID)) fail(400, "Vous avez déjà un pointage en cours. Veuillez d'abord badger à la sortie.");
  const t = { id: uid('te'), employeeId: CURRENT_EMPLOYEE_ID, clockIn: new Date().toISOString(), totalHours: 0, isRemote: !!b?.isRemote, location: b?.location || 'Douala', status: 'InProgress', source: 'Virtual' };
  db.timeEntries.push(t); return ok(t, "Pointage d'entrée enregistré.");
});
on('POST', '/attendance/clock-out', () => {
  const t = activeEntry(CURRENT_EMPLOYEE_ID); if (!t) fail(400, 'Aucun pointage en cours trouvé.');
  t!.clockOut = new Date().toISOString(); t!.totalHours = round2((Date.parse(t!.clockOut) - Date.parse(t!.clockIn)) / 3600000); t!.status = 'Completed';
  const e = emp(CURRENT_EMPLOYEE_ID)!; const since = Date.now() - 7 * 86400000;
  const found = detectOvertime(db.timeEntries.filter((x) => x.employeeId === e.id && x.clockOut && Date.parse(x.clockIn) >= since), e.baseSalary, e.countryCode).filter((o) => o.date === t!.clockIn.slice(0, 10));
  for (const o of found) db.overtimes.push({ id: uid('ot'), employeeId: e.id, ...o, currency: e.currency, isApproved: false, isCompensated: false });
  return ok(t, `Pointage de sortie enregistré${found.length ? ' : heures supplémentaires détectées.' : '.'}`);
});
on('GET', '/attendance/time-entries', (_m, q) => { const eid = q.get('employeeId') || CURRENT_EMPLOYEE_ID; return ok(db.timeEntries.filter((t) => t.employeeId === eid).sort((a, b) => b.clockIn.localeCompare(a.clockIn))); });
on('GET', '/attendance/leave-requests', (_m, q) => {
  let l = db.leaveRequests; if (q.get('status')) l = l.filter((x) => x.status === q.get('status'));
  return ok(paged([...l].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((x) => ({ ...x, employeeName: fullName(emp(x.employeeId)) })), q));
});
on('POST', '/attendance/leave-requests', (_m, _q, b) => {
  const eid = b.employeeId || CURRENT_EMPLOYEE_ID; const e = emp(eid); if (!e) fail(404, 'Employé introuvable.');
  if (!b.startDate || !b.endDate || b.endDate < b.startDate) fail(400, 'Les dates de début et de fin sont invalides.');
  const days = workingDays(b.startDate, b.endDate, e!.countryCode);
  let bal = db.leaveBalances.find((x) => x.employeeId === eid && x.type === b.type && x.year === new Date().getFullYear());
  if (!bal) { bal = { employeeId: eid, type: b.type, year: new Date().getFullYear(), totalDays: initialLeaveBalances(e!.countryCode, e!.contractType, e!.hireDate)[b.type] ?? 0, usedDays: 0 }; db.leaveBalances.push(bal); }
  const remaining = bal.totalDays - bal.usedDays;
  if (remaining < days) fail(400, `Solde insuffisant. Disponible : ${remaining} jours.`);
  const r = { id: uid('lr'), employeeId: eid, type: b.type, startDate: b.startDate, endDate: b.endDate, daysCount: days, status: 'Pending', reason: b.reason, createdAt: new Date().toISOString() };
  db.leaveRequests.push(r);
  const mgr = emp(e!.managerId);
  return ok({ ...r, employeeName: fullName(e) }, `Demande de congés créée (${days} jour${days > 1 ? 's' : ''} ouvré${days > 1 ? 's' : ''}).${mgr ? ` E-mail simulé à ${mgr.professionalEmail}.` : ''}`);
});
on('POST', '/attendance/leave-requests/:id/approve', (m) => {
  const r = db.leaveRequests.find((x) => x.id === m[1]); if (!r) fail(404, 'Demande introuvable.');
  r!.status = 'Approved'; r!.approvedAt = new Date().toISOString(); r!.approvedById = CURRENT_EMPLOYEE_ID;
  const bal = db.leaveBalances.find((x) => x.employeeId === r!.employeeId && x.type === r!.type && x.year === new Date().getFullYear()); if (bal) bal.usedDays += r!.daysCount;
  return ok(null, 'Congés approuvés.');
});
on('POST', '/attendance/leave-requests/:id/reject', (m, _q, b) => { const r = db.leaveRequests.find((x) => x.id === m[1]); if (!r) fail(404, 'Demande introuvable.'); r!.status = 'Rejected'; r!.rejectionReason = typeof b === 'string' ? b : b?.reason; return ok(null, 'Congés refusés.'); });
on('GET', '/attendance/leave-balance/:id', (m) => ok(db.leaveBalances.filter((x) => x.employeeId === m[1]).map((x) => ({ ...x, remainingDays: x.totalDays - x.usedDays }))));
on('GET', '/attendance/overtime', () => ok(db.overtimes.map((o) => ({ ...o, employeeName: fullName(emp(o.employeeId)) })).sort((a, b) => b.date.localeCompare(a.date))));
on('POST', '/attendance/overtime/:id/approve', (m) => { db.overtimes.find((o) => o.id === m[1])!.isApproved = true; return ok(null, 'Heures supplémentaires approuvées.'); });

// TRAINING
const sessionDto = (s: any) => ({ ...s, courseTitle: db.courses.find((c) => c.id === s.courseId)!.title, enrolledCount: db.enrollments.filter((e) => e.sessionId === s.id && e.status !== 'Cancelled').length });
on('GET', '/training/courses', () => ok(db.courses.map((c) => ({ ...c, sessionCount: db.sessions.filter((s) => s.courseId === c.id).length, enrollmentCount: db.enrollments.filter((e) => db.sessions.find((s) => s.id === e.sessionId)!.courseId === c.id).length }))));
on('GET', '/training/sessions', () => ok(db.sessions.map(sessionDto).sort((a, b) => a.startDate.localeCompare(b.startDate))));
on('GET', '/training/enrollments', (_m, q) => { let l = db.enrollments; if (q.get('sessionId')) l = l.filter((e) => e.sessionId === q.get('sessionId')); return ok(l.map((e) => ({ ...e, employeeName: fullName(emp(e.employeeId)), courseTitle: sessionDto(db.sessions.find((s) => s.id === e.sessionId)).courseTitle }))); });
on('POST', '/training/enrollments', (_m, _q, b) => {
  const s = db.sessions.find((x) => x.id === b.sessionId); if (!s) fail(404, 'Session introuvable.');
  if (db.enrollments.some((e) => e.sessionId === b.sessionId && e.employeeId === b.employeeId)) fail(400, 'Ce collaborateur est déjà inscrit à cette session.');
  const en = { id: uid('en'), sessionId: b.sessionId, employeeId: b.employeeId, status: 'Registered', progress: 0, enrolledAt: today() }; db.enrollments.push(en);
  return ok(en, `Inscription créée. E-mail simulé à ${emp(b.employeeId)?.professionalEmail}.`);
});
on('GET', '/training/certifications/expiring', (_m, q) => { const lim = ymd(new Date(Date.now() + Number(q.get('daysAhead') || 60) * 86400000)); return ok(db.certifications.filter((c) => c.expiryDate && c.expiryDate <= lim).map((c) => ({ ...c, employeeName: fullName(emp(c.employeeId)), isExpired: c.expiryDate < today() }))); });
on('GET', '/training/certifications/:id', (m) => ok(db.certifications.filter((c) => c.employeeId === m[1])));

// PERFORMANCE
const objDto = (o: any) => { const krs = o.keyResults.map((k: any) => ({ ...k, progress: Math.min(100, Math.round((k.current / k.target) * 100)) })); return { ...o, employeeName: fullName(emp(o.employeeId)), keyResults: krs, progress: krs.length ? Math.round(krs.reduce((s: number, k: any) => s + k.progress, 0) / krs.length) : 0 }; };
on('GET', '/performance/reviews', () => ok(db.reviews.map((r) => ({ ...r, employeeName: fullName(emp(r.employeeId)), reviewerName: fullName(emp(r.reviewerId)) }))));
on('GET', '/performance/objectives', () => ok(db.objectives.map(objDto)));
on('PUT', '/performance/objectives/:id', (m, _q, b) => {
  const o = db.objectives.find((x) => x.id === m[1]); if (!o) fail(404, 'Objectif introuvable.');
  if (b.status) o!.status = b.status;
  for (const [k, v] of Object.entries(b.keyResultsProgress || {})) { const kr = o!.keyResults.find((x: any) => x.id === k); if (kr) kr.current = Number(v); }
  return ok(objDto(o), 'Objectif mis à jour.');
});
on('GET', '/performance/feedback', () => ok(db.feedbacks.map((f) => ({ ...f, fromName: fullName(emp(f.fromId)), toName: fullName(emp(f.toId)) }))));
on('POST', '/performance/feedback', (_m, _q, b) => { const f = { id: uid('fb'), fromId: CURRENT_EMPLOYEE_ID, toId: b.toId, type: b.type, content: b.content, createdAt: new Date().toISOString() }; db.feedbacks.unshift(f); return ok(f, 'Feedback envoyé.'); });

// ONBOARDING
const planDto = (p: any) => { const tasks = db.onbTasks.filter((t) => t.planId === p.id).sort((a, b) => a.sortOrder - b.sortOrder); const e = emp(p.employeeId)!; return { ...p, employeeName: fullName(e), jobTitle: job(e.jobPositionId)?.title, buddyName: fullName(emp(p.buddyId)), tasks, completedTasks: tasks.filter((t) => t.isCompleted).length, totalTasks: tasks.length }; };
on('GET', '/onboarding/plans', () => ok(db.plans.map(planDto)));
on('POST', '/onboarding/plans', (_m, _q, b) => {
  const e = emp(b.employeeId); if (!e) fail(404, 'Employé introuvable.');
  if (db.plans.some((p) => p.employeeId === b.employeeId)) fail(400, 'Un plan d\'intégration existe déjà pour ce collaborateur.');
  const planId = uid('pl'); const base = new Date(e!.hireDate), trial = e!.trialPeriodEndDate ? new Date(e!.trialPeriodEndDate) : null;
  onboardingTasks(job(e!.jobPositionId)!.title, !!trial).forEach((t, i) => { const due = new Date(t.fromTrialEnd && trial ? trial : base); due.setDate(due.getDate() + t.dueOffset); db.onbTasks.push({ id: uid('ot'), planId, title: t.title, description: t.description, category: t.category, priority: t.priority, dueDate: ymd(due), isRequired: t.priority === 'High', isCompleted: false, sortOrder: i + 1 }); });
  db.plans.push({ id: planId, employeeId: e!.id, buddyId: b.buddyId, startDate: e!.hireDate, trialPeriodEndDate: e!.trialPeriodEndDate, welcomeDocuments: WELCOME_DOCUMENTS.map((w) => ({ id: uid('wd'), ...w, isSigned: false })), createdAt: new Date().toISOString() });
  return ok(planDto(db.plans[db.plans.length - 1]), "Plan d'intégration généré depuis le modèle.");
});
on('POST', '/onboarding/tasks/:id/complete', (m) => { const t = db.onbTasks.find((x) => x.id === m[1]); if (!t) fail(404, 'Tâche introuvable.'); t!.isCompleted = !t!.isCompleted; return ok(t, t!.isCompleted ? 'Tâche terminée.' : 'Tâche rouverte.'); });
on('POST', '/onboarding/documents/:id/sign', (m) => { for (const p of db.plans) { const w = p.welcomeDocuments.find((x: any) => x.id === m[1]); if (w) { w.isSigned = true; w.signedAt = today(); } } return ok(null, 'Document signé électroniquement (simulation).'); });

// TESTS
const ctDto = (t: any) => { const tpl = db.testTemplates.find((x) => x.id === t.templateId)!; const a = appList(db.applications.find((x) => x.id === t.applicationId)); return { ...t, testTitle: tpl.title, testType: tpl.type, passingScore: tpl.passingScore, totalQuestions: tpl.questionCount, candidateName: a.candidateName, jobTitle: a.jobTitle }; };
on('GET', '/tests/templates', () => ok(db.testTemplates.map((t) => ({ ...t, assignedCount: db.candidateTests.filter((c) => c.templateId === t.id).length }))));
on('GET', '/tests/candidate-tests', () => ok(db.candidateTests.map(ctDto)));
on('POST', '/tests/candidate-tests', (_m, _q, b) => { const t = { id: uid('ct'), templateId: b.templateId, applicationId: b.applicationId, status: 'Sent', sentAt: today() }; db.candidateTests.push(t); return ok(ctDto(t), 'Test envoyé au candidat (e-mail simulé).'); });
on('POST', '/tests/candidate-tests/:id/complete', (m) => {
  const t = db.candidateTests.find((x) => x.id === m[1]); if (!t) fail(404, 'Test introuvable.');
  if (t!.status !== 'InProgress') fail(400, "Le test n'est pas en cours.");
  const tpl = db.testTemplates.find((x) => x.id === t!.templateId)!;
  t!.status = 'Completed'; t!.completedAt = today();
  if (tpl.autoScore) { t!.score = Math.round(((t!.correctAnswers ?? 0) / tpl.questionCount) * 100); t!.passed = t!.score >= tpl.passingScore; }
  return ok(ctDto(t), 'Test complété.');
});

// INTERVIEWS
const ivDto = (i: any) => { const a = appList(db.applications.find((x) => x.id === i.applicationId)); return { ...i, candidateName: a.candidateName, jobTitle: a.jobTitle, interviewers: i.interviewerIds.map((x: string) => fullName(emp(x))), feedbacks: i.feedbacks.map((f: any) => ({ ...f, interviewerName: fullName(emp(f.interviewerId)) })) }; };
on('GET', '/interviews', () => ok(db.interviews.map(ivDto).sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))));
on('POST', '/interviews', (_m, _q, b) => {
  const a = db.applications.find((x) => x.id === b.applicationId); if (!a) fail(404, 'Candidature introuvable.');
  const i: any = { id: uid('iv'), applicationId: b.applicationId, type: b.type, scheduledDate: b.scheduledDate, durationMinutes: Number(b.durationMinutes) || 45, isOnline: !!b.isOnline, location: b.isOnline ? undefined : b.location, status: 'Scheduled', interviewerIds: b.interviewerIds || [], feedbacks: [] };
  if (i.isOnline) i.onlineMeetingId = Math.random().toString(36).slice(2, 12).toUpperCase();
  db.interviews.push(i); return ok(ivDto(i), 'Entretien créé. Invitation simulée envoyée au candidat.');
});
on('POST', '/interviews/:id/complete', (m) => { const i = db.interviews.find((x) => x.id === m[1])!; i.status = 'Completed'; return ok(null, 'Entretien terminé.'); });
on('POST', '/interviews/:id/cancel', (m) => { const i = db.interviews.find((x) => x.id === m[1])!; i.status = 'Cancelled'; return ok(null, 'Entretien annulé.'); });

// ---------------------------------------------------------------- DISPATCH ---
export function handle(method: string, path: string, query: URLSearchParams, body: any): { status: number; data: any } {
  for (const [m, re, h] of routes) {
    if (m !== method) continue;
    const match = path.match(re);
    if (match) {
      try { return { status: 200, data: h(match, query, body) }; }
      catch (e) { if (e instanceof HttpError) return { status: e.status, data: { success: false, message: e.message } }; throw e; }
    }
  }
  return { status: 404, data: { success: false, message: `Route non simulée dans la démo : ${method} ${path}` } };
}

export function resetDemo() { db = buildDb(); }
