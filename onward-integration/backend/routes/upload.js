/*
 * routes/upload.js
 *
 * POST /api/upload  (multipart/form-data, field "file") -> { url }
 *
 * On Firebase (STORE=firestore) this stores the image in Firebase Storage and
 * returns a durable Firebase download URL (used for KYC documents and profile
 * images). Locally it falls back to disk under /uploads. Accepts admin OR
 * player tokens so logged-in players can upload their own KYC docs.
 *
 * NOTE: we parse with busboy off `req.rawBody`. Inside Cloud Functions the body
 * is already buffered, so streaming parsers like multer fail with
 * "Unexpected end of form" — feeding busboy the buffered body fixes that.
 */
const express = require('express');
const busboy = require('busboy');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { requireAnyUser } = require('../auth');

const router = express.Router();
const useStorage = (process.env.STORE || '').toLowerCase().startsWith('fire');
const MAX_BYTES = 8 * 1024 * 1024;
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');

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

// Parse a single-file multipart body. Uses req.rawBody when present (Cloud
// Functions), otherwise streams the request.
function parseUpload(req) {
  return new Promise((resolve, reject) => {
    let bb;
    try {
      bb = busboy({ headers: req.headers, limits: { fileSize: MAX_BYTES, files: 1 } });
    } catch (e) {
      return reject(new Error('Invalid upload request'));
    }
    const fields = {};
    let fileBuf = null;
    let info = null;
    let tooBig = false;

    bb.on('field', (name, val) => { fields[name] = val; });
    bb.on('file', (name, stream, fileInfo) => {
      info = fileInfo;
      const chunks = [];
      stream.on('data', (d) => chunks.push(d));
      stream.on('limit', () => { tooBig = true; stream.resume(); });
      stream.on('end', () => { fileBuf = Buffer.concat(chunks); });
    });
    bb.on('error', reject);
    bb.on('close', () => {
      if (tooBig) return reject(new Error('File too large (max 8 MB)'));
      resolve({ fields, fileBuf, info });
    });

    if (req.rawBody) bb.end(req.rawBody);
    else req.pipe(bb);
  });
}

router.post('/', requireAnyUser, async (req, res) => {
  let parsed;
  try {
    parsed = await parseUpload(req);
  } catch (e) {
    return res.status(400).json({ error: e.message || 'Upload failed' });
  }
  const { fields, fileBuf, info } = parsed;
  if (!fileBuf || !fileBuf.length) return res.status(400).json({ error: 'No file uploaded' });
  const mime = (info && (info.mimeType || info.mimetype)) || '';
  if (!/^image\//.test(mime)) return res.status(400).json({ error: 'Only image files are allowed' });

  const ext = path.extname((info && info.filename) || '').toLowerCase() || '.png';

  const b = getBucket();
  if (b) {
    try {
      const folder = /kyc/i.test(fields.kind || '') ? 'kyc' : (fields.kind === 'avatar' ? 'avatars' : 'uploads');
      const name = `${folder}/${Date.now()}-${crypto.randomBytes(5).toString('hex')}${ext}`;
      const token = crypto.randomUUID();
      await b.file(name).save(fileBuf, {
        resumable: false,
        contentType: mime,
        metadata: {
          contentType: mime,
          cacheControl: 'public, max-age=31536000',
          metadata: { firebaseStorageDownloadTokens: token },
        },
      });
      const url = `https://firebasestorage.googleapis.com/v0/b/${b.name}/o/${encodeURIComponent(name)}?alt=media&token=${token}`;
      return res.json({ url, filename: name });
    } catch (e) {
      console.error('[upload] storage save failed:', e.message);
      return res.status(500).json({ error: 'Upload failed: ' + e.message });
    }
  }

  // Local disk fallback.
  try {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    const fname = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, fname), fileBuf);
    const base = `${req.protocol}://${req.get('host')}`;
    res.json({ url: `${base}/uploads/${fname}`, filename: fname });
  } catch (e) {
    res.status(500).json({ error: 'Upload failed: ' + e.message });
  }
});

module.exports = router;
