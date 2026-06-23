/*
 * routes/minigames.js — Fortune Wheel + Lucky Ticket mini games shared by the
 * admin panel (Promotions → Mini Games) and the player website.
 *
 * GET  /api/mini-games            (public) -> { wheel, ticket }
 * PUT  /api/mini-games            (admin, settings.manage) -> save config
 * POST /api/mini-games/wheel/spin (player) -> spins, credits the prize, returns
 *      { result: { index, slice }, balance, free, spinCost, spinsToday }
 *
 * The config lives in app_settings (settings.miniGames) so the admin editor and
 * the customer-facing wheel stay in sync — change a slice, prize, weight, colour
 * or the spin economics and it is reflected on the player site immediately.
 */
const express = require('express');
const store = require('../store');
const { requireAuth, requirePlayer } = require('../auth');
const { requirePerm } = require('../permissions');
const { normalizeCurrency } = require('../playerUtils');

const router = express.Router();

// ---- Canonical defaults ----------------------------------------------------
const DEFAULT_SLICES = [
  { l: '₱50 Cash', p: 50, w: 30, c: '#e8253a', on: 1 },
  { l: '₱100 Cash', p: 100, w: 20, c: '#f4b223', on: 1 },
  { l: '₱200 Cash', p: 200, w: 15, c: '#2ecc71', on: 1 },
  { l: 'Free Spin x3', p: 3, w: 12, c: '#3ab7ff', on: 1 },
  { l: '₱500 Cash', p: 500, w: 8, c: '#a86dff', on: 1 },
  { l: '₱1,000 Cash', p: 1000, w: 5, c: '#ff7a1a', on: 1 },
  { l: 'Try Again', p: 0, w: 7, c: '#14182a', on: 1 },
  { l: '₱5,000 JACKPOT', p: 5000, w: 3, c: '#f7e08b', on: 1 },
];

function defaultConfig() {
  return {
    wheel: {
      enabled: true,
      image: '',
      theme: {
        bgImage: '',
        titleImage: '',
        title: 'WHEEL OF FORTUNE',
        rimColor: '#f4b223',
        hubColor: '#f4b223',
        pointerColor: '#f4b223',
        bulbs: true,
      },
      freeSpinsPerDay: 1,
      spinCost: 50,
      maxPerDay: 5,
      slices: DEFAULT_SLICES.map((s) => ({ ...s })),
    },
    ticket: {
      enabled: true,
      drawDate: '',
      totalTickets: 10000,
      winnersCount: 50,
      earnBy: 'Every ₱100 deposited',
      minDeposit: 100,
      maxPerPlayer: 50,
      prizeTiers: [
        { rank: '🥇 1st', prize: '₱50,000 Cash', winners: 1 },
        { rank: '🥈 2nd', prize: '₱20,000 Cash', winners: 3 },
        { rank: '🥉 3rd', prize: '₱10,000 Cash', winners: 5 },
        { rank: '4th–10th', prize: '₱5,000 Cash', winners: 7 },
        { rank: '11th–30th', prize: '₱1,000 Cash', winners: 20 },
        { rank: '31st–50th', prize: '₱500 Cash', winners: 20 },
      ],
    },
  };
}

const num = (x, d = 0) => {
  const n = parseFloat(String(x).replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : d;
};
const str = (x, d = '') => (x === undefined || x === null ? d : String(x).trim());
const bool = (x, d = true) => (x === undefined || x === null ? d : !!x && x !== 0 && x !== '0');

function cleanSlice(raw = {}, def = {}) {
  return {
    l: str(raw.l ?? raw.label, def.l || 'Prize').slice(0, 40) || 'Prize',
    p: Math.max(0, num(raw.p ?? raw.prize, def.p || 0)),
    w: Math.max(0, num(raw.w ?? raw.weight, def.w || 0)),
    c: str(raw.c ?? raw.colour ?? raw.color, def.c || '#3aa0ff').slice(0, 24) || '#3aa0ff',
    on: bool(raw.on, def.on !== undefined ? def.on : true) ? 1 : 0,
  };
}

function cleanTheme(raw = {}, def = {}) {
  const t = raw && typeof raw === 'object' ? raw : {};
  return {
    bgImage: str(t.bgImage, '').slice(0, 2048),
    titleImage: str(t.titleImage, '').slice(0, 2048),
    title: str(t.title, def.title || 'WHEEL OF FORTUNE').slice(0, 60),
    rimColor: str(t.rimColor, def.rimColor || '#f4b223').slice(0, 24) || (def.rimColor || '#f4b223'),
    hubColor: str(t.hubColor, def.hubColor || '#f4b223').slice(0, 24) || (def.hubColor || '#f4b223'),
    pointerColor: str(t.pointerColor, def.pointerColor || '#f4b223').slice(0, 24) || (def.pointerColor || '#f4b223'),
    bulbs: bool(t.bulbs, def.bulbs !== undefined ? def.bulbs : true),
  };
}

function cleanConfig(raw = {}) {
  const def = defaultConfig();
  const w = raw.wheel || {};
  const t = raw.ticket || {};
  const slices = Array.isArray(w.slices) && w.slices.length
    ? w.slices.slice(0, 24).map((s) => cleanSlice(s))
    : def.wheel.slices;
  return {
    wheel: {
      enabled: bool(w.enabled, def.wheel.enabled),
      image: str(w.image, '').slice(0, 2048),
      theme: cleanTheme(w.theme, def.wheel.theme),
      freeSpinsPerDay: Math.max(0, num(w.freeSpinsPerDay, def.wheel.freeSpinsPerDay)),
      spinCost: Math.max(0, num(w.spinCost, def.wheel.spinCost)),
      maxPerDay: Math.max(1, num(w.maxPerDay, def.wheel.maxPerDay)),
      slices,
    },
    ticket: {
      enabled: bool(t.enabled, def.ticket.enabled),
      drawDate: str(t.drawDate, def.ticket.drawDate),
      totalTickets: Math.max(0, num(t.totalTickets, def.ticket.totalTickets)),
      winnersCount: Math.max(0, num(t.winnersCount, def.ticket.winnersCount)),
      earnBy: str(t.earnBy, def.ticket.earnBy) || def.ticket.earnBy,
      minDeposit: Math.max(0, num(t.minDeposit, def.ticket.minDeposit)),
      maxPerPlayer: Math.max(0, num(t.maxPerPlayer, def.ticket.maxPerPlayer)),
      prizeTiers: Array.isArray(t.prizeTiers) && t.prizeTiers.length
        ? t.prizeTiers.slice(0, 20).map((x) => ({
          rank: str(x.rank, '—'), prize: str(x.prize, '—'), winners: Math.max(0, num(x.winners, 0)),
        }))
        : def.ticket.prizeTiers,
    },
  };
}

function currentConfig() {
  const saved = store.getSettings().miniGames;
  if (!saved || typeof saved !== 'object') return defaultConfig();
  return cleanConfig(saved);
}

// ---- public: read config ---------------------------------------------------
router.get('/', (req, res) => {
  res.json(currentConfig());
});

// ---- admin: save config ----------------------------------------------------
router.put('/', requireAuth, requirePerm('settings.manage'), (req, res) => {
  const cfg = cleanConfig(req.body || {});
  store.saveSettings({ miniGames: cfg, miniGamesUpdatedAt: new Date().toISOString() });
  res.json(cfg);
});

// ---- player: spin the wheel ------------------------------------------------
function today() {
  return new Date().toISOString().slice(0, 10);
}
function spinsTodayFor(playerId) {
  const d = today();
  return store.list('wheel_spins').filter(
    (s) => String(s.playerId) === String(playerId) && (s.date === d)
  );
}

router.post('/wheel/spin', requirePlayer, (req, res) => {
  const cfg = currentConfig().wheel;
  if (!cfg.enabled) return res.status(403).json({ error: 'The Fortune Wheel is currently disabled' });

  const p = store.get('players', req.auth.sub);
  if (!p) return res.status(404).json({ error: 'Player not found' });

  const active = cfg.slices.filter((s) => s.on);
  if (!active.length) return res.status(400).json({ error: 'No active wheel slices configured' });

  const todays = spinsTodayFor(p.id);
  const used = todays.length;
  if (used >= cfg.maxPerDay) {
    return res.status(403).json({ error: `Daily spin limit reached (${cfg.maxPerDay}/day)`, code: 'MAX_SPINS' });
  }

  // Free spins first, then paid spins (debit the spin cost from balance).
  const free = used < cfg.freeSpinsPerDay;
  let balance = Number(p.balance || 0);
  if (!free) {
    if (cfg.spinCost <= 0) {
      return res.status(403).json({ error: 'No free spins left for today', code: 'NO_FREE_SPINS' });
    }
    if (balance < cfg.spinCost) {
      return res.status(400).json({ error: 'Insufficient balance for a paid spin', code: 'LOW_BALANCE' });
    }
    balance -= cfg.spinCost;
  }

  // Weighted pick among active slices.
  const total = active.reduce((a, s) => a + (s.w > 0 ? s.w : 0), 0) || active.length;
  let r = Math.random() * total;
  let index = 0;
  for (let i = 0; i < active.length; i += 1) {
    r -= (active[i].w > 0 ? active[i].w : 0);
    if (r <= 0) { index = i; break; }
    index = i;
  }
  const slice = active[index];
  const prize = Number(slice.p || 0);
  // Only cash prizes (label mentioning Cash/Jackpot or a plain amount) credit
  // the wallet; "Free Spin x3" / "Try Again" carry small or zero token values.
  const isCash = prize > 0 && /cash|jackpot|₱|\bbonus\b/i.test(slice.l);
  if (isCash) balance += prize;

  const updated = store.update('players', p.id, { balance });

  store.insert('wheel_spins', {
    playerId: p.id, username: p.username, date: today(),
    label: slice.l, prize: isCash ? prize : 0, free: free ? 1 : 0, cost: free ? 0 : cfg.spinCost,
  });

  // A transaction row so the win shows in history and the admin ledger.
  if (isCash) {
    store.insert('transactions', {
      playerId: p.id, username: p.username, currency: normalizeCurrency(p.currency),
      type: 'bonus', amount: prize, method: 'Fortune Wheel', source: 'fortune-wheel',
      status: 'approved', note: `Fortune Wheel — ${slice.l}`,
    });
  }

  res.json({
    result: { index, slice },
    balance: Number(updated.balance || balance),
    free,
    spinCost: cfg.spinCost,
    spinsToday: used + 1,
    maxPerDay: cfg.maxPerDay,
    won: isCash ? prize : 0,
  });
});

// ---- player: how many spins they have left today --------------------------
router.get('/wheel/status', requirePlayer, (req, res) => {
  const cfg = currentConfig().wheel;
  const used = spinsTodayFor(req.auth.sub).length;
  res.json({
    enabled: cfg.enabled,
    spinsToday: used,
    maxPerDay: cfg.maxPerDay,
    freeLeft: Math.max(0, cfg.freeSpinsPerDay - used),
    spinCost: cfg.spinCost,
  });
});

module.exports = router;
