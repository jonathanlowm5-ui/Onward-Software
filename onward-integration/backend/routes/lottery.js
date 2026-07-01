/*
 * routes/lottery.js — 4D lottery draw results, entered by the admin.
 *
 * (4dyes.com sits behind a Cloudflare JS challenge so it can't be scraped
 * server-side; the operator enters each draw's numbers here instead.)
 *
 * GET /api/lottery/results          (public) -> { fetchedAt, pools: [...] }
 * PUT /api/lottery/results          (admin)  -> save the pools
 *
 * Stored in app_settings (settings.lotteryResults).
 */
const express = require('express');
const store = require('../store');
const { requireAuth } = require('../auth');
const { requirePerm } = require('../permissions');

const router = express.Router();

// Pools the operator can publish results for (id must match the player cards).
const POOL_KEYS = ['magnum', 'damacai', 'toto', 'singapore', 'sabah', 'sarawak', 'sandakan', 'gd'];

const digits4 = (v) => String(v || '').replace(/[^0-9]/g, '').slice(0, 4);
const list4 = (a) => (Array.isArray(a) ? a.map(digits4).filter(Boolean).slice(0, 25) : []);

function clean(pools) {
  if (!Array.isArray(pools)) return [];
  return pools
    .filter((p) => p && POOL_KEYS.includes(p.key))
    .map((p) => ({
      key: p.key,
      date: String(p.date || '').slice(0, 40),
      drawNo: String(p.drawNo || '').slice(0, 40),
      first: digits4(p.first),
      second: digits4(p.second),
      third: digits4(p.third),
      special: list4(p.special),
      consolation: list4(p.consolation),
      jp1: String(p.jp1 || '').slice(0, 40),
      jp2: String(p.jp2 || '').slice(0, 40),
    }));
}

router.get('/results', (req, res) => {
  const s = store.getSettings();
  res.json({
    fetchedAt: s.lotteryResultsUpdatedAt || null,
    pools: Array.isArray(s.lotteryResults) ? s.lotteryResults : [],
  });
});

router.put('/results', requireAuth, requirePerm('settings.manage'), (req, res) => {
  const pools = clean(req.body && req.body.pools);
  store.saveSettings({ lotteryResults: pools, lotteryResultsUpdatedAt: new Date().toISOString() });
  res.json({ fetchedAt: new Date().toISOString(), pools });
});

module.exports = router;
