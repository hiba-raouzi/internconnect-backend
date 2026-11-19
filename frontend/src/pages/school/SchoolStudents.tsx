import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Empty, PageHeader, Spinner } from '../../components/ui';
import type { User } from '../../lib/types';

export default function SchoolStudents() {
  const [students, setStudents] = useState<User[] | null>(null);
  useEffect(() => { api<User[]>('/users/school/students').then(setStudents); }, []);
  if (!students) return <Spinner />;

  return (
    <>
      <PageHeader title="Mes étudiants" subtitle="Étudiants inscrits et rattachés à votre établissement." />
      {!students.length ? <Empty>Aucun étudiant rattaché pour le moment. Ils vous choisissent lors de leur inscription.</Empty> : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr><th className="p-3">Nom</th><th className="p-3">Filière</th><th className="p-3">Niveau</th><th className="p-3">Compétences</th><th className="p-3">CV</th></tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s._id} className="border-t border-slate-100">
                  <td className="p-3"><div className="font-medium">{s.name}</div><div className="text-xs text-slate-400">{s.email}</div></td>
                  <td className="p-3">{s.fieldOfStudy || '—'}</td>
                  <td className="p-3">{s.educationLevel || '—'}</td>
                  <td className="p-3 text-xs">{s.skills?.slice(0, 6).join(', ') || '—'}</td>
                  <td className="p-3">{s.cvPath ? <a className="text-brand-600 underline" href={s.cvPath} target="_blank" rel="noreferrer">PDF</a> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
