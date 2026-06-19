/*
 * routes/settings.js — the "Settings -> API Configuration" page.
 *
 * GET  /api/settings   (admin)  -> { baseUrl, apiKey, environment, apiSecretSet }
 * PUT  /api/settings   (admin)  -> save baseUrl, apiKey, apiSecret, environment
 *
 * The secret is never sent back to the browser; the response only reports
 * whether one is stored (apiSecretSet).
 */
const express = require('express');
const store = require('../store');
const { requireAuth } = require('../auth');

const router = express.Router();
const ENVIRONMENTS = ['development', 'production'];

function publicView(s) {
  return {
    baseUrl: s.baseUrl || '',
    apiKey: s.apiKey || '',
    environment: ENVIRONMENTS.includes(s.environment) ? s.environment : 'development',
    apiSecretSet: !!s.apiSecret,
    updatedAt: s.updatedAt || null,
  };
}

router.get('/', requireAuth, (req, res) => {
  res.json(publicView(store.getSettings()));
});

router.put('/', requireAuth, (req, res) => {
  const patch = {};
  if (req.body.baseUrl !== undefined) patch.baseUrl = String(req.body.baseUrl).trim();
  if (req.body.apiKey !== undefined) patch.apiKey = String(req.body.apiKey).trim();
  if (req.body.environment !== undefined)
    patch.environment = ENVIRONMENTS.includes(req.body.environment)
      ? req.body.environment
      : 'development';
  // Only overwrite the secret when a non-empty value is supplied.
  if (req.body.apiSecret) patch.apiSecret = String(req.body.apiSecret);
  res.json(publicView(store.saveSettings(patch)));
});

module.exports = router;
