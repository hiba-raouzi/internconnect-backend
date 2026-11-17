const express = require('express');
const path = require('path');
const Application = require('../models/Application');
const Offer = require('../models/Offer');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { uploadPdf } = require('../middleware/upload');
const { extractFromPdf, extractFromText } = require('../utils/cvExtractor');
const { analyzeCv, rankApplications } = require('../utils/cvAnalyzer');

const router = express.Router();

// Postuler (CV PDF optionnel : sinon on utilise le CV du profil)
router.post('/', protect, authorize('student'), uploadPdf.single('cv'), async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.body.offerId);
    if (!offer || offer.status !== 'open') return res.status(404).json({ message: 'Offre indisponible' });
    if (offer.deadline && offer.deadline < new Date()) return res.status(400).json({ message: 'La date limite est dépassée' });
    if (await Application.findOne({ offer: offer._id, student: req.user._id })) {
      return res.status(409).json({ message: 'Vous avez déjà postulé à cette offre' });
    }

    let cvPath = req.user.cvPath;
    let cvText = req.user.cvText;
    let cvData = req.user.cvData;

    if (req.file) {
      const extracted = await extractFromPdf(req.file.path);
      cvPath = `/uploads/${path.basename(req.file.path)}`;
      cvText = extracted.text;
      cvData = extracted.data;
    }
    if (!cvPath || !cvText) return res.status(400).json({ message: 'Un CV PDF est requis pour postuler' });

    // Les compétences saisies dans le profil complètent celles du CV
    const data = { ...(cvData || extractFromText(cvText)) };
    data.skills = [...new Set([...(data.skills || []), ...(req.user.skills || [])])];

    const analysis = analyzeCv(data, cvText, offer);
    const application = await Application.create({
      offer: offer._id,
      student: req.user._id,
      coverLetter: req.body.coverLetter,
      cvPath,
      analysis,
    });
    res.status(201).json(application);
  } catch (e) {
    next(e);
  }
});

// Suivi des candidatures de l'étudiant
router.get('/mine', protect, authorize('student'), async (req, res, next) => {
  try {
    const apps = await Application.find({ student: req.user._id })
      .populate({ path: 'offer', select: 'title type location company', populate: { path: 'company', select: 'name' } })
      .sort('-createdAt');
    res.json(apps);
  } catch (e) {
    next(e);
  }
});

// Candidats d'une offre, classés par score (entreprise)
router.get('/offer/:offerId', protect, authorize('company'), async (req, res, next) => {
  try {
    const offer = await Offer.findOne({ _id: req.params.offerId, company: req.user._id });
    if (!offer) return res.status(404).json({ message: 'Offre introuvable' });
    const apps = await Application.find({ offer: offer._id }).populate(
      'student',
      'name email phone fieldOfStudy educationLevel schoolName skills cvPath'
    );
    const { minOnly } = req.query;
    let ranked = rankApplications(apps);
    if (minOnly === 'true') ranked = ranked.filter((r) => r.application.analysis?.meetsMinimum);
    res.json({ offer, ranking: ranked });
  } catch (e) {
    next(e);
  }
});

// Relancer l'analyse (après modification des critères de l'offre)
router.post('/offer/:offerId/reanalyze', protect, authorize('company'), async (req, res, next) => {
  try {
    const offer = await Offer.findOne({ _id: req.params.offerId, company: req.user._id });
    if (!offer) return res.status(404).json({ message: 'Offre introuvable' });
    const apps = await Application.find({ offer: offer._id });
    for (const app of apps) {
      const student = await User.findById(app.student);
      if (!student || !student.cvText) continue;
      const data = { ...(student.cvData || extractFromText(student.cvText)) };
      data.skills = [...new Set([...(data.skills || []), ...(student.skills || [])])];
      app.analysis = analyzeCv(data, student.cvText, offer);
      await app.save();
    }
    res.json({ message: `${apps.length} candidature(s) ré-analysée(s)` });
  } catch (e) {
    next(e);
  }
});

// Changer le statut d'une candidature (entreprise)
router.patch('/:id/status', protect, authorize('company'), async (req, res, next) => {
  try {
    const { status, companyNote } = req.body;
    if (!['reviewing', 'shortlisted', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }
    const app = await Application.findById(req.params.id).populate('offer');
    if (!app || String(app.offer.company) !== String(req.user._id)) {
      return res.status(404).json({ message: 'Candidature introuvable' });
    }
    app.status = status;
    if (companyNote !== undefined) app.companyNote = companyNote;
    await app.save();
    res.json(app);
  } catch (e) {
    next(e);
  }
});

// Retirer sa candidature (étudiant)
router.delete('/:id', protect, authorize('student'), async (req, res, next) => {
  try {
    const app = await Application.findOne({ _id: req.params.id, student: req.user._id });
    if (!app) return res.status(404).json({ message: 'Candidature introuvable' });
    if (app.status === 'accepted') return res.status(400).json({ message: 'Candidature déjà acceptée' });
    await app.deleteOne();
    res.json({ message: 'Candidature retirée' });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
