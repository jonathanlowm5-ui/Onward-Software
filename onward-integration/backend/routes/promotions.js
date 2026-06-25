/*
 * routes/promotions.js
 *
 * Public:  GET /api/promotions       (frontend; ?active=1 hides inactive AND expired)
 * Admin:   POST / PUT / DELETE / PATCH :id/toggle
 *
 * A promotion record:
 *   { id, image, title, description, startDate, endDate, status,
 *     buttonText, buttonLink, createdAt, updatedAt }
 *
 * status is one of: active | inactive
 * Expiry is derived from endDate (a promo past its endDate never shows on the
 * frontend, even if status is still 'active').
 */
const express = require('express');
const store = require('../store');
const { requireAuth } = require('../auth');
const { requirePerm } = require('../permissions');

const router = express.Router();
const COLLECTION = 'promotions';
const CURRENCIES = ['PHP', 'USD', 'EUR', 'INR', 'THB', 'VND', 'IDR', 'MYR', 'CNY', 'JPY'];

// ---- Promotion-rules enums (admin-configurable eligibility logic) ----
const REQUIREMENTS = ['Deposit (T/O)', 'Deposit (Winover)', 'Product (T/O)', 'Product (Winover)', 'Multi-Product (T/O)', 'Multi-Product (Winover)'];
const BONUS_TYPES = ['Bonus', 'Free Credit', 'Referral Share', 'Register Bonus'];
const REFRESH_CYCLES = ['Everytime', 'Once', 'Hourly', 'Daily', 'Weekly', 'Monthly'];
const num = (x, d = 0) => { const n = parseFloat(x); return Number.isFinite(n) ? n : d; };
const truthy = (v) => v === true || v === 1 || v === 'yes' || v === 'true' || v === '1' || v === 'on';
const pickOne = (v, list, d) => (list.includes(v) ? v : d);

// Per-currency banner images: { PHP: url, MYR: url, ... }. A player sees the
// banner for their own currency; otherwise the default `image` is used.
function cleanBanners(src) {
  const out = {};
  const obj = src && typeof src === 'object' ? src : {};
  for (const k of CURRENCIES) {
    const v = obj[k];
    if (typeof v === 'string' && v.trim()) out[k] = v.trim();
  }
  return out;
}

function clean(body) {
  const cur = String(body.currency || '').toUpperCase();
  return {
    image: body.image || '',
    banners: cleanBanners(body.banners),
    title: String(body.title || '').trim(),
    description: String(body.description || '').trim(),
    // Economic / display fields (shown on the admin table and player cards).
    type: String(body.type || 'welcome').trim(),
    // Optional currency restriction. Empty = auto (follows the viewing
    // player's currency in the terms & conditions).
    currency: CURRENCIES.includes(cur) ? cur : '',
    // Optional country targeting. Empty = all countries. When set, the promo
    // only shows to players registered in that country.
    country: String(body.country || '').trim(),
    bonus: String(body.bonus || '').trim(),
    maxBonus: String(body.maxBonus ?? body.max ?? '').trim(),
    minDeposit: String(body.minDeposit ?? body.md ?? '').trim(),
    wager: String(body.wager || '').trim(),
    turnover: String(body.turnover || '').trim(),
    startDate: body.startDate || '',
    endDate: body.endDate || '',
    status: body.status === 'inactive' ? 'inactive' : 'active',
    buttonText: body.buttonText || '',
    buttonLink: body.buttonLink || '',
    // ---- Promotion rules / eligibility logic (admin-configured) ----
    requirement: pickOne(body.requirement, REQUIREMENTS, 'Deposit (T/O)'),
    bonusType: pickOne(body.bonusType, BONUS_TYPES, 'Bonus'),
    refreshCycle: pickOne(body.refreshCycle, REFRESH_CYCLES, 'Once'),
    isExclusive: truthy(body.isExclusive),
    hidden: truthy(body.hidden),
    claimLimitDaily: Math.max(0, num(body.claimLimitDaily, 0)),
    minDepositAmt: Math.max(0, num(body.minDepositAmt, 0)),
    depositCount: Math.max(0, num(body.depositCount, 0)),
    maxClaimAmount: Math.max(0, num(body.maxClaimAmount, 0)),
    maxWinningMultiply: num(body.maxWinningMultiply, 0), // may be negative (fixed) or 0 (no forfeit)
    isAccumulate: truthy(body.isAccumulate),
    promoDeductOnWithdraw: truthy(body.promoDeductOnWithdraw),
    percentage: Math.max(0, num(body.percentage, 0)),
    multiply: Math.max(0, num(body.multiply, 1)),
    sequence: Math.max(0, num(body.sequence, 0)),
    minBalance: Math.max(0, num(body.minBalance, 0)),
  };
}

function isLive(p, today) {
  if (p.status !== 'active') return false;
  if (p.hidden) return false; // admin chose to hide it from players
  if (p.startDate && p.startDate > today) return false; // not started yet
  if (p.endDate && p.endDate < today) return false; // expired
  return true;
}

// Sort by the admin-set display order (then newest first as a tiebreaker).
function bySort(a, b) {
  const sa = Number.isFinite(+a.sortOrder) ? +a.sortOrder : 9999;
  const sb = Number.isFinite(+b.sortOrder) ? +b.sortOrder : 9999;
  if (sa !== sb) return sa - sb;
  return (b.createdAt || '').localeCompare(a.createdAt || '');
}

router.get('/', (req, res) => {
  let promos = store.list(COLLECTION);
  if (req.query.active === '1') {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    promos = promos.filter((p) => isLive(p, today));
  }
  promos = promos.slice().sort(bySort);
  res.json(promos);
});

router.post('/', requireAuth, requirePerm('content.manage'), (req, res) => {
  const data = clean(req.body);
  if (!data.title) return res.status(400).json({ error: 'Promotion title is required' });
  // New promos append to the end of the order.
  data.sortOrder = store.list(COLLECTION).length;
  res.status(201).json(store.insert(COLLECTION, data));
});

// Reorder: body { order: [id, id, ...] } -> sets sortOrder = index for each.
router.post('/reorder', requireAuth, requirePerm('content.manage'), (req, res) => {
  const order = Array.isArray(req.body && req.body.order) ? req.body.order : [];
  order.forEach((id, i) => { if (store.get(COLLECTION, id)) store.update(COLLECTION, id, { sortOrder: i }); });
  res.json(store.list(COLLECTION).slice().sort(bySort));
});

router.put('/:id', requireAuth, requirePerm('content.manage'), (req, res) => {
  // clean() omits sortOrder, so store.update preserves the existing order.
  const updated = store.update(COLLECTION, req.params.id, clean(req.body));
  if (!updated) return res.status(404).json({ error: 'Promotion not found' });
  res.json(updated);
});

router.patch('/:id/toggle', requireAuth, requirePerm('content.manage'), (req, res) => {
  const promo = store.get(COLLECTION, req.params.id);
  if (!promo) return res.status(404).json({ error: 'Promotion not found' });
  const status = promo.status === 'active' ? 'inactive' : 'active';
  res.json(store.update(COLLECTION, req.params.id, { status }));
});

router.delete('/:id', requireAuth, requirePerm('content.manage'), (req, res) => {
  if (!store.remove(COLLECTION, req.params.id))
    return res.status(404).json({ error: 'Promotion not found' });
  res.json({ ok: true });
});

module.exports = router;
