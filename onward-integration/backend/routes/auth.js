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

module.exports = router;
