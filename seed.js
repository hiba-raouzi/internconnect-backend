   const dns = require('dns');
   dns.setServers(['8.8.8.8', '1.1.1.1']);

// Données de démonstration : node seed.js  (ATTENTION : vide les collections)
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Offer = require('./models/Offer');
const Application = require('./models/Application');
const Convention = require('./models/Convention');
const Internship = require('./models/Internship');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await Promise.all([User, Offer, Application, Convention, Internship].map((m) => m.deleteMany({})));

  const school = await User.create({ role: 'school', name: 'ENSA Tanger', email: 'ecole@demo.com', password: 'demo1234', address: 'Tanger, Maroc' });
  const company = await User.create({ role: 'company', name: 'TechNova', email: 'entreprise@demo.com', password: 'demo1234', sector: 'Développement logiciel', address: 'Tanger Free Zone' });
  await User.create({
    role: 'student', name: 'Sara El Amrani', email: 'etudiant@demo.com', password: 'demo1234', school: school._id,
    fieldOfStudy: 'Génie informatique', educationLevel: 'bac+5', skills: ['react', 'node.js', 'mongodb'],
    languages: [{ name: 'français', level: 'C1' }, { name: 'anglais', level: 'B2' }],
  });

  await Offer.create({
    company: company._id, title: 'Stage PFE Développement Full Stack', type: 'PFE', location: 'Tanger', duration: '6 mois',
    description: 'Concevoir et développer des fonctionnalités web (React, Node.js, MongoDB) au sein de notre équipe produit.',
    requiredSkills: ['react', 'typescript', 'node.js', 'mongodb'], niceToHaveSkills: ['docker', 'git'],
    requiredEducation: 'bac+5', fieldKeywords: ['informatique'], minExperienceItems: 2,
    requiredLanguages: [{ name: 'français', level: 'B2' }, { name: 'anglais', level: 'B2' }],
    weights: { skills: 40, education: 20, experience: 20, languages: 20 }, minScore: 50,
    deadline: new Date(Date.now() + 30 * 24 * 3600 * 1000),
  });

  console.log('Données de démo créées. Comptes (mot de passe demo1234) : etudiant@demo.com, entreprise@demo.com, ecole@demo.com');
  await mongoose.disconnect();
})();
