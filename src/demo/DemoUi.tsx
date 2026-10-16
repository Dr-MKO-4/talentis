import React from 'react';
import { DEMO_MFA_CODE } from './server';

/** Bandeau discret affiché sur toutes les pages de l'application. */
export const DemoBanner: React.FC = () => (
  <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-xs px-4 py-1.5 flex items-center justify-between gap-2" role="note">
    <span><strong>Démo · données simulées.</strong> API en mémoire dans le navigateur, personnes et société fictives ; tout est réinitialisé au rechargement.</span>
    <span className="hidden sm:inline text-amber-600">Talentis est en chantier</span>
  </div>
);

export const DemoLoginHint: React.FC = () => (
  <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 space-y-1" role="note">
    <p className="font-semibold">Démo · données simulées</p>
    <p>Compte RH : <code>rh@exemple.org</code> / <code>demo</code> (pré-rempli).</p>
    <p>Compte avec double authentification : <code>admin@exemple.org</code> / <code>demo</code>, code MFA <code>{DEMO_MFA_CODE}</code>.</p>
  </div>
);
