import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Empty, PageHeader, Spinner, fmtDate } from '../../components/ui';
import type { Offer } from '../../lib/types';

export default function CompanyOffers() {
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const load = () => api<Offer[]>('/offers/mine').then(setOffers);
  useEffect(() => { load(); }, []);

  const toggle = async (o: Offer) => {
    await api(`/offers/${o._id}`, { method: 'PUT', body: { status: o.status === 'open' ? 'closed' : 'open' } });
    load();
  };
  const remove = async (o: Offer) => {
    if (!confirm(`Supprimer « ${o.title} » et ses candidatures ?`)) return;
    await api(`/offers/${o._id}`, { method: 'DELETE' });
    load();
  };

  if (!offers) return <Spinner />;
  return (
    <>
      <PageHeader title="Mes offres" action={<Link to="/company/offers/new" className="btn-primary">+ Publier une offre</Link>} />
      {!offers.length ? <Empty>Aucune offre publiée.</Empty> : (
        <div className="space-y-3">
          {offers.map((o) => (
            <div key={o._id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{o.title}</h3>
                  <p className="text-sm text-slate-500">{o.type} · {o.location || '—'} · limite {fmtDate(o.deadline)}</p>
                </div>
                <span className={`badge ${o.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-600'}`}>{o.status === 'open' ? 'Ouverte' : 'Fermée'}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link to={`/company/offers/${o._id}/candidates`} className="btn-primary">Candidats ({o.applicationsCount})</Link>
                <Link to={`/company/offers/${o._id}/edit`} className="btn-secondary">Modifier</Link>
                <button className="btn-secondary" onClick={() => toggle(o)}>{o.status === 'open' ? 'Fermer' : 'Rouvrir'}</button>
                <button className="btn-secondary text-red-600" onClick={() => remove(o)}>Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
