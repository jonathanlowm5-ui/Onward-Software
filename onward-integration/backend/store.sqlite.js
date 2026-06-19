/*
 * store.sqlite.js — SQLite backend (durable, atomic, concurrency-safe).
 *
 * Enable with: STORE=sqlite npm start   (needs: npm i better-sqlite3)
 *
 * Implements the exact same interface as store.json.js. Records are kept in a
 * single generic table (id, collection, data JSON, timestamps) so the route
 * layer is unchanged and you keep the flexible record shapes. Settings live in
 * their own single-row table.
 */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

let Database;
try {
  Database = require('better-sqlite3');
} catch {
  throw new Error(
    'STORE=sqlite requires better-sqlite3. Run: npm install better-sqlite3'
  );
}

const DB_FILE = process.env.SQLITE_FILE || path.join(__dirname, 'data', 'onward.db');
fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });

const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL'); // safe concurrent reads/writes

db.exec(`
  CREATE TABLE IF NOT EXISTS records (
    id         TEXT PRIMARY KEY,
    collection TEXT NOT NULL,
    data       TEXT NOT NULL,
    createdAt  TEXT NOT NULL,
    updatedAt  TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_records_collection ON records(collection);
  CREATE TABLE IF NOT EXISTS settings (
    id   TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );
`);

const now = () => new Date().toISOString();
const newId = () => crypto.randomUUID();
const hydrate = (row) =>
  row ? { ...JSON.parse(row.data), id: row.id, createdAt: row.createdAt, updatedAt: row.updatedAt } : null;

const stmt = {
  listByCol: db.prepare('SELECT * FROM records WHERE collection = ? ORDER BY createdAt'),
  getById: db.prepare('SELECT * FROM records WHERE collection = ? AND id = ?'),
  insert: db.prepare(
    'INSERT INTO records (id, collection, data, createdAt, updatedAt) VALUES (@id, @collection, @data, @createdAt, @updatedAt)'
  ),
  update: db.prepare('UPDATE records SET data = @data, updatedAt = @updatedAt WHERE collection = @collection AND id = @id'),
  remove: db.prepare('DELETE FROM records WHERE collection = ? AND id = ?'),
  getSettings: db.prepare("SELECT data FROM settings WHERE id = 'singleton'"),
  upsertSettings: db.prepare(
    "INSERT INTO settings (id, data) VALUES ('singleton', @data) ON CONFLICT(id) DO UPDATE SET data = @data"
  ),
};

module.exports = {
  list(collection) {
    return stmt.listByCol.all(collection).map(hydrate);
  },

  get(collection, id) {
    return hydrate(stmt.getById.get(collection, id));
  },

  insert(collection, data) {
    const record = { id: newId(), ...data, createdAt: now(), updatedAt: now() };
    const { id, createdAt, updatedAt, ...rest } = record;
    stmt.insert.run({ id, collection, data: JSON.stringify(rest), createdAt, updatedAt });
    return record;
  },

  update(collection, id, patch) {
    const existing = this.get(collection, id);
    if (!existing) return null;
    const merged = { ...existing, ...patch, id, updatedAt: now() };
    const { id: _i, createdAt, updatedAt, ...rest } = merged;
    stmt.update.run({ collection, id, data: JSON.stringify(rest), updatedAt });
    return merged;
  },

  remove(collection, id) {
    return stmt.remove.run(collection, id).changes > 0;
  },

  getSettings() {
    const row = stmt.getSettings.get();
    return row ? JSON.parse(row.data) : {};
  },

  saveSettings(patch) {
    const merged = { ...this.getSettings(), ...patch, updatedAt: now() };
    stmt.upsertSettings.run({ data: JSON.stringify(merged) });
    return merged;
  },

  findUser(username) {
    return this.list('users').find((u) => u.username === username) || null;
  },

  insertUser(user) {
    return this.insert('users', user);
  },
};
