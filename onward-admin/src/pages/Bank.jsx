import { useState } from 'react';
import { Table } from '../components/ui.jsx';
import { useUI } from '../context/UIContext';

// ---- Bank & Payment Gateway (BANKQ) ----
const INITIAL_BANKQ = [
  { n: 'BDO Unibank', ic: '🏦', type: 'bank', acct: '004270012345', cur: 'PHP', dep: 1, wd: 1, minD: 'PHP 100', minW: 'PHP 500', fee: 'Free', on: 1 },
  { n: 'BPI Family Savings', ic: '🏦', type: 'bank', acct: '1234-5678-90', cur: 'PHP', dep: 1, wd: 1, minD: 'PHP 100', minW: 'PHP 500', fee: 'Free', on: 1 },
  { n: 'GCash', ic: '📱', type: 'ewallet', key: 'pk_1••••••••••', acct: '09171234567', cur: 'PHP', dep: 1, wd: 1, minD: 'PHP 50', minW: 'PHP 100', fee: 'Free', on: 1 },
  { n: 'Maya (Paymaya)', ic: '📱', type: 'ewallet', key: 'pk_1••••••••••', acct: '09189876543', cur: 'PHP', dep: 1, wd: 0, minD: 'PHP 50', minW: '—', fee: 'Free', on: 1 },
  { n: 'USDT TRC20', ic: '🔵', type: 'crypto', acct: 'TLmBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', cur: 'USDT', dep: 1, wd: 1, minD: 'USDT 10', minW: 'USDT 10', fee: '1%', on: 1 },
  { n: 'Dragonpay', ic: '⚙️', type: 'gateway', key: 'dp_1••••••••••', acct: 'dragonpay', cur: 'PHP', dep: 1, wd: 0, minD: 'PHP 100', minW: '—', fee: '2.5%', on: 1 },
  { n: 'Paymongo', ic: '⚙️', type: 'gateway', key: 'pk_1••••••••••', acct: 'paymongo', cur: 'PHP', dep: 1, wd: 0, minD: 'PHP 100', minW: '—', fee: '2.9%', on: 0 },
];

const AW_ROUTES = [
  { b: 'GCash', g: 'GCash', max: '₱50,000', on: 1, rate: '94%' },
  { b: 'Maya (Paymaya)', g: 'Maya', max: '₱50,000', on: 1, rate: '91%' },
  { b: 'BDO Unibank', g: 'Dragonpay', max: '₱100,000', on: 1, rate: '88%' },
  { b: 'BPI', g: 'Dragonpay', max: '₱100,000', on: 1, rate: '86%' },
  { b: 'UnionBank', g: 'Paymongo', max: '₱50,000', on: 1, rate: '82%' },
  { b: 'USDT TRC20', g: 'Crypto Direct', max: 'No limit', on: 1, rate: '99%' },
  { b: 'OVO', g: 'Xendit (ID)', max: '₱5,000,000', on: 0, rate: '—' },
  { b: 'Other / Unknown', g: 'Manual Review', max: 'No limit', on: 1, rate: '100%', manual: 1 },
];

const AW_EVENTS = [
  ['2026-06-12 14:31:08', 'Juan dela Cruz', '₱5,000', 'GCash', <span className="route-link">GCash</span>, 1, 'app'],
  ['2026-06-12 14:28:22', 'Maria Santos', '₱12,000', 'BDO Unibank', <span className="route-link">Dragonpay</span>, 1, 'app'],
  ['2026-06-12 14:21:44', 'Pedro Reyes', '₱80,000', 'BPI', <span className="route-link">Dragonpay</span>, 0, 'fail'],
  ['2026-06-12 14:15:09', 'Ana Garcia', '₱3,500', 'Maya (Paymaya)', <span className="route-link">Maya</span>, 1, 'app'],
  ['2026-06-12 13:58:33', 'Carlo Mendoza', '₱200,000', 'BDO Unibank', '—', 1, 'man'],
  ['2026-06-12 13:44:17', 'Rosa Cruz', '₱8,000', 'GCash', <span className="route-link">GCash</span>, 1, 'app'],
  ['2026-06-12 13:30:51', 'Jun Medina', '₱15,000', 'Other / Unknown', <span className="route-link">Manual Review</span>, 1, 'man'],
];

const resBadge = (r) =>
  r === 'app' ? <span className="res-app">✅ Auto-Approved</span>
  : r === 'fail' ? <span className="res-fail">❌ Failed</span>
  : <span className="res-man">👤 Manual Review</span>;

const TABS = [['all', 'All'], ['bank', '🏦 Banks'], ['ewallet', '📱 E-Wallets'], ['crypto', '🔵 Crypto'], ['gateway', '⚙️ Gateways']];

export default function Bank() {
  const { toast } = useUI();
  const [banks, setBanks] = useState(INITIAL_BANKQ);
  const [tab, setTab] = useState('all');
  const [statusF, setStatusF] = useState('');
  const [search, setSearch] = useState('');
  const [routes, setRoutes] = useState(AW_ROUTES);
  const [awActive, setAwActive] = useState(true);
  const [evFilter, setEvFilter] = useState('');

  const bankToggle = (gi, on) => {
    setBanks((prev) => prev.map((b, i) => (i === gi ? { ...b, on: on ? 1 : 0 } : b)));
    toast('Payment channel updated! ' + banks[gi].n + ' ' + (on ? 'enabled ✔' : 'disabled'));
  };

  const items = tab === 'all' ? banks : banks.filter((b) => b.type === tab);
  // bankSearch + bankStatusF were DOM row-hide filters → React state.
  const visible = items.filter((b) => {
    if (statusF !== '' && String(b.on) !== statusF) return false;
    if (search) {
      const hay = (b.ic + ' ' + b.n + ' ' + b.type + ' ' + b.acct + ' ' + b.cur + ' ' + b.minD + ' ' + b.minW + ' ' + b.fee).toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const events = evFilter === '' ? AW_EVENTS : AW_EVENTS.filter((e) => e[6] === evFilter);

  const routeRows = routes.map((r, i) => [
    <b>{r.b}</b>,
    r.manual ? <span className="route-manual">👤 {r.g}</span> : <span className="route-link">➡ {r.g}</span>,
    r.max,
    <label className="switch">
      <input
        type="checkbox"
        checked={!!r.on}
        onChange={(e) => {
          const on = e.target.checked;
          setRoutes((prev) => prev.map((x, idx) => (idx === i ? { ...x, on: on ? 1 : 0 } : x)));
          toast('Route ' + (on ? 'enabled' : 'disabled') + ': ' + r.b);
        }}
      />
      <span className="slider" />
    </label>,
    r.rate === '—' ? '—' : <span className="match-ok">{r.rate}</span>,
  ]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="hero-h">🏦 Bank &amp; Payment Gateway</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>Manage deposit/withdrawal banks, e-wallets and payment gateway API credentials</div>
        </div>
        <span className="pr">
          <button className="btn-search" onClick={() => toast('Add Bank / Gateway — demo')}>＋ Add Bank / Gateway</button>
        </span>
      </div>
      <div className="grid kpi-grid">
        <div className="card kpi g">
          <div className="lbl">Active Channels</div>
          <div className="val">{banks.filter((b) => b.on).length}</div>
          <div className="trend" style={{ color: 'var(--muted)' }}>accepting payments</div>
        </div>
        <div className="card kpi b">
          <div className="lbl">Deposit Methods</div>
          <div className="val">{banks.filter((b) => b.dep && b.on).length}</div>
          <div className="trend" style={{ color: 'var(--muted)' }}>enabled</div>
        </div>
        <div className="card kpi">
          <div className="lbl">Withdrawal Methods</div>
          <div className="val">{banks.filter((b) => b.wd && b.on).length}</div>
          <div className="trend" style={{ color: 'var(--muted)' }}>enabled</div>
        </div>
        <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}>
          <div className="lbl">Gateways Configured</div>
          <div className="val">{banks.filter((b) => b.type === 'gateway').length}</div>
          <div className="trend" style={{ color: 'var(--muted)' }}>with API keys</div>
        </div>
      </div>
      <div className="ptabs" style={{ marginTop: 'var(--pad)' }}>
        {TABS.map((t) => (
          <button key={t[0]} className={`ptab ${tab === t[0] ? 'active' : ''}`} onClick={() => setTab(t[0])}>{t[1]}</button>
        ))}
      </div>
      <div className="card">
        <div className="page-head" style={{ marginBottom: 12 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>All Payment Channels</div>
          <span className="pr" style={{ display: 'flex', gap: 8 }}>
            <select className="qsearch" style={{ width: 'auto' }} value={statusF} onChange={(e) => setStatusF(e.target.value)}>
              <option value="">All Status</option>
              <option value="1">Active</option>
              <option value="0">Disabled</option>
            </select>
            <input className="qsearch" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </span>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table id="bankTbl" style={{ minWidth: 1150 }}>
            <thead>
              <tr>
                <th>Name</th><th>Type</th><th>Account / Address</th><th>Currency</th><th>Deposit</th><th>Withdrawal</th><th>Min Dep</th><th>Min WD</th><th>Fee %</th><th>Status</th><th>Act</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((b) => {
                const gi = banks.indexOf(b);
                return (
                  <tr key={gi} data-on={b.on}>
                    <td>
                      <span className="bk-name">{b.ic} {b.n}</span>
                      {b.key && <div className="bk-key">Key: {b.key}</div>}
                    </td>
                    <td><span className={`typechip tc-${b.type}`}>{b.type}</span></td>
                    <td><span className="acct-mono">{b.acct}</span></td>
                    <td><span className="curchip2">{b.cur}</span></td>
                    <td>{b.dep ? <span className="dep-yes">✓</span> : '—'}</td>
                    <td>{b.wd ? <span className="wd-yes">✓</span> : '—'}</td>
                    <td>{b.minD}</td>
                    <td>{b.minW}</td>
                    <td>{b.fee === 'Free' ? <span className="fee-free">Free</span> : <span className="fee-pct">{b.fee}</span>}</td>
                    <td>
                      <label className="switch">
                        <input type="checkbox" checked={!!b.on} onChange={(e) => bankToggle(gi, e.target.checked)} />
                        <span className="slider" />
                      </label>
                    </td>
                    <td><button className="mini-btn" onClick={() => toast('Edit channel: ' + b.n + ' — demo')}>✏️</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="page-head" style={{ marginTop: 'var(--pad)' }}>
        <div>
          <h1 className="hero-h" style={{ fontSize: '1.15rem' }}>⚡ Auto Withdrawal</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>Automatically route withdrawal requests to the best matching payment gateway based on the player's registered bank / e-wallet</div>
        </div>
        <span className="pr">
          <span className="aw-toggle-card">
            <span>
              <div className="t">Auto Withdrawal</div>
              <div className="d" style={{ color: awActive ? 'var(--green)' : 'var(--red)' }}>{awActive ? 'System is ACTIVE' : 'System is OFF'}</div>
            </span>
            <label className="switch">
              <input
                type="checkbox"
                checked={awActive}
                onChange={(e) => {
                  setAwActive(e.target.checked);
                  toast(e.target.checked ? 'Auto Withdrawal enabled ⚡' : 'Auto Withdrawal disabled');
                }}
              />
              <span className="slider" />
            </label>
          </span>
        </span>
      </div>
      <div className="card">
        <div className="card-title">📄 Global Rules</div>
        <div className="aw-rules">
          <div className="fld"><label>Max Auto Withdrawal per Transaction <span className="dim">(0 = unlimited)</span></label><input defaultValue="₱ 50000" /></div>
          <div className="fld"><label>Minimum Total Wager Requirement <span className="dim">(player must have wagered this)</span></label><input defaultValue="₱ 500" /></div>
          <div className="fld"><label>Wager-to-Deposit Multiplier <span className="dim">(e.g. 1x = wager ≥ deposit amount)</span></label><input defaultValue="1" /></div>
        </div>
        <div style={{ marginTop: 14, textAlign: 'right' }}>
          <button className="btn-search" onClick={() => toast('Auto Withdrawal rules saved! ✔')}>💾 Save Rules</button>
        </div>
      </div>
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="page-head" style={{ marginBottom: 12 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>🔀 Gateway Routing Map</div>
          <span className="pr" style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>Player's bank → Auto-routed gateway</span>
        </div>
        <div className="hint-box">💡 When a player requests a withdrawal, the system checks their registered bank/e-wallet and automatically routes to the matched gateway below. If no match is found, the request falls to <span className="route-link">Manual Review</span>.</div>
        <Table
          cols={['Player Bank / E-Wallet', 'Auto-Route to Gateway', 'Max per TXN', 'Active', 'Match Rate']}
          rows={routeRows}
        />
        <div style={{ marginTop: 12, textAlign: 'right' }}>
          <button className="mini-btn" onClick={() => toast('Auto Withdrawal routes saved! ✔')}>⚙️ Configure Routes</button>
        </div>
      </div>
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="page-head" style={{ marginBottom: 12 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>📄 Recent Auto Withdrawal Events</div>
          <span className="pr">
            <select className="qsearch" style={{ width: 'auto' }} value={evFilter} onChange={(e) => setEvFilter(e.target.value)}>
              <option value="">All Results</option>
              <option value="app">Auto-Approved</option>
              <option value="man">Manual Review</option>
              <option value="fail">Failed</option>
            </select>
          </span>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table id="awEvTbl" style={{ minWidth: 920 }}>
            <thead>
              <tr>
                <th>Timestamp</th><th>Player</th><th>Amount</th><th>Player Bank</th><th>Routed To</th><th>Wager Check</th><th>Result</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e, i) => (
                <tr key={i} data-res={e[6]}>
                  <td>{e[0]}</td>
                  <td><b>{e[1]}</b></td>
                  <td style={{ color: 'var(--gold)', fontWeight: 800 }}>{e[2]}</td>
                  <td>{e[3]}</td>
                  <td>{e[4]}</td>
                  <td>{e[5] ? <span className="wcheck-ok">✓ Met</span> : <span className="wcheck-no">✗ Not met</span>}</td>
                  <td>{resBadge(e[6])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
