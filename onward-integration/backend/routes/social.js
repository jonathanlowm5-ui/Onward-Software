/*
 * routes/social.js — the casino's official social-media links, shown in the
 * footer "Follow Us" row and editable from the admin "Web Design" area.
 *
 * GET /api/social-links  (public) -> { facebook, telegram, whatsapp, ... }
 * PUT /api/social-links  (admin)  -> save the provided keys
 *
 * Stored in app_settings (settings.socialLinks).
 */
const express = require('express');
const store = require('../store');
const { requireAuth } = require('../auth');
const { requirePerm } = require('../permissions');

const router = express.Router();
const KEYS = ['facebook', 'telegram', 'whatsapp', 'instagram', 'twitter', 'kwai'];

function current() {
  const m = store.getSettings().socialLinks || {};
  const out = {};
  KEYS.forEach((k) => { out[k] = typeof m[k] === 'string' ? m[k] : ''; });
  return out;
}

router.get('/', (req, res) => res.json(current()));

router.put('/', requireAuth, requirePerm('settings.manage'), (req, res) => {
  const b = req.body || {};
  const next = { ...(store.getSettings().socialLinks || {}) };
  KEYS.forEach((k) => { if (k in b) next[k] = String(b[k] || '').trim().slice(0, 2048); });
  store.saveSettings({ socialLinks: next, socialLinksUpdatedAt: new Date().toISOString() });
  res.json(current());
});

module.exports = router;
