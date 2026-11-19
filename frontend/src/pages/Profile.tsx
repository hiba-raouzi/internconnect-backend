import { FormEvent, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Alert, Field, PageHeader, TagInput } from '../components/ui';
import { EDU_LEVELS, LANG_LEVELS } from '../lib/types';

export default function Profile() {
  const { user, setUser, refresh } = useAuth();
  const [f, setF] = useState<any>({ ...user });
  const [msg, setMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [cv, setCv] = useState<File | null>(null);
  const [extracted, setExtracted] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  if (!user) return null;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      const { user: u } = await api('/users/me', { method: 'PUT', body: f });
      setUser(u);
      setMsg({ kind: 'success', text: 'Profil mis à jour.' });
    } catch (err: any) {
      setMsg({ kind: 'error', text: err.message });
    }
  };

  const uploadCv = async () => {
    if (!cv) return;
    setBusy(true);
    setMsg(null);
    try {
      const form = new FormData();
      form.append('cv', cv);
      const r = await api('/users/me/cv', { form });
      setExtracted(r.extracted);
      setF({ ...f, skills: r.skills });
      await refresh();
      setMsg({ kind: 'success', text: 'CV analysé : vos compétences ont été ajoutées au profil.' });
    } catch (err: any) {
      setMsg({ kind: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const langs: { name: string; level: string }[] = f.languages || [];

  return (
    <>
      <PageHeader title="Mon profil" />
      {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
      <form onSubmit={save} className="card mb-6 grid gap-4 md:grid-cols-2">
        <Field label="Nom"><input className="input" value={f.name || ''} onChange={set('name')} required /></Field>
        <Field label="Téléphone"><input className="input" value={f.phone || ''} onChange={set('phone')} /></Field>

        {user.role === 'student' && (
          <>
            <Field label="Filière"><input className="input" value={f.fieldOfStudy || ''} onChange={set('fieldOfStudy')} /></Field>
            <Field label="Niveau d'études">
              <select className="input" value={f.educationLevel || ''} onChange={set('educationLevel')}>
                <option value="">—</option>
                {EDU_LEVELS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </Field>
            <div className="md:col-span-2"><Field label="Compétences"><TagInput value={f.skills || []} onChange={(v) => setF({ ...f, skills: v })} /></Field></div>
            <div className="md:col-span-2">
              <label className="label">Langues</label>
              {langs.map((l, i) => (
                <div key={i} className="mb-2 flex gap-2">
                  <input className="input" placeholder="Langue" value={l.name} onChange={(e) => setF({ ...f, languages: langs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
                  <select className="input w-32" value={l.level} onChange={(e) => setF({ ...f, languages: langs.map((x, j) => (j === i ? { ...x, level: e.target.value } : x)) })}>
                    {LANG_LEVELS.map((lv) => <option key={lv}>{lv}</option>)}
                  </select>
                  <button type="button" className="btn-secondary" onClick={() => setF({ ...f, languages: langs.filter((_, j) => j !== i) })}>×</button>
                </div>
              ))}
              <button type="button" className="btn-secondary" onClick={() => setF({ ...f, languages: [...langs, { name: '', level: 'B2' }] })}>+ Ajouter une langue</button>
            </div>
            <div className="md:col-span-2"><Field label="À propos"><textarea className="input" rows={3} value={f.bio || ''} onChange={set('bio')} /></Field></div>
          </>
        )}

        {user.role !== 'student' && (
          <>
            {user.role === 'company' && <Field label="Secteur"><input className="input" value={f.sector || ''} onChange={set('sector')} /></Field>}
            <Field label="Site web"><input className="input" value={f.website || ''} onChange={set('website')} /></Field>
            <div className="md:col-span-2"><Field label="Adresse"><input className="input" value={f.address || ''} onChange={set('address')} /></Field></div>
            <div className="md:col-span-2"><Field label="Description"><textarea className="input" rows={4} value={f.description || ''} onChange={set('description')} /></Field></div>
          </>
        )}
        <div className="md:col-span-2"><button className="btn-primary">Enregistrer</button></div>
      </form>

      {user.role === 'student' && (
        <div className="card">
          <h2 className="mb-1 text-lg font-semibold">Mon CV (PDF)</h2>
          <p className="mb-4 text-sm text-slate-500">Votre CV est analysé automatiquement : compétences, formation, langues et expérience sont extraites.</p>
          {user.cvPath && <p className="mb-3 text-sm">CV actuel : <a className="font-medium text-brand-600 underline" href={user.cvPath} target="_blank" rel="noreferrer">ouvrir le PDF</a></p>}
          <div className="flex flex-wrap items-center gap-3">
            <input type="file" accept="application/pdf" onChange={(e) => setCv(e.target.files?.[0] || null)} className="text-sm" />
            <button className="btn-primary" disabled={!cv || busy} onClick={uploadCv}>{busy ? 'Analyse…' : 'Déposer et analyser'}</button>
          </div>
          {(extracted || user.cvData) && (() => {
            const d = extracted || user.cvData;
            return (
              <div className="mt-5 grid gap-3 rounded-lg bg-slate-50 p-4 text-sm md:grid-cols-2">
                <div><b>Formation détectée :</b> {d.education?.level || 'non détectée'}</div>
                <div><b>Langues :</b> {d.languages?.map((l: any) => `${l.name} (${l.level})`).join(', ') || '—'}</div>
                <div><b>Éléments d'expérience :</b> {d.experience?.count ?? 0}</div>
                <div><b>Compétences :</b> {d.skills?.join(', ') || '—'}</div>
              </div>
            );
          })()}
        </div>
      )}
    </>
  );
}
