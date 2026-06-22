import { useState, useEffect, useRef } from 'react';

const LB_POOL = [
  ['Jun M.', 'Fortune Dragon'],
  ['Maria S.', 'Sweet Bonanza'],
  ['Pedro R.', 'Aviator'],
  ['Ana G.', 'Crazy Time'],
  ['Carlos L.', 'Gates of Olympus'],
  ['Rosa C.', 'Baccarat A12'],
  ['Lea V.', 'Fortune Tiger'],
  ['Bong S.', 'Wolf Gold'],
];

const SEED = [
  { pl: 'Jun M.', gm: 'Fortune Dragon', bet: 378, win: 0, net: -378, t: '19:49:39' },
  { pl: 'Jun M.', gm: 'Aviator', bet: 289, win: 920, net: 631, t: '19:49:38' },
];

export default function LiveBets() {
  const [rows, setRows] = useState(SEED);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  useEffect(() => {
    const timer = setInterval(() => {
      const [pl, gm] = LB_POOL[Math.floor(Math.random() * LB_POOL.length)];
      const bet = Math.floor(20 + Math.random() * 480);
      const win = Math.random() < 0.42 ? Math.floor(bet * (0.5 + Math.random() * 4)) : 0;
      const net = win - bet;
      const t = new Date().toTimeString().slice(0, 8);
      setRows((prev) => [{ pl, gm, bet, win, net, t }, ...prev].slice(0, 14));
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="card">
      <div className="page-head" style={{ marginBottom: 0 }}>
        <div className="card-title" style={{ marginBottom: 0 }}>🎲 Live Bets</div>
        <span className="pr"><span className="live-pill">Streaming</span></span>
      </div>
      <div className="table-wrap" style={{ border: 'none', borderRadius: 0, marginTop: 10 }}>
        <table id="lbTbl" style={{ minWidth: 760 }}>
          <thead>
            <tr><th>Player</th><th>Game</th><th>Bet</th><th>Win</th><th>Net</th><th>Time</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td><b>{r.pl}</b></td>
                <td>{r.gm}</td>
                <td>₱{r.bet}</td>
                <td style={{ color: 'var(--green)' }}>₱{r.win}</td>
                <td style={{ color: r.net >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 800 }}>
                  {r.net >= 0 ? '+' : '-'}₱{Math.abs(r.net)}
                </td>
                <td style={{ color: 'var(--muted)' }}>{r.t}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
