/*
 * routes/agents.js — agent system (shared by frontend agent panel + admin).
 *
 * Player:  POST /api/agents/apply        (logged-in player applies)
 *          GET  /api/agents/me           (agent dashboard)
 *          GET  /api/agents/me/downline  (referred players)
 *          GET  /api/agents/me/commission
 * Admin:   GET  /api/agents              (?status=)
 *          PATCH /api/agents/:id/approve
 *          PATCH /api/agents/:id/reject
 */
const express = require('express');
const store = require('../store');
const { requireAuth, requirePlayer } = require('../auth');
const { requirePerm } = require('../permissions');

const router = express.Router();
const AGENTS = 'agents';
const PLAYERS = 'players';

function agentForPlayer(playerId) {
  return store.list(AGENTS).find((a) => String(a.playerId) === String(playerId));
}

// ---------- player applies to become an agent ----------
router.post('/apply', requirePlayer, (req, res) => {
  if (agentForPlayer(req.auth.sub)) return res.status(409).json({ error: 'Application already exists' });
  const b = req.body || {};
  const agent = store.insert(AGENTS, {
    playerId: req.auth.sub,
    username: req.auth.username,
    fullName: b.fullName || '',
    phone: b.phone || '',
    email: b.email || '',
    emergencyContact: b.emergencyContact || '',
    channels: b.channels || [],
    status: 'pending',
    code: '',
    commissionRate: Number(b.commissionRate || 0.2),
    earned: 0,
    pending: 0,
  });
  res.status(201).json(agent);
});

// ---------- agent dashboard ----------
router.get('/me', requirePlayer, (req, res) => {
  const agent = agentForPlayer(req.auth.sub);
  if (!agent) return res.status(404).json({ error: 'Not an agent' });
  res.json(agent);
});

router.get('/me/downline', requirePlayer, (req, res) => {
  const agent = agentForPlayer(req.auth.sub);
  if (!agent || !agent.code) return res.json([]);
  const players = store.list(PLAYERS)
    .filter((p) => (p.referralCode || '') === agent.code)
    .map(({ passwordHash, ...rest }) => rest);
  res.json(players);
});

router.get('/me/commission', requirePlayer, (req, res) => {
  const agent = agentForPlayer(req.auth.sub);
  if (!agent) return res.json([]);
  res.json(store.list('commissions').filter((c) => String(c.agentId) === String(agent.id)));
});

// ---------- admin ----------
router.get('/', requireAuth, (req, res) => {
  let rows = store.list(AGENTS);
  if (req.query.status) rows = rows.filter((a) => a.status === req.query.status);
  rows.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json(rows);
});

router.patch('/:id/approve', requireAuth, requirePerm('agents.manage'), (req, res) => {
  const a = store.get(AGENTS, req.params.id);
  if (!a) return res.status(404).json({ error: 'Agent not found' });
  const code = a.code || `AG${String(a.id).slice(-4).toUpperCase()}`;
  // Promote the linked player's role to agent.
  if (a.playerId && store.get(PLAYERS, a.playerId)) store.update(PLAYERS, a.playerId, { role: 'agent' });
  res.json(store.update(AGENTS, req.params.id, { status: 'approved', code }));
});

router.patch('/:id/reject', requireAuth, requirePerm('agents.manage'), (req, res) => {
  const a = store.get(AGENTS, req.params.id);
  if (!a) return res.status(404).json({ error: 'Agent not found' });
  res.json(store.update(AGENTS, req.params.id, { status: 'rejected', reason: req.body?.reason || '' }));
});

module.exports = router;
