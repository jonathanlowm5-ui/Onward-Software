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

const { onRequest } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');

setGlobalOptions({ region: process.env.FUNCTIONS_REGION || 'us-central1', maxInstances: 10 });

const app = require('./server');

exports.api = onRequest(
  { memory: '512MiB', timeoutSeconds: 60, concurrency: 80 },
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
