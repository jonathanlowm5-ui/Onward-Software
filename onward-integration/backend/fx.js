/*
 * fx.js — currency helpers for crediting rewards correctly.
 *
 * Reward texts are authored with a currency marker ("₱500", "RM50"); players
 * hold balances in their own account currency. These helpers detect the
 * authored currency and convert through the admin FX rates
 * (settings.currencyRates, rate[X] = units of X per 1 base unit).
 */
const store = require('./store');

const DEFAULT_RATES = { PHP: 1, USD: 0.018, EUR: 0.016, INR: 1.5, THB: 0.63, VND: 440, IDR: 285, MYR: 0.083, CNY: 0.13, JPY: 2.7 };

// NB: boundary only BEFORE the code — "RM10" has no boundary between M and 1.
const SYMBOL_CURRENCY = [
  [/₱|PHP/i, 'PHP'],
  [/\bRM|MYR/i, 'MYR'],
  [/₹|INR/i, 'INR'],
  [/฿|THB/i, 'THB'],
  [/₫|VND/i, 'VND'],
  [/\bRp|IDR/i, 'IDR'],
  [/€|EUR/i, 'EUR'],
  [/¥|JPY|CNY/i, 'JPY'],
  [/\$|USD/i, 'USD'],
];

// Which currency a reward/target text is written in (default PHP).
function currencyOf(text, fallback = 'PHP') {
  const s = String(text || '');
  for (const [re, cur] of SYMBOL_CURRENCY) if (re.test(s)) return cur;
  return fallback;
}

function rates() {
  const saved = store.getSettings().currencyRates || {};
  const out = { ...DEFAULT_RATES };
  Object.keys(out).forEach((c) => { if (Number(saved[c]) > 0) out[c] = Number(saved[c]); });
  return out;
}

// Convert an amount between currencies via the configured rates.
function convertAmount(amount, from, to) {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  if (!from || !to || from === to) return amount;
  const r = rates();
  const rFrom = Number(r[from]) > 0 ? Number(r[from]) : 1;
  const rTo = Number(r[to]) > 0 ? Number(r[to]) : 1;
  return Math.round((amount / rFrom) * rTo * 100) / 100;
}

// Parse a money reward text and return the amount in the player's currency.
// Returns 0 for non-money rewards (free spins etc.).
function creditFor(rewardText, playerCurrency) {
  const n = Number(String(rewardText == null ? '' : rewardText).replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return convertAmount(n, currencyOf(rewardText), playerCurrency || 'PHP');
}

module.exports = { currencyOf, convertAmount, creditFor };
