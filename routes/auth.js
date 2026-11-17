const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const publicUser = (u) => ({
  id: u._id,
  role: u.role,
  email: u.email,
  name: u.name,
});

router.post('/register', async (req, res, next) => {
  try {
    const { role, email, password, name, ...rest } = req.body;
    if (!['student', 'company', 'school'].includes(role)) return res.status(400).json({ message: 'Rôle invalide' });
    if (!email || !password || !name) return res.status(400).json({ message: 'Nom, email et mot de passe requis' });
    if (password.length < 6) return res.status(400).json({ message: 'Mot de passe : 6 caractères minimum' });
    if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ message: 'Email déjà utilisé' });

    const allowed = ['phone', 'schoolName', 'school', 'fieldOfStudy', 'educationLevel', 'sector', 'website', 'address', 'description'];
    const extra = Object.fromEntries(Object.entries(rest).filter(([k, v]) => allowed.includes(k) && v !== ''));
    const user = await User.create({ role, email, password, name, ...extra });
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (e) {
    next(e);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password || ''))) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (e) {
    next(e);
  }
});

router.get('/me', protect, (req, res) => res.json({ user: req.user }));

module.exports = router;