/*
 * scripts/set-admin.js — create or reset the admin login.
 *
 *   node scripts/set-admin.js <username> <password>
 *   # or via env:
 *   ADMIN_USERNAME=boss ADMIN_PASSWORD='S3cret!' node scripts/set-admin.js
 *
 * Works with whatever STORE backend is configured.
 */
const bcrypt = require('bcryptjs');
const store = require('../store');

const username = process.argv[2] || process.env.ADMIN_USERNAME;
const password = process.argv[3] || process.env.ADMIN_PASSWORD;

if (!username || !password) {
  console.error('Usage: node scripts/set-admin.js <username> <password>');
  process.exit(1);
}

const passwordHash = bcrypt.hashSync(password, 10);
const existing = store.findUser(username);

if (existing) {
  store.update('users', existing.id, { passwordHash });
  console.log(`Updated password for "${username}".`);
} else {
  store.insertUser({ username, passwordHash, role: 'admin' });
  console.log(`Created admin user "${username}".`);
}
