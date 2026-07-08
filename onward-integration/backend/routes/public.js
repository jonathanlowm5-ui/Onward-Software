/*
 * routes/public.js — small PUBLIC stats feed for the player site:
 * live online count, jackpot pool, and recent big wins (real bets).
 * No auth — everything here is safe to expose (usernames are masked).
 */
const express = require('express');
const store = require('../store');

const router = express.Router();
const ONLINE_WINDOW_MS = 5 * 60 * 1000;

const mask = (u) => {
  const s = String(u || 'player');
  return s.length <= 3 ? s[0] + '***' : s.slice(0, 3) + '***' + (s.length > 6 ? s.slice(-1) : '');
};

router.get('/stats', (req, res) => {
  const s = store.getSettings();
  const cutoff = Date.now() - ONLINE_WINDOW_MS;
  const online = store.list('players')
    .filter((p) => p.lastSeenAt && new Date(p.lastSeenAt).getTime() >= cutoff).length;

  // Jackpot pool: admin-set base (settings.jackpotPool) + a small live
  // contribution from real wagering (0.5% of all-time wagered).
  const bets = store.list('bets');
  const wagered = bets.reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const pool = Number(s.jackpotPool || 0) + Math.round(wagered * 0.005);

  // Recent big wins (top real wins in the last 7 days, masked).
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
  const bigWins = bets
    .filter((b) => Number(b.win || 0) > 0 && (b.createdAt || '') >= weekAgo)
    .sort((a, b) => Number(b.win) - Number(a.win))
    .slice(0, 12)
    .map((b) => ({
      player: mask(b.username), game: b.game || b.gameName || 'Game',
      provider: b.provider || '', win: Number(b.win || 0),
      currency: b.currency || 'PHP', at: b.createdAt || '',
    }));

  res.json({
    online: online + Number(s.onlineBaseline || 0), // baseline lets ops pad during launch; 0 = raw
    onlineReal: online,
    jackpotPool: pool,
    bigWins,
    winnersToday: bets.filter((b) => Number(b.win || 0) > 0 && (b.createdAt || '').slice(0, 10) === new Date().toISOString().slice(0, 10)).length,
  });
});

module.exports = router;
