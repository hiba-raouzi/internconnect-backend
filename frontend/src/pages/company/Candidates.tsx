import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Alert, Empty, PageHeader, ScoreBar, ScoreCircle, Spinner, StatusBadge } from '../../components/ui';
import type { Application, AppStatus, Offer } from '../../lib/types';

interface Ranked { rank: number; application: Application }

export default function Candidates() {
  const { id } = useParams();
  const [data, setData] = useState<{ offer: Offer; ranking: Ranked[] } | null>(null);
  const [minOnly, setMinOnly] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [convDone, setConvDone] = useState<Record<string, boolean>>({});

  const load = () => api(`/applications/offer/${id}?minOnly=${minOnly}`).then(setData);
  useEffect(() => { load(); }, [id, minOnly]);

  const setStatus = async (appId: string, status: AppStatus) => {
    const note = status === 'rejected' || status === 'accepted' ? prompt('Message pour le candidat (optionnel) :') || undefined : undefined;
    await api(`/applications/${appId}/status`, { method: 'PATCH', body: { status, companyNote: note } });
    load();
  };

  const reanalyze = async () => {
    const r = await api(`/applications/offer/${id}/reanalyze`, { body: {} });
    setMsg(r.message);
    load();
  };

  const createConvention = async (appId: string) => {
    const endDate = prompt('Date de fin du stage (AAAA-MM-JJ) :');
    if (!endDate) return;
    try {
      await api('/conventions', { body: { applicationId: appId, endDate } });
      setConvDone({ ...convDone, [appId]: true });
      setMsg('Convention générée. Elle apparaît dans la section « Conventions ».');
    } catch (e: any) {
      setMsg(e.message);
    }
  };

  if (!data) return <Spinner />;
  const { offer, ranking } = data;

  return (
    <>
      <PageHeader
        title={`Candidats — ${offer.title}`}
        subtitle={`Classement automatique selon vos critères · seuil minimum : ${offer.minScore}/100`}
        action={<Link className="btn-secondary" to="/company/offers">← Mes offres</Link>}
      />
      {msg && <Alert kind="info">{msg}</Alert>}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={minOnly} onChange={(e) => setMinOnly(e.target.checked)} /> Afficher uniquement ceux qui atteignent le seuil</label>
        <button className="btn-secondary" onClick={reanalyze}>Relancer l'analyse des CV</button>
      </div>

      {!ranking.length ? <Empty>Aucun candidat pour le moment.</Empty> : (
        <div className="space-y-3">
          {ranking.map(({ rank, application: a }) => (
            <div key={a._id} className="card">
              <div className="flex gap-4">
                <div className="flex flex-col items-center"><span className="text-xs text-slate-400">#{rank}</span><ScoreCircle value={a.analysis?.total ?? 0} /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{a.student.name}</h3>
                      <p className="text-sm text-slate-500">{a.student.fieldOfStudy || '—'} · {a.student.educationLevel || '—'} · {a.student.schoolName || ''}</p>
                      <p className="text-xs text-slate-400">{a.student.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {a.analysis && !a.analysis.meetsMinimum && <span className="badge bg-red-100 text-red-700">Sous le seuil</span>}
                      <StatusBadge status={a.status} />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button className="btn-secondary" onClick={() => setOpen(open === a._id ? null : a._id)}>{open === a._id ? 'Masquer le détail' : 'Voir le détail du score'}</button>
                    {a.cvPath && <a className="btn-secondary" href={a.cvPath} target="_blank" rel="noreferrer">Ouvrir le CV</a>}
                    <button className="btn-secondary" onClick={() => setStatus(a._id, 'shortlisted')}>Présélectionner</button>
                    <button className="btn-secondary" onClick={() => setStatus(a._id, 'accepted')}>Accepter</button>
                    <button className="btn-secondary text-red-600" onClick={() => setStatus(a._id, 'rejected')}>Refuser</button>
                    {a.status === 'accepted' && !convDone[a._id] && <button className="btn-primary" onClick={() => createConvention(a._id)}>Générer la convention</button>}
                  </div>
                  {open === a._id && a.analysis && (
                    <div className="mt-4 rounded-lg bg-slate-50 p-4">
                      <ScoreBar label="Compétences techniques" value={a.analysis.breakdown.skills} weight={offer.weights.skills} />
                      <ScoreBar label="Formation" value={a.analysis.breakdown.education} weight={offer.weights.education} />
                      <ScoreBar label="Expérience et projets" value={a.analysis.breakdown.experience} weight={offer.weights.experience} />
                      <ScoreBar label="Langues" value={a.analysis.breakdown.languages} weight={offer.weights.languages} />
                      <p className="mt-3 text-sm"><b className="text-green-700">Compétences trouvées :</b> {a.analysis.matchedSkills.join(', ') || '—'}</p>
                      <p className="text-sm"><b className="text-red-700">Compétences manquantes :</b> {a.analysis.missingSkills.join(', ') || 'aucune'}</p>
                      {a.coverLetter && <p className="mt-3 whitespace-pre-line text-sm text-slate-600"><b>Lettre de motivation :</b> {a.coverLetter}</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
