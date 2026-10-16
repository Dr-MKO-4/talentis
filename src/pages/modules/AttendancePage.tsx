import React, { useEffect, useMemo, useState } from 'react';
import { Clock, LogIn, LogOut, Plus, Check, X as XIcon } from 'lucide-react';
import { act, Dialog, Empty, Field, fmtDate, fmtDateTime, fmtMoney, Note, PageHeader, Panel, Pill, Spinner, Stat, Tabs, useApi, useEmployees } from './ui';
import { workingDays } from '../../demo/rules';

const LEAVE_TYPE: Record<string, string> = { PaidLeave: 'Congés payés', Sick: 'Maladie', Unpaid: 'Sans solde', RTT: 'RTT', Parental: 'Parental' };
const LEAVE_STATUS: Record<string, [string, 'amber' | 'green' | 'red' | 'gray']> = { Pending: ['En attente', 'amber'], Approved: ['Approuvé', 'green'], Rejected: ['Refusé', 'red'], Cancelled: ['Annulé', 'gray'] };
const OT_TYPE: Record<string, string> = { Regular: 'Hebdo (8 premières h)', ExtraRegular: 'Hebdo (au-delà de 8 h)', Daily: 'Dépassement quotidien' };
const ME = 'e2';

type Tab = 'leaves' | 'time' | 'overtime';

const AttendancePage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('leaves');
  const [statusFilter, setStatusFilter] = useState('');
  const leaves = useApi<{ items: any[] }>('/attendance/leave-requests', { pageSize: 100, status: statusFilter || undefined });
  const entries = useApi<any[]>('/attendance/time-entries');
  const overtime = useApi<any[]>('/attendance/overtime');
  const emps = useEmployees();
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const active = (entries.data ?? []).find((e) => !e.clockOut);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: ME, type: 'PaidLeave', startDate: '', endDate: '', reason: '' });
  const balances = useApi<any[]>(`/attendance/leave-balance/${form.employeeId}`);
  const empCountry = (emps.data?.items ?? []).find((e) => e.id === form.employeeId) as any;
  const preview = useMemo(() => (form.startDate && form.endDate && form.endDate >= form.startDate ? workingDays(form.startDate, form.endDate, empCountry?.countryCode || 'CM') : 0), [form, empCountry]);
  const bal = (balances.data ?? []).find((b) => b.type === form.type);

  const [reject, setReject] = useState<any | null>(null);
  const [reason, setReason] = useState('');
  const pending = (leaves.data?.items ?? []).filter((l) => l.status === 'Pending').length;
  const week = (entries.data ?? []).filter((e) => Date.parse(e.clockIn) > Date.now() - 7 * 86400000).reduce((s, e) => s + e.totalHours, 0);

  return (
    <div className="min-h-full bg-gray-50">
      <PageHeader icon={<Clock className="w-5 h-5" />} color="bg-yellow-500" title="Temps & Présences" subtitle="Badgeage, congés, soldes et heures supplémentaires"
        actions={<button className="btn-primary" onClick={() => { setOpen(true); balances.reload(); }}><Plus className="w-4 h-4" />Demande de congés</button>} />
      <div className="px-4 sm:px-6 py-4 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-medium text-gray-500">Mon badgeage (Aline Mbarga)</p>
              {active ? <p className="text-2xl font-bold text-emerald-600 tabular-nums" data-testid="clock-timer">{new Date(now - Date.parse(active.clockIn)).toISOString().slice(11, 19)}</p> : <p className="text-2xl font-bold text-gray-400">Hors service</p>}
              <p className="text-xs text-gray-400">{active ? `Entrée à ${new Date(active.clockIn).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : 'Aucun pointage en cours'}</p>
            </div>
            {active
              ? <button className="btn bg-red-600 text-white hover:bg-red-700" onClick={async () => { if (await act('post', '/attendance/clock-out')) { entries.reload(); overtime.reload(); } }}><LogOut className="w-4 h-4" />Badger la sortie</button>
              : <button className="btn bg-emerald-600 text-white hover:bg-emerald-700" onClick={async () => { if (await act('post', '/attendance/clock-in', { isRemote: false, location: 'Douala' })) entries.reload(); }}><LogIn className="w-4 h-4" />Badger l'entrée</button>}
          </div>
          <Stat label="Mes heures sur 7 jours" value={`${week.toFixed(1)} h`} sub="durée légale par défaut : 40 h" />
          <Stat label="Demandes à traiter" value={pending} tone="text-amber-600" />
        </div>

        <Tabs<Tab> value={tab} onChange={setTab} tabs={[{ id: 'leaves', label: 'Congés', count: leaves.data?.items.length }, { id: 'time', label: 'Mes pointages', count: entries.data?.length }, { id: 'overtime', label: 'Heures sup.', count: overtime.data?.length }]} />

        {tab === 'leaves' && (
          <Panel actions={<select className="input w-44" aria-label="Filtrer par statut" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="">Tous les statuts</option>{Object.entries(LEAVE_STATUS).map(([k, v]) => <option key={k} value={k}>{v[0]}</option>)}</select>} title="Demandes de congés">
            {leaves.loading ? <Spinner /> : (leaves.data?.items ?? []).length === 0 ? <Empty>Aucune demande.</Empty> : (
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-100"><th className="th">Collaborateur</th><th className="th">Type</th><th className="th">Période</th><th className="th">Jours ouvrés</th><th className="th">Statut</th><th className="th text-right">Décision</th></tr></thead>
                <tbody className="divide-y divide-gray-50">{(leaves.data?.items ?? []).map((l) => (
                  <tr key={l.id}><td className="td"><p className="font-medium">{l.employeeName}</p><p className="text-xs text-gray-400">{l.reason}</p></td><td className="td">{LEAVE_TYPE[l.type] || l.type}</td>
                    <td className="td whitespace-nowrap text-gray-500">{fmtDate(l.startDate)} au {fmtDate(l.endDate)}</td><td className="td">{l.daysCount}</td>
                    <td className="td"><Pill tone={LEAVE_STATUS[l.status][1]}>{LEAVE_STATUS[l.status][0]}</Pill>{l.rejectionReason && <p className="text-xs text-gray-400 mt-1">{l.rejectionReason}</p>}</td>
                    <td className="td"><div className="flex justify-end gap-1">{l.status === 'Pending' && (<>
                      <button className="btn-ghost !py-1 !px-2 text-xs text-emerald-700" onClick={async () => { if (await act('post', `/attendance/leave-requests/${l.id}/approve`)) leaves.reload(); }}><Check className="w-3.5 h-3.5" />Approuver</button>
                      <button className="btn-danger !py-1 !px-2 text-xs" onClick={() => { setReject(l); setReason(''); }}><XIcon className="w-3.5 h-3.5" />Refuser</button></>)}</div></td></tr>
                ))}</tbody></table></div>
            )}
          </Panel>
        )}

        {tab === 'time' && (
          <Panel title="Mes pointages">
            {entries.loading ? <Spinner /> : (
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-100"><th className="th">Entrée</th><th className="th">Sortie</th><th className="th">Durée</th><th className="th">Lieu</th><th className="th">Source</th></tr></thead>
                <tbody className="divide-y divide-gray-50">{(entries.data ?? []).map((e) => (
                  <tr key={e.id}><td className="td">{fmtDateTime(e.clockIn)}</td><td className="td">{e.clockOut ? fmtDateTime(e.clockOut) : <Pill tone="green">En cours</Pill>}</td><td className="td">{e.totalHours ? `${e.totalHours.toFixed(2)} h` : ''}</td><td className="td text-gray-500">{e.isRemote ? 'Télétravail' : e.location}</td><td className="td text-gray-500">{e.source === 'Badge' ? 'Badge' : 'Pointage virtuel'}</td></tr>
                ))}</tbody></table></div>
            )}
          </Panel>
        )}

        {tab === 'overtime' && (
          <Panel title="Heures supplémentaires détectées">
            {overtime.loading ? <Spinner /> : (
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-100"><th className="th">Collaborateur</th><th className="th">Date</th><th className="th">Type</th><th className="th">Heures</th><th className="th">Majoration</th><th className="th text-right">Montant</th><th className="th">Statut</th></tr></thead>
                <tbody className="divide-y divide-gray-50">{(overtime.data ?? []).map((o) => (
                  <tr key={o.id}><td className="td font-medium">{o.employeeName}</td><td className="td text-gray-500">{fmtDate(o.date)}</td><td className="td">{OT_TYPE[o.type] || o.type}</td><td className="td">{o.hours.toFixed(2)} h</td><td className="td">× {o.rate}</td><td className="td text-right whitespace-nowrap">{fmtMoney(Math.round(o.amount), o.currency)}</td>
                    <td className="td">{o.isApproved ? <Pill tone="green">Approuvées</Pill> : <button className="btn-ghost !py-1 !px-2 text-xs" onClick={async () => { if (await act('post', `/attendance/overtime/${o.id}/approve`)) overtime.reload(); }}>Approuver</button>}</td></tr>
                ))}</tbody></table></div>
            )}
            <div className="p-3"><Note>Détection reprise de <code>AttendanceCalculationService</code> : au-delà de la durée hebdomadaire légale (France 35 h, autres pays 40 h) et de la durée quotidienne (France 10 h, autres pays 8 h). Montant = heures × salaire de base / 151,67 × majoration.</Note></div>
          </Panel>
        )}
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} title="Nouvelle demande de congés"
        footer={<><button className="btn-ghost" onClick={() => setOpen(false)}>Annuler</button><button className="btn-primary" disabled={!preview} onClick={async () => { if (await act('post', '/attendance/leave-requests', form)) { setOpen(false); leaves.reload(); } }}>Envoyer la demande</button></>}>
        <div className="space-y-3">
          <Field label="Collaborateur">
            <select className="input" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
              {(emps.data?.items ?? []).filter((e) => !['Resigned', 'Terminated'].includes(e.status)).map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}
            </select>
          </Field>
          <Field label="Type">
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{Object.entries(LEAVE_TYPE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Du"><input type="date" className="input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Field>
            <Field label="Au"><input type="date" className="input" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></Field>
          </div>
          <Field label="Motif"><input className="input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Jours ouvrés demandés</p><p className="font-bold" data-testid="leave-preview">{preview}</p></div>
            <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Solde disponible</p><p className="font-bold">{bal ? `${bal.remainingDays} j / ${bal.totalDays}` : 'Aucun droit initialisé'}</p></div>
          </div>
          <p className="text-xs text-gray-400">Week-ends exclus ; jours fériés exclus pour la France uniquement (calendrier codé dans le backend). Une demande supérieure au solde est refusée.</p>
        </div>
      </Dialog>

      <Dialog open={!!reject} onClose={() => setReject(null)} title="Refuser la demande"
        footer={<><button className="btn-ghost" onClick={() => setReject(null)}>Annuler</button><button className="btn bg-red-600 text-white hover:bg-red-700" disabled={!reason.trim()} onClick={async () => { if (await act('post', `/attendance/leave-requests/${reject.id}/reject`, { reason })) { setReject(null); leaves.reload(); } }}>Refuser</button></>}>
        <Field label="Raison du refus (envoyée par e-mail au collaborateur)"><input className="input" value={reason} onChange={(e) => setReason(e.target.value)} autoFocus /></Field>
      </Dialog>
    </div>
  );
};

export default AttendancePage;
