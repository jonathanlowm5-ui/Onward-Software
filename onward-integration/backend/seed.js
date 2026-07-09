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
      role: 'superadmin',
      permissions: [],
    });
    const usingDefaults = !process.env.ADMIN_PASSWORD;
    console.log(
      `Seeded admin user (${ADMIN_USER}${usingDefaults ? ' / admin123 — CHANGE THIS' : ''})`
    );
  }
  // One-time: make the primary admin a superadmin so RBAC doesn't lock out the
  // owner (older installs seeded role "admin", which is now a limited role).
  {
    const s = store.getSettings();
    if (!s.adminSuperUpgradedV1) {
      const u = store.findUser(ADMIN_USER);
      if (u && u.id && u.role !== 'superadmin') store.update('users', u.id, { role: 'superadmin' });
      store.saveSettings({ adminSuperUpgradedV1: true });
    }
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

  // ---- one-time: add the built-in showcase bonuses/reloads as REAL, editable
  // promotions so admins can manage them and upload banners. Guarded by a flag
  // so deleting one in the admin won't make it come back; also skips any title
  // that already exists to avoid duplicates. ----
  const _ps = store.getSettings();
  if (!_ps.showcasePromosSeededV1) {
    const SHOWCASE = [
      { title: '1st Deposit Bonus', type: 'deposit', description: '125% UP TO ₱3,970\n+100 FREE SPINS', bonus: '125%', maxBonus: '₱3,970', minDeposit: '₱500', wager: '30x', turnover: '0x' },
      { title: '2nd Deposit Bonus', type: 'deposit', description: '100% UP TO ₱1,980\n+25 FREE SPINS', bonus: '100%', maxBonus: '₱1,980', minDeposit: '₱500', wager: '30x', turnover: '0x' },
      { title: '3rd Deposit Bonus', type: 'deposit', description: '75% UP TO ₱5,950\n+50 FREE SPINS', bonus: '75%', maxBonus: '₱5,950', minDeposit: '₱500', wager: '35x', turnover: '0x' },
      { title: '4th Deposit Bonus', type: 'deposit', description: '200% UP TO ₱7,940\n+25 FREE SPINS', bonus: '200%', maxBonus: '₱7,940', minDeposit: '₱1,000', wager: '40x', turnover: '0x' },
      { title: 'Weekend Reload', type: 'deposit', description: '50% UP TO ₱5,000\n+55 FREE SPINS', bonus: '50%', maxBonus: '₱5,000', minDeposit: '₱500', wager: '25x', turnover: '0x' },
      { title: 'Weekly Cashback', type: 'cashback', description: '10% CASHBACK\nEVERY WEEK', bonus: '10%', maxBonus: '₱20,000', minDeposit: '₱0', wager: '5x', turnover: '0x' },
      { title: 'Monday Reload', type: 'reload', description: '50% UP TO ₱3,000\n+30 FREE SPINS', bonus: '50%', maxBonus: '₱3,000', minDeposit: '₱300', wager: '30x', turnover: '0x' },
      { title: 'Daily Reload', type: 'reload', description: '30% UP TO ₱2,000\nEVERY DAY', bonus: '30%', maxBonus: '₱2,000', minDeposit: '₱200', wager: '25x', turnover: '0x' },
      { title: 'Weekend Special', type: 'reload', description: '75% UP TO ₱8,000\nSAT & SUN ONLY', bonus: '75%', maxBonus: '₱8,000', minDeposit: '₱500', wager: '35x', turnover: '0x' },
    ];
    const have = store.list('promotions');
    let order = have.length;
    let added = 0;
    SHOWCASE.forEach((p) => {
      const dup = have.some((x) => String(x.title || '').trim().toLowerCase() === p.title.toLowerCase());
      if (dup) return;
      store.insert('promotions', {
        image: '', banners: {}, currency: '', country: '',
        startDate: '', endDate: '', status: 'active',
        buttonText: 'Claim Now', buttonLink: '/deposit',
        sortOrder: order++, ...p,
      });
      added += 1;
    });
    store.saveSettings({ showcasePromosSeededV1: true });
    console.log(`Seeded ${added} showcase promotions into backend`);
  }

  // ---- one-time wipe of all demo/test players ----
  // Requested clean slate before real test players are created. Deletes every
  // player and their related records, once (guarded by a flag), then future
  // real registrations are kept untouched.
  const cfg = store.getSettings();
  if (!cfg.playersWipedV1) {
    const all = store.list('players');
    all.forEach((p) => {
      ['transactions', 'kyc', 'bank_accounts', 'login_history'].forEach((col) => {
        store.list(col)
          .filter((r) => String(r.playerId) === String(p.id))
          .forEach((r) => store.remove(col, r.id));
      });
      store.remove('players', p.id);
    });
    if (all.length) console.log(`Wiped ${all.length} demo/test player(s) and related data`);
    store.saveSettings({ playersWipedV1: true, demoPlayerRemoved: true });
  }

  // ---- sample missions (once, and only while none exist) ----
  {
    const st = store.getSettings();
    if (!st.missionSamplesSeededV1 && !(Array.isArray(st.missions) && st.missions.length)) {
      const fs2 = (n) => ({ target: String(n.t), reward: n.r });
      store.saveSettings({
        missions: [
          { id: 'm-login7', enabled: true, icon: '🔥', title: 'Daily Login Streak', desc: 'Log in every day to climb the ladder', type: 'login', target: '', reward: '', duration: '7 days',
            tiers: [{ t: 1, r: '2 FS' }, { t: 2, r: '2 FS' }, { t: 3, r: '5 FS' }, { t: 4, r: '5 FS' }, { t: 5, r: '10 FS' }, { t: 6, r: '10 FS' }, { t: 7, r: '₱50' }].map(fs2) },
          { id: 'm-deposit-ladder', enabled: true, icon: '💰', title: 'Deposit Ladder', desc: 'Deposit more, earn more', type: 'deposit', target: '', reward: '', duration: 'Ongoing',
            tiers: [{ t: '₱1,000', r: 'Free 10' }, { t: '₱2,000', r: 'Free 20' }, { t: '₱5,000', r: 'Free 50' }, { t: '₱10,000', r: '₱100' }].map((x) => ({ target: String(x.t), reward: x.r })) },
          { id: 'm-first-deposit', enabled: true, icon: '💳', title: 'First Deposit', desc: 'Make your first deposit', type: 'deposit', target: '1', reward: '50 FS', duration: 'Once', tiers: [] },
          { id: 'm-wager-ladder', enabled: true, icon: '🎲', title: 'Weekly Wager', desc: 'Wager to unlock rewards', type: 'wager', target: '', reward: '', duration: '7 days',
            tiers: [{ t: '₱1,000', r: 'Free 10' }, { t: '₱2,000', r: 'Free 20' }, { t: '₱5,000', r: 'Free 50' }].map((x) => ({ target: String(x.t), reward: x.r })) },
          { id: 'm-referral', enabled: true, icon: '🤝', title: 'Refer a Friend', desc: 'Invite 1 friend who registers', type: 'referral', target: '1', reward: '₱150', duration: 'Ongoing', tiers: [] },
        ],
        missionSamplesSeededV1: true,
      });
      console.log('Seeded 5 sample missions');
    }
  }

  // ---- one-time: restore the default top-banner buttons ----
  // A partial save left a single bare button in settings.topButtons; clearing
  // the override makes /api/top-buttons serve its built-in defaults again
  // (Promotions + Giveaway on; Casino/Sport/Rewards off, ready to enable).
  {
    const st = store.getSettings();
    if (!st.topButtonsDefaultV1) {
      if (Array.isArray(st.topButtons) && st.topButtons.length < 2) {
        store.saveSettings({ topButtons: [], topButtonsDefaultV1: true });
        console.log('Reset top-banner buttons to defaults');
      } else {
        store.saveSettings({ topButtonsDefaultV1: true });
      }
    }
  }

  // ---- demo player for testing the agent application flow ----
  // Fully verified (email + mobile + approved KYC) so the Agent page shows the
  // application form immediately. Login: demoagent / Demo1234
  {
    const st = store.getSettings();
    const exists = store.list('players').some((p) => (p.username || '').toLowerCase() === 'demoagent');
    if (!st.demoAgentSeededV1 && !exists) {
      const { generatePlayerCode } = require('./playerUtils');
      const demo = store.insert('players', {
        playerCode: generatePlayerCode(store, 'PHP'),
        username: 'demoagent',
        email: 'demoagent@onward.test',
        fullName: 'Demo Agent',
        phone: '+639170000001',
        currency: 'PHP',
        dob: '1990-01-01',
        country: 'PH',
        referralCode: '',
        passwordHash: bcrypt.hashSync('Demo1234', 10),
        role: 'player',
        status: 'active',
        balance: 0,
        bonus: 0,
        kyc_status: 'approved',
        kycBonusGiven: true, // don't hand the demo account the KYC bonus
        emailVerified: true,
        mobileVerified: true,
        twoFactorEnabled: false,
        vipLevel: 0,
      });
      // Bound bank account so the withdrawal-setup modal doesn't block the demo.
      store.insert('bank_accounts', {
        playerId: demo.id, bankName: 'GCash', holder: 'Demo Agent',
        accountNumber: '09170000001', status: 'active',
      });
      store.saveSettings({ demoAgentSeededV1: true });
      console.log('Seeded demo agent-flow player (demoagent / Demo1234)');
    }
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
