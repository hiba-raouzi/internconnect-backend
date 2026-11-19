import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { PageHeader, Spinner, Stat } from '../components/ui';
import { STATUS_LABELS, AppStatus } from '../lib/types';

function Bars({ items, empty }: { items: { label: string; value: number }[]; empty: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) return <p className="text-sm text-slate-400">{empty}</p>;
  return (
    <div className="space-y-2">
      {items.map((i) => (
        <div key={i.label}>
          <div className="mb-0.5 flex justify-between text-xs text-slate-600"><span>{i.label}</span><span>{i.value}</span></div>
          <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-brand-500" style={{ width: `${(i.value / max) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [s, setS] = useState<any>(null);
  useEffect(() => { api('/stats/dashboard').then(setS); }, []);
  if (!s) return <Spinner />;

  const statusBars = Object.entries(s.byStatus || {}).map(([k, v]) => ({ label: (STATUS_LABELS as any)[k] || k, value: v as number }));

  return (
    <>
      <PageHeader title={`Bonjour, ${user?.name}`} subtitle="Voici un aperçu de votre activité sur InternConnect." />

      {s.role === 'student' && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <Stat label="Candidatures" value={s.applications} />
            <Stat label="Conventions" value={s.conventions} />
            <Stat label="Stages" value={s.internships} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="card"><h3 className="mb-3 font-semibold">État des candidatures</h3><Bars items={statusBars} empty="Aucune candidature pour le moment." /></div>
            <div className="card">
              <h3 className="mb-1 font-semibold">Compétences à renforcer</h3>
              <p className="mb-3 text-xs text-slate-500">Les plus souvent manquantes dans vos candidatures.</p>
              <Bars items={s.skillsToImprove.map((x: any) => ({ label: x.skill, value: x.count }))} empty="Postulez pour obtenir une analyse." />
            </div>
          </div>
          {!user?.cvPath && (
            <div className="card mt-4 border-amber-200 bg-amber-50 text-sm">
              Vous n'avez pas encore déposé de CV. <Link className="font-medium text-brand-700 underline" to="/student/profile">Ajoutez votre CV PDF</Link> pour postuler et être analysé automatiquement.
            </div>
          )}
        </>
      )}

      {s.role === 'company' && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Offres publiées" value={s.offers} hint={`${s.openOffers} ouvertes`} />
            <Stat label="Candidatures reçues" value={s.applications} />
            <Stat label="Score moyen des CV" value={`${s.averageScore}/100`} />
            <Stat label="Stagiaires" value={s.internships} hint={`${s.conventions} convention(s)`} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="card"><h3 className="mb-3 font-semibold">Pipeline de recrutement</h3><Bars items={statusBars} empty="Aucune candidature." /></div>
            <div className="card"><h3 className="mb-3 font-semibold">Compétences les plus présentes</h3><Bars items={s.topSkills.map((x: any) => ({ label: x.skill, value: x.count }))} empty="—" /></div>
            <div className="card"><h3 className="mb-3 font-semibold">Compétences les plus rares</h3><Bars items={s.mostMissingSkills.map((x: any) => ({ label: x.skill, value: x.count }))} empty="—" /></div>
          </div>
        </>
      )}

      {s.role === 'school' && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Étudiants suivis" value={s.students} hint={`${s.studentsWithApplications} ont postulé`} />
            <Stat label="Conventions à valider" value={s.conventionsPending} />
            <Stat label="Conventions validées" value={s.conventionsValidated} />
            <Stat label="Stages" value={s.internships} />
          </div>
          <div className="card"><h3 className="mb-3 font-semibold">Stages par statut</h3>
            <Bars items={Object.entries(s.byStatus || {}).map(([k, v]) => ({ label: ({ planned: 'Planifié', ongoing: 'En cours', completed: 'Terminé' } as any)[k] || k, value: v as number }))} empty="Aucun stage." />
          </div>
        </>
      )}
    </>
  );
}
