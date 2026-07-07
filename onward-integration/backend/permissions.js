/*
 * permissions.js — role-based access control for the admin API.
 *
 * Every admin user (in the `users` collection) has a `role` and an optional
 * explicit `permissions` array. A superadmin can do everything; lower roles are
 * limited to a default permission set, which can be extended per-user.
 *
 * Routes guard sensitive actions with `requireAuth, requirePerm('<perm>')`.
 */
const store = require('./store');

const ALL = '*';

// The full list of guarded actions (used by the admin UI to build role editors).
const ALL_PERMISSIONS = [
  'players.edit',
  'players.delete',
  'players.adjust',     // credit / debit / reset balance
  'players.resetpw',
  'players.status',     // suspend / activate / block
  'players.kick',
  'kyc.approve',        // approve / reject KYC + verify email/mobile
  'transactions.approve',
  'settings.manage',    // site settings, KYC bonus, currency rates, etc.
  'marketing.manage',   // campaigns, providers, automations, ads
  'content.manage',     // promotions, banners, games, mini-games, page content
  'agents.manage',      // approve / reject agent applications
  'admins.manage',      // create / edit / delete admin accounts
];

// Default permissions per role. `superadmin` gets everything (ALL).
const ROLE_PERMS = {
  superadmin: [ALL],
  manager: [
    'players.edit', 'players.status', 'players.adjust', 'players.resetpw',
    'players.kick', 'kyc.approve', 'transactions.approve',
    'settings.manage', 'content.manage', 'agents.manage', 'marketing.manage',
  ],
  admin: [
    'players.status', 'players.kick', 'kyc.approve', 'transactions.approve',
    'settings.manage', 'content.manage', 'agents.manage',
  ],
  support: ['players.status', 'kyc.approve'],
  viewer: [],
};

const ROLES = Object.keys(ROLE_PERMS);

function effectivePerms(user) {
  if (!user) return [];
  const role = ROLE_PERMS[user.role] ? user.role : 'admin';
  const base = ROLE_PERMS[role] || [];
  if (base.includes(ALL)) return [ALL];
  const extra = Array.isArray(user.permissions) ? user.permissions : [];
  return Array.from(new Set([...base, ...extra]));
}

function can(user, perm) {
  const perms = effectivePerms(user);
  return perms.includes(ALL) || perms.includes(perm);
}

// Express middleware factory. Runs after requireAuth (which sets req.user).
function requirePerm(perm) {
  return (req, res, next) => {
    const user = store.findUser(req.user && req.user.sub);
    if (!user) return res.status(403).json({ error: 'Admin account not found' });
    if (can(user, perm)) { req.adminUser = user; return next(); }
    return res.status(403).json({ error: `Permission denied (${perm}). Ask a superadmin.` });
  };
}

module.exports = { ALL, ALL_PERMISSIONS, ROLE_PERMS, ROLES, effectivePerms, can, requirePerm };
