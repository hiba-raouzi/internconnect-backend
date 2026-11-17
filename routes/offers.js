const express = require('express');
const Offer = require('../models/Offer');
const User = require('../models/User');
const Application = require('../models/Application');
const { protect, authorize } = require('../middleware/auth');
const { matchScore } = require('../utils/cvAnalyzer');

const router = express.Router();

const OFFER_FIELDS = [
  'title', 'description', 'type', 'location', 'duration', 'startDate', 'deadline', 'remote',
  'requiredSkills', 'niceToHaveSkills', 'requiredEducation', 'fieldKeywords', 'minExperienceItems',
  'requiredLanguages', 'weights', 'minScore', 'status',
];
const pick = (body) => Object.fromEntries(Object.entries(body).filter(([k]) => OFFER_FIELDS.includes(k)));

function validateWeights(w) {
  if (!w) return null;
  const sum = (w.skills || 0) + (w.education || 0) + (w.experience || 0) + (w.languages || 0);
  return sum === 100 ? null : `La somme des pondérations doit être égale à 100 % (actuellement ${sum} %)`;
}

// Liste + recherche / filtres (public pour utilisateurs connectés)
router.get('/', protect, async (req, res, next) => {
  try {
    const { q, type, location, skill, remote } = req.query;
    const filter = { status: 'open' };
    if (q) filter.$or = [{ title: new RegExp(q, 'i') }, { description: new RegExp(q, 'i') }];
    if (type) filter.type = type;
    if (location) filter.location = new RegExp(location, 'i');
    if (skill) filter.requiredSkills = new RegExp(`^${skill}$`, 'i');
    if (remote === 'true') filter.remote = true;
    const offers = await Offer.find(filter).populate('company', 'name sector').sort('-createdAt');
    res.json(offers);
  } catch (e) {
    next(e);
  }
});

// Offres de l'entreprise connectée (avec nombre de candidatures)
router.get('/mine', protect, authorize('company'), async (req, res, next) => {
  try {
    const offers = await Offer.find({ company: req.user._id }).sort('-createdAt').lean();
    const counts = await Application.aggregate([
      { $match: { offer: { $in: offers.map((o) => o._id) } } },
      { $group: { _id: '$offer', n: { $sum: 1 } } },
    ]);
    const map = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
    res.json(offers.map((o) => ({ ...o, applicationsCount: map[String(o._id)] || 0 })));
  } catch (e) {
    next(e);
  }
});

// Recommandations intelligentes pour l'étudiant (matching profil / offre)
router.get('/recommended', protect, authorize('student'), async (req, res, next) => {
  try {
    const student = await User.findById(req.user._id);
    const offers = await Offer.find({ status: 'open' }).populate('company', 'name sector');
    const scored = offers
      .map((o) => {
        const a = matchScore(student, o);
        return { offer: o, score: a.total, matchedSkills: a.matchedSkills, missingSkills: a.missingSkills };
      })
      .sort((x, y) => y.score - x.score)
      .slice(0, 10);
    res.json(scored);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', protect, async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id).populate('company', 'name sector website address description');
    if (!offer) return res.status(404).json({ message: 'Offre introuvable' });
    res.json(offer);
  } catch (e) {
    next(e);
  }
});

router.post('/', protect, authorize('company'), async (req, res, next) => {
  try {
    const err = validateWeights(req.body.weights);
    if (err) return res.status(400).json({ message: err });
    const offer = await Offer.create({ ...pick(req.body), company: req.user._id });
    res.status(201).json(offer);
  } catch (e) {
    next(e);
  }
});

router.put('/:id', protect, authorize('company'), async (req, res, next) => {
  try {
    const err = validateWeights(req.body.weights);
    if (err) return res.status(400).json({ message: err });
    const offer = await Offer.findOneAndUpdate({ _id: req.params.id, company: req.user._id }, pick(req.body), {
      new: true,
      runValidators: true,
    });
    if (!offer) return res.status(404).json({ message: 'Offre introuvable' });
    res.json(offer);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', protect, authorize('company'), async (req, res, next) => {
  try {
    const offer = await Offer.findOneAndDelete({ _id: req.params.id, company: req.user._id });
    if (!offer) return res.status(404).json({ message: 'Offre introuvable' });
    await Application.deleteMany({ offer: offer._id });
    res.json({ message: 'Offre supprimée' });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
