/*
 * routes/marketing.js — the marketing campaign engine shared by SMS, Email,
 * Push and Ads. One campaign model + audience resolver + provider abstraction
 * (see ../marketing/adapters.js); each channel only differs in its adapter.
 *
 * Admin (requireAuth, writes need marketing.manage):
 *   GET/PUT  /api/marketing/providers            provider configs (secrets masked)
 *   POST     /api/marketing/providers/test       send a test message
 *   POST     /api/marketing/audience/preview     resolve filters -> count + sample
 *   GET/PUT  /api/marketing/audiences            saved audiences
 *   GET/POST /api/marketing/campaigns            list / create (draft|schedule|send)
 *   POST     /api/marketing/campaigns/:id/send   send now
 *   DELETE   /api/marketing/campaigns/:id
 *   GET/PUT  /api/marketing/automations          workflow rules
 *   GET/PUT  /api/marketing/ads/connectors       ad-platform connections
 *   GET/POST /api/marketing/ads/campaigns        ads campaigns + metrics
 *   PATCH    /api/marketing/ads/campaigns/:id    update metrics/budget
 *   GET      /api/marketing/summary              unified dashboard numbers
 *
 * Public (no auth):
 *   GET  /api/marketing/open/:cid/:pid           email open pixel
 *   GET  /api/marketing/click/:cid/:pid?u=       tracked click redirect
 *   GET  /api/marketing/unsub/:pid               unsubscribe
 *   POST /api/marketing/webhook/:channel         provider delivery callbacks
 *   GET  /api/marketing/tick                     process due jobs (poll/cron)
 */
const express = require('express');
const store = require('../store');
const { requireAuth } = require('../auth');
const { requirePerm } = require('../permissions');
const { ADAPTERS, sendWithFailover } = require('../marketing/adapters');
const { TRIGGERS, listAutomations } = require('../marketing/auto');

const router = express.Router();
const CHANNELS = ['sms', 'email', 'push'];
const str = (v, n) => String(v == null ? '' : v).slice(0, n);
let seq = 0;
const newId = (p) => p + Date.now().toString(36) + (seq++).toString(36);

// Public base URL used inside emails (tracking pixel, click redirects, unsub).
const publicApiBase = () => {
  const b = String(store.getSettings().publicBaseUrl || '').replace(/\/$/, '');
  return /^https:\/\//.test(b) ? b : 'https://onward-1590a.web.app/api';
};

/* ================= providers ================= */

const SECRET_RE = /key|secret|token|password|auth|sid/i;
const mask = (v) => (String(v).length > 4 ? '••••' + String(v).slice(-4) : '••••');

function providersRaw() {
  const s = store.getSettings().marketingProviders;
  const base = { sms: { list: [], activeId: '', backupId: '' }, email: { list: [], activeId: '', backupId: '' }, push: { list: [], activeId: '', backupId: '' } };
  if (!s || typeof s !== 'object') return base;
  CHANNELS.forEach((ch) => {
    if (s[ch] && typeof s[ch] === 'object') {
      base[ch] = {
        list: Array.isArray(s[ch].list) ? s[ch].list : [],
        activeId: str(s[ch].activeId, 40),
        backupId: str(s[ch].backupId, 40),
      };
    }
  });
  return base;
}
const maskProvider = (p) => ({
  ...p,
  config: Object.fromEntries(Object.entries(p.config || {}).map(([k, v]) => [k, SECRET_RE.test(k) && v ? mask(v) : v])),
});
const providerById = (ch, id) => providersRaw()[ch].list.find((p) => p.id === id) || null;
const activeProviders = (ch) => {
  const cfg = providersRaw()[ch];
  return { active: providerById(ch, cfg.activeId) || cfg.list[0] || null, backup: providerById(ch, cfg.backupId) };
};

router.get('/providers', requireAuth, (req, res) => {
  const raw = providersRaw();
  const out = {};
  CHANNELS.forEach((ch) => { out[ch] = { ...raw[ch], list: raw[ch].list.map(maskProvider) }; });
  res.json({ providers: out, adapters: Object.fromEntries(Object.entries(ADAPTERS).map(([k, a]) => [k, { channel: a.channel, label: a.label, fields: a.fields }])) });
});

router.put('/providers', requireAuth, requirePerm('marketing.manage'), (req, res) => {
  const prev = providersRaw();
  const b = req.body?.providers || {};
  const next = {};
  CHANNELS.forEach((ch) => {
    const incoming = b[ch] && typeof b[ch] === 'object' ? b[ch] : prev[ch];
    const list = (Array.isArray(incoming.list) ? incoming.list : []).slice(0, 20).map((p) => {
      const id = str(p.id, 40) || newId('pv');
      const old = providerById(ch, id);
      const config = {};
      Object.entries(p.config || {}).forEach(([k, v]) => {
        const val = str(v, 4000);
        // A masked value round-tripped from the UI keeps the stored secret.
        config[k] = val.startsWith('••••') && old ? (old.config?.[k] || '') : val;
      });
      return { id, type: ADAPTERS[p.type] ? p.type : 'smscustom', label: str(p.label, 80) || (ADAPTERS[p.type]?.label ?? p.type), config };
    });
    next[ch] = { list, activeId: str(incoming.activeId, 40), backupId: str(incoming.backupId, 40) };
  });
  store.saveSettings({ marketingProviders: next });
  const out = {};
  CHANNELS.forEach((ch) => { out[ch] = { ...next[ch], list: next[ch].list.map(maskProvider) }; });
  res.json({ providers: out });
});

router.post('/providers/test', requireAuth, requirePerm('marketing.manage'), async (req, res) => {
  const { channel, id, to } = req.body || {};
  if (!CHANNELS.includes(channel)) return res.status(400).json({ error: 'Unknown channel' });
  const p = providerById(channel, String(id || ''));
  if (!p) return res.status(404).json({ error: 'Provider not found' });
  const msg = {
    to: str(to, 200) || 'test@example.com',
    subject: 'Onward test message',
    text: 'This is a test message from the Onward marketing module. ✔',
    html: '<p>This is a <b>test message</b> from the Onward marketing module. ✔</p>',
    title: 'Onward test',
  };
  const r = await sendWithFailover(p, null, msg);
  store.insert('marketing_logs', { kind: 'test', channel, providerId: p.id, ok: r.ok, error: r.error || '', to: msg.to });
  res.json(r);
});

/* ================= audience ================= */

const num = (v) => { const n = Number(String(v == null ? '' : v).replace(/[^0-9.]/g, '')); return Number.isFinite(n) ? n : 0; };
const dayMs = 86400000;

// Resolve an audience filter object into player records. AND across filters.
function resolveAudience(f = {}) {
  let players = store.list('players').filter((p) => p.status !== 'blocked');
  const eq = (a, b) => String(a || '').toLowerCase() === String(b || '').toLowerCase();

  if (f.country) players = players.filter((p) => eq(p.country || p.registrationCountry, f.country));
  if (f.currency) players = players.filter((p) => eq(p.currency, f.currency));
  if (f.vipMin !== '' && f.vipMin != null) players = players.filter((p) => Number(p.vipLevel || 0) >= Number(f.vipMin));
  if (f.language) players = players.filter((p) => eq(p.language, f.language));
  if (f.registeredFrom) players = players.filter((p) => (p.createdAt || '') >= f.registeredFrom);
  if (f.registeredTo) players = players.filter((p) => (p.createdAt || '') <= f.registeredTo + 'T23:59:59');
  if (f.agentCode) players = players.filter((p) => eq(p.referralCode, f.agentCode));
  if (f.activity === 'active') players = players.filter((p) => Date.parse(p.lastLoginAt || 0) >= Date.now() - 7 * dayMs);
  if (f.activity === 'inactive30') players = players.filter((p) => !p.lastLoginAt || Date.parse(p.lastLoginAt) < Date.now() - 30 * dayMs);
  if (Number(f.minDeposits) > 0 || Number(num(f.minDepositAmount)) > 0) {
    const byPlayer = {};
    store.list('transactions').forEach((t) => {
      if (t.type === 'deposit' && t.status === 'approved') {
        const k = String(t.playerId);
        byPlayer[k] = byPlayer[k] || { n: 0, sum: 0 };
        byPlayer[k].n += 1; byPlayer[k].sum += Number(t.amount || 0);
      }
    });
    if (Number(f.minDeposits) > 0) players = players.filter((p) => (byPlayer[String(p.id)]?.n || 0) >= Number(f.minDeposits));
    if (num(f.minDepositAmount) > 0) players = players.filter((p) => (byPlayer[String(p.id)]?.sum || 0) >= num(f.minDepositAmount));
  }
  if (Array.isArray(f.usernames) && f.usernames.length) {
    const set = new Set(f.usernames.map((u) => String(u).toLowerCase()));
    players = players.filter((p) => set.has((p.username || '').toLowerCase()) || set.has((p.email || '').toLowerCase()) || set.has((p.playerCode || '').toLowerCase()));
  }
  if (Array.isArray(f.exclude) && f.exclude.length) {
    const set = new Set(f.exclude.map((u) => String(u).toLowerCase()));
    players = players.filter((p) => !set.has((p.username || '').toLowerCase()) && !set.has((p.email || '').toLowerCase()) && !set.has((p.playerCode || '').toLowerCase()));
  }
  // Marketing opt-out is always honoured.
  players = players.filter((p) => !p.marketingOptOut);
  return players;
}

router.post('/audience/preview', requireAuth, (req, res) => {
  const players = resolveAudience(req.body?.filters || {});
  res.json({
    count: players.length,
    sample: players.slice(0, 8).map((p) => ({ username: p.username, email: p.email, phone: p.phone, country: p.country || p.registrationCountry, vip: p.vipLevel || 0 })),
  });
});

router.get('/audiences', requireAuth, (req, res) => {
  const s = store.getSettings();
  res.json(Array.isArray(s.marketingAudiences) ? s.marketingAudiences : []);
});
router.put('/audiences', requireAuth, requirePerm('marketing.manage'), (req, res) => {
  const items = (Array.isArray(req.body?.items) ? req.body.items : []).slice(0, 100)
    .map((a) => ({ id: str(a.id, 40) || newId('au'), name: str(a.name, 120) || 'Audience', filters: a.filters || {} }));
  store.saveSettings({ marketingAudiences: items });
  res.json(items);
});

/* ================= campaigns ================= */

function personalize(text, p, vars = {}) {
  const first = String(p.fullName || p.username || '').trim().split(/\s+/)[0] || 'Player';
  let out = String(text || '')
    .replaceAll('{{FirstName}}', first)
    .replaceAll('{{FullName}}', p.fullName || p.username || '')
    .replaceAll('{{Username}}', p.username || '')
    .replaceAll('{{PlayerCode}}', p.playerCode || '')
    .replaceAll('{{Balance}}', String(Number(p.balance || 0).toLocaleString()))
    .replaceAll('{{Currency}}', p.currency || 'PHP');
  Object.entries(vars).forEach(([k, v]) => { out = out.replaceAll(`{{${k}}}`, String(v)); });
  return out;
}

// Email tracking: rewrite links through the click redirect, add open pixel +
// unsubscribe footer.
function trackEmail(html, cid, pid) {
  const base = publicApiBase();
  let out = String(html || '').replace(/href="(https?:\/\/[^"]+)"/gi,
    (mm, url) => `href="${base}/marketing/click/${cid}/${pid}?u=${encodeURIComponent(url)}"`);
  out += `<img src="${base}/marketing/open/${cid}/${pid}" width="1" height="1" style="display:none" alt=""/>`;
  out += `<p style="font-size:11px;color:#8898b8;margin-top:24px">Don't want these emails? <a href="${base}/marketing/unsub/${pid}">Unsubscribe</a></p>`;
  return out;
}

const CAMPAIGN_LIMIT = 2000; // recipients per send run (rate-limit safety)

async function runCampaign(c) {
  const players = c.adhocRecipients?.length
    ? c.adhocRecipients.map((to) => ({ id: 'adhoc', username: to, phone: to, email: to, fullName: '', currency: 'PHP', balance: 0 }))
    : resolveAudience(c.filters || {});
  const targets = players.slice(0, CAMPAIGN_LIMIT);
  const { active, backup } = activeProviders(c.channel);
  const stats = { targeted: targets.length, sent: 0, failed: 0, failedOver: 0, opened: c.stats?.opened || 0, clicked: c.stats?.clicked || 0 };
  const errors = [];

  const isInapp = c.channel === 'push' && (active?.type === 'inapp' || !active);
  const bulkPush = c.channel === 'push' && !isInapp; // FCM topic / OneSignal segments = one call

  if (bulkPush) {
    const r = await sendWithFailover(active, backup, { to: 'all', title: c.subject, text: c.message, image: c.image, link: c.link });
    stats.sent = r.ok ? targets.length : 0;
    stats.failed = r.ok ? 0 : targets.length;
    if (!r.ok) errors.push(r.error);
    if (r.failedOver) stats.failedOver = targets.length;
  } else {
    for (const p of targets) {
      const to = c.channel === 'sms' ? (p.phone || '') : c.channel === 'email' ? (p.email || '') : String(p.id);
      if (!to) { stats.failed += 1; continue; }
      const text = personalize(c.message, p, c.vars);
      if (isInapp) {
        store.insert('player_messages', { playerId: p.id, icon: '📣', title: personalize(c.subject || '', p, c.vars), text, link: c.link || '', campaignId: c.id });
        stats.sent += 1;
        continue;
      }
      const msg = {
        to,
        subject: personalize(c.subject || '', p, c.vars),
        text,
        html: c.channel === 'email' ? trackEmail(personalize(c.html || c.message, p, c.vars), c.id, p.id) : undefined,
        title: personalize(c.subject || '', p, c.vars),
        image: c.image, link: c.link,
      };
      let r = await sendWithFailover(active, backup, msg);
      if (!r.ok) { await new Promise((ok) => setTimeout(ok, 300)); r = await sendWithFailover(active, backup, msg); } // one retry
      if (r.ok) { stats.sent += 1; if (r.failedOver) stats.failedOver += 1; }
      else { stats.failed += 1; if (errors.length < 5) errors.push(`${to}: ${r.error}`); }
      await new Promise((ok) => setTimeout(ok, 40)); // gentle rate limit
    }
  }

  const status = stats.sent > 0 ? 'sent' : 'failed';
  store.update('marketing_campaigns', c.id, { status, stats, errors, sentAt: new Date().toISOString() });
  store.insert('marketing_logs', { kind: 'campaign', campaignId: c.id, channel: c.channel, name: c.name, ...stats, errors });
  return { status, stats, errors };
}

router.get('/campaigns', requireAuth, (req, res) => {
  let rows = store.list('marketing_campaigns');
  if (req.query.channel) rows = rows.filter((c) => c.channel === req.query.channel);
  res.json(rows.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 200));
});

router.post('/campaigns', requireAuth, requirePerm('marketing.manage'), async (req, res) => {
  const b = req.body || {};
  if (!CHANNELS.includes(b.channel)) return res.status(400).json({ error: 'Unknown channel' });
  if (!str(b.name, 200).trim()) return res.status(400).json({ error: 'Campaign name is required' });
  const action = ['draft', 'schedule', 'send'].includes(b.action) ? b.action : 'draft';
  const c = store.insert('marketing_campaigns', {
    channel: b.channel,
    name: str(b.name, 200),
    subject: str(b.subject, 300),
    message: str(b.message, 5000),
    html: str(b.html, 100000),
    image: str(b.image, 2000),
    link: str(b.link, 2000),
    vars: b.vars && typeof b.vars === 'object' ? b.vars : {},
    filters: b.filters || {},
    adhocRecipients: Array.isArray(b.adhocRecipients) ? b.adhocRecipients.map((x) => str(x, 200)).filter(Boolean).slice(0, CAMPAIGN_LIMIT) : [],
    scheduleAt: action === 'schedule' ? str(b.scheduleAt, 40) : '',
    status: action === 'schedule' ? 'scheduled' : 'draft',
    stats: { targeted: 0, sent: 0, failed: 0, opened: 0, clicked: 0 },
  });
  if (action === 'send') {
    store.update('marketing_campaigns', c.id, { status: 'running' });
    const result = await runCampaign({ ...c, status: 'running' });
    return res.status(201).json({ ...store.get('marketing_campaigns', c.id), result });
  }
  res.status(201).json(c);
});

router.post('/campaigns/:id/send', requireAuth, requirePerm('marketing.manage'), async (req, res) => {
  const c = store.get('marketing_campaigns', req.params.id);
  if (!c) return res.status(404).json({ error: 'Campaign not found' });
  if (c.status === 'running') return res.status(400).json({ error: 'Already running' });
  store.update('marketing_campaigns', c.id, { status: 'running' });
  const result = await runCampaign(c);
  res.json({ ...store.get('marketing_campaigns', c.id), result });
});

router.delete('/campaigns/:id', requireAuth, requirePerm('marketing.manage'), (req, res) => {
  store.remove('marketing_campaigns', req.params.id);
  res.json({ ok: true });
});

/* ================= tracking (public) ================= */

const PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

router.get('/open/:cid/:pid', (req, res) => {
  const c = store.get('marketing_campaigns', req.params.cid);
  if (c) {
    const opened = new Set(c.openedBy || []);
    if (!opened.has(req.params.pid)) {
      opened.add(req.params.pid);
      store.update('marketing_campaigns', c.id, { openedBy: [...opened], stats: { ...c.stats, opened: opened.size } });
    }
  }
  res.set('Content-Type', 'image/gif').send(PIXEL);
});

router.get('/click/:cid/:pid', (req, res) => {
  const c = store.get('marketing_campaigns', req.params.cid);
  if (c) {
    const clicked = new Set(c.clickedBy || []);
    if (!clicked.has(req.params.pid)) {
      clicked.add(req.params.pid);
      store.update('marketing_campaigns', c.id, { clickedBy: [...clicked], stats: { ...c.stats, clicked: clicked.size } });
    }
  }
  const u = String(req.query.u || '');
  res.redirect(/^https?:\/\//.test(u) ? u : 'https://onward-1590a.web.app');
});

router.get('/unsub/:pid', (req, res) => {
  const p = store.get('players', req.params.pid);
  if (p) store.update('players', p.id, { marketingOptOut: true });
  res.set('Content-Type', 'text/html').send('<body style="font-family:sans-serif;background:#0b1322;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh"><div style="text-align:center"><h2>You have been unsubscribed ✔</h2><p style="color:#8898b8">You will no longer receive marketing messages from Onward.</p></div></body>');
});

// Generic provider delivery webhook — counts delivered/bounced per campaign
// when the provider echoes back our campaign id; always logs the payload.
router.post('/webhook/:channel', (req, res) => {
  store.insert('marketing_logs', { kind: 'webhook', channel: req.params.channel, payload: JSON.stringify(req.body || {}).slice(0, 4000) });
  res.json({ ok: true });
});

/* ================= automations ================= */

router.get('/automations', requireAuth, (req, res) => res.json({ items: listAutomations(), triggers: TRIGGERS }));

router.put('/automations', requireAuth, requirePerm('marketing.manage'), (req, res) => {
  const items = (Array.isArray(req.body?.items) ? req.body.items : []).slice(0, 50).map((a) => ({
    id: str(a.id, 40) || newId('at'),
    enabled: a.enabled !== false,
    trigger: TRIGGERS.includes(a.trigger) ? a.trigger : 'registration',
    channel: CHANNELS.includes(a.channel) ? a.channel : 'push',
    delayMinutes: Math.max(0, Number(a.delayMinutes) || 0),
    subject: str(a.subject, 300),
    message: str(a.message, 5000),
  }));
  store.saveSettings({ marketingAutomations: items });
  res.json({ items });
});

/* ================= tick — scheduler / worker ================= */

async function processTick() {
  const now = new Date().toISOString();
  const out = { campaigns: 0, jobs: 0 };

  // Due scheduled campaigns.
  for (const c of store.list('marketing_campaigns').filter((x) => x.status === 'scheduled' && x.scheduleAt && x.scheduleAt <= now)) {
    store.update('marketing_campaigns', c.id, { status: 'running' });
    await runCampaign(c);
    out.campaigns += 1;
  }

  // Due automation jobs.
  for (const j of store.list('marketing_jobs').filter((x) => x.status === 'queued' && x.dueAt <= now).slice(0, 200)) {
    const auto = listAutomations().find((a) => a.id === j.automationId);
    const p = store.get('players', j.playerId);
    if (!auto || auto.enabled === false || !p || p.marketingOptOut) {
      store.update('marketing_jobs', j.id, { status: 'skipped' });
      continue;
    }
    const text = personalize(auto.message, p, j.extra || {});
    const subject = personalize(auto.subject || '', p, j.extra || {});
    let ok = true; let error = '';
    const { active, backup } = activeProviders(auto.channel);
    if (auto.channel === 'push' && (!active || active.type === 'inapp')) {
      store.insert('player_messages', { playerId: p.id, icon: '🤖', title: subject, text, link: '', automationId: auto.id });
    } else {
      const to = auto.channel === 'sms' ? p.phone : auto.channel === 'email' ? p.email : String(p.id);
      if (!to) { ok = false; error = 'no contact'; }
      else {
        const r = await sendWithFailover(active, backup, { to, subject, text, html: text, title: subject });
        ok = r.ok; error = r.error || '';
      }
    }
    store.update('marketing_jobs', j.id, { status: ok ? 'sent' : 'failed', error, processedAt: now });
    out.jobs += 1;
  }

  // Daily scan: inactive-30-days automation trigger (at most once per day).
  const s = store.getSettings();
  const today = now.slice(0, 10);
  if (s.marketingScanDay !== today && listAutomations().some((a) => a.enabled !== false && a.trigger === 'inactive_30d')) {
    store.saveSettings({ marketingScanDay: today });
    const { trigger } = require('../marketing/auto');
    store.list('players')
      .filter((p) => p.status === 'active' && !p.marketingOptOut && p.lastLoginAt && Date.parse(p.lastLoginAt) < Date.now() - 30 * dayMs)
      .filter((p) => p.inactiveNudgeDay !== today && (!p.inactiveNudgedAt || Date.parse(p.inactiveNudgedAt) < Date.now() - 30 * dayMs))
      .slice(0, 500)
      .forEach((p) => { store.update('players', p.id, { inactiveNudgedAt: now }); trigger('inactive_30d', p); });
  } else if (s.marketingScanDay !== today) {
    store.saveSettings({ marketingScanDay: today });
  }

  return out;
}

// Poll-friendly worker endpoint — the admin dashboard pings it, and any
// external cron (Cloud Scheduler, uptime monitor) can hit it too.
router.get('/tick', async (req, res) => {
  try { res.json(await processTick()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

/* ================= ads ================= */

const AD_PLATFORMS = ['google', 'meta', 'tiktok', 'telegram', 'x', 'snapchat', 'custom'];

router.get('/ads/connectors', requireAuth, (req, res) => {
  const s = store.getSettings();
  const list = Array.isArray(s.adsConnectors) ? s.adsConnectors : [];
  res.json(list.map(maskProvider));
});
router.put('/ads/connectors', requireAuth, requirePerm('marketing.manage'), (req, res) => {
  const prev = Array.isArray(store.getSettings().adsConnectors) ? store.getSettings().adsConnectors : [];
  const items = (Array.isArray(req.body?.items) ? req.body.items : []).slice(0, 20).map((c) => {
    const id = str(c.id, 40) || newId('ad');
    const old = prev.find((x) => x.id === id);
    const config = {};
    Object.entries(c.config || {}).forEach(([k, v]) => {
      const val = str(v, 4000);
      config[k] = val.startsWith('••••') && old ? (old.config?.[k] || '') : val;
    });
    return { id, platform: AD_PLATFORMS.includes(c.platform) ? c.platform : 'custom', label: str(c.label, 80), accountId: str(c.accountId, 120), config, connected: !!Object.values(config).some(Boolean) };
  });
  store.saveSettings({ adsConnectors: items });
  res.json(items.map(maskProvider));
});

router.get('/ads/campaigns', requireAuth, (req, res) => {
  const rows = store.list('ads_campaigns').sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  // Real platform-side conversions: registrations + FTD attributed by UTM code.
  const players = store.list('players');
  const txns = store.list('transactions').filter((t) => t.type === 'deposit' && t.status === 'approved');
  const firstDepositors = new Set();
  const seenDep = new Set();
  txns.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || '')).forEach((t) => {
    if (!seenDep.has(String(t.playerId))) { seenDep.add(String(t.playerId)); firstDepositors.add(String(t.playerId)); }
  });
  res.json(rows.map((c) => {
    const regs = c.utm ? players.filter((p) => (p.utmSource || p.referralCode || '') === c.utm).length : Number(c.metrics?.registrations || 0);
    const attributed = c.utm ? players.filter((p) => (p.utmSource || p.referralCode || '') === c.utm) : [];
    const ftd = c.utm ? attributed.filter((p) => firstDepositors.has(String(p.id))).length : Number(c.metrics?.ftd || 0);
    const revenue = c.utm
      ? txns.filter((t) => attributed.some((p) => String(p.id) === String(t.playerId))).reduce((s2, t) => s2 + Number(t.amount || 0), 0)
      : Number(c.metrics?.revenue || 0);
    const m = { spend: 0, impressions: 0, clicks: 0, ...c.metrics, registrations: regs, ftd, revenue };
    const kpi = {
      cpc: m.clicks ? m.spend / m.clicks : 0,
      cpm: m.impressions ? (m.spend / m.impressions) * 1000 : 0,
      ctr: m.impressions ? (m.clicks / m.impressions) * 100 : 0,
      cpa: regs ? m.spend / regs : 0,
      costPerFtd: ftd ? m.spend / ftd : 0,
      convRate: m.clicks ? (regs / m.clicks) * 100 : 0,
      roas: m.spend ? revenue / m.spend : 0,
      profit: revenue - m.spend,
    };
    return { ...c, metrics: m, kpi };
  }));
});

router.post('/ads/campaigns', requireAuth, requirePerm('marketing.manage'), (req, res) => {
  const b = req.body || {};
  if (!str(b.name, 200).trim()) return res.status(400).json({ error: 'Name required' });
  res.status(201).json(store.insert('ads_campaigns', {
    name: str(b.name, 200),
    platform: AD_PLATFORMS.includes(b.platform) ? b.platform : 'custom',
    connectorId: str(b.connectorId, 40),
    status: ['active', 'paused', 'completed'].includes(b.status) ? b.status : 'active',
    dailyBudget: num(b.dailyBudget),
    lifetimeBudget: num(b.lifetimeBudget),
    utm: str(b.utm, 120),
    metrics: { spend: num(b.spend), impressions: num(b.impressions), clicks: num(b.clicks), registrations: 0, ftd: 0, revenue: 0 },
  }));
});

router.patch('/ads/campaigns/:id', requireAuth, requirePerm('marketing.manage'), (req, res) => {
  const c = store.get('ads_campaigns', req.params.id);
  if (!c) return res.status(404).json({ error: 'Not found' });
  const b = req.body || {};
  const patch = {};
  if (b.status) patch.status = str(b.status, 20);
  if (b.dailyBudget != null) patch.dailyBudget = num(b.dailyBudget);
  if (b.lifetimeBudget != null) patch.lifetimeBudget = num(b.lifetimeBudget);
  if (b.metrics && typeof b.metrics === 'object') {
    patch.metrics = { ...c.metrics };
    ['spend', 'impressions', 'clicks'].forEach((k) => { if (b.metrics[k] != null) patch.metrics[k] = num(b.metrics[k]); });
  }
  res.json(store.update('ads_campaigns', c.id, patch));
});

router.delete('/ads/campaigns/:id', requireAuth, requirePerm('marketing.manage'), (req, res) => {
  store.remove('ads_campaigns', req.params.id);
  res.json({ ok: true });
});

/* ================= unified summary ================= */

router.get('/summary', requireAuth, (req, res) => {
  const campaigns = store.list('marketing_campaigns');
  const byStatus = (st) => campaigns.filter((c) => c.status === st).length;
  const sum = (ch, k) => campaigns.filter((c) => c.channel === ch).reduce((s, c) => s + Number(c.stats?.[k] || 0), 0);
  const sent = { sms: sum('sms', 'sent'), email: sum('email', 'sent'), push: sum('push', 'sent') };
  const totSent = sent.sms + sent.email + sent.push;
  const totTargeted = ['sms', 'email', 'push'].reduce((s, ch) => s + sum(ch, 'targeted'), 0);
  const opened = sum('email', 'opened');
  const clicked = sum('email', 'clicked');
  const ads = store.list('ads_campaigns');
  const adSpend = ads.reduce((s, c) => s + Number(c.metrics?.spend || 0), 0);
  res.json({
    campaigns: { total: campaigns.length, draft: byStatus('draft'), scheduled: byStatus('scheduled'), running: byStatus('running'), sent: byStatus('sent'), failed: byStatus('failed') },
    sent,
    deliveryRate: totTargeted ? Math.round((totSent / totTargeted) * 100) : 0,
    openRate: sent.email ? Math.round((opened / sent.email) * 100) : 0,
    clickRate: sent.email ? Math.round((clicked / sent.email) * 100) : 0,
    adSpend,
    adsCampaigns: ads.length,
    jobsQueued: store.list('marketing_jobs').filter((j) => j.status === 'queued').length,
  });
});

module.exports = router;
module.exports.processTick = processTick;
