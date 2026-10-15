/*
 * routes/giveaways.js — giveaways shown on the player site, editable in admin.
 *   GET /api/giveaways?active=1   (public)  player site
 *   GET /api/giveaways            (admin)   full list
 *   PUT /api/giveaways            (admin)   { items } replace list
 * Stored in settings.giveaways. Seeded with the original showcase set once so
 * the page never goes empty before the admin edits them.
 */
const express = require('express');
const store = require('../store');
const { requireAuth } = require('../auth');
const { requirePerm } = require('../permissions');

const router = express.Router();

const DEFAULTS = [
  { id: 'gw-iphone', enabled: true, icon: '📱', title: 'iPhone 16 Pro Giveaway', prize: 'iPhone 16 Pro Max 256GB', desc: 'Deposit ₱500+ during the event to enter the draw.', minDeposit: 500, endsAt: '', participants: 0, image: '' },
  { id: 'gw-cash', enabled: true, icon: '💰', title: '₱100,000 Cash Drop', prize: '₱100,000 shared prize pool', desc: 'Wager on any slot to collect entries — winners drawn weekly.', minDeposit: 0, endsAt: '', participants: 0, image: '' },
  { id: 'gw-freespins', enabled: true, icon: '🎰', title: '500 Free Spins Friday', prize: '500 Free Spins', desc: 'Every Friday — deposit ₱300+ to claim.', minDeposit: 300, endsAt: '', participants: 0, image: '' },
];

function list() {
  const s = store.getSettings();
  if (Array.isArray(s.giveaways)) return s.giveaways;
  store.saveSettings({ giveaways: DEFAULTS });
  return DEFAULTS;
}

router.get('/', (req, res) => {
  let items = list();
  if (String(req.query.active || '') === '1') {
    const now = Date.now();
    items = items.filter((g) => g.enabled !== false && (!g.endsAt || Date.parse(g.endsAt) > now));
  }
  res.json(items);
});

router.put('/', requireAuth, requirePerm('content.manage'), (req, res) => {
  const items = (Array.isArray(req.body?.items) ? req.body.items : []).slice(0, 50);
  store.saveSettings({ giveaways: items });
  res.json(items);
});

module.exports = router;
