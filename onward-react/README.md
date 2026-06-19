# Onward — React (Vite) frontend

A React + Vite conversion of the original `onward_com.html` single-page casino
site. The UI is intentionally **pixel-identical** to the original: the complete
original stylesheet is preserved verbatim in `src/assets/styles/global.css`, and
the markup has been decomposed into React components without visual changes.

## Stack

- **React 18 + Vite** — fast dev server and build
- **React Router** — each original `showSection()` view is now a route
- **Context API** — `AuthContext` (Firebase-backed login/session) and
  `UIContext` (modals, sidebar, search, language, currency, toasts)
- **Axios** — single shared API instance (`src/services/api.js`) used by both
  the frontend and the admin panel, with auth-token handling and error
  normalisation
- **Firebase Auth** — customer sign-up / sign-in (mirrors the original config)

## Project structure

```
src/
├── assets/
│   ├── styles/global.css   Original stylesheet, preserved verbatim (pixel-perfect)
│   └── images.js           Base64 logo + inline images extracted from the markup
├── components/
│   ├── layout/             Header, Sidebar, Footer, Layout, Dropdowns
│   ├── casino/             GameCard, LiveCard, TopMatchCard, BigWinsStrip, LiveJackpots
│   ├── promotions/         PromoCard
│   ├── modals/             Modal, AuthModal, WithdrawModal, GameModal, BankSetupModal, DownloadModal
│   ├── wallet/             Wallet section pieces
│   ├── profile/            Profile section pieces
│   └── common/             Toaster
├── pages/                  One component per original view (Lobby, Slots, Sports, …)
├── hooks/                  useGames, useSectionNav, …
├── services/
│   ├── api.js              Axios instance + token handling
│   ├── firebase.js         Firebase Auth wiring
│   ├── gamesService.js     Games/banners/promotions (live API → bundled fallback)
│   ├── playersService.js   Wallet, deposits, withdrawals, KYC, bank accounts
│   └── data/gameData.js    Game catalogue + art extracted from the original
└── context/                AuthContext, UIContext
```

## Running

```bash
npm install
npm run dev      # http://localhost:5173  (proxies /api → http://localhost:4000)
npm run build
```

Set the API base and Firebase keys via `.env` (see `.env.example`). The dev
server proxies `/api` and `/uploads` to the `onward-integration` backend.

## API integration

`gamesService`/`playersService` call the same Express API as the admin panel
(`onward-integration/backend`). When the API is unreachable, the catalogue falls
back to the data bundled in `src/services/data/`, exactly like the original
`onward-api.js` "offline-safe" behaviour. Every request carries the auth token
(Firebase ID token for customers) via the Axios request interceptor.
