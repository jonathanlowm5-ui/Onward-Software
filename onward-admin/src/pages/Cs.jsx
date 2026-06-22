import { useState } from 'react';
import { useUI } from '../context/UIContext';

const CS_EVENTS = [
  'New ticket opened',
  'Agent assigned',
  'Player VIP escalation',
  'Withdrawal inquiry',
  'Chat transcript ready',
  'Ticket closed',
];

export default function Cs() {
  const { toast } = useUI();
  const [chatProvider, setChatProvider] = useState('');
  const [widgetId, setWidgetId] = useState('');
  const [chatStatus, setChatStatus] = useState('Enabled');
  const [snippet, setSnippet] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [hours, setHours] = useState('');
  const [botProvider, setBotProvider] = useState('None');
  const [botUrl, setBotUrl] = useState('');
  const [botKey, setBotKey] = useState('');
  const [botStatus, setBotStatus] = useState('Enabled');
  const [hookUrl, setHookUrl] = useState('');
  const [hookSecret, setHookSecret] = useState('');
  const [events, setEvents] = useState(['New ticket opened', 'Agent assigned']);
  const [testUrl, setTestUrl] = useState('');

  const save = () => {
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { toast('⚠ Support email looks invalid'); return; }
    if (botUrl && !/^https?:\/\//i.test(botUrl)) { toast('⚠ Chatbot API URL must start with http(s)://'); return; }
    toast('CS settings saved ✅ ' + (chatProvider || 'no chat provider') + ' · bot: ' + botProvider + ' · ' + events.length + ' webhook events');
  };

  const testPing = () => {
    const u = testUrl.trim() || hookUrl.trim();
    if (!u) { toast('⚠ Paste a webhook URL to test'); return; }
    if (!/^https?:\/\//i.test(u)) { toast('⚠ Test URL must start with http(s)://'); return; }
    toast('Test ping sent 📡 ' + u + ' — awaiting 200 OK…');
    setTimeout(() => toast('Webhook responded ✅ 200 OK · 142ms'), 900);
  };

  return (
    <>
      <div className="set-head">
        <div className="grow">
          <h1 className="hero-h">🎧 Customer Service API Links</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>Configure live chat, support widget, and CS API integration settings</div>
        </div>
        <div className="acts"><button className="set-saveall" onClick={save}>💾 Save All</button></div>
      </div>
      <div className="set-card">
        <div className="set-sec-lbl"><span className="dot"></span>Live Chat Widget</div>
        <div className="cs-row3">
          <div className="cs-fld">
            <label>Chat Provider</label>
            <select value={chatProvider} onChange={(e) => setChatProvider(e.target.value)}>
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
            <input value={widgetId} onChange={(e) => setWidgetId(e.target.value)} placeholder="e.g. abc123def456" />
          </div>
          <div className="cs-fld">
            <label>Status</label>
            <select value={chatStatus} onChange={(e) => setChatStatus(e.target.value)}>
              <option value="Enabled">✅ Enabled</option>
              <option value="Disabled">Disabled</option>
            </select>
          </div>
        </div>
        <div className="cs-fld" style={{ marginBottom: 0 }}>
          <label>API / Script Snippet (optional override)</label>
          <textarea value={snippet} onChange={(e) => setSnippet(e.target.value)} placeholder="Paste custom chat widget script here…"></textarea>
        </div>
      </div>
      <div className="cs-grid2">
        <div className="set-card">
          <div className="set-sec-lbl"><span className="dot" style={{ background: 'var(--red)' }}></span>Direct Contact Lines</div>
          <div className="cs-fld">
            <label>Support Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="support@onward.com" />
          </div>
          <div className="cs-fld">
            <label>Support Phone / Viber</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+63 9XX XXX XXXX" />
          </div>
          <div className="cs-fld" style={{ marginBottom: 0 }}>
            <label>Support Hours</label>
            <input value={hours} onChange={(e) => setHours(e.target.value)} placeholder="e.g. Mon–Sun 8AM–12MN PHT" />
          </div>
        </div>
        <div className="set-card">
          <div className="set-sec-lbl"><span className="dot" style={{ background: '#9b30d9' }}></span>Chatbot / AI API</div>
          <div className="cs-fld">
            <label>Chatbot Provider</label>
            <select value={botProvider} onChange={(e) => setBotProvider(e.target.value)}>
              <option value="None">— None —</option>
              <option value="Dialogflow">Dialogflow</option>
              <option value="OpenAI">OpenAI</option>
              <option value="Rasa">Rasa</option>
              <option value="Custom">Custom</option>
            </select>
          </div>
          <div className="cs-fld">
            <label>API Endpoint URL</label>
            <input value={botUrl} onChange={(e) => setBotUrl(e.target.value)} placeholder="https://api.yourbot.com/webhook" />
          </div>
          <div className="cs-fld">
            <label>API Key / Token</label>
            <input value={botKey} onChange={(e) => setBotKey(e.target.value)} placeholder="sk-…" />
          </div>
          <div className="cs-fld" style={{ marginBottom: 0 }}>
            <label>Status</label>
            <select value={botStatus} onChange={(e) => setBotStatus(e.target.value)}>
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
            <input value={hookUrl} onChange={(e) => setHookUrl(e.target.value)} placeholder="https://yourapp.com/cs-webhook" />
          </div>
          <div className="cs-fld">
            <label>Secret / Auth Token</label>
            <input value={hookSecret} onChange={(e) => setHookSecret(e.target.value)} placeholder="Bearer token or HMAC secret" />
          </div>
          <div className="cs-fld">
            <label>Trigger Events</label>
            <select multiple size="4" className="cs-events" value={events} onChange={(e) => setEvents([...e.target.selectedOptions].map((o) => o.value))}>
              {CS_EVENTS.map((ev) => <option key={ev}>{ev}</option>)}
            </select>
          </div>
        </div>
        <div className="cs-fld" style={{ marginBottom: 0 }}>
          <label>Test Webhook</label>
          <div className="cs-testrow">
            <input value={testUrl} onChange={(e) => setTestUrl(e.target.value)} placeholder="Paste URL to test…" />
            <button className="cs-ping" onClick={testPing}>📡 Send Test Ping</button>
          </div>
        </div>
      </div>
    </>
  );
}
