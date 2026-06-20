/*
 * routes/upload.js
 *
 * POST /api/upload  (multipart/form-data, field "file") -> { url }
 *
 * On Firebase (STORE=firestore) this stores the image in Firebase Storage and
 * returns a durable public download URL (used for KYC documents and profile
 * images). Locally it falls back to disk under /uploads. Accepts admin OR
 * player tokens so logged-in players can upload their own KYC docs.
 */
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { requireAnyUser } = require('../auth');

const router = express.Router();
const useStorage = (process.env.STORE || '').toLowerCase().startsWith('fire');

// Lazily get the Firebase Storage bucket (only when using Firestore/Storage).
let bucket = null;
function getBucket() {
  if (!useStorage) return null;
  if (bucket) return bucket;
  try {
    const admin = require('firebase-admin');
    if (!admin.apps.length) admin.initializeApp();
    const name = process.env.STORAGE_BUCKET || `${process.env.GCLOUD_PROJECT || 'onward-1590a'}.firebasestorage.app`;
    bucket = admin.storage().bucket(name);
  } catch (e) {
    console.error('[upload] storage init failed:', e.message);
  }
  return bucket;
}

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');

// Memory storage when uploading to Firebase; disk storage for local dev.
const storage = useStorage
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => { try { fs.mkdirSync(UPLOAD_DIR, { recursive: true }); } catch { /* */ } cb(null, UPLOAD_DIR); },
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

router.post('/', requireAnyUser, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const b = getBucket();
  if (b) {
    try {
      const ext = path.extname(req.file.originalname).toLowerCase() || '.png';
      const folder = /kyc/i.test(req.body?.kind || '') ? 'kyc' : (req.body?.kind === 'avatar' ? 'avatars' : 'uploads');
      const name = `${folder}/${Date.now()}-${crypto.randomBytes(5).toString('hex')}${ext}`;
      const token = crypto.randomUUID();
      const file = b.file(name);
      await file.save(req.file.buffer, {
        resumable: false,
        contentType: req.file.mimetype,
        metadata: {
          contentType: req.file.mimetype,
          cacheControl: 'public, max-age=31536000',
          metadata: { firebaseStorageDownloadTokens: token },
        },
      });
      // Firebase download URL — works with uniform bucket-level access.
      const url = `https://firebasestorage.googleapis.com/v0/b/${b.name}/o/${encodeURIComponent(name)}?alt=media&token=${token}`;
      return res.json({ url, filename: name });
    } catch (e) {
      console.error('[upload] storage save failed:', e.message);
      return res.status(500).json({ error: 'Upload failed: ' + e.message });
    }
  }

  // Local disk fallback.
  const base = `${req.protocol}://${req.get('host')}`;
  res.json({ url: `${base}/uploads/${req.file.filename}`, filename: req.file.filename });
});

module.exports = router;
