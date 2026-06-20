/*
 * seed.js — runs once on first boot. Idempotent: it only seeds collections
 * that are still empty, so restarting the server never duplicates data and
 * never overwrites what you've created in the admin.
 *
 * Default admin login:  admin / admin123   (change it in production!)
 */
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const store = require('./store');

module.exports = function seed() {
  // ---- admin user (credentials come from env; defaults only for local dev) ----
  const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
  const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'admin123';
  if (!store.findUser(ADMIN_USER)) {
    store.insertUser({
      username: ADMIN_USER,
      passwordHash: bcrypt.hashSync(ADMIN_PASS, 10),
      role: 'admin',
    });
    const usingDefaults = !process.env.ADMIN_PASSWORD;
    console.log(
      `Seeded admin user (${ADMIN_USER}${usingDefaults ? ' / admin123 — CHANGE THIS' : ''})`
    );
  }

  // ---- game catalogue (full set extracted from the original site; real data,
  //      so the frontend loads everything dynamically from the DB) ----
  if (store.list('games').length === 0) {
    let catalogue = null;
    try {
      catalogue = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed-data', 'games.json'), 'utf8'));
    } catch { catalogue = null; }
    if (Array.isArray(catalogue) && catalogue.length) {
      catalogue.forEach((g) => store.insert('games', g));
      console.log(`Seeded ${catalogue.length} games from catalogue`);
    } else {
      seedDemoGames();
    }
  }

  function seedDemoGames() {
    const games = [
      { name: 'Fortune Dragon', provider: 'PG Soft', category: 'slots', icon: '🐉', badge: 'hot', color: '#b22222', launchUrl: 'https://launch.example.com/fortune-dragon', order: 1 },
      { name: 'Gold Tiger', provider: 'Jili', category: 'slots', icon: '🐯', badge: 'new', color: '#daa520', launchUrl: 'https://launch.example.com/gold-tiger', order: 2 },
      { name: 'Lucky Koi', provider: 'Microgaming', category: 'slots', icon: '🐠', color: '#008b8b', launchUrl: 'https://launch.example.com/lucky-koi', order: 3 },
      { name: 'Aviator', provider: 'Spribe', category: 'crash', icon: '✈️', badge: 'hot', color: '#dc143c', launchUrl: 'https://launch.example.com/aviator', order: 4 },
      { name: 'JetX', provider: 'SmartSoft', category: 'crash', icon: '🚀', color: '#ff4500', launchUrl: 'https://launch.example.com/jetx', order: 5 },
      { name: 'Lightning Roulette', provider: 'Evolution', category: 'live', icon: '🎡', badge: 'hot', color: '#228b22', launchUrl: 'https://launch.example.com/lightning-roulette', order: 6 },
      { name: 'Ocean King', provider: 'Jili', category: 'fishing', icon: '🐟', badge: 'new', color: '#1e90ff', launchUrl: 'https://launch.example.com/ocean-king', order: 7 },
      { name: 'Fishing War', provider: 'PG Soft', category: 'fishing', icon: '🎣', color: '#00ced1', launchUrl: 'https://launch.example.com/fishing-war', order: 8 },
    ];
    games.forEach((g) => store.insert('games', { ...g, image: '', enabled: true }));
    console.log(`Seeded ${games.length} demo games`);
  }

  // ---- demo banners ----
  if (store.list('banners').length === 0) {
    const banners = [
      { title: 'Welcome Bonus', subtitle: '125% up to PHP 3,970 + 100 free spins', redirectUrl: '/promos/welcome', image: 'https://placehold.co/1200x400/162035/f0c040?text=Welcome+Bonus', active: true, sortOrder: 1 },
      { title: 'Weekend Reload', subtitle: '50% up to PHP 5,000 every weekend', redirectUrl: '/promos/reload', image: 'https://placehold.co/1200x400/1e2d47/38bdf8?text=Weekend+Reload', active: true, sortOrder: 2 },
      { title: 'Sports Cashback', subtitle: '10% cashback on all sports bets', redirectUrl: '/promos/sports', image: 'https://placehold.co/1200x400/0c1120/22c55e?text=Sports+Cashback', active: true, sortOrder: 3 },
    ];
    banners.forEach((b) => store.insert('banners', b));
    console.log(`Seeded ${banners.length} demo banners`);
  }

  // ---- demo promotions ----
  if (store.list('promotions').length === 0) {
    const yr = new Date().getFullYear();
    const promos = [
      { title: '1st Deposit Bonus', description: '125% up to PHP 3,970 plus 100 free spins on your first deposit.', startDate: `${yr}-01-01`, endDate: `${yr + 1}-12-31`, status: 'active', buttonText: 'Claim now', buttonLink: '/register', image: 'https://placehold.co/600x400/162035/f0c040?text=1st+Deposit' },
      { title: 'Weekly Cashback', description: 'Get 10% cashback every week on your net losses, credited every Monday.', startDate: `${yr}-01-01`, endDate: `${yr + 1}-12-31`, status: 'active', buttonText: 'Learn more', buttonLink: '/promos/cashback', image: 'https://placehold.co/600x400/1e2d47/38bdf8?text=Cashback' },
      { title: 'Expired New Year Drop', description: 'This one already ended and should NOT appear on the frontend.', startDate: `${yr - 1}-12-01`, endDate: `${yr - 1}-12-31`, status: 'active', buttonText: 'Closed', buttonLink: '#', image: 'https://placehold.co/600x400/111827/8898b8?text=Expired' },
    ];
    promos.forEach((p) => store.insert('promotions', p));
    console.log(`Seeded ${promos.length} demo promotions (1 intentionally expired)`);
  }

  // ---- one-time removal of the seeded demo player ----
  // We no longer ship a demo player (so the admin only ever shows real, web
  // registered accounts). This deletes the original seeded "player" and its
  // demo transactions/KYC exactly once; it matches by username AND the seed
  // email, so a real player can never be removed by accident.
  const cfg = store.getSettings();
  if (!cfg.demoPlayerRemoved) {
    const demo = store.list('players').find(
      (p) => (p.username || '').toLowerCase() === 'player'
        && (p.email || '').toLowerCase() === 'player@onward.test'
    );
    if (demo) {
      ['transactions', 'kyc', 'bank_accounts', 'login_history'].forEach((col) => {
        store.list(col)
          .filter((r) => String(r.playerId) === String(demo.id))
          .forEach((r) => store.remove(col, r.id));
      });
      store.remove('players', demo.id);
      console.log('Removed seeded demo player (player) and its demo data');
    }
    store.saveSettings({ demoPlayerRemoved: true });
  }

  // ---- default API configuration ----
  const s = store.getSettings();
  if (!s.environment) {
    store.saveSettings({
      baseUrl: `http://localhost:${process.env.PORT || 4000}/api`,
      apiKey: '',
      environment: 'development',
    });
  }
};
