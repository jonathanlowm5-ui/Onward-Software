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

const now = () => new Date().toISOString();
const newId = () => crypto.randomUUID();

const store = {
  // ---- collections (games / banners / promotions) ----
  list(collection) {
    return readRaw()[collection] || [];
  },

  get(collection, id) {
    return (readRaw()[collection] || []).find((r) => r.id === id) || null;
  },

  insert(collection, data) {
    const db = readRaw();
    const record = { id: newId(), ...data, createdAt: now(), updatedAt: now() };
    db[collection] = db[collection] || [];
    db[collection].push(record);
    writeRaw(db);
    return record;
  },

  update(collection, id, patch) {
    const db = readRaw();
    const list = db[collection] || [];
    const i = list.findIndex((r) => r.id === id);
    if (i === -1) return null;
    list[i] = { ...list[i], ...patch, id, updatedAt: now() };
    writeRaw(db);
    return list[i];
  },

  remove(collection, id) {
    const db = readRaw();
    const list = db[collection] || [];
    const i = list.findIndex((r) => r.id === id);
    if (i === -1) return false;
    list.splice(i, 1);
    writeRaw(db);
    return true;
  },

  // ---- settings (single object: API configuration) ----
  getSettings() {
    return readRaw().settings || {};
  },

  saveSettings(patch) {
    const db = readRaw();
    db.settings = { ...db.settings, ...patch, updatedAt: now() };
    writeRaw(db);
    return db.settings;
  },

  // ---- users (admin auth) ----
  findUser(username) {
    return (readRaw().users || []).find((u) => u.username === username) || null;
  },

  insertUser(user) {
    const db = readRaw();
    db.users = db.users || [];
    db.users.push(user);
    writeRaw(db);
    return user;
  },

  raw: readRaw,
  save: writeRaw,
};

module.exports = store;
