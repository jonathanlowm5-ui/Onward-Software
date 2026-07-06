/*
 * routes/missions.js — admin-managed player missions/challenges shown on the
 * player site's Missions page.
 *
 * GET /api/missions            (public) -> [ ...missions ]
 *     ?active=1                only enabled ones
 * PUT /api/missions            (admin, settings.manage) -> save full list
 *
 * Stored in app_settings (settings.missions). Each entry:
 *   { id, enabled, icon, title, desc, type, target, reward, duration }
 */
const express = require('express');
const store = require('../store');
const { requireAuth, requirePlayer } = require('../auth');
const { requirePerm } = require('../permissions');

const router = express.Router();

const TYPES = ['deposit', 'wager', 'login', 'referral', 'game', 'other'];
const str = (v, n) => String(v == null ? '' : v).slice(0, n);
let seq = 0;
const newId = () => 'm' + Date.now().toString(36) + (seq++).toString(36);

// A tier is one rung of a mission ladder (e.g. login day 3 → "2 FS", or
// wager ₱2,000 → "Free 20"). Missions without tiers keep the single
// target/reward behaviour.
function cleanTier(t) {
  if (!t || typeof t !== 'object') return null;
  const target = str(t.target, 60).trim();
  const reward = str(t.reward, 80).trim();
  if (!target || !reward) return null;
  return { target, reward };
}

function clean(m) {
  if (!m || typeof m !== 'object') return null;
  const title = str(m.title, 160).trim();
  if (!title) return null;
  return {
    id: str(m.id, 40) || newId(),
    enabled: m.enabled == null ? true : !!m.enabled,
    icon: str(m.icon, 8).trim() || '🎯',
    title,
    desc: str(m.desc, 400).trim(),
    type: TYPES.includes(m.type) ? m.type : 'other',
    target: str(m.target, 60).trim(),     // e.g. "7", "₱10,000"
    reward: str(m.reward, 80).trim(),     // e.g. "₱200", "50 FS"
    duration: str(m.duration, 60).trim(), // e.g. "7 days", "Ongoing"
    tiers: Array.isArray(m.tiers) ? m.tiers.map(cleanTier).filter(Boolean).slice(0, 60) : [],
  };
}

const list = () => {
  const s = store.getSettings();
  return Array.isArray(s.missions) ? s.missions : [];
};

router.get('/', (req, res) => {
  let items = list();
  if (String(req.query.active || '') === '1') items = items.filter((m) => m.enabled !== false);
  res.json(items);
});

router.put('/', requireAuth, requirePerm('settings.manage'), (req, res) => {
  const items = (Array.isArray(req.body && req.body.items) ? req.body.items : [])
    .map(clean).filter(Boolean).slice(0, 100);
  store.saveSettings({ missions: items, missionsUpdatedAt: new Date().toISOString() });
  res.json(items);
});

/* ---------- per-player progress & claiming ---------- */

const num = (s) => {
  const n = Number(String(s == null ? '' : s).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
};
// Does the target/reward text carry a money marker (₱1,000 vs a plain count)?
const isMoney = (s) => /[₱$€£¥]|RM|USD|MYR|PHP|IDR|THB|VND|INR|KRW|JPY|BRL/i.test(String(s || ''));

// Compute a player's progress for one mission from what the platform already
// records. Types without a data source yet (wager/game/other) stay at 0.
function progressFor(mission, player) {
  const t = mission.type;
  if (t === 'login') return Number(player.loginStreak || 0);
  if (t === 'deposit') {
    const deps = store.list('transactions')
      .filter((x) => String(x.playerId) === String(player.id) && x.type === 'deposit' && x.status === 'approved');
    // "₱1,000" target = total deposited amount; plain "3" = number of deposits.
    // For ladders the first tier's target decides which meaning applies.
    const sample = (Array.isArray(mission.tiers) && mission.tiers[0]?.target) || mission.target;
    return isMoney(sample)
      ? deps.reduce((s, x) => s + Number(x.amount || 0), 0)
      : deps.length;
  }
  if (t === 'referral') {
    const myCode = player.playerCode || '';
    if (!myCode) return 0;
    return store.list('players').filter((x) => (x.referralCode || '') === myCode).length;
  }
  return 0; // wager / game / other — needs the bets ledger
}

function playerMissionView(m, player) {
  const raw = progressFor(m, player);
  const claimedMap = player.missionsClaimed || {};

  // Tiered mission: every rung reports its own progress/claim state.
  if (Array.isArray(m.tiers) && m.tiers.length) {
    const tiers = m.tiers.map((t, i) => {
      const tTarget = num(t.target) || 1;
      const claimed = !!claimedMap[`${m.id}:${i}`];
      return {
        ...t,
        index: i,
        targetNum: tTarget,
        claimed,
        claimable: !claimed && raw >= tTarget,
      };
    });
    const maxTarget = Math.max(...tiers.map((t) => t.targetNum));
    const progress = Math.min(raw, maxTarget);
    return {
      ...m,
      tiers,
      target: maxTarget,
      progress,
      pct: Math.round((progress / maxTarget) * 100),
      trackable: ['login', 'deposit', 'referral'].includes(m.type),
      claimed: tiers.every((t) => t.claimed),
      claimable: tiers.some((t) => t.claimable),
    };
  }

  const target = num(m.target) || 1;
  const progress = Math.min(raw, target);
  const claimed = !!claimedMap[m.id];
  return {
    ...m,
    target,
    progress,
    pct: Math.round((progress / target) * 100),
    trackable: ['login', 'deposit', 'referral'].includes(m.type),
    claimed,
    claimable: !claimed && progress >= target,
  };
}

// GET /api/missions/me — the enabled missions with this player's progress.
router.get('/me', requirePlayer, (req, res) => {
  const player = store.get('players', req.auth.sub);
  if (!player) return res.status(404).json({ error: 'Player not found' });
  res.json(list().filter((m) => m.enabled !== false).map((m) => playerMissionView(m, player)));
});

// POST /api/missions/claim { id, tier? } — verify completion, credit the
// reward. `tier` (index) is required for ladder missions.
router.post('/claim', requirePlayer, (req, res) => {
  const player = store.get('players', req.auth.sub);
  if (!player) return res.status(404).json({ error: 'Player not found' });
  const mission = list().find((m) => m.id === String(req.body?.id || '') && m.enabled !== false);
  if (!mission) return res.status(404).json({ error: 'Mission not found' });

  const v = playerMissionView(mission, player);
  const hasTiers = Array.isArray(v.tiers) && v.tiers.length > 0;

  let claimKey;
  let reward;
  if (hasTiers) {
    const idx = Number(req.body?.tier);
    const tier = Number.isInteger(idx) ? v.tiers[idx] : null;
    if (!tier) return res.status(400).json({ error: 'Unknown mission tier' });
    if (tier.claimed) return res.status(400).json({ error: 'Reward already claimed' });
    if (!tier.claimable) return res.status(400).json({ error: 'Mission not completed yet' });
    claimKey = `${mission.id}:${tier.index}`;
    reward = tier.reward;
  } else {
    if (v.claimed) return res.status(400).json({ error: 'Reward already claimed' });
    if (!v.claimable) return res.status(400).json({ error: 'Mission not completed yet' });
    claimKey = mission.id;
    reward = mission.reward;
  }

  // Money rewards are credited to the balance immediately; other rewards
  // (e.g. free spins) are recorded as a bonus transaction for the operator.
  const amount = isMoney(reward) ? num(reward) : 0;
  const patch = {
    missionsClaimed: { ...(player.missionsClaimed || {}), [claimKey]: new Date().toISOString() },
  };
  if (amount > 0) patch.balance = Number(player.balance || 0) + amount;
  const updated = store.update('players', player.id, patch);

  store.insert('transactions', {
    playerId: player.id,
    type: 'bonus',
    amount,
    method: 'mission',
    status: 'approved',
    note: `Mission reward: ${mission.title}${hasTiers ? ` — tier ${Number(req.body.tier) + 1}` : ''}${reward ? ` (${reward})` : ''}`,
  });

  res.json({
    ok: true,
    credited: amount,
    reward,
    balance: Number(updated?.balance ?? player.balance ?? 0),
    mission: playerMissionView(mission, updated || player),
  });
});

module.exports = router;
