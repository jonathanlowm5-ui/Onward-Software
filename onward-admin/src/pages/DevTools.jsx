import { useState, useRef, useEffect } from 'react';
import { useUI } from '../context/UIContext';

const INITIAL_LOG = [
  { t: '13:28:30', k: 'ok', m: 'Developer Tools initialised.' },
  { t: '13:28:30', k: 'info', m: 'Type help for available commands.' },
  { t: '13:28:30', k: 'info', m: 'Running system diagnostics…' },
  { t: '13:28:30', k: 'ok', m: 'API gateway reachable — 13.5ms' },
  { t: '13:28:30', k: 'ok', m: 'Database connection OK — query 3.1ms' },
  { t: '13:28:31', k: 'ok', m: 'Redis cache OK — hit rate 95.6%' },
  { t: '13:28:31', k: 'warn', m: 'Job queue running — 10 jobs pending' },
  { t: '13:28:31', k: 'ok', m: 'All diagnostics complete.' },
];

const DEV_ENV = [
  ['Environment', 'Production', 'prod'], ['App Version', 'v2.4.1', ''], ['PHP Version', '8.3.6', ''],
  ['Node Version', '22.4.0', ''], ['DB Engine', 'MySQL 8.0', ''], ['Cache Driver', 'Redis 7.2', ''],
  ['Queue Driver', 'Database', ''], ['Storage', 'S3 (AWS)', ''], ['Timezone', 'UTC+08:00', ''],
  ['Debug Mode', 'OFF', 'off'],
];

const devNow = () => new Date().toTimeString().slice(0, 8);
const devGlyph = (k) => (k === 'ok' ? '✓' : k === 'warn' ? '⚠' : k === 'err' ? '✗' : 'i');

export default function DevTools() {
  const { toast } = useUI();
  const [log, setLog] = useState(INITIAL_LOG);
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('/api/v1/players');
  const [payload, setPayload] = useState('{"key":"value"}');
  const [resp, setResp] = useState(null);
  const [cmd, setCmd] = useState('');
  const logRef = useRef(null);

  const push = (entries) => setLog((prev) => [...prev, ...entries]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  const devSend = () => {
    const ms = (Math.random() * 120 + 30).toFixed(1);
    setResp(`{\n  "status": 200,\n  "method": "${method}",\n  "endpoint": "${url}",\n  "data": { "count": 24, "page": 1 },\n  "latency_ms": ${ms}\n}`);
    push([{ t: devNow(), k: 'ok', m: method + ' ' + url + ' — 200 OK · ' + ms + 'ms' }]);
    toast('Request sent ▶ ' + method + ' ' + url + ' — 200 OK · ' + ms + 'ms');
  };

  const devDiagnostics = () => {
    push([
      { t: devNow(), k: 'info', m: 'Running system diagnostics…' },
      { t: devNow(), k: 'ok', m: 'API gateway reachable — ' + (Math.random() * 8 + 10).toFixed(1) + 'ms' },
      { t: devNow(), k: 'ok', m: 'Database connection OK — query ' + (Math.random() * 2 + 2).toFixed(1) + 'ms' },
      { t: devNow(), k: 'ok', m: 'Redis cache OK — hit rate ' + (Math.random() * 3 + 94).toFixed(1) + '%' },
      { t: devNow(), k: 'warn', m: 'Job queue running — 10 jobs pending' },
      { t: devNow(), k: 'ok', m: 'All diagnostics complete.' },
    ]);
    toast('Diagnostics complete ✅ all systems nominal');
  };

  const devClearLog = () => { setLog([]); toast('Debug log cleared 🗑'); };

  const devRun = () => {
    const command = cmd.trim();
    if (!command) return;
    const c = command.toLowerCase();
    const entries = [{ t: devNow(), k: 'info', m: '$ ' + command }];
    if (c === 'clear') { setLog([]); setCmd(''); return; }
    if (c === 'help') entries.push({ t: devNow(), k: 'ok', m: 'Commands: help, clear, status, cache:clear, queue:work, migrate' });
    else if (c === 'status') entries.push({ t: devNow(), k: 'ok', m: 'API online · DB connected · Redis 95.6% · 10 jobs pending' });
    else if (c.startsWith('cache')) entries.push({ t: devNow(), k: 'ok', m: 'Cache cleared — 0 keys remaining' });
    else if (c.startsWith('queue')) entries.push({ t: devNow(), k: 'ok', m: 'Queue worker started — processing 10 jobs…' });
    else if (c === 'migrate') entries.push({ t: devNow(), k: 'ok', m: 'Migrations: nothing to migrate.' });
    else entries.push({ t: devNow(), k: 'err', m: 'Unknown command: ' + command + " (type 'help')" });
    push(entries);
    setCmd('');
  };

  return (
    <>
      <div className="di-head"><div className="grow"><h1 className="hero-h">🔧 Developer Tools</h1><div className="hero-sub" style={{ marginBottom: 0 }}>API testing, system diagnostics and debug console</div></div>
        <div className="acts"><button className="di-btn dark" onClick={devClearLog}>🗑 Clear Log</button><button className="di-btn dark" onClick={devDiagnostics}>▶ Run Diagnostics</button></div></div>
      <div className="grid kpi-grid">
        <div className="card kpi g"><div className="lbl">API Status</div><div className="di-statwrap" style={{ color: 'var(--green)' }}><span className="dot" style={{ background: 'var(--green)' }}></span>Online</div><div className="trend" style={{ color: 'var(--muted)' }}>Ping: 13.5ms</div></div>
        <div className="card kpi b"><div className="lbl">Database</div><div className="di-statwrap" style={{ color: 'var(--green)' }}><span className="dot" style={{ background: 'var(--green)' }}></span>Connected</div><div className="trend" style={{ color: 'var(--muted)' }}>Query: 3.1ms</div></div>
        <div className="card kpi" style={{ borderTopColor: '#2ecc71' }}><div className="lbl">Cache (Redis)</div><div className="di-statwrap" style={{ color: 'var(--green)' }}><span className="dot" style={{ background: 'var(--green)' }}></span>Connected</div><div className="trend" style={{ color: 'var(--muted)' }}>Hit rate: 95.6%</div></div>
        <div className="card kpi" style={{ borderTopColor: 'var(--gold)' }}><div className="lbl">Queue (Jobs)</div><div className="di-statwrap" style={{ color: 'var(--gold)' }}><span className="dot" style={{ background: 'var(--gold)' }}></span>Running</div><div className="trend" style={{ color: 'var(--muted)' }}>Pending: 10</div></div>
      </div>
      <div className="di-2col">
        <div className="di-card"><div className="dch">🧪 API Request Tester</div><div className="dbody">
          <div className="dev-row"><select value={method} onChange={(e) => setMethod(e.target.value)}><option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option></select><input value={url} onChange={(e) => setUrl(e.target.value)} /></div>
          <textarea className="dev-body" value={payload} onChange={(e) => setPayload(e.target.value)} />
          <button className="dev-send" onClick={devSend}>▶ Send Request</button>
          <div className="dev-resp">{resp == null ? <span style={{ color: '#5a6a86' }}>{'// Response will appear here'}</span> : resp}</div>
        </div></div>
        <div className="di-card"><div className="dch">⚙️ Environment</div><div className="dbody">
          {DEV_ENV.map((e, i) => <div className="dev-env" key={i}><span className="k">{e[0]}</span><span className={`v ${e[2]}`}>{e[1]}</span></div>)}
        </div></div>
      </div>
      <div className="di-card" style={{ marginTop: 'var(--pad)' }}>
        <div className="dch">📟 Debug Console<span style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center' }}><span className="rep-mut" style={{ fontSize: '.66rem' }}>{log.length} entries</span><button className="di-btn dark" style={{ padding: '5px 12px', fontSize: '.66rem' }} onClick={devClearLog}>Clear</button></span></div>
        <div className="dev-console"><div className="dev-log" ref={logRef}>
          {log.map((l, i) => (
            <div className="dev-line" key={i}><span className="dl-ts">[{l.t}]</span> <span className={`dl-${l.k}`}>{devGlyph(l.k)} {l.m}</span></div>
          ))}
        </div>
          <div className="dev-cmd"><input value={cmd} placeholder="Enter command…" onChange={(e) => setCmd(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') devRun(); }} /><button onClick={devRun}>Run</button></div>
        </div>
      </div>
    </>
  );
}
