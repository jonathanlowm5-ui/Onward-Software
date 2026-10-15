import { useEffect, useState } from 'react';
import { getLiveBets } from '../services/configService';

const money = (v) => Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

export default function LiveBets() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    const load = () => getLiveBets().then((d) => setRows(Array.isArray(d) ? d : [])).catch(() => {});
    load();
    const id = setInterval(load, 10000); // live ticker — refreshes every 10s
    return () => clearInterval(id);
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
            <tr><th>Player</th><th>Game</th><th>Provider</th><th>Bet</th><th>Win</th><th>Net</th><th>Time</th></tr>
          </thead>
          <tbody>
            {rows === null
              ? <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>Loading…</td></tr>
              : rows.length === 0
                ? <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>No bets yet — wagers from integrated providers appear here in real time.</td></tr>
                : rows.slice(0, 30).map((r) => {
                  const bet = Number(r.amount || 0);
                  const win = Number(r.win || 0);
                  const net = win - bet;
                  return (
                    <tr key={r.id || `${r.playerId}-${r.createdAt}`}>
                      <td><b>{r.username || r.playerId}</b></td>
                      <td>{r.gameName || r.game || '—'}</td>
                      <td style={{ color: 'var(--muted)' }}>{r.provider || '—'}</td>
                      <td>{money(bet)} {r.currency || ''}</td>
                      <td style={{ color: 'var(--green)' }}>{money(win)}</td>
                      <td style={{ color: net >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 800 }}>
                        {net >= 0 ? '+' : '-'}{money(Math.abs(net))}
                      </td>
                      <td style={{ color: 'var(--muted)' }}>{String(r.createdAt || '').replace('T', ' ').slice(5, 19)}</td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
