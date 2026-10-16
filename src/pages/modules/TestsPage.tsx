import React, { useState } from 'react';
import { FlaskConical, Send, Flag } from 'lucide-react';
import { act, Dialog, Field, fmtDate, Note, PageHeader, Panel, Pill, Spinner, Tabs, useApi } from './ui';

const TYPE: Record<string, string> = { Psychotechnical: 'Psychotechnique', Personality: 'Personnalité', Technical: 'Technique', Language: 'Langue', Situational: 'Mise en situation', ValuesMotivation: 'Valeurs et motivation' };
const STATUS: Record<string, [string, 'gray' | 'blue' | 'amber' | 'green' | 'red']> = { Pending: ['À envoyer', 'gray'], Sent: ['Envoyé', 'blue'], InProgress: ['En cours', 'amber'], Completed: ['Terminé', 'green'], Expired: ['Expiré', 'red'] };

type Tab = 'results' | 'templates';

const TestsPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('results');
  const templates = useApi<any[]>('/tests/templates');
  const tests = useApi<any[]>('/tests/candidate-tests');
  const apps = useApi<{ items: any[] }>('/recruitment/applications', { pageSize: 100 });
  const [send, setSend] = useState<any | null>(null);
  const [appId, setAppId] = useState('');

  return (
    <div className="min-h-full bg-gray-50">
      <PageHeader icon={<FlaskConical className="w-5 h-5" />} color="bg-purple-600" title="Tests de recrutement" subtitle="Modèles de tests et résultats des candidats" />
      <div className="px-4 sm:px-6 py-4 space-y-4">
        <Tabs<Tab> value={tab} onChange={setTab} tabs={[{ id: 'results', label: 'Tests candidats', count: tests.data?.length }, { id: 'templates', label: 'Modèles', count: templates.data?.length }]} />
        {tab === 'results' && (
          <Panel>{tests.loading ? <Spinner /> : (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100"><th className="th">Candidat</th><th className="th">Test</th><th className="th">Statut</th><th className="th">Bonnes réponses</th><th className="th">Score</th><th className="th">Résultat</th><th className="th text-right">Action</th></tr></thead>
              <tbody className="divide-y divide-gray-50">{(tests.data ?? []).map((t) => (
                <tr key={t.id}><td className="td"><p className="font-medium">{t.candidateName}</p><p className="text-xs text-gray-400">{t.jobTitle}</p></td><td className="td"><p>{t.testTitle}</p><p className="text-xs text-gray-400">{TYPE[t.testType]}{t.timeSpentMinutes ? ` · ${t.timeSpentMinutes} min` : ''}</p></td>
                  <td className="td"><Pill tone={STATUS[t.status][1]}>{STATUS[t.status][0]}</Pill></td>
                  <td className="td text-gray-500">{t.correctAnswers != null && t.status === 'Completed' ? `${t.correctAnswers} / ${t.totalQuestions}` : ''}</td>
                  <td className="td">{t.score != null ? <span className="font-semibold">{t.score} / 100</span> : t.status === 'Completed' ? <span className="text-xs text-gray-400">Correction manuelle</span> : ''}</td>
                  <td className="td">{t.passed === true ? <Pill tone="green">Seuil {t.passingScore} atteint</Pill> : t.passed === false ? <Pill tone="red">Sous le seuil ({t.passingScore})</Pill> : ''}</td>
                  <td className="td text-right">{t.status === 'InProgress' && <button className="btn-ghost !py-1 !px-2 text-xs" onClick={async () => { if (await act('post', `/tests/candidate-tests/${t.id}/complete`)) tests.reload(); }}><Flag className="w-3.5 h-3.5" />Clôturer et noter</button>}</td></tr>
              ))}</tbody></table></div>
          )}</Panel>
        )}
        {tab === 'templates' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{(templates.data ?? []).map((t) => (
            <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2"><p className="font-semibold">{t.title}</p><Pill tone="purple">{TYPE[t.type]}</Pill></div>
              <p className="text-sm text-gray-600 mt-1">{t.description}</p>
              <p className="text-xs text-gray-500 mt-3">{t.questionCount} questions · {t.durationMinutes} min · {t.autoScore ? `notation automatique, seuil ${t.passingScore}/100` : 'sans notation automatique'} · {t.assignedCount} envoi{t.assignedCount > 1 ? 's' : ''}</p>
              <button className="btn-ghost text-xs mt-3" onClick={() => { setSend(t); setAppId(''); }}><Send className="w-3.5 h-3.5" />Envoyer à un candidat</button>
            </div>
          ))}</div>
        )}
        <Note>À la clôture, le score est calculé automatiquement si le modèle le prévoit (bonnes réponses / nombre de questions), puis comparé au seuil de réussite, comme dans <code>TestsController.CompleteTest</code>. Les réponses des candidats sont fictives.</Note>
      </div>
      <Dialog open={!!send} onClose={() => setSend(null)} title={`Envoyer : ${send?.title || ''}`}
        footer={<><button className="btn-ghost" onClick={() => setSend(null)}>Annuler</button><button className="btn-primary" disabled={!appId} onClick={async () => { if (await act('post', '/tests/candidate-tests', { templateId: send.id, applicationId: appId })) { setSend(null); tests.reload(); templates.reload(); setTab('results'); } }}>Envoyer</button></>}>
        <Field label="Candidature"><select className="input" value={appId} onChange={(e) => setAppId(e.target.value)}><option value="">Choisir…</option>{(apps.data?.items ?? []).filter((a) => !['Rejected', 'Withdrawn', 'Hired'].includes(a.status)).map((a) => <option key={a.id} value={a.id}>{a.candidateName} · {a.jobTitle}</option>)}</select></Field>
      </Dialog>
    </div>
  );
};

export default TestsPage;
