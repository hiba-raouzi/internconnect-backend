const express = require('express');
const Internship = require('../models/Internship');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

const isParty = (i, user) =>
  [i.student, i.company, i.school].filter(Boolean).some((id) => String(id._id || id) === String(user._id));

const populateAll = (q) =>
  q
    .populate('student', 'name email')
    .populate('company', 'name')
    .populate('school', 'name')
    .populate('offer', 'title type')
    .populate('evaluations.author', 'name');

// Mes stages (étudiant, entreprise ou école)
router.get('/mine', protect, async (req, res, next) => {
  try {
    const key = req.user.role;
    res.json(await populateAll(Internship.find({ [key]: req.user._id }).sort('-createdAt')));
  } catch (e) {
    next(e);
  }
});

router.get('/:id', protect, async (req, res, next) => {
  try {
    const i = await populateAll(Internship.findById(req.params.id));
    if (!i || !isParty(i, req.user)) return res.status(404).json({ message: 'Stage introuvable' });
    res.json(i);
  } catch (e) {
    next(e);
  }
});

// Statut global du stage (entreprise)
router.patch('/:id/status', protect, authorize('company'), async (req, res, next) => {
  try {
    const i = await Internship.findOne({ _id: req.params.id, company: req.user._id });
    if (!i) return res.status(404).json({ message: 'Stage introuvable' });
    if (!['planned', 'ongoing', 'completed'].includes(req.body.status)) return res.status(400).json({ message: 'Statut invalide' });
    i.status = req.body.status;
    await i.save();
    res.json(i);
  } catch (e) {
    next(e);
  }
});

// Étapes de suivi : ajout (entreprise / école), changement d'état (étudiant, entreprise, école)
router.post('/:id/steps', protect, authorize('company', 'school'), async (req, res, next) => {
  try {
    const i = await Internship.findById(req.params.id);
    if (!i || !isParty(i, req.user)) return res.status(404).json({ message: 'Stage introuvable' });
    if (!req.body.title) return res.status(400).json({ message: 'Titre requis' });
    i.steps.push({ title: req.body.title, description: req.body.description, dueDate: req.body.dueDate });
    await i.save();
    res.status(201).json(i);
  } catch (e) {
    next(e);
  }
});

router.patch('/:id/steps/:stepId', protect, async (req, res, next) => {
  try {
    const i = await Internship.findById(req.params.id);
    if (!i || !isParty(i, req.user)) return res.status(404).json({ message: 'Stage introuvable' });
    const step = i.steps.id(req.params.stepId);
    if (!step) return res.status(404).json({ message: 'Étape introuvable' });
    if (!['todo', 'in_progress', 'done'].includes(req.body.status)) return res.status(400).json({ message: 'Statut invalide' });
    step.status = req.body.status;
    if (i.status === 'planned' && req.body.status !== 'todo') i.status = 'ongoing';
    await i.save();
    res.json(i);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id/steps/:stepId', protect, authorize('company', 'school'), async (req, res, next) => {
  try {
    const i = await Internship.findById(req.params.id);
    if (!i || !isParty(i, req.user)) return res.status(404).json({ message: 'Stage introuvable' });
    const step = i.steps.id(req.params.stepId);
    if (!step) return res.status(404).json({ message: 'Étape introuvable' });
    step.deleteOne();
    await i.save();
    res.json(i);
  } catch (e) {
    next(e);
  }
});

// Évaluation du tuteur (entreprise) ou de l'encadrant (école)
router.post('/:id/evaluations', protect, authorize('company', 'school'), async (req, res, next) => {
  try {
    const i = await Internship.findById(req.params.id);
    if (!i || !isParty(i, req.user)) return res.status(404).json({ message: 'Stage introuvable' });
    const { technical, autonomy, communication, punctuality, comment } = req.body;
    for (const v of [technical, autonomy, communication, punctuality]) {
      if (v === undefined || v < 0 || v > 20) return res.status(400).json({ message: 'Les notes doivent être comprises entre 0 et 20' });
    }
    i.evaluations.push({ author: req.user._id, authorRole: req.user.role, technical, autonomy, communication, punctuality, comment });
    await i.save();
    res.status(201).json(await populateAll(Internship.findById(i._id)));
  } catch (e) {
    next(e);
  }
});

module.exports = router;
