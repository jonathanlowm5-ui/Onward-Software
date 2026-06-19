# Deployment & production wiring

Everything below is configured with environment variables — copy
`backend/.env.example` to `backend/.env` and edit. Nothing in the route layer
changes.

---

## 1. Real credentials (no more `admin/admin123`)

The seeded login now comes from env, and there's a script to change it anytime.

```bash
# set at first run
JWT_SECRET="<long random string>" ADMIN_USERNAME=boss ADMIN_PASSWORD='S3cret!' npm start

# or change/add an admin later (works with any STORE backend)
npm run set-admin boss 'NewS3cret!'
```

- `JWT_SECRET` **must** be a long random value in production (tokens are signed
  with it). Generate one: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
- If `ADMIN_PASSWORD` is unset, it falls back to `admin123` for local dev only —
  the startup log warns you when that happens.

---

## 2. Real database (swap the file store for SQLite or Postgres)

Pick a backend with the `STORE` env var. The route layer is identical for all
three — only `store.js` decides which file to load.

| `STORE` | Needs | Use when |
|---|---|---|
| `json` (default) | nothing | local dev, demos |
| `sqlite` | `npm i better-sqlite3` | single-server production, durable + atomic |
| `postgres` | `npm i pg` + `DATABASE_URL` | managed/cloud DB, multiple instances |

```bash
# SQLite
npm install better-sqlite3
STORE=sqlite npm start            # data lives in backend/data/onward.db

# Postgres
npm install pg
STORE=postgres DATABASE_URL="postgres://user:pass@host:5432/onward" npm start
```

The tables are created automatically on first run. Your existing JSON data
isn't migrated automatically — if you've been running on `json` and want to
move, re-import from the aggregator or re-enter content (or write a short
one-off script that reads `data/db.json` and calls `store.insert(...)` against
the new backend).

---

## 3. Connect a real game aggregator

Today the aggregator runs against a built-in **mock** so the whole flow works
offline. To connect your real provider:

1. **Configure the connection** in the admin → **⚙ API → API Configuration**:
   Base URL, API Key, API Secret, Environment. These are what the provider
   adapter reads.

2. **Switch the provider** and fill in two functions:
   ```bash
   AGGREGATOR=generic npm start
   ```
   Open `backend/providers/generic.js` and replace the two `TODO` blocks:
   - **TODO #1 `listGames`** — your provider's catalog endpoint + field names.
   - **TODO #2 `getLaunchUrl`** — your provider's launch/session endpoint.

   The HTTP plumbing, request signing scaffold, category mapping, storage,
   import route, frontend launch, and admin UI are all already done — these two
   functions are the only provider-specific code.

3. **Import the catalog**: in the admin Content Manager → Games → **⤓ Import**.
   It upserts by `externalId` (re-importing updates, never duplicates).

4. **Launching**: when a player clicks a game, the frontend calls
   `GET /api/aggregator/launch/:id?player=<id>`, which asks the provider for a
   fresh session URL. Games without an `externalId` just use the static Launch
   URL you typed in the admin.

> Replace `player=guest` in `frontend/onward-api.js` with your real logged-in
> player id once your site has player sessions, so launches are tied to the
> right account/wallet.

---

## 4. Hosting checklist

- [ ] Put the API behind **HTTPS** (a reverse proxy like Nginx/Caddy, or your
      platform's TLS).
- [ ] Set `JWT_SECRET` and a strong admin password.
- [ ] Lock down **CORS**: in `server.js` replace `cors({ origin: true })` with
      your real admin + site origins.
- [ ] Point both `window.ONWARD_API_BASE` values (in `onward_com.html` and
      `Onward_Admin.html`) at the deployed API URL.
- [ ] Choose a `STORE` and provision the database; back it up.
- [ ] For uploaded images at scale, swap `routes/upload.js` disk storage for
      S3/Cloud Storage and return the public URL (the rest is unchanged).
- [ ] Run the API under a process manager (`pm2`, `systemd`, or a container) so
      it restarts on crash/reboot.

A typical small deployment: one VPS running the Node API under `pm2` + Nginx
for HTTPS, `STORE=sqlite` (or a managed Postgres), and the two HTML files served
as static assets pointing at `https://api.yourdomain.com/api`.
