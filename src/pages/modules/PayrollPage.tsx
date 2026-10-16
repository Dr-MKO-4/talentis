import React, { useMemo, useState } from 'react';
import { DollarSign, Calculator, CheckCircle, Banknote, Eye, Trash2 } from 'lucide-react';
import { act, call, Dialog, Empty, Field, fmtDate, fmtMoney, MONTHS, Note, PageHeader, Panel, Pill, Spinner, Stat, Tabs, useApi, useEmployees } from './ui';

const RUN_STATUS: Record<string, [string, 'gray' | 'blue' | 'green' | 'amber' | 'red']> = {
  Draft: ['Brouillon', 'gray'], Processing: ['En cours', 'amber'], Validated: ['Validée', 'blue'], Paid: ['Payée', 'green'], Cancelled: ['Annulée', 'red'],
};
const EXP_STATUS: Record<string, [string, 'gray' | 'blue' | 'green' | 'amber' | 'red' | 'purple']> = {
  Draft: ['Brouillon', 'gray'], Submitted: ['Soumise', 'amber'], ApprovedByManager: ['Validée manager', 'blue'], ApprovedByHR: ['Validée RH', 'purple'], Reimbursed: ['Remboursée', 'green'], Rejected: ['Rejetée', 'red'],
};
const BONUS_TYPE: Record<string, string> = { Individual: 'Individuelle', Collective: 'Collective', Exceptional: 'Exceptionnelle', Performance: 'Performance', Seniority: 'Ancienneté', Holiday: 'Vacances' };

type Tab = 'runs' | 'bonuses' | 'expenses';

const PayrollPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('runs');
  const now = new Date();
  const [period, setPeriod] = useState(`${now.getFullYear()}-${now.getMonth() + 1}`);
  const [year, month] = period.split('-').map(Number);
  const runs = useApi<{ items: any[] }>('/payroll/runs', { year, month, pageSize: 200 });
  const bonuses = useApi<any[]>('/payroll/bonuses');
  const expenses = useApi<any[]>('/payroll/expenses');
  const emps = useEmployees();
  const [detail, setDetail] = useState<any | null>(null);
  const [calcOpen, setCalcOpen] = useState(false);
  const [calcEmp, setCalcEmp] = useState('');

  const periods = useMemo(() => [2, 1, 0].map((b) => { const d = new Date(now.getFullYear(), now.getMonth() - b, 1); return { v: `${d.getFullYear()}-${d.getMonth() + 1}`, l: `${MONTHS[d.getMonth()]} ${d.getFullYear()}` }; }), []);
  const items = runs.data?.items ?? [];
  const eligible = (emps.data?.items ?? []).filter((e) => ['Active', 'OnLeave', 'TrialPeriod'].includes(e.status) && !items.some((r) => r.employeeId === e.id));
  const sumBy = (cur: string, k: string) => items.filter((r) => r.currency === cur).reduce((s, r) => s + r[k], 0);

  const refreshAll = () => { runs.reload(); bonuses.reload(); expenses.reload(); };
  const openDetail = async (id: string) => setDetail(await call('get', `/payroll/runs/${id}`));
  const calculate = async (employeeId: string) => { if (await act('post', '/payroll/runs/calculate', { employeeId, year, month })) runs.reload(); };
  const calculateAll = async () => { for (const e of eligible) await act('post', '/payroll/runs/calculate', { employeeId: e.id, year, month }); runs.reload(); setCalcOpen(false); };

  return (
    <div className="min-h-full bg-gray-50">
      <PageHeader icon={<DollarSign className="w-5 h-5" />} color="bg-emerald-600" title="Paie" subtitle="Bulletins mensuels, primes et notes de frais"
        actions={tab === 'runs' && <button className="btn-primary" onClick={() => setCalcOpen(true)}><Calculator className="w-4 h-4" />Calculer la paie</button>} />
      <div className="px-4 sm:px-6 py-4 space-y-4">
        <Tabs<Tab> value={tab} onChange={setTab} tabs={[
          { id: 'runs', label: 'Bulletins', count: items.length },
          { id: 'bonuses', label: 'Primes', count: bonuses.data?.length },
          { id: 'expenses', label: 'Notes de frais', count: expenses.data?.length },
        ]} />

        {tab === 'runs' && (<>
          <div className="flex items-end gap-3 flex-wrap">
            <Field label="Période">
              <select className="input w-52" value={period} onChange={(e) => setPeriod(e.target.value)} data-testid="payroll-period">
                {periods.map((p) => <option key={p.v} value={p.v}>{p.l}</option>)}
              </select>
            </Field>
            <p className="text-sm text-gray-500 pb-2">{items.length} bulletin{items.length > 1 ? 's' : ''} · {eligible.length} à calculer</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Stat label="Brut total (Cameroun, FCFA)" value={fmtMoney(sumBy('XAF', 'grossSalary'), 'XAF')} />
            <Stat label="Net total (Cameroun, FCFA)" value={fmtMoney(sumBy('XAF', 'netSalary'), 'XAF')} tone="text-emerald-700" />
            <Stat label="Charges patronales (Cameroun)" value={fmtMoney(sumBy('XAF', 'employerContributions'), 'XAF')} tone="text-gray-700" />
          </div>
          <Panel>
            {runs.loading ? <Spinner /> : items.length === 0 ? <Empty>Aucun bulletin pour cette période. Utilisez « Calculer la paie ».</Empty> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 border-b border-gray-100"><th className="th">Collaborateur</th><th className="th">Pays</th><th className="th text-right">Base</th><th className="th text-right">Brut</th><th className="th text-right">Net</th><th className="th">Statut</th><th className="th text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {items.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="td"><p className="font-semibold text-gray-900">{r.employeeName}</p><p className="text-xs text-gray-400">{r.employeeNumber} · {r.jobTitle}</p></td>
                        <td className="td"><span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono text-xs">{r.countryCode}</span></td>
                        <td className="td text-right whitespace-nowrap text-gray-500">{fmtMoney(r.baseSalary, r.currency)}</td>
                        <td className="td text-right whitespace-nowrap">{fmtMoney(r.grossSalary, r.currency)}</td>
                        <td className="td text-right whitespace-nowrap font-semibold">{fmtMoney(r.netSalary, r.currency)}</td>
                        <td className="td"><Pill tone={RUN_STATUS[r.status][1]}>{RUN_STATUS[r.status][0]}</Pill></td>
                        <td className="td">
                          <div className="flex justify-end gap-1">
                            <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Voir le bulletin" aria-label={`Voir le bulletin de ${r.employeeName}`} onClick={() => openDetail(r.id)}><Eye className="w-4 h-4" /></button>
                            {r.status === 'Draft' && <button className="btn-ghost !py-1 !px-2 text-xs" onClick={async () => { if (await act('post', `/payroll/runs/${r.id}/validate`)) runs.reload(); }}><CheckCircle className="w-3.5 h-3.5" />Valider</button>}
                            {r.status === 'Validated' && <button className="btn-ghost !py-1 !px-2 text-xs" onClick={async () => { if (await act('post', `/payroll/runs/${r.id}/pay`)) runs.reload(); }}><Banknote className="w-3.5 h-3.5" />Payer</button>}
                            {r.status !== 'Paid' && <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Supprimer" aria-label="Supprimer le bulletin" onClick={async () => { if (await act('delete', `/payroll/runs/${r.id}`)) runs.reload(); }}><Trash2 className="w-4 h-4" /></button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
          <Note>Calcul repris de <code>PayrollCalculationService</code> : brut = base + primes validées du mois ; cotisations, charges et impôt selon le pays. La France a ses taux détaillés ; le Cameroun et la Côte d'Ivoire n'étant pas paramétrés dans le code, ils suivent la branche par défaut (22 % salarié, 42 % employeur, 15 % d'impôt). Taux indicatifs, non conformes à une législation réelle.</Note>
        </>)}

        {tab === 'bonuses' && (
          <Panel>
            {bonuses.loading ? <Spinner /> : (
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-100"><th className="th">Collaborateur</th><th className="th">Type</th><th className="th">Motif</th><th className="th">Date d'effet</th><th className="th text-right">Montant</th><th className="th">Statut</th></tr></thead>
                <tbody className="divide-y divide-gray-50">{(bonuses.data ?? []).map((b) => (
                  <tr key={b.id}><td className="td font-medium">{b.employeeName}</td><td className="td">{BONUS_TYPE[b.type] || b.type}</td><td className="td text-gray-500">{b.reason}</td><td className="td text-gray-500">{fmtDate(b.effectiveDate)}</td><td className="td text-right whitespace-nowrap">{fmtMoney(b.amount, b.currency)}</td>
                    <td className="td">{b.isValidated ? <Pill tone="green">Validée</Pill> : <button className="btn-ghost !py-1 !px-2 text-xs" onClick={async () => { if (await act('post', `/payroll/bonuses/${b.id}/validate`)) bonuses.reload(); }}>Valider</button>}</td></tr>
                ))}</tbody></table></div>
            )}
            <div className="p-3"><Note>Seules les primes validées dont la date d'effet tombe dans le mois sont intégrées au calcul de la paie.</Note></div>
          </Panel>
        )}

        {tab === 'expenses' && (
          <Panel>
            {expenses.loading ? <Spinner /> : (
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead><tr className="bg-gray-50 border-b border-gray-100"><th className="th">Note</th><th className="th">Collaborateur</th><th className="th">Soumise le</th><th className="th text-right">Total</th><th className="th">Statut</th><th className="th text-right">Workflow</th></tr></thead>
                <tbody className="divide-y divide-gray-50">{(expenses.data ?? []).map((x) => {
                  const run = async (a: string) => { if (await act('post', `/payroll/expenses/${x.id}/${a}`)) expenses.reload(); };
                  return (
                    <tr key={x.id}><td className="td"><p className="font-medium">{x.title}</p><p className="text-xs text-gray-400">{x.lines.length} ligne{x.lines.length > 1 ? 's' : ''}</p></td><td className="td">{x.employeeName}</td><td className="td text-gray-500">{fmtDate(x.submittedAt)}</td>
                      <td className="td text-right whitespace-nowrap">{fmtMoney(x.totalAmount, x.currency)}</td><td className="td"><Pill tone={EXP_STATUS[x.status][1]}>{EXP_STATUS[x.status][0]}</Pill></td>
                      <td className="td"><div className="flex justify-end gap-1 flex-wrap">
                        {x.status === 'Draft' && <button className="btn-ghost !py-1 !px-2 text-xs" onClick={() => run('submit')}>Soumettre</button>}
                        {x.status === 'Submitted' && <button className="btn-ghost !py-1 !px-2 text-xs" onClick={() => run('approve-manager')}>Valider (manager)</button>}
                        {x.status === 'ApprovedByManager' && <button className="btn-ghost !py-1 !px-2 text-xs" onClick={() => run('approve-hr')}>Valider (RH)</button>}
                        {x.status === 'ApprovedByHR' && <button className="btn-ghost !py-1 !px-2 text-xs" onClick={() => run('reimburse')}>Rembourser</button>}
                        {['Submitted', 'ApprovedByManager'].includes(x.status) && <button className="btn-danger !py-1 !px-2 text-xs" onClick={() => run('reject')}>Rejeter</button>}
                      </div></td></tr>
                  );
                })}</tbody></table></div>
            )}
            <div className="p-3"><Note>Circuit du contrôleur : brouillon, soumission (au moins une ligne), validation manager, validation RH, puis remboursement.</Note></div>
          </Panel>
        )}
      </div>

      <Dialog open={calcOpen} onClose={() => setCalcOpen(false)} title={`Calculer la paie de ${MONTHS[month - 1]} ${year}`}
        footer={<><button className="btn-ghost" onClick={() => setCalcOpen(false)}>Fermer</button><button className="btn-primary" disabled={!eligible.length} onClick={calculateAll}>Tout calculer ({eligible.length})</button></>}>
        {eligible.length === 0 ? <p className="text-sm text-gray-500">Toutes les paies de la période sont déjà calculées. Le backend refuse un second calcul (« La paie existe déjà pour cette période »).</p> : (
          <div className="space-y-3">
            <Field label="Collaborateur">
              <select className="input" value={calcEmp} onChange={(e) => setCalcEmp(e.target.value)} data-testid="calc-employee">
                <option value="">Choisir…</option>
                {eligible.map((e) => <option key={e.id} value={e.id}>{e.fullName} · {e.jobTitle}</option>)}
              </select>
            </Field>
            <button className="btn-primary w-full" disabled={!calcEmp} onClick={async () => { await calculate(calcEmp); setCalcEmp(''); }}>Calculer ce bulletin</button>
          </div>
        )}
      </Dialog>

      <Dialog open={!!detail} onClose={() => setDetail(null)} title={detail ? `Bulletin ${detail.period} · ${detail.employeeName}` : ''} wide>
        {detail && (
          <div className="space-y-4" data-testid="payslip">
            <div className="flex justify-between text-sm text-gray-500 flex-wrap gap-2">
              <span>{detail.employeeNumber} · {detail.jobTitle} · {detail.departmentName}</span>
              <Pill tone={RUN_STATUS[detail.status][1]}>{RUN_STATUS[detail.status][0]}</Pill>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200"><th className="py-2 text-left font-semibold text-gray-600">Rubrique</th><th className="py-2 text-left font-semibold text-gray-600">Code</th><th className="py-2 text-right font-semibold text-gray-600">Gain</th><th className="py-2 text-right font-semibold text-gray-600">Retenue</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {detail.lines.map((l: any) => (
                  <tr key={l.code}><td className="py-2">{l.label}</td><td className="py-2 font-mono text-xs text-gray-400">{l.code}</td>
                    <td className="py-2 text-right">{l.isDeduction ? '' : fmtMoney(l.amount, detail.currency)}</td><td className="py-2 text-right text-red-600">{l.isDeduction ? fmtMoney(l.amount, detail.currency) : ''}</td></tr>
                ))}
              </tbody>
            </table>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
              <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Brut</p><p className="font-semibold">{fmtMoney(detail.grossSalary, detail.currency)}</p></div>
              <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Cotisations salarié</p><p className="font-semibold">{fmtMoney(detail.employeeContributions, detail.currency)}</p></div>
              <div className="bg-gray-50 rounded-lg p-3"><p className="text-xs text-gray-500">Impôt retenu</p><p className="font-semibold">{fmtMoney(detail.taxWithheld, detail.currency)}</p></div>
              <div className="bg-emerald-50 rounded-lg p-3"><p className="text-xs text-emerald-700">Net à payer</p><p className="font-bold text-emerald-700">{fmtMoney(detail.netSalary, detail.currency)}</p></div>
            </div>
            <p className="text-xs text-gray-400">Charges patronales : {fmtMoney(detail.employerContributions, detail.currency)} · Pays de calcul : {detail.countryCode}{detail.paidAt ? ` · Payé le ${fmtDate(detail.paidAt)}` : ''}</p>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default PayrollPage;
