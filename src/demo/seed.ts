// =============================================================================
// Jeu de données 100 % fictif de la démo Talentis.
// Société, personnes, e-mails (@exemple.org) et téléphones sont inventés.
// Les dates sont calculées par rapport au jour de consultation.
// =============================================================================
import { calculatePayroll, detectOvertime, initialLeaveBalances, onboardingTasks, round2, ymd, WELCOME_DOCUMENTS, workingDays } from './rules';

const today = new Date();
const d = (offset: number) => { const x = new Date(today); x.setDate(x.getDate() + offset); return ymd(x); };
const iso = (offset: number, h = 9, m = 0) => { const x = new Date(today); x.setDate(x.getDate() + offset); x.setHours(h, m, 0, 0); return x.toISOString(); };
let seq = 0;
export const uid = (p: string) => `${p}-${(++seq).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const COMPANY = { id: 'co-1', name: 'Kalao Industries', legalName: 'Kalao Industries SA (société fictive)' };

export const COUNTRIES = [
  { id: 'cm', code: 'CM', name: 'Cameroun', currency: 'XAF', timeZone: 'Africa/Douala', phonePrefix: '+237' },
  { id: 'ci', code: 'CI', name: "Côte d'Ivoire", currency: 'XOF', timeZone: 'Africa/Abidjan', phonePrefix: '+225' },
  { id: 'fr', code: 'FR', name: 'France', currency: 'EUR', timeZone: 'Europe/Paris', phonePrefix: '+33' },
];

export const SITES = [
  { id: 's-dla', name: 'Siège · Douala Bonapriso', city: 'Douala', countryCode: 'CM', isHeadquarters: true },
  { id: 's-yde', name: 'Agence Yaoundé', city: 'Yaoundé', countryCode: 'CM', isHeadquarters: false },
  { id: 's-abj', name: 'Filiale Abidjan Plateau', city: 'Abidjan', countryCode: 'CI', isHeadquarters: false },
  { id: 's-par', name: 'Bureau Paris', city: 'Paris', countryCode: 'FR', isHeadquarters: false },
];

export const DEPARTMENTS = [
  { id: 'dir', name: 'Direction Générale', code: 'DIR' },
  { id: 'rh', name: 'Ressources Humaines', code: 'RH' },
  { id: 'fin', name: 'Finance & Comptabilité', code: 'FIN' },
  { id: 'it', name: 'Informatique', code: 'DSI' },
  { id: 'com', name: 'Commercial', code: 'COM' },
  { id: 'log', name: 'Logistique', code: 'LOG' },
  { id: 'prod', name: 'Production', code: 'PROD' },
];

export const JOBS = [
  ['j-dg', 'Directeur général', 'dir'], ['j-drh', 'Responsable RH', 'rh'], ['j-crh', 'Chargé(e) RH', 'rh'], ['j-rec', 'Recruteur(se)', 'rh'],
  ['j-daf', 'Directeur financier', 'fin'], ['j-cpt', 'Comptable', 'fin'], ['j-cg', 'Contrôleur de gestion', 'fin'],
  ['j-dsi', 'Responsable informatique', 'it'], ['j-dev', 'Développeur full stack', 'it'], ['j-sys', 'Administrateur systèmes', 'it'], ['j-data', 'Analyste de données', 'it'],
  ['j-dcom', 'Directeur commercial', 'com'], ['j-com', 'Commercial terrain', 'com'], ['j-cc', 'Chargé(e) de clientèle', 'com'],
  ['j-rlog', 'Responsable logistique', 'log'], ['j-mag', 'Magasinier', 'log'], ['j-chf', 'Chauffeur-livreur', 'log'],
  ['j-cp', 'Chef de production', 'prod'], ['j-op', 'Opérateur de production', 'prod'], ['j-qhse', 'Technicien QHSE', 'prod'],
].map(([id, title, departmentId]) => ({ id, title, departmentId, code: id.toUpperCase().replace('J-', '') }));

const SITE_COUNTRY: Record<string, string> = { 's-dla': 'CM', 's-yde': 'CM', 's-abj': 'CI', 's-par': 'FR' };
const CURRENCY: Record<string, string> = { CM: 'XAF', CI: 'XOF', FR: 'EUR' };

// [id, prénom, nom, genre, poste, site, contrat, statut, embauche, salaire, manager, mode, extra]
type Row = [string, string, string, 'Male' | 'Female', string, string, string, string, string, number, string | null, string, Record<string, any>?];
const ROWS: Row[] = [
  ['e1', 'Samuel', 'Ekwalla', 'Male', 'j-dg', 's-dla', 'CDI', 'Active', '2016-03-01', 4500000, null, 'OnSite'],
  ['e2', 'Aline', 'Mbarga', 'Female', 'j-drh', 's-dla', 'CDI', 'Active', '2018-09-03', 2100000, 'e1', 'Hybrid', { remoteDaysPerWeek: 1 }],
  ['e3', 'Patrice', 'Fotso', 'Male', 'j-crh', 's-dla', 'CDI', 'Active', '2021-02-15', 850000, 'e2', 'OnSite'],
  ['e4', 'Clarisse', 'Etoa', 'Female', 'j-rec', 's-yde', 'CDD', 'Active', d(-345), 700000, 'e2', 'OnSite', { contractEndDate: d(40) }],
  ['e5', 'Bertrand', 'Kamga', 'Male', 'j-daf', 's-dla', 'CDI', 'Active', '2017-06-12', 3200000, 'e1', 'OnSite'],
  ['e6', 'Josiane', 'Abena', 'Female', 'j-cpt', 's-dla', 'CDI', 'Active', '2019-01-07', 950000, 'e5', 'OnSite'],
  ['e7', 'Hervé', 'Manga', 'Male', 'j-cg', 's-yde', 'CDI', 'OnLeave', '2022-04-04', 1250000, 'e5', 'OnSite'],
  ['e8', 'Rodrigue', 'Tchinda', 'Male', 'j-dsi', 's-dla', 'CDI', 'Active', '2018-02-01', 2400000, 'e1', 'Hybrid', { remoteDaysPerWeek: 2 }],
  ['e9', 'Linda', 'Mvondo', 'Female', 'j-dev', 's-dla', 'CDI', 'Active', '2023-07-10', 1100000, 'e8', 'Hybrid', { remoteDaysPerWeek: 2 }],
  ['e10', 'Yannick', 'Nana', 'Male', 'j-dev', 's-dla', 'CDI', 'TrialPeriod', d(-50), 1000000, 'e8', 'Hybrid', { trialPeriodEndDate: d(25), remoteDaysPerWeek: 1 }],
  ['e11', 'Serge', 'Ondoa', 'Male', 'j-sys', 's-yde', 'CDI', 'Active', '2020-10-05', 1050000, 'e8', 'OnSite'],
  ['e12', 'Aïcha', 'Bello', 'Female', 'j-data', 's-dla', 'Internship', 'Active', d(-90), 150000, 'e8', 'OnSite', { contractEndDate: d(20) }],
  ['e13', 'Koffi', 'Yao', 'Male', 'j-dcom', 's-abj', 'CDI', 'Active', '2019-05-20', 2600000, 'e1', 'OnSite'],
  ['e14', 'Adjoua', 'Kouassi', 'Female', 'j-com', 's-abj', 'CDI', 'Active', '2022-01-10', 650000, 'e13', 'OnSite'],
  ['e15', 'Junior', 'Essomba', 'Male', 'j-com', 's-dla', 'CDD', 'Active', d(-310), 450000, 'e13', 'OnSite', { contractEndDate: d(55) }],
  ['e16', 'Hélène', 'Marchal', 'Female', 'j-cc', 's-par', 'CDI', 'Active', '2021-09-01', 3400, 'e13', 'Hybrid', { remoteDaysPerWeek: 2 }],
  ['e17', 'Thomas', 'Lefort', 'Male', 'j-cc', 's-par', 'PartTime', 'Active', '2024-03-04', 1900, 'e13', 'Remote', { weeklyHours: 24 }],
  ['e18', 'Emmanuel', 'Atangana', 'Male', 'j-rlog', 's-dla', 'CDI', 'Active', '2017-11-13', 1600000, 'e1', 'OnSite'],
  ['e19', 'Paul', 'Biyong', 'Male', 'j-mag', 's-dla', 'CDI', 'Active', '2020-06-01', 320000, 'e18', 'OnSite'],
  ['e20', 'Martin', 'Ndjock', 'Male', 'j-chf', 's-dla', 'Interim', 'Active', d(-100), 280000, 'e18', 'OnSite', { contractEndDate: d(10) }],
  ['e21', 'Esther', 'Ngono', 'Female', 'j-cp', 's-dla', 'CDI', 'Active', '2016-08-22', 1450000, 'e1', 'OnSite'],
  ['e22', 'Roger', 'Mbida', 'Male', 'j-op', 's-dla', 'CDI', 'Active', '2019-03-11', 300000, 'e21', 'OnSite'],
  ['e23', 'Sandrine', 'Mballa', 'Female', 'j-op', 's-dla', 'Apprenticeship', 'Active', d(-410), 180000, 'e21', 'OnSite', { contractEndDate: d(320) }],
  ['e24', 'Franck', 'Eyenga', 'Male', 'j-qhse', 's-dla', 'CDI', 'Active', '2021-11-15', 600000, 'e21', 'OnSite'],
  ['e25', 'Cyrille', 'Zang', 'Male', 'j-cpt', 's-dla', 'CDI', 'Resigned', '2020-01-06', 900000, 'e5', 'OnSite', { contractEndDate: d(-6) }],
  ['e26', 'Brice', 'Owona', 'Male', 'j-op', 's-dla', 'CDI', 'Terminated', '2018-05-14', 290000, 'e21', 'OnSite', { contractEndDate: d(-75) }],
  ['e27', 'Nadège', 'Fouda', 'Female', 'j-crh', 's-yde', 'CDI', 'TrialPeriod', d(-6), 800000, 'e2', 'OnSite', { trialPeriodEndDate: d(54) }],
];

const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
const phone = (i: number) => `6${(70 + (i * 7) % 29).toString().padStart(2, '0')} ${(100 + (i * 137) % 899).toString()} ${(100 + (i * 251) % 899).toString()}`;
const CITY: Record<string, string> = { 's-dla': 'Douala', 's-yde': 'Yaoundé', 's-abj': 'Abidjan', 's-par': 'Paris' };

export function buildDb() {
  seq = 0;
  const employees: any[] = ROWS.map((r, i) => {
    const [id, firstName, lastName, gender, jobId, siteId, contractType, status, hireDate, baseSalary, managerId, workMode, extra = {}] = r;
    const job = JOBS.find((j) => j.id === jobId)!;
    const cc = SITE_COUNTRY[siteId];
    return {
      id, employeeNumber: `KAL${String(i + 1).padStart(5, '0')}`, firstName, lastName, gender,
      dateOfBirth: `${1972 + (i * 3) % 28}-${String(1 + (i * 5) % 12).padStart(2, '0')}-${String(1 + (i * 11) % 27).padStart(2, '0')}`,
      nationality: cc === 'FR' ? 'Française' : cc === 'CI' ? 'Ivoirienne' : 'Camerounaise',
      personalEmail: `${slug(firstName)}.${slug(lastName)}.perso@exemple.org`,
      professionalEmail: `${slug(firstName)}.${slug(lastName)}@exemple.org`,
      personalPhone: phone(i + 1), professionalPhone: phone(i + 41),
      address: `${10 + i} rue des Manguiers (fictive)`, city: CITY[siteId], postalCode: cc === 'FR' ? '75011' : undefined,
      emergencyContactName: 'Contact fictif', emergencyContactPhone: phone(i + 83), emergencyContactRelation: i % 2 ? 'Conjoint(e)' : 'Frère / sœur',
      status, contractType, hireDate, weeklyHours: extra.weeklyHours ?? (cc === 'FR' ? 35 : 40), workMode,
      remoteDaysPerWeek: extra.remoteDaysPerWeek, trialPeriodEndDate: extra.trialPeriodEndDate, contractEndDate: extra.contractEndDate,
      baseSalary, currency: CURRENCY[cc], payrollFrequency: 'Monthly',
      siteId, departmentId: job.departmentId, jobPositionId: jobId, managerId: managerId ?? undefined, countryCode: cc,
      preferredLanguage: 'fr', gdprConsentGiven: i % 9 !== 4, gdprConsentDate: hireDate,
      bio: undefined, linkedInUrl: undefined, photoUrl: undefined, isDeleted: false,
      createdAt: hireDate + 'T08:00:00Z',
      documents: [
        { id: uid('doc'), documentType: 'Contract', fileName: `contrat_${slug(lastName)}.pdf`, description: `Contrat ${contractType}`, fileSizeBytes: 182000 + i * 911, contentType: 'application/pdf', isSignedElectronically: true, signedAt: hireDate, version: 1, createdAt: hireDate, uploadedBy: 'Aline Mbarga' },
        ...(i % 3 === 0 ? [{ id: uid('doc'), documentType: 'IDCard', fileName: `cni_${slug(lastName)}.pdf`, description: "Pièce d'identité", fileSizeBytes: 98000, contentType: 'application/pdf', expiryDate: i % 2 ? d(-20) : d(400), isSignedElectronically: false, version: 1, createdAt: hireDate, uploadedBy: 'Patrice Fotso' }] : []),
        ...(i % 4 === 1 ? [{ id: uid('doc'), documentType: 'Diploma', fileName: `diplome_${slug(lastName)}.pdf`, fileSizeBytes: 240000, contentType: 'application/pdf', isSignedElectronically: false, version: 1, createdAt: hireDate, uploadedBy: 'Patrice Fotso' }] : []),
      ],
      careerHistory: [
        { id: uid('ch'), changeType: 'Embauche', newValue: job.title, effectiveDate: hireDate, comments: `Contrat ${contractType}`, createdAt: hireDate },
      ],
    };
  });
  // Quelques évolutions de carrière
  const promo = (eid: string, date: string, prev: string, next: string, comment: string, type = 'Promotion') =>
    employees.find((e) => e.id === eid)!.careerHistory.unshift({ id: uid('ch'), changeType: type, previousValue: prev, newValue: next, effectiveDate: date, comments: comment, createdAt: date });
  promo('e2', '2021-01-01', 'Chargée RH', 'Responsable RH', 'Nomination suite au départ du précédent responsable');
  promo('e8', '2020-07-01', 'Développeur senior', 'Responsable informatique', 'Création de la DSI');
  promo('e11', '2023-03-01', 'Agence Douala', 'Agence Yaoundé', 'Mutation à la demande du collaborateur', 'Mutation de site');
  promo('e21', '2019-09-01', 'Opératrice de production', 'Chef de production', 'Promotion interne');
  promo('e6', d(-200), '820 000 XAF', '950 000 XAF', 'Révision salariale annuelle', 'Augmentation');

  // ------------------------------------------------------------ RECRUTEMENT
  const jobs: any[] = [
    { id: 'jb1', title: 'Développeur(se) back-end .NET', departmentId: 'it', location: 'Douala', contractType: 'CDI', postingType: 'External', status: 'Published', isRemote: false, salaryMin: 900000, salaryMax: 1400000, currency: 'XAF', displaySalary: true, viewCount: 412, publishedAt: d(-24), closingDate: d(21), createdAt: d(-26),
      description: "Au sein de la DSI, vous concevez et maintenez les API du SIRH interne (ASP.NET Core, PostgreSQL).", requirements: "3 ans d'expérience en C#, EF Core, tests automatisés. Anglais technique.", benefits: 'Mutuelle, télétravail 2 j/semaine, budget formation.' },
    { id: 'jb2', title: 'Commercial(e) B2B', departmentId: 'com', location: 'Abidjan', contractType: 'CDI', postingType: 'Both', status: 'Published', isRemote: false, salaryMin: 500000, salaryMax: 800000, currency: 'XOF', displaySalary: false, viewCount: 233, publishedAt: d(-15), closingDate: d(30), createdAt: d(-16),
      description: 'Développer le portefeuille de clients industriels en Côte d\'Ivoire.', requirements: 'Expérience terrain, permis B, maîtrise des outils CRM.', benefits: 'Variable sur objectifs, véhicule de service.' },
    { id: 'jb3', title: 'Comptable confirmé(e)', departmentId: 'fin', location: 'Douala', contractType: 'CDD', postingType: 'External', status: 'Published', isRemote: false, salaryMin: 800000, salaryMax: 1000000, currency: 'XAF', displaySalary: true, viewCount: 178, publishedAt: d(-9), closingDate: d(35), createdAt: d(-10),
      description: 'Remplacement d\'un départ : tenue de la comptabilité générale SYSCOHADA.', requirements: 'Bac+3 comptabilité, 4 ans d\'expérience.', benefits: 'Mutuelle.' },
    { id: 'jb4', title: 'Technicien(ne) de maintenance', departmentId: 'prod', location: 'Douala', contractType: 'CDI', postingType: 'Internal', status: 'Draft', isRemote: false, salaryMin: 450000, salaryMax: 600000, currency: 'XAF', displaySalary: false, viewCount: 0, createdAt: d(-2),
      description: 'Maintenance préventive et curative des lignes de conditionnement.', requirements: 'BTS maintenance industrielle.', benefits: '' },
    { id: 'jb5', title: 'Stagiaire analyste de données', departmentId: 'it', location: 'Douala', contractType: 'Internship', postingType: 'External', status: 'Closed', isRemote: false, currency: 'XAF', displaySalary: false, viewCount: 301, publishedAt: d(-140), closedAt: d(-100), createdAt: d(-142),
      description: 'Stage de 6 mois : tableaux de bord RH et commerciaux.', requirements: 'Master 1 statistique ou informatique.', benefits: 'Gratification.' },
  ];
  const CAND: [string, string, string][] = [
    ['Arnaud', 'Ebode', 'Douala'], ['Carine', 'Njoya', 'Douala'], ['Ibrahim', 'Moussa', 'Garoua'], ['Laure', 'Tamba', 'Yaoundé'], ['Steve', 'Mekongo', 'Douala'],
    ['Prisca', 'Nguema', 'Kribi'], ['Didier', 'Ateba', 'Douala'], ['Mariam', 'Ouattara', 'Abidjan'], ['Jean-Marc', 'Konan', 'Abidjan'], ['Fatou', 'Diallo', 'Abidjan'],
    ['Olivier', 'Kouadio', 'Bouaké'], ['Rachel', 'Ngo Ndjock', 'Douala'], ['Gaëlle', 'Ewane', 'Douala'], ['Kevin', 'Nkoulou', 'Yaoundé'], ['Sonia', 'Abanda', 'Douala'], ['Wilfried', 'Essama', 'Bafoussam'],
  ];
  const candidates: any[] = CAND.map(([f, l, city], i) => ({
    id: `cd${i + 1}`, firstName: f, lastName: l, email: `${slug(f)}.${slug(l)}@exemple.org`, phone: phone(i + 120), city, country: city === 'Abidjan' || city === 'Bouaké' ? "Côte d'Ivoire" : 'Cameroun',
    source: ['CareerSite', 'LinkedIn', 'Cooptation', 'Indeed'][i % 4], skills: [], languages: ['Français', ...(i % 3 === 0 ? ['Anglais'] : [])], isInTalentPool: i % 5 === 0, tags: [], gdprConsentGiven: true, createdAt: d(-30 + i),
  }));
  const A: [string, string, string, number][] = [
    ['jb1', 'cd1', 'Received', -2], ['jb1', 'cd2', 'Received', -1], ['jb1', 'cd3', 'Shortlisted', -12], ['jb1', 'cd4', 'Shortlisted', -10], ['jb1', 'cd5', 'Tested', -18],
    ['jb1', 'cd6', 'Interviewed', -20], ['jb1', 'cd7', 'SecondInterview', -22], ['jb1', 'cd13', 'OfferSent', -23], ['jb1', 'cd14', 'Rejected', -19],
    ['jb2', 'cd8', 'Received', -3], ['jb2', 'cd9', 'Shortlisted', -8], ['jb2', 'cd10', 'Interviewed', -12], ['jb2', 'cd11', 'Withdrawn', -11],
    ['jb3', 'cd12', 'Received', -4], ['jb3', 'cd15', 'Tested', -7], ['jb3', 'cd16', 'Shortlisted', -6],
    ['jb5', 'cd2', 'Rejected', -130], ['jb5', 'cd4', 'Hired', -128],
  ];
  const applications: any[] = A.map(([jobPostingId, candidateId, status, off], i) => ({
    id: `ap${i + 1}`, jobPostingId, candidateId, status, isInternal: false, source: candidates.find((c) => c.id === candidateId)!.source,
    coverLetter: 'Lettre de motivation fictive pour la démonstration.', assignedRecruiterName: 'Clarisse Etoa', createdAt: d(off),
    hiredAt: status === 'Hired' ? d(off + 31) : undefined,
    notes: i % 3 === 0 ? [{ id: uid('n'), content: 'Profil cohérent avec le besoin, à approfondir en entretien.', isPrivate: true, authorId: 'e4', authorName: 'Clarisse Etoa', createdAt: d(off + 1) }] : [],
  }));

  // ------------------------------------------------------------------- PAIE
  const now = new Date();
  const ym = (back: number) => { const x = new Date(now.getFullYear(), now.getMonth() - back, 1); return { year: x.getFullYear(), month: x.getMonth() + 1 }; };
  const bonuses: any[] = [
    { id: uid('bo'), employeeId: 'e9', type: 'Performance', amount: 150000, reason: 'Livraison du module de pointage', effectiveDate: d(-3), isValidated: true },
    { id: uid('bo'), employeeId: 'e14', type: 'Individual', amount: 120000, reason: 'Objectif trimestriel atteint', effectiveDate: d(-5), isValidated: true },
    { id: uid('bo'), employeeId: 'e22', type: 'Seniority', amount: 25000, reason: "Prime d'ancienneté", effectiveDate: d(-1), isValidated: true },
    { id: uid('bo'), employeeId: 'e16', type: 'Exceptional', amount: 400, reason: 'Salon professionnel', effectiveDate: d(-2), isValidated: false },
  ].map((b) => ({ ...b, currency: employees.find((e) => e.id === b.employeeId)!.currency, createdAt: b.effectiveDate }));
  const payrollRuns: any[] = [];
  for (const back of [2, 1]) {
    const { year, month } = ym(back);
    for (const e of employees.filter((x) => ['Active', 'OnLeave', 'TrialPeriod'].includes(x.status) && x.hireDate <= `${year}-${String(month).padStart(2, '0')}-28`)) {
      const c = calculatePayroll(e.baseSalary, 0, e.countryCode);
      payrollRuns.push({ id: uid('pr'), employeeId: e.id, year, month, ...c, currency: e.currency, status: back === 2 ? 'Paid' : 'Validated', paidAt: back === 2 ? `${year}-${String(month).padStart(2, '0')}-28T10:00:00Z` : undefined, createdAt: `${year}-${String(month).padStart(2, '0')}-25T09:00:00Z` });
    }
  }
  const expenses: any[] = [
    { id: uid('ex'), employeeId: 'e14', title: 'Tournée clients San Pedro', status: 'Submitted', submittedAt: d(-2), lines: [{ label: 'Hôtel 2 nuits', amount: 70000 }, { label: 'Carburant', amount: 38000 }] },
    { id: uid('ex'), employeeId: 'e15', title: 'Visite client Edéa', status: 'ApprovedByManager', submittedAt: d(-6), managerApprovedAt: d(-4), lines: [{ label: 'Transport', amount: 15000 }, { label: 'Repas client', amount: 27500 }] },
    { id: uid('ex'), employeeId: 'e16', title: 'Salon professionnel Lyon', status: 'ApprovedByHR', submittedAt: d(-12), managerApprovedAt: d(-10), hrApprovedAt: d(-8), lines: [{ label: 'Train', amount: 124 }, { label: 'Hôtel', amount: 189 }] },
    { id: uid('ex'), employeeId: 'e11', title: 'Déplacement datacenter', status: 'Reimbursed', submittedAt: d(-30), managerApprovedAt: d(-28), hrApprovedAt: d(-27), reimbursedAt: d(-20), lines: [{ label: 'Transport', amount: 22000 }] },
    { id: uid('ex'), employeeId: 'e9', title: 'Formation en ligne (licence)', status: 'Draft', lines: [] },
  ].map((x) => ({ ...x, currency: employees.find((e) => e.id === x.employeeId)!.currency, totalAmount: x.lines.reduce((s: number, l: any) => s + l.amount, 0), createdAt: x.submittedAt || d(-1) }));

  // -------------------------------------------------------- TEMPS & CONGÉS
  const timeEntries: any[] = [];
  const workers = ['e2', 'e3', 'e9', 'e10', 'e19', 'e22', 'e16'];
  for (const eid of workers) {
    for (let k = -13; k <= -1; k++) {
      const day = new Date(today); day.setDate(day.getDate() + k);
      if (day.getDay() === 0 || day.getDay() === 6) continue;
      const startH = 7 + ((k + eid.length) % 2), startM = (Math.abs(k) * 13) % 50;
      const extra = eid === 'e9' && k > -6 ? 2.5 : eid === 'e19' && k % 3 === 0 ? 3 : 0;
      const hours = round2(8 + extra + ((Math.abs(k) * 7) % 5) / 10);
      const ci = iso(k, startH, startM);
      const co = new Date(new Date(ci).getTime() + hours * 3600000).toISOString();
      timeEntries.push({ id: uid('te'), employeeId: eid, clockIn: ci, clockOut: co, totalHours: hours, isRemote: eid === 'e16' && k % 2 === 0, location: eid === 'e16' ? 'Paris' : 'Douala', status: 'Completed', source: 'Badge' });
    }
  }
  const overtimes: any[] = [];
  for (const eid of workers) {
    const e = employees.find((x) => x.id === eid)!;
    for (const o of detectOvertime(timeEntries.filter((t) => t.employeeId === eid), e.baseSalary, e.countryCode))
      overtimes.push({ id: uid('ot'), employeeId: eid, ...o, currency: e.currency, isApproved: false, isCompensated: false });
  }
  const leaveBalances: any[] = [];
  const year = today.getFullYear();
  for (const e of employees) for (const [type, total] of Object.entries(initialLeaveBalances(e.countryCode, e.contractType, e.hireDate)))
    leaveBalances.push({ employeeId: e.id, type, year, totalDays: total, usedDays: 0 });
  const L: [string, string, number, number, string, string][] = [
    ['e7', 'PaidLeave', -4, 10, 'Approved', 'Congé annuel'], ['e9', 'PaidLeave', 18, 22, 'Pending', 'Vacances familiales'], ['e19', 'Sick', -2, -1, 'Approved', 'Arrêt maladie'],
    ['e16', 'RTT', 9, 9, 'Pending', 'Pont'], ['e22', 'PaidLeave', 30, 41, 'Pending', 'Congé annuel'], ['e14', 'PaidLeave', -40, -33, 'Approved', 'Congé annuel'],
    ['e11', 'Unpaid', 5, 6, 'Rejected', 'Convenance personnelle'], ['e6', 'PaidLeave', 12, 14, 'Pending', 'Mariage'],
  ];
  const leaveRequests: any[] = L.map(([employeeId, type, s, en, status, reason]) => {
    const e = employees.find((x) => x.id === employeeId)!;
    const days = workingDays(d(s), d(en), e.countryCode);
    if (status === 'Approved') { const b = leaveBalances.find((x) => x.employeeId === employeeId && x.type === type); if (b) b.usedDays += days; }
    return { id: uid('lr'), employeeId, type, startDate: d(s), endDate: d(en), daysCount: days, status, reason, approvedAt: status === 'Approved' ? d(s - 5) : undefined, rejectionReason: status === 'Rejected' ? 'Période de clôture comptable' : undefined, createdAt: d(Math.min(s, 0) - 7) };
  });

  // -------------------------------------------------------------- FORMATION
  const courses: any[] = [
    { id: 'tc1', title: 'Sécurité et santé au travail', description: 'Formation obligatoire : consignes de sécurité, gestes de premiers secours, évacuation.', type: 'Internal', durationHours: 7, isOnline: false, leadsToCertification: true, languageCode: 'fr', cost: 0, currency: 'XAF' },
    { id: 'tc2', title: 'Excel avancé pour les fonctions support', description: 'Tableaux croisés, Power Query, modélisation de budgets.', type: 'ELearning', durationHours: 12, isOnline: true, leadsToCertification: false, languageCode: 'fr', cost: 85000, currency: 'XAF' },
    { id: 'tc3', title: 'Management de proximité', description: 'Animer une équipe, conduire les entretiens annuels, feedback continu.', type: 'Workshop', durationHours: 14, isOnline: false, leadsToCertification: false, languageCode: 'fr', cost: 350000, currency: 'XAF' },
    { id: 'tc4', title: 'Anglais professionnel B2', description: 'Communication écrite et orale en contexte professionnel.', type: 'External', durationHours: 40, isOnline: true, leadsToCertification: true, languageCode: 'en', cost: 420000, currency: 'XAF' },
    { id: 'tc5', title: 'Cybersécurité : les bons réflexes', description: 'Hameçonnage, mots de passe, gestion des secrets.', type: 'Webinar', durationHours: 2, isOnline: true, leadsToCertification: false, languageCode: 'fr', cost: 0, currency: 'XAF' },
  ];
  const sessions: any[] = [
    { id: 'ts1', courseId: 'tc1', startDate: d(6), endDate: d(6), location: 'Siège Douala, salle Wouri', instructor: 'Franck Eyenga', maxParticipants: 12, status: 'Planned' },
    { id: 'ts2', courseId: 'tc2', startDate: d(-10), endDate: d(20), location: 'En ligne', instructor: 'Organisme externe (fictif)', maxParticipants: 30, status: 'InProgress' },
    { id: 'ts3', courseId: 'tc3', startDate: d(15), endDate: d(16), location: 'Agence Yaoundé', instructor: 'Cabinet conseil (fictif)', maxParticipants: 8, status: 'Planned' },
    { id: 'ts4', courseId: 'tc4', startDate: d(-60), endDate: d(-5), location: 'En ligne', instructor: 'Institut de langues (fictif)', maxParticipants: 15, status: 'Completed' },
    { id: 'ts5', courseId: 'tc5', startDate: d(2), endDate: d(2), location: 'Visioconférence', instructor: 'Rodrigue Tchinda', maxParticipants: 50, status: 'Planned' },
  ];
  const E: [string, string, string, number, number?][] = [
    ['ts1', 'e10', 'Registered', 0], ['ts1', 'e27', 'Registered', 0], ['ts1', 'e20', 'Registered', 0], ['ts2', 'e6', 'InProgress', 45], ['ts2', 'e3', 'InProgress', 70],
    ['ts3', 'e18', 'Registered', 0], ['ts3', 'e21', 'Registered', 0], ['ts4', 'e13', 'Completed', 100, 84], ['ts4', 'e16', 'Completed', 100, 91], ['ts4', 'e9', 'Failed', 100, 58], ['ts5', 'e9', 'Registered', 0],
  ];
  const enrollments: any[] = E.map(([sessionId, employeeId, status, progress, score]) => ({ id: uid('en'), sessionId, employeeId, status, progress, score, enrolledAt: d(-20), completedAt: status === 'Completed' ? d(-5) : undefined }));
  const certifications: any[] = [
    { id: uid('ce'), employeeId: 'e24', name: 'Habilitation électrique B1V', issuedBy: 'Organisme agréé (fictif)', issueDate: d(-700), expiryDate: d(28) },
    { id: uid('ce'), employeeId: 'e20', name: 'Permis poids lourd C', issuedBy: 'Administration (fictive)', issueDate: d(-1500), expiryDate: d(45) },
    { id: uid('ce'), employeeId: 'e11', name: 'Certification réseau associée', issuedBy: 'Éditeur (fictif)', issueDate: d(-1000), expiryDate: d(-12) },
    { id: uid('ce'), employeeId: 'e13', name: 'Anglais professionnel B2', issuedBy: 'Institut de langues (fictif)', issueDate: d(-5) },
  ];

  // ------------------------------------------------------------ PERFORMANCE
  const reviews: any[] = [
    { id: uid('rv'), employeeId: 'e9', reviewerId: 'e8', type: 'Annual', period: `${year}`, year, status: 'ManagerReview', scheduledDate: d(8) },
    { id: uid('rv'), employeeId: 'e3', reviewerId: 'e2', type: 'Annual', period: `${year}`, year, status: 'EmployeeSelfReview', scheduledDate: d(12) },
    { id: uid('rv'), employeeId: 'e10', reviewerId: 'e8', type: 'TrialPeriodEnd', period: 'Fin de période d\'essai', year, status: 'Draft', scheduledDate: d(18) },
    { id: uid('rv'), employeeId: 'e14', reviewerId: 'e13', type: 'SemiAnnual', period: `S1 ${year}`, year, status: 'Completed', overallScore: 4.2, strengths: 'Relation client, ténacité', areasForImprovement: 'Reporting CRM', completedAt: d(-90) },
    { id: uid('rv'), employeeId: 'e22', reviewerId: 'e21', type: 'Annual', period: `${year - 1}`, year: year - 1, status: 'Completed', overallScore: 3.6, strengths: 'Fiabilité, respect des consignes', areasForImprovement: 'Polyvalence sur la ligne 2', completedAt: d(-260) },
    { id: uid('rv'), employeeId: 'e6', reviewerId: 'e5', type: 'Annual', period: `${year}`, year, status: 'HRValidation', overallScore: 4.0, scheduledDate: d(-3) },
  ];
  const kr = (title: string, target: number, current: number, unit: string) => ({ id: uid('kr'), title, target, current, unit });
  const objectives: any[] = [
    { id: uid('ob'), employeeId: 'e9', title: 'Livrer le module de pointage mobile', level: 'Individual', startDate: `${year}-07-01`, endDate: `${year}-12-31`, status: 'InProgress', keyResults: [kr('Écrans livrés', 8, 6, 'écrans'), kr('Couverture de tests', 80, 64, '%')] },
    { id: uid('ob'), employeeId: 'e14', title: 'Développer le portefeuille industriel', level: 'Individual', startDate: `${year}-01-01`, endDate: `${year}-12-31`, status: 'InProgress', keyResults: [kr('Nouveaux clients signés', 12, 9, 'clients'), kr('Chiffre d\'affaires', 180, 121, 'M XOF')] },
    { id: uid('ob'), employeeId: 'e2', title: 'Réduire le délai de recrutement', level: 'Team', startDate: `${year}-01-01`, endDate: `${year}-12-31`, status: 'AtRisk', keyResults: [kr('Postes pourvus en moins de 45 jours', 10, 4, 'postes')] },
    { id: uid('ob'), employeeId: 'e21', title: 'Zéro accident sur la ligne de conditionnement', level: 'Department', startDate: `${year}-01-01`, endDate: `${year}-12-31`, status: 'InProgress', keyResults: [kr('Jours sans accident', 365, 288, 'jours'), kr('Audits sécurité réalisés', 4, 3, 'audits')] },
    { id: uid('ob'), employeeId: 'e10', title: "Objectifs de période d'essai", level: 'Individual', startDate: d(-50), endDate: d(25), status: 'NotStarted', keyResults: [kr('Tickets traités en autonomie', 20, 0, 'tickets')] },
  ];
  const feedbacks: any[] = [
    { id: uid('fb'), fromId: 'e8', toId: 'e9', type: 'Recognition', content: 'Très bonne reprise du module de badgeage, code clair et testé.', createdAt: d(-3) },
    { id: uid('fb'), fromId: 'e13', toId: 'e15', type: 'Improvement', content: 'Penser à saisir les comptes rendus de visite le jour même.', createdAt: d(-6) },
    { id: uid('fb'), fromId: 'e2', toId: 'e3', type: 'General', content: 'Merci pour la préparation de la campagne d\'entretiens.', createdAt: d(-9) },
  ];

  // ------------------------------------------------------------- ONBOARDING
  const plans: any[] = [];
  const onbTasks: any[] = [];
  for (const [eid, buddyId, doneRatio] of [['e10', 'e9', 0.7], ['e27', 'e3', 0.25]] as [string, string, number][]) {
    const e = employees.find((x) => x.id === eid)!;
    const job = JOBS.find((j) => j.id === e.jobPositionId)!;
    const planId = uid('pl');
    const tasks = onboardingTasks(job.title, !!e.trialPeriodEndDate);
    const base = new Date(e.hireDate), trial = e.trialPeriodEndDate ? new Date(e.trialPeriodEndDate) : null;
    tasks.forEach((t, i) => {
      const due = new Date(t.fromTrialEnd && trial ? trial : base); due.setDate(due.getDate() + t.dueOffset);
      onbTasks.push({ id: uid('ot'), planId, title: t.title, description: t.description, category: t.category, priority: t.priority, dueDate: ymd(due), isRequired: t.priority === 'High', isCompleted: i < Math.round(tasks.length * doneRatio) && ymd(due) <= d(0), sortOrder: i + 1 });
    });
    plans.push({ id: planId, employeeId: eid, buddyId, startDate: e.hireDate, trialPeriodEndDate: e.trialPeriodEndDate, welcomeDocuments: WELCOME_DOCUMENTS.map((w, i) => ({ id: uid('wd'), ...w, isSigned: w.requiresSignature && doneRatio > 0.5 && i < 2 })), createdAt: e.hireDate });
  }

  // ------------------------------------------------------------------ TESTS
  const testTemplates: any[] = [
    { id: 'tt1', title: 'Test technique C# / .NET', type: 'Technical', durationMinutes: 45, passingScore: 70, autoScore: true, questionCount: 20, description: 'QCM et exercices courts : LINQ, async/await, EF Core.' },
    { id: 'tt2', title: 'Inventaire de personnalité (Big Five)', type: 'Personality', durationMinutes: 25, passingScore: 0, autoScore: false, questionCount: 50, description: 'Profil indicatif, aucun seuil éliminatoire.' },
    { id: 'tt3', title: 'Raisonnement logique', type: 'Psychotechnical', durationMinutes: 30, passingScore: 60, autoScore: true, questionCount: 24, description: 'Suites logiques et raisonnement numérique.' },
    { id: 'tt4', title: 'Anglais professionnel', type: 'Language', durationMinutes: 35, passingScore: 65, autoScore: true, questionCount: 30, description: 'Compréhension écrite et grammaire.' },
  ];
  const T: [string, string, string, number?][] = [
    ['tt1', 'ap5', 'Completed', 17], ['tt3', 'ap5', 'Completed', 19], ['tt1', 'ap6', 'Completed', 15], ['tt1', 'ap7', 'Completed', 18],
    ['tt1', 'ap4', 'InProgress', 13], ['tt3', 'ap3', 'Sent'], ['tt4', 'ap15', 'Completed', 21], ['tt2', 'ap10', 'Completed'],
  ];
  const candidateTests: any[] = T.map(([templateId, applicationId, status, correct], i) => {
    const tpl = testTemplates.find((t) => t.id === templateId)!;
    const score = status === 'Completed' && tpl.autoScore && correct != null ? Math.round((correct / tpl.questionCount) * 100) : undefined;
    return { id: uid('ct'), templateId, applicationId, status, correctAnswers: correct, score, passed: score != null ? score >= tpl.passingScore : undefined, sentAt: d(-10 + i), startedAt: status !== 'Sent' ? d(-8 + i) : undefined, completedAt: status === 'Completed' ? d(-8 + i) : undefined, timeSpentMinutes: status === 'Completed' ? tpl.durationMinutes - 6 + (i % 5) : undefined };
  });

  // -------------------------------------------------------------- ENTRETIENS
  const interviews: any[] = [
    { id: uid('iv'), applicationId: 'ap6', type: 'VideoSync', scheduledDate: iso(-5, 10, 0), durationMinutes: 45, isOnline: true, onlineMeetingId: 'TLS4K2Q9ZA', location: undefined, status: 'Completed', interviewerIds: ['e8', 'e9'], feedbacks: [
      { interviewerId: 'e8', technical: 4, communication: 3, motivation: 4, culture: 4, recommendation: 'Favorable', comment: 'Bonne maîtrise d\'EF Core.' },
      { interviewerId: 'e9', technical: 4, communication: 4, motivation: 5, culture: 4, recommendation: 'Favorable', comment: 'Échange fluide, curieuse.' }] },
    { id: uid('iv'), applicationId: 'ap7', type: 'Panel', scheduledDate: iso(-2, 14, 30), durationMinutes: 60, isOnline: false, location: 'Siège Douala, salle Sanaga', status: 'Completed', interviewerIds: ['e8', 'e2'], feedbacks: [
      { interviewerId: 'e8', technical: 5, communication: 4, motivation: 4, culture: 3, recommendation: 'Très favorable', comment: 'Architecture solide.' }] },
    { id: uid('iv'), applicationId: 'ap7', type: 'InPerson', scheduledDate: iso(2, 9, 30), durationMinutes: 45, isOnline: false, location: 'Siège Douala, bureau DG', status: 'Scheduled', interviewerIds: ['e1'], feedbacks: [] },
    { id: uid('iv'), applicationId: 'ap10', type: 'VideoSync', scheduledDate: iso(1, 11, 0), durationMinutes: 30, isOnline: true, onlineMeetingId: 'TLS7P3M1WX', status: 'Scheduled', interviewerIds: ['e13'], feedbacks: [] },
    { id: uid('iv'), applicationId: 'ap16', type: 'Phone', scheduledDate: iso(3, 16, 0), durationMinutes: 20, isOnline: false, location: 'Téléphone', status: 'Scheduled', interviewerIds: ['e5'], feedbacks: [] },
  ];

  return { employees, jobs, candidates, applications, bonuses, payrollRuns, expenses, timeEntries, overtimes, leaveBalances, leaveRequests, courses, sessions, enrollments, certifications, reviews, objectives, feedbacks, plans, onbTasks, testTemplates, candidateTests, interviews };
}

export type Db = ReturnType<typeof buildDb>;
