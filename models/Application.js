const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    offer: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    coverLetter: String,
    cvPath: String,
    status: {
      type: String,
      enum: ['submitted', 'reviewing', 'shortlisted', 'accepted', 'rejected'],
      default: 'submitted',
    },
    // Résultat de l'analyse intelligente
    analysis: {
      total: Number,
      breakdown: {
        skills: Number,
        education: Number,
        experience: Number,
        languages: Number,
      },
      matchedSkills: [String],
      missingSkills: [String],
      meetsMinimum: Boolean,
      analyzedAt: Date,
    },
    companyNote: String,
  },
  { timestamps: true }
);

applicationSchema.index({ offer: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
