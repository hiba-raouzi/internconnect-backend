const assert = require('assert');
const { extractFromText } = require('../utils/cvExtractor');
const { analyzeCv } = require('../utils/cvAnalyzer');

const cvStrong = `Sara El Amrani
sara@mail.com  +212 6 12 34 56 78

Formation
Cycle ingénieur en Génie Informatique - ENSA Tanger 2022-2025

Compétences
React, TypeScript, Node.js, Express, MongoDB, Tailwind CSS, Git, Docker

Expérience
- Stage développeur Full Stack, Startup X, 2024
- Projet : plateforme e-commerce MERN, 2023
- Projet : API REST avec JWT, 2023

Langues
Français : courant
Anglais : niveau B2
Arabe : langue maternelle`;

const cvWeak = `Youssef B.
Formation
Baccalauréat 2023
Compétences
HTML, CSS
Langues
Français`;

const offer = {
  title: 'Stage PFE Développement Full Stack',
  requiredSkills: ['react', 'node.js', 'mongodb', 'typescript'],
  niceToHaveSkills: ['docker'],
  requiredEducation: 'bac+5',
  fieldKeywords: ['informatique'],
  minExperienceItems: 2,
  requiredLanguages: [{ name: 'français', level: 'B2' }, { name: 'anglais', level: 'B2' }],
  weights: { skills: 40, education: 20, experience: 20, languages: 20 },
  minScore: 50,
};

const strong = extractFromText(cvStrong);
const weak = extractFromText(cvWeak);

assert(strong.skills.includes('react') && strong.skills.includes('mongodb'), 'compétences détectées');
assert.strictEqual(strong.education.level, 'bac+5');
assert.strictEqual(strong.email, 'sara@mail.com');

const a = analyzeCv(strong, cvStrong, offer);
const b = analyzeCv(weak, cvWeak, offer);
console.log('Candidate forte :', a.total, a.breakdown, 'manquantes:', a.missingSkills);
console.log('Candidat faible  :', b.total, b.breakdown, 'manquantes:', b.missingSkills);

assert(a.total > b.total, 'le meilleur profil doit avoir le meilleur score');
assert(a.total >= 80, 'bon profil >= 80');
assert(a.meetsMinimum && !b.meetsMinimum, 'seuil minimum respecté');
assert(a.total <= 100 && b.total >= 0);
console.log('OK : tous les tests passent');
