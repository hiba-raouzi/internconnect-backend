import { FormEvent, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Alert, Empty, PageHeader, Spinner, fmtDate } from '../components/ui';
import type { Internship, Step } from '../lib/types';

const STEP_LABEL: Record<Step['status'], string> = { todo: 'À faire', in_progress: 'En cours', done: 'Terminée' };
const STEP_COLOR: Record<Step['status'], string> = { todo: 'bg-slate-100 text-slate-700', in_progress: 'bg-amber-100 text-amber-800', done: 'bg-green-100 text-green-800' };
const INTERN_LABEL = { planned: 'Planifié', ongoing: 'En cours', completed: 'Terminé' };

function EvaluationForm({ id, onDone }: { id: string; onDone: () => void }) {
  const [v, setV] = useState({ technical: 14, autonomy: 14, communication: 14, punctuality: 14, comment: '' });
  const [err, setErr] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try { await api(`/internships/${id}/evaluations`, { body: v }); onDone(); } catch (e: any) { setErr(e.message); }
  };
  const num = (k: keyof typeof v, label: string) => (
    <div><label className="label">{label} (/20)</label><input className="input" type="number" min={0} max={20} value={v[k] as number} onChange={(e) => setV({ ...v, [k]: Number(e.target.value) })} /></div>
  );
  return (
    <form onSubmit={submit} className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-4">
      {err && <div className="sm:col-span-4"><Alert>{err}</Alert></div>}
      {num('technical', 'Technique')}{num('autonomy', 'Autonomie')}{num('communication', 'Communication')}{num('punctuality', 'Ponctualité')}
      <div className="sm:col-span-4"><textarea className="input" rows={3} placeholder="Commentaire du tuteur" value={v.comment} onChange={(e) => setV({ ...v, comment: e.target.value })} /></div>
      <div className="sm:col-span-4"><button className="btn-primary">Enregistrer l'évaluation</button></div>
    </form>
  );
}

export default function Internships() {
  const { user } = useAuth();
  const [list, setList] = useState<Internship[] | null>(null);
  const [evalFor, setEvalFor] = useState<string | null>(null);
  const [newStep, setNewStep] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  const load = () => api<Internship[]>('/internships/mine').then(setList);
  useEffect(() => { load(); }, []);

  const act = async (fn: () => Promise<any>) => {
    setError('');
    try { await fn(); await load(); } catch (e: any) { setError(e.message); }
  };

  if (!list || !user) return <Spinner />;
  const canEdit = user.role !== 'student';
  const canEvaluate = user.role !== 'student';

  return (
    <>
      <PageHeader title={user.role === 'student' ? 'Mon stage' : 'Suivi des stages'} subtitle="Avancement des étapes et évaluations du tuteur." />
      {error && <Alert>{error}</Alert>}
      {!list.length ? <Empty>Aucun stage en cours. Un stage est créé automatiquement quand la convention est signée par toutes les parties.</Empty> : (
        <div className="space-y-5">
          {list.map((i) => (
            <div key={i._id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{i.offer?.title}</h3>
                  <p className="text-sm text-slate-500">{i.student?.name} · {i.company?.name}{i.school ? ` · ${i.school.name}` : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge bg-brand-100 text-brand-700">{INTERN_LABEL[i.status]}</span>
                  {user.role === 'company' && i.status !== 'completed' && (
                    <button className="btn-secondary" onClick={() => act(() => api(`/internships/${i._id}/status`, { method: 'PATCH', body: { status: i.status === 'planned' ? 'ongoing' : 'completed' } }))}>
                      {i.status === 'planned' ? 'Démarrer' : 'Terminer le stage'}
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs text-slate-500"><span>Avancement</span><span>{i.progress}%</span></div>
                <div className="h-2.5 rounded-full bg-slate-100"><div className="h-2.5 rounded-full bg-brand-500" style={{ width: `${i.progress}%` }} /></div>
              </div>

              <ul className="mt-4 space-y-2">
                {i.steps.map((s) => (
                  <li key={s._id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm">
                    <div>
                      <span className="font-medium">{s.title}</span>
                      {s.dueDate && <span className="ml-2 text-xs text-slate-400">échéance {fmtDate(s.dueDate)}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${STEP_COLOR[s.status]}`}>{STEP_LABEL[s.status]}</span>
                      <select className="rounded border border-slate-300 px-1 py-0.5 text-xs" value={s.status} onChange={(e) => act(() => api(`/internships/${i._id}/steps/${s._id}`, { method: 'PATCH', body: { status: e.target.value } }))}>
                        <option value="todo">À faire</option><option value="in_progress">En cours</option><option value="done">Terminée</option>
                      </select>
                      {canEdit && <button className="text-xs text-red-500" onClick={() => act(() => api(`/internships/${i._id}/steps/${s._id}`, { method: 'DELETE' }))}>×</button>}
                    </div>
                  </li>
                ))}
              </ul>

              {canEdit && (
                <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); const t = newStep[i._id]?.trim(); if (t) { act(() => api(`/internships/${i._id}/steps`, { body: { title: t } })); setNewStep({ ...newStep, [i._id]: '' }); } }}>
                  <input className="input" placeholder="Nouvelle étape…" value={newStep[i._id] || ''} onChange={(e) => setNewStep({ ...newStep, [i._id]: e.target.value })} />
                  <button className="btn-secondary">Ajouter</button>
                </form>
              )}

              <div className="mt-6 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Évaluations du tuteur</h4>
                  {canEvaluate && <button className="btn-secondary" onClick={() => setEvalFor(evalFor === i._id ? null : i._id)}>+ Évaluer</button>}
                </div>
                {evalFor === i._id && <EvaluationForm id={i._id} onDone={() => { setEvalFor(null); load(); }} />}
                {!i.evaluations.length ? <p className="mt-2 text-sm text-slate-400">Aucune évaluation pour le moment.</p> : (
                  <div className="mt-3 space-y-2">
                    {i.evaluations.map((e) => {
                      const avg = ((e.technical + e.autonomy + e.communication + e.punctuality) / 4).toFixed(1);
                      return (
                        <div key={e._id} className="rounded-lg bg-slate-50 p-3 text-sm">
                          <div className="flex justify-between"><b>{e.author?.name || (e.authorRole === 'company' ? 'Entreprise' : 'École')}</b><span className="font-semibold">{avg}/20</span></div>
                          <p className="text-xs text-slate-500">Technique {e.technical} · Autonomie {e.autonomy} · Communication {e.communication} · Ponctualité {e.punctuality}</p>
                          {e.comment && <p className="mt-1 text-slate-700">{e.comment}</p>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
