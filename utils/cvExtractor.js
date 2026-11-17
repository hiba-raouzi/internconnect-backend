const fs = require('fs');

// Dictionnaire de compétences (normalisées en minuscules) avec alias
const SKILL_DICTIONARY = {
  javascript: ['javascript', 'js', 'es6'],
  typescript: ['typescript', 'ts'],
  react: ['react', 'reactjs', 'react.js'],
  'next.js': ['next.js', 'nextjs'],
  'vue.js': ['vue', 'vuejs', 'vue.js'],
  angular: ['angular', 'angularjs'],
  'node.js': ['node', 'nodejs', 'node.js'],
  express: ['express', 'expressjs', 'express.js'],
  mongodb: ['mongodb', 'mongo', 'mongoose'],
  mysql: ['mysql'],
  postgresql: ['postgresql', 'postgres'],
  sql: ['sql'],
  html: ['html', 'html5'],
  css: ['css', 'css3'],
  tailwind: ['tailwind', 'tailwindcss', 'tailwind css'],
  bootstrap: ['bootstrap'],
  python: ['python'],
  django: ['django'],
  flask: ['flask'],
  java: ['java'],
  'spring boot': ['spring boot', 'springboot', 'spring'],
  php: ['php'],
  laravel: ['laravel'],
  'c++': ['c++'],
  'c#': ['c#'],
  '.net': ['.net', 'dotnet'],
  git: ['git', 'github', 'gitlab'],
  docker: ['docker'],
  kubernetes: ['kubernetes', 'k8s'],
  aws: ['aws'],
  azure: ['azure'],
  linux: ['linux'],
  'rest api': ['rest', 'rest api', 'restful', 'api rest'],
  graphql: ['graphql'],
  jwt: ['jwt'],
  'machine learning': ['machine learning', 'apprentissage automatique'],
  'deep learning': ['deep learning'],
  'data science': ['data science', 'data analysis'],
  tensorflow: ['tensorflow'],
  pytorch: ['pytorch'],
  'power bi': ['power bi', 'powerbi'],
  figma: ['figma'],
  agile: ['agile', 'scrum'],
  flutter: ['flutter'],
  'react native': ['react native'],
  android: ['android'],
  devops: ['devops', 'ci/cd'],
  cybersécurité: ['cybersécurité', 'cybersecurite', 'cybersecurity'],
};

const EDUCATION_LEVELS = [
  { level: 'doctorat', rank: 5, patterns: [/doctorat/i, /\bphd\b/i] },
  { level: 'bac+5', rank: 4, patterns: [/bac\s*\+\s*5/i, /\bmaster\b/i, /ing[ée]nieur/i, /cycle ing[ée]nieur/i, /\bmsc\b/i] },
  { level: 'bac+3', rank: 3, patterns: [/bac\s*\+\s*3/i, /licence/i, /bachelor/i, /\blp\b/i] },
  { level: 'bac+2', rank: 2, patterns: [/bac\s*\+\s*2/i, /\bdut\b/i, /\bbts\b/i, /\bdeust\b/i, /\bcpge\b/i, /classes pr[ée]paratoires/i] },
  { level: 'bac', rank: 1, patterns: [/baccalaur[ée]at/i, /\bbac\b/i] },
];

const LANGUAGES = {
  français: [/fran[cç]ais/i, /french/i],
  anglais: [/anglais/i, /english/i],
  arabe: [/arabe/i, /arabic/i],
  espagnol: [/espagnol/i, /spanish/i],
  allemand: [/allemand/i, /german/i],
  amazigh: [/amazigh/i, /tamazight/i],
};

const LANGUAGE_LEVELS = [
  { level: 'natif', rank: 5, patterns: [/maternelle/i, /natif/i, /native/i, /bilingue/i] },
  { level: 'C2', rank: 5, patterns: [/\bc2\b/i, /courant/i, /fluent/i, /professionnel/i] },
  { level: 'C1', rank: 4, patterns: [/\bc1\b/i, /avanc[ée]/i, /advanced/i] },
  { level: 'B2', rank: 3, patterns: [/\bb2\b/i, /interm[ée]diaire/i, /intermediate/i] },
  { level: 'B1', rank: 2, patterns: [/\bb1\b/i] },
  { level: 'A2', rank: 1, patterns: [/\ba2\b/i, /\ba1\b/i, /d[ée]butant/i, /basic/i, /scolaire/i] },
];

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsTerm(text, term) {
  const t = escapeRegex(term);
  // Frontières adaptées aux termes contenant des symboles (c++, c#, .net)
  const re = new RegExp(`(^|[^a-z0-9àâçéèêëîïôûùüÿñæœ+#])${t}(?![a-z0-9àâçéèêëîïôûùüÿñæœ])`, 'i');
  return re.test(text);
}

async function readPdfText(filePath) {
  const pdfParse = require('pdf-parse');
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return (data.text || '').replace(/\r/g, '');
}

function extractEmail(text) {
  const m = text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
  return m ? m[0].toLowerCase() : null;
}

function extractPhone(text) {
  const m = text.match(/(\+?\d{1,3}[\s.-]?)?(\(?0?\d\)?[\s.-]?)(\d{2}[\s.-]?){3,4}\d{2}/);
  return m ? m[0].trim() : null;
}

function extractSkills(text) {
  const found = [];
  for (const [canonical, aliases] of Object.entries(SKILL_DICTIONARY)) {
    if (aliases.some((a) => containsTerm(text, a))) found.push(canonical);
  }
  return found;
}

function extractEducation(text) {
  const best = EDUCATION_LEVELS.find((e) => e.patterns.some((p) => p.test(text)));
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const degrees = lines
    .filter((l) => EDUCATION_LEVELS.some((e) => e.patterns.some((p) => p.test(l))))
    .slice(0, 5);
  return { level: best ? best.level : null, rank: best ? best.rank : 0, degrees };
}

function extractLanguages(text) {
  const result = [];
  const lines = text.split('\n');
  for (const [name, patterns] of Object.entries(LANGUAGES)) {
    const idx = lines.findIndex((l) => patterns.some((p) => p.test(l)));
    if (idx === -1) continue;
    const context = `${lines[idx]} ${lines[idx + 1] || ''}`;
    const lvl = LANGUAGE_LEVELS.find((l) => l.patterns.some((p) => p.test(context)));
    result.push({ name, level: lvl ? lvl.level : 'B1', rank: lvl ? lvl.rank : 2 });
  }
  return result;
}

function extractExperience(text) {
  const lines = text.split('\n').map((l) => l.trim());
  const sectionRe = /^(exp[ée]riences?( professionnelles?)?|projets?( acad[ée]miques?| personnels?)?|stages?|projects?|experience)\b/i;
  const stopRe = /^(formation|[ée]ducation|comp[ée]tences|skills|langues|languages|certifications?|loisirs|centres d'int[ée]r[êe]ts)\b/i;
  const items = [];
  let inSection = false;
  for (const line of lines) {
    if (sectionRe.test(line)) {
      inSection = true;
      continue;
    }
    if (stopRe.test(line)) {
      inSection = false;
      continue;
    }
    if (inSection && line.length > 3) items.push(line);
  }
  // Compte d'éléments significatifs : lignes de puces ou contenant des dates
  const bullets = items.filter((l) => /^[-•*▪●–]/.test(l) || /(20\d{2}|19\d{2})/.test(l));
  const years = (text.match(/\b(20\d{2})\b/g) || []).map(Number);
  return {
    items: items.slice(0, 30),
    count: bullets.length || Math.min(items.length, 10) > 0 ? Math.max(bullets.length, Math.ceil(items.length / 3)) : 0,
    keywords: [...new Set(items.join(' ').toLowerCase().match(/[a-zàâçéèêëîïôûùü+#.]{3,}/g) || [])].slice(0, 100),
    years: years.length ? [Math.min(...years), Math.max(...years)] : null,
  };
}

function extractName(text) {
  const first = text.split('\n').map((l) => l.trim()).find((l) => l.length > 2 && !/@|\d{4}/.test(l));
  return first || null;
}

/** Extrait les informations structurées d'un texte de CV. */
function extractFromText(text) {
  const clean = text || '';
  return {
    name: extractName(clean),
    email: extractEmail(clean),
    phone: extractPhone(clean),
    skills: extractSkills(clean),
    education: extractEducation(clean),
    languages: extractLanguages(clean),
    experience: extractExperience(clean),
    wordCount: clean.split(/\s+/).filter(Boolean).length,
  };
}

/** Extrait les informations d'un CV PDF sur disque. */
async function extractFromPdf(filePath) {
  const text = await readPdfText(filePath);
  return { text, data: extractFromText(text) };
}

module.exports = {
  extractFromPdf,
  extractFromText,
  SKILL_DICTIONARY,
  EDUCATION_LEVELS,
  LANGUAGE_LEVELS,
  containsTerm,
};
