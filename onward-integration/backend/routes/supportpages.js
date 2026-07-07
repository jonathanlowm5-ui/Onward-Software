/*
 * routes/supportpages.js — the footer support content (Help Center, Terms of
 * Service, Privacy Policy, Responsible Gaming, Contact Us) plus the Live Chat
 * link. Fully admin-editable; the player site renders whatever is saved here.
 *
 * GET /api/support-pages          (public) -> { pages, liveChatUrl }
 * PUT /api/support-pages          (admin, settings.manage) -> merge + save
 *
 * Stored in app_settings (settings.supportPages / supportLiveChatUrl).
 */
const fs = require('fs');
const path = require('path');
const express = require('express');
const store = require('../store');
const { requireAuth } = require('../auth');
const { requirePerm } = require('../permissions');

const router = express.Router();

const KEYS = ['help', 'terms', 'privacy', 'responsible', 'contact'];

// Operator-supplied documents shipped with the backend (see ../content).
function fileContent(name, fallback) {
  try { return fs.readFileSync(path.join(__dirname, '..', 'content', name), 'utf8'); } catch { return fallback; }
}

// Starter content so the pages are never blank — the operator replaces it.
const DEFAULTS = {
  help: {
    title: 'Help Center',
    content: 'Welcome to the Onward Help Center.\n\nDeposits: open the Deposit window, choose a payment method and amount — funds are credited after approval.\nWithdrawals: bind your bank account and complete KYC verification first, then request a withdrawal from your profile.\nBonuses: visit the Promotions page to see everything you can claim.\n\nStill stuck? Contact our support team via Live Chat or the Contact Us page.',
  },
  terms: {
    title: 'Terms and Conditions',
    content: fileContent('support-terms.txt',
      'By registering an account you confirm you are at least 18 years old and agree to play responsibly.'),
  },
  privacy: {
    title: 'Privacy Policy',
    content: 'We collect only the information needed to operate your account: registration details, transaction history and verification documents.\n\nYour data is never sold to third parties. Verification documents are stored securely and used solely for compliance.\n\nReplace this placeholder with your full Privacy Policy.',
  },
  responsible: {
    title: 'Responsible Gaming',
    content: fileContent('support-responsible.txt',
      'Gambling should be entertainment — never a way to make money or escape problems. Players must be 18 or older.'),
  },
  contact: {
    title: 'Contact Us',
    content: 'We are here 24/7.\n\n💬 Live Chat — fastest, via the footer link\n✉️ Email — support@onward.example\n✈️ Telegram — @OnwardSupport\n\nReplace this placeholder with your real contact channels.',
  },
};

const str = (v, n) => String(v == null ? '' : v).slice(0, n);

function current() {
  const s = store.getSettings();
  const saved = s.supportPages && typeof s.supportPages === 'object' ? s.supportPages : {};
  const pages = {};
  KEYS.forEach((k) => {
    const p = saved[k] && typeof saved[k] === 'object' ? saved[k] : {};
    pages[k] = {
      title: str(p.title, 120).trim() || DEFAULTS[k].title,
      content: str(p.content, 20000) || DEFAULTS[k].content,
    };
  });
  return { pages, liveChatUrl: str(s.supportLiveChatUrl, 500).trim() };
}

router.get('/', (req, res) => res.json(current()));

router.put('/', requireAuth, requirePerm('settings.manage'), (req, res) => {
  const b = req.body || {};
  const prev = current();
  const pages = { ...prev.pages };
  if (b.pages && typeof b.pages === 'object') {
    KEYS.forEach((k) => {
      if (b.pages[k] && typeof b.pages[k] === 'object') {
        pages[k] = {
          title: str(b.pages[k].title, 120).trim() || DEFAULTS[k].title,
          content: str(b.pages[k].content, 20000),
        };
      }
    });
  }
  const liveChatUrl = 'liveChatUrl' in b ? str(b.liveChatUrl, 500).trim() : prev.liveChatUrl;
  store.saveSettings({ supportPages: pages, supportLiveChatUrl: liveChatUrl });
  res.json({ pages, liveChatUrl });
});

module.exports = router;
