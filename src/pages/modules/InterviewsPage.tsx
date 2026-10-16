import React, { useState } from 'react';
import { Video, Plus, MapPin, Clock, CheckCircle, XCircle } from 'lucide-react';
import { act, Dialog, Empty, Field, fmtDateTime, PageHeader, Panel, Pill, Spinner, useApi, useEmployees } from './ui';

const TYPE: Record<string, string> = { InPerson: 'Présentiel', VideoSync: 'Visio en direct', VideoAsync: 'Vidéo différée', Phone: 'Téléphone', Panel: 'Jury' };
const STATUS: Record<string, [string, 'blue' | 'amber' | 'green' | 'red' | 'gray']> = { Scheduled: ['Programmé', 'blue'], InProgress: ['En cours', 'amber'], Completed: ['Terminé', 'green'], Cancelled: ['Annulé', 'red'], NoShow: ['Absent', 'gray'] };
const CRIT: [string, string][] = [['technical', 'Technique'], ['communication', 'Communication'], ['motivation', 'Motivation'], ['culture', 'Adéquation culture']];

const InterviewsPage: React.FC = () => {
  const interviews = useApi<any[]>('/interviews');
  const apps = useApi<{ items: any[] }>('/recruitment/applications', { pageSize: 100 });
  const emps = useEmployees();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ applicationId: '', type: 'VideoSync', scheduledDate: '', durationMinutes: 45, location: '', interviewerId: '' });
  const now = Date.now();
  const list = interviews.data ?? [];
  const upcoming = list.filter((i) => i.status === 'Scheduled' && Date.parse(i.scheduledDate) >= now - 3600000);
  const past = list.filter((i) => !upcoming.includes(i));

  const Card: React.FC<{ i: any }> = ({ i }) => (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div><p className="font-semibold text-gray-900">{i.candidateName}</p><p className="text-xs text-gray-500">{i.jobTitle}</p></div>
        <Pill tone={STATUS[i.status][1]}>{STATUS[i.status][0]}</Pill>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmtDateTime(i.scheduledDate)} · {i.durationMinutes} min</span>
        <span>{TYPE[i.type]}</span>
        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{i.isOnline ? `Visio, réunion ${i.onlineMeetingId} (lien généré, simulé)` : i.location}</span>
      </div>
      <p className="text-xs text-gray-500">Jury : {i.interviewers.join(', ') || 'à désigner'}</p>
      {i.feedbacks.length > 0 && (
        <div className="overflow-x-auto"><table className="w-full text-xs mt-1">
          <thead><tr className="text-gray-400"><th className="text-left font-medium py-1">Évaluateur</th>{CRIT.map(([k, l]) => <th key={k} className="font-medium py-1 px-1">{l}</th>)}<th className="text-left font-medium py-1">Avis</th></tr></thead>
          <tbody>{i.feedbacks.map((f: any) => (
            <tr key={f.interviewerId} className="border-t border-gray-100"><td className="py-1">{f.interviewerName}</td>{CRIT.map(([k]) => <td key={k} className="text-center">{f[k]}/5</td>)}<td className="py-1">{f.recommendation}<span className="block text-gray-400">{f.comment}</span></td></tr>
          ))}</tbody></table></div>
      )}
      {i.status === 'Scheduled' && (
        <div className="flex gap-2 pt-1">
          <button className="btn-ghost !py-1 !px-2 text-xs" onClick={async () => { if (await act('post', `/interviews/${i.id}/complete`)) interviews.reload(); }}><CheckCircle className="w-3.5 h-3.5" />Marquer terminé</button>
          <button className="btn-danger !py-1 !px-2 text-xs" onClick={async () => { if (await act('post', `/interviews/${i.id}/cancel`)) interviews.reload(); }}><XCircle className="w-3.5 h-3.5" />Annuler</button>
        </div>
      )}
    </div>
  );

  const online = ['VideoSync', 'VideoAsync'].includes(form.type);
  return (
    <div className="min-h-full bg-gray-50">
      <PageHeader icon={<Video className="w-5 h-5" />} color="bg-pink-600" title="Entretiens" subtitle="Planning, visio, jurys et grilles d'évaluation"
        actions={<button className="btn-primary" onClick={() => setOpen(true)}><Plus className="w-4 h-4" />Programmer</button>} />
      <div className="px-4 sm:px-6 py-4 space-y-4">
        {interviews.loading ? <Spinner /> : (<>
          <Panel title={`À venir (${upcoming.length})`}><div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-3">{upcoming.length ? upcoming.map((i) => <Card key={i.id} i={i} />) : <Empty>Aucun entretien programmé.</Empty>}</div></Panel>
          <Panel title={`Historique (${past.length})`}><div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-3">{past.map((i) => <Card key={i.id} i={i} />)}</div></Panel>
        </>)}
      </div>
      <Dialog open={open} onClose={() => setOpen(false)} title="Programmer un entretien"
        footer={<><button className="btn-ghost" onClick={() => setOpen(false)}>Annuler</button><button className="btn-primary" disabled={!form.applicationId || !form.scheduledDate} onClick={async () => {
          if (await act('post', '/interviews', { ...form, scheduledDate: new Date(form.scheduledDate).toISOString(), isOnline: online, interviewerIds: form.interviewerId ? [form.interviewerId] : [] })) { setOpen(false); interviews.reload(); }
        }}>Programmer</button></>}>
        <div className="space-y-3">
          <Field label="Candidature"><select className="input" value={form.applicationId} onChange={(e) => setForm({ ...form, applicationId: e.target.value })}><option value="">Choisir…</option>{(apps.data?.items ?? []).filter((a) => !['Rejected', 'Withdrawn', 'Hired'].includes(a.status)).map((a) => <option key={a.id} value={a.id}>{a.candidateName} · {a.jobTitle}</option>)}</select></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Format"><select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{Object.entries(TYPE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
            <Field label="Durée (min)"><input type="number" min={15} step={15} className="input" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} /></Field>
          </div>
          <Field label="Date et heure"><input type="datetime-local" className="input" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} /></Field>
          {!online && <Field label="Lieu"><input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Siège Douala, salle Sanaga" /></Field>}
          <Field label="Évaluateur"><select className="input" value={form.interviewerId} onChange={(e) => setForm({ ...form, interviewerId: e.target.value })}><option value="">À désigner</option>{(emps.data?.items ?? []).filter((e) => e.status === 'Active').map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}</select></Field>
          {online && <p className="text-xs text-gray-400">Format en ligne : un identifiant de réunion est généré, comme dans <code>InterviewsController</code> (intégration Zoom/Teams non branchée).</p>}
        </div>
      </Dialog>
    </div>
  );
};

export default InterviewsPage;
