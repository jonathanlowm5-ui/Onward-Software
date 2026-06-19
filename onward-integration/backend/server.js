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

const app = express();
const PORT = process.env.PORT || 4000;

// Ensure uploads dir exists.
fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });

// CORS: allow the admin & frontend to call from any origin (including file://).
// In production, replace `origin: true` with your real domains.
app.use(cors({ origin: true }));
app.use(express.json({ limit: '12mb' })); // large limit so base64 data-URI images work
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'onward-api' }));

// Multer / generic error handler -> JSON (so the admin can show a toast).
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(400).json({ error: err.message || 'Request failed' });
});

// Seed an admin user + demo content on first run (idempotent).
require('./seed')();

app.listen(PORT, () => {
  console.log(`Onward API listening on http://localhost:${PORT}`);
});
