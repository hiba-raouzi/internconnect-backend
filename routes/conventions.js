const express = require('express');
const path = require('path');
const PDFDocument = require('pdfkit');
const Convention = require('../models/Convention');
const Application = require('../models/Application');
const Internship = require('../models/Internship');
const { protect, authorize } = require('../middleware/auth');
const { uploadPdf } = require('../middleware/upload');

const router = express.Router();

const isParty = (conv, user) =>
  [conv.student, conv.company, conv.school].filter(Boolean).some((id) => String(id._id || id) === String(user._id));

const populateAll = (q) =>
  q
    .populate('student', 'name email fieldOfStudy educationLevel schoolName')
    .populate('company', 'name email address sector')
    .populate('school', 'name email address')
    .populate('offer', 'title type location duration description');

// L'entreprise génère une convention à partir d'une candidature acceptée
router.post('/', protect, authorize('company'), async (req, res, next) => {
  try {
    const app = await Application.findById(req.body.applicationId).populate('offer').populate('student');
    if (!app || String(app.offer.company) !== String(req.user._id)) {
      return res.status(404).json({ message: 'Candidature introuvable' });
    }
    if (app.status !== 'accepted') return res.status(400).json({ message: 'La candidature doit être acceptée' });
    if (await Convention.findOne({ application: app._id })) {
      return res.status(409).json({ message: 'Une convention existe déjà pour cette candidature' });
    }
    const { startDate, endDate, missions, tutorCompany, tutorSchool } = req.body;
    const conv = await Convention.create({
      application: app._id,
      offer: app.offer._id,
      student: app.student._id,
      company: req.user._id,
      school: app.student.school,
      startDate: startDate || app.offer.startDate,
      endDate,
      missions: missions || app.offer.description,
      tutorCompany,
      tutorSchool,
      status: 'pending_signatures',
      signatures: { student: false, company: true, school: false }, // l'entreprise signe en la générant
    });
    res.status(201).json(conv);
  } catch (e) {
    next(e);
  }
});

// Mes conventions (tous rôles)
router.get('/mine', protect, async (req, res, next) => {
  try {
    const key = { student: 'student', company: 'company', school: 'school' }[req.user.role];
    res.json(await populateAll(Convention.find({ [key]: req.user._id }).sort('-createdAt')));
  } catch (e) {
    next(e);
  }
});

router.get('/:id', protect, async (req, res, next) => {
  try {
    const conv = await populateAll(Convention.findById(req.params.id));
    if (!conv || !isParty(conv, req.user)) return res.status(404).json({ message: 'Convention introuvable' });
    res.json(conv);
  } catch (e) {
    next(e);
  }
});

// Signature / validation par chaque acteur. Quand les 3 ont signé -> validée + stage créé
router.post('/:id/sign', protect, async (req, res, next) => {
  try {
    const conv = await Convention.findById(req.params.id);
    if (!conv || !isParty(conv, req.user)) return res.status(404).json({ message: 'Convention introuvable' });
    if (conv.status === 'rejected') return res.status(400).json({ message: 'Convention refusée' });
    conv.signatures[req.user.role] = true;
    const { student, company, school } = conv.signatures;
    // Si l'étudiant n'est rattaché à aucune école, la validation école n'est pas requise
    if (student && company && (school || !conv.school)) {
      conv.status = 'validated';
      if (!(await Internship.findOne({ convention: conv._id }))) {
        await Internship.create({
          convention: conv._id,
          student: conv.student,
          company: conv.company,
          school: conv.school,
          offer: conv.offer,
          status: 'planned',
          steps: [
            { title: 'Accueil et intégration', status: 'todo' },
            { title: 'Définition des objectifs', status: 'todo' },
            { title: 'Réalisation des missions', status: 'todo' },
            { title: 'Point intermédiaire avec le tuteur', status: 'todo' },
            { title: 'Rapport de stage et soutenance', status: 'todo' },
          ],
        });
      }
    }
    await conv.save();
    res.json(conv);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/reject', protect, async (req, res, next) => {
  try {
    const conv = await Convention.findById(req.params.id);
    if (!conv || !isParty(conv, req.user)) return res.status(404).json({ message: 'Convention introuvable' });
    if (conv.status === 'validated') return res.status(400).json({ message: 'Convention déjà validée' });
    conv.status = 'rejected';
    await conv.save();
    res.json(conv);
  } catch (e) {
    next(e);
  }
});

// Gestion des documents
router.post('/:id/documents', protect, uploadPdf.single('file'), async (req, res, next) => {
  try {
    const conv = await Convention.findById(req.params.id);
    if (!conv || !isParty(conv, req.user)) return res.status(404).json({ message: 'Convention introuvable' });
    if (!req.file) return res.status(400).json({ message: 'Fichier PDF requis' });
    conv.documents.push({
      name: req.body.name || req.file.originalname,
      path: `/uploads/${path.basename(req.file.path)}`,
      uploadedBy: req.user._id,
    });
    await conv.save();
    res.status(201).json(conv.documents);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id/documents/:docId', protect, async (req, res, next) => {
  try {
    const conv = await Convention.findById(req.params.id);
    if (!conv || !isParty(conv, req.user)) return res.status(404).json({ message: 'Convention introuvable' });
    const doc = conv.documents.id(req.params.docId);
    if (!doc || String(doc.uploadedBy) !== String(req.user._id)) return res.status(403).json({ message: 'Accès refusé' });
    doc.deleteOne();
    await conv.save();
    res.json(conv.documents);
  } catch (e) {
    next(e);
  }
});

// Génération du PDF de la convention de stage
router.get('/:id/pdf', protect, async (req, res, next) => {
  try {
    const conv = await populateAll(Convention.findById(req.params.id));
    if (!conv || !isParty(conv, req.user)) return res.status(404).json({ message: 'Convention introuvable' });

    const fmt = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '____/____/______');
    const doc = new PDFDocument({ margin: 60 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="convention-${conv._id}.pdf"`);
    doc.pipe(res);

    doc.fontSize(20).text('CONVENTION DE STAGE', { align: 'center' }).moveDown(0.3);
    doc.fontSize(10).fillColor('#666').text(`Référence : ${conv._id} — Générée via InternConnect`, { align: 'center' }).fillColor('#000').moveDown(1.5);

    const section = (title) => doc.moveDown(0.8).fontSize(13).fillColor('#1d4ed8').text(title).fillColor('#000').moveDown(0.3).fontSize(11);

    section('Article 1 — Les parties');
    doc.text(`Établissement : ${conv.school?.name || 'Non renseigné'} ${conv.school?.address ? '— ' + conv.school.address : ''}`);
    doc.text(`Entreprise d'accueil : ${conv.company.name}${conv.company.address ? ' — ' + conv.company.address : ''}`);
    doc.text(`Stagiaire : ${conv.student.name} (${conv.student.email})`);
    doc.text(`Formation : ${conv.student.fieldOfStudy || '—'} ${conv.student.educationLevel ? '(' + conv.student.educationLevel + ')' : ''}`);

    section('Article 2 — Objet et durée du stage');
    doc.text(`Intitulé : ${conv.offer.title} (${conv.offer.type})`);
    doc.text(`Lieu : ${conv.offer.location || '—'}`);
    doc.text(`Du ${fmt(conv.startDate)} au ${fmt(conv.endDate)}`);

    section('Article 3 — Missions confiées');
    doc.text(conv.missions || 'À définir avec le tuteur.');

    section('Article 4 — Encadrement');
    doc.text(`Tuteur entreprise : ${conv.tutorCompany?.name || '—'} ${conv.tutorCompany?.email ? '(' + conv.tutorCompany.email + ')' : ''}`);
    doc.text(`Tuteur pédagogique : ${conv.tutorSchool?.name || '—'} ${conv.tutorSchool?.email ? '(' + conv.tutorSchool.email + ')' : ''}`);

    section('Article 5 — Engagements');
    doc.text(
      "Le stagiaire s'engage à respecter le règlement intérieur de l'entreprise et la confidentialité des informations. " +
        "L'entreprise s'engage à encadrer le stagiaire et à évaluer son travail. L'établissement assure le suivi pédagogique."
    );

    section('Signatures');
    const sig = (label, ok) => `${label} : ${ok ? '✔ Signé électroniquement' : 'En attente'}`;
    doc.text(sig('Étudiant', conv.signatures.student));
    doc.text(sig('Entreprise', conv.signatures.company));
    doc.text(sig('École', conv.signatures.school));
    doc.moveDown(1).fontSize(10).fillColor('#666').text(`Statut : ${conv.status}`);
    doc.end();
  } catch (e) {
    next(e);
  }
});

module.exports = router;
