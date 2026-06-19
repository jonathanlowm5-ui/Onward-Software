import { useState } from 'react';
import { useUI } from '../context/UIContext';

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
