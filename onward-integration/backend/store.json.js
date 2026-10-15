/*
 * store.js — a tiny file-backed JSON store.
 *
 * Chosen so the whole backend runs with `npm install && npm start` on any
 * machine, no database engine to install, no native build step. The data
 * lives in data/db.json. For production you can swap this single module for
 * Postgres/MySQL/SQLite without touching the routes — they only call the
 * methods below (list / get / insert / update / remove / getSettings /
 * saveSettings).
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, 'data', 'db.json');

function readRaw() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch {
    return { games: [], banners: [], promotions: [], settings: {}, users: [] };
  }
}

function writeRaw(db) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// Ensure the file exists on first run.
if (!fs.existsSync(DB_PATH)) {
  writeRaw({ games: [], banners: [], promotions: [], settings: {}, users: [] });
}

// The whole DB lives in memory; disk writes are debounced so bulk operations
// (like importing thousands of games) don't rewrite the file per record.
const DB = readRaw();
let flushTimer = null;
function flush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => { flushTimer = null; try { writeRaw(DB); } catch (e) { console.error('[store] flush', e.message); } }, 200);
}
process.on('exit', () => { try { if (flushTimer) writeRaw(DB); } catch { /* ignore */ } });
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

const now = () => new Date().toISOString();
const newId = () => crypto.randomUUID();

const store = {
  // ---- collections (games / banners / promotions) ----
  list(collection) {
    return DB[collection] || [];
  },

  get(collection, id) {
    return (DB[collection] || []).find((r) => r.id === id) || null;
  },

  insert(collection, data) {
    const record = { id: newId(), ...data, createdAt: now(), updatedAt: now() };
    DB[collection] = DB[collection] || [];
    DB[collection].push(record);
    flush();
    return record;
  },

  update(collection, id, patch) {
    const list = DB[collection] || [];
    const i = list.findIndex((r) => r.id === id);
    if (i === -1) return null;
    list[i] = { ...list[i], ...patch, id, updatedAt: now() };
    flush();
    return list[i];
  },

  remove(collection, id) {
    const list = DB[collection] || [];
    const i = list.findIndex((r) => r.id === id);
    if (i === -1) return false;
    list.splice(i, 1);
    flush();
    return true;
  },

  // ---- settings (single object: API configuration) ----
  getSettings() {
    return DB.settings || {};
  },

  saveSettings(patch) {
    DB.settings = { ...DB.settings, ...patch, updatedAt: now() };
    flush();
    return DB.settings;
  },

  // ---- users (admin auth) ----
  findUser(username) {
    return (DB.users || []).find((u) => u.username === username) || null;
  },

  insertUser(user) {
    DB.users = DB.users || [];
    DB.users.push(user);
    flush();
    return user;
  },

  raw: () => DB,
  save: () => writeRaw(DB),
};

module.exports = store;
