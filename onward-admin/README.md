# Onward — Admin (React + Vite)

React conversion of `Onward_Admin.html`, preserving the exact UI (layout,
sidebar, header, tables, forms, colors, spacing, mobile design). The original
stylesheet is kept verbatim in `src/assets/styles/global.css`.

## Shared backend (admin ⇄ frontend)

The admin talks to the **same** backend API (`/api`) as the customer frontend
(`onward-react`). Both apps share one database, so any change made in the admin
is immediately reflected on the frontend:

- Admin updates a banner → frontend carousel updates
- Admin approves KYC → player profile KYC status updates
- Admin credits a wallet → frontend balance changes
- Admin disables a game → game disappears from the frontend grids

## Structure

```
src/
├── components/   Sidebar, Topbar, MobileNav, shared ui (Table, Badge, …)
├── pages/        One component per admin view (Dashboard, Kyc, AllPlayers, …)
├── services/     api.js + the reusable service layer (see below)
├── context/      AuthContext (admin session), UIContext (toast/theme/sidebar)
├── hooks/
├── layouts/      AdminLayout (shell: sidebar + topbar + content + mobile nav)
├── routes/       MENU-driven router (auto-loads converted pages)
└── assets/       global.css (verbatim) + extracted logo
```

## Service layer

`authService`, `playerService`, `walletService`, `kycService`, `bannerService`,
`promotionService`, `cmsService`, `gameService`, `notificationService` (+
`uploadService`). All built on the single shared Axios instance in
`services/api.js`, with admin JWT bearer-token handling.

## Running

```bash
npm install
npm run dev      # http://localhost:5174  (proxies /api → http://localhost:4000)
npm run build
```
