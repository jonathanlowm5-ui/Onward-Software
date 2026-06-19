# Onward — Full Stack (frontend + admin + backend)

Three apps, one shared database. See `INTEGRATION.md` for the architecture and
workflow diagram.

```
onward-integration/backend   Express API + shared DB   (port 4000)
onward-react                 Customer frontend (Vite)   (port 5173)
onward-admin                 Admin panel (Vite)         (port 5174)
```

## Quick start

Open three terminals (or run `./start-all.sh` on Linux/macOS):

```bash
# 1) Backend — seeds admin, a 200-game catalogue and a demo player on first boot
cd onward-integration/backend
npm install
npm start                      # http://localhost:4000

# 2) Frontend
cd onward-react
npm install
npm run dev                    # http://localhost:5173  (proxies /api -> 4000)

# 3) Admin
cd onward-admin
npm install
npm run dev                    # http://localhost:5174  (proxies /api -> 4000)
```

### Seeded logins
- **Admin:** `admin` / `admin123`
- **Player:** `player` / `player123`

### Try the sync
1. Register a new player on the frontend (Join Now) → see it in Admin → All Players.
2. In the admin, credit that player's wallet → the frontend balance updates.
3. Approve the player's KYC in the admin → the player's profile status changes.
4. Disable a game in Admin → Games → it disappears from the frontend lobby.

## Production build

```bash
cd onward-react && npm run build     # -> dist/
cd onward-admin && npm run build     # -> dist/
```

Serve each `dist/` behind your web server and point `VITE_API_BASE` at the live
API (see each app's `.env.example`). The backend can swap `db.json` for SQLite or
Postgres via the `STORE` env var (see `onward-integration/backend/store.js`).
