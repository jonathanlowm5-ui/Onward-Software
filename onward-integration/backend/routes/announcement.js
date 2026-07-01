/*
 * routes/announcement.js — site-wide announcements for the player site.
 *
 * Two flavours, both admin-controlled and stored in app_settings.announcement:
 *   1. Ticker(s)  — scrolling marquee at the top of every page. Supports the
 *      legacy single message ({ enabled, text, level }) AND a list of messages
 *      (tickers: [{ id, text, level, enabled }]) so several can rotate at once.
 *   2. Pop-out(s) — modal shown over the site with an image + message that can
 *      be clicked through to a link (popouts: [{ id, enabled, title, message,
 *      image, mobileImage, link, ctaText }]).
 *
 * GET  /api/announcement   (public)                     -> full payload
 * PUT  /api/announcement   (admin) — MERGES the keys you send, so saving the
 *      emergency ticker never wipes the pop-outs and vice-versa.
 */
const express = require('express');
const store = require('../store');
const { requireAuth } = require('../auth');

const router = express.Router();
const LEVELS = ['info', 'warning', 'critical'];

const str = (v, n) => String(v == null ? '' : v).slice(0, n);
let seq = 0;
const newId = () => 'a' + Date.now().toString(36) + (seq++).toString(36);

function cleanTicker(t) {
  if (!t || typeof t !== 'object') return null;
  const text = str(t.text, 500).trim();
  if (!text) return null;
  return {
    id: str(t.id, 40) || newId(),
    text,
    level: LEVELS.includes(t.level) ? t.level : 'info',
    enabled: t.enabled == null ? true : !!t.enabled,
  };
}

const AUDIENCES = ['all', 'guest', 'member', 'vip'];

function cleanPopout(p) {
  if (!p || typeof p !== 'object') return null;
  const title = str(p.title, 160).trim();
  const message = str(p.message, 800).trim();
  const image = str(p.image, 5000).trim();
  // A pop-out needs at least an image or some text to be worth showing.
  if (!title && !message && !image) return null;
  return {
    id: str(p.id, 40) || newId(),
    enabled: p.enabled == null ? true : !!p.enabled,
    title,
    message,
    image,
    mobileImage: str(p.mobileImage, 5000).trim(),
    link: str(p.link, 2000).trim(),
    ctaText: str(p.ctaText, 60).trim(),
    audience: AUDIENCES.includes(p.audience) ? p.audience : 'all',
    start: str(p.start, 40).trim(), // datetime-local / ISO; empty = no start bound
    end: str(p.end, 40).trim(),     // empty = no end bound
  };
}

const cleanTickers = (a) => (Array.isArray(a) ? a.map(cleanTicker).filter(Boolean).slice(0, 30) : []);
const cleanPopouts = (a) => (Array.isArray(a) ? a.map(cleanPopout).filter(Boolean).slice(0, 30) : []);

function current() {
  const a = store.getSettings().announcement;
  if (!a || typeof a !== 'object') return { enabled: false, text: '', level: 'info', tickers: [], popouts: [] };
  return {
    enabled: !!a.enabled,
    text: String(a.text || ''),
    level: LEVELS.includes(a.level) ? a.level : 'info',
    tickers: cleanTickers(a.tickers),
    popouts: cleanPopouts(a.popouts),
  };
}

router.get('/', (req, res) => {
  res.json(current());
});

// Any logged-in admin can post/clear announcements (no elevated permission so
// an emergency notice can go out fast). Only the keys present in the body are
// updated; everything else is preserved.
router.put('/', requireAuth, (req, res) => {
  const b = req.body || {};
  const prev = current();
  const next = { ...prev };

  if ('enabled' in b) next.enabled = !!b.enabled;
  if ('text' in b) next.text = str(b.text, 500);
  if ('level' in b) next.level = LEVELS.includes(b.level) ? b.level : 'info';
  if ('tickers' in b) next.tickers = cleanTickers(b.tickers);
  if ('popouts' in b) next.popouts = cleanPopouts(b.popouts);

  store.saveSettings({ announcement: next, announcementUpdatedAt: new Date().toISOString() });
  res.json(next);
});

module.exports = router;
