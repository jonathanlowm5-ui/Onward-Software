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
const KEYS = ['jackpots', 'referral', 'vip', 'agent', 'follow', 'promotions', 'missions'];

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

module.exports = router;
