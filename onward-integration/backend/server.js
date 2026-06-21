/*
 * server.js — the Onward shared API.
 *
 * Run:  npm install && npm start
 * Default port 4000 (override with PORT env var).
 *
 *   Public (frontend reads):
 *     GET  /api/games?category=&enabled=1
 *     GET  /api/banners?active=1
 *     GET  /api/promotions?active=1
 *   Admin (writes, require Bearer token):
 *     POST /api/auth/login
 *     CRUD /api/games   /api/banners   /api/promotions
 *     GET/PUT /api/settings
 *     POST /api/upload
 *   Static:
 *     /uploads/<file>     uploaded images
 */
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const store = require('./store');

const app = express();
const PORT = process.env.PORT || 4000;

// Uploads dir. On Cloud Functions __dirname is read-only, so the entry point
// sets UPLOAD_DIR to a writable tmp path. Never crash if it can't be created.
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
try {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
} catch (e) {
  console.warn('[uploads] could not create dir:', e.message);
}

// CORS: allow the admin & frontend to call from any origin (including file://).
// In production, replace `origin: true` with your real domains.
app.use(cors({ origin: true }));
app.use(express.json({ limit: '12mb' })); // large limit so base64 data-URI images work
app.use('/uploads', express.static(UPLOAD_DIR));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/games', require('./routes/games'));
app.use('/api/banners', require('./routes/banners'));
app.use('/api/promotions', require('./routes/promotions'));
app.use('/api/players', require('./routes/players'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/aggregator', require('./routes/aggregator'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/kyc', require('./routes/kyc'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/player', require('./routes/player'));
app.use('/api/agents', require('./routes/agents'));
app.use('/api/vip', require('./routes/vip'));

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'onward-api' }));

// Multer / generic error handler -> JSON (so the admin can show a toast).
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(400).json({ error: err.message || 'Request failed' });
});

// Seed an admin user + demo content on first run (idempotent). Wait for the
// store to be ready first (Firestore loads its cache asynchronously; the file
// and SQLite backends resolve immediately). `whenSeeded` lets the serverless
// entry point hold the first request until the catalogue exists.
const whenReady = store.whenReady || Promise.resolve();
app.whenSeeded = whenReady
  .then(() => require('./seed')())
  .catch((e) => console.error('[seed] skipped:', e.message));

// Only listen when started directly (local dev / `npm start`). When required by
// the Cloud Functions entry point we just export the app.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Onward API listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
