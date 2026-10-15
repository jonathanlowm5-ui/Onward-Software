/*
 * assets.js — resolve asset paths for display in the admin panel.
 *
 * Game icons (the heibao catalogue) are self-hosted ONLY on the player site
 * under /gicons/…. A root-relative "/gicons/…" src in the admin app resolves
 * against the admin host, which doesn't have those files, so the thumbnails
 * 404. Prefix them with the player-site origin so they load in the admin
 * (tournament / mission / giveaway game pickers, etc.).
 *
 * /uploads/… is served by the Cloud Function via a rewrite that exists on BOTH
 * hosting targets, so those are left untouched.
 */
export const PLAYER_SITE = 'https://onward-1590a.web.app';

export function gameImg(src) {
  const s = String(src || '').trim();
  if (!s) return '';
  if (s.startsWith('/gicons/')) return PLAYER_SITE + s;
  return s;
}

export default gameImg;
