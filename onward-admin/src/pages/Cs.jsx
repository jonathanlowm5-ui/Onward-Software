import { useEffect, useState } from 'react';
import { useUI } from '../context/UIContext';
import { getConfig, saveConfig, pingUrl } from '../services/configService';
import api from '../services/api';

const CS_EVENTS = [
  'New ticket opened',
  'Agent assigned',
  'Player VIP escalation',
  'Withdrawal inquiry',
  'Chat transcript ready',
  'Ticket closed',
];

// Persisted as settings.csConfig. chatUrl is also synced to /support-pages
// (liveChatUrl) so the player site's footer "Live Chat" button uses it.
const CS_DEFAULTS = {
  chatProvider: '', widgetId: '', chatStatus: 'Enabled', chatUrl: '', snippet: '',
  email: '', phone: '', hours: '',
  botProvider: 'None', botUrl: '', botKey: '', botStatus: 'Enabled',
  hookUrl: '', hookSecret: '', events: ['New ticket opened', 'Agent assigned'],
};

export default function Cs() {
  const { toast } = useUI();
  const [cfg, setCfg] = useState(null); // null = loading
  const [saving, setSaving] = useState(false);
  const [testUrl, setTestUrl] = useState('');

  useEffect(() => {
    Promise.all([getConfig().catch(() => ({})), api.get('/support-pages').catch(() => null)])
      .then(([c, sp]) => {
        const saved = c.csConfig || {};
        const liveChatUrl = sp?.data?.liveChatUrl || '';
        setCfg({ ...CS_DEFAULTS, ...saved, chatUrl: saved.chatUrl || liveChatUrl });
      })
      .catch(() => setCfg({ ...CS_DEFAULTS }));
  }, []);

  const setF = (k, v) => setCfg((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (cfg.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cfg.email)) { toast('⚠ Support email looks invalid'); return; }
    if (cfg.botUrl && !/^https?:\/\//i.test(cfg.botUrl)) { toast('⚠ Chatbot API URL must start with http(s)://'); return; }
    if (cfg.chatUrl && !/^https?:\/\//i.test(cfg.chatUrl)) { toast('⚠ Live Chat URL must start with http(s)://'); return; }
    setSaving(true);
    try {
      await saveConfig({ csConfig: cfg });
      // Sync the live-chat URL to the player site's footer Live Chat button.
      await api.put('/support-pages', { liveChatUrl: cfg.chatUrl || '' });
      toast('CS settings saved ✅ ' + (cfg.chatProvider || 'no chat provider') + ' · bot: ' + cfg.botProvider + ' · live chat synced to player site');
    } catch (e) { toast('⚠ ' + (e.message || 'Save failed')); }
    finally { setSaving(false); }
  };

  const testPing = () => {
    const u = testUrl.trim() || cfg.hookUrl.trim();
    if (!u) { toast('⚠ Paste a webhook URL to test'); return; }
    if (!/^https?:\/\//i.test(u)) { toast('⚠ Test URL must start with http(s)://'); return; }
    toast('Test ping sent 📡 ' + u + '…');
    pingUrl(u)
      .then((r) => toast(r.ok ? 'Webhook reachable ✅ ' + (r.status || 'OK') + ' · ' + r.ms + 'ms' : '⚠ Webhook unreachable ✕ ' + (r.error || r.status || '') + (r.ms != null ? ' · ' + r.ms + 'ms' : '')))
      .catch((e) => toast('⚠ Ping failed: ' + (e.message || 'error')));
  };

  if (!cfg) return <div className="hist-empty">Loading CS config…</div>;

  return (
    <>
      <div className="set-head">
        <div className="grow">
          <h1 className="hero-h">🎧 Customer Service API Links</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>Configure live chat, support widget, and CS API integration settings</div>
        </div>
        <div className="acts"><button className="set-saveall" onClick={save} disabled={saving}>{saving ? 'Saving…' : '💾 Save All'}</button></div>
      </div>
      <div className="set-card">
        <div className="set-sec-lbl"><span className="dot"></span>Live Chat Widget</div>
        <div className="cs-row3">
          <div className="cs-fld">
            <label>Chat Provider</label>
            <select value={cfg.chatProvider} onChange={(e) => setF('chatProvider', e.target.value)}>
              <option value="">— Select Provider —</option>
              <option value="Tawk.to">Tawk.to</option>
              <option value="LiveChat">LiveChat</option>
              <option value="Intercom">Intercom</option>
              <option value="Zendesk">Zendesk</option>
              <option value="Crisp">Crisp</option>
              <option value="JivoChat">JivoChat</option>
            </select>
          </div>
          <div className="cs-fld">
            <label>Widget / Property ID</label>
            <input value={cfg.widgetId} onChange={(e) => setF('widgetId', e.target.value)} placeholder="e.g. abc123def456" />
          </div>
          <div className="cs-fld">
            <label>Status</label>
            <select value={cfg.chatStatus} onChange={(e) => setF('chatStatus', e.target.value)}>
              <option value="Enabled">✅ Enabled</option>
              <option value="Disabled">Disabled</option>
            </select>
          </div>
        </div>
        <div className="cs-fld">
          <label>Live Chat URL (synced to the player site's Live Chat button)</label>
          <input value={cfg.chatUrl} onChange={(e) => setF('chatUrl', e.target.value)} placeholder="https://tawk.to/chat/… or https://t.me/OnwardSupport" />
        </div>
        <div className="cs-fld" style={{ marginBottom: 0 }}>
          <label>API / Script Snippet (optional override)</label>
          <textarea value={cfg.snippet} onChange={(e) => setF('snippet', e.target.value)} placeholder="Paste custom chat widget script here…"></textarea>
        </div>
      </div>
      <div className="cs-grid2">
        <div className="set-card">
          <div className="set-sec-lbl"><span className="dot" style={{ background: 'var(--red)' }}></span>Direct Contact Lines</div>
          <div className="cs-fld">
            <label>Support Email</label>
            <input value={cfg.email} onChange={(e) => setF('email', e.target.value)} placeholder="support@onward.com" />
          </div>
          <div className="cs-fld">
            <label>Support Phone / Viber</label>
            <input value={cfg.phone} onChange={(e) => setF('phone', e.target.value)} placeholder="+63 9XX XXX XXXX" />
          </div>
          <div className="cs-fld" style={{ marginBottom: 0 }}>
            <label>Support Hours</label>
            <input value={cfg.hours} onChange={(e) => setF('hours', e.target.value)} placeholder="e.g. Mon–Sun 8AM–12MN PHT" />
          </div>
        </div>
        <div className="set-card">
          <div className="set-sec-lbl"><span className="dot" style={{ background: '#9b30d9' }}></span>Chatbot / AI API</div>
          <div className="cs-fld">
            <label>Chatbot Provider</label>
            <select value={cfg.botProvider} onChange={(e) => setF('botProvider', e.target.value)}>
              <option value="None">— None —</option>
              <option value="Dialogflow">Dialogflow</option>
              <option value="OpenAI">OpenAI</option>
              <option value="Rasa">Rasa</option>
              <option value="Custom">Custom</option>
            </select>
          </div>
          <div className="cs-fld">
            <label>API Endpoint URL</label>
            <input value={cfg.botUrl} onChange={(e) => setF('botUrl', e.target.value)} placeholder="https://api.yourbot.com/webhook" />
          </div>
          <div className="cs-fld">
            <label>API Key / Token</label>
            <input value={cfg.botKey} onChange={(e) => setF('botKey', e.target.value)} placeholder="sk-…" />
          </div>
          <div className="cs-fld" style={{ marginBottom: 0 }}>
            <label>Status</label>
            <select value={cfg.botStatus} onChange={(e) => setF('botStatus', e.target.value)}>
              <option value="Enabled">✅ Enabled</option>
              <option value="Disabled">Disabled</option>
            </select>
          </div>
        </div>
      </div>
      <div className="set-card" style={{ marginTop: '16px' }}>
        <div className="set-sec-lbl"><span className="dot" style={{ background: '#ff8c42' }}></span>CS Webhook Notifications</div>
        <div className="cs-row3">
          <div className="cs-fld">
            <label>Webhook URL</label>
            <input value={cfg.hookUrl} onChange={(e) => setF('hookUrl', e.target.value)} placeholder="https://yourapp.com/cs-webhook" />
          </div>
          <div className="cs-fld">
            <label>Secret / Auth Token</label>
            <input value={cfg.hookSecret} onChange={(e) => setF('hookSecret', e.target.value)} placeholder="Bearer token or HMAC secret" />
          </div>
          <div className="cs-fld">
            <label>Trigger Events</label>
            <select multiple size="4" className="cs-events" value={cfg.events} onChange={(e) => setF('events', [...e.target.selectedOptions].map((o) => o.value))}>
              {CS_EVENTS.map((ev) => <option key={ev}>{ev}</option>)}
            </select>
          </div>
        </div>
        <div className="cs-fld" style={{ marginBottom: 0 }}>
          <label>Test Webhook (server-side reachability check)</label>
          <div className="cs-testrow">
            <input value={testUrl} onChange={(e) => setTestUrl(e.target.value)} placeholder="Paste URL to test…" />
            <button className="cs-ping" onClick={testPing}>📡 Send Test Ping</button>
          </div>
        </div>
      </div>
    </>
  );
}
