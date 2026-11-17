const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  dueDate: Date,
  status: { type: String, enum: ['todo', 'in_progress', 'done'], default: 'todo' },
});

const evaluationSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    authorRole: { type: String, enum: ['company', 'school'] },
    technical: { type: Number, min: 0, max: 20 },
    autonomy: { type: Number, min: 0, max: 20 },
    communication: { type: Number, min: 0, max: 20 },
    punctuality: { type: Number, min: 0, max: 20 },
    comment: String,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const internshipSchema = new mongoose.Schema(
  {
    convention: { type: mongoose.Schema.Types.ObjectId, ref: 'Convention', required: true, unique: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    offer: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer' },
    status: { type: String, enum: ['planned', 'ongoing', 'completed'], default: 'planned' },
    steps: [stepSchema],
    evaluations: [evaluationSchema],
  },
  { timestamps: true }
);

internshipSchema.virtual('progress').get(function () {
  if (!this.steps.length) return 0;
  return Math.round((this.steps.filter((s) => s.status === 'done').length / this.steps.length) * 100);
});
internshipSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Internship', internshipSchema);
