/*
 * routes/auth.js
 *
 * POST /api/auth/login  { username, password } -> { token, user }
 * GET  /api/auth/me     (admin) -> { user }
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const store = require('../store');
const { sign, requireAuth } = require('../auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const user = store.findUser(username);
  if (!user || !bcrypt.compareSync(String(password || ''), user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  res.json({ token: sign(user), user: { username: user.username, role: user.role } });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: { username: req.user.sub, role: req.user.role } });
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

module.exports = router;
