import { useEffect, useState } from 'react';
import { useUI } from '../context/UIContext';
import { getDayRetention } from '../services/configService';

function drcColor(rate) {
  if (rate == null) return 'transparent';
  if (rate >= 40) return 'rgba(46,204,113,0.16)';
  if (rate >= 20) return 'rgba(46,204,113,0.09)';
  if (rate >= 10) return 'rgba(244,178,35,0.08)';
  return 'rgba(155,48,217,0.07)';
}
function drcRateColor(rate) {
  if (rate >= 40) return 'var(--green)';
  if (rate >= 20) return '#7fd99a';
  if (rate >= 10) return 'var(--gold)';
  return '#c69bff';
}

const STEPS = [1, 3, 7, 14, 30];

function Cell({ v }) {
  if (v == null) return <span className="rep-mut">—</span>;
  return <span style={{ display: 'inline-block', minWidth: 52, padding: '4px 8px', borderRadius: 6, background: drcColor(v), color: drcRateColor(v), fontWeight: 800 }}>{v}%</span>;
}

export default function DayRetention() {
  const { toast } = useUI();
  const [days, setDays] = useState(14);
  const [d, setD] = useState(null);

  useEffect(() => { getDayRetention(days).then(setD).catch(() => {}); }, [days]);

  if (!d) return <><h1 className="hero-h">📊 Day Retention Comparison</h1><div className="card">Loading…</div></>;

  const rows = (d.rows || []).slice().reverse(); // newest cohort first
  const avgAt = (k) => {
    const rs = rows.filter((r) => r.size > 0 && r['d' + k] != null);
    return rs.length ? Math.round(rs.reduce((s, r) => s + r['d' + k], 0) / rs.length) : null;
  };
  const fmt = (v) => (v == null ? '—' : v + '%');
  const totalCohort = rows.reduce((s, r) => s + r.size, 0);

  const drcQuery = () => getDayRetention(days).then((res) => { setD(res); toast('Cohort grid refreshed 🔍 ' + (res.rows || []).length + ' cohorts'); }).catch(() => toast('⚠ Refresh failed'));

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="hero-h">📊 Day Retention Comparison</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>Track how many players return each day after registration — D1 / D3 / D7 / D14 / D30 per daily cohort, from real login history</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>Last 7 Days</option><option value={14}>Last 14 Days</option><option value={30}>Last 30 Days</option>
          </select>
          <button className="mini-btn" onClick={drcQuery}>🔍 Query</button>
        </div>
      </div>

      <div className="grid kpi-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
        <div className="card kpi b"><div className="lbl">Cohort Players</div><div className="val">{totalCohort.toLocaleString()}</div><div className="trend" style={{ color: 'var(--muted)' }}>registered in {days} days</div></div>
        <div className="card kpi g"><div className="lbl">Day 1 Retention</div><div className="val">{fmt(avgAt(1))}</div><div className="trend" style={{ color: 'var(--muted)' }}>% returned next day</div></div>
        <div className="card kpi"><div className="lbl">Day 3 Retention</div><div className="val">{fmt(avgAt(3))}</div><div className="trend" style={{ color: 'var(--muted)' }}>avg across cohorts</div></div>
        <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">Day 7 Retention</div><div className="val">{fmt(avgAt(7))}</div><div className="trend" style={{ color: 'var(--muted)' }}>avg across cohorts</div></div>
        <div className="card kpi r"><div className="lbl">Day 30 Retention</div><div className="val">{fmt(avgAt(30))}</div><div className="trend" style={{ color: 'var(--muted)' }}>avg across cohorts</div></div>
      </div>

      <div className="drc-info">💡 <b>How to read this table:</b> Each <b>row</b> is a registration cohort (players who signed up on that date). Each column shows the % of that cohort that logged in exactly N days later. <span style={{ color: 'var(--green)' }}>Green = strong</span>, <span style={{ color: '#c69bff' }}>purple = low</span>. — means the day hasn't been reached yet (or the cohort is empty).</div>

      <div className="card">
        <div className="card-title">📊 Cohort Retention Grid</div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table style={{ minWidth: 760 }}>
          <thead><tr><th>Cohort Date</th><th>Players</th>{STEPS.map((k) => <th key={k}>Day {k}</th>)}</tr></thead>
          <tbody>
            {rows.length === 0
              ? <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>No cohort data yet — rows appear as players register.</td></tr>
              : rows.map((r) => (
                <tr key={r.date}>
                  <td><b>{r.date}</b></td>
                  <td style={{ color: r.size ? 'inherit' : 'var(--muted)' }}>👥 {r.size.toLocaleString()}</td>
                  {STEPS.map((k) => <td key={k}><Cell v={r['d' + k]} /></td>)}
                </tr>
              ))}
          </tbody>
        </table></div>
      </div>

      <div className="drc-legend">
        <span className="li"><span className="sw" style={{ background: 'rgba(46,204,113,0.6)' }}></span>≥40% Strong</span>
        <span className="li"><span className="sw" style={{ background: 'rgba(46,204,113,0.3)' }}></span>≥20% Good</span>
        <span className="li"><span className="sw" style={{ background: 'rgba(244,178,35,0.4)' }}></span>≥10% Fair</span>
        <span className="li"><span className="sw" style={{ background: 'rgba(155,48,217,0.4)' }}></span>&lt;10% Low</span>
        <span className="li">— Not reached yet</span>
      </div>
    </>
  );
}
