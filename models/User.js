const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['student', 'company', 'school'], required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    name: { type: String, required: true, trim: true }, // nom étudiant / entreprise / école
    phone: String,
    // Étudiant
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    schoolName: String,
    fieldOfStudy: String,
    educationLevel: { type: String, enum: ['bac', 'bac+2', 'bac+3', 'bac+5', 'doctorat', ''], default: '' },
    skills: [String],
    languages: [{ name: String, level: String }],
    bio: String,
    cvPath: String,
    cvText: String,
    cvData: { type: Object }, // résultat de l'extraction
    // Entreprise
    sector: String,
    website: String,
    address: String,
    description: String,
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', userSchema);
