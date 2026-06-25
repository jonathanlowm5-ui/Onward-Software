/*
 * routes/currencyrates.js — currency conversion rates for the multi-currency
 * platform. The wallet stays in each player's account currency; these rates
 * power the "view in another currency" converter indicator on the player site.
 *
 * GET  /api/currency-rates   (public) -> { base, rates }
 * PUT  /api/currency-rates   (admin)  -> save { base, rates }
 *
 * rate[X] = how many units of X equal 1 unit of the base currency.
 * Stored in app_settings (settings.currencyRates / currencyBase).
 */
const express = require('express');
const store = require('../store');
const { requireAuth } = require('../auth');
const { requirePerm } = require('../permissions');

const router = express.Router();
const CODES = ['PHP', 'USD', 'EUR', 'INR', 'THB', 'VND', 'IDR', 'MYR', 'CNY', 'JPY'];
// Approximate defaults relative to PHP (base). Admin can override.
const DEFAULTS = { PHP: 1, USD: 0.018, EUR: 0.016, INR: 1.5, THB: 0.63, VND: 440, IDR: 285, MYR: 0.083, CNY: 0.13, JPY: 2.7 };

function current() {
  const s = store.getSettings();
  const base = CODES.includes(s.currencyBase) ? s.currencyBase : 'PHP';
  const saved = s.currencyRates || {};
  const rates = {};
  CODES.forEach((c) => { rates[c] = Number(saved[c]) > 0 ? Number(saved[c]) : (DEFAULTS[c] || 1); });
  return { base, rates };
}

router.get('/', (req, res) => res.json(current()));

router.put('/', requireAuth, requirePerm('settings.manage'), (req, res) => {
  const b = req.body || {};
  const next = { ...(store.getSettings().currencyRates || {}) };
  const incoming = b.rates && typeof b.rates === 'object' ? b.rates : {};
  CODES.forEach((c) => { const v = Number(incoming[c]); if (v > 0) next[c] = v; });
  store.saveSettings({
    currencyRates: next,
    currencyBase: CODES.includes(b.base) ? b.base : 'PHP',
    currencyRatesUpdatedAt: new Date().toISOString(),
  });
  res.json(current());
});

module.exports = router;
