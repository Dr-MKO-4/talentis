import React, { useEffect, useState } from 'react';
import { Target, MapPin, Eye as EyeIcon, Send, Lock, Star, StickyNote, ChevronRight, ChevronLeft } from 'lucide-react';
import { act, call, Dialog, Empty, fmtDate, fmtMoney, PageHeader, Panel, Pill, Spinner, Stat, Tabs, useApi } from './ui';

const COLUMNS: { id: string; label: string; tone: string }[] = [
  { id: 'Received', label: 'Reçues', tone: 'border-t-gray-400' },
  { id: 'Shortlisted', label: 'Présélection', tone: 'border-t-blue-500' },
  { id: 'Tested', label: 'Testées', tone: 'border-t-purple-500' },
  { id: 'Interviewed', label: 'Entretien', tone: 'border-t-pink-500' },
  { id: 'SecondInterview', label: '2e entretien', tone: 'border-t-orange-500' },
  { id: 'OfferSent', label: 'Offre envoyée', tone: 'border-t-amber-500' },
  { id: 'Hired', label: 'Embauché(e)', tone: 'border-t-emerald-500' },
  { id: 'Rejected', label: 'Refusée', tone: 'border-t-red-500' },
  { id: 'Withdrawn', label: 'Retirée', tone: 'border-t-gray-300' },
];
const FLOW = COLUMNS.slice(0, 7).map((c) => c.id);
const JOB_STATUS: Record<string, [string, 'gray' | 'green' | 'red' | 'blue']> = { Draft: ['Brouillon', 'gray'], Published: ['Publiée', 'green'], Closed: ['Clôturée', 'red'], Archived: ['Archivée', 'gray'] };
const CONTRACT: Record<string, string> = { CDI: 'CDI', CDD: 'CDD', Internship: 'Stage', Freelance: 'Freelance' };

type Tab = 'pipeline' | 'jobs' | 'candidates';

const RecruitmentPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('pipeline');
  const jobs = useApi<{ items: any[] }>('/recruitment/jobs', { pageSize: 50 });
  const candidates = useApi<{ items: any[] }>('/recruitment/candidates', { pageSize: 100 });
  const analytics = useApi<any>('/recruitment/analytics');
  const [jobId, setJobId] = useState('jb1');
  const [pipeline, setPipeline] = useState<any | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [note, setNote] = useState('');

  const loadPipeline = async () => setPipeline(await call('get', `/recruitment/jobs/${jobId}/pipeline`));
  useEffect(() => { loadPipeline(); }, [jobId]);

  const move = async (app: any, status: string) => {
    if (await act('put', `/recruitment/applications/${app.id}`, { status })) { await loadPipeline(); analytics.reload(); jobs.reload(); if (selected?.id === app.id) setSelected({ ...app, status }); }
  };
  const job = jobs.data?.items.find((j) => j.id === jobId);
  const a = analytics.data;

  return (
    <div className="min-h-full bg-gray-50">
      <PageHeader icon={<Target className="w-5 h-5" />} color="bg-orange-500" title="Recrutement" subtitle="ATS : offres, pipeline Kanban et CVthèque" />
      <div className="px-4 sm:px-6 py-4 space-y-4">
        {a && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Offres publiées" value={a.activeJobPostings} sub={`${a.totalJobPostings} offres au total`} />
            <Stat label="Candidatures" value={a.totalApplications} />
            <Stat label="Candidats" value={a.totalCandidates} />
            <Stat label="CVthèque" value={a.talentPoolSize} sub="candidats conservés" />
          </div>
        )}
        <Tabs<Tab> value={tab} onChange={setTab} tabs={[{ id: 'pipeline', label: 'Pipeline' }, { id: 'jobs', label: 'Offres', count: jobs.data?.items.length }, { id: 'candidates', label: 'Candidats', count: candidates.data?.items.length }]} />

        {tab === 'pipeline' && (
          <>
            <div className="flex items-center gap-3 flex-wrap">
              <label className="text-sm text-gray-500" htmlFor="job-select">Offre</label>
              <select id="job-select" className="input !w-auto max-w-full" value={jobId} onChange={(e) => setJobId(e.target.value)}>
                {(jobs.data?.items ?? []).map((j) => <option key={j.id} value={j.id}>{j.title} · {j.location} ({j.applicationCount})</option>)}
              </select>
              {job && <Pill tone={JOB_STATUS[job.status][1]}>{JOB_STATUS[job.status][0]}</Pill>}
            </div>
            {!pipeline ? <Spinner /> : (
              <div className="flex gap-3 overflow-x-auto pb-3" data-testid="kanban">
                {COLUMNS.map((col) => (
                  <div key={col.id} className={`w-64 shrink-0 bg-gray-100/70 rounded-xl border-t-4 ${col.tone}`}>
                    <div className="flex items-center justify-between px-3 py-2">
                      <p className="text-sm font-semibold text-gray-700">{col.label}</p>
                      <span className="text-xs bg-white px-2 py-0.5 rounded-full text-gray-500">{pipeline.counts[col.id] ?? 0}</span>
                    </div>
                    <div className="px-2 pb-2 space-y-2 min-h-[60px]">
                      {(pipeline.columns[col.id] ?? []).map((app: any) => {
                        const i = FLOW.indexOf(app.status);
                        return (
                          <div key={app.id} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                            <button className="text-left w-full" onClick={() => setSelected(app)}>
                              <p className="font-semibold text-sm text-gray-900 hover:text-blue-600">{app.candidateName}</p>
                              <p className="text-xs text-gray-500">{app.candidateCity} · {app.source}</p>
                              <p className="text-xs text-gray-400 mt-1">Reçue le {fmtDate(app.createdAt)}{app.notes?.length ? ` · ${app.notes.length} note` : ''}</p>
                            </button>
                            {i >= 0 && (
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                                <button disabled={i === 0} onClick={() => move(app, FLOW[i - 1])} className="p-1 rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30" aria-label={`Reculer ${app.candidateName}`}><ChevronLeft className="w-4 h-4" /></button>
                                <button onClick={() => move(app, 'Rejected')} className="text-xs text-red-500 hover:underline">Refuser</button>
                                <button disabled={i === FLOW.length - 1} onClick={() => move(app, FLOW[i + 1])} className="p-1 rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30" aria-label={`Avancer ${app.candidateName}`}><ChevronRight className="w-4 h-4" /></button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'jobs' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {jobs.loading ? <Spinner /> : (jobs.data?.items ?? []).map((j) => (
              <div key={j.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div><p className="font-semibold text-gray-900">{j.title}</p><p className="text-xs text-gray-500">{j.departmentName}</p></div>
                  <Pill tone={JOB_STATUS[j.status][1]}>{JOB_STATUS[j.status][0]}</Pill>
                </div>
                <p className="text-sm text-gray-600 mt-2 flex-1">{j.description}</p>
                <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-3">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{j.location}</span>
                  <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded">{CONTRACT[j.contractType] || j.contractType}</span>
                  <span className="flex items-center gap-1"><EyeIcon className="w-3 h-3" />{j.viewCount} vues</span>
                  <span>{j.applicationCount} candidature{j.applicationCount > 1 ? 's' : ''}</span>
                </div>
                {j.displaySalary && j.salaryMin && <p className="text-xs text-gray-500 mt-2">{fmtMoney(j.salaryMin, j.currency)} à {fmtMoney(j.salaryMax, j.currency)} / mois</p>}
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  {j.status === 'Draft' && <button className="btn-primary text-xs" onClick={async () => { if (await act('post', `/recruitment/jobs/${j.id}/publish`)) { jobs.reload(); analytics.reload(); } }}><Send className="w-3.5 h-3.5" />Publier</button>}
                  {j.status === 'Published' && <button className="btn-ghost text-xs" onClick={async () => { if (await act('post', `/recruitment/jobs/${j.id}/close`)) { jobs.reload(); analytics.reload(); } }}><Lock className="w-3.5 h-3.5" />Clôturer</button>}
                  <button className="btn-ghost text-xs" onClick={() => { setJobId(j.id); setTab('pipeline'); }}>Voir le pipeline</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'candidates' && (
          <Panel>
            {candidates.loading ? <Spinner /> : (
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-100"><th className="th">Candidat</th><th className="th">Ville</th><th className="th">Source</th><th className="th">Candidatures</th><th className="th">CVthèque</th></tr></thead>
                <tbody className="divide-y divide-gray-50">{(candidates.data?.items ?? []).map((c) => (
                  <tr key={c.id}><td className="td"><p className="font-medium">{c.fullName}</p><p className="text-xs text-gray-400">{c.email} · {c.phone}</p></td><td className="td text-gray-500">{c.city}</td><td className="td text-gray-500">{c.source}</td><td className="td">{c.applicationCount}</td>
                    <td className="td"><button aria-pressed={c.isInTalentPool} aria-label={`CVthèque : ${c.fullName}`} onClick={async () => { if (await act(c.isInTalentPool ? 'delete' : 'post', `/recruitment/candidates/${c.id}/talent-pool`)) { candidates.reload(); analytics.reload(); } }}
                      className={`p-1.5 rounded-lg ${c.isInTalentPool ? 'text-amber-500 bg-amber-50' : 'text-gray-300 hover:text-amber-500'}`}><Star className="w-4 h-4" fill={c.isInTalentPool ? 'currentColor' : 'none'} /></button></td></tr>
                ))}</tbody></table></div>
            )}
          </Panel>
        )}
      </div>

      <Dialog open={!!selected} onClose={() => setSelected(null)} title={selected?.candidateName || ''}>
        {selected && (
          <div className="space-y-3 text-sm">
            <p className="text-gray-500">{selected.jobTitle}</p>
            <p>{selected.candidateEmail} · {selected.candidatePhone}</p>
            <label className="block"><span className="block text-xs font-medium text-gray-500 mb-1">Statut</span>
              <select className="input" value={selected.status} onChange={(e) => move(selected, e.target.value)}>
                {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </label>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><StickyNote className="w-3.5 h-3.5" />Notes internes</p>
              {(selected.notes ?? []).length === 0 ? <p className="text-gray-400 text-xs">Aucune note.</p> : selected.notes.map((n: any) => <p key={n.id} className="bg-gray-50 rounded-lg p-2 mb-1"><span className="text-xs text-gray-400">{n.authorName} · {fmtDate(n.createdAt)}</span><br />{n.content}</p>)}
              <div className="flex gap-2 mt-2">
                <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ajouter une note privée" aria-label="Nouvelle note" />
                <button className="btn-primary" disabled={!note.trim()} onClick={async () => { const n = await call('post', `/recruitment/applications/${selected.id}/notes`, { content: note, isPrivate: true }); setSelected({ ...selected, notes: [...(selected.notes ?? []), n] }); setNote(''); loadPipeline(); }}>Ajouter</button>
              </div>
            </div>
          </div>
        )}
      </Dialog>
      {!jobs.loading && !jobs.data && <Empty>Impossible de charger les offres.</Empty>}
    </div>
  );
};

export default RecruitmentPage;
