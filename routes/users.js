const express = require('express');
const path = require('path');
const User = require('../models/User');
const Application = require('../models/Application');
const { protect, authorize } = require('../middleware/auth');
const { uploadPdf } = require('../middleware/upload');
const { extractFromPdf } = require('../utils/cvExtractor');

const router = express.Router();

// Liste des écoles (pour l'inscription étudiante) - public
router.get('/schools', async (req, res, next) => {
  try {
    res.json(await User.find({ role: 'school' }).select('name address'));
  } catch (e) {
    next(e);
  }
});

// Mise à jour du profil
router.put('/me', protect, async (req, res, next) => {
  try {
    const fields = [
      'name', 'phone', 'school', 'schoolName', 'fieldOfStudy', 'educationLevel', 'skills', 'languages', 'bio',
      'sector', 'website', 'address', 'description',
    ];
    for (const f of fields) if (req.body[f] !== undefined) req.user[f] = req.body[f];
    await req.user.save();
    res.json({ user: req.user });
  } catch (e) {
    next(e);
  }
});

// Dépôt du CV PDF + extraction automatique
router.post('/me/cv', protect, authorize('student'), uploadPdf.single('cv'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Fichier PDF requis' });
    const { text, data } = await extractFromPdf(req.file.path);
    req.user.cvPath = `/uploads/${path.basename(req.file.path)}`;
    req.user.cvText = text;
    req.user.cvData = data;
    // Fusionne les compétences détectées avec celles déjà saisies
    req.user.skills = [...new Set([...(req.user.skills || []), ...data.skills])];
    await req.user.save();
    res.json({ cvPath: req.user.cvPath, extracted: data, skills: req.user.skills });
  } catch (e) {
    next(e);
  }
});

// Étudiants suivis par l'école
router.get('/school/students', protect, authorize('school'), async (req, res, next) => {
  try {
    res.json(await User.find({ role: 'student', school: req.user._id }).select('-cvText'));
  } catch (e) {
    next(e);
  }
});

// Profil d'un candidat (entreprise : seulement si candidat à l'une de ses offres)
router.get('/:id', protect, async (req, res, next) => {
  try {
    const target = await User.findById(req.params.id).select('-cvText');
    if (!target) return res.status(404).json({ message: 'Utilisateur introuvable' });
    if (req.user.role === 'company' && target.role === 'student') {
      const apps = await Application.find({ student: target._id }).populate('offer', 'company');
      if (!apps.some((a) => String(a.offer.company) === String(req.user._id))) {
        return res.status(403).json({ message: 'Accès refusé' });
      }
    }
    res.json(target);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
