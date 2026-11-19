import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Alert, PageHeader, Spinner, fmtDate } from '../../components/ui';
import type { Offer } from '../../lib/types';

export default function OfferDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [cover, setCover] = useState('');
  const [cv, setCv] = useState<File | null>(null);
  const [msg, setMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { api<Offer>(`/offers/${id}`).then(setOffer); }, [id]);
  if (!offer) return <Spinner />;

  const apply = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const form = new FormData();
      form.append('offerId', offer._id);
      form.append('coverLetter', cover);
      if (cv) form.append('cv', cv);
      const app = await api('/applications', { form });
      setMsg({ kind: 'success', text: `Candidature envoyée ! Votre score de compatibilité : ${app.analysis?.total ?? '—'}/100.` });
    } catch (err: any) {
      setMsg({ kind: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title={offer.title} subtitle={`${offer.company?.name} · ${offer.location || 'Lieu non précisé'} · ${offer.type}`} />
      <div className="grid gap-5 md:grid-cols-3">
        <div className="space-y-4 md:col-span-2">
          <div className="card">
            <h3 className="mb-2 font-semibold">Description</h3>
            <p className="whitespace-pre-line text-sm text-slate-700">{offer.description}</p>
          </div>
          <div className="card text-sm">
            <h3 className="mb-3 font-semibold">Profil recherché</h3>
            <p className="mb-2"><b>Compétences requises :</b> {offer.requiredSkills.join(', ') || '—'}</p>
            {offer.niceToHaveSkills.length > 0 && <p className="mb-2"><b>Appréciées :</b> {offer.niceToHaveSkills.join(', ')}</p>}
            <p className="mb-2"><b>Formation :</b> {offer.requiredEducation || 'Non précisée'} {offer.fieldKeywords.length > 0 && `(${offer.fieldKeywords.join(', ')})`}</p>
            <p className="mb-2"><b>Langues :</b> {offer.requiredLanguages.map((l) => `${l.name} ${l.level}`).join(', ') || '—'}</p>
            <p><b>Expériences / projets minimum :</b> {offer.minExperienceItems}</p>
          </div>
          <div className="card text-sm">
            <h3 className="mb-2 font-semibold">Critères de sélection (pondération)</h3>
            <ul className="grid grid-cols-2 gap-1 text-slate-700">
              <li>Compétences : {offer.weights.skills} %</li>
              <li>Formation : {offer.weights.education} %</li>
              <li>Expérience et projets : {offer.weights.experience} %</li>
              <li>Langues : {offer.weights.languages} %</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card text-sm">
            <p><b>Durée :</b> {offer.duration || '—'}</p>
            <p><b>Début :</b> {fmtDate(offer.startDate)}</p>
            <p><b>Date limite :</b> {fmtDate(offer.deadline)}</p>
            <p><b>Télétravail :</b> {offer.remote ? 'Oui' : 'Non'}</p>
          </div>
          {user?.role === 'student' && (
            <form onSubmit={apply} className="card space-y-3">
              <h3 className="font-semibold">Postuler</h3>
              {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
              <textarea className="input" rows={4} placeholder="Lettre de motivation (optionnel)" value={cover} onChange={(e) => setCover(e.target.value)} />
              <div>
                <label className="label">CV PDF</label>
                <input type="file" accept="application/pdf" className="text-xs" onChange={(e) => setCv(e.target.files?.[0] || null)} />
                <p className="mt-1 text-xs text-slate-400">
                  {user.cvPath ? 'Laissez vide pour utiliser le CV de votre profil.' : <>Aucun CV dans votre profil. <Link className="underline" to="/student/profile">Ajouter</Link></>}
                </p>
              </div>
              <button className="btn-primary w-full" disabled={busy}>{busy ? 'Envoi…' : 'Envoyer ma candidature'}</button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
