// Écrans Personnel absents du frontend d'origine (routes « ComingSoon »),
// construits pour la démo à partir du store et des endpoints existants :
// GET /employees/alerts, GET /employees/orgchart, GET /employees/references, POST /employees.
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Building2, UserPlus, ChevronDown, ChevronRight } from 'lucide-react';
import { usePersonnelStore } from '../../store/slices/personnelStore';
import type { ContractType, CreateEmployeeDto, OrgChartNode, WorkMode } from '../../types/personnel';
import { ymd } from '../../demo/rules';
import { Field, fmtDate, PageHeader, Panel, Pill, Spinner } from '../modules/ui';

const Back: React.FC = () => {
  const navigate = useNavigate();
  return <button onClick={() => navigate('/personnel')} className="btn-ghost"><ArrowLeft className="w-4 h-4" />Personnel</button>;
};

export const AlertsPage: React.FC = () => {
  const { alerts, fetchAlerts, isLoadingAlerts } = usePersonnelStore();
  const navigate = useNavigate();
  useEffect(() => { fetchAlerts(); }, []);
  return (
    <div className="min-h-full bg-gray-50">
      <PageHeader icon={<AlertCircle className="w-5 h-5" />} color="bg-amber-500" title="Alertes RH" subtitle="Échéances des 60 prochains jours" actions={<Back />} />
      <div className="px-4 sm:px-6 py-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {isLoadingAlerts || !alerts ? <Spinner /> : (<>
          <Panel title={`Fins de contrat (${alerts.expiringContracts.length})`}>
            <ul className="divide-y divide-gray-50">{alerts.expiringContracts.map((a) => (
              <li key={a.id}><button onClick={() => navigate(`/personnel/${a.id}`)} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between gap-3">
                <span><span className="font-medium text-gray-900 block">{a.fullName}</span><span className="text-xs text-gray-400">{a.employeeNumber} · {a.contractType} · fin le {fmtDate(a.contractEndDate)}</span></span>
                <Pill tone={a.daysLeft <= 15 ? 'red' : 'amber'}>J-{a.daysLeft}</Pill></button></li>
            ))}</ul>
          </Panel>
          <Panel title={`Fins de période d'essai (${alerts.expiringTrialPeriods.length})`}>
            <ul className="divide-y divide-gray-50">{alerts.expiringTrialPeriods.map((a) => (
              <li key={a.id}><button onClick={() => navigate(`/personnel/${a.id}`)} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between gap-3">
                <span><span className="font-medium text-gray-900 block">{a.fullName}</span><span className="text-xs text-gray-400">{a.employeeNumber} · manager : {a.managerName} · fin le {fmtDate(a.trialPeriodEndDate)}</span></span>
                <Pill tone={a.daysLeft <= 15 ? 'red' : 'amber'}>J-{a.daysLeft}</Pill></button></li>
            ))}</ul>
          </Panel>
        </>)}
      </div>
    </div>
  );
};

const Node: React.FC<{ n: OrgChartNode; depth: number }> = ({ n, depth }) => {
  const [open, setOpen] = useState(depth < 1);
  const navigate = useNavigate();
  const initials = n.fullName.split(' ').map((x) => x[0]).join('').substring(0, 2).toUpperCase();
  return (
    <li>
      <div className="flex items-center gap-2 py-1.5" style={{ paddingLeft: depth * 20 }}>
        {n.children.length ? (
          <button onClick={() => setOpen(!open)} aria-expanded={open} aria-label={`${open ? 'Replier' : 'Déplier'} l'équipe de ${n.fullName}`} className="p-1 rounded hover:bg-gray-100 text-gray-400">
            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        ) : <span className="w-6" />}
        <button onClick={() => navigate(`/personnel/${n.id}`)} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-3 py-2 hover:shadow-md transition-shadow text-left">
          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-semibold flex items-center justify-center">{initials}</span>
          <span><span className="block text-sm font-semibold text-gray-900">{n.fullName}</span><span className="block text-xs text-gray-500">{n.jobTitle} · {n.departmentName}</span></span>
          {n.children.length > 0 && <span className="ml-2 text-xs bg-gray-100 text-gray-500 rounded-full px-2">{n.children.length}</span>}
        </button>
      </div>
      {open && n.children.length > 0 && <ul>{n.children.map((c) => <Node key={c.id} n={c} depth={depth + 1} />)}</ul>}
    </li>
  );
};

export const OrgChartPage: React.FC = () => {
  const { orgChart, fetchOrgChart, isLoadingOrgChart } = usePersonnelStore();
  useEffect(() => { fetchOrgChart('co-1'); }, []);
  return (
    <div className="min-h-full bg-gray-50">
      <PageHeader icon={<Building2 className="w-5 h-5" />} color="bg-indigo-600" title="Organigramme" subtitle="Hiérarchie par lien manager" actions={<Back />} />
      <div className="px-4 sm:px-6 py-4 overflow-x-auto">
        {isLoadingOrgChart || !orgChart ? <Spinner /> : <ul data-testid="orgchart">{orgChart.map((n) => <Node key={n.id} n={n} depth={0} />)}</ul>}
      </div>
    </div>
  );
};

export const NewEmployeePage: React.FC = () => {
  const navigate = useNavigate();
  const { references, fetchReferences, createEmployee, isCreating } = usePersonnelStore();
  useEffect(() => { fetchReferences('co-1'); }, []);
  const today = ymd(new Date());
  const [f, setF] = useState<any>({ firstName: '', lastName: '', gender: 'Female', dateOfBirth: '1996-04-12', professionalEmail: '', personalEmail: '', professionalPhone: '', departmentId: '', jobPositionId: '', siteId: 's-dla', managerId: '', contractType: 'CDI', hireDate: today, trialPeriodEndDate: '', contractEndDate: '', weeklyHours: 40, workMode: 'OnSite', baseSalary: 500000 });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const jobs = (references?.jobPositions ?? []).filter((j) => !f.departmentId || j.departmentId === f.departmentId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dto = { ...f, companyId: 'co-1', countryId: '', currency: 'XAF', payrollFrequency: 'Monthly', preferredLanguage: 'fr', createUserAccount: false, weeklyHours: Number(f.weeklyHours), baseSalary: Number(f.baseSalary) } as CreateEmployeeDto;
    const created = await createEmployee(dto);
    if (created) navigate(`/personnel/${created.id}`);
  };

  return (
    <div className="min-h-full bg-gray-50">
      <PageHeader icon={<UserPlus className="w-5 h-5" />} color="bg-blue-600" title="Nouveau collaborateur" subtitle="Le matricule est attribué automatiquement" actions={<Back />} />
      <form onSubmit={submit} className="px-4 sm:px-6 py-4 space-y-4 max-w-4xl">
        <Panel title="Identité">
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Prénom *"><input className="input" value={f.firstName} onChange={set('firstName')} /></Field>
            <Field label="Nom *"><input className="input" value={f.lastName} onChange={set('lastName')} /></Field>
            <Field label="Genre"><select className="input" value={f.gender} onChange={set('gender')}><option value="Female">Femme</option><option value="Male">Homme</option><option value="NonBinary">Non binaire</option><option value="PreferNotToSay">Non précisé</option></select></Field>
            <Field label="Date de naissance"><input type="date" className="input" value={f.dateOfBirth} onChange={set('dateOfBirth')} /></Field>
            <Field label="E-mail professionnel *" hint="Domaine fictif conseillé : @exemple.org"><input className="input" value={f.professionalEmail} onChange={set('professionalEmail')} placeholder="prenom.nom@exemple.org" /></Field>
            <Field label="Téléphone professionnel"><input className="input" value={f.professionalPhone} onChange={set('professionalPhone')} placeholder="6XX XXX XXX" /></Field>
          </div>
        </Panel>
        <Panel title="Poste et contrat">
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Département *"><select className="input" value={f.departmentId} onChange={(e) => setF({ ...f, departmentId: e.target.value, jobPositionId: '' })}><option value="">Choisir…</option>{(references?.departments ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>
            <Field label="Poste *"><select className="input" value={f.jobPositionId} onChange={set('jobPositionId')}><option value="">Choisir…</option>{jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}</select></Field>
            <Field label="Site"><select className="input" value={f.siteId} onChange={set('siteId')}>{(references?.sites ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
            <Field label="Type de contrat"><select className="input" value={f.contractType} onChange={set('contractType')}>{(['CDI', 'CDD', 'Internship', 'Apprenticeship', 'Freelance', 'PartTime', 'Interim'] as ContractType[]).map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>
            <Field label="Date d'embauche *" hint="Le validateur refuse une date passée"><input type="date" className="input" value={f.hireDate} onChange={set('hireDate')} /></Field>
            <Field label="Fin de période d'essai" hint="Si renseignée, statut « Période d'essai »"><input type="date" className="input" value={f.trialPeriodEndDate} onChange={set('trialPeriodEndDate')} /></Field>
            <Field label="Mode de travail"><select className="input" value={f.workMode} onChange={set('workMode')}>{(['OnSite', 'Hybrid', 'Remote'] as WorkMode[]).map((w) => <option key={w} value={w}>{({ OnSite: 'Présentiel', Hybrid: 'Hybride', Remote: 'Télétravail' })[w]}</option>)}</select></Field>
            <Field label="Salaire de base mensuel (devise du site)"><input type="number" className="input" value={f.baseSalary} onChange={set('baseSalary')} /></Field>
          </div>
        </Panel>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={() => navigate('/personnel')}>Annuler</button>
          <button type="submit" className="btn-primary" disabled={isCreating}>{isCreating ? 'Création…' : 'Créer le collaborateur'}</button>
        </div>
      </form>
    </div>
  );
};
