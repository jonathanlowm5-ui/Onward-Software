/*
 * store.postgres.js — PostgreSQL backend (for managed/cloud databases).
 *
 * Enable with: STORE=postgres DATABASE_URL=postgres://user:pass@host/db npm start
 * Needs:       npm install pg
 *
 * Same interface as the other stores. Uses one table with a JSONB column so
 * record shapes stay flexible and the route layer is unchanged. The table is
 * created on first run.
 *
 * NOTE: this module exports the methods synchronously to match the other
 * backends, backed by a connection pool. Schema setup runs once at startup.
 * For very high write volume you'd model proper columns + indexes per table;
 * this generic shape is fine for an admin-driven catalog.
 */
const crypto = require('crypto');

let Pool;
try {
  ({ Pool } = require('pg'));
} catch {
  throw new Error('STORE=postgres requires pg. Run: npm install pg');
}
if (!process.env.DATABASE_URL) {
  throw new Error('STORE=postgres requires DATABASE_URL to be set');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

const now = () => new Date().toISOString();
const newId = () => crypto.randomUUID();

// A tiny synchronous-looking layer over async pg. We keep an in-memory cache
// that is loaded once at boot and written through on every change, so the
// store methods can stay synchronous like the other backends. For a fully
// async design, convert routes to await — but this keeps drop-in parity.
const cache = { records: [], settings: {} };
let ready = false;

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS records (
      id         TEXT PRIMARY KEY,
      collection TEXT NOT NULL,
      data       JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_records_collection ON records(collection);
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL
    );
  `);
  const r = await pool.query('SELECT id, collection, data, created_at, updated_at FROM records');
  cache.records = r.rows.map((row) => ({
    ...row.data,
    id: row.id,
    collection: row.collection,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
  const s = await pool.query("SELECT data FROM settings WHERE id = 'singleton'");
  cache.settings = s.rows[0] ? s.rows[0].data : {};
  ready = true;
  console.log('[store] postgres ready,', cache.records.length, 'records');
}
init().catch((e) => {
  console.error('[store] postgres init failed:', e.message);
  process.exit(1);
});

function ensure() {
  if (!ready) throw new Error('Database not ready yet — retry in a moment');
}

module.exports = {
  list(collection) {
    ensure();
    return cache.records
      .filter((r) => r.collection === collection)
      .map(({ collection: _c, ...rest }) => rest);
  },
  get(collection, id) {
    ensure();
    const r = cache.records.find((x) => x.collection === collection && x.id === id);
    if (!r) return null;
    const { collection: _c, ...rest } = r;
    return rest;
  },
  insert(collection, data) {
    ensure();
    const record = { id: newId(), ...data, createdAt: now(), updatedAt: now() };
    cache.records.push({ ...record, collection });
    const { id, createdAt, updatedAt, ...rest } = record;
    pool.query(
      'INSERT INTO records (id, collection, data, created_at, updated_at) VALUES ($1,$2,$3,$4,$5)',
      [id, collection, rest, createdAt, updatedAt]
    ).catch((e) => console.error('[store] insert', e.message));
    return record;
  },
  update(collection, id, patch) {
    ensure();
    const i = cache.records.findIndex((x) => x.collection === collection && x.id === id);
    if (i === -1) return null;
    cache.records[i] = { ...cache.records[i], ...patch, id, collection, updatedAt: now() };
    const { collection: _c, id: _i, createdAt, updatedAt, ...rest } = cache.records[i];
    pool.query('UPDATE records SET data=$1, updated_at=$2 WHERE id=$3', [rest, updatedAt, id])
      .catch((e) => console.error('[store] update', e.message));
    const { collection: _c2, ...out } = cache.records[i];
    return out;
  },
  remove(collection, id) {
    ensure();
    const i = cache.records.findIndex((x) => x.collection === collection && x.id === id);
    if (i === -1) return false;
    cache.records.splice(i, 1);
    pool.query('DELETE FROM records WHERE id=$1', [id]).catch((e) => console.error('[store] remove', e.message));
    return true;
  },
  getSettings() {
    ensure();
    return { ...cache.settings };
  },
  saveSettings(patch) {
    ensure();
    cache.settings = { ...cache.settings, ...patch, updatedAt: now() };
    pool.query(
      "INSERT INTO settings (id, data) VALUES ('singleton',$1) ON CONFLICT (id) DO UPDATE SET data=$1",
      [cache.settings]
    ).catch((e) => console.error('[store] settings', e.message));
    return { ...cache.settings };
  },
  findUser(username) {
    return this.list('users').find((u) => u.username === username) || null;
  },
  insertUser(user) {
    return this.insert('users', user);
  },
};
