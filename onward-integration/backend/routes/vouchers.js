/*
 * routes/vouchers.js — admin-generated promo codes / vouchers that players
 * redeem via the "Use Code" modal or the promotions promo-code bar.
 *
 * GET  /api/vouchers            (admin) -> [ ...vouchers ] (with use counts)
 * PUT  /api/vouchers            (admin, settings.manage) -> save full list
 * POST /api/vouchers/redeem     (player) { code } -> validate + credit
 *
 * Stored in app_settings (settings.vouchers). Each entry:
 *   { id, code, type, value, maxUses, used, expiry, minDeposit, enabled }
 *   type: cash | pct | fs | nodeposit
 * Cash-style values (₱500) are credited to the balance instantly; percentage /
 * free-spin rewards are recorded as a bonus transaction for the operator to
 * fulfil. Every redemption writes an approved "bonus" transaction with
 * method "voucher" so it is auditable, and each player can redeem a given
 * code only once (player.vouchersRedeemed map).
 */
const express = require('express');
const store = require('../store');
const { requireAuth, requirePlayer } = require('../auth');
const { requirePerm } = require('../permissions');

const router = express.Router();

const TYPES = ['cash', 'pct', 'fs', 'nodeposit'];
const str = (v, n) => String(v == null ? '' : v).slice(0, n);
let seq = 0;
const newId = () => 'v' + Date.now().toString(36) + (seq++).toString(36);

const normCode = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 24);
const num = (s) => {
  const n = Number(String(s == null ? '' : s).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
};
const isMoney = (s) => /[₱$€£¥]|RM|USD|MYR|PHP|IDR|THB|VND|INR|KRW|JPY|BRL/i.test(String(s || ''));

function clean(v) {
  if (!v || typeof v !== 'object') return null;
  const code = normCode(v.code);
  if (!code) return null;
  return {
    id: str(v.id, 40) || newId(),
    code,
    enabled: v.enabled == null ? true : !!v.enabled,
    type: TYPES.includes(v.type) ? v.type : 'cash',
    value: str(v.value, 60).trim(),          // e.g. "₱500", "100%", "50 FS"
    maxUses: Math.max(1, Math.min(1000000, Number(v.maxUses) || 100)),
    used: Math.max(0, Number(v.used) || 0),  // preserved across admin saves
    expiry: str(v.expiry, 40).trim(),        // date / datetime-local
    minDeposit: str(v.minDeposit, 60).trim(),
    createdAt: v.createdAt || new Date().toISOString(),
  };
}

const list = () => {
  const s = store.getSettings();
  return Array.isArray(s.vouchers) ? s.vouchers : [];
};
const saveList = (items) =>
  store.saveSettings({ vouchers: items, vouchersUpdatedAt: new Date().toISOString() });

router.get('/', requireAuth, (req, res) => res.json(list()));

router.put('/', requireAuth, requirePerm('settings.manage'), (req, res) => {
  const prev = list();
  const items = (Array.isArray(req.body && req.body.items) ? req.body.items : [])
    .map(clean).filter(Boolean).slice(0, 500);
  // Never lose live redemption counts on an admin edit.
  const usedBy = Object.fromEntries(prev.map((v) => [v.id, v.used || 0]));
  items.forEach((v) => { if (usedBy[v.id] != null) v.used = Math.max(v.used, usedBy[v.id]); });
  // Codes must be unique.
  const seen = new Set();
  for (const v of items) {
    if (seen.has(v.code)) return res.status(400).json({ error: `Duplicate code: ${v.code}` });
    seen.add(v.code);
  }
  saveList(items);
  res.json(items);
});

// POST /api/vouchers/redeem { code } — player redeems a promocode.
router.post('/redeem', requirePlayer, (req, res) => {
  const player = store.get('players', req.auth.sub);
  if (!player) return res.status(404).json({ error: 'Player not found' });

  const code = normCode(req.body?.code);
  if (!code) return res.status(400).json({ error: 'Please enter a promocode' });

  const vouchers = list();
  const v = vouchers.find((x) => x.code === code);
  if (!v || v.enabled === false) return res.status(404).json({ error: 'Invalid promocode' });
  if (v.expiry) {
    const e = Date.parse(v.expiry);
    // A date-only expiry means "valid through that day".
    if (!Number.isNaN(e) && Date.now() > e + (v.expiry.length <= 10 ? 86399000 : 0)) {
      return res.status(400).json({ error: 'This promocode has expired' });
    }
  }
  if ((v.used || 0) >= v.maxUses) return res.status(400).json({ error: 'This promocode has been fully redeemed' });
  if (player.vouchersRedeemed && player.vouchersRedeemed[v.code]) {
    return res.status(400).json({ error: 'You have already used this promocode' });
  }

  // Cash-style rewards credit the balance instantly; % / FS rewards are
  // recorded for the operator to fulfil (deposit-matched bonuses etc.).
  const amount = isMoney(v.value) ? num(v.value) : 0;
  const patch = {
    vouchersRedeemed: { ...(player.vouchersRedeemed || {}), [v.code]: new Date().toISOString() },
  };
  if (amount > 0) patch.balance = Number(player.balance || 0) + amount;
  const updated = store.update('players', player.id, patch);

  saveList(vouchers.map((x) => (x.id === v.id ? { ...x, used: (x.used || 0) + 1 } : x)));

  store.insert('transactions', {
    playerId: player.id,
    type: 'bonus',
    amount,
    method: 'voucher',
    status: 'approved',
    note: `Voucher redeemed: ${v.code}${v.value ? ` (${v.value})` : ''}`,
  });

  res.json({
    ok: true,
    code: v.code,
    value: v.value,
    credited: amount,
    balance: Number(updated?.balance ?? player.balance ?? 0),
  });
});

module.exports = router;
