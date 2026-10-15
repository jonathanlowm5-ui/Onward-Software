/*
 * routes/pagebanners.js — uploadable hero banners for content pages (Jackpots,
 * Referral, VIP, Agent, Follow, Promotions). Rendered at one consistent size on
 * the player site; managed from the admin "Web Design" area.
 *
 * GET  /api/page-banners   (public) -> { jackpots, referral, vip, ... }
 * PUT  /api/page-banners   (admin)  -> save the provided keys
 *
 * Stored in app_settings (settings.pageBanners).
 */
const express = require('express');
const store = require('../store');
const { requireAuth } = require('../auth');
const { requirePerm } = require('../permissions');

const router = express.Router();
const KEYS = ['jackpots', 'referral', 'vip', 'agent', 'follow', 'promotions', 'missions', 'welcomeCard', 'promoCodeBar',
  'withdrawCard', 'withdrawCard1', 'withdrawCard2', 'withdrawCard3',
  'vip1', 'vip2', 'vip3', 'vip4', 'vip5', 'vip6', 'vip7', 'vip8', 'vip9', 'vip10'];

function current() {
  const m = store.getSettings().pageBanners || {};
  const out = {};
  KEYS.forEach((k) => { out[k] = typeof m[k] === 'string' ? m[k] : ''; });
  return out;
}

router.get('/', (req, res) => res.json(current()));

router.put('/', requireAuth, requirePerm('settings.manage'), (req, res) => {
  const b = req.body || {};
  const next = { ...(store.getSettings().pageBanners || {}) };
  KEYS.forEach((k) => { if (k in b) next[k] = String(b[k] || '').slice(0, 2048); });
  store.saveSettings({ pageBanners: next, pageBannersUpdatedAt: new Date().toISOString() });
  res.json(current());
});

// ---- Editable hero TEXT (eyebrow / title / desc) per content page ----
// Stored in settings.pageHeroes = { [key]: { eyebrow, title, desc } }.
const TEXT_KEYS = ['jackpots', 'referral', 'vip', 'missions', 'agent', 'follow', 'promotions'];
function currentText() {
  const m = store.getSettings().pageHeroes || {};
  const out = {};
  TEXT_KEYS.forEach((k) => {
    const t = m[k] && typeof m[k] === 'object' ? m[k] : {};
    out[k] = {
      eyebrow: typeof t.eyebrow === 'string' ? t.eyebrow : '',
      title: typeof t.title === 'string' ? t.title : '',
      desc: typeof t.desc === 'string' ? t.desc : '',
    };
  });
  return out;
}
router.get('/text', (req, res) => res.json(currentText()));
router.put('/text', requireAuth, requirePerm('settings.manage'), (req, res) => {
  const b = req.body || {};
  const next = { ...(store.getSettings().pageHeroes || {}) };
  TEXT_KEYS.forEach((k) => {
    if (!b[k] || typeof b[k] !== 'object') return;
    next[k] = {
      eyebrow: String(b[k].eyebrow || '').slice(0, 60),
      title: String(b[k].title || '').slice(0, 120),
      desc: String(b[k].desc || '').slice(0, 600),
    };
  });
  store.saveSettings({ pageHeroes: next, pageHeroesUpdatedAt: new Date().toISOString() });
  res.json(currentText());
});

module.exports = router;
