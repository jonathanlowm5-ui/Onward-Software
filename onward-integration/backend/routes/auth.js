/*
 * routes/auth.js
 *
 * POST /api/auth/login            { username, password } -> { token, user }
 * GET  /api/auth/me               (admin) -> { user (role + permissions) }
 * POST /api/auth/change-password  (admin) change own password
 * GET  /api/auth/admins           (admins.manage) list admin accounts
 * POST /api/auth/admins           (admins.manage) create an admin
 * PUT  /api/auth/admins/:username  (admins.manage) update role/permissions/password
 * DELETE /api/auth/admins/:username (admins.manage) remove an admin
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const store = require('../store');
const { sign, requireAuth } = require('../auth');
const { effectivePerms, requirePerm, ROLES, ALL_PERMISSIONS } = require('../permissions');
const { rateLimit } = require('../rateLimit');

const router = express.Router();

const publicUser = (u) => ({
  username: u.username,
  role: u.role || 'admin',
  permissions: effectivePerms(u),
  customPermissions: Array.isArray(u.permissions) ? u.permissions : [],
});

router.post('/login', rateLimit('admin-login', 12, 60_000), (req, res) => {
  const { username, password } = req.body || {};
  const user = store.findUser(username);
  if (!user || !bcrypt.compareSync(String(password || ''), user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  res.json({ token: sign(user), user: publicUser(user) });
});

router.get('/me', requireAuth, (req, res) => {
  const user = store.findUser(req.user.sub);
  if (!user) return res.json({ user: { username: req.user.sub, role: req.user.role, permissions: [] } });
  // Nudge the operator to rotate the seeded default credentials.
  const usingDefaultPassword = !!(user.passwordHash && bcrypt.compareSync('admin123', user.passwordHash));
  res.json({ user: { ...publicUser(user), usingDefaultPassword } });
});

// Change the logged-in admin's password.
router.post('/change-password', requireAuth, (req, res) => {
  const user = store.findUser(req.user.sub);
  if (!user) return res.status(404).json({ error: 'Admin account not found' });
  const current = String(req.body?.currentPassword || '');
  const next = String(req.body?.newPassword || '');
  if (!bcrypt.compareSync(current, user.passwordHash)) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }
  if (next.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
  if (user.id) store.update('users', user.id, { passwordHash: bcrypt.hashSync(next, 10) });
  res.json({ ok: true });
});

// ---- admin account management (superadmin / admins.manage only) ----
router.get('/admins', requireAuth, requirePerm('admins.manage'), (req, res) => {
  res.json({
    roles: ROLES,
    permissions: ALL_PERMISSIONS,
    admins: store.list('users').map(publicUser),
  });
});

// Only a superadmin may create or grant the superadmin role or the
// admins.manage permission — otherwise a lower admin holding admins.manage
// could promote itself/others to full control (privilege escalation).
function elevatesPrivilege(role, permissions) {
  return role === 'superadmin' || (Array.isArray(permissions) && permissions.includes('admins.manage'));
}

router.post('/admins', requireAuth, requirePerm('admins.manage'), (req, res) => {
  const b = req.body || {};
  const username = String(b.username || '').trim();
  const password = String(b.password || '');
  const role = ROLES.includes(b.role) ? b.role : 'admin';
  if (!username) return res.status(400).json({ error: 'Username is required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  if (elevatesPrivilege(role, b.permissions) && req.adminUser?.role !== 'superadmin') {
    return res.status(403).json({ error: 'Only a superadmin can grant superadmin or admin-management access' });
  }
  if (store.findUser(username)) return res.status(409).json({ error: 'That admin username already exists' });
  const user = store.insertUser({
    username,
    passwordHash: bcrypt.hashSync(password, 10),
    role,
    permissions: Array.isArray(b.permissions) ? b.permissions : [],
  });
  res.status(201).json(publicUser(user));
});

router.put('/admins/:username', requireAuth, requirePerm('admins.manage'), (req, res) => {
  const user = store.findUser(req.params.username);
  if (!user) return res.status(404).json({ error: 'Admin not found' });
  const b = req.body || {};
  const isSuper = req.adminUser?.role === 'superadmin';
  // Guard escalation: only a superadmin may grant the superadmin role /
  // admins.manage, touch an existing superadmin, or change their own role.
  if (elevatesPrivilege(b.role, b.permissions) && !isSuper) {
    return res.status(403).json({ error: 'Only a superadmin can grant superadmin or admin-management access' });
  }
  if (user.role === 'superadmin' && !isSuper) {
    return res.status(403).json({ error: 'Only a superadmin can edit a superadmin account' });
  }
  if (user.username === req.user.sub && b.role !== undefined && b.role !== user.role) {
    return res.status(400).json({ error: 'You cannot change your own role' });
  }
  const patch = {};
  if (b.role !== undefined && ROLES.includes(b.role)) patch.role = b.role;
  if (Array.isArray(b.permissions)) patch.permissions = b.permissions;
  if (b.password) {
    if (String(b.password).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    patch.passwordHash = bcrypt.hashSync(String(b.password), 10);
  }
  if (!user.id) return res.status(400).json({ error: 'This admin cannot be edited' });
  res.json(publicUser(store.update('users', user.id, patch)));
});

router.delete('/admins/:username', requireAuth, requirePerm('admins.manage'), (req, res) => {
  const user = store.findUser(req.params.username);
  if (!user) return res.status(404).json({ error: 'Admin not found' });
  if (user.username === req.user.sub) return res.status(400).json({ error: 'You cannot delete your own account' });
  if (user.role === 'superadmin') {
    const supers = store.list('users').filter((u) => u.role === 'superadmin');
    if (supers.length <= 1) return res.status(400).json({ error: 'Cannot delete the last superadmin' });
  }
  if (user.id) store.remove('users', user.id);
  res.json({ ok: true });
});

module.exports = router;
