import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { Alert, Field } from '../components/ui';
import { EDU_LEVELS, Role } from '../lib/types';

const ROLES: { value: Role; label: string }[] = [
  { value: 'student', label: 'Étudiant' },
  { value: 'company', label: 'Entreprise' },
  { value: 'school', label: 'École' },
];

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [role, setRole] = useState<Role>('student');
  const [f, setF] = useState<Record<string, string>>({});
  const [schools, setSchools] = useState<{ _id: string; name: string }[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    api('/users/schools').then(setSchools).catch(() => {});
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const u = await register({ ...f, role });
      nav(`/${u.role}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="card w-full max-w-md space-y-4">
        <Link to="/" className="block text-center text-xl font-extrabold text-brand-700">Intern<span className="text-slate-900">Connect</span></Link>
        <h1 className="text-center text-lg font-semibold">Créer un compte</h1>
        <div className="grid grid-cols-3 gap-2">
          {ROLES.map((r) => (
            <button
              type="button"
              key={r.value}
              onClick={() => setRole(r.value)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium ${role === r.value ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-300 text-slate-600'}`}
            >
              {r.label}
            </button>
          ))}
        </div>
        {error && <Alert>{error}</Alert>}
        <Field label={role === 'student' ? 'Nom complet' : role === 'company' ? "Nom de l'entreprise" : "Nom de l'établissement"}>
          <input className="input" required onChange={set('name')} />
        </Field>
        <Field label="Email"><input className="input" type="email" required onChange={set('email')} /></Field>
        <Field label="Mot de passe (6 caractères min.)"><input className="input" type="password" minLength={6} required onChange={set('password')} /></Field>

        {role === 'student' && (
          <>
            <Field label="École">
              <select className="input" onChange={(e) => setF({ ...f, school: e.target.value })} defaultValue="">
                <option value="">— Non rattaché / autre —</option>
                {schools.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Filière"><input className="input" placeholder="Génie informatique" onChange={set('fieldOfStudy')} /></Field>
            <Field label="Niveau d'études">
              <select className="input" onChange={set('educationLevel')} defaultValue="">
                <option value="">—</option>
                {EDU_LEVELS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </Field>
          </>
        )}
        {role === 'company' && (
          <>
            <Field label="Secteur d'activité"><input className="input" onChange={set('sector')} /></Field>
            <Field label="Adresse"><input className="input" onChange={set('address')} /></Field>
          </>
        )}
        {role === 'school' && <Field label="Adresse"><input className="input" onChange={set('address')} /></Field>}

        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Création…' : 'Créer mon compte'}</button>
        <p className="text-center text-sm text-slate-500">
          Déjà inscrit ? <Link to="/login" className="font-medium text-brand-600">Se connecter</Link>
        </p>
      </form>
    </div>
  );
}
