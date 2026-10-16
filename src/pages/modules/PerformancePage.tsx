import React, { useState } from 'react';
import { BarChart3, MessageSquare, Save } from 'lucide-react';
import { act, Dialog, Field, fmtDate, PageHeader, Panel, Pill, Spinner, Tabs, useApi, useEmployees } from './ui';

const OBJ: Record<string, [string, 'gray' | 'blue' | 'amber' | 'green' | 'red']> = { NotStarted: ['Non démarré', 'gray'], InProgress: ['En cours', 'blue'], AtRisk: ['À risque', 'amber'], Achieved: ['Atteint', 'green'], NotAchieved: ['Non atteint', 'red'] };
const LEVEL: Record<string, string> = { Individual: 'Individuel', Team: 'Équipe', Department: 'Département', Company: 'Entreprise' };
const REVIEW_TYPE: Record<string, string> = { Annual: 'Annuel', SemiAnnual: 'Semestriel', Quarterly: 'Trimestriel', TrialPeriodEnd: "Fin d'essai", Review360: '360°' };
const REVIEW_STATUS: Record<string, [string, 'gray' | 'blue' | 'amber' | 'purple' | 'green']> = { Draft: ['Brouillon', 'gray'], EmployeeSelfReview: ['Auto-évaluation', 'blue'], ManagerReview: ['Évaluation manager', 'amber'], HRValidation: ['Validation RH', 'purple'], Completed: ['Terminé', 'green'] };
const FB: Record<string, [string, 'green' | 'amber' | 'gray']> = { Recognition: ['Reconnaissance', 'green'], Improvement: ['Axe de progrès', 'amber'], General: ['Général', 'gray'] };

type Tab = 'objectives' | 'reviews' | 'feedback';

const PerformancePage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('objectives');
  const objectives = useApi<any[]>('/performance/objectives');
  const reviews = useApi<any[]>('/performance/reviews');
  const feedback = useApi<any[]>('/performance/feedback');
  const emps = useEmployees();
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [fbOpen, setFbOpen] = useState(false);
  const [fb, setFb] = useState({ toId: '', type: 'Recognition', content: '' });

  return (
    <div className="min-h-full bg-gray-50">
      <PageHeader icon={<BarChart3 className="w-5 h-5" />} color="bg-blue-600" title="Performance" subtitle="Objectifs OKR, entretiens d'évaluation et feedback continu"
        actions={<button className="btn-primary" onClick={() => setFbOpen(true)}><MessageSquare className="w-4 h-4" />Donner un feedback</button>} />
      <div className="px-4 sm:px-6 py-4 space-y-4">
        <Tabs<Tab> value={tab} onChange={setTab} tabs={[{ id: 'objectives', label: 'Objectifs', count: objectives.data?.length }, { id: 'reviews', label: 'Entretiens', count: reviews.data?.length }, { id: 'feedback', label: 'Feedback', count: feedback.data?.length }]} />

        {tab === 'objectives' && (objectives.loading ? <Spinner /> : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {(objectives.data ?? []).map((o) => {
              const dirty = o.keyResults.some((k: any) => edits[k.id] !== undefined && edits[k.id] !== k.current);
              return (
                <Panel key={o.id} title={o.title} actions={<Pill tone={OBJ[o.status][1]}>{OBJ[o.status][0]}</Pill>}>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 flex-wrap gap-2">
                      <span>{o.employeeName} · {LEVEL[o.level] || o.level} · {fmtDate(o.startDate)} au {fmtDate(o.endDate)}</span>
                      <span className="font-semibold text-gray-800 text-sm">{o.progress} %</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full"><div className="h-2 bg-blue-600 rounded-full transition-all" style={{ width: `${o.progress}%` }} /></div>
                    {o.keyResults.map((k: any) => (
                      <div key={k.id} className="flex items-center gap-3 text-sm flex-wrap">
                        <span className="flex-1 min-w-[160px] text-gray-700">{k.title}</span>
                        <input type="number" min={0} aria-label={`Valeur actuelle : ${k.title}`} className="input !w-24 !py-1" value={edits[k.id] ?? k.current} onChange={(e) => setEdits({ ...edits, [k.id]: Number(e.target.value) })} />
                        <span className="text-xs text-gray-500 w-28">/ {k.target} {k.unit}</span>
                        <span className="text-xs font-medium w-10 text-right">{k.progress} %</span>
                      </div>
                    ))}
                    {dirty && <button className="btn-primary text-xs" onClick={async () => {
                      const kr: Record<string, number> = {}; o.keyResults.forEach((k: any) => { if (edits[k.id] !== undefined) kr[k.id] = edits[k.id]; });
                      if (await act('put', `/performance/objectives/${o.id}`, { keyResultsProgress: kr })) { setEdits({}); objectives.reload(); }
                    }}><Save className="w-3.5 h-3.5" />Enregistrer l'avancement</button>}
                  </div>
                </Panel>
              );
            })}
          </div>
        ))}

        {tab === 'reviews' && (
          <Panel>{reviews.loading ? <Spinner /> : (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100"><th className="th">Collaborateur</th><th className="th">Évaluateur</th><th className="th">Type</th><th className="th">Période</th><th className="th">Date</th><th className="th">Note</th><th className="th">Étape</th></tr></thead>
              <tbody className="divide-y divide-gray-50">{(reviews.data ?? []).map((r) => (
                <tr key={r.id}><td className="td"><p className="font-medium">{r.employeeName}</p>{r.strengths && <p className="text-xs text-gray-400">Forces : {r.strengths} · À travailler : {r.areasForImprovement}</p>}</td><td className="td">{r.reviewerName}</td><td className="td">{REVIEW_TYPE[r.type]}</td><td className="td">{r.period}</td><td className="td text-gray-500">{fmtDate(r.completedAt || r.scheduledDate)}</td><td className="td">{r.overallScore != null ? `${r.overallScore.toFixed(1)} / 5` : ''}</td><td className="td"><Pill tone={REVIEW_STATUS[r.status][1]}>{REVIEW_STATUS[r.status][0]}</Pill></td></tr>
              ))}</tbody></table></div>
          )}</Panel>
        )}

        {tab === 'feedback' && (
          <div className="space-y-3 max-w-3xl">{(feedback.data ?? []).map((f) => (
            <div key={f.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2 flex-wrap"><p className="text-sm"><span className="font-semibold">{f.fromName}</span> <span className="text-gray-400">à</span> <span className="font-semibold">{f.toName}</span></p><span className="flex items-center gap-2"><Pill tone={FB[f.type][1]}>{FB[f.type][0]}</Pill><span className="text-xs text-gray-400">{fmtDate(f.createdAt)}</span></span></div>
              <p className="text-sm text-gray-700 mt-2">{f.content}</p>
            </div>
          ))}</div>
        )}
      </div>

      <Dialog open={fbOpen} onClose={() => setFbOpen(false)} title="Feedback continu"
        footer={<><button className="btn-ghost" onClick={() => setFbOpen(false)}>Annuler</button><button className="btn-primary" disabled={!fb.toId || !fb.content.trim()} onClick={async () => { if (await act('post', '/performance/feedback', fb)) { setFbOpen(false); setFb({ toId: '', type: 'Recognition', content: '' }); feedback.reload(); setTab('feedback'); } }}>Envoyer</button></>}>
        <div className="space-y-3">
          <Field label="Destinataire"><select className="input" value={fb.toId} onChange={(e) => setFb({ ...fb, toId: e.target.value })}><option value="">Choisir…</option>{(emps.data?.items ?? []).filter((e) => !['Resigned', 'Terminated'].includes(e.status) && e.id !== 'e2').map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}</select></Field>
          <Field label="Type"><select className="input" value={fb.type} onChange={(e) => setFb({ ...fb, type: e.target.value })}>{Object.entries(FB).map(([k, v]) => <option key={k} value={k}>{v[0]}</option>)}</select></Field>
          <Field label="Message"><textarea className="input min-h-[90px]" value={fb.content} onChange={(e) => setFb({ ...fb, content: e.target.value })} /></Field>
        </div>
      </Dialog>
    </div>
  );
};

export default PerformancePage;
