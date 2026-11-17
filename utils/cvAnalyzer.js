const { EDUCATION_LEVELS, LANGUAGE_LEVELS, SKILL_DICTIONARY, containsTerm } = require('./cvExtractor');

const EDU_RANK = Object.fromEntries(EDUCATION_LEVELS.map((e) => [e.level, e.rank]));
const LANG_RANK = Object.fromEntries(LANGUAGE_LEVELS.map((l) => [l.level, l.rank]));

const DEFAULT_WEIGHTS = { skills: 40, education: 20, experience: 20, languages: 20 };

function normalizeSkill(s) {
  const low = String(s).toLowerCase().trim();
  for (const [canonical, aliases] of Object.entries(SKILL_DICTIONARY)) {
    if (canonical === low || aliases.includes(low)) return canonical;
  }
  return low;
}

function scoreSkills(cvSkills, cvText, offer) {
  const required = (offer.requiredSkills || []).map(normalizeSkill);
  const nice = (offer.niceToHaveSkills || []).map(normalizeSkill);
  const have = new Set((cvSkills || []).map(normalizeSkill));
  const has = (skill) => have.has(skill) || (cvText ? containsTerm(cvText, skill) : false);

  const matchedRequired = required.filter(has);
  const matchedNice = nice.filter(has);
  const missing = required.filter((s) => !has(s));

  if (!required.length && !nice.length) return { score: 100, matched: [], missing: [] };

  // Les compétences requises pèsent 85 %, les "plus" 15 %
  const reqRatio = required.length ? matchedRequired.length / required.length : 1;
  const niceRatio = nice.length ? matchedNice.length / nice.length : 1;
  const score = required.length && nice.length ? reqRatio * 85 + niceRatio * 15 : (required.length ? reqRatio : niceRatio) * 100;

  return { score: Math.round(score), matched: [...matchedRequired, ...matchedNice], missing };
}

function scoreEducation(cvEducation, offer) {
  const required = EDU_RANK[offer.requiredEducation] || 0;
  const have = cvEducation && cvEducation.rank ? cvEducation.rank : EDU_RANK[cvEducation?.level] || 0;
  let score;
  if (!required) score = have ? 100 : 60;
  else if (have >= required) score = 100;
  else if (have === 0) score = 0;
  else score = Math.max(0, Math.round((have / required) * 70));

  // Bonus/malus de cohérence du domaine d'études
  const keywords = (offer.fieldKeywords || []).map((k) => k.toLowerCase());
  if (keywords.length) {
    const hay = ((cvEducation?.degrees || []).join(' ') + ' ' + (cvEducation?.field || '')).toLowerCase();
    const fieldMatch = keywords.some((k) => hay.includes(k));
    if (!fieldMatch) score = Math.round(score * 0.8);
  }
  return Math.min(100, score);
}

function scoreExperience(cvExperience, cvSkills, offer) {
  const min = offer.minExperienceItems || 0;
  const count = cvExperience?.count || 0;
  let base;
  if (!min) base = Math.min(100, 40 + count * 15);
  else base = Math.min(100, Math.round((count / min) * 100));

  // Pertinence : recoupement des mots-clés de l'expérience avec les compétences demandées
  const required = (offer.requiredSkills || []).map((s) => s.toLowerCase());
  if (required.length && cvExperience?.keywords?.length) {
    const kw = cvExperience.keywords.join(' ');
    const rel = required.filter((s) => kw.includes(s)).length / required.length;
    base = Math.round(base * 0.7 + rel * 100 * 0.3);
  }
  return Math.max(0, Math.min(100, base));
}

function scoreLanguages(cvLanguages, offer) {
  const reqs = offer.requiredLanguages || [];
  if (!reqs.length) return 100;
  let total = 0;
  for (const r of reqs) {
    const found = (cvLanguages || []).find((l) => l.name.toLowerCase() === String(r.name).toLowerCase());
    if (!found) continue;
    const need = LANG_RANK[r.level] || 2;
    const got = found.rank || LANG_RANK[found.level] || 2;
    total += got >= need ? 1 : got / need;
  }
  return Math.round((total / reqs.length) * 100);
}

function normalizeWeights(w) {
  const weights = { ...DEFAULT_WEIGHTS, ...(w && typeof w.toObject === 'function' ? w.toObject() : w) };
  const sum = weights.skills + weights.education + weights.experience + weights.languages;
  if (!sum) return DEFAULT_WEIGHTS;
  return {
    skills: (weights.skills / sum) * 100,
    education: (weights.education / sum) * 100,
    experience: (weights.experience / sum) * 100,
    languages: (weights.languages / sum) * 100,
  };
}

/**
 * Compare un CV (données extraites + texte) à une offre et renvoie un score pondéré.
 * @param {object} cvData  résultat de extractFromText
 * @param {string} cvText  texte brut du CV
 * @param {object} offer   offre avec critères et poids
 */
function analyzeCv(cvData, cvText, offer) {
  const w = normalizeWeights(offer.weights);
  const sk = scoreSkills(cvData.skills, cvText, offer);
  const breakdown = {
    skills: sk.score,
    education: scoreEducation(cvData.education, offer),
    experience: scoreExperience(cvData.experience, cvData.skills, offer),
    languages: scoreLanguages(cvData.languages, offer),
  };
  const total = Math.round(
    (breakdown.skills * w.skills + breakdown.education * w.education + breakdown.experience * w.experience + breakdown.languages * w.languages) / 100
  );
  return {
    total,
    breakdown,
    matchedSkills: sk.matched,
    missingSkills: sk.missing,
    meetsMinimum: total >= (offer.minScore || 0),
    analyzedAt: new Date(),
  };
}

/** Classe les candidatures par score décroissant. */
function rankApplications(applications) {
  return [...applications]
    .sort((a, b) => (b.analysis?.total ?? -1) - (a.analysis?.total ?? -1))
    .map((a, i) => ({ rank: i + 1, application: a }));
}

/** Compétences manquantes d'un étudiant par rapport à une offre (recommandations). */
function matchScore(student, offer) {
  const cvData = student.cvData || {
    skills: student.skills || [],
    education: { level: student.educationLevel, rank: EDU_RANK[student.educationLevel] || 0, degrees: [student.fieldOfStudy || ''] },
    languages: (student.languages || []).map((l) => ({ name: l.name, level: l.level, rank: LANG_RANK[l.level] || 2 })),
    experience: { count: 0, keywords: [] },
  };
  return analyzeCv({ ...cvData, skills: [...new Set([...(cvData.skills || []), ...(student.skills || [])])] }, student.cvText || '', offer);
}

module.exports = { analyzeCv, rankApplications, matchScore, DEFAULT_WEIGHTS, normalizeWeights };
