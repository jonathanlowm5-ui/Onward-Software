/*
 * store.firestore.js — Cloud Firestore backend (tidy, one collection per entity).
 *
 * Enable with: STORE=firestore
 *
 * Each app collection (players, bank_accounts, kyc, transactions,
 * login_history, game_history, games, banners, promotions, users) is its own
 * Firestore collection, and every record is a clean document with its fields at
 * the top level (id, username, playerCode, email, phone, balance, …) — easy to
 * read and query in the Firebase console. App config lives in
 * app_settings/singleton.
 *
 * Same SYNCHRONOUS interface as the other stores, backed by an in-memory cache
 * loaded once at boot and written through to Firestore on every change. With
 * the API pinned to a single instance (see functions.js) this cache is the
 * single source of truth. Callers that must wait for the cache await whenReady.
 *
 * On first boot it migrates any legacy data from the old single "records"
 * collection into the tidy per-entity collections (once), so existing
 * games/banners/promotions/admin survive the move.
 */
const crypto = require('crypto');
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

if (!admin.apps.length) admin.initializeApp();
const DB_ID = process.env.FIRESTORE_DB || 'onward';
const db = DB_ID && DB_ID !== '(default)' ? getFirestore(DB_ID) : getFirestore();
try { db.settings({ ignoreUndefinedProperties: true }); } catch { /* already set */ }

const SETTINGS_DOC = db.collection('app_settings').doc('singleton');
const COLLECTIONS = [
  'players', 'bank_accounts', 'kyc', 'transactions', 'login_history',
  'game_history', 'games', 'banners', 'promotions', 'users',
];

const now = () => new Date().toISOString();
const newId = () => crypto.randomUUID();

const cache = {};
COLLECTIONS.forEach((c) => { cache[c] = []; });
let settingsCache = {};
let ready = false;

const whenReady = (async function init() {
  const sSnap = await SETTINGS_DOC.get();
  settingsCache = sSnap.exists ? sSnap.data() || {} : {};

  // One-time migration from the legacy "records" collection (records held
  // { collection, data, createdAt, updatedAt }).
  if (!settingsCache.migratedToTidyV1) {
    try {
      const old = await db.collection('records').get();
      let batch = db.batch();
      let n = 0;
      for (const d of old.docs) {
        const row = d.data() || {};
        if (!row.collection) continue;
        batch.set(db.collection(row.collection).doc(d.id), {
          id: d.id, ...(row.data || {}), createdAt: row.createdAt, updatedAt: row.updatedAt,
        });
        if (++n % 400 === 0) { await batch.commit(); batch = db.batch(); }
      }
      if (n % 400 !== 0) await batch.commit();
      if (n) console.log(`[store] migrated ${n} legacy records into tidy collections`);
    } catch (e) {
      console.error('[store] migration skipped:', e.message);
    }
    settingsCache = { ...settingsCache, migratedToTidyV1: true };
    await SETTINGS_DOC.set(settingsCache, { merge: true });
  }

  await Promise.all(COLLECTIONS.map(async (col) => {
    const snap = await db.collection(col).get();
    cache[col] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }));
  ready = true;
  const total = COLLECTIONS.reduce((s, c) => s + cache[c].length, 0);
  console.log(`[store] firestore (tidy) ready — ${total} records across ${COLLECTIONS.length} collections`);
})();
whenReady.catch((e) => console.error('[store] firestore init failed:', e.message));

function ensure() { if (!ready) throw new Error('Database not ready yet — retry in a moment'); }
function col(name) { if (!cache[name]) cache[name] = []; return cache[name]; }
function ref(name, id) { return db.collection(name).doc(id); }

module.exports = {
  whenReady,

  list(collection) {
    ensure();
    return col(collection).map((r) => ({ ...r }));
  },

  get(collection, id) {
    ensure();
    const r = col(collection).find((x) => x.id === id);
    return r ? { ...r } : null;
  },

  insert(collection, data) {
    ensure();
    const record = { id: newId(), ...data, createdAt: now(), updatedAt: now() };
    col(collection).push(record);
    ref(collection, record.id).set(record).catch((e) => console.error('[store] insert', collection, e.message));
    return { ...record };
  },

  update(collection, id, patch) {
    ensure();
    const arr = col(collection);
    const i = arr.findIndex((x) => x.id === id);
    if (i === -1) return null;
    arr[i] = { ...arr[i], ...patch, id, updatedAt: now() };
    ref(collection, id).set(arr[i]).catch((e) => console.error('[store] update', collection, e.message));
    return { ...arr[i] };
  },

  remove(collection, id) {
    ensure();
    const arr = col(collection);
    const i = arr.findIndex((x) => x.id === id);
    if (i === -1) return false;
    arr.splice(i, 1);
    ref(collection, id).delete().catch((e) => console.error('[store] remove', collection, e.message));
    return true;
  },

  getSettings() {
    ensure();
    return { ...settingsCache };
  },

  saveSettings(patch) {
    ensure();
    settingsCache = { ...settingsCache, ...patch, updatedAt: now() };
    SETTINGS_DOC.set(settingsCache, { merge: true }).catch((e) => console.error('[store] settings', e.message));
    return { ...settingsCache };
  },

  findUser(username) {
    return this.list('users').find((u) => u.username === username) || null;
  },

  insertUser(user) {
    return this.insert('users', user);
  },
};
