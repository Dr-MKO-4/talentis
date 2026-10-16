/**
 * Parcours Playwright (Edge) de la démo Talentis.
 * Usage : node e2e/parcours.cjs http://localhost:47613 [dossier-captures]
 * Vérifie 0 erreur JS, 0 requête hors origine et 0 appel XHR/fetch (l'API est simulée en mémoire).
 */
const { chromium } = require(process.env.PW_CORE || 'M:/dev-cache/tools/pw/node_modules/playwright-core');
const BASE = process.argv[2] || 'http://localhost:47613';
const SHOTS = process.argv[3];
const origin = new URL(BASE).origin;
const ok = (c, m) => { if (!c) throw new Error('ÉCHEC : ' + m); console.log('  ok  ' + m); };

(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: SHOTS ? 2 : 1, locale: 'fr-FR', acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [], external = [], backend = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('dialog', (d) => d.accept());
  ctx.on('request', (r) => {
    const u = r.url();
    if (u.startsWith('data:') || u.startsWith('blob:')) return;
    if (new URL(u).origin !== origin) external.push(u);
    if (['xhr', 'fetch'].includes(r.resourceType())) backend.push(r.method() + ' ' + u);
  });
  const shot = async (n) => { if (SHOTS) { await page.waitForTimeout(700); await page.screenshot({ path: `${SHOTS}/talentis-${n}.png` }); } };
  const go = async (path, text) => { await page.goto(BASE + path); await page.getByText(text).first().waitFor({ timeout: 15000 }); };

  console.log('1. Connexion');
  await page.goto(BASE + '/');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.getByText('Tableau de bord RH').waitFor();
  await page.getByText('Indicateurs clés de performance').waitFor();
  ok(await page.getByText('Démo · données simulées').first().isVisible(), 'bandeau démo visible');
  ok(await page.getByText('M FCFA').isVisible(), 'masse salariale en FCFA');
  await shot('dashboard');

  console.log('2. Personnel');
  await go('/personnel', 'Samuel Ekwalla');
  await page.waitForTimeout(400);
  ok((await page.locator('tbody tr').count()) >= 20, 'liste des collaborateurs');
  await shot('personnel');
  await page.getByLabel('Rechercher un collaborateur').fill('Mvondo');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(800);
  ok((await page.locator('tbody tr').count()) === 1, 'recherche par nom');
  await page.getByRole('button', { name: 'Linda Mvondo' }).click();
  await page.getByRole('heading', { name: 'Linda Mvondo' }).waitFor();
  await shot('employee');
  await page.getByRole('button', { name: /Documents/ }).click();
  await page.getByRole('button', { name: /Carrière/ }).click();
  await go('/personnel/alerts', 'Fins de contrat');
  await page.getByText('Yannick Nana').waitFor();
  ok(true, "alertes de fin d'essai");
  await go('/personnel/orgchart', 'Hiérarchie par lien manager');
  await page.getByText('Samuel Ekwalla').first().waitFor();
  await go('/personnel/new', 'Nouveau collaborateur');
  await page.getByLabel('Prénom *').fill('Inès');
  await page.getByLabel('Nom *', { exact: true }).fill('Demo');
  await page.getByLabel('E-mail professionnel *').fill('ines.demo@exemple.org');
  await page.getByLabel('Département *').selectOption('it');
  await page.getByLabel('Poste *').selectOption('j-dev');
  await page.getByRole('button', { name: 'Créer le collaborateur' }).click();
  await page.getByRole('heading', { name: 'Inès Demo' }).waitFor();
  ok(await page.getByText('KAL00028').first().isVisible(), 'matricule KAL00028 attribué');

  console.log('3. Recrutement');
  await go('/recruitment', 'Pipeline');
  await page.getByTestId('kanban').waitFor();
  await page.waitForTimeout(600);
  await shot('recruitment');
  await page.getByRole('button', { name: 'Avancer Arnaud Ebode' }).click();
  await page.getByText(/E-mail simulé/).first().waitFor();
  ok(true, 'candidature avancée dans le pipeline');

  console.log('4. Paie');
  await go('/payroll', 'Calculer la paie');
  await page.getByRole('button', { name: 'Calculer la paie' }).click();
  await page.getByTestId('calc-employee').selectOption('e9');
  await page.getByRole('button', { name: 'Calculer ce bulletin' }).click();
  await page.getByText('Paie calculée.').waitFor();
  await page.getByRole('button', { name: 'Fermer', exact: true }).first().click();
  await page.getByRole('button', { name: 'Voir le bulletin de Linda Mvondo' }).click();
  const n = (await page.getByTestId('payslip').innerText()).replace(/[\u202f\u00a0]/g, ' ');
  ok(/Primes et bonus/.test(n) && /1 250 000 FCFA/.test(n), 'brut = base 1 100 000 + prime 150 000');
  ok(/828 750 FCFA/.test(n), "net = 1 250 000 - 22 % - 15 % d'impôt (règle par défaut)");
  await shot('payroll');
  await page.keyboard.press('Escape');

  console.log('5. Temps & présences');
  await go('/time-attendance', 'Mon badgeage');
  await page.getByRole('button', { name: "Badger l'entrée" }).click();
  await page.getByTestId('clock-timer').waitFor();
  await page.getByRole('button', { name: 'Badger la sortie' }).click();
  await page.getByText('Pointage de sortie enregistré', { exact: false }).waitFor();
  await page.getByRole('button', { name: 'Demande de congés' }).click();
  await page.getByLabel('Du', { exact: true }).fill('2027-03-01');
  await page.getByLabel('Au', { exact: true }).fill('2027-03-05');
  ok((await page.getByTestId('leave-preview').innerText()) === '5', '5 jours ouvrés du lundi au vendredi');
  await page.getByRole('button', { name: 'Envoyer la demande' }).click();
  await page.getByText(/Demande de congés créée/).waitFor();
  await page.getByRole('button', { name: 'Approuver' }).first().click();
  await page.getByText('Congés approuvés.').waitFor();
  await shot('attendance');

  console.log('6. Autres modules');
  await go('/training', 'Sessions');
  await go('/performance', 'Objectifs');
  await go('/onboarding', "Checklist d'intégration");
  await shot('onboarding');
  await go('/testing', 'Tests candidats');
  await page.getByRole('button', { name: 'Clôturer et noter' }).click();
  await page.getByText('Test complété.').waitFor();
  await go('/interviews', 'À venir');
  await go('/mobility', 'Module Mobilité');
  ok(true, 'formation, performance, onboarding, tests, entretiens, module squelette');

  console.log('7. Mobile 390 px');
  await page.setViewportSize({ width: 390, height: 844 });
  for (const p of ['/dashboard', '/personnel', '/personnel/e9', '/payroll', '/recruitment', '/time-attendance', '/onboarding', '/interviews']) {
    await page.goto(BASE + p); await page.waitForTimeout(1000);
    const w = await page.evaluate(() => document.documentElement.scrollWidth);
    ok(w <= 391, `${p} sans débordement horizontal (${w}px)`);
  }
  await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
  await page.getByRole('link', { name: 'Paie' }).click();
  await page.getByText('Bulletins').first().waitFor();

  console.log('Bilan');
  ok(errors.length === 0, 'aucune erreur JS ' + (errors.length ? JSON.stringify(errors) : ''));
  ok(external.length === 0, 'aucune requête hors origine ' + (external.length ? JSON.stringify(external.slice(0, 5)) : ''));
  ok(backend.length === 0, 'aucun appel XHR/fetch vers un backend ' + (backend.length ? JSON.stringify(backend.slice(0, 5)) : ''));
  await browser.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
