/*
 * routes/reports.js — admin reporting computed from REAL data (transactions,
 * bets, players, login_history, otp_log, audit_log). Feeds Analytics, Web
 * Statistic, Retention, Day Retention, Provider Report, Win/Loss, OTP Report,
 * Referral Tree and Audit Logs in the admin.
 */
const express = require('express');
const store = require('../store');
const { requireAuth } = require('../auth');

const router = express.Router();

const dayOf = (t) => String(t || '').slice(0, 10);
const lastDays = (n) => {
  const days = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
};
const approved = (t) => t.status === 'approved';

// ---------- analytics: per-day money + activity series ----------
router.get('/analytics', requireAuth, (req, res) => {
  const n = Math.min(90, Math.max(7, Number(req.query.days) || 30));
  const days = lastDays(n);
  const txns = store.list('transactions');
  const bets = store.list('bets');
  const players = store.list('players');

  const zero = () => days.map(() => 0);
  const idx = Object.fromEntries(days.map((d, i) => [d, i]));
  const series = { deposits: zero(), withdrawals: zero(), wagered: zero(), ggr: zero(), registrations: zero() };

  for (const t of txns.filter(approved)) {
    const i = idx[dayOf(t.createdAt)];
    if (i === undefined) continue;
    if (t.type === 'deposit') series.deposits[i] += Number(t.amount || 0);
    if (t.type === 'withdrawal') series.withdrawals[i] += Number(t.amount || 0);
  }
  for (const b of bets) {
    const i = idx[dayOf(b.createdAt)];
    if (i === undefined) continue;
    series.wagered[i] += Number(b.amount || 0);
    series.ggr[i] += Number(b.amount || 0) - Number(b.win || 0);
  }
  for (const p of players) {
    const i = idx[dayOf(p.createdAt)];
    if (i !== undefined) series.registrations[i] += 1;
  }

  // provider split over the window
  const byProvider = {};
  const cutoff = days[0];
  for (const b of bets) {
    if (dayOf(b.createdAt) < cutoff) continue;
    const key = b.provider || 'Unknown';
    byProvider[key] = byProvider[key] || { provider: key, wagered: 0, won: 0, ggr: 0, bets: 0 };
    byProvider[key].wagered += Number(b.amount || 0);
    byProvider[key].won += Number(b.win || 0);
    byProvider[key].ggr += Number(b.amount || 0) - Number(b.win || 0);
    byProvider[key].bets += 1;
  }

  res.json({
    days,
    series,
    totals: {
      deposits: series.deposits.reduce((s, v) => s + v, 0),
      withdrawals: series.withdrawals.reduce((s, v) => s + v, 0),
      wagered: series.wagered.reduce((s, v) => s + v, 0),
      ggr: series.ggr.reduce((s, v) => s + v, 0),
      registrations: series.registrations.reduce((s, v) => s + v, 0),
      players: players.length,
    },
    byProvider: Object.values(byProvider).sort((a, b) => b.ggr - a.ggr),
  });
});

// ---------- win/loss grouped by provider or game ----------
router.get('/winloss', requireAuth, (req, res) => {
  const by = req.query.by === 'game' ? 'game' : 'provider';
  const n = Math.min(365, Math.max(1, Number(req.query.days) || 30));
  const cutoff = lastDays(n)[0];
  const groups = {};
  for (const b of store.list('bets')) {
    if (dayOf(b.createdAt) < cutoff) continue;
    const key = (by === 'game' ? b.game || b.gameName : b.provider) || 'Unknown';
    groups[key] = groups[key] || { key, bets: 0, players: new Set(), wagered: 0, won: 0 };
    groups[key].bets += 1;
    groups[key].players.add(String(b.playerId));
    groups[key].wagered += Number(b.amount || 0);
    groups[key].won += Number(b.win || 0);
  }
  const rows = Object.values(groups).map((g) => ({
    [by]: g.key, bets: g.bets, players: g.players.size,
    wagered: g.wagered, won: g.won, ggr: g.wagered - g.won,
    rtp: g.wagered > 0 ? Math.round((g.won / g.wagered) * 1000) / 10 : 0,
  })).sort((a, b) => b.ggr - a.ggr);
  res.json({ by, days: n, rows });
});

// ---------- web statistic: visits (logins), registrations, devices ----------
router.get('/webstat', requireAuth, (req, res) => {
  const n = Math.min(90, Math.max(7, Number(req.query.days) || 30));
  const days = lastDays(n);
  const idx = Object.fromEntries(days.map((d, i) => [d, i]));
  const logins = store.list('login_history');
  const players = store.list('players');

  const visits = days.map(() => 0);
  const uniques = days.map(() => new Set());
  const registrations = days.map(() => 0);
  const devices = {};
  const countries = {};

  for (const l of logins) {
    const i = idx[dayOf(l.createdAt)];
    if (i === undefined) continue;
    visits[i] += 1;
    uniques[i].add(String(l.playerId));
    const dev = l.device || 'Unknown';
    devices[dev] = (devices[dev] || 0) + 1;
    const c = l.country || '';
    if (c) countries[c] = (countries[c] || 0) + 1;
  }
  for (const p of players) {
    const i = idx[dayOf(p.createdAt)];
    if (i !== undefined) registrations[i] += 1;
  }

  res.json({
    days,
    visits,
    uniquePlayers: uniques.map((s) => s.size),
    registrations,
    devices: Object.entries(devices).map(([device, count]) => ({ device, count })).sort((a, b) => b.count - a.count),
    countries: Object.entries(countries).map(([country, count]) => ({ country, count })).sort((a, b) => b.count - a.count).slice(0, 10),
    totals: {
      visits: visits.reduce((s, v) => s + v, 0),
      registrations: registrations.reduce((s, v) => s + v, 0),
      players: players.length,
    },
  });
});

// ---------- retention: weekly cohorts (registered week N, active in later weeks) ----------
router.get('/retention', requireAuth, (req, res) => {
  const weeks = Math.min(12, Math.max(4, Number(req.query.weeks) || 8));
  const players = store.list('players');
  const logins = store.list('login_history');
  const activeByPlayer = {};
  for (const l of logins) {
    const pid = String(l.playerId);
    (activeByPlayer[pid] = activeByPlayer[pid] || []).push(dayOf(l.createdAt));
  }
  const weekStart = (offset) => { // start of ISO-ish week `offset` weeks ago
    const d = new Date(); d.setDate(d.getDate() - d.getDay() - offset * 7); return d.toISOString().slice(0, 10);
  };
  const cohorts = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const start = weekStart(w);
    const end = weekStart(w - 1);
    const cohort = players.filter((p) => dayOf(p.createdAt) >= start && dayOf(p.createdAt) < end);
    const row = { week: start, size: cohort.length, retained: [] };
    for (let k = 1; k <= Math.min(4, w); k++) {
      const ks = weekStart(w - k);
      const ke = weekStart(w - k - 1);
      const active = cohort.filter((p) => (activeByPlayer[String(p.id)] || []).some((d) => d >= ks && d < ke)).length;
      row.retained.push(cohort.length ? Math.round((active / cohort.length) * 100) : 0);
    }
    cohorts.push(row);
  }
  res.json({ cohorts });
});

// ---------- day retention: D1/D3/D7/D14/D30 per daily cohort ----------
router.get('/day-retention', requireAuth, (req, res) => {
  const n = Math.min(30, Math.max(7, Number(req.query.days) || 14));
  const days = lastDays(n);
  const players = store.list('players');
  const logins = store.list('login_history');
  const activeByPlayer = {};
  for (const l of logins) {
    const pid = String(l.playerId);
    (activeByPlayer[pid] = activeByPlayer[pid] || new Set()).add(dayOf(l.createdAt));
  }
  const addDays = (day, k) => { const d = new Date(day + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + k); return d.toISOString().slice(0, 10); };
  const today = new Date().toISOString().slice(0, 10);
  const STEPS = [1, 3, 7, 14, 30];
  const rows = days.map((day) => {
    const cohort = players.filter((p) => dayOf(p.createdAt) === day);
    const r = { date: day, size: cohort.length };
    for (const k of STEPS) {
      const target = addDays(day, k);
      if (target > today || !cohort.length) { r['d' + k] = null; continue; }
      const active = cohort.filter((p) => (activeByPlayer[String(p.id)] || new Set()).has(target)).length;
      r['d' + k] = Math.round((active / cohort.length) * 100);
    }
    return r;
  });
  res.json({ rows });
});

// ---------- OTP delivery log ----------
router.get('/otp', requireAuth, (req, res) => {
  let rows = store.list('otp_log');
  if (req.query.channel) rows = rows.filter((r) => r.channel === req.query.channel);
  rows.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json(rows.slice(0, 300));
});

// ---------- referral tree: agents → downline players (with per-player refs) ----------
router.get('/referral-tree', requireAuth, (req, res) => {
  const players = store.list('players');
  const agents = store.list('agents');
  const byRef = {};
  for (const p of players) {
    const code = p.referralCode || p.referral_code || '';
    if (code) (byRef[code] = byRef[code] || []).push(p);
  }
  // A referral cycle (A refers B, B's code refers A) or excessive depth must not
  // blow the stack — track visited codes and cap depth.
  const node = (p, seen, depth) => ({
    id: p.id, username: p.username, playerCode: p.playerCode,
    registered: dayOf(p.createdAt), status: p.status,
    children: childrenOf(p.playerCode, seen, depth),
  });
  const childrenOf = (code, seen, depth) => {
    if (!code || depth > 20 || seen.has(code)) return [];
    const next = new Set(seen); next.add(code);
    return (byRef[code] || []).map((child) => node(child, next, depth + 1));
  };
  const tree = agents.map((a) => ({
    id: a.id, agent: a.username, code: a.code, status: a.status || 'active',
    children: childrenOf(a.code, new Set(), 0),
  }));
  // players referred by another player's code but not under any agent
  const agentCodes = new Set(agents.map((a) => a.code));
  const playerCodes = new Set(players.map((p) => p.playerCode));
  const orphanRefs = Object.keys(byRef).filter((c) => !agentCodes.has(c) && playerCodes.has(c));
  const playersByCode = Object.fromEntries(players.map((p) => [p.playerCode, p]));
  const playerRoots = orphanRefs.map((c) => ({
    id: 'p-' + c, agent: playersByCode[c]?.username + ' (player)', code: c, status: 'player',
    children: childrenOf(c, new Set(), 0),
  }));
  res.json({ tree: [...tree, ...playerRoots] });
});

// ---------- audit log (mutating admin actions, recorded in auth.js) ----------
router.get('/audit', requireAuth, (req, res) => {
  let rows = store.list('audit_log');
  if (req.query.admin) rows = rows.filter((r) => (r.admin || '').toLowerCase().includes(String(req.query.admin).toLowerCase()));
  rows.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json(rows.slice(0, 300));
});

module.exports = router;
