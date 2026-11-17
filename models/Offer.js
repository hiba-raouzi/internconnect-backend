const mongoose = require('mongoose');

const criteriaSchema = new mongoose.Schema(
  {
    skills: { type: Number, default: 40 },
    education: { type: Number, default: 20 },
    experience: { type: Number, default: 20 },
    languages: { type: Number, default: 20 },
  },
  { _id: false }
);

const offerSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    type: { type: String, enum: ['PFE', 'Stage été', 'Stage initiation', 'Stage perfectionnement'], default: 'PFE' },
    location: String,
    duration: String, // ex : "6 mois"
    startDate: Date,
    deadline: Date,
    remote: { type: Boolean, default: false },
    // Critères de sélection
    requiredSkills: [String],
    niceToHaveSkills: [String],
    requiredEducation: { type: String, enum: ['', 'bac', 'bac+2', 'bac+3', 'bac+5', 'doctorat'], default: '' },
    fieldKeywords: [String], // ex : informatique, génie logiciel
    minExperienceItems: { type: Number, default: 0 }, // projets / expériences minimum
    requiredLanguages: [{ name: String, level: String }],
    weights: { type: criteriaSchema, default: () => ({}) },
    minScore: { type: Number, default: 0 }, // seuil minimum global
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Offer', offerSchema);
