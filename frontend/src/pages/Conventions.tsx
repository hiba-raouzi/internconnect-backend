import { useEffect, useRef, useState } from 'react';
import { api, downloadFile } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Alert, Empty, PageHeader, Spinner, fmtDate } from '../components/ui';
import type { Convention } from '../lib/types';

const STATUS: Record<string, [string, string]> = {
  draft: ['Brouillon', 'bg-slate-100 text-slate-700'],
  pending_signatures: ['En attente de signatures', 'bg-amber-100 text-amber-800'],
  validated: ['Validée', 'bg-green-100 text-green-800'],
  rejected: ['Refusée', 'bg-red-100 text-red-800'],
};

export default function Conventions() {
  const { user } = useAuth();
  const [list, setList] = useState<Convention[] | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadFor, setUploadFor] = useState<string | null>(null);

  const load = () => api<Convention[]>('/conventions/mine').then(setList);
  useEffect(() => { load(); }, []);

  const act = async (fn: () => Promise<any>) => {
    setError('');
    try { await fn(); await load(); } catch (e: any) { setError(e.message); }
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadFor) return;
    const form = new FormData();
    form.append('file', file);
    act(() => api(`/conventions/${uploadFor}/documents`, { form }));
    e.target.value = '';
  };

  if (!list || !user) return <Spinner />;
  const role = user.role;

  return (
    <>
      <PageHeader title="Conventions de stage" subtitle="Génération, signature en ligne et gestion des documents." />
      {error && <Alert>{error}</Alert>}
      <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={onFile} />
      {!list.length ? <Empty>Aucune convention pour le moment. L'entreprise la génère une fois votre candidature acceptée.</Empty> : (
        <div className="space-y-4">
          {list.map((c) => {
            const [label, color] = STATUS[c.status];
            const signed = c.signatures[role];
            return (
              <div key={c._id} className="card">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{c.offer?.title}</h3>
                    <p className="text-sm text-slate-500">
                      {c.student?.name} · {c.company?.name}{c.school ? ` · ${c.school.name}` : ''}
                    </p>
                    <p className="text-xs text-slate-400">Du {fmtDate(c.startDate)} au {fmtDate(c.endDate)}</p>
                  </div>
                  <span className={`badge ${color}`}>{label}</span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  {([['student', 'Étudiant'], ['company', 'Entreprise'], ['school', 'École']] as const).map(([k, l]) => (
                    <div key={k} className={`rounded-lg p-2 ${c.signatures[k] ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-500'}`}>
                      {l} : {c.signatures[k] ? '✔ signé' : k === 'school' && !c.school ? 'non requis' : 'en attente'}
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="btn-secondary" onClick={() => act(() => downloadFile(`/conventions/${c._id}/pdf`, `convention-${c._id}.pdf`))}>Télécharger le PDF</button>
                  {c.status === 'pending_signatures' && !signed && (
                    <>
                      <button className="btn-primary" onClick={() => act(() => api(`/conventions/${c._id}/sign`, { body: {} }))}>Signer</button>
                      <button className="btn-secondary text-red-600" onClick={() => confirm('Refuser cette convention ?') && act(() => api(`/conventions/${c._id}/reject`, { body: {} }))}>Refuser</button>
                    </>
                  )}
                  <button className="btn-secondary" onClick={() => { setUploadFor(c._id); fileRef.current?.click(); }}>+ Ajouter un document</button>
                </div>

                {c.documents.length > 0 && (
                  <ul className="mt-4 space-y-1 text-sm">
                    {c.documents.map((d) => (
                      <li key={d._id} className="flex items-center justify-between rounded bg-slate-50 px-3 py-1.5">
                        <a className="text-brand-600 underline" href={d.path} target="_blank" rel="noreferrer">{d.name}</a>
                        <button className="text-xs text-red-500" onClick={() => act(() => api(`/conventions/${c._id}/documents/${d._id}`, { method: 'DELETE' }))}>Supprimer</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
