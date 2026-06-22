import { useState, useMemo } from 'react';
import { useUI } from '../context/UIContext';

const INITIAL_GAPIQ = [
  { n: 'Pragmatic Play', ep: 'https://api.pragmaticplay.net/v1', st: 'connected', ping: 18, games: 312, auth: 'API Key', sync: '2026-06-02 14:30' },
  { n: 'Evolution Gaming', ep: 'https://api.evolutiongaming.com/v2', st: 'connected', ping: 24, games: 98, auth: 'OAuth 2.0', sync: '2026-06-02 14:28' },
  { n: 'Hacksaw Gaming', ep: 'https://api.hacksawgaming.com/v1', st: 'connected', ping: 31, games: 145, auth: 'JWT', sync: '2026-06-02 13:55' },
  { n: '3 Oaks Gaming', ep: 'https://api.3oaksgaming.com/v1', st: 'connected', ping: 22, games: 189, auth: 'API Key', sync: '2026-06-02 13:40' },
  { n: 'BGaming', ep: 'https://api.bgaming.com/v1', st: 'connected', ping: 15, games: 220, auth: 'HMAC', sync: '2026-06-02 12:10' },
  { n: 'Gamzix', ep: 'https://api.gamzix.com/v2', st: 'maintenance', ping: null, games: 88, auth: 'API Key', sync: '2026-06-01 22:00' },
  { n: 'Platipus', ep: 'https://api.platipus.com/v1', st: 'connected', ping: 44, games: 102, auth: 'JWT', sync: '2026-06-02 11:20' },
  { n: 'Spribe', ep: 'https://api.spribe.co/v1', st: 'disconnected', ping: null, games: 12, auth: 'API Key', sync: '2026-05-30 09:15' },
  { n: 'Relax Gaming', ep: 'https://api.relaxgaming.com/v2', st: 'connected', ping: 28, games: 176, auth: 'OAuth 2.0', sync: '2026-06-02 14:00' },
  { n: 'Evoplay', ep: 'https://api.evoplay.games/v1', st: 'connected', ping: 35, games: 133, auth: 'API Key', sync: '2026-06-02 10:45' },
];

const GapiPing = ({ p }) => (p == null ? <span className="rep-mut">—</span> : <span className={`api-ping-${p < 30 ? 'fast' : 'slow'}`}>{p}ms</span>);
const GapiStChip = ({ s }) => <span className={`api-st st-${s}`}>{s}</span>;

export default function GamesApi() {
  const { toast } = useUI();
  const [providers, setProviders] = useState(INITIAL_GAPIQ);
  const [query, setQuery] = useState('');
  const [stat, setStat] = useState('all');
  const [out, setOut] = useState(null);
  const [prov, setProv] = useState('');
  const [action, setAction] = useState('Ping / Health Check');
  const [param, setParam] = useState('');

  const conn = providers.filter((p) => p.st === 'connected').length;
  const disc = providers.filter((p) => p.st === 'disconnected').length;
  const totalGames = providers.reduce((s, p) => s + p.games, 0);
  const pings = providers.filter((p) => p.ping != null);
  const avgPing = Math.round(pings.reduce((s, p) => s + p.ping, 0) / pings.length);

  const q = query.toLowerCase();
  const matches = useMemo(
    () => providers.map((p, i) => ({ p, i })).filter(({ p }) =>
      (stat === 'all' || p.st === stat) && (!q || p.n.toLowerCase().includes(q))),
    [providers, stat, q]
  );

  const refreshAll = () => {
    setProviders((prev) => prev.map((p) => p.st === 'connected'
      ? { ...p, ping: Math.round(Math.random() * 40 + 12), sync: '2026-06-02 ' + String(14 + Math.floor(Math.random() * 2)).padStart(2, '0') + ':' + String(Math.floor(Math.random() * 60)).padStart(2, '0') }
      : p));
    toast('All providers refreshed ↻ ' + providers.filter((p) => p.st === 'connected').length + ' connected');
  };
  const resync = (i) => {
    const p = providers[i];
    if (p.st === 'disconnected') { toast('Cannot sync — ' + p.n + ' is disconnected ❌'); return; }
    setProviders((prev) => prev.map((x, idx) => idx === i
      ? { ...x, sync: '2026-06-02 14:' + String(Math.floor(Math.random() * 60)).padStart(2, '0'), ping: x.st === 'connected' ? Math.round(Math.random() * 40 + 12) : x.ping }
      : x));
    toast('Re-synced ↻ ' + p.n + ' · ' + p.games + ' games');
  };
  const edit = (i) => toast('Edit provider ✏ ' + providers[i].n + ' · ' + providers[i].auth + ' · ' + providers[i].ep);
  const quickTest = (i) => {
    const p = providers[i]; const ok = p.st === 'connected';
    toast((ok ? '⚡ Test OK — ' : '⚡ Test failed — ') + p.n + (ok ? ' · ' + (p.ping || 20) + 'ms' : ' · ' + p.st));
  };
  const add = () => toast('Add Provider — demo');

  const runTest = () => {
    if (!prov) { setOut(<span style={{ color: '#ff7b72' }}>{'// Please select a provider first'}</span>); return; }
    const p = providers.find((x) => x.n === prov); const ms = (Math.random() * 40 + 12).toFixed(0);
    if (p && p.st === 'disconnected') {
      setOut(`✗ ${action} — ${prov}\nERROR: provider disconnected (HTTP 503)\nLast synced: ${p.sync}`);
      toast('Test failed ✗ ' + prov + ' disconnected'); return;
    }
    setOut(`✓ ${action} — ${prov}\nHTTP 200 OK · ${ms}ms${param ? '\nparam: ' + param : ''}\n{\n  "provider": "${prov}",\n  "auth": "${p ? p.auth : 'API Key'}",\n  "games": ${p ? p.games : 0},\n  "status": "healthy"\n}`);
    toast('Test passed ✓ ' + prov + ' · ' + ms + 'ms');
  };

  return (
    <>
      <div className="di-head"><div className="grow"><h1 className="hero-h">🎮 Games API</h1><div className="hero-sub" style={{ marginBottom: 0 }}>Manage game provider API integrations, credentials and connection health</div></div>
        <div className="acts"><button className="di-btn dark" onClick={refreshAll}>↻ Refresh All</button><button className="di-btn gold" onClick={add}>＋ Add Provider</button></div></div>
      <div className="grid kpi-grid">
        <div className="card kpi b"><div className="lbl">Connected Providers</div><div className="val">{conn}</div><div className="trend" style={{ color: 'var(--muted)' }}>active integrations</div></div>
        <div className="card kpi r"><div className="lbl">Disconnected</div><div className="val">{disc}</div><div className="trend" style={{ color: 'var(--muted)' }}>needs attention</div></div>
        <div className="card kpi b"><div className="lbl">Total Games</div><div className="val">{totalGames.toLocaleString()}</div><div className="trend" style={{ color: 'var(--muted)' }}>across all providers</div></div>
        <div className="card kpi" style={{ borderTopColor: '#9b30d9' }}><div className="lbl">Avg Response</div><div className="val">{avgPing}ms</div><div className="trend" style={{ color: 'var(--muted)' }}>API latency</div></div>
      </div>
      <div className="di-card" style={{ marginTop: 'var(--pad)' }}>
        <div className="api-tbar"><span className="t">🔌 Provider Connections</span><span className="sp"><input placeholder="Search provider…" value={query} onChange={(e) => setQuery(e.target.value)} /><select value={stat} onChange={(e) => setStat(e.target.value)}><option value="all">All Status</option><option value="connected">Connected</option><option value="maintenance">Maintenance</option><option value="disconnected">Disconnected</option></select></span></div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table className="api-tbl" style={{ minWidth: '1100px' }}>
          <thead><tr><th>Provider</th><th>API Endpoint</th><th>Status</th><th>Ping</th><th>Games</th><th>Auth Type</th><th>Last Synced</th><th>Actions</th></tr></thead>
          <tbody>{matches.length ? matches.map(({ p, i }) => (
            <tr key={i}>
              <td className="api-name">🎮 {p.n}</td>
              <td className="api-ep">{p.ep}</td>
              <td><GapiStChip s={p.st} /></td>
              <td><GapiPing p={p.ping} /></td>
              <td style={{ fontWeight: 800 }}>{p.games}</td>
              <td className="rep-mut">{p.auth}</td>
              <td className="rep-mut" style={{ fontFamily: "'Roboto Mono','Courier New',ui-monospace,monospace", fontSize: '.72rem' }}>{p.sync}</td>
              <td><span className="api-act" title="Test connection" onClick={() => quickTest(i)}>⚡</span><span className="api-act" title="Re-sync" onClick={() => resync(i)}>↻</span><span className="api-act edit" title="Edit" onClick={() => edit(i)}>✏</span></td>
            </tr>
          )) : <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--muted)', padding: '22px' }}>No providers match this filter</td></tr>}</tbody>
        </table></div>
      </div>
      <div className="api-console">
        <div className="ach">🧪 API Test Console</div>
        <div className="abody">
          <div className="left">
            <select value={prov} onChange={(e) => setProv(e.target.value)}><option value="">Select Provider…</option>{providers.map((p, i) => <option key={i}>{p.n}</option>)}</select>
            <select value={action} onChange={(e) => setAction(e.target.value)}><option>Ping / Health Check</option><option>Fetch Game List</option><option>Validate Credentials</option><option>Launch Session (test)</option></select>
            <input placeholder="Optional param (e.g. game_id, user_id)…" value={param} onChange={(e) => setParam(e.target.value)} />
            <button className="runbtn" onClick={runTest}>▶ Run Test</button>
          </div>
          <div className="api-out">{out == null ? <span className="muted">{'// Select a provider and action, then click Run Test'}</span> : out}</div>
        </div>
      </div>
    </>
  );
}
