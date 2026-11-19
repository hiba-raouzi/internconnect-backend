import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const LINKS = {
  student: [
    ['/student', 'Tableau de bord'],
    ['/student/offers', 'Offres de stage'],
    ['/student/recommended', 'Recommandations'],
    ['/student/applications', 'Mes candidatures'],
    ['/student/conventions', 'Conventions'],
    ['/student/internships', 'Mon stage'],
    ['/student/profile', 'Mon profil & CV'],
  ],
  company: [
    ['/company', 'Tableau de bord'],
    ['/company/offers', 'Mes offres'],
    ['/company/offers/new', 'Publier une offre'],
    ['/company/conventions', 'Conventions'],
    ['/company/internships', 'Stagiaires'],
    ['/company/profile', 'Profil entreprise'],
  ],
  school: [
    ['/school', 'Tableau de bord'],
    ['/school/students', 'Mes étudiants'],
    ['/school/conventions', 'Conventions'],
    ['/school/internships', 'Suivi des stages'],
    ['/school/profile', "Profil de l'école"],
  ],
} as const;

const ROLE_LABEL = { student: 'Étudiant', company: 'Entreprise', school: 'École' };

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  if (!user) return null;
  const links = LINKS[user.role];

  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-slate-200 bg-white md:min-h-screen md:w-64 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-5 py-4 md:block">
          <div className="text-xl font-extrabold text-brand-700">Intern<span className="text-slate-900">Connect</span></div>
          <div className="text-xs text-slate-500 md:mt-1">Espace {ROLE_LABEL[user.role]}</div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:block md:space-y-1 md:overflow-visible">
          {links.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden border-t border-slate-200 p-4 md:block">
          <div className="truncate text-sm font-medium">{user.name}</div>
          <div className="truncate text-xs text-slate-500">{user.email}</div>
          <button
            className="btn-secondary mt-3 w-full"
            onClick={() => {
              logout();
              nav('/login');
            }}
          >
            Se déconnecter
          </button>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-5xl">
          <Outlet />
        </div>
        <div className="mt-8 md:hidden">
          <button className="btn-secondary w-full" onClick={() => { logout(); nav('/login'); }}>
            Se déconnecter
          </button>
        </div>
      </main>
    </div>
  );
}
