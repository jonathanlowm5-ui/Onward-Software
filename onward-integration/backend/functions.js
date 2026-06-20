/*
 * functions.js — Cloud Functions (2nd gen) entry point for the Onward API.
 *
 * Firebase Hosting rewrites `/api/**` to this function (see firebase.json), so
 * the customer frontend and admin panel call the same `/api` on their own
 * origin and the Express app handles it — no CORS, no separate API host.
 *
 * The whole Express app from server.js runs inside one HTTPS function. We point
 * uploads at a writable tmp dir (the deployment dir is read-only) and force the
 * Firestore store, then hold each request until the store cache + first-run
 * seed have finished loading.
 */
const path = require('path');
const os = require('os');

// Read-only deployment FS -> writable uploads in tmp (ephemeral on Functions).
process.env.UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(os.tmpdir(), 'onward-uploads');
// Always use Firestore when running on Cloud Functions.
process.env.STORE = process.env.STORE || 'firestore';
// This project's Firestore database is named "onward" (not the default).
process.env.FIRESTORE_DB = process.env.FIRESTORE_DB || 'onward';

const { onRequest } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');

setGlobalOptions({ region: process.env.FUNCTIONS_REGION || 'us-central1' });

const app = require('./server');

// IMPORTANT: the Firestore store keeps an in-memory cache PER INSTANCE (loaded
// once at cold start, written through on changes). With multiple instances each
// holds its own cache, so a write on one instance isn't visible to a read on
// another — e.g. a player registered on instance A returns 404 from instance B,
// and an admin wallet credit on A isn't seen by the player on B. Pinning to a
// single instance (with high request concurrency) makes that one cache the
// single source of truth, keeping reads and writes consistent. Fine for this
// scale; revisit with a shared cache / per-request Firestore reads to scale out.
exports.api = onRequest(
  { memory: '512MiB', timeoutSeconds: 60, concurrency: 80, maxInstances: 1 },
  async (req, res) => {
    // Hold the first cold-start requests until the catalogue is loaded/seeded.
    try {
      await app.whenSeeded;
    } catch {
      /* serve anyway; routes surface their own errors */
    }
    return app(req, res);
  }
);
