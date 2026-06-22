import { useState, useMemo } from 'react';
import { useUI } from '../context/UIContext';

const INITIAL_PADHOCQ = [
  { n: 'GoldPay', type: 'Aggregator', cur: 'PHP', st: 'sandbox', env: 'sandbox', min: '₱100', max: '₱500,000', fee: '1.5%', auth: 'SHA256 Signature', tags: ['GCash', 'Maya'], cfg: {
    merchant: 'ph5xbet', secret: '98d811f6be8ff0fbbbce8714d2935bd8', enc: 'SHA256',
    api: 'https://fb5csakrp9gv2t7m.vkbcbggu.com', portal: 'https://merc-mgmt.bo.g-pay.co/#/login',
    portalUser: 'ph5xbet', portalPass: '123456', callbackIps: ['52.8.131.27', '50.18.90.85'],
    note: 'Whitelist our outbound IP with GoldPay before going live. Their callback IPs are pre-listed below for inbound allowlisting.',
  } },
  { n: 'GCash', type: 'E-Wallet', cur: 'PHP', st: 'active', env: 'live', min: '₱50', max: '₱100,000', fee: 'Free', auth: 'API Key + Secret', tags: [] },
  { n: 'Maya', type: 'E-Wallet', cur: 'PHP', st: 'active', env: 'live', min: '₱50', max: '₱100,000', fee: 'Free', auth: 'OAuth 2.0', tags: [] },
  { n: 'Dragonpay', type: 'Bank Transfer', cur: 'PHP', st: 'active', env: 'live', min: '₱200', max: '₱500,000', fee: '1.5%', auth: 'API Key + Secret', tags: [] },
  { n: 'USDT TRC-20', type: 'Crypto', cur: 'USDT', st: 'active', env: 'live', min: '₱10', max: '₱50,000', fee: '0.5%', auth: 'HMAC Signature', tags: [] },
  { n: 'Coins.ph', type: 'E-Wallet', cur: 'PHP', st: 'sandbox', env: 'sandbox', min: '₱50', max: '₱50,000', fee: 'Free', auth: 'JWT Bearer', tags: [] },
  { n: 'BancNet', type: 'Bank Transfer', cur: 'PHP', st: 'active', env: 'live', min: '₱500', max: '₱1,000,000', fee: '15%', auth: 'API Key + Secret', tags: [] },
  { n: 'PayMongo', type: 'Credit/Debit Card', cur: 'PHP', st: 'sandbox', env: 'sandbox', min: '₱100', max: '₱500,000', fee: '2.9%', auth: 'Basic Auth', tags: [] },
  { n: 'Xendit', type: 'Bank Transfer', cur: 'PHP', st: 'error', env: 'live', min: '₱100', max: '₱500,000', fee: '1.8%', auth: 'API Key + Secret', tags: [] },
  { n: 'ShopeePay', type: 'E-Wallet', cur: 'PHP', st: 'disabled', env: 'sandbox', min: '₱50', max: '₱50,000', fee: 'Free', auth: 'OAuth 2.0', tags: [] },
  { n: 'PHPGO', type: 'Aggregator', cur: 'PHP', st: 'sandbox', env: 'sandbox', min: '₱100', max: '₱300,000', fee: '1.2%', auth: 'API Key + Secret', tags: ['Maya', 'GCash'] },
  { n: 'Paygrid', type: 'Aggregator', cur: 'PHP', st: 'sandbox', env: 'sandbox', min: '₱100', max: '₱500,000', fee: '1.5%', auth: 'API Key + Secret', tags: ['Maya', 'GCash', 'GrabPay'] },
];

const PadStChip = ({ s }) => <span className={`api-st st-${s}`}>{s}</span>;
const PadEnv = ({ e }) => (e === 'live' ? <span className="api-pill live">🚀 Live</span> : <span className="api-pill sand">✏ Sandbox</span>);
const PadFee = ({ f }) => (f === 'Free' ? <span className="api-fee-free">Free</span> : f);
const pgdMask = (s) => { if (!s) return '—'; if (s.length <= 8) return s; return s.slice(0, 4) + '•'.repeat(s.length - 8) + s.slice(-4); };

function PgdRow({ k, children }) {
  return <div className="pgd-row"><div className="k">{k}</div><div className="v">{children}</div></div>;
}

export default function PaymentAdhoc() {
  const { toast } = useUI();
  const [gateways, setGateways] = useState(INITIAL_PADHOCQ);
  const [query, setQuery] = useState('');
  const [stat, setStat] = useState('all');
  const [out, setOut] = useState(null);
  const [gw, setGw] = useState('');
  const [op, setOp] = useState('Ping / Health Check');
  const [amt, setAmt] = useState('');
  const [pgdI, setPgdI] = useState(-1);
  const [pgdShow, setPgdShow] = useState(false);

  const active = gateways.filter((g) => g.st === 'active').length;
  const sandbox = gateways.filter((g) => g.st === 'sandbox').length;
  const currencies = new Set(gateways.map((g) => g.cur)).size;
  const errors = gateways.filter((g) => g.st === 'error').length;

  const q = query.toLowerCase();
  const matches = useMemo(
    () => gateways.map((g, i) => ({ g, i })).filter(({ g }) =>
      (stat === 'all' || g.st === stat) && (!q || g.n.toLowerCase().includes(q))),
    [gateways, stat, q]
  );

  const refresh = () => toast('Gateways refreshed ↻ ' + gateways.filter((g) => g.st === 'active').length + ' active · ' + gateways.filter((g) => g.st === 'error').length + ' error');
  const toggle = (i) => {
    setGateways((prev) => prev.map((g, idx) => {
      if (idx !== i) return g;
      let ng = { ...g };
      if (g.st === 'active') ng.st = 'disabled';
      else if (g.st === 'disabled' || g.st === 'sandbox') { ng.st = 'active'; ng.env = 'live'; }
      else if (g.st === 'error') ng.st = 'active';
      return ng;
    }));
    const g = gateways[i];
    let newSt = g.st === 'active' ? 'disabled' : (g.st === 'disabled' || g.st === 'sandbox' || g.st === 'error') ? 'active' : g.st;
    toast(g.n + ' → ' + newSt + ' ' + (newSt === 'active' ? '✅' : '⏸'));
  };
  const quickTest = (i) => {
    const g = gateways[i]; const ok = g.st === 'active' || g.st === 'sandbox';
    toast((ok ? '⚡ Test OK — ' : '⚡ Test failed — ') + g.n + (ok ? ' · ' + (Math.random() * 1 + 0.5).toFixed(1) + 's' : ' · ' + g.st));
  };
  const view = (i) => { setPgdI(i); setPgdShow(false); };
  const closePgd = () => setPgdI(-1);
  const add = () => toast('Add Gateway — demo');

  const pgdCopy = (txt, label) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(() => toast('Copied 📋 ' + (label || txt))).catch(() => toast('Copy this: ' + txt));
    } else toast('Copy this: ' + txt);
  };
  const pgdTest = () => {
    const g = gateways[pgdI]; if (!g) return;
    const s = (Math.random() * 1 + 0.4).toFixed(2);
    if (g.cfg) toast('⚡ ' + g.n + ' handshake OK · ' + s + 's · ' + g.cfg.enc + ' signed · ' + g.cfg.api.replace('https://', ''));
    else if (g.st === 'error' || g.st === 'disabled') toast('⚡ Test failed — ' + g.n + ' ' + g.st);
    else toast('⚡ ' + g.n + ' reachable · ' + s + 's · HTTP 200');
  };

  const runTest = () => {
    if (!gw) { setOut(<span style={{ color: '#ff7b72' }}>{'// Please select a gateway first'}</span>); return; }
    const g = gateways.find((x) => x.n === gw); const s = (Math.random() * 1.2 + 0.4).toFixed(2);
    if (g && (g.st === 'error' || g.st === 'disabled')) {
      setOut(`✗ ${op} — ${gw}\nFAILED: gateway ${g.st} (HTTP ${g.st === 'error' ? '500' : '403'})\nauth: ${g.auth}`);
      toast('Test failed ✗ ' + gw + ' ' + g.st); return;
    }
    setOut(`✓ ${op} — ${gw}\nPASS · ${s}s · env: ${g ? g.env : 'sandbox'}${amt ? '\namount: ₱' + amt : ''}\n{\n  "gateway": "${gw}",\n  "currency": "${g ? g.cur : 'PHP'}",\n  "auth": "${g ? g.auth : ''}",\n  "result": "healthy"\n}`);
    toast('Test passed ✓ ' + gw + ' · ' + s + 's');
  };

  const g = pgdI >= 0 ? gateways[pgdI] : null;
  const c = g ? g.cfg : null;

  return (
    <>
      <div className="di-head"><div className="grow"><h1 className="hero-h">💳 Payment Adhoc</h1><div className="hero-sub" style={{ marginBottom: 0 }}>Add, configure and test new payment gateway API integrations</div></div>
        <div className="acts"><button className="di-btn dark" onClick={refresh}>↻ Refresh</button><button className="di-btn gold" onClick={add}>＋ Add Gateway</button></div></div>
      <div className="grid kpi-grid">
        <div className="card kpi g"><div className="lbl">Active Gateways</div><div className="val">{active}</div><div className="trend" style={{ color: 'var(--muted)' }}>live &amp; processing</div></div>
        <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">Sandbox / Testing</div><div className="val">{sandbox}</div><div className="trend" style={{ color: 'var(--muted)' }}>in test mode</div></div>
        <div className="card kpi b"><div className="lbl">Currencies</div><div className="val">{currencies}</div><div className="trend" style={{ color: 'var(--muted)' }}>supported</div></div>
        <div className="card kpi r"><div className="lbl">Failed / Error</div><div className="val">{errors}</div><div className="trend" style={{ color: 'var(--muted)' }}>needs attention</div></div>
      </div>
      <div className="di-card" style={{ marginTop: 'var(--pad)' }}>
        <div className="api-tbar"><span className="t">💳 Registered Gateways</span><span className="sp"><input placeholder="Search gateway…" value={query} onChange={(e) => setQuery(e.target.value)} /><select value={stat} onChange={(e) => setStat(e.target.value)}><option value="all">All</option><option value="active">Active</option><option value="sandbox">Sandbox</option><option value="error">Error</option><option value="disabled">Disabled</option></select></span></div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table className="api-tbl" style={{ minWidth: '1200px' }}>
          <thead><tr><th>Gateway</th><th>Type</th><th>Currency</th><th>Status</th><th>Env</th><th>Min Dep</th><th>Max Dep</th><th>Fee</th><th>Auth</th><th>Actions</th></tr></thead>
          <tbody>{matches.length ? matches.map(({ g: gg, i }) => (
            <tr key={i}>
              <td><div className="api-name">💳 {gg.n}</div>{gg.tags.length ? <div>{gg.tags.map((t, ti) => <span className="api-tag" key={ti}>{t}</span>)}</div> : null}</td>
              <td className="rep-mut">{gg.type}</td>
              <td style={{ fontWeight: 700 }}>{gg.cur}</td>
              <td><PadStChip s={gg.st} /></td>
              <td><PadEnv e={gg.env} /></td>
              <td className="rep-mut">{gg.min}</td>
              <td className="rep-mut">{gg.max}</td>
              <td><PadFee f={gg.fee} /></td>
              <td className="rep-mut">{gg.auth}</td>
              <td>
                <span className="api-act" title="View config" onClick={() => view(i)}>👁</span>
                <span className="api-act" title="Quick test" onClick={() => quickTest(i)}>⚡</span>
                <span className="api-act edit" title="Edit" onClick={() => view(i)}>✏</span>
                {gg.st === 'disabled' ? <span className="api-act" title="Enable" onClick={() => toggle(i)}>▶</span>
                  : (gg.st === 'sandbox' || gg.st === 'error') ? <span className="api-act" title="Activate" onClick={() => toggle(i)}>▶</span>
                    : <span className="api-act" title="Pause" onClick={() => toggle(i)}>Ⅱ</span>}
              </td>
            </tr>
          )) : <tr><td colSpan="10" style={{ textAlign: 'center', color: 'var(--muted)', padding: '22px' }}>No gateways match this filter</td></tr>}</tbody>
        </table></div>
      </div>
      <div className="api-console">
        <div className="ach">🧪 Quick Connection Test</div>
        <div className="abody">
          <div className="left">
            <select value={gw} onChange={(e) => setGw(e.target.value)}><option value="">Select Gateway…</option>{gateways.map((gg, i) => <option key={i}>{gg.n}</option>)}</select>
            <select value={op} onChange={(e) => setOp(e.target.value)}><option>Ping / Health Check</option><option>Test Deposit (sandbox)</option><option>Validate Credentials</option><option>Fetch Balance</option></select>
            <input placeholder="Amount (optional)" value={amt} onChange={(e) => setAmt(e.target.value)} />
            <button className="runbtn" onClick={runTest}>▶ Run Test</button>
          </div>
          <div className="api-out">{out == null ? <span className="muted">{'// Select a gateway and operation, then click Run Test'}</span> : out}</div>
        </div>
      </div>

      {g && (
        <div className="modal-ov show" id="pgdModal" onClick={(e) => { if (e.target === e.currentTarget) closePgd(); }}>
          <div className="pm-modal" style={{ maxWidth: '560px' }}>
            <div className="pm-head"><span className="pavatar" style={{ background: 'rgba(244,178,35,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '9px' }}>💳</span>
              <div><div className="nm" id="pgdName">💳 {g.n}</div><div className="meta" id="pgdMeta">{g.type} · {g.cur} · {g.st === 'active' ? 'Live' : g.st}</div></div>
              <button className="apg-x" onClick={closePgd}>×</button></div>
            <div className="pm-body" id="pgdBody">
              <PgdRow k="Channel">{g.n} {g.tags.length ? g.tags.map((t, ti) => <span className="pgd-svc" key={ti}>{t}</span>) : null}</PgdRow>
              <PgdRow k="Type / Currency">{g.type} · {g.cur}</PgdRow>
              <PgdRow k="Status"><span className={`api-st st-${g.st}`}>{g.st}</span> · {g.env === 'live' ? '🚀 Live' : '✏ Sandbox'}</PgdRow>
              <PgdRow k="Deposit Range">{g.min} — {g.max} · fee {g.fee}</PgdRow>
              {c ? (
                <>
                  <PgdRow k="Merchant ID"><span className="pgd-secret"><code>{c.merchant || '—'}</code>{c.merchant && c.merchant !== '—' ? <button className="pgd-eye" onClick={() => pgdCopy(c.merchant, 'Merchant ID')}>Copy</button> : null}</span></PgdRow>
                  <PgdRow k="Encryption"><span className="pgd-mono">{c.enc || '—'}</span></PgdRow>
                  {c.secret ? <PgdRow k="Secret Key"><span className="pgd-secret"><code>{pgdShow ? c.secret : pgdMask(c.secret)}</code><button className="pgd-eye" onClick={() => setPgdShow((v) => !v)}>{pgdShow ? 'Hide' : 'Show'}</button><button className="pgd-eye" onClick={() => pgdCopy(c.secret, 'Secret key')}>Copy</button></span></PgdRow> : null}
                  {c.api ? <PgdRow k="API URL"><a className="pgd-link" href={c.api} target="_blank" rel="noopener noreferrer">{c.api}</a></PgdRow> : null}
                  {c.depUrl ? <PgdRow k="Deposit URL"><span className="pgd-mono">{c.depUrl}</span></PgdRow> : null}
                  {c.payUrl ? <PgdRow k="Payout URL"><span className="pgd-mono">{c.payUrl}</span></PgdRow> : null}
                  {c.callbackUrl ? <PgdRow k="Callback URL"><span className="pgd-mono">{c.callbackUrl}</span></PgdRow> : null}
                  {c.callbackIps && c.callbackIps.length ? <PgdRow k="Callback IPs (inbound)">{c.callbackIps.map((ip, ii) => <span className="pgd-ip" key={ii}>{ip}</span>)}<span className="pgd-warn">whitelist these on our firewall</span></PgdRow> : null}
                  {c.outboundIp ? <PgdRow k="Our Outbound IP"><span className="pgd-ip" style={{ background: 'rgba(58,160,255,.1)', borderColor: 'rgba(58,160,255,.3)', color: 'var(--blue)' }}>{c.outboundIp}</span><span className="pgd-warn">give to provider to whitelist</span></PgdRow> : null}
                  {c.portal ? <PgdRow k="Merchant Portal"><a className="pgd-link" href={c.portal} target="_blank" rel="noopener noreferrer">{c.portal}</a></PgdRow> : null}
                  {(c.portalUser || c.portalPass) ? <PgdRow k="Portal Login"><span className="pgd-mono">{c.portalUser || '—'}</span> / <span className="pgd-secret"><code>{pgdShow ? (c.portalPass || '—') : pgdMask(c.portalPass)}</code></span></PgdRow> : null}
                  {c.settle ? <PgdRow k="Settlement"><span className="pgd-mono">{c.settle}</span></PgdRow> : null}
                  {c.note ? <div className="pgd-note">⚠️ {c.note}</div> : null}
                </>
              ) : (
                <>
                  <PgdRow k="Auth">{g.auth}</PgdRow>
                  <div className="pgd-note">This gateway has no extended API config in the demo. Use <b>Edit</b> on a configured gateway (e.g. GoldPay) to see credentials, endpoints and whitelist IPs.</div>
                </>
              )}
            </div>
            <div className="apg-foot"><span className="sp" style={{ marginLeft: 'auto' }}>
              <button className="btn-cancel" onClick={closePgd}>Close</button>
              <button className="btn-agp-add" id="pgdTestBtn" onClick={pgdTest}>▶ Run Connection Test</button>
            </span></div>
          </div>
        </div>
      )}
    </>
  );
}
