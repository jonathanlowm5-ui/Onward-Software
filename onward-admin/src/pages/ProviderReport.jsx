import { useEffect, useState } from 'react';
import { useUI } from '../context/UIContext';
import { getWinloss } from '../services/configService';

const money = (v) => Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const killRate = (rtp) => +(100 - Number(rtp || 0)).toFixed(1);
const killColor = (k) => (k >= 14 ? 'var(--red)' : k >= 12 ? '#ff8c42' : 'var(--green)');

const dlCsv = (name, header, rows) => {
  const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
};

export default function ProviderReport() {
  const { toast } = useUI();
  const [days, setDays] = useState(30);
  const [d, setD] = useState(null);

  useEffect(() => { getWinloss('provider', days).then(setD).catch(() => {}); }, [days]);

  if (!d) return <><h1 className="hero-h">🎮 Provider Report</h1><div className="card">Loading…</div></>;

  const rows = d.rows || [];
  const totWagered = rows.reduce((s, r) => s + r.wagered, 0);
  const totWon = rows.reduce((s, r) => s + r.won, 0);
  const totGgr = rows.reduce((s, r) => s + r.ggr, 0);
  const totBets = rows.reduce((s, r) => s + r.bets, 0);
  const avgRtp = totWagered > 0 ? Math.round((totWon / totWagered) * 1000) / 10 : 0;

  const rprovExport = () => {
    dlCsv('provider-report.csv', ['Provider', 'Bets', 'Players', 'Wagered', 'Won', 'GGR', 'RTP %', 'Kill Rate %'],
      rows.map((r) => [r.provider, r.bets, r.players, r.wagered, r.won, r.ggr, r.rtp, killRate(r.rtp)]));
    toast('Provider report exported ⬇ ' + rows.length + ' providers (incl. kill rate)');
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="hero-h">🎮 Provider Report</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>Revenue, RTP, kill rate and performance breakdown by game provider — from real bet data</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>Last 7 Days</option><option value={30}>Last 30 Days</option><option value={90}>Last 90 Days</option>
          </select>
          <button className="mini-btn" onClick={rprovExport}>⬇ Export CSV</button>
        </div>
      </div>

      <div className="grid kpi-grid">
        <div className="card kpi g"><div className="lbl">Total GGR</div><div className="val">{money(totGgr)}</div><div className="trend" style={{ color: 'var(--muted)' }}>last {days} days</div></div>
        <div className="card kpi b"><div className="lbl">Providers</div><div className="val">{rows.length}</div><div className="trend" style={{ color: 'var(--muted)' }}>with bet activity</div></div>
        <div className="card kpi"><div className="lbl">Total Bets</div><div className="val">{totBets.toLocaleString()}</div><div className="trend" style={{ color: 'var(--muted)' }}>{money(totWagered)} wagered</div></div>
        <div className="card kpi" style={{ borderTopColor: '#9b30d9' }}><div className="lbl">Avg Kill Rate</div><div className="val">{killRate(avgRtp)}%</div><div className="trend" style={{ color: 'var(--muted)' }}>avg RTP {avgRtp}%</div></div>
      </div>

      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="card-title">Provider Performance</div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table style={{ minWidth: 960 }}>
          <thead><tr><th>Provider</th><th>Bets</th><th>Players</th><th>Wagered</th><th>Won</th><th>GGR</th><th>RTP Paid</th><th>Kill Rate <span className="pw-q" title="House win efficiency = 100% − RTP. Higher = the provider retains more of player wagers.">?</span></th></tr></thead>
          <tbody>
            {rows.length === 0
              ? <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>No bet activity in this period yet.</td></tr>
              : rows.map((r) => {
                const k = killRate(r.rtp);
                return (
                  <tr key={r.provider}>
                    <td><b>{r.provider}</b></td>
                    <td>{r.bets.toLocaleString()}</td>
                    <td>{r.players.toLocaleString()}</td>
                    <td style={{ color: 'var(--gold)' }}>{money(r.wagered)}</td>
                    <td>{money(r.won)}</td>
                    <td style={{ color: r.ggr >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 800 }}>{money(r.ggr)}</td>
                    <td>{r.rtp.toFixed(1)}%</td>
                    <td>
                      <span style={{ color: killColor(k), fontWeight: 800 }}>{k}%</span>
                      <span style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 8, width: 60, height: 6, background: 'rgba(255,255,255,.06)', borderRadius: 4, overflow: 'hidden' }}>
                        <span style={{ display: 'block', width: `${Math.min(100, Math.max(0, (k / 20) * 100)).toFixed(0)}%`, height: '100%', background: killColor(k) }} />
                      </span>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table></div>
      </div>
    </>
  );
}
