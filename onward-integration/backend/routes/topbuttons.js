/*
 * routes/topbuttons.js — the category buttons across the top of the player
 * site header (the "pills" row) plus the bar background. Fully admin-editable
 * from Web Design: label, icon, gradient colours, target URL, on/off.
 *
 * GET /api/top-buttons          (public) -> { bg, buttons: [...] }
 * PUT /api/top-buttons          (admin, settings.manage) -> save
 */
const express = require('express');
const store = require('../store');
const { requireAuth } = require('../auth');
const { requirePerm } = require('../permissions');

const router = express.Router();
const str = (v, n) => String(v == null ? '' : v).slice(0, n);
let seq = 0;
const newId = () => 'tb' + Date.now().toString(36) + (seq++).toString(36);

// Defaults mirror the current live header (Promotions + Giveaway on) with the
// extra classic buttons ready to switch on.
const DEFAULTS = [
  { id: 'promos', label: 'Promotions', icon: '🎁', c1: '#b81a5a', c2: '#7d0d3d', url: '/promotions', enabled: true, badge: true },
  { id: 'giveaway', label: 'Giveaway', icon: '🎮', c1: '#1565c0', c2: '#0a3d7a', url: '/giveaways', enabled: true, badge: false },
  { id: 'casino', label: 'Casino', icon: '🎰', c1: '#ff5a3c', c2: '#c41e3a', url: '/slots', enabled: false, badge: false },
  { id: 'sport', label: 'Sport', icon: '⚽', c1: '#1fa05f', c2: '#0c5c39', url: '/sports', enabled: false, badge: false },
  { id: 'rewards', label: 'Rewards', icon: '💵', c1: '#e8a23d', c2: '#b8771e', url: '/missions', enabled: false, badge: false },
];

const HEX = /^#[0-9a-fA-F]{3,8}$/;
const color = (v, fb) => (HEX.test(String(v || '')) ? v : fb);

function cleanButton(b) {
  if (!b || typeof b !== 'object') return null;
  const label = str(b.label, 40).trim();
  if (!label) return null;
  return {
    id: str(b.id, 40) || newId(),
    label,
    icon: str(b.icon, 8).trim() || '🎯',
    c1: color(b.c1, '#b81a5a'),
    c2: color(b.c2, '#7d0d3d'),
    url: str(b.url, 500).trim() || '/',
    enabled: b.enabled !== false,
    badge: !!b.badge,
  };
}

function current() {
  const s = store.getSettings();
  const buttons = Array.isArray(s.topButtons) && s.topButtons.length
    ? s.topButtons.map(cleanButton).filter(Boolean)
    : DEFAULTS;
  return { bg: str(s.topButtonsBg, 40), buttons };
}

router.get('/', (req, res) => res.json(current()));

router.put('/', requireAuth, requirePerm('settings.manage'), (req, res) => {
  const b = req.body || {};
  const buttons = (Array.isArray(b.buttons) ? b.buttons : []).map(cleanButton).filter(Boolean).slice(0, 12);
  const bg = HEX.test(String(b.bg || '')) ? b.bg : '';
  store.saveSettings({ topButtons: buttons.length ? buttons : DEFAULTS, topButtonsBg: bg });
  res.json(current());
});

module.exports = router;
