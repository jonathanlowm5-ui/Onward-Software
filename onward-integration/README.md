# Onward — Admin ⇄ Frontend integration

This package connects your two HTML files so the **admin panel controls the
customer frontend dynamically**, with no manual HTML edits. It does that the
only way two separate web apps can share live data: through a small **shared
API with a database**.

```
Onward_Admin.html  ──(write, authenticated)──►  Node + Express API  ◄──(read, public)──  onward_com.html
                                                      │
                                                  database  +  /uploads (images)
```

Anything you add, edit, enable/disable, or reorder in the admin is saved to the
API. The frontend fetches from the same API on load, so changes appear on the
next refresh.

---

## What's included

```
onward-integration/
├── README.md           This file (overview + API contract)
├── DEPLOYMENT.md       Production wiring: credentials, database, aggregator, hosting
├── backend/            The shared API (Node + Express). Run this.
│   ├── server.js       Entry point, routes, CORS, static /uploads
│   ├── .env.example    All config knobs (copy to .env)
│   ├── store.js        Backend selector (json | sqlite | postgres)
│   ├── store.json.js   Default file store (zero setup)
│   ├── store.sqlite.js SQLite backend (durable; needs better-sqlite3)
│   ├── store.postgres.js Postgres backend (needs pg + DATABASE_URL)
│   ├── auth.js         JWT issue/verify + requireAuth middleware
│   ├── seed.js         First-run admin user (from env) + demo content
│   ├── scripts/set-admin.js   Create/reset the admin password
│   ├── providers/      Game-aggregator adapters (mock + generic template)
│   └── routes/         games · banners · promotions · settings · auth · upload · aggregator
├── frontend/
│   ├── onward-api.js   Drop-in for onward_com.html
│   └── INTEGRATION.md  Exactly what to add (2 lines)
└── admin/
    ├── admin-api.js    Drop-in for Onward_Admin.html (adds the ⚙ API button)
    └── INTEGRATION.md  Exactly what to add + how to wire existing save buttons
```

---

## Quick start

1. **Run the API** (Node 18+):
   ```bash
   cd backend
   npm install
   npm start            # -> Onward API listening on http://localhost:4000
   ```
   On first run it seeds an admin user (`admin` / `admin123`) and demo content.

2. **Wire the admin** — add before `</body>` in `Onward_Admin.html`:
   ```html
   <script>window.ONWARD_API_BASE='http://localhost:4000/api';</script>
   <script src="admin-api.js"></script>
   ```
   Open it, click **⚙ API** (top bar), sign in, and you get the **API
   Configuration** page plus a **Content Manager** for games, banners and
   promotions. (See `admin/INTEGRATION.md`.)

3. **Wire the frontend** — add before `</body>` in `onward_com.html`, *after*
   its own script:
   ```html
   <script>window.ONWARD_API_BASE='http://localhost:4000/api';</script>
   <script src="onward-api.js"></script>
   ```
   Reload — games, banners and promotions now come from the API. (See
   `frontend/INTEGRATION.md`.)

Add a game in the admin → refresh the frontend → it's there.

---

## API contract

`{base} = http://localhost:4000/api`. Write endpoints need
`Authorization: Bearer <token>` from `POST /auth/login`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/login` | – | `{username,password}` → `{token}` |
| GET | `/games?category=&enabled=1` | – | list games (frontend) |
| POST | `/games` | ✓ | add game |
| PUT | `/games/:id` | ✓ | edit game |
| PATCH | `/games/:id/toggle` | ✓ | enable / disable |
| DELETE | `/games/:id` | ✓ | delete game |
| GET | `/banners?active=1` | – | list banners (frontend) |
| POST/PUT/DELETE/PATCH | `/banners[/:id][/toggle]` | ✓ | banner CRUD |
| GET | `/promotions?active=1` | – | list live promos (expired auto-hidden) |
| POST/PUT/DELETE/PATCH | `/promotions[/:id][/toggle]` | ✓ | promo CRUD |
| GET / PUT | `/settings` | ✓ | API configuration |
| POST | `/upload` | ✓ | multipart image → `{url}` |
| GET | `/aggregator/status` | ✓ | which provider, configured? |
| POST | `/aggregator/import` | ✓ | pull provider catalog into games |
| GET | `/aggregator/launch/:id?player=` | – | resolve a live launch URL |
| POST | `/players/register` | – | frontend sign-up (creates a player) |
| GET | `/players` | ✓ | list registrations (no password hashes) |
| PATCH | `/players/:id/toggle` | ✓ | suspend / reactivate a player |
| DELETE | `/players/:id` | ✓ | remove a player |

**Data shapes**

```jsonc
// game
{ "name", "provider", "category": "slots|live|sports|fishing|crash",
  "icon", "badge": "hot|new|jackpot|", "color", "launchUrl",
  "image", "enabled": true, "order": 0 }

// banner
{ "image", "title", "subtitle", "redirectUrl", "active": true, "sortOrder": 0 }

// promotion  (frontend hides status!=active OR endDate in the past)
{ "image", "title", "description", "startDate", "endDate",
  "status": "active|inactive", "buttonText", "buttonLink" }

// settings (API Configuration page)
{ "baseUrl", "apiKey", "apiSecret"(write-only), "environment": "development|production" }
```

---

## Security & production

For real credentials, a real database (SQLite/Postgres), connecting an actual
game aggregator, and a hosting checklist, see **`DEPLOYMENT.md`**. In short:

- Set `JWT_SECRET` and `ADMIN_PASSWORD` via env (`backend/.env`); never ship the
  `admin123` default. Change the password anytime with `npm run set-admin`.
- The stored API secret is never returned to the browser (`apiSecretSet` only).
- Pick a database with `STORE=json|sqlite|postgres` — only `store.js` changes,
  routes don't.
- Connect a provider by setting `AGGREGATOR=generic` and filling in two
  functions in `providers/generic.js`.
- Lock down CORS in `server.js` to your real domains before going live.

## Troubleshooting

- Frontend still shows old content → the API was unreachable; `onward-api.js`
  intentionally keeps the built-in content as a fallback. Check the base URL
  and that the server is running (`/api/health`).
- `401` in admin → click **⚙ API** and sign in again (token expires after 12h).
- CORS error → confirm `ONWARD_API_BASE` matches the running server's origin.
