import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Empty, PageHeader, ScoreBar, Spinner, StatusBadge, fmtDate } from '../../components/ui';
import type { Application } from '../../lib/types';

export default function MyApplications() {
  const [apps, setApps] = useState<Application[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const load = () => api<Application[]>('/applications/mine').then(setApps);
  useEffect(() => { load(); }, []);

  const withdraw = async (id: string) => {
    if (!confirm('Retirer cette candidature ?')) return;
    await api(`/applications/${id}`, { method: 'DELETE' });
    load();
  };

  if (!apps) return <Spinner />;
  return (
    <>
      <PageHeader title="Mes candidatures" subtitle="Suivez l'état de chacune de vos candidatures." />
      {!apps.length ? <Empty>Vous n'avez pas encore postulé. <Link className="underline" to="/student/offers">Voir les offres</Link></Empty> : (
        <div className="space-y-3">
          {apps.map((a) => (
            <div key={a._id} className="card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{a.offer?.title}</h3>
                  <p className="text-sm text-slate-500">{a.offer?.company?.name} · envoyée le {fmtDate(a.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  {a.analysis && <span className="text-sm font-semibold text-slate-700">Score {a.analysis.total}/100</span>}
                  <StatusBadge status={a.status} />
                </div>
              </div>
              {a.companyNote && <p className="mt-2 rounded bg-slate-50 p-2 text-sm text-slate-600">Message de l'entreprise : {a.companyNote}</p>}
              <div className="mt-3 flex gap-2">
                {a.analysis && <button className="btn-secondary" onClick={() => setOpen(open === a._id ? null : a._id)}>{open === a._id ? 'Masquer' : "Voir l'analyse de mon CV"}</button>}
                {a.status !== 'accepted' && <button className="btn-secondary" onClick={() => withdraw(a._id)}>Retirer</button>}
              </div>
              {open === a._id && a.analysis && (
                <div className="mt-4 rounded-lg bg-slate-50 p-4">
                  <ScoreBar label="Compétences techniques" value={a.analysis.breakdown.skills} />
                  <ScoreBar label="Formation" value={a.analysis.breakdown.education} />
                  <ScoreBar label="Expérience et projets" value={a.analysis.breakdown.experience} />
                  <ScoreBar label="Langues" value={a.analysis.breakdown.languages} />
                  {a.analysis.missingSkills.length > 0 && <p className="mt-2 text-sm"><b>Compétences manquantes :</b> {a.analysis.missingSkills.join(', ')}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
