# Frontend integration — `onward_com.html`

## Add this (2 lines)

Place these just before `</body>`, **after** the page's own big `<script>`
block (so `renderGameCard` already exists when the adapter reuses it):

```html
<script>window.ONWARD_API_BASE='http://localhost:4000/api';</script>
<script src="onward-api.js"></script>
```

Copy `onward-api.js` next to `onward_com.html` (or point the `src` at wherever
you host it). When you deploy, change `ONWARD_API_BASE` to your live API URL.

## What it replaces

On load (after the page's own `init()` runs), the adapter fetches from the API
and rebuilds these existing sections in place:

| Section | DOM hook it fills | API call |
|---|---|---|
| Popular games | `#game-grid` | `/games?enabled=1` (hot/jackpot first) |
| Slots | `#slots-grid` (+ `#slot-count`) | games where `category=slots` |
| Fish games | `#fish-grid` | games where `category=fishing` |
| Promo banners | `#legox-banner-autoscroll-1010` | `/banners?active=1` |
| Promotions | `#promo-grid-home`, `#promo-bonus-grid` | `/promotions?active=1` |

It reuses your existing `renderGameCard()` so cards look identical, and routes
card clicks through the game's configured **Launch URL** (opens in a new tab).
If a game has no URL it falls back to the page's original `launchGame` modal.

## Behavior worth knowing

- **Categories:** the API uses `slots / live / sports / fishing / crash`. The
  adapter maps `fishing → fish` to match your fish grid's existing filter.
- **Disabled games / inactive or expired promos never arrive** — the server
  filters them out of the public endpoints.
- **Offline-safe:** if the API can't be reached, the adapter leaves your
  current hardcoded content exactly as-is, so the site keeps working. Check the
  browser console for `[onward-api] …` messages.

## Adding more category grids

To drive another grid (e.g. Live Casino), give it an `id` and add one line in
`loadGames()` of `onward-api.js`:

```js
fillGrid('your-live-grid-id', cards.filter(c => c.cat === 'live'));
```
