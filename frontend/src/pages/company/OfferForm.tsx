import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Alert, Field, PageHeader, Spinner, TagInput } from '../../components/ui';
import { EDU_LEVELS, LANG_LEVELS, OFFER_TYPES, Offer, Weights } from '../../lib/types';

const EMPTY: Partial<Offer> = {
  title: '', description: '', type: 'PFE', location: '', duration: '6 mois', remote: false,
  requiredSkills: [], niceToHaveSkills: [], requiredEducation: '', fieldKeywords: [],
  minExperienceItems: 0, requiredLanguages: [], minScore: 50,
  weights: { skills: 40, education: 20, experience: 20, languages: 20 },
};

const toDateInput = (d?: string) => (d ? d.slice(0, 10) : '');

export default function OfferForm() {
  const { id } = useParams();
  const nav = useNavigate();
  const [f, setF] = useState<any>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (id) api<Offer>(`/offers/${id}`).then(setF);
    else setF(EMPTY);
  }, [id]);
  if (!f) return <Spinner />;

  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const w: Weights = f.weights;
  const total = w.skills + w.education + w.experience + w.languages;
  const setW = (k: keyof Weights) => (e: any) => setF({ ...f, weights: { ...w, [k]: Number(e.target.value) || 0 } });
  const langs: { name: string; level: string }[] = f.requiredLanguages || [];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (total !== 100) return setError(`La somme des pondérations doit faire 100 % (actuellement ${total} %).`);
    setBusy(true);
    try {
      const body = { ...f, requiredLanguages: langs.filter((l) => l.name.trim()), minExperienceItems: Number(f.minExperienceItems) || 0, minScore: Number(f.minScore) || 0 };
      if (id) await api(`/offers/${id}`, { method: 'PUT', body });
      else await api('/offers', { body });
      nav('/company/offers');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const WeightInput = ({ k, label }: { k: keyof Weights; label: string }) => (
    <Field label={`${label} (%)`}><input className="input" type="number" min={0} max={100} value={w[k]} onChange={setW(k)} /></Field>
  );

  return (
    <>
      <PageHeader title={id ? "Modifier l'offre" : 'Publier une offre de stage'} />
      {error && <Alert>{error}</Alert>}
      <form onSubmit={submit} className="space-y-6">
        <div className="card grid gap-4 md:grid-cols-2">
          <h2 className="font-semibold md:col-span-2">Informations générales</h2>
          <div className="md:col-span-2"><Field label="Titre"><input className="input" required placeholder="Stage PFE Développement Full Stack" value={f.title} onChange={set('title')} /></Field></div>
          <div className="md:col-span-2"><Field label="Description"><textarea className="input" rows={5} required value={f.description} onChange={set('description')} /></Field></div>
          <Field label="Type">
            <select className="input" value={f.type} onChange={set('type')}>{OFFER_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
          </Field>
          <Field label="Durée"><input className="input" value={f.duration || ''} onChange={set('duration')} /></Field>
          <Field label="Lieu"><input className="input" value={f.location || ''} onChange={set('location')} /></Field>
          <Field label="Date de début"><input className="input" type="date" value={toDateInput(f.startDate)} onChange={set('startDate')} /></Field>
          <Field label="Date limite de candidature"><input className="input" type="date" value={toDateInput(f.deadline)} onChange={set('deadline')} /></Field>
          <label className="flex items-center gap-2 pt-6 text-sm"><input type="checkbox" checked={!!f.remote} onChange={set('remote')} /> Télétravail possible</label>
        </div>

        <div className="card grid gap-4 md:grid-cols-2">
          <h2 className="font-semibold md:col-span-2">Critères de sélection</h2>
          <div className="md:col-span-2"><Field label="Compétences requises"><TagInput value={f.requiredSkills} onChange={(v) => setF({ ...f, requiredSkills: v })} placeholder="react, node.js, mongodb…" /></Field></div>
          <div className="md:col-span-2"><Field label="Compétences appréciées (bonus)"><TagInput value={f.niceToHaveSkills} onChange={(v) => setF({ ...f, niceToHaveSkills: v })} /></Field></div>
          <Field label="Niveau de formation minimum">
            <select className="input" value={f.requiredEducation} onChange={set('requiredEducation')}>
              <option value="">Non exigé</option>{EDU_LEVELS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </Field>
          <Field label="Domaines d'études attendus"><TagInput value={f.fieldKeywords} onChange={(v) => setF({ ...f, fieldKeywords: v })} placeholder="informatique, génie logiciel…" /></Field>
          <Field label="Expériences / projets minimum"><input className="input" type="number" min={0} value={f.minExperienceItems} onChange={set('minExperienceItems')} /></Field>
          <Field label="Seuil minimum du score global (/100)"><input className="input" type="number" min={0} max={100} value={f.minScore} onChange={set('minScore')} /></Field>
          <div className="md:col-span-2">
            <label className="label">Langues exigées</label>
            {langs.map((l, i) => (
              <div key={i} className="mb-2 flex gap-2">
                <input className="input" placeholder="français, anglais…" value={l.name} onChange={(e) => setF({ ...f, requiredLanguages: langs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
                <select className="input w-32" value={l.level} onChange={(e) => setF({ ...f, requiredLanguages: langs.map((x, j) => (j === i ? { ...x, level: e.target.value } : x)) })}>
                  {LANG_LEVELS.map((lv) => <option key={lv}>{lv}</option>)}
                </select>
                <button type="button" className="btn-secondary" onClick={() => setF({ ...f, requiredLanguages: langs.filter((_, j) => j !== i) })}>×</button>
              </div>
            ))}
            <button type="button" className="btn-secondary" onClick={() => setF({ ...f, requiredLanguages: [...langs, { name: '', level: 'B2' }] })}>+ Ajouter une langue</button>
          </div>
        </div>

        <div className="card">
          <h2 className="mb-1 font-semibold">Pondération des critères</h2>
          <p className="mb-4 text-sm text-slate-500">Définissez l'importance de chaque critère. Le total doit faire 100 %.</p>
          <div className="grid gap-4 sm:grid-cols-4">
            <WeightInput k="skills" label="Compétences techniques" />
            <WeightInput k="education" label="Formation" />
            <WeightInput k="experience" label="Expérience et projets" />
            <WeightInput k="languages" label="Langues" />
          </div>
          <p className={`mt-3 text-sm font-medium ${total === 100 ? 'text-green-700' : 'text-red-600'}`}>Total : {total} %</p>
        </div>

        <div className="flex gap-3">
          <button className="btn-primary" disabled={busy}>{busy ? 'Enregistrement…' : id ? 'Enregistrer' : "Publier l'offre"}</button>
          <button type="button" className="btn-secondary" onClick={() => nav('/company/offers')}>Annuler</button>
        </div>
      </form>
    </>
  );
}
