import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Empty, PageHeader, ScoreCircle, Spinner } from '../../components/ui';
import type { Offer } from '../../lib/types';

interface Rec { offer: Offer; score: number; matchedSkills: string[]; missingSkills: string[] }

export default function Recommended() {
  const [recs, setRecs] = useState<Rec[] | null>(null);
  useEffect(() => { api<Rec[]>('/offers/recommended').then(setRecs); }, []);
  if (!recs) return <Spinner />;

  return (
    <>
      <PageHeader title="Stages recommandés" subtitle="Classés par compatibilité avec votre profil, vos compétences et votre CV." />
      {!recs.length ? <Empty>Aucune offre disponible. Complétez votre profil pour obtenir des recommandations.</Empty> : (
        <div className="space-y-3">
          {recs.map((r) => (
            <Link key={r.offer._id} to={`/student/offers/${r.offer._id}`} className="card flex gap-4 transition hover:border-brand-500">
              <ScoreCircle value={r.score} />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold">{r.offer.title}</h3>
                <p className="text-sm text-slate-500">{r.offer.company?.name} · {r.offer.location || '—'}</p>
                {r.matchedSkills.length > 0 && (
                  <p className="mt-2 text-xs"><span className="font-medium text-green-700">Vous avez :</span> {r.matchedSkills.join(', ')}</p>
                )}
                {r.missingSkills.length > 0 && (
                  <p className="mt-1 text-xs"><span className="font-medium text-red-700">À acquérir :</span> {r.missingSkills.join(', ')}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
