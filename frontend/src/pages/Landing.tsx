import { Link } from 'react-router-dom';

const ACTORS = [
  { title: 'Étudiants', text: 'Créez votre profil, déposez votre CV PDF, postulez et suivez vos candidatures en temps réel.' },
  { title: 'Entreprises', text: 'Publiez vos offres, définissez des critères pondérés et obtenez un classement automatique des candidats.' },
  { title: 'Écoles', text: 'Accompagnez vos étudiants, validez les conventions et suivez le déroulement des stages.' },
];

const FEATURES = [
  'Analyse intelligente des CV PDF',
  'Score pondéré : compétences, formation, expérience, langues',
  'Recommandations de stages personnalisées',
  'Conventions de stage générées en PDF et signées en ligne',
  "Suivi des étapes et évaluations du tuteur",
  'Tableaux de bord analytiques',
];

export default function Landing() {
  return (
    <div>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="text-xl font-extrabold text-brand-700">Intern<span className="text-slate-900">Connect</span></div>
        <div className="flex gap-2">
          <Link to="/login" className="btn-secondary">Connexion</Link>
          <Link to="/register" className="btn-primary">Créer un compte</Link>
        </div>
      </header>
      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
          La plateforme intelligente de gestion des stages
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
          Étudiants, entreprises et écoles réunis au même endroit, de la publication d'une offre jusqu'à la fin du stage.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/register" className="btn-primary px-6 py-3 text-base">Commencer</Link>
          <Link to="/login" className="btn-secondary px-6 py-3 text-base">J'ai déjà un compte</Link>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-5 px-6 md:grid-cols-3">
        {ACTORS.map((a) => (
          <div key={a.title} className="card">
            <h3 className="text-lg font-semibold text-brand-700">{a.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{a.text}</p>
          </div>
        ))}
      </section>
      <section className="mx-auto max-w-4xl px-6 py-16">
        <h2 className="mb-6 text-center text-2xl font-bold">Ce que vous obtenez</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {FEATURES.map((f) => (
            <li key={f} className="card text-sm font-medium">✓ {f}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
