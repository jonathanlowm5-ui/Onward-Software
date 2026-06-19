/*
 * store.js — storage backend selector.
 *
 * Routes only ever `require('../store')`, so swapping databases is a one-line
 * change here (or an env var). The chosen backend must implement the same
 * methods: list / get / insert / update / remove / getSettings / saveSettings /
 * findUser / insertUser.
 *
 *   STORE=json      (default) -> data/db.json file        (zero setup)
 *   STORE=sqlite              -> data/onward.db (SQLite)  (npm i better-sqlite3)
 *   STORE=postgres            -> DATABASE_URL (Postgres)  (npm i pg)
 */
const which = (process.env.STORE || 'json').toLowerCase();

let backend;
if (which === 'sqlite') backend = require('./store.sqlite');
else if (which === 'postgres' || which === 'pg') backend = require('./store.postgres');
else backend = require('./store.json');

if (process.env.STORE) console.log(`[store] using "${which}" backend`);
module.exports = backend;
