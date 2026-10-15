/*
 * routes/floating.js — floating promo images shown over the player site
 * (small clickable widgets pinned to a corner, 50–100 px).
 *
 * GET /api/floating            (public) -> enabled floats
 * GET /api/floating/all        (admin)  -> full list
 * PUT /api/floating            (admin, content.manage) -> save list
 */
const express = require('express');
const store = require('../store');
const { requireAuth } = require('../auth');
const { requirePerm } = require('../permissions');

const router = express.Router();
const str = (v, n) => String(v == null ? '' : v).slice(0, n);
let seq = 0;
const newId = () => 'fl' + Date.now().toString(36) + (seq++).toString(36);

const POSITIONS = ['bottom-right', 'bottom-left', 'top-right', 'top-left', 'center-right', 'center-left'];
const ANIMS = ['slide', 'bounce', 'fade', 'none'];

function clean(f) {
  if (!f || typeof f !== 'object') return null;
  const image = str(f.image, 5000).trim();
  if (!image) return null; // an image IS the widget
  return {
    id: str(f.id, 40) || newId(),
    name: str(f.name, 120).trim() || 'Floating image',
    image,
    mobileImage: str(f.mobileImage, 5000).trim(),
    position: POSITIONS.includes(f.position) ? f.position : 'bottom-right',
    size: Math.max(50, Math.min(100, Number(f.size) || 72)), // 50–100 px
    link: str(f.link, 2000).trim(),
    animation: ANIMS.includes(f.animation) ? f.animation : 'slide',
    closable: f.closable !== false,
    enabled: f.enabled !== false,
  };
}

const list = () => {
  const s = store.getSettings();
  return Array.isArray(s.floatingImages) ? s.floatingImages : [];
};

router.get('/', (req, res) => res.json(list().filter((f) => f.enabled !== false)));
router.get('/all', requireAuth, (req, res) => res.json(list()));

router.put('/', requireAuth, requirePerm('content.manage'), (req, res) => {
  const items = (Array.isArray(req.body?.items) ? req.body.items : []).map(clean).filter(Boolean).slice(0, 10);
  store.saveSettings({ floatingImages: items });
  res.json(items);
});

module.exports = router;
