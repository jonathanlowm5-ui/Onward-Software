import { useEffect, useState } from 'react';
import { useUI } from '../context/UIContext';
import { Table } from '../components/ui.jsx';
import { listPromotions, togglePromotion, removePromotion } from '../services/promotionService';

/* ---------- demo data (fallbacks) ---------- */
const DEMO_PROMOS = [
  { n: '200% Welcome Bonus', d: 'Get 200% on your first deposit up to ₱10,000', t: 'welcome', tc: 'vt-pct', b: '200%', mx: 'max ₱10,000', md: '₱500', w: '30x', to: '0x', cl: '1,842', ex: 'No expiry', on: 1 },
  { n: 'Daily 50% Reload', d: '50% reload every day on your deposits', t: 'deposit', tc: 'vt-cash', b: '50%', mx: 'max ₱5,000', md: '₱200', w: '20x', to: '0x', cl: '8,421', ex: 'No expiry', on: 1 },
  { n: 'Refer & Earn ₱500', d: 'Earn ₱500 for every friend you refer', t: 'referral', tc: 'vt-cash', b: '₱500', mx: 'max ₱500', md: '₱0', w: '10x', to: '0x', cl: '620', ex: 'No expiry', on: 1 },
  { n: 'Weekly Cashback 10%', d: 'Get 10% cashback on net losses every week', t: 'cashback', tc: 'vt-fs', b: '10%', mx: 'max ₱20,000', md: '₱1,000', w: '5x', to: '0x', cl: '3,102', ex: 'No expiry', on: 1 },
  { n: '100 Free Spins', d: '100 free spins on selected slots', t: 'freespin', tc: 'vt-nd', b: '100 spins', mx: 'max ₱0', md: '₱300', w: '40x', to: '0x', cl: '1,240', ex: '2025-12-31T23:59', on: 0 },
];

const PROMO_TABS = [['promos', '🎁 Promotions'], ['mini', '🎰 Mini Games'], ['bigwins', '⚡ Big Wins'], ['settings', '⚙️ Settings'], ['tier', '👑 Tier Control'], ['kyc', '✅ KYC Bonus']];

const INITIAL_SLICES = [
  { l: '₱50 Cash', p: 50, w: 30, c: '#e8253a', on: 1 },
  { l: '₱100 Cash', p: 100, w: 20, c: '#f4b223', on: 1 },
  { l: '₱200 Cash', p: 200, w: 15, c: '#2ecc71', on: 1 },
  { l: 'Free Spin x3', p: 3, w: 12, c: '#3ab7ff', on: 1 },
  { l: '₱500 Cash', p: 500, w: 8, c: '#a86dff', on: 1 },
  { l: '₱1,000 Cash', p: 1000, w: 5, c: '#ff7a1a', on: 1 },
  { l: 'Try Again', p: 0, w: 7, c: '#14182a', on: 1 },
  { l: '₱5,000 JACKPOT', p: 5000, w: 3, c: '#f7e08b', on: 1 },
];

const INITIAL_BIGWINS = [
  { g: 'Coin Splash Dice', ic: '🎲', pl: 'Use***', m: 16, pz: '₱ 2,772.64', cat: 'Slots', on: 1 },
  { g: 'Fortune Mouse', ic: '🐭', pl: 'bim90***', m: 20, pz: '₱ 6,150.50', cat: 'Slots', on: 1 },
  { g: 'Demi Gods VI', ic: '⚡', pl: 'eduar***', m: 34, pz: '₱ 4,440.66', cat: 'Slots', on: 1 },
  { g: 'Fire 4: Cash', ic: '🔥', pl: 'Use***', m: 10, pz: '₱ 4,158.96', cat: 'Slots', on: 1 },
  { g: 'Wild Tiger 2', ic: '🐯', pl: 'play***', m: 55, pz: '₱ 12,440.00', cat: 'Slots', on: 1 },
  { g: 'Lucky Coins', ic: '🪙', pl: 'jorg***', m: 28, pz: '₱ 8,920.00', cat: 'Slots', on: 1 },
  { g: 'Elvis Frog', ic: '🐸', pl: 'mar***', m: 42, pz: '₱ 9,310.00', cat: 'Slots', on: 1 },
  { g: 'Plinko', ic: '🎯', pl: 'tan***', m: 18, pz: '₱ 3,640.00', cat: 'Crash', on: 1 },
  { g: 'Book of Crown', ic: '📘', pl: 'vik***', m: 31, pz: '₱ 7,200.00', cat: 'Slots', on: 1 },
  { g: 'Thunder Crown', ic: '👑', pl: 'ana***', m: 60, pz: '₱ 18,500.00', cat: 'Slots', on: 1 },
];

const TIER_RC_INIT = [
  { n: 'Novice', c: '#8a7f78', fs: 1, mx: 3, sc: 50, jr: '1', tm: '1', pb: 0, on: 1 },
  { n: 'Sender', c: '#3aa0ff', fs: 1, mx: 5, sc: 40, jr: '1.5', tm: '1.2', pb: 5, on: 1 },
  { n: 'Gambler', c: '#4f8fe8', fs: 2, mx: 5, sc: 35, jr: '2', tm: '1.5', pb: 10, on: 1 },
  { n: 'Leery', c: '#9b6dff', fs: 2, mx: 7, sc: 30, jr: '2.5', tm: '1.8', pb: 15, on: 1 },
  { n: 'Sharple', c: '#a86dff', fs: 3, mx: 7, sc: 25, jr: '3', tm: '2', pb: 20, on: 1 },
  { n: 'Expert', c: '#b07aff', fs: 3, mx: 10, sc: 20, jr: '3.5', tm: '2.5', pb: 25, on: 1 },
  { n: 'Master', c: '#ff4d5e', fs: 5, mx: 10, sc: 15, jr: '4', tm: '3', pb: 30, on: 1 },
  { n: 'Boss', c: '#ff6675', fs: 5, mx: 15, sc: 10, jr: '5', tm: '4', pb: 40, on: 1 },
  { n: 'Major', c: '#f4b223', fs: 7, mx: 20, sc: 0, jr: '6', tm: '5', pb: 50, on: 1 },
  { n: 'Grand', c: '#7ec8ff', fs: 10, mx: 999, sc: 0, jr: '8', tm: '8', pb: 75, on: 1 },
];

const KB_AWARDS = [
  ['mar***', 'kb-prog', 'In Progress', 45],
  ['jorg***', 'kb-done', 'Completed', 100],
  ['eduar***', 'kb-prog', 'In Progress', 30],
  ['Use***', 'kb-wd', 'Withdrawn', 100],
  ['tan***', 'kb-pend', 'Pending', 0],
  ['ana***', 'kb-prog', 'In Progress', 22],
];

/* normalize a server promotion record to the demo shape */
function normalizePromo(p) {
  if (p && p.n && p.tc) return p;
  return {
    n: p.name || p.title || p.n || '—',
    d: p.description || p.d || '—',
    t: p.type || p.t || 'welcome',
    tc: p.tc || 'vt-pct',
    b: p.bonus || p.b || '—',
    mx: p.max || p.mx || 'max ₱0',
    md: p.minDeposit || p.md || '₱0',
    w: p.wager || p.w || '0x',
    to: p.turnover || p.to || '0x',
    cl: p.claims || p.cl || '0',
    ex: p.expiry || p.ex || 'No expiry',
    on: (p.active ?? p.on) ? 1 : 0,
    id: p.id ?? p._id,
  };
}

/* ===================== sub-views ===================== */

function PromosTab({ promos, setPromos, loading }) {
  const { toast } = useUI();
  const [typeF, setTypeF] = useState('');
  const [query, setQuery] = useState('');

  const visible = (x) => (!typeF || x.t === typeF) && x.n.toLowerCase().includes(query.toLowerCase());

  const onToggle = async (idx, checked) => {
    const x = promos[idx];
    setPromos((prev) => prev.map((p, i) => (i === idx ? { ...p, on: checked ? 1 : 0 } : p)));
    if (x.id != null) {
      try { await togglePromotion(x.id); } catch { /* keep optimistic state on demo/offline */ }
    }
    toast(`${x.n} ${checked ? 'activated ✔' : 'deactivated'}`);
  };
  const onDelete = async (idx) => {
    const x = promos[idx];
    setPromos((prev) => prev.filter((_, i) => i !== idx));
    if (x.id != null) {
      try { await removePromotion(x.id); } catch { /* */ }
    }
    toast(`Promotion deleted: ${x.n}`);
  };

  return (
    <>
      <div className="grid kpi-grid">
        <div className="card kpi"><div className="lbl">Total Promos</div><div className="val">{loading ? '…' : promos.length}</div><div className="trend" style={{ color: 'var(--muted)' }}>all packages</div></div>
        <div className="card kpi g"><div className="lbl">Active</div><div className="val">{promos.filter((x) => x.on).length}</div><div className="trend" style={{ color: 'var(--muted)' }}>running now</div></div>
        <div className="card kpi b"><div className="lbl">Total Claims</div><div className="val">15.2K</div><div className="trend" style={{ color: 'var(--muted)' }}>all time</div></div>
        <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">Bonus Paid Out</div><div className="val">₱2.4M</div><div className="trend" style={{ color: 'var(--muted)' }}>this month</div></div>
      </div>
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="page-head" style={{ marginBottom: 12 }}><div className="card-title" style={{ marginBottom: 0 }}>Promotion Packages</div>
          <span className="pr" style={{ display: 'flex', gap: 8 }}>
            <select className="qsearch" style={{ width: 'auto' }} value={typeF} onChange={(e) => setTypeF(e.target.value)}><option value="">All Types</option><option>welcome</option><option>deposit</option><option>referral</option><option>cashback</option><option>freespin</option></select>
            <input className="qsearch" placeholder="Search promo…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </span>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table style={{ minWidth: 1100 }}>
          <thead><tr><th>Promotion</th><th>Type</th><th>Bonus</th><th>Min Dep</th><th>Wager</th><th>Turnover</th><th>Claims</th><th>Expiry</th><th>Active</th><th>Actions</th></tr></thead>
          <tbody>{promos.map((x, i) => (
            <tr key={x.id ?? i} style={{ display: visible(x) ? '' : 'none' }}>
              <td className="promo-cell"><div className="pn">{x.n}</div><div className="pd">{x.d}</div></td>
              <td><span className={`vtype ${x.tc}`}>{x.t}</span></td>
              <td className="bonus-cell">{x.b}<span className="mx">{x.mx}</span></td>
              <td>{x.md}</td><td className="wager-b">{x.w}</td><td className="turn-o">{x.to}</td>
              <td style={{ fontWeight: 800 }}>{x.cl}</td>
              <td style={x.on ? undefined : { color: 'var(--muted)' }}>{x.ex}</td>
              <td><label className="switch"><input type="checkbox" checked={!!x.on} onChange={(e) => onToggle(i, e.target.checked)} /><span className="slider"></span></label></td>
              <td><button className="mini-btn gold" onClick={() => toast(`Edit promo: ${x.n} — demo`)}>✏️ Edit</button> <button className="del-btn" onClick={() => onDelete(i)}>🗑</button></td>
            </tr>
          ))}</tbody>
        </table></div>
      </div>
    </>
  );
}

function wheelGrad(slices) {
  const act = slices.filter((x) => x.on);
  const tot = act.reduce((a, x) => a + x.w, 0) || 1;
  let acc = 0;
  return 'conic-gradient(' + act.map((x) => {
    const f = (acc / tot) * 360; acc += x.w; const t2 = (acc / tot) * 360;
    return `${x.c} ${f.toFixed(1)}deg ${t2.toFixed(1)}deg`;
  }).join(',') + ')';
}

function MgWheel({ slices, setSlices }) {
  const { toast } = useUI();
  const [rot, setRot] = useState(0);
  const tot = slices.filter((x) => x.on).reduce((a, x) => a + x.w, 0);

  const update = (idx, key, val) => setSlices((prev) => prev.map((s, i) => (i === idx ? { ...s, [key]: val } : s)));
  const addSlice = () => { setSlices((prev) => [...prev, { l: 'New Prize', p: 0, w: 5, c: '#3aa0ff', on: 1 }]); toast('Slice added ＋'); };
  const removeSlice = (idx) => { setSlices((prev) => prev.filter((_, i) => i !== idx)); toast('Slice removed'); };
  const spinTest = () => {
    const next = rot + 1080 + Math.floor(Math.random() * 360);
    setRot(next);
    const act = slices.filter((x) => x.on);
    const total = act.reduce((a, x) => a + x.w, 0) || 1;
    let r = Math.random() * total; let win = act[0];
    for (const x of act) { r -= x.w; if (r <= 0) { win = x; break; } }
    setTimeout(() => toast('🎡 Spin result: ' + win.l + (win.p > 0 ? ' — ₱' + win.p.toLocaleString() : '') + ' !'), 2400);
  };

  return (
    <div className="wheel-grid">
      <div className="card">
        <div className="page-head" style={{ marginBottom: 12 }}><div className="card-title" style={{ marginBottom: 0 }}>🎡 Wheel Slices</div>
          <span className="pr"><button className="mini-btn" style={{ background: 'rgba(58,160,255,.18)', borderColor: 'var(--blue)', color: 'var(--blue)' }} onClick={addSlice}>＋ Add Slice</button></span>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table style={{ minWidth: 520 }}>
          <thead><tr><th>Label</th><th>Prize</th><th>Weight %</th><th>Colour</th><th>Active</th><th>Del</th></tr></thead>
          <tbody>{slices.map((x, i) => (
            <tr key={i}>
              <td><input className="slice-in" value={x.l} onChange={(e) => update(i, 'l', e.target.value)} /></td>
              <td><input className="slice-in num" style={{ color: 'var(--gold)' }} value={x.p} onChange={(e) => update(i, 'p', parseInt(e.target.value) || 0)} /></td>
              <td><input className="slice-in num" value={x.w} onChange={(e) => update(i, 'w', parseInt(e.target.value) || 0)} /></td>
              <td><span className="swatch" style={{ background: x.c }}></span></td>
              <td><label className="switch"><input type="checkbox" checked={!!x.on} onChange={(e) => update(i, 'on', e.target.checked ? 1 : 0)} /><span className="slider"></span></label></td>
              <td><button className="del-x" onClick={() => removeSlice(i)}>✕</button></td>
            </tr>
          ))}</tbody>
        </table></div>
        <div className="tw-row"><span style={{ color: 'var(--muted)' }}>Total Weight:</span><span className={tot === 100 ? 'tw-ok' : 'tw-bad'}>{tot}%</span></div>
      </div>
      <div>
        <div className="card"><div className="card-title" style={{ textAlign: 'center' }}>Live Preview</div>
          <div className="wheel-wrap">
            <div className="wheel-disc" style={{ background: wheelGrad(slices), transform: `rotate(${rot}deg)` }}><span className="wheel-hub">🎡</span></div>
            <button className="spin-btn" onClick={spinTest}>▶ Spin Test</button>
          </div>
        </div>
        <div className="card" style={{ marginTop: 'var(--pad)' }}><div className="card-title">📊 Wheel Stats</div>
          <div className="wstat-row"><span className="k">Total Spins Today</span><span className="v">911</span></div>
          <div className="wstat-row"><span className="k">Spins This Month</span><span className="v">21,620</span></div>
          <div className="wstat-row"><span className="k">Total Prize Paid</span><span className="v" style={{ color: 'var(--gold)' }}>₱249,674</span></div>
          <div className="wstat-row"><span className="k">Most Won Prize</span><span className="v" style={{ color: 'var(--green)' }}>₱100 Cash</span></div>
        </div>
      </div>
    </div>
  );
}

function MgTicket() {
  const { toast } = useUI();
  return (
    <div className="lt-grid">
      <div className="card">
        <div className="page-head" style={{ marginBottom: 12 }}><div className="card-title" style={{ marginBottom: 0 }}>🎟️ Ticket Prize Pool</div>
          <span className="pr"><button className="gen-btn" onClick={() => toast('Ticket pool generated 🔄 10,000 tickets')}>🔄 Generate</button></span>
        </div>
        <div className="fld" style={{ marginBottom: 12 }}><label>Draw Date &amp; Time</label><input defaultValue="07/01/2026 08:00 PM" /></div>
        <div className="pm-grid">
          <div className="pm-fld"><label>Total Tickets</label><input defaultValue="10000" /></div>
          <div className="pm-fld"><label>Winners Count</label><input defaultValue="50" /></div>
        </div>
        <div className="fld" style={{ margin: '12px 0' }}><label>Ticket Format</label><select><option>6-Digit Number (000000–999999)</option><option>8-Char Alphanumeric</option><option>4-Digit Number</option></select></div>
        <div className="fld" style={{ marginBottom: 12 }}><label>Earn Ticket By</label><select><option>Every ₱100 deposited</option><option>Every ₱500 wagered</option><option>Daily login</option></select></div>
        <div className="pm-grid">
          <div className="pm-fld"><label>Min Deposit (₱)</label><input defaultValue="₱ 100" /></div>
          <div className="pm-fld"><label>Min Wager (₱)</label><input defaultValue="₱ 500" /></div>
        </div>
        <button className="runbtn" onClick={() => toast('🎯 Draw executed! 50 winners selected — results published')}>🎯 Run Draw Now</button>
      </div>
      <div>
        <div className="card"><div className="card-title">🏆 Prize Tiers</div>
          <Table cols={['Rank', 'Prize', 'Winners']} rows={[
            [<b key="r">🥇 1st</b>, <span key="p" style={{ color: 'var(--gold)', fontWeight: 900 }}>₱50,000 Cash</span>, '1'],
            [<b key="r">🥈 2nd</b>, <span key="p" style={{ color: 'var(--gold)', fontWeight: 900 }}>₱20,000 Cash</span>, '3'],
            [<b key="r">🥉 3rd</b>, <span key="p" style={{ color: 'var(--gold)', fontWeight: 900 }}>₱10,000 Cash</span>, '5'],
            [<b key="r">4th–10th</b>, <span key="p" style={{ color: 'var(--gold)', fontWeight: 900 }}>₱5,000 Cash</span>, '7'],
            [<b key="r">11th–30th</b>, <span key="p" style={{ color: 'var(--gold)', fontWeight: 900 }}>₱1,000 Cash</span>, '20'],
            [<b key="r">31st–50th</b>, <span key="p" style={{ color: 'var(--gold)', fontWeight: 900 }}>₱500 Cash</span>, '20'],
          ]} style={{ border: 'none', borderRadius: 0 }} />
        </div>
        <div className="card" style={{ marginTop: 'var(--pad)' }}><div className="card-title">📄 Recent Draws</div>
          <Table cols={['Date', 'Winners', 'Paid', 'Status']} rows={[
            ['2026-05-31', '50 winners', <span key="p" style={{ color: 'var(--gold)', fontWeight: 900 }}>₱210,000</span>, <span key="s" className="badge ok">completed</span>],
            ['2026-04-30', '50 winners', <span key="p" style={{ color: 'var(--gold)', fontWeight: 900 }}>₱195,000</span>, <span key="s" className="badge ok">completed</span>],
            ['2026-03-31', '50 winners', <span key="p" style={{ color: 'var(--gold)', fontWeight: 900 }}>₱180,000</span>, <span key="s" className="badge ok">completed</span>],
          ]} style={{ border: 'none', borderRadius: 0 }} />
        </div>
      </div>
    </div>
  );
}

function MgSettings() {
  const { toast } = useUI();
  return (
    <div className="mgs-grid">
      <div className="card"><div className="card-title">🎡 Fortune Wheel Settings</div>
        <div className="kb-tgl"><label className="switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label>Wheel Enabled</div>
        <div className="kb-tgl"><label className="switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label>Show on Login</div>
        <div className="kb-tgl"><label className="switch"><input type="checkbox" /><span className="slider"></span></label>Require Deposit to Spin</div>
        <div className="kb-tgl" style={{ marginBottom: 8 }}><label className="switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label>Sound Effects</div>
        <div className="fld" style={{ marginBottom: 12 }}><label>Free Spins per Day</label><input defaultValue="1" /></div>
        <div className="fld" style={{ marginBottom: 12 }}><label>Paid Spin Cost (₱)</label><input defaultValue="50" /></div>
        <div className="fld" style={{ marginBottom: 12 }}><label>Max Spins per Day (per player)</label><input defaultValue="5" /></div>
        <div className="fld"><label>Reset Time</label><select><option>00:00 (Midnight)</option><option>06:00</option><option>12:00 (Noon)</option><option>18:00</option></select></div>
      </div>
      <div>
        <div className="card"><div className="card-title">🎟️ Lucky Ticket Settings</div>
          <div className="kb-tgl"><label className="switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label>Lucky Ticket Enabled</div>
          <div className="kb-tgl"><label className="switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label>Auto-assign on Deposit</div>
          <div className="kb-tgl"><label className="switch"><input type="checkbox" /><span className="slider"></span></label>Allow Ticket Transfer</div>
          <div className="kb-tgl"><label className="switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label>Email Notification on Win</div>
          <div className="kb-tgl" style={{ marginBottom: 8 }}><label className="switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label>SMS Notification on Win</div>
          <div className="fld" style={{ marginBottom: 12 }}><label>Max Tickets per Player</label><input defaultValue="50" /></div>
          <div className="fld" style={{ marginBottom: 12 }}><label>Prize Claim Period (days)</label><input defaultValue="7" /></div>
          <div className="fld"><label>Draw Frequency</label><select><option>Daily</option><option>Weekly</option><option>Monthly</option></select></div>
        </div>
        <div style={{ marginTop: 'var(--pad)', textAlign: 'right' }}><button className="btn-search" onClick={() => toast('Mini game settings saved! ✔')}>💾 Save Settings</button></div>
      </div>
    </div>
  );
}

function MiniTab({ slices, setSlices }) {
  const { toast } = useUI();
  const [mgTab, setMgTab] = useState('wheel');
  return (
    <>
      <div className="mg-pills">
        <button className={`mg-pill ${mgTab === 'wheel' ? 'active' : ''}`} onClick={() => setMgTab('wheel')}>🎡 Fortune Wheel</button>
        <button className={`mg-pill ${mgTab === 'ticket' ? 'active' : ''}`} onClick={() => setMgTab('ticket')}>🎟️ Lucky Ticket</button>
        <button className={`mg-pill ${mgTab === 'set' ? 'active' : ''}`} onClick={() => setMgTab('set')}>⚙️ Settings</button>
      </div>
      {mgTab === 'wheel' ? <MgWheel slices={slices} setSlices={setSlices} /> : mgTab === 'ticket' ? <MgTicket /> : <MgSettings />}
    </>
  );
}

function BigwinsTab({ bigwins, setBigwins }) {
  const { toast } = useUI();
  const [catF, setCatF] = useState('');
  const [query, setQuery] = useState('');
  const visible = (x) => (!catF || x.cat === catF) && (x.g + ' ' + x.pl).toLowerCase().includes(query.toLowerCase());

  const toggle = (idx, checked) => {
    const x = bigwins[idx];
    setBigwins((prev) => prev.map((b, i) => (i === idx ? { ...b, on: checked ? 1 : 0 } : b)));
    toast(`${x.g} ${checked ? 'shown on strip ✔' : 'hidden from strip'}`);
  };
  const del = (idx) => { const x = bigwins[idx]; setBigwins((prev) => prev.filter((_, i) => i !== idx)); toast(`Entry deleted: ${x.g}`); };

  const tickerChips = bigwins.filter((x) => x.on).map((x, i) => (
    <span key={i} className="tick-chip"><span className="ti">{x.ic}</span><span><div className="tn">{x.g}</div><div className="tm">{x.pl} · x{x.m}</div></span><span className="tp">{x.pz}</span></span>
  ));

  return (
    <>
      <div className="page-head">
        <div><h1 className="hero-h" style={{ fontSize: '1.15rem' }}>⚡ Big Wins — Casino Front End</h1><div className="hero-sub" style={{ marginBottom: 0 }}>Control what appears in the Big Wins scrolling strip on the casino homepage</div></div>
        <span className="pr" style={{ display: 'flex', gap: 8 }}><button className="mini-btn" onClick={() => toast('Strip refreshed 🔄')}>🔄 Refresh</button><button className="btn-search" onClick={() => toast('Add Win — demo')}>＋ Add Win</button></span>
      </div>
      <div className="grid kpi-grid">
        <div className="card kpi"><div className="lbl">Total Entries</div><div className="val">{bigwins.length}</div><div className="trend" style={{ color: 'var(--muted)' }}>in strip</div></div>
        <div className="card kpi g"><div className="lbl">Active</div><div className="val">{bigwins.filter((x) => x.on).length}</div><div className="trend" style={{ color: 'var(--muted)' }}>showing now</div></div>
        <div className="card kpi b"><div className="lbl">Highest Win</div><div className="val">₱18,500.00</div></div>
        <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">Strip Status</div><div className="val" style={{ fontSize: '1rem', color: 'var(--green)' }}>● LIVE</div><label className="switch"><input type="checkbox" defaultChecked onChange={(e) => toast(e.target.checked ? 'Strip is LIVE ●' : 'Strip paused')} /><span className="slider"></span></label></div>
      </div>
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="page-head" style={{ marginBottom: 12 }}><div className="card-title" style={{ marginBottom: 0 }}>⚡ Big Win Entries</div>
          <span className="pr" style={{ display: 'flex', gap: 8 }}>
            <select className="qsearch" style={{ width: 'auto' }} value={catF} onChange={(e) => setCatF(e.target.value)}><option value="">All Categories</option><option>Slots</option><option>Crash</option></select>
            <input className="qsearch" placeholder="Search game or player…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </span>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table style={{ minWidth: 1020 }}>
          <thead><tr><th>Game</th><th>Icon</th><th>Player</th><th>Multiplier</th><th>Prize</th><th>Category</th><th>Show on Strip</th><th>Actions</th></tr></thead>
          <tbody>{bigwins.map((x, i) => (
            <tr key={i} style={{ display: visible(x) ? '' : 'none' }}>
              <td><span className="bw-icon">{x.ic}</span><b>{x.g}</b></td><td style={{ fontSize: '1.05rem' }}>{x.ic}</td>
              <td><span className="mask">{x.pl}</span></td><td className="mult">x{x.m}</td>
              <td className="prize-g">{x.pz}</td><td>{x.cat === 'Crash' ? '💥 Crash' : '🎰 Slots'}</td>
              <td><label className="switch"><input type="checkbox" checked={!!x.on} onChange={(e) => toggle(i, e.target.checked)} /><span className="slider"></span></label></td>
              <td><button className="mini-btn gold" onClick={() => toast(`Edit win: ${x.g} — demo`)}>✏️</button> <button className="del-btn" onClick={() => del(i)}>🗑</button></td>
            </tr>
          ))}</tbody>
        </table></div>
      </div>
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="page-head" style={{ marginBottom: 0 }}><div className="card-title" style={{ marginBottom: 0 }}>🖥️ Casino Strip Preview — Live Ticker</div>
          <span className="pr" style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 800 }}>Speed: <select className="qsearch" style={{ width: 'auto' }}><option value="30s">Normal</option><option value="16s">Fast</option><option value="55s">Slow</option></select> Pause on hover <label className="switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label></span>
        </div>
        <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 800, padding: '10px 2px 0' }}>⚡ Big Wins</div>
        <div className="ticker-shell paused"><div className="ticker-track">{tickerChips}{tickerChips}</div></div>
        <div className="live-note">● Live — changes here reflect immediately on the casino homepage</div>
      </div>
    </>
  );
}

function TierTab({ tiers, setTiers }) {
  const { toast } = useUI();
  const update = (idx, key, val) => setTiers((prev) => prev.map((t, i) => (i === idx ? { ...t, [key]: val } : t)));
  return (
    <>
      <div className="hintbar">👑<span>Configure different spin rates and ticket multipliers per VIP tier. Higher tiers get better odds and more free spins.</span></div>
      <div className="card"><div className="card-title">👑 Tier Rate Control</div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table style={{ minWidth: 980 }}>
          <thead><tr><th>VIP Tier</th><th>Free Spins/Day</th><th>Max Spins/Day</th><th>Spin Cost (₱)</th><th style={{ color: 'var(--gold)' }}>Jackpot Rate %</th><th style={{ color: 'var(--blue)' }}>Ticket Multiplier</th><th style={{ color: 'var(--green)' }}>Prize Boost %</th><th>Enabled</th></tr></thead>
          <tbody>{tiers.map((t, i) => (
            <tr key={i}>
              <td><span className="tdot" style={{ background: t.c }}></span><b>{t.n}</b></td>
              <td><input className="slice-in num" style={{ color: 'var(--text)' }} value={t.fs} onChange={(e) => update(i, 'fs', e.target.value)} /></td>
              <td><input className="slice-in num" style={{ color: 'var(--text)' }} value={t.mx} onChange={(e) => update(i, 'mx', e.target.value)} /></td>
              <td><input className="slice-in num" style={{ color: 'var(--text)' }} value={t.sc} onChange={(e) => update(i, 'sc', e.target.value)} /></td>
              <td><input className="slice-in num rate-g" value={t.jr} onChange={(e) => update(i, 'jr', e.target.value)} /></td>
              <td><input className="slice-in num rate-b" value={t.tm} onChange={(e) => update(i, 'tm', e.target.value)} /></td>
              <td><input className="slice-in num rate-gr" value={t.pb} onChange={(e) => update(i, 'pb', e.target.value)} /></td>
              <td><label className="switch"><input type="checkbox" checked={!!t.on} onChange={(e) => { update(i, 'on', e.target.checked ? 1 : 0); toast(`${t.n} tier ${e.target.checked ? 'enabled ✔' : 'disabled'}`); }} /><span className="slider"></span></label></td>
            </tr>
          ))}</tbody>
        </table></div>
        <div style={{ marginTop: 14, textAlign: 'right' }}><button className="btn-search" onClick={() => toast('Tier rates saved! ✔ 10 tiers updated')}>💾 Save Tier Rates</button></div>
      </div>
    </>
  );
}

function KycTab() {
  const { toast } = useUI();
  const [wm, setWm] = useState('5');
  return (
    <>
      <div className="hintbar green">✅<span>Players receive this bonus <b>automatically</b> when their KYC verification is approved. Configure the bonus amount, deposit trigger and withdrawal turnover below.</span></div>
      <div className="grid kpi-grid">
        <div className="card kpi g"><div className="lbl">KYC Approved (Today)</div><div className="val">3</div></div>
        <div className="card kpi"><div className="lbl">Bonuses Issued (Month)</div><div className="val">109</div></div>
        <div className="card kpi b"><div className="lbl">Total Bonus Paid Out</div><div className="val">₱55,782</div></div>
        <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">Bonus Enabled</div><div className="val" style={{ fontSize: '1rem', color: 'var(--green)' }}>● ACTIVE</div><label className="switch"><input type="checkbox" defaultChecked onChange={(e) => toast(e.target.checked ? 'KYC bonus ACTIVE ●' : 'KYC bonus disabled')} /><span className="slider"></span></label></div>
      </div>
      <div className="kb-grid" style={{ marginTop: 'var(--pad)' }}>
        <div className="card"><div className="card-title">🧧 Bonus Configuration</div>
          <div className="fld" style={{ marginBottom: 12 }}><label>Bonus Type</label><select><option>Fixed Amount (₱)</option><option>% of First Deposit</option></select></div>
          <div className="fld" style={{ marginBottom: 12 }}><label>Bonus Amount (₱)</label><input defaultValue="₱ 500" /></div>
          <div className="fld" style={{ marginBottom: 12 }}><label>Max Bonus Cap (₱) <span style={{ color: 'var(--muted)', fontWeight: 700 }}>(for % type)</span></label><input defaultValue="₱ 5000" /></div>
          <div className="fld" style={{ marginBottom: 12 }}><label>Trigger</label><select><option>On KYC Approval (instant, no deposit needed)</option><option>On first deposit after KYC</option></select></div>
          <div className="fld" style={{ marginBottom: 12 }}><label>Minimum Deposit (₱)</label><input defaultValue="₱ 100" /></div>
          <div className="fld" style={{ marginBottom: 8 }}><label>Bonus Expiry (days after issuance)</label><input defaultValue="7" /></div>
          <div className="kb-tgl"><label className="switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label>One-time per player only</div>
          <div className="kb-tgl"><label className="switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label>Auto-credit on approval</div>
          <div className="kb-tgl"><label className="switch"><input type="checkbox" /><span className="slider"></span></label>SMS notification on award</div>
          <div className="kb-tgl"><label className="switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label>Email notification on award</div>
        </div>
        <div>
          <div className="card"><div className="card-title">🔄 Turnover / Withdrawal Requirement</div>
            <div className="fld" style={{ marginBottom: 4 }}><label>Wager Multiplier</label></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><input className="wm-box" value={wm} onChange={(e) => setWm(e.target.value)} /><span style={{ color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>× bonus amount must be wagered before withdrawal</span></div>
            <div className="wm-hint">e.g. ₱500 bonus × {wm || 0} = <b>₱{((parseInt(wm) || 0) * 500).toLocaleString()}</b> must be wagered before withdrawal</div>
            <div className="fld" style={{ marginBottom: 12 }}><label>Applicable Games for Turnover</label><select><option>All Games</option><option>Slots only</option><option>Exclude Live Casino</option></select></div>
            <div className="fld" style={{ marginBottom: 12 }}><label>Minimum Withdrawal (₱)</label><input defaultValue="₱ 500" /></div>
            <div className="fld" style={{ marginBottom: 8 }}><label>Max Withdrawal of Bonus Winnings (₱)</label><input defaultValue="₱ 10000" /></div>
            <div className="kb-tgl"><label className="switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label>Forfeit bonus if withdrawal attempted before turnover</div>
            <div className="kb-tgl"><label className="switch"><input type="checkbox" /><span className="slider"></span></label>Allow partial withdrawal (pro-rated turnover)</div>
          </div>
          <div className="card" style={{ marginTop: 'var(--pad)' }}><div className="card-title">📄 Recent Awards</div>
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table style={{ minWidth: 480 }}>
              <thead><tr><th>Player</th><th>Bonus</th><th>Turnover</th><th>Status</th></tr></thead>
              <tbody>{KB_AWARDS.map((a, i) => (
                <tr key={i}>
                  <td><span className="mask">{a[0]}</span></td><td style={{ color: 'var(--gold)', fontWeight: 900 }}>₱500</td>
                  <td><div className="tp-lbl">₱2,500</div><div className="tprog"><i style={{ width: `${a[3]}%`, background: a[3] >= 100 ? 'var(--green)' : 'var(--blue)' }}></i></div></td>
                  <td><span className={`kbst ${a[1]}`}>{a[2]}</span></td>
                </tr>
              ))}</tbody>
            </table></div>
          </div>
          <div style={{ marginTop: 'var(--pad)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn-cancel" onClick={() => toast('Changes discarded')}>Discard</button>
            <button className="btn-search" onClick={() => toast('KYC Bonus config saved! ✔')}>💾 Save KYC Bonus Config</button>
          </div>
        </div>
      </div>
    </>
  );
}

function SettingsTab() {
  const { toast } = useUI();
  return (
    <div className="card"><div className="card-title">⚙️ Promotion Settings</div>
      <div className="kb-tgl"><label className="switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label>Auto-apply best eligible bonus at deposit</div>
      <div className="kb-tgl"><label className="switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label>Show promotion banners on homepage</div>
      <div className="kb-tgl"><label className="switch"><input type="checkbox" /><span className="slider"></span></label>Allow stacking multiple active bonuses</div>
      <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 12 }}>
        <div className="fld"><label>Max Active Bonuses per Player</label><input defaultValue="1" /></div>
        <div className="fld"><label>Bonus Abuse Flag Threshold</label><input defaultValue="3 accounts / device" /></div>
      </div>
      <div style={{ marginTop: 14, textAlign: 'right' }}><button className="btn-search" onClick={() => toast('Promotion settings saved! ✔')}>💾 Save Settings</button></div>
    </div>
  );
}

/* ===================== main ===================== */

export default function Promotions() {
  const { toast } = useUI();
  const [tab, setTab] = useState('promos');
  const [promos, setPromos] = useState(DEMO_PROMOS);
  const [loading, setLoading] = useState(true);
  const [slices, setSlices] = useState(INITIAL_SLICES);
  const [bigwins, setBigwins] = useState(INITIAL_BIGWINS);
  const [tiers, setTiers] = useState(TIER_RC_INIT);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await listPromotions();
        const arr = Array.isArray(res) ? res : (res?.data || res?.items || res?.promotions || []);
        if (alive && Array.isArray(arr) && arr.length) {
          setPromos(arr.map(normalizePromo));
        }
        // empty -> keep demo fallback
      } catch {
        // error -> keep demo fallback
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <>
      <div className="page-head">
        <div><h1 className="hero-h">🔔 Promotions</h1><div className="hero-sub" style={{ marginBottom: 0 }}>Manage bonus packages, wager requirements, banners and eligibility rules</div></div>
        <span className="pr"><button className="btn-search" onClick={() => toast('Create Promotion — demo')}>＋ Create Promotion</button></span>
      </div>
      <div className="ptabs">{PROMO_TABS.map((t) => (
        <button key={t[0]} className={`ptab ${tab === t[0] ? 'active' : ''}`} onClick={() => setTab(t[0])}>{t[1]}</button>
      ))}</div>
      {tab === 'promos' ? <PromosTab promos={promos} setPromos={setPromos} loading={loading} />
        : tab === 'mini' ? <MiniTab slices={slices} setSlices={setSlices} />
          : tab === 'bigwins' ? <BigwinsTab bigwins={bigwins} setBigwins={setBigwins} />
            : tab === 'tier' ? <TierTab tiers={tiers} setTiers={setTiers} />
              : tab === 'kyc' ? <KycTab />
                : <SettingsTab />}
    </>
  );
}
