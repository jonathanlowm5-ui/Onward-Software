import { useState, useEffect } from 'react';
import { useUI } from '../context/UIContext';
import api from '../services/api';

// Pools the operator publishes results for (ids match the player Lottery cards).
const RESULT_POOLS = [
  { key: 'magnum', label: '🟡 Magnum 4D' },
  { key: 'damacai', label: '🟣 Da Ma Cai' },
  { key: 'toto', label: '🔵 Sports Toto' },
];
const blankPool = () => ({ date: '', drawNo: '', first: '', second: '', third: '', special: '', consolation: '', jp1: '', jp2: '' });
// Preserve the exact result layout: keep 4-digit numbers AND the "----" blanks
// in their positions, so Special / Consolation match the source draw exactly.
const toList = (s) => String(s || '').split(/[\s,]+/).filter(Boolean).map((x) => (/^-+$/.test(x) ? '----' : x.replace(/[^0-9]/g, '').slice(0, 4))).filter(Boolean);

function ResultsEntry() {
  const { toast } = useUI();
  const [pools, setPools] = useState(() => Object.fromEntries(RESULT_POOLS.map((p) => [p.key, blankPool()])));
  const [busy, setBusy] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    api.get('/lottery/results').then((r) => {
      const arr = r.data?.pools;
      if (!Array.isArray(arr)) return;
      setUpdatedAt(r.data?.fetchedAt || null);
      setPools((prev) => {
        const next = { ...prev };
        arr.forEach((p) => {
          if (!next[p.key]) return;
          next[p.key] = {
            date: p.date || '', drawNo: p.drawNo || '',
            first: p.first || '', second: p.second || '', third: p.third || '',
            special: (p.special || []).join(' '), consolation: (p.consolation || []).join(' '),
            jp1: p.jp1 || '', jp2: p.jp2 || '',
          };
        });
        return next;
      });
    }).catch(() => {});
  }, []);

  const set = (key, field, val) => setPools((p) => ({ ...p, [key]: { ...p[key], [field]: val } }));

  const save = async () => {
    setBusy(true);
    try {
      const payload = RESULT_POOLS.map(({ key }) => {
        const p = pools[key];
        return { key, date: p.date, drawNo: p.drawNo, first: p.first, second: p.second, third: p.third, special: toList(p.special), consolation: toList(p.consolation), jp1: p.jp1, jp2: p.jp2 };
      });
      const { data } = await api.put('/lottery/results', { pools: payload });
      setUpdatedAt(data?.fetchedAt || new Date().toISOString());
      toast('4D results published ✔ — now live on the player site');
    } catch (e) { toast('⚠ Save failed: ' + (e.message || 'error')); }
    finally { setBusy(false); }
  };

  const inp = { width: '100%', padding: '8px 10px', borderRadius: 8, background: 'var(--bg3,#0b1224)', color: 'var(--text,#fff)', border: '1px solid var(--border,#243049)', fontFamily: 'inherit', fontSize: 13 };
  const lbl = { fontSize: 11, fontWeight: 700, color: 'var(--muted,#8898b8)', display: 'block', marginBottom: 3 };

  return (
    <div className="card" style={{ marginBottom: 'var(--pad)' }}>
      <div className="page-head" style={{ marginBottom: 10 }}>
        <div className="card-title" style={{ marginBottom: 0 }}>📝 Publish 4D Draw Results</div>
        <span className="pr" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {updatedAt && <span style={{ fontSize: 11, color: 'var(--muted)' }}>Last published: {new Date(updatedAt).toLocaleString()}</span>}
          <button className="btn-search" disabled={busy} onClick={save}>{busy ? 'Publishing…' : '💾 Publish Results'}</button>
        </span>
      </div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>Enter the latest draw for each pool — it appears instantly on the player Lottery page. For Special / Consolation, type the 4-digit numbers separated by spaces, and <b>---- for any blank slot</b> so it lines up exactly like the official result.</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
        {RESULT_POOLS.map(({ key, label }) => {
          const p = pools[key];
          return (
            <div key={key} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>{label}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                <div><label style={lbl}>Draw date</label><input style={inp} value={p.date} placeholder="Wed 03-06-2026" onChange={(e) => set(key, 'date', e.target.value)} /></div>
                <div><label style={lbl}>Draw No.</label><input style={inp} value={p.drawNo} placeholder="No.376/26" onChange={(e) => set(key, 'drawNo', e.target.value)} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                <div><label style={lbl}>1st</label><input style={inp} maxLength={12} value={p.first} placeholder="(L) 5573" onChange={(e) => set(key, 'first', e.target.value)} /></div>
                <div><label style={lbl}>2nd</label><input style={inp} maxLength={12} value={p.second} placeholder="(K) 8852" onChange={(e) => set(key, 'second', e.target.value)} /></div>
                <div><label style={lbl}>3rd</label><input style={inp} maxLength={12} value={p.third} placeholder="(B) 2745" onChange={(e) => set(key, 'third', e.target.value)} /></div>
              </div>
              <div style={{ marginBottom: 8 }}><label style={lbl}>Special <span style={{ fontWeight: 400, color: 'var(--muted)' }}>— use ---- for a blank slot</span></label><textarea style={{ ...inp, minHeight: 56, resize: 'vertical', fontFamily: 'monospace' }} value={p.special} placeholder="4549 ---- 4563 7644 0869 9251 6556 1387 1377 2818 ---- ---- 7593" onChange={(e) => set(key, 'special', e.target.value)} /></div>
              <div style={{ marginBottom: 8 }}><label style={lbl}>Consolation <span style={{ fontWeight: 400, color: 'var(--muted)' }}>— use ---- for a blank slot</span></label><textarea style={{ ...inp, minHeight: 56, resize: 'vertical', fontFamily: 'monospace' }} value={p.consolation} placeholder="9451 7692 3881 7999 1974 1164 4461 0595 5620 1489" onChange={(e) => set(key, 'consolation', e.target.value)} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div><label style={lbl}>Jackpot 1</label><input style={inp} value={p.jp1} placeholder="RM 21,630,000.00" onChange={(e) => set(key, 'jp1', e.target.value)} /></div>
                <div><label style={lbl}>Jackpot 2</label><input style={inp} value={p.jp2} placeholder="RM 247,000.00" onChange={(e) => set(key, 'jp2', e.target.value)} /></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const LOT_GAMES = [
  { n: 'Magnum 4D', cls: 'gname-m4', ic: '🟡', bg: 'linear-gradient(90deg,rgba(244,178,35,.18),transparent)', pl: '482', bets: '1,340', wag: '₱78.2K', avg: '₱58.40', bd: [['Classic 4D Big', '580 bets (43.3%)'], ['Classic 4D Small', '420 bets (31.3%)'], ['iBox', '340 bets (25.4%)']], last: '3821 · 4567 · 9012' },
  { n: 'Toto', cls: 'gname-toto', ic: '🔵', bg: 'linear-gradient(90deg,rgba(58,160,255,.18),transparent)', pl: '391', bets: '1,207', wag: '₱68.9K', avg: '₱57.10', bd: [['Classic 4D Big', '520 bets (43.1%)'], ['Classic 4D Small', '380 bets (31.5%)'], ['iBox', '307 bets (25.4%)']], last: '07 · 14 · 22 · 31 · 38 · 45' },
  { n: 'Da Ma Cai', cls: 'gname-dmc', ic: '🟣', bg: 'linear-gradient(90deg,rgba(155,109,255,.18),transparent)', pl: '331', bets: '1,300', wag: '₱45.3K', avg: '₱34.85', bd: [['Classic 4D Big', '540 bets (41.5%)'], ['Classic 4D Small', '420 bets (32.3%)'], ['iBox', '340 bets (26.2%)']], last: '5248 · 7831 · 0192' },
];

const LOT_BETS = [
  ['player_001', 'Magnum 4D', 'gname-m4', 'Classic 4D Big', '3821', '₱20', 'Sat 7PM', 'pend'],
  ['player_042', 'Toto', 'gname-toto', 'Classic 4D Big', '07-14-22-31-38-45', '₱50', 'Sat 7PM', 'pend'],
  ['player_108', 'Da Ma Cai', 'gname-dmc', 'iBox', '5248', '₱30', 'Sat 7PM', 'won', 'Won ₱180'],
  ['player_055', 'Magnum 4D', 'gname-m4', 'Classic 4D Small', '4567', '₱20', 'Sat 7PM', 'lost'],
  ['player_219', 'Toto', 'gname-toto', 'Classic 4D Small', '03-18-27-34-41-52', '₱50', 'Sat 7PM', 'lost'],
];

export default function Lottery() {
  const { toast } = useUI();
  const [filter, setFilter] = useState('');

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="hero-h">🎱 Lottery</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>Magnum 4D · Toto · Da Ma Cai — live bet tracking and draw results</div>
        </div>
        <span className="pr"><button className="mini-btn" onClick={() => toast('Lottery feeds refreshed 🔄')}>🔄 Refresh</button></span>
      </div>

      <ResultsEntry />

      <div className="grid kpi-grid">
        <div className="card kpi"><div className="lbl">Total Bets Today</div><div className="val">3,847</div><div className="trend" style={{ color: 'var(--muted)' }}>across all 3 games</div></div>
        <div className="card kpi g"><div className="lbl">Players Betting</div><div className="val">1,204</div><div className="trend" style={{ color: 'var(--muted)' }}>unique players today</div></div>
        <div className="card kpi b"><div className="lbl">Total Wagered (₱)</div><div className="val">₱192.4K</div><div className="trend" style={{ color: 'var(--muted)' }}>today</div></div>
        <div className="card kpi r"><div className="lbl">Pending Payouts (₱)</div><div className="val">₱38.6K</div><div className="trend" style={{ color: 'var(--muted)' }}>awaiting draw results</div></div>
      </div>
      <div className="lot-grid">
        {LOT_GAMES.map((g) => (
          <div className="lot-card" key={g.n}>
            <div className="lot-head" style={{ background: g.bg }}>
              <span className="lic" style={{ background: 'var(--panel-3)' }}>{g.ic}</span>
              <span>
                <div className={`ln ${g.cls}`}>{g.n}</div>
                <div className="ld">Draw: Wed &amp; Sat 7:00 PM</div>
              </span>
              <span className="act">Active</span>
            </div>
            <div className="lot-body">
              <div className="lot-stats">
                <div className="lot-box"><div className="l">Players Betting</div><div className="v">{g.pl}</div></div>
                <div className="lot-box"><div className="l">Total Bets</div><div className="v">{g.bets}</div></div>
                <div className="lot-box"><div className="l">Total Wagered</div><div className="v gold">{g.wag}</div></div>
                <div className="lot-box"><div className="l">Avg Bet Size</div><div className="v gold">{g.avg}</div></div>
              </div>
              <div className="lot-bd">
                <div className="t">Bet Type Breakdown</div>
                {g.bd.map((r, i) => (
                  <div className="r" key={i}><span>{r[0]}</span><b>{r[1]}</b></div>
                ))}
              </div>
              <div className="lot-last">Last draw result: <b style={{ color: 'var(--text)' }}>{g.last}</b> (Sat 7PM)</div>
            </div>
          </div>
        ))}
      </div>
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="page-head" style={{ marginBottom: 12 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>🎟️ Recent Lottery Bets</div>
          <span className="pr" style={{ display: 'flex', gap: 8 }}>
            <select className="qsearch" style={{ width: 'auto' }} value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">All Games</option>
              <option>Magnum 4D</option>
              <option>Toto</option>
              <option>Da Ma Cai</option>
            </select>
            <button className="mini-btn" onClick={() => toast('Exported! ⬇ lottery-bets.csv')}>⬇ Export</button>
          </span>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table id="lotTbl" style={{ minWidth: 860 }}>
            <thead>
              <tr><th>Player</th><th>Game</th><th>Bet Type</th><th>Numbers</th><th>Amount (₱)</th><th>Draw Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              {LOT_BETS.filter((b) => !filter || b[1] === filter).map((b, i) => (
                <tr key={i}>
                  <td><b>{b[0]}</b></td>
                  <td><span className={b[2]}>{b[1]}</span></td>
                  <td>{b[3]}</td>
                  <td>{b[4]}</td>
                  <td style={{ fontWeight: 800 }}>{b[5]}</td>
                  <td>{b[6]}</td>
                  <td>
                    {b[7] === 'pend' ? <span className="lst-pend">Pending</span>
                      : b[7] === 'won' ? <span className="lst-won">{b[8]}</span>
                        : <span className="lst-lost">Lost</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
