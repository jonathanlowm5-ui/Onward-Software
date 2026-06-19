# Onward — End‑to‑End Integration

Frontend (`onward-react`), Admin (`onward-admin`) and the Express backend
(`onward-integration/backend`) run as **one system** against a single shared
database. Every form, button, table and modal that touches data goes through a
centralized Axios service layer to the same `/api`.

## Workflow

```
   ┌──────────────────────────┐        ┌──────────────────────────┐
   │   onward-react (player)   │        │   onward-admin (staff)    │
   │  forms · modals · tables  │        │  CRUD · approvals · CMS   │
   └─────────────┬────────────┘        └─────────────┬────────────┘
                 │ services/*.js (Axios)              │ services/*.js (Axios)
                 │  Bearer: player JWT                │  Bearer: admin JWT
                 └────────────────┬───────────────────┘
                                  ▼
                     ┌─────────────────────────┐
                     │   API LAYER  (/api)      │   request: attach token
                     │   axios instance         │   response: normalize errors,
                     │   + interceptors         │            drop token on 401
                     └────────────┬────────────┘
                                  ▼
        ┌───────────────────────────────────────────────────────────┐
        │                 Express backend (one process)              │
        │                                                            │
        │  auth ──────────── admin login (JWT)                       │
        │  player ────────── register/login/me/wallet/deposit/       │
        │                    withdraw/transactions/KYC/bank/forgot   │
        │  agents ────────── apply/me/downline/commission · approve  │
        │  games ─────────── list (public) · CRUD · toggle · providers│
        │  banners ───────── list (public) · CRUD · toggle           │
        │  promotions ────── list (public) · CRUD · toggle           │
        │  transactions ──── ledger · approve(±balance)/reject       │
        │  kyc ───────────── submit · approve/reject(→player status) │
        │  notifications ─── create/send (frontend reads ?active=1)  │
        │  settings ──────── CMS / site config                       │
        │  upload ────────── image upload                            │
        └───────────────────────────┬───────────────────────────────┘
                                     ▼
                         ┌───────────────────────┐
                         │   store (db.json)      │   ONE database
                         │   players · games ·    │   (swap to sqlite/postgres
                         │   transactions · kyc · │    via STORE env — same API)
                         │   banners · promos ·   │
                         │   notifications · ...  │
                         └───────────────────────┘
```

## Data synchronization (admin → frontend)

Both apps read/write the **same collections**, so admin changes surface on the
frontend on its next fetch:

| Admin action | Endpoint | Frontend effect |
|---|---|---|
| Disable a game | `PATCH /games/:id/toggle` | drops out of `GET /games?enabled=1` → gone from lobby/slots |
| Edit/add a banner | `/banners` CRUD | `GET /banners?active=1` |
| Edit/add a promotion | `/promotions` CRUD | Lobby "Hot Promotions" + Promotions page |
| Approve KYC | `PATCH /kyc/:id/approve` | writes `kyc_status` on the player → `GET /player/me` |
| Credit a wallet | `POST /players/:id/wallet/credit` | player balance via `GET /player/wallet` / `/player/me` |
| Approve a deposit/withdrawal | `PATCH /transactions/:id/approve` | adjusts balance; shows in `/player/transactions` |
| Send a notification | `POST /notifications/:id/send` | `GET /notifications?active=1` |

## Authentication

- **Players (frontend):** JWT. `POST /api/player/register` & `/login` return a
  token stored by the Axios layer; every player request carries it. 30‑day TTL.
- **Admin:** JWT. `POST /api/auth/login` (`admin` / `admin123`). 12‑h TTL.
- `requirePlayer` / `requireAuth` guard the respective write endpoints.

## Centralized API service layer

Each app has `src/services/api.js` (one Axios instance, base `import.meta.env.VITE_API_BASE`,
token interceptor, 401 handling, error normalization) and domain services on top:

- **Frontend:** `gamesService`, `playersService`, plus `AuthContext`.
- **Admin:** `authService, playerService, walletService, kycService, bannerService,
  promotionService, cmsService, gameService, notificationService, uploadService`.

## Running the full stack

```bash
# 1) backend  (seeds admin, 200-game catalogue, demo player on first boot)
cd "onward-integration/backend" && npm install && npm start        # :4000

# 2) frontend
cd onward-react && npm install && npm run dev                       # :5173  (proxies /api → :4000)

# 3) admin
cd onward-admin && npm install && npm run dev                       # :5174  (proxies /api → :4000)
```

Seeded logins: **admin** `admin / admin123` · **player** `player / player123`.

## Verified end‑to‑end

- Register via the frontend UI → player appears in the backend and in the admin
  All Players list (live).
- Admin credits a wallet → `GET /player/wallet` reflects the new balance.
- Admin approves KYC → `GET /player/me` shows `kyc_status: approved`.
- Deposit/withdraw from the frontend create real pending transactions the admin
  can approve (which moves the balance).
- 200‑game catalogue is served from the DB; disabling a game removes it from the
  frontend grids.

## Notes

- Player auth was migrated from Firebase to backend JWT so the system is fully
  self‑contained and testable end‑to‑end (the login/register UI is unchanged).
  `onward-react/src/services/firebase.js` remains but is no longer wired in.
- Services keep an offline‑safe fallback to bundled data **only** when the API is
  unreachable; with the backend running, all data is live from the DB.
