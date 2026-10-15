import { useEffect, useState } from 'react';
import { useUI } from '../context/UIContext';
import { getRetention } from '../services/configService';

const retPct = (v, c) => (v == null ? <span className="rep-mut">—</span> : <span style={{ color: c }}>{v}%</span>);
const WEEK_COLORS = ['var(--green)', 'var(--blue)', 'var(--gold)', '#ff8c42'];

const dlCsv = (name, header, rows) => {
  const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
};

export default function Retention() {
  const { toast } = useUI();
  const [weeks, setWeeks] = useState(8);
  const [d, setD] = useState(null);

  useEffect(() => { getRetention(weeks).then(setD).catch(() => {}); }, [weeks]);

  if (!d) return <><h1 className="hero-h">📉 Retention Statistic</h1><div className="card">Loading…</div></>;

  const cohorts = d.cohorts || [];
  const totalPlayers = cohorts.reduce((s, c) => s + c.size, 0);
  const avgAt = (k) => {
    const rs = cohorts.filter((c) => c.size > 0 && c.retained.length > k);
    return rs.length ? Math.round(rs.reduce((s, c) => s + c.retained[k], 0) / rs.length) : null;
  };
  const fmt = (v) => (v == null ? '—' : v + '%');

  const retExport = () => {
    dlCsv('retention-cohorts.csv', ['Cohort Week', 'Players', 'Week +1 %', 'Week +2 %', 'Week +3 %', 'Week +4 %'],
      cohorts.map((c) => [c.week, c.size, c.retained[0], c.retained[1], c.retained[2], c.retained[3]]));
    toast('Retention exported ⬇ cohort table');
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="hero-h">📉 Retention Statistic</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>Weekly registration cohorts and how many players come back — from real login history</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={weeks} onChange={(e) => setWeeks(Number(e.target.value))}>
            <option value={4}>Last 4 Weeks</option><option value={8}>Last 8 Weeks</option><option value={12}>Last 12 Weeks</option>
          </select>
          <button className="mini-btn" onClick={retExport}>⬇ Export</button>
        </div>
      </div>

      <div className="grid kpi-grid">
        <div className="card kpi b"><div className="lbl">Players in Cohorts</div><div className="val">{totalPlayers.toLocaleString()}</div><div className="trend" style={{ color: 'var(--muted)' }}>registered in last {weeks} weeks</div></div>
        <div className="card kpi g"><div className="lbl">Week +1 Retention</div><div className="val">{fmt(avgAt(0))}</div><div className="trend" style={{ color: 'var(--muted)' }}>avg across cohorts</div></div>
        <div className="card kpi"><div className="lbl">Week +2 Retention</div><div className="val">{fmt(avgAt(1))}</div><div className="trend" style={{ color: 'var(--muted)' }}>avg across cohorts</div></div>
        <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">Week +4 Retention</div><div className="val">{fmt(avgAt(3))}</div><div className="trend" style={{ color: 'var(--muted)' }}>avg across cohorts</div></div>
      </div>

      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="card-title">Cohort Retention (%) — each row is a registration week</div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table style={{ minWidth: 720 }}>
          <thead><tr><th>Cohort Week</th><th>Players</th><th>Week +1</th><th>Week +2</th><th>Week +3</th><th>Week +4</th></tr></thead>
          <tbody>
            {cohorts.length === 0
              ? <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>No registrations yet — cohorts appear as players sign up.</td></tr>
              : cohorts.map((c) => (
                <tr key={c.week}>
                  <td><b>{c.week}</b></td>
                  <td style={{ color: c.size ? 'inherit' : 'var(--muted)' }}>{c.size.toLocaleString()}</td>
                  {[0, 1, 2, 3].map((k) => (
                    <td key={k}>{c.size === 0 ? <span className="rep-mut">—</span> : retPct(c.retained[k] ?? null, WEEK_COLORS[k])}</td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table></div>
      </div>
      <div className="hero-sub" style={{ marginTop: 10 }}>— means that week hasn't been reached yet for the cohort. Retention = % of the cohort that logged in during that later week.</div>
    </>
  );
}
