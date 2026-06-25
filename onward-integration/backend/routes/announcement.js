/*
 * routes/announcement.js — a single site-wide announcement shown as a scrolling
 * ticker at the top of the player site (for emergency / important notices).
 *
 * GET  /api/announcement            (public)  -> { enabled, text, level }
 * PUT  /api/announcement            (admin, settings.manage) -> save
 *
 * Stored in app_settings (settings.announcement) so it is a single source of
 * truth and can be toggled instantly.
 */
const express = require('express');
const store = require('../store');
const { requireAuth } = require('../auth');

const router = express.Router();
const LEVELS = ['info', 'warning', 'critical'];

function current() {
  const a = store.getSettings().announcement;
  if (!a || typeof a !== 'object') return { enabled: false, text: '', level: 'info' };
  return {
    enabled: !!a.enabled,
    text: String(a.text || ''),
    level: LEVELS.includes(a.level) ? a.level : 'info',
  };
}

router.get('/', (req, res) => {
  res.json(current());
});

// Any logged-in admin can post/clear an emergency announcement (no elevated
// permission required, so it can go out fast).
router.put('/', requireAuth, (req, res) => {
  const b = req.body || {};
  const next = {
    enabled: !!b.enabled,
    text: String(b.text || '').slice(0, 500),
    level: LEVELS.includes(b.level) ? b.level : 'info',
  };
  store.saveSettings({ announcement: next, announcementUpdatedAt: new Date().toISOString() });
  res.json(next);
});

module.exports = router;
