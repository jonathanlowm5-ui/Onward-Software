# Admin integration — `Onward_Admin.html`

## Add this (2 lines)

Place just before `</body>`:

```html
<script>window.ONWARD_API_BASE='http://localhost:4000/api';</script>
<script src="admin-api.js"></script>
```

Copy `admin-api.js` next to `Onward_Admin.html`.

## What you get immediately

A new **⚙ API** button appears in the top bar. It opens:

1. **API Configuration** — the requested Settings page:
   - API Base URL, API Key, API Secret, Environment (Development / Production).
   - Saved via `PUT /api/settings`. The secret is write-only (never shown back).

2. **Content Manager** — a working CRUD UI, styled with your admin's own
   tokens, for:
   - **Games:** name, provider, category (Slots / Live Casino / Sports /
     Fishing / Crash), Game/Launch URL, badge, display order, image upload,
     enable/disable, delete.
   - **Banners:** image upload, title, subtitle, redirect URL, sort order,
     active/inactive.
   - **Promotions:** image, title, description, start/end date, button text +
     link, status. Expired promos stop showing on the frontend automatically.

This means the admin can fully control the frontend **without editing the
existing 11k-line file** — the Content Manager writes to the same API the
frontend reads from.

First time you open it, sign in with `admin` / `admin123` (change in
`backend/seed.js`).

## Optional: wire your *existing* admin buttons to the API

You already have native modals (`openEditGame`, `openAddProv`, `openCreateProm`,
the banner editor). To make their **Save** buttons persist to the API, call the
`OnwardAPI` client from inside those functions. The client is global:

```js
// inside your existing "Add Game" save handler:
OnwardAPI.games.create({
  name:     document.querySelector('#gameNameInput').value,
  provider: document.querySelector('#gameProviderInput').value,
  category: document.querySelector('#gameCategorySelect').value, // slots|live|sports|fishing|crash
  launchUrl:document.querySelector('#gameUrlInput').value,
  order:    Number(document.querySelector('#gameOrderInput').value) || 0,
  enabled:  true,
}).then(() => toast('Game saved')).catch(e => toast(e.message));

// uploading an image first, then saving the returned URL:
OnwardAPI.upload(fileInput.files[0])
  .then(res => OnwardAPI.games.create({ name:'…', image: res.url }));
```

Your existing **Add Provider** modal already has the field IDs
`#apvName`, `#apvCat`, `#apvApi`, `#apvOn` — a provider maps cleanly onto a game
or onto provider metadata if you add a providers resource later.

Full client surface:

```js
OnwardAPI.auth.login(user, pass)        // -> stores token
OnwardAPI.games.list('?category=slots') // also .create/.update(id,…)/.remove(id)/.toggle(id)
OnwardAPI.banners.…                     // same methods
OnwardAPI.promotions.…                  // same methods
OnwardAPI.settings.get() / .save({…})
OnwardAPI.upload(file)                  // -> { url }
```

## Notes

- The launcher injects into `.tb-right` in the top bar; if that's missing it
  falls back to a floating button bottom-right.
- All panels use your admin's CSS variables (`--gold`, `--panel`, `--border`,
  …) so they match the dark theme.
- Token is stored in `localStorage` and expires after 12h; just sign in again.
