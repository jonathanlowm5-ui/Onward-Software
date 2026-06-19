# Deploying Onward to Firebase

This deploys the **whole stack** to the Firebase project `onwards-61e6c`:

| Piece | Firebase service | URL |
|---|---|---|
| Customer frontend (`onward-react`) | Hosting (default site) | `https://onwards-61e6c.web.app` |
| Admin panel (`onward-admin`) | Hosting (second site) | `https://onwards-61e6c-admin.web.app` |
| Backend API (`onward-integration/backend`) | Cloud Functions (2nd gen) | reached at `/api/**` on both sites via Hosting rewrites |
| Database | Cloud Firestore | (server-side only) |

The Express app runs unchanged inside one HTTPS Function; Hosting rewrites
`/api/**` to it, so the apps call `/api` on their own origin (no CORS). The
JSON file store is swapped for Firestore via `STORE=firestore` (forced in
`functions.js`).

---

## One-time prerequisites (you must do these in the Firebase console)

1. **Upgrade to the Blaze plan.** Cloud Functions and Firestore require
   pay-as-you-go billing. Console → ⚙ → *Usage and billing* → *Modify plan* →
   **Blaze**. (At this traffic level it normally stays within the free tier, but
   a card is required.)

2. **Create the Firestore database.** Console → *Build → Firestore Database* →
   *Create database* → **Native mode** → pick a location (e.g. `nam5` /
   `us-central`). No collections needed — the API seeds itself on first run.

3. **Get a deploy token.** On your own computer (where you can open a browser):
   ```bash
   npm install -g firebase-tools
   firebase login:ci
   ```
   Copy the token it prints (starts with `1//`). **Paste it to me** and I'll run
   the deploy from here, or run it yourself (below).

---

## Deploy

From the repo root, with the token exported:

```bash
export FIREBASE_TOKEN='1//your-token-here'
./firebase-deploy.sh
```

The script builds both frontends, creates the admin Hosting site if needed,
binds the Hosting targets, and deploys Firestore rules + Functions + Hosting.

---

## Production secrets (recommended before going live)

By default the admin login is `admin / admin123` and the JWT secret is a
placeholder. Override them by creating `onward-integration/backend/.env`
(Firebase auto-loads it into the Function at deploy time):

```dotenv
JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))">
ADMIN_USERNAME=youradmin
ADMIN_PASSWORD=a-strong-password
```

This file is git-ignored. (These are seeded only on the **first** deploy against
an empty database; to change the admin password later, redeploy after clearing
the `users` records or add a new admin.) For stricter handling, use Google
Secret Manager via `firebase functions:secrets:set`.

---

## Notes & known limitations

- **Player auth** uses the backend JWT system (not Firebase Auth), so no extra
  Firebase Auth setup is required. The legacy `firebase.js` web config in
  `onward-react` is unused.
- **Image uploads** (`POST /api/upload`) write to the Function's temp dir, which
  is ephemeral on Cloud Functions — uploaded files won't persist across cold
  starts. For durable images, switch `routes/upload.js` to Firebase Storage.
  (Banners/promos that use external image URLs are unaffected.)
- **Cold starts** load the full record set into memory once per instance. Fine
  for this catalogue size; set `minInstances` in `functions.js` if you want to
  avoid the first-request delay.
- The default deploy region is `us-central1` (see `functions.js` and the
  rewrites in `firebase.json`). Change both together if you want another region.
