// =============================================================================
// Règles métier reprises du backend Talentis (C#) et portées en TypeScript.
// Sources :
//  - backend/src/Infrastructure/Services/PayrollCalculationService.cs
//  - backend/src/Infrastructure/Services/Attendance/AttendanceCalculationService.cs
//  - backend/src/Infrastructure/Services/Onboarding/OnboardingTemplateService.cs
//  - backend/src/Infrastructure/Persistence/Repositories/EmployeeRepository.cs
// Les taux sont ceux du code d'origine (indicatifs et simplifiés). Les pays non
// paramétrés (Cameroun, Côte d'Ivoire...) tombent sur la branche « par défaut ».
// =============================================================================

export const round2 = (n: number) => Math.round(n * 100) / 100;

// ---------------------------------------------------------------- PAIE ------
export function employeeContributions(gross: number, country: string): number {
  switch (country.toUpperCase()) {
    case 'FR': return gross * 0.008 + gross * 0.1128 + gross * 0.024 + gross * 0.092;
    case 'BE': return gross * 0.1305;
    case 'CH': return gross * 0.064;
    case 'US': return gross * 0.0765;
    case 'GB': return gross * 0.12;
    default: return gross * 0.22;
  }
}

export function employerContributions(gross: number, country: string): number {
  switch (country.toUpperCase()) {
    case 'FR': return gross * (0.13 + 0.0345 + 0.01 + 0.1545 + 0.0405 + 0.01);
    case 'BE': return gross * 0.35;
    case 'CH': return gross * 0.064;
    case 'US': return gross * 0.0765;
    case 'GB': return gross * 0.138;
    default: return gross * 0.42;
  }
}

function progressiveTax(income: number, minRate: number, maxRate: number) {
  const annual = income * 12;
  if (annual <= 25000) return income * minRate;
  if (annual <= 75000) return income * ((minRate + maxRate) / 2);
  return income * maxRate;
}

function frenchIncomeTax(monthly: number) {
  const a = monthly * 12;
  if (a <= 11294) return 0;
  if (a <= 28797) return ((a - 11294) * 0.11) / 12;
  if (a <= 82341) return ((28797 - 11294) * 0.11 + (a - 28797) * 0.3) / 12;
  if (a <= 177106) return ((28797 - 11294) * 0.11 + (82341 - 28797) * 0.3 + (a - 82341) * 0.41) / 12;
  return ((28797 - 11294) * 0.11 + (82341 - 28797) * 0.3 + (177106 - 82341) * 0.41 + (a - 177106) * 0.45) / 12;
}

export function incomeTax(taxable: number, country: string): number {
  switch (country.toUpperCase()) {
    case 'FR': return frenchIncomeTax(taxable);
    case 'BE': return progressiveTax(taxable, 0.25, 0.5);
    case 'CH': return progressiveTax(taxable, 0, 0.115);
    case 'US': return progressiveTax(taxable, 0.1, 0.37);
    case 'GB': return progressiveTax(taxable, 0.2, 0.45);
    default: return taxable * 0.15;
  }
}

export interface PayrollLine { label: string; code: string; quantity: number; rate: number; amount: number; isDeduction: boolean; isTaxable: boolean; sortOrder: number }

export function calculatePayroll(baseSalary: number, bonusTotal: number, country: string) {
  const gross = baseSalary + bonusTotal;
  const empC = employeeContributions(gross, country);
  const emplC = employerContributions(gross, country);
  const tax = incomeTax(gross - empC, country);
  const net = gross - empC - tax;
  const lines: PayrollLine[] = [
    { label: 'Salaire de base', code: 'SAL_BASE', quantity: 1, rate: baseSalary, amount: baseSalary, isDeduction: false, isTaxable: true, sortOrder: 1 },
  ];
  if (bonusTotal > 0) lines.push({ label: 'Primes et bonus', code: 'BONUS', quantity: 1, rate: bonusTotal, amount: bonusTotal, isDeduction: false, isTaxable: true, sortOrder: 2 });
  lines.push({ label: 'Cotisations salarié', code: 'COT_SAL', quantity: 1, rate: empC, amount: empC, isDeduction: true, isTaxable: false, sortOrder: 10 });
  if (tax > 0) lines.push({ label: 'Prélèvement à la source', code: 'PAS', quantity: 1, rate: tax, amount: tax, isDeduction: true, isTaxable: false, sortOrder: 11 });
  return {
    baseSalary, grossSalary: round2(gross), netSalary: round2(net),
    employeeContributions: round2(empC), employerContributions: round2(emplC), taxWithheld: round2(tax),
    lines: lines.map((l) => ({ ...l, rate: round2(l.rate), amount: round2(l.amount) })),
  };
}

// ------------------------------------------------------ TEMPS & CONGÉS ------
const pad = (n: number) => String(n).padStart(2, '0');
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function easterSunday(year: number) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

/** Jours fériés : seul le calendrier français est codé dans le backend. */
export function publicHolidays(year: number, country: string): { date: string; name: string }[] {
  if (country.toUpperCase() !== 'FR') return [];
  const easter = easterSunday(year);
  return [
    [new Date(year, 0, 1), "Jour de l'an"], [addDays(easter, 1), 'Lundi de Pâques'], [new Date(year, 4, 1), 'Fête du travail'],
    [new Date(year, 4, 8), 'Victoire 1945'], [addDays(easter, 39), 'Ascension'], [addDays(easter, 50), 'Lundi de Pentecôte'],
    [new Date(year, 6, 14), 'Fête nationale'], [new Date(year, 7, 15), 'Assomption'], [new Date(year, 10, 1), 'Toussaint'],
    [new Date(year, 10, 11), 'Armistice 1918'], [new Date(year, 11, 25), 'Noël'],
  ].map(([d, n]) => ({ date: ymd(d as Date), name: n as string }));
}

export function workingDays(start: string, end: string, country: string): number {
  const s = new Date(start + 'T00:00:00'), e = new Date(end + 'T00:00:00');
  const hol = new Set(publicHolidays(s.getFullYear(), country).map((h) => h.date));
  let n = 0;
  for (let d = new Date(s); d <= e; d = addDays(d, 1)) {
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    if (hol.has(ymd(d))) continue;
    n++;
  }
  return n;
}

export const legalWeeklyHours = (c: string) => ({ FR: 35, BE: 38, CH: 42, US: 40, GB: 40 } as Record<string, number>)[c.toUpperCase()] ?? 40;
export const legalDailyHours = (c: string) => ({ FR: 10, BE: 9, CH: 9, US: 8, GB: 8 } as Record<string, number>)[c.toUpperCase()] ?? 8;

export function overtimeRate(type: 'Regular' | 'ExtraRegular' | 'Daily', country: string) {
  switch (country.toUpperCase()) {
    case 'FR': return type === 'ExtraRegular' ? 1.5 : 1.25;
    case 'BE': return 1.5;
    case 'CH': return 1.25;
    case 'US': return 1.5;
    case 'GB': return 1.0;
    default: return 1.25;
  }
}

function isoWeek(d: Date) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return `${t.getUTCFullYear()}-${Math.ceil(((t.getTime() - y0.getTime()) / 86400000 + 1) / 7)}`;
}

/** DetectOvertimeFromTimeEntries : dépassement hebdomadaire puis quotidien. */
export function detectOvertime(entries: { clockIn: string; totalHours: number }[], baseSalary: number, country: string) {
  const out: { date: string; hours: number; type: string; rate: number; amount: number }[] = [];
  const weeks = new Map<string, typeof entries>();
  for (const e of entries) { const k = isoWeek(new Date(e.clockIn)); weeks.set(k, [...(weeks.get(k) || []), e]); }
  for (const week of weeks.values()) {
    const weekly = week.reduce((s, e) => s + e.totalHours, 0);
    if (weekly > legalWeeklyHours(country)) {
      const h = weekly - legalWeeklyHours(country);
      const type = h <= 8 ? 'Regular' : 'ExtraRegular';
      const rate = overtimeRate(type, country);
      const first = week.map((e) => e.clockIn).sort()[0];
      out.push({ date: first.slice(0, 10), hours: round2(h), type, rate, amount: round2((h * baseSalary) / 151.67 * rate) });
    }
    for (const e of week) {
      if (e.totalHours > legalDailyHours(country)) {
        const h = e.totalHours - legalDailyHours(country);
        const rate = overtimeRate('Daily', country);
        out.push({ date: e.clockIn.slice(0, 10), hours: round2(h), type: 'Daily', rate, amount: round2((h * baseSalary) / 151.67 * rate) });
      }
    }
  }
  return out;
}

/** InitializeLeaveBalances (types côté frontend : PaidLeave, RTT, Sick...). */
export function initialLeaveBalances(country: string, contractType: string, hireDate: string): Record<string, number> {
  const b: Record<string, number> = {};
  switch (country.toUpperCase()) {
    case 'FR':
      b.PaidLeave = 25;
      b.RTT = contractType === 'PartTime' ? 0 : Math.max(0, (228 - 218) / 2);
      b.Sick = 0; b.Parental = 0; b.Unpaid = 0;
      break;
    case 'BE': case 'CH': b.PaidLeave = 20; break;
    case 'US': b.PaidLeave = 10; b.Sick = 5; break;
    case 'GB': b.PaidLeave = 28; break;
    default: b.PaidLeave = 20;
  }
  if (country.toUpperCase() === 'FR') {
    const seniority = new Date().getFullYear() - new Date(hireDate).getFullYear();
    if (seniority >= 10) b.PaidLeave += 1;
    if (seniority >= 15) b.PaidLeave += 1;
    if (seniority >= 20) b.PaidLeave += 1;
  }
  return b;
}

// ----------------------------------------------------------- ONBOARDING -----
export interface OnbTask { title: string; category: string; priority: 'High' | 'Medium' | 'Low'; dueOffset: number; description: string; fromTrialEnd?: boolean }

export function onboardingTasks(jobTitle: string, hasTrialEnd: boolean): OnbTask[] {
  const t: OnbTask[] = [];
  const add = (title: string, category: string, priority: OnbTask['priority'], dueOffset: number, description: string, fromTrialEnd = false) =>
    t.push({ title, category, priority, dueOffset, description, fromTrialEnd });
  add('Signature du contrat de travail', 'Administrative', 'High', 0, 'Signer le contrat de travail et les annexes');
  add('Signature du règlement intérieur', 'Administrative', 'High', 0, 'Prendre connaissance et signer le règlement intérieur');
  add('Formulaire de déclaration URSSAF', 'Administrative', 'High', 0, 'Compléter les informations pour la déclaration sociale');
  add('RIB pour virement salaire', 'Administrative', 'High', 0, 'Fournir un RIB pour le versement du salaire');
  add("Justificatifs d'identité et de domicile", 'Administrative', 'High', 0, "Copie carte d'identité + justificatif de domicile");
  add('Création compte email professionnel', 'IT', 'High', 0, 'Activé par le service IT');
  add('Mise en place des accès informatiques', 'IT', 'High', 0, 'Accès VPN, logiciels métiers, Slack, Drive');
  add('Attribution du matériel informatique', 'IT', 'High', 0, 'Ordinateur portable, écran, souris, casque');
  add('Formation aux outils collaboratifs', 'IT', 'Medium', 1, 'Teams, Slack, Google Workspace');
  add('Visite des locaux', 'Training', 'Medium', 0, 'Tour guidé : bureaux, salles de réunion, cuisine, toilettes');
  add("Présentation de l'équipe", 'Training', 'High', 0, "Rencontrer l'équipe et les principaux interlocuteurs");
  add("Formation culture d'entreprise", 'Training', 'Medium', 2, 'Valeurs, histoire, organisation, objectifs');
  add('Formation sécurité et santé au travail', 'Training', 'High', 3, 'Obligatoire : consignes de sécurité, évacuation');
  add("Entretien d'accueil avec le manager", 'Manager', 'High', 0, 'Présentation du poste, objectifs, planning');
  add("Définition des objectifs de période d'essai", 'Manager', 'High', 1, "Établir les OKR de la période d'essai");
  const j = jobTitle.toLowerCase();
  if (j.includes('développeur') || j.includes('engineer')) {
    add('Setup environnement de développement', 'Training', 'High', 1, 'Installation IDE, SDK, accès repos GitHub');
    add('Formation architecture technique', 'Training', 'High', 3, 'Stack technique, architecture, conventions code');
    add('Premier code review', 'Training', 'Medium', 7, 'Soumettre une première PR pour review');
    add('Onboarding sécurité IT', 'Training', 'High', 5, 'Bonnes pratiques sécurité, gestion secrets');
  } else if (j.includes('commercial') || j.includes('sales')) {
    add('Formation produits et services', 'Training', 'High', 2, 'Catalogue produits, pricing, USP');
    add('Formation outils CRM', 'Training', 'High', 3, 'Salesforce, HubSpot, process de vente');
    add('Shadowing commercial senior', 'Training', 'Medium', 7, 'Observer 3 rendez-vous clients');
    add('Simulation pitch produit', 'Training', 'Medium', 10, "Exercice de pitch devant l'équipe");
  } else if (j.includes('rh') || j.includes('hr')) {
    add('Formation SIRH', 'Training', 'High', 2, 'Formation TALENTIS ou autre SIRH');
    add('Formation droit du travail', 'Training', 'High', 5, 'Code du travail, conventions collectives');
    add('Formation process recrutement', 'Training', 'Medium', 7, 'ATS, sourcing, entretiens, onboarding');
  }
  add("Point d'étape 1 semaine", 'Manager', 'High', 7, 'Bilan première semaine avec le manager');
  add("Point d'étape 1 mois", 'Manager', 'High', 30, 'Évaluation intermédiaire période d\'essai');
  if (hasTrialEnd) {
    add("Entretien de fin de période d'essai", 'Manager', 'High', -7, 'Évaluation finale et décision', true);
    add('Questionnaire de satisfaction onboarding', 'HR', 'Medium', -3, "Feedback sur le parcours d'intégration", true);
  }
  add("Visite médicale d'embauche", 'HR', 'High', 14, 'Obligatoire : prise de RDV médecine du travail');
  add("Inscription mutuelle d'entreprise", 'HR', 'Medium', 7, 'Choix options mutuelle et prévoyance');
  add('Configuration tickets restaurant', 'HR', 'Low', 7, 'Carte Swile, Edenred ou équivalent');
  return t;
}

export const WELCOME_DOCUMENTS = [
  { title: 'Contrat de travail', requiresSignature: true },
  { title: 'Règlement intérieur', requiresSignature: true },
  { title: 'Guide du collaborateur', requiresSignature: false },
  { title: 'Charte informatique', requiresSignature: true },
  { title: 'Notice mutuelle et prévoyance', requiresSignature: false },
  { title: "Organigramme de l'entreprise", requiresSignature: false },
];

/** GenerateEmployeeNumberAsync : 3 premières lettres de la société + numéro sur 5 chiffres. */
export function nextEmployeeNumber(companyName: string, existing: string[]) {
  const prefix = companyName.length >= 3 ? companyName.substring(0, 3).toUpperCase() : 'EMP';
  const nums = existing.filter((n) => n.startsWith(prefix)).map((n) => parseInt(n.replace(prefix, ''), 10)).filter((n) => !isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `${prefix}${String(next).padStart(5, '0')}`;
}

/** Parité fixe officielle utilisée pour consolider la masse salariale en FCFA (XAF). */
export const TO_XAF: Record<string, number> = { XAF: 1, XOF: 1, EUR: 655.957 };
