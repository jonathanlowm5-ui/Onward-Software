/*
 * routes/depositconfig.js — deposit panel configuration shared by the player
 * deposit modal and the admin. Currently the quick-select amount chips.
 *
 * GET  /api/deposit-config   (public)  -> { quickAmounts: [..] }
 * PUT  /api/deposit-config   (admin)   -> save quickAmounts
 *
 * Stored in app_settings (settings.depositQuickAmounts).
 */
const express = require('express');
const store = require('../store');
const { requireAuth } = require('../auth');

const router = express.Router();
const DEFAULTS = [500, 1000, 2000, 5000, 10000, 20000];

function current() {
  const a = store.getSettings().depositQuickAmounts;
  if (Array.isArray(a) && a.length) {
    const clean = a.map(Number).filter((n) => Number.isFinite(n) && n > 0);
    if (clean.length) return { quickAmounts: clean };
  }
  return { quickAmounts: DEFAULTS.slice() };
}

router.get('/', (req, res) => res.json(current()));

router.put('/', requireAuth, (req, res) => {
  let arr = req.body && req.body.quickAmounts;
  if (!Array.isArray(arr)) arr = [];
  arr = arr.map(Number).filter((n) => Number.isFinite(n) && n > 0).slice(0, 12);
  store.saveSettings({ depositQuickAmounts: arr, depositConfigUpdatedAt: new Date().toISOString() });
  res.json({ quickAmounts: arr.length ? arr : DEFAULTS.slice() });
});

module.exports = router;
