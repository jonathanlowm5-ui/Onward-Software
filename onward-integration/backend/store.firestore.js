/*
 * store.firestore.js — Cloud Firestore backend (for Firebase / Cloud Functions).
 *
 * Enable with: STORE=firestore
 * Needs:       firebase-admin (auto-initialised with the function's default
 *              service-account credentials when running on Cloud Functions).
 *
 * Same SYNCHRONOUS interface as the other stores (list / get / insert / update /
 * remove / getSettings / saveSettings / findUser / insertUser), backed by an
 * in-memory cache that is loaded once at boot and written through to Firestore
 * on every change. This keeps the route layer unchanged and means seed.js's
 * "is this collection empty?" checks hit the cache (free) instead of Firestore.
 *
 * Callers that must wait for the cache (the Cloud Function entry, the seeder)
 * await the exported `whenReady` promise first.
 *
 * Storage model: one Firestore collection (`records`) holds every app record as
 * { collection, data, createdAt, updatedAt }; app config lives in a single
 * `app_settings/singleton` document. All access goes through the Admin SDK, so
 * client-side Firestore rules stay locked down (see firestore.rules).
 */
const crypto = require('crypto');
const admin = require('firebase-admin');

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
try {
  // Records carry optional fields; never throw on an undefined value.
  db.settings({ ignoreUndefinedProperties: true });
} catch {
  /* settings can only be set once; ignore if already initialised */
}

const RECORDS = process.env.FIRESTORE_RECORDS || 'records';
const SETTINGS_DOC = db.collection('app_settings').doc('singleton');

const now = () => new Date().toISOString();
const newId = () => crypto.randomUUID();

const cache = { records: [], settings: {} };
let ready = false;

const whenReady = (async function init() {
  const snap = await db.collection(RECORDS).get();
  cache.records = snap.docs.map((d) => {
    const row = d.data() || {};
    return {
      ...(row.data || {}),
      id: d.id,
      collection: row.collection,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  });
  const s = await SETTINGS_DOC.get();
  cache.settings = s.exists ? s.data() || {} : {};
  ready = true;
  console.log('[store] firestore ready,', cache.records.length, 'records');
})();
whenReady.catch((e) => console.error('[store] firestore init failed:', e.message));

function ensure() {
  if (!ready) throw new Error('Database not ready yet — retry in a moment');
}
const docRef = (id) => db.collection(RECORDS).doc(id);

module.exports = {
  whenReady,

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
    docRef(id)
      .set({ collection, data: rest, createdAt, updatedAt })
      .catch((e) => console.error('[store] insert', e.message));
    return record;
  },

  update(collection, id, patch) {
    ensure();
    const i = cache.records.findIndex((x) => x.collection === collection && x.id === id);
    if (i === -1) return null;
    cache.records[i] = { ...cache.records[i], ...patch, id, collection, updatedAt: now() };
    const { collection: _c, id: _i, createdAt, updatedAt, ...rest } = cache.records[i];
    docRef(id)
      .set({ collection, data: rest, createdAt, updatedAt })
      .catch((e) => console.error('[store] update', e.message));
    const { collection: _c2, ...out } = cache.records[i];
    return out;
  },

  remove(collection, id) {
    ensure();
    const i = cache.records.findIndex((x) => x.collection === collection && x.id === id);
    if (i === -1) return false;
    cache.records.splice(i, 1);
    docRef(id).delete().catch((e) => console.error('[store] remove', e.message));
    return true;
  },

  getSettings() {
    ensure();
    return { ...cache.settings };
  },

  saveSettings(patch) {
    ensure();
    cache.settings = { ...cache.settings, ...patch, updatedAt: now() };
    SETTINGS_DOC.set(cache.settings, { merge: true }).catch((e) =>
      console.error('[store] settings', e.message)
    );
    return { ...cache.settings };
  },

  findUser(username) {
    return this.list('users').find((u) => u.username === username) || null;
  },

  insertUser(user) {
    return this.insert('users', user);
  },
};
