import { useState, useEffect } from 'react';
import { Table } from '../components/ui.jsx';
import { useUI } from '../context/UIContext';
import { listBankChannels, createBankChannel, toggleBankChannel, removeBankChannel } from '../services/bankService';
import { getDepositConfig, saveDepositConfig } from '../services/depositConfigService';

// ---- Bank & Payment Gateway — persisted via /api/bank-channels ----
const TYPE_ICON = { bank: '🏦', ewallet: '📱', crypto: '🔵', gateway: '⚙️' };

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
  const [banks, setBanks] = useState([]);
  const [tab, setTab] = useState('all');
  const [statusF, setStatusF] = useState('');
  const [search, setSearch] = useState('');
  const [routes, setRoutes] = useState(AW_ROUTES);
  const [awActive, setAwActive] = useState(true);
  const [evFilter, setEvFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [quickAmts, setQuickAmts] = useState('');
  const [savingQuick, setSavingQuick] = useState(false);

  const load = () => { listBankChannels().then((d) => setBanks(Array.isArray(d) ? d : [])).catch(() => {}); };
  useEffect(() => { load(); }, []);
  useEffect(() => { getDepositConfig().then((c) => { if (Array.isArray(c?.quickAmounts)) setQuickAmts(c.quickAmounts.join(', ')); }).catch(() => {}); }, []);

  const saveQuick = async () => {
    const arr = String(quickAmts).split(',').map((s) => Number(String(s).replace(/[^0-9.]/g, ''))).filter((n) => Number.isFinite(n) && n > 0);
    if (!arr.length) { toast('Enter at least one amount', 'error'); return; }
    setSavingQuick(true);
    try { const r = await saveDepositConfig({ quickAmounts: arr }); setQuickAmts((r.quickAmounts || arr).join(', ')); toast('Quick deposit amounts saved ✔ live for players'); }
    catch (e) { toast('⚠ ' + (e.message || 'Save failed')); }
    finally { setSavingQuick(false); }
  };

  const addChannel = async (c) => {
    try { await createBankChannel(c); toast('Payment channel added ✔ ' + c.n); load(); }
    catch (e) { toast('⚠ ' + (e.message || 'Add failed')); }
  };
  const deleteChannel = async (gi) => {
    const b = banks[gi];
    if (!window.confirm(`Remove payment channel "${b.n}"?`)) return;
    try { await removeBankChannel(b.id); setBanks((prev) => prev.filter((_, i) => i !== gi)); toast('Removed: ' + b.n); }
    catch (e) { toast('⚠ ' + (e.message || 'Delete failed')); }
  };

  const bankToggle = async (gi, on) => {
    const b = banks[gi];
    setBanks((prev) => prev.map((x, i) => (i === gi ? { ...x, on: on ? 1 : 0 } : x)));
    try { await toggleBankChannel(b.id); } catch { load(); }
    toast('Payment channel updated! ' + b.n + ' ' + (on ? 'enabled ✔' : 'disabled'));
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
          <button className="btn-search" onClick={() => setShowAdd(true)}>＋ Add Bank / Gateway</button>
        </span>
      </div>

      {/* Quick deposit amounts — the fast-select chips on the player deposit panel */}
      <div className="card" style={{ marginBottom: 'var(--pad)' }}>
        <div className="card-title">⚡ Quick Deposit Amounts</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>Comma-separated amounts players can tap to rapidly fill the deposit field (e.g. 730, 1000, 2500, 5000, 10000, 25000). Shown as 1K / 2.5K etc.</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={quickAmts} onChange={(e) => setQuickAmts(e.target.value)} placeholder="730, 1000, 2500, 5000, 10000, 25000, 50000"
            style={{ flex: 1, minWidth: 280, padding: '10px 12px', borderRadius: 9, background: 'var(--panel-3,#1b2541)', color: 'var(--text,#fff)', border: '1px solid var(--border,#243049)' }} />
          <button className="btn-search" onClick={saveQuick} disabled={savingQuick}>{savingQuick ? 'Saving…' : '💾 Save'}</button>
        </div>
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
              {visible.length === 0 && (
                <tr><td colSpan="11" style={{ textAlign: 'center', color: 'var(--muted)', padding: '26px' }}>No payment channels. Click <b>＋ Add Bank / Gateway</b> to add one.</td></tr>
              )}
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
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button className="mini-btn" onClick={() => toast('Edit channel: ' + b.n + ' — demo')}>✏️</button>{' '}
                      <button className="del-btn" onClick={() => deleteChannel(gi)}>🗑</button>
                    </td>
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
      {showAdd && <AddChannelModal onClose={() => setShowAdd(false)} onAdd={addChannel} />}
    </>
  );
}

function AddChannelModal({ onClose, onAdd }) {
  const { toast } = useUI();
  const [f, setF] = useState({ n: '', type: 'bank', acct: '', cur: 'PHP', dep: 1, wd: 1, minD: '', minW: '', fee: 'Free', key: '', on: 1 });
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const submit = () => {
    if (!f.n.trim()) { toast('Enter a channel name', 'error'); return; }
    onAdd({ ...f, n: f.n.trim(), ic: TYPE_ICON[f.type] || '🏦', acct: f.acct.trim(), minD: f.minD.trim() || '—', minW: f.minW.trim() || '—', fee: f.fee.trim() || 'Free' });
    onClose();
  };
  const inp = { width: '100%', padding: '10px 12px', borderRadius: 9, background: 'var(--panel-3,#1b2541)', color: 'var(--text,#fff)', border: '1px solid var(--border,#243049)' };
  return (
    <div className="modal-ov show" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', zIndex: 4000, overflowY: 'auto' }}>
      <div style={{ width: 'min(500px,100%)', background: 'var(--card,#131a2c)', border: '1px solid var(--border,#243049)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '15px 18px', borderBottom: '1px solid var(--border,#243049)' }}>
          <span style={{ fontSize: '1.2rem' }}>🏦</span>
          <div style={{ flex: 1, fontWeight: 800, color: 'var(--text,#fff)' }}>Add Bank / Gateway</div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.08)', border: 'none', color: '#fff', width: 30, height: 30, borderRadius: 8, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div><label className="fld-lbl">Name <span style={{ color: 'var(--red,#ff4d5e)' }}>*</span></label><input style={inp} value={f.n} onChange={(e) => set('n', e.target.value)} placeholder="e.g. GCash / BDO Unibank" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label className="fld-lbl">Type</label>
              <select style={inp} value={f.type} onChange={(e) => set('type', e.target.value)}>
                <option value="bank">Bank</option><option value="ewallet">E-Wallet</option><option value="crypto">Crypto</option><option value="gateway">Gateway</option>
              </select>
            </div>
            <div><label className="fld-lbl">Currency</label><input style={inp} value={f.cur} onChange={(e) => set('cur', e.target.value)} placeholder="PHP / USDT…" /></div>
          </div>
          <div><label className="fld-lbl">Account / Address</label><input style={inp} value={f.acct} onChange={(e) => set('acct', e.target.value)} placeholder="account no. / wallet address" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div><label className="fld-lbl">Min Dep</label><input style={inp} value={f.minD} onChange={(e) => set('minD', e.target.value)} placeholder="PHP 100" /></div>
            <div><label className="fld-lbl">Min WD</label><input style={inp} value={f.minW} onChange={(e) => set('minW', e.target.value)} placeholder="PHP 500" /></div>
            <div><label className="fld-lbl">Fee</label><input style={inp} value={f.fee} onChange={(e) => set('fee', e.target.value)} placeholder="Free / 2.5%" /></div>
          </div>
          <div style={{ display: 'flex', gap: 18 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text,#fff)', fontSize: 14 }}><input type="checkbox" checked={!!f.dep} onChange={(e) => set('dep', e.target.checked ? 1 : 0)} /> Deposit</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text,#fff)', fontSize: 14 }}><input type="checkbox" checked={!!f.wd} onChange={(e) => set('wd', e.target.checked ? 1 : 0)} /> Withdrawal</label>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', padding: '14px 18px', borderTop: '1px solid var(--border,#243049)' }}>
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-search" onClick={submit}>＋ Add Channel</button>
        </div>
      </div>
    </div>
  );
}
