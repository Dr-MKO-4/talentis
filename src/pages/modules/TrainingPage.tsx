import React, { useState } from 'react';
import { BookOpen, Award, UserPlus, Monitor, Users } from 'lucide-react';
import { act, Dialog, Field, fmtDate, fmtMoney, PageHeader, Panel, Pill, Spinner, Tabs, useApi, useEmployees } from './ui';

const TYPE: Record<string, string> = { Internal: 'Interne', External: 'Externe', ELearning: 'E-learning', Webinar: 'Webinaire', Workshop: 'Atelier' };
const SESSION: Record<string, [string, 'gray' | 'blue' | 'green' | 'red']> = { Planned: ['Planifiée', 'blue'], InProgress: ['En cours', 'gray'], Completed: ['Terminée', 'green'], Cancelled: ['Annulée', 'red'] };
const ENR: Record<string, [string, 'gray' | 'blue' | 'green' | 'red' | 'amber']> = { Registered: ['Inscrit(e)', 'blue'], InProgress: ['En cours', 'amber'], Completed: ['Validée', 'green'], Failed: ['Non validée', 'red'], Cancelled: ['Annulée', 'gray'] };

type Tab = 'sessions' | 'catalog' | 'certifications';

const TrainingPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('sessions');
  const courses = useApi<any[]>('/training/courses');
  const sessions = useApi<any[]>('/training/sessions');
  const enrollments = useApi<any[]>('/training/enrollments');
  const certs = useApi<any[]>('/training/certifications/expiring', { daysAhead: 90 });
  const emps = useEmployees();
  const [enrollFor, setEnrollFor] = useState<any | null>(null);
  const [empId, setEmpId] = useState('');

  return (
    <div className="min-h-full bg-gray-50">
      <PageHeader icon={<BookOpen className="w-5 h-5" />} color="bg-teal-600" title="Formation" subtitle="Catalogue, sessions, inscriptions et certifications" />
      <div className="px-4 sm:px-6 py-4 space-y-4">
        <Tabs<Tab> value={tab} onChange={setTab} tabs={[{ id: 'sessions', label: 'Sessions', count: sessions.data?.length }, { id: 'catalog', label: 'Catalogue', count: courses.data?.length }, { id: 'certifications', label: 'Certifications à renouveler', count: certs.data?.length }]} />

        {tab === 'sessions' && (sessions.loading ? <Spinner /> : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {(sessions.data ?? []).map((s) => {
              const list = (enrollments.data ?? []).filter((e) => e.sessionId === s.id);
              return (
                <Panel key={s.id} title={s.courseTitle} actions={<Pill tone={SESSION[s.status][1]}>{SESSION[s.status][0]}</Pill>}>
                  <div className="p-4 space-y-3">
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span>{fmtDate(s.startDate)}{s.endDate !== s.startDate ? ` au ${fmtDate(s.endDate)}` : ''}</span><span>{s.location}</span><span>Animée par {s.instructor}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{s.enrolledCount}{s.maxParticipants ? ` / ${s.maxParticipants}` : ''} inscrits</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full"><div className="h-1.5 bg-teal-500 rounded-full" style={{ width: `${Math.min(100, (s.enrolledCount / (s.maxParticipants || 1)) * 100)}%` }} /></div>
                    <ul className="divide-y divide-gray-50 text-sm">
                      {list.map((e) => (
                        <li key={e.id} className="flex items-center justify-between py-1.5 gap-2">
                          <span>{e.employeeName}</span>
                          <span className="flex items-center gap-2">{e.progress > 0 && e.status !== 'Completed' && <span className="text-xs text-gray-400">{e.progress} %</span>}{e.score != null && <span className="text-xs text-gray-400">note {e.score}/100</span>}<Pill tone={ENR[e.status][1]}>{ENR[e.status][0]}</Pill></span>
                        </li>
                      ))}
                    </ul>
                    {s.status === 'Planned' && <button className="btn-ghost text-xs" onClick={() => { setEnrollFor(s); setEmpId(''); }}><UserPlus className="w-3.5 h-3.5" />Inscrire un collaborateur</button>}
                  </div>
                </Panel>
              );
            })}
          </div>
        ))}

        {tab === 'catalog' && (courses.loading ? <Spinner /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {(courses.data ?? []).map((c) => (
              <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2"><p className="font-semibold text-gray-900">{c.title}</p>{c.isOnline && <Monitor className="w-4 h-4 text-gray-400 shrink-0" aria-label="En ligne" />}</div>
                <p className="text-sm text-gray-600 mt-1">{c.description}</p>
                <div className="flex flex-wrap gap-2 mt-3 text-xs">
                  <Pill tone="blue">{TYPE[c.type]}</Pill><Pill tone="gray">{c.durationHours} h</Pill>{c.leadsToCertification && <Pill tone="purple">Certifiante</Pill>}<Pill tone="gray">{c.languageCode.toUpperCase()}</Pill>
                </div>
                <p className="text-xs text-gray-500 mt-3">{c.sessionCount} session{c.sessionCount > 1 ? 's' : ''} · {c.enrollmentCount} inscription{c.enrollmentCount > 1 ? 's' : ''} · {c.cost ? `${fmtMoney(c.cost, c.currency)} / pers.` : 'Gratuit'}</p>
              </div>
            ))}
          </div>
        ))}

        {tab === 'certifications' && (
          <Panel title={<span className="flex items-center gap-2"><Award className="w-4 h-4 text-purple-500" />Expirées ou expirant sous 90 jours</span>}>
            {certs.loading ? <Spinner /> : (
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-100"><th className="th">Collaborateur</th><th className="th">Certification</th><th className="th">Organisme</th><th className="th">Expiration</th></tr></thead>
                <tbody className="divide-y divide-gray-50">{(certs.data ?? []).map((c) => (
                  <tr key={c.id}><td className="td font-medium">{c.employeeName}</td><td className="td">{c.name}</td><td className="td text-gray-500">{c.issuedBy}</td><td className="td">{c.isExpired ? <Pill tone="red">Expirée le {fmtDate(c.expiryDate)}</Pill> : <Pill tone="amber">{fmtDate(c.expiryDate)}</Pill>}</td></tr>
                ))}</tbody></table></div>
            )}
          </Panel>
        )}
      </div>

      <Dialog open={!!enrollFor} onClose={() => setEnrollFor(null)} title={`Inscription : ${enrollFor?.courseTitle || ''}`}
        footer={<><button className="btn-ghost" onClick={() => setEnrollFor(null)}>Annuler</button><button className="btn-primary" disabled={!empId} onClick={async () => { if (await act('post', '/training/enrollments', { sessionId: enrollFor.id, employeeId: empId })) { setEnrollFor(null); sessions.reload(); enrollments.reload(); courses.reload(); } }}>Inscrire</button></>}>
        <Field label="Collaborateur">
          <select className="input" value={empId} onChange={(e) => setEmpId(e.target.value)}>
            <option value="">Choisir…</option>
            {(emps.data?.items ?? []).filter((e) => !['Resigned', 'Terminated'].includes(e.status)).map((e) => <option key={e.id} value={e.id}>{e.fullName} · {e.jobTitle}</option>)}
          </select>
        </Field>
      </Dialog>
    </div>
  );
};

export default TrainingPage;
