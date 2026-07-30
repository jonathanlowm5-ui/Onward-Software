import { useEffect, useState } from 'react';
import { useUI } from '../context/UIContext';
import { getWinloss } from '../services/configService';

const money = (v) => Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

const dlCsv = (name, header, rows) => {
  const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
};

export default function Winloss() {
  const { toast } = useUI();
  const [by, setBy] = useState('provider');
  const [days, setDays] = useState(30);
  const [d, setD] = useState(null);

  useEffect(() => { setD(null); getWinloss(by, days).then(setD).catch(() => {}); }, [by, days]);

  const rows = d?.rows || [];
  const totWagered = rows.reduce((s, r) => s + r.wagered, 0);
  const totWon = rows.reduce((s, r) => s + r.won, 0);
  const totGgr = rows.reduce((s, r) => s + r.ggr, 0);
  const margin = totWagered > 0 ? Math.round((totGgr / totWagered) * 1000) / 10 : 0;
  const label = by === 'game' ? 'Game' : 'Provider';

  const wlExport = () => {
    dlCsv(`winloss-by-${by}.csv`, [label, 'Bets', 'Players', 'Wagered', 'Won', 'GGR', 'RTP %'],
      rows.map((r) => [r[by], r.bets, r.players, r.wagered, r.won, r.ggr, r.rtp]));
    toast('Win/Loss report exported ⬇ ' + rows.length + ' rows');
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="hero-h">📊 Win/Loss Report</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>Player win/loss summary, GGR and house edge — grouped by provider or game, from real bets</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={by} onChange={(e) => setBy(e.target.value)}>
            <option value="provider">By Provider</option><option value="game">By Game</option>
          </select>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>Last 7 Days</option><option value={30}>Last 30 Days</option><option value={90}>Last 90 Days</option>
          </select>
          <button className="mini-btn" onClick={wlExport}>⬇ Export</button>
        </div>
      </div>

      <div className="grid kpi-grid">
        <div className="card kpi g"><div className="lbl">Total Wagered</div><div className="val">{money(totWagered)}</div><div className="trend" style={{ color: 'var(--muted)' }}>last {days} days</div></div>
        <div className="card kpi b"><div className="lbl">Total Player Won</div><div className="val">{money(totWon)}</div><div className="trend" style={{ color: 'var(--muted)' }}>{totWagered > 0 ? `${Math.round((totWon / totWagered) * 1000) / 10}% payout` : 'no bets yet'}</div></div>
        <div className="card kpi"><div className="lbl">House GGR</div><div className="val">{money(totGgr)}</div><div className="trend" style={{ color: 'var(--muted)' }}>{margin}% margin</div></div>
        <div className="card kpi" style={{ borderTopColor: '#9b30d9' }}><div className="lbl">{label}s</div><div className="val">{rows.length}</div><div className="trend" style={{ color: 'var(--muted)' }}>with activity in period</div></div>
      </div>

      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="card-title">Win/Loss by {label}</div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table style={{ minWidth: 900 }}>
          <thead><tr><th>{label}</th><th>Bets</th><th>Players</th><th>Wagered</th><th>Won</th><th>GGR</th><th>RTP</th><th>Margin</th></tr></thead>
          <tbody>
            {!d
              ? <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>Loading…</td></tr>
              : rows.length === 0
                ? <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>No bet activity in this period yet.</td></tr>
                : rows.map((r) => (
                  <tr key={r[by]}>
                    <td><b>{r[by]}</b></td>
                    <td>{r.bets.toLocaleString()}</td>
                    <td>{r.players.toLocaleString()}</td>
                    <td style={{ color: 'var(--gold)' }}>{money(r.wagered)}</td>
                    <td>{money(r.won)}</td>
                    <td style={{ color: r.ggr >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 800 }}>{money(r.ggr)}</td>
                    <td>{r.rtp.toFixed(1)}%</td>
                    <td style={{ color: 'var(--muted)' }}>{(100 - r.rtp).toFixed(1)}%</td>
                  </tr>
                ))}
          </tbody>
        </table></div>
      </div>
    </>
  );
}
