/*
 * marketing/adapters.js — the provider abstraction layer.
 *
 * Every SMS / Email / Push provider is an adapter with the same signature:
 *   send(config, msg) -> Promise<{ ok, id?, error? }>
 * where msg = { to, from, subject?, text?, html?, title?, image?, link?, tokens? }.
 *
 * Adding a new provider = adding one adapter here; the campaign engine never
 * changes. "customhttp" covers any HTTP API via URL/headers/body templates.
 */
const nodemailer = require('nodemailer');

const form = (obj) => new URLSearchParams(obj).toString();
const basic = (u, p) => 'Basic ' + Buffer.from(`${u}:${p}`).toString('base64');

// Fill {{to}} {{from}} {{message}} {{subject}} placeholders in custom templates.
const tpl = (s, msg) => String(s || '')
  .replaceAll('{{to}}', msg.to || '')
  .replaceAll('{{from}}', msg.from || '')
  .replaceAll('{{message}}', msg.text || '')
  .replaceAll('{{subject}}', msg.subject || '');

async function http(url, options) {
  const res = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
  const body = await res.text();
  if (!res.ok) return { ok: false, error: `HTTP ${res.status}: ${body.slice(0, 300)}` };
  let id;
  try { const j = JSON.parse(body); id = j.sid || j.id || j.messageId || (j.messages && j.messages[0]?.messageId) || (j.data && j.data.id); } catch { /* non-JSON */ }
  return { ok: true, id };
}

const ADAPTERS = {
  /* ---------- SMS ---------- */
  twilio: {
    channel: 'sms', label: 'Twilio',
    fields: ['accountSid', 'authToken', 'from'],
    send: (c, m) => http(`https://api.twilio.com/2010-04-01/Accounts/${c.accountSid}/Messages.json`, {
      method: 'POST',
      headers: { Authorization: basic(c.accountSid, c.authToken), 'content-type': 'application/x-www-form-urlencoded' },
      body: form({ To: m.to, From: m.from || c.from, Body: m.text }),
    }),
  },
  vonage: {
    channel: 'sms', label: 'Vonage (Nexmo)',
    fields: ['apiKey', 'apiSecret', 'from'],
    send: (c, m) => http('https://rest.nexmo.com/sms/json', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ api_key: c.apiKey, api_secret: c.apiSecret, to: m.to, from: m.from || c.from, text: m.text }),
    }),
  },
  messagebird: {
    channel: 'sms', label: 'MessageBird',
    fields: ['accessKey', 'from'],
    send: (c, m) => http('https://rest.messagebird.com/messages', {
      method: 'POST',
      headers: { Authorization: `AccessKey ${c.accessKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ recipients: [m.to], originator: m.from || c.from, body: m.text }),
    }),
  },
  infobip: {
    channel: 'sms', label: 'Infobip',
    fields: ['baseUrl', 'apiKey', 'from'],
    send: (c, m) => http(`${String(c.baseUrl || '').replace(/\/$/, '')}/sms/2/text/advanced`, {
      method: 'POST',
      headers: { Authorization: `App ${c.apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ messages: [{ destinations: [{ to: m.to }], from: m.from || c.from, text: m.text }] }),
    }),
  },
  telnyx: {
    channel: 'sms', label: 'Telnyx',
    fields: ['apiKey', 'from'],
    send: (c, m) => http('https://api.telnyx.com/v2/messages', {
      method: 'POST',
      headers: { Authorization: `Bearer ${c.apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: m.from || c.from, to: m.to, text: m.text }),
    }),
  },
  smscustom: {
    channel: 'sms', label: 'Custom HTTP API',
    fields: ['url', 'method', 'headers', 'bodyTemplate', 'from'],
    send: (c, m) => {
      let headers = { 'content-type': 'application/json' };
      try { headers = { ...headers, ...JSON.parse(c.headers || '{}') } } catch { /* keep defaults */ }
      return http(tpl(c.url, m), { method: (c.method || 'POST').toUpperCase(), headers, body: tpl(c.bodyTemplate, m) });
    },
  },

  /* ---------- EMAIL ---------- */
  sendgrid: {
    channel: 'email', label: 'SendGrid',
    fields: ['apiKey', 'from'],
    send: (c, m) => http('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${c.apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: m.to }] }],
        from: { email: m.from || c.from },
        subject: m.subject || '',
        content: [{ type: 'text/html', value: m.html || m.text || '' }],
      }),
    }),
  },
  mailgun: {
    channel: 'email', label: 'Mailgun',
    fields: ['domain', 'apiKey', 'from', 'euRegion'],
    send: (c, m) => http(`https://${String(c.euRegion).toLowerCase() === 'true' ? 'api.eu' : 'api'}.mailgun.net/v3/${c.domain}/messages`, {
      method: 'POST',
      headers: { Authorization: basic('api', c.apiKey), 'content-type': 'application/x-www-form-urlencoded' },
      body: form({ to: m.to, from: m.from || c.from, subject: m.subject || '', html: m.html || m.text || '' }),
    }),
  },
  smtp: {
    channel: 'email', label: 'SMTP (any — Amazon SES, Gmail, Mailchimp/Mandrill…)',
    fields: ['host', 'port', 'secure', 'username', 'password', 'from'],
    send: async (c, m) => {
      try {
        const t = nodemailer.createTransport({
          host: c.host, port: Number(c.port) || 587,
          secure: String(c.secure).toLowerCase() === 'true',
          auth: c.username ? { user: c.username, pass: c.password } : undefined,
        });
        const info = await t.sendMail({ from: m.from || c.from, to: m.to, subject: m.subject || '', html: m.html || m.text || '' });
        return { ok: true, id: info.messageId };
      } catch (e) { return { ok: false, error: e.message }; }
    },
  },
  emailcustom: {
    channel: 'email', label: 'Custom HTTP API',
    fields: ['url', 'method', 'headers', 'bodyTemplate', 'from'],
    send: (c, m) => {
      let headers = { 'content-type': 'application/json' };
      try { headers = { ...headers, ...JSON.parse(c.headers || '{}') } } catch { /* keep defaults */ }
      const msg = { ...m, text: m.html || m.text };
      return http(tpl(c.url, msg), { method: (c.method || 'POST').toUpperCase(), headers, body: tpl(c.bodyTemplate, msg) });
    },
  },

  /* ---------- PUSH ---------- */
  inapp: {
    channel: 'push', label: 'In-app (player notification bell)',
    fields: [],
    // Handled specially by the engine (writes player_messages) — send() is a no-op marker.
    send: async () => ({ ok: true, inapp: true }),
  },
  fcm: {
    channel: 'push', label: 'Firebase Cloud Messaging (legacy key)',
    fields: ['serverKey'],
    send: (c, m) => http('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: { Authorization: `key=${c.serverKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        ...(m.token ? { to: m.token } : { to: '/topics/all' }),
        notification: { title: m.title || m.subject || '', body: m.text || '', image: m.image || undefined },
        data: m.link ? { link: m.link } : {},
      }),
    }),
  },
  onesignal: {
    channel: 'push', label: 'OneSignal',
    fields: ['appId', 'restApiKey'],
    send: (c, m) => http('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: { Authorization: `Basic ${c.restApiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        app_id: c.appId,
        included_segments: ['Subscribed Users'],
        headings: { en: m.title || m.subject || '' },
        contents: { en: m.text || '' },
        url: m.link || undefined,
        big_picture: m.image || undefined,
      }),
    }),
  },
  pushcustom: {
    channel: 'push', label: 'Custom Push API',
    fields: ['url', 'method', 'headers', 'bodyTemplate'],
    send: (c, m) => {
      let headers = { 'content-type': 'application/json' };
      try { headers = { ...headers, ...JSON.parse(c.headers || '{}') } } catch { /* keep defaults */ }
      return http(tpl(c.url, m), { method: (c.method || 'POST').toUpperCase(), headers, body: tpl(c.bodyTemplate, m) });
    },
  },
};

// One send with automatic failover: active provider first, then backup.
async function sendWithFailover(active, backup, msg) {
  const tryOne = async (p) => {
    if (!p) return { ok: false, error: 'No provider configured' };
    const a = ADAPTERS[p.type];
    if (!a) return { ok: false, error: `Unknown provider type: ${p.type}` };
    try { return await a.send(p.config || {}, msg); }
    catch (e) { return { ok: false, error: e.message }; }
  };
  let r = await tryOne(active);
  if (!r.ok && backup) {
    const b = await tryOne(backup);
    if (b.ok) return { ...b, failedOver: true, primaryError: r.error };
    return { ok: false, error: `primary: ${r.error} · backup: ${b.error}` };
  }
  return r;
}

module.exports = { ADAPTERS, sendWithFailover };
