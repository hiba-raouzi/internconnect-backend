const express = require('express');
const Offer = require('../models/Offer');
const Application = require('../models/Application');
const Convention = require('../models/Convention');
const Internship = require('../models/Internship');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Tableau de bord analytique, adapté au rôle
router.get('/dashboard', protect, async (req, res, next) => {
  try {
    const role = req.user.role;

    if (role === 'company') {
      const offers = await Offer.find({ company: req.user._id }).select('_id title status');
      const ids = offers.map((o) => o._id);
      const apps = await Application.find({ offer: { $in: ids } });
      const byStatus = {};
      apps.forEach((a) => (byStatus[a.status] = (byStatus[a.status] || 0) + 1));
      const scored = apps.filter((a) => a.analysis?.total !== undefined);
      const avg = scored.length ? Math.round(scored.reduce((s, a) => s + a.analysis.total, 0) / scored.length) : 0;
      const skillCount = {};
      for (const a of apps) (a.analysis?.matchedSkills || []).forEach((s) => (skillCount[s] = (skillCount[s] || 0) + 1));
      const missingCount = {};
      for (const a of apps) (a.analysis?.missingSkills || []).forEach((s) => (missingCount[s] = (missingCount[s] || 0) + 1));
      const top = (m) => Object.entries(m).sort((x, y) => y[1] - x[1]).slice(0, 6).map(([skill, count]) => ({ skill, count }));
      return res.json({
        role,
        offers: offers.length,
        openOffers: offers.filter((o) => o.status === 'open').length,
        applications: apps.length,
        byStatus,
        averageScore: avg,
        topSkills: top(skillCount),
        mostMissingSkills: top(missingCount),
        conventions: await Convention.countDocuments({ company: req.user._id }),
        internships: await Internship.countDocuments({ company: req.user._id }),
      });
    }

    if (role === 'student') {
      const apps = await Application.find({ student: req.user._id });
      const byStatus = {};
      apps.forEach((a) => (byStatus[a.status] = (byStatus[a.status] || 0) + 1));
      // Compétences manquantes les plus fréquentes dans mes candidatures
      const missing = {};
      apps.forEach((a) => (a.analysis?.missingSkills || []).forEach((s) => (missing[s] = (missing[s] || 0) + 1)));
      return res.json({
        role,
        applications: apps.length,
        byStatus,
        skillsToImprove: Object.entries(missing).sort((x, y) => y[1] - x[1]).slice(0, 6).map(([skill, count]) => ({ skill, count })),
        conventions: await Convention.countDocuments({ student: req.user._id }),
        internships: await Internship.countDocuments({ student: req.user._id }),
      });
    }

    // école
    const students = await User.find({ role: 'student', school: req.user._id }).select('_id');
    const sids = students.map((s) => s._id);
    const internships = await Internship.find({ school: req.user._id });
    const byStatus = {};
    internships.forEach((i) => (byStatus[i.status] = (byStatus[i.status] || 0) + 1));
    return res.json({
      role,
      students: students.length,
      studentsWithApplications: (await Application.distinct('student', { student: { $in: sids } })).length,
      conventionsPending: await Convention.countDocuments({ school: req.user._id, status: 'pending_signatures' }),
      conventionsValidated: await Convention.countDocuments({ school: req.user._id, status: 'validated' }),
      internships: internships.length,
      byStatus,
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
