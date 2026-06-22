/*
 * routes/transactions.js
 *
 * Shared deposits / withdrawals ledger used by BOTH the admin panel and the
 * customer frontend, so balances stay in sync.
 *
 * Admin:  GET    /api/transactions            (?type=deposit|withdrawal &status= &player=)
 *         POST   /api/transactions            (record a transaction)
 *         PATCH  /api/transactions/:id/approve (credits/debits the player wallet)
 *         PATCH  /api/transactions/:id/reject
 *
 * A transaction: { id, playerId, type, amount, method, status, note, createdAt }
 *   type:   deposit | withdrawal | bonus | adjustment
 *   status: pending | approved | rejected
 */
const express = require('express');
const store = require('../store');
const { requireAuth } = require('../auth');
const { requirePerm } = require('../permissions');

const router = express.Router();
const COLLECTION = 'transactions';
const PLAYERS = 'players';

function adjustBalance(playerId, delta) {
  const p = store.get(PLAYERS, playerId);
  if (!p) return null;
  const balance = Number(p.balance || 0) + delta;
  return store.update(PLAYERS, playerId, { balance });
}

// ---- list (admin) ----
router.get('/', requireAuth, (req, res) => {
  let rows = store.list(COLLECTION);
  if (req.query.type) rows = rows.filter((t) => t.type === req.query.type);
  if (req.query.status) rows = rows.filter((t) => t.status === req.query.status);
  if (req.query.player) rows = rows.filter((t) => String(t.playerId) === String(req.query.player));
  rows.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  // Always resolve the player's username + Player ID so the admin shows the
  // username as the indicator (even for admin/legacy records).
  const seen = {};
  const lookup = (id) => {
    if (!id) return null;
    if (!(id in seen)) seen[id] = store.get(PLAYERS, id);
    return seen[id];
  };
  res.json(rows.map((t) => {
    const p = lookup(t.playerId);
    return { ...t, username: t.username || (p && p.username) || '', playerCode: (p && p.playerCode) || '' };
  }));
});

// ---- create ----
router.post('/', requireAuth, (req, res) => {
  const b = req.body || {};
  const tx = store.insert(COLLECTION, {
    playerId: b.playerId || null,
    type: ['deposit', 'withdrawal', 'bonus', 'adjustment'].includes(b.type) ? b.type : 'deposit',
    amount: Number(b.amount || 0),
    method: b.method || '',
    status: b.status || 'pending',
    note: b.note || '',
  });
  res.status(201).json(tx);
});

// ---- approve: deposits/bonuses credit, withdrawals debit ----
router.patch('/:id/approve', requireAuth, requirePerm('transactions.approve'), (req, res) => {
  const tx = store.get(COLLECTION, req.params.id);
  if (!tx) return res.status(404).json({ error: 'Transaction not found' });
  if (tx.status === 'approved') return res.json(tx);
  const sign = tx.type === 'withdrawal' ? -1 : 1;
  if (tx.playerId) adjustBalance(tx.playerId, sign * Number(tx.amount || 0));
  res.json(store.update(COLLECTION, req.params.id, { status: 'approved' }));
});

// ---- reject ----
router.patch('/:id/reject', requireAuth, requirePerm('transactions.approve'), (req, res) => {
  const tx = store.get(COLLECTION, req.params.id);
  if (!tx) return res.status(404).json({ error: 'Transaction not found' });
  res.json(store.update(COLLECTION, req.params.id, { status: 'rejected', reason: req.body?.reason || '' }));
});

module.exports = router;
