const path = require('path');
const fs = require('fs');
const multer = require('multer');

const dir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  },
});

const pdfOnly = (req, file, cb) => {
  if (file.mimetype !== 'application/pdf') return cb(new Error('Seuls les fichiers PDF sont acceptés'));
  cb(null, true);
};

module.exports = {
  uploadPdf: multer({ storage, fileFilter: pdfOnly, limits: { fileSize: 5 * 1024 * 1024 } }),
  uploadsDir: dir,
};
