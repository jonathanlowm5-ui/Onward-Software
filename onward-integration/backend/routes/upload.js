/*
 * routes/upload.js
 *
 * POST /api/upload  (admin, multipart/form-data, field name "file")
 *   -> { url: "http://host/uploads/<filename>" }
 *
 * Used by the admin's "Upload Game Image / Banner Image / Promotion Image"
 * controls. The returned url is what you store in the record's image field.
 */
const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { requireAuth } = require('../auth');

const router = express.Router();
// Matches server.js. On Cloud Functions this is a writable tmp path (uploads are
// ephemeral there — swap for Firebase Storage / S3 for durable image hosting).
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

router.post('/', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const base = `${req.protocol}://${req.get('host')}`;
  res.json({ url: `${base}/uploads/${req.file.filename}`, filename: req.file.filename });
});

module.exports = router;
