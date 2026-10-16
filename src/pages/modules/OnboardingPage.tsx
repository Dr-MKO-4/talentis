import React, { useMemo, useState } from 'react';
import { Rocket, CheckCircle2, Circle, FileSignature, Plus, UserCheck } from 'lucide-react';
import { act, Dialog, Empty, Field, fmtDate, Note, PageHeader, Panel, Pill, Spinner, useApi, useEmployees } from './ui';

const CAT: Record<string, string> = { Administrative: 'Administratif', IT: 'Informatique', Training: 'Formation', Manager: 'Manager', HR: 'RH', Other: 'Autre' };
const PRIO: Record<string, 'red' | 'amber' | 'gray'> = { High: 'red', Medium: 'amber', Low: 'gray' };
const PRIO_L: Record<string, string> = { High: 'Haute', Medium: 'Moyenne', Low: 'Basse' };

const OnboardingPage: React.FC = () => {
  const plans = useApi<any[]>('/onboarding/plans');
  const emps = useEmployees();
  const [sel, setSel] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: '', buddyId: '' });
  const plan = (plans.data ?? []).find((p) => p.id === sel) ?? (plans.data ?? [])[0];
  const grouped = useMemo(() => {
    const g: Record<string, any[]> = {};
    for (const t of plan?.tasks ?? []) (g[t.category] ||= []).push(t);
    return g;
  }, [plan]);
  const without = (emps.data?.items ?? []).filter((e) => !['Resigned', 'Terminated'].includes(e.status) && !(plans.data ?? []).some((p) => p.employeeId === e.id));
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-full bg-gray-50">
      <PageHeader icon={<Rocket className="w-5 h-5" />} color="bg-cyan-600" title="Onboarding" subtitle="Parcours d'intégration générés depuis le modèle de tâches"
        actions={<button className="btn-primary" onClick={() => setOpen(true)}><Plus className="w-4 h-4" />Nouveau parcours</button>} />
      <div className="px-4 sm:px-6 py-4 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        <div className="space-y-2">
          {plans.loading ? <Spinner /> : (plans.data ?? []).map((p) => {
            const pct = Math.round((p.completedTasks / Math.max(1, p.totalTasks)) * 100);
            return (
              <button key={p.id} onClick={() => setSel(p.id)} className={`w-full text-left bg-white border rounded-xl p-3 shadow-sm ${plan?.id === p.id ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'}`}>
                <p className="font-semibold text-sm text-gray-900">{p.employeeName}</p>
                <p className="text-xs text-gray-500">{p.jobTitle} · arrivé(e) le {fmtDate(p.startDate)}</p>
                <div className="h-1.5 bg-gray-100 rounded-full mt-2"><div className="h-1.5 bg-cyan-500 rounded-full" style={{ width: `${pct}%` }} /></div>
                <p className="text-xs text-gray-400 mt-1">{p.completedTasks} / {p.totalTasks} tâches · {pct} %</p>
              </button>
            );
          })}
        </div>

        {!plan ? <Empty>Aucun parcours.</Empty> : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"><p className="text-xs text-gray-500">Collaborateur</p><p className="font-semibold">{plan.employeeName}</p><p className="text-xs text-gray-400">{plan.jobTitle}</p></div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"><p className="text-xs text-gray-500 flex items-center gap-1"><UserCheck className="w-3.5 h-3.5" />Parrain (buddy)</p><p className="font-semibold">{plan.buddyName || 'Non désigné'}</p></div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"><p className="text-xs text-gray-500">Fin de période d'essai</p><p className="font-semibold">{plan.trialPeriodEndDate ? fmtDate(plan.trialPeriodEndDate) : 'Sans période d\'essai'}</p></div>
            </div>
            <Panel title="Checklist d'intégration">
              <div className="divide-y divide-gray-100">
                {Object.entries(grouped).map(([cat, tasks]) => (
                  <div key={cat} className="p-4">
                    <p className="text-xs font-semibold uppercase text-gray-400 mb-2">{CAT[cat] || cat}</p>
                    <ul className="space-y-1">
                      {tasks.map((t) => (
                        <li key={t.id}>
                          <button className="w-full flex items-start gap-3 text-left p-2 rounded-lg hover:bg-gray-50" aria-pressed={t.isCompleted} onClick={async () => { if (await act('post', `/onboarding/tasks/${t.id}/complete`)) plans.reload(); }}>
                            {t.isCompleted ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> : <Circle className="w-5 h-5 text-gray-300 shrink-0" />}
                            <span className="flex-1 min-w-0">
                              <span className={`block text-sm ${t.isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>{t.title}</span>
                              <span className="block text-xs text-gray-400">{t.description}</span>
                            </span>
                            <span className="flex flex-col items-end gap-1 shrink-0">
                              <Pill tone={PRIO[t.priority]}>{PRIO_L[t.priority]}</Pill>
                              <span className={`text-xs ${!t.isCompleted && t.dueDate < today ? 'text-red-500' : 'text-gray-400'}`}>{fmtDate(t.dueDate)}</span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Kit de bienvenue">
              <ul className="divide-y divide-gray-50">
                {plan.welcomeDocuments.map((w: any) => (
                  <li key={w.id} className="flex items-center justify-between px-4 py-2.5 text-sm gap-2">
                    <span>{w.title}</span>
                    {!w.requiresSignature ? <span className="text-xs text-gray-400">Lecture seule</span> : w.isSigned ? <Pill tone="green">Signé</Pill> : (
                      <button className="btn-ghost !py-1 !px-2 text-xs" onClick={async () => { if (await act('post', `/onboarding/documents/${w.id}/sign`)) plans.reload(); }}><FileSignature className="w-3.5 h-3.5" />Signer</button>
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
            <Note>Les tâches proviennent de <code>OnboardingTemplateService</code> : socle commun (administratif, informatique, formation, manager, RH) complété selon l'intitulé du poste (développeur, commercial, RH) et l'existence d'une période d'essai.</Note>
          </div>
        )}
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title="Générer un parcours d'intégration"
        footer={<><button className="btn-ghost" onClick={() => setOpen(false)}>Annuler</button><button className="btn-primary" disabled={!form.employeeId} onClick={async () => { if (await act('post', '/onboarding/plans', form)) { setOpen(false); plans.reload(); setSel(null); } }}>Générer</button></>}>
        <div className="space-y-3">
          <Field label="Nouveau collaborateur"><select className="input" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}><option value="">Choisir…</option>{without.map((e) => <option key={e.id} value={e.id}>{e.fullName} · {e.jobTitle}</option>)}</select></Field>
          <Field label="Parrain"><select className="input" value={form.buddyId} onChange={(e) => setForm({ ...form, buddyId: e.target.value })}><option value="">Aucun</option>{(emps.data?.items ?? []).filter((e) => e.status === 'Active').map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}</select></Field>
        </div>
      </Dialog>
    </div>
  );
};

export default OnboardingPage;
