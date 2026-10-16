# Talentis · démo web

Démo en ligne du SIRH **Talentis** (« People. Performance. Progress. »), projet en chantier :
backend ASP.NET Core 8 (Clean Architecture, MediatR, FluentValidation, EF Core, PostgreSQL)
et frontend React + TypeScript + Tailwind.

La démo tourne **entièrement dans le navigateur** : aucune API, aucune base de données.

## Ce qui vient du projet d'origine

- `src/App.tsx`, `src/pages/personnel/*Page.tsx`, `src/pages/dashboard/DashboardPage.tsx`,
  `src/components/common`, `src/services/*`, `src/store/slices/*`, `src/types/*` : fichiers du
  frontend d'origine (premier commit), légèrement adaptés (voir l'historique git).
- `src/demo/rules.ts` : règles portées du C# : `PayrollCalculationService` (cotisations, impôt,
  lignes de paie par pays), `AttendanceCalculationService` (jours ouvrés, heures supplémentaires,
  soldes de congés), `OnboardingTemplateService` (modèle de tâches), numérotation des matricules.
- `src/demo/server.ts` : API simulée reprenant les routes des contrôleurs `api/v1/*`
  (employés, recrutement, paie, temps, formation, performance, onboarding, tests, entretiens,
  authentification) et leurs messages.

## Ce qui est propre à la démo

- `src/demo/install.ts` : adaptateur axios par défaut et interception de `fetch` vers l'API simulée.
- `src/pages/modules/*` et `src/pages/personnel/PersonnelExtras.tsx` : écrans des modules qui
  n'étaient que des « ComingSoon » dans le frontend, construits sur les endpoints existants.
- `src/demo/seed.ts` : société, personnes et chiffres **fictifs** (e-mails `@exemple.org`).
- Les modules Mobilité, Reporting, Engagement, Sécurité et Intégrations restent des squelettes,
  comme dans le code.

## Lancer

```bash
npm ci
npm run build
npm run preview          # http://localhost:47613
node e2e/parcours.cjs http://localhost:47613
```

Comptes : `rh@exemple.org` / `demo`, ou `admin@exemple.org` / `demo` avec le code MFA `123456`.
