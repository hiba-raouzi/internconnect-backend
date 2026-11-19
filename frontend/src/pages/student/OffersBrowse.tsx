import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Empty, PageHeader, Spinner, fmtDate } from '../../components/ui';
import { OFFER_TYPES, Offer } from '../../lib/types';

export default function OffersBrowse() {
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [location, setLocation] = useState('');
  const [skill, setSkill] = useState('');

  const load = () => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (type) p.set('type', type);
    if (location) p.set('location', location);
    if (skill) p.set('skill', skill);
    api<Offer[]>(`/offers?${p}`).then(setOffers);
  };
  useEffect(load, []);

  return (
    <>
      <PageHeader title="Offres de stage" subtitle="Toutes les offres au même endroit." />
      <form onSubmit={(e) => { e.preventDefault(); load(); }} className="card mb-6 grid gap-3 md:grid-cols-5">
        <input className="input md:col-span-2" placeholder="Mot-clé (titre, description)" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Tous types</option>
          {OFFER_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <input className="input" placeholder="Ville" value={location} onChange={(e) => setLocation(e.target.value)} />
        <input className="input" placeholder="Compétence (ex : react)" value={skill} onChange={(e) => setSkill(e.target.value)} />
        <button className="btn-primary md:col-span-5">Rechercher</button>
      </form>

      {!offers ? <Spinner /> : !offers.length ? <Empty>Aucune offre ne correspond à votre recherche.</Empty> : (
        <div className="space-y-3">
          {offers.map((o) => (
            <Link key={o._id} to={`/student/offers/${o._id}`} className="card block transition hover:border-brand-500">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-slate-900">{o.title}</h3>
                  <p className="text-sm text-slate-500">{o.company?.name} · {o.location || 'Lieu non précisé'}{o.remote ? ' · Télétravail possible' : ''}</p>
                </div>
                <span className="badge bg-brand-100 text-brand-700">{o.type}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {o.requiredSkills.slice(0, 8).map((s) => <span key={s} className="badge bg-slate-100 text-slate-700">{s}</span>)}
              </div>
              <p className="mt-2 text-xs text-slate-400">{o.duration && `${o.duration} · `}Date limite : {fmtDate(o.deadline)}</p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
