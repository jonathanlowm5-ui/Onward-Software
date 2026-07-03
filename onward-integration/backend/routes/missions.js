/*
 * routes/missions.js — admin-managed player missions/challenges shown on the
 * player site's Missions page.
 *
 * GET /api/missions            (public) -> [ ...missions ]
 *     ?active=1                only enabled ones
 * PUT /api/missions            (admin, settings.manage) -> save full list
 *
 * Stored in app_settings (settings.missions). Each entry:
 *   { id, enabled, icon, title, desc, type, target, reward, duration }
 */
const express = require('express');
const store = require('../store');
const { requireAuth } = require('../auth');
const { requirePerm } = require('../permissions');

const router = express.Router();

const TYPES = ['deposit', 'wager', 'login', 'referral', 'game', 'other'];
const str = (v, n) => String(v == null ? '' : v).slice(0, n);
let seq = 0;
const newId = () => 'm' + Date.now().toString(36) + (seq++).toString(36);

function clean(m) {
  if (!m || typeof m !== 'object') return null;
  const title = str(m.title, 160).trim();
  if (!title) return null;
  return {
    id: str(m.id, 40) || newId(),
    enabled: m.enabled == null ? true : !!m.enabled,
    icon: str(m.icon, 8).trim() || '🎯',
    title,
    desc: str(m.desc, 400).trim(),
    type: TYPES.includes(m.type) ? m.type : 'other',
    target: str(m.target, 60).trim(),     // e.g. "7", "₱10,000"
    reward: str(m.reward, 80).trim(),     // e.g. "₱200", "50 FS"
    duration: str(m.duration, 60).trim(), // e.g. "7 days", "Ongoing"
  };
}

const list = () => {
  const s = store.getSettings();
  return Array.isArray(s.missions) ? s.missions : [];
};

router.get('/', (req, res) => {
  let items = list();
  if (String(req.query.active || '') === '1') items = items.filter((m) => m.enabled !== false);
  res.json(items);
});

router.put('/', requireAuth, requirePerm('settings.manage'), (req, res) => {
  const items = (Array.isArray(req.body && req.body.items) ? req.body.items : [])
    .map(clean).filter(Boolean).slice(0, 100);
  store.saveSettings({ missions: items, missionsUpdatedAt: new Date().toISOString() });
  res.json(items);
});

module.exports = router;
