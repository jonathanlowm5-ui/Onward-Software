import { useEffect, useState } from 'react';
import { useUI } from '../context/UIContext';
import { getAnalytics } from '../services/configService';

const money = (v) => Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

function Bars({ days, values, color }) {
  const max = Math.max(1, ...values);
  return (
    <div className="bars-wrap"><div className="bars">
      {values.map((v, i) => (
        <div className="bar" key={i} title={`${days[i]}: ${money(v)}`}
          style={{ height: `${Math.max(4, Math.round((v / max) * 100))}%`, background: color }}>
          <span>{i % 5 === 0 ? days[i].slice(5) : ''}</span>
        </div>
      ))}
    </div></div>
  );
}

export default function Analytics() {
  const { toast } = useUI();
  const [days, setDays] = useState(30);
  const [d, setD] = useState(null);

  useEffect(() => { getAnalytics(days).then(setD).catch(() => {}); }, [days]);

  const refresh = () => getAnalytics(days).then((res) => { setD(res); toast('Analytics refreshed ↻'); }).catch(() => toast('⚠ Refresh failed'));

  if (!d) return <><h1 className="hero-h">📊 Analytics</h1><div className="card">Loading…</div></>;

  const t = d.totals || {};
  const providers = d.byProvider || [];
  const maxWager = Math.max(1, ...providers.map((p) => p.wagered));

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="hero-h">📊 Analytics</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>Platform summary and provider rankings — computed from real bets, transactions and registrations</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>Last 7 Days</option><option value={30}>Last 30 Days</option><option value={90}>Last 90 Days</option>
          </select>
          <button className="mini-btn" onClick={refresh}>↻ Refresh</button>
        </div>
      </div>

      <div className="grid kpi-grid">
        <div className="card kpi g"><div className="lbl">Total Wagered</div><div className="val">{money(t.wagered)}</div><div className="trend" style={{ color: 'var(--muted)' }}>last {days} days</div></div>
        <div className="card kpi b"><div className="lbl">GGR</div><div className="val">{money(t.ggr)}</div><div className="trend" style={{ color: 'var(--muted)' }}>wagered − won</div></div>
        <div className="card kpi"><div className="lbl">Deposits / Withdrawals</div><div className="val">{money(t.deposits)}</div><div className="trend" style={{ color: 'var(--muted)' }}>{money(t.withdrawals)} withdrawn</div></div>
        <div className="card kpi" style={{ borderTopColor: '#9b30d9' }}><div className="lbl">Registrations</div><div className="val">{(t.registrations ?? 0).toLocaleString()}</div><div className="trend" style={{ color: 'var(--muted)' }}>{(t.players ?? 0).toLocaleString()} players total</div></div>
      </div>

      <div className="grid two-col" style={{ marginTop: 'var(--pad)' }}>
        <div className="card"><div className="card-title">🎲 Wagered — per day</div><Bars days={d.days} values={d.series.wagered} color="var(--gold,#f4b223)" /></div>
        <div className="card"><div className="card-title">⬇️ Deposits — per day</div><Bars days={d.days} values={d.series.deposits} color="var(--green,#2ecc71)" /></div>
      </div>

      <div className="grid two-col" style={{ marginTop: 'var(--pad)' }}>
        <div className="card"><div className="card-title">💹 GGR — per day</div><Bars days={d.days} values={d.series.ggr} color="var(--blue,#3aa0ff)" /></div>
        <div className="card"><div className="card-title">🧑‍💼 Registrations — per day</div><Bars days={d.days} values={d.series.registrations} color="#9b6dff" /></div>
      </div>

      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="card-title">🏆 Provider Wager Ranking</div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table style={{ minWidth: 760 }}>
          <thead><tr><th>#</th><th>Provider</th><th>Bets</th><th>Wagered</th><th>Won</th><th>GGR</th><th>Share</th></tr></thead>
          <tbody>
            {providers.length === 0
              ? <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>No bet activity in this period yet.</td></tr>
              : providers.map((p, i) => (
                <tr key={p.provider}>
                  <td style={{ color: 'var(--muted)' }}>{i + 1}</td>
                  <td><b>{p.provider}</b></td>
                  <td>{p.bets.toLocaleString()}</td>
                  <td style={{ color: 'var(--gold)' }}>{money(p.wagered)}</td>
                  <td>{money(p.won)}</td>
                  <td style={{ color: p.ggr >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 800 }}>{money(p.ggr)}</td>
                  <td style={{ minWidth: 140 }}>
                    <span style={{ display: 'block', height: 8, background: 'rgba(255,255,255,.06)', borderRadius: 5, overflow: 'hidden' }}>
                      <span style={{ display: 'block', width: `${Math.round((p.wagered / maxWager) * 100)}%`, height: '100%', background: 'var(--blue,#3aa0ff)' }} />
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table></div>
      </div>
    </>
  );
}
