/*
 * routes/webdesign.js — front-end design settings edited on the admin's
 * Website Design page: sidebar logo, primary button colours, withdrawal-card
 * gradient and the VIP hero background. Applied live by the player app.
 *
 * GET /api/web-design          (public) -> saved design (or {} when unset)
 * PUT /api/web-design          (admin, settings.manage) -> save
 */
const express = require('express');
const store = require('../store');
const { requireAuth } = require('../auth');
const { requirePerm } = require('../permissions');

const router = express.Router();
const HEX = /^#[0-9a-fA-F]{3,8}$/;
const color = (v, fb) => (HEX.test(String(v || '')) ? v : fb);
const str = (v, n) => String(v == null ? '' : v).slice(0, n);

router.get('/', (req, res) => {
  const s = store.getSettings();
  res.json(s.webDesign && typeof s.webDesign === 'object' ? s.webDesign : {});
});

router.put('/', requireAuth, requirePerm('settings.manage'), (req, res) => {
  const b = req.body || {};
  const wd = {
    logo: {
      text: str(b.logo?.text, 30).trim(),
      emoji: str(b.logo?.emoji, 8).trim(),
      // Uploaded logo image URL (from /api/upload). When set, the player
      // sidebar shows this image instead of the emoji + text.
      img: str(b.logo?.img, 100000).trim(),
    },
    btnBg: color(b.btnBg, '#f4b223'),
    btnTx: color(b.btnTx, '#10131c'),
    withdraw: { c1: color(b.withdraw?.c1, '#1f4e79'), c2: color(b.withdraw?.c2, '#0e8a7a') },
    vip: { c1: color(b.vip?.c1, '#3a2410'), c2: color(b.vip?.c2, '#140d06'), ac: color(b.vip?.ac, '#e8a23d') },
  };
  store.saveSettings({ webDesign: wd });
  res.json(wd);
});

module.exports = router;
