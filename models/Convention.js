const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    name: String,
    path: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const conventionSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true, unique: true },
    offer: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    startDate: Date,
    endDate: Date,
    tutorCompany: { name: String, email: String, phone: String },
    tutorSchool: { name: String, email: String },
    missions: String,
    // Circuit de validation : étudiant -> entreprise -> école
    signatures: {
      student: { type: Boolean, default: false },
      company: { type: Boolean, default: false },
      school: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: ['draft', 'pending_signatures', 'validated', 'rejected'],
      default: 'draft',
    },
    documents: [documentSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Convention', conventionSchema);
