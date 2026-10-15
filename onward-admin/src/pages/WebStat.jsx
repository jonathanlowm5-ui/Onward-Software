import { useEffect, useState } from 'react';
import { useUI } from '../context/UIContext';
import { getWebstat } from '../services/configService';

// Smooth (Catmull-Rom -> Bézier) path through a set of points.
function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

// Line/area chart with a labelled Y-axis grid and crisp HTML labels.
function Chart({ data, labels, color, gid }) {
  const n = data.length;
  const W = 1000, H = 240, padY = 20;
  const dataMax = Math.max(...data, 1);
  const min = Math.min(0, ...data);
  const max = dataMax * 1.12 || 1;
  const range = (max - min) || 1;
  const xAt = (i) => (n === 1 ? W / 2 : (i / (n - 1)) * W);
  const yAt = (v) => padY + (1 - (v - min) / range) * (H - padY * 2);
  const pts = data.map((v, i) => [xAt(i), yAt(v)]);
  const line = smoothPath(pts);
  const areaD = `${line} L${W},${H} L0,${H} Z`;
  const steps = 4;
  const grid = Array.from({ length: steps + 1 }, (_, i) => {
    const val = min + range * (i / steps);
    return { y: yAt(val), val: Math.round(val) };
  });
  const rotate = n > 14;
  const showVals = n <= 31;
  const labelEvery = Math.max(1, Math.ceil(n / 16));
  return (
    <div className="ws-chart">
      <div className="ws-yaxis">
        {[...grid].reverse().map((g, i) => <span key={i}>{g.val}</span>)}
      </div>
      <div className="ws-chart-main">
        <div className="ws-plot">
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="ws-plot-svg">
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.30" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            {grid.map((g, i) => (
              <line key={i} x1="0" x2={W} y1={g.y.toFixed(1)} y2={g.y.toFixed(1)} stroke="var(--border)" strokeWidth="1" opacity="0.55" />
            ))}
            <path d={areaD} fill={`url(#${gid})`} />
            <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </svg>
          {pts.map((p, i) => {
            const left = `${(p[0] / W) * 100}%`;
            const top = `${(p[1] / H) * 100}%`;
            return (
              <span key={i}>
                {showVals && <span className="ws-pt-val" style={{ left, top }}>{data[i]}</span>}
                <span className="ws-dot" style={{ left, top, color }} />
              </span>
            );
          })}
        </div>
        <div className={'ws-xaxis' + (rotate ? ' rot' : '')}>
          {labels.map((l, i) => (i % labelEvery === 0
            ? <span key={i} className="ws-xlab" style={{ left: `${(xAt(i) / W) * 100}%` }}>{l}</span>
            : null))}
        </div>
      </div>
    </div>
  );
}

const dlCsv = (name, header, rows) => {
  const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
};

export default function WebStat() {
  const { toast } = useUI();
  const [days, setDays] = useState(30);
  const [d, setD] = useState(null);

  useEffect(() => { getWebstat(days).then(setD).catch(() => {}); }, [days]);

  if (!d) return <><h1 className="hero-h">📈 Web Statistic</h1><div className="card">Loading…</div></>;

  const labels = (d.days || []).map((x) => x.slice(5));
  const t = d.totals || {};
  const totalDevice = Math.max(1, (d.devices || []).reduce((s, x) => s + x.count, 0));
  const totalCountry = Math.max(1, (d.countries || []).reduce((s, x) => s + x.count, 0));

  const wsExport = () => {
    dlCsv('web-statistic.csv', ['Date', 'Visits', 'Unique Players', 'Registrations'],
      (d.days || []).map((day, i) => [day, d.visits[i], d.uniquePlayers[i], d.registrations[i]]));
    toast('Exported ⬇ web-statistic.csv');
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="hero-h">📈 Web Statistic</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>Visits (logins), unique players, registrations, devices and countries — from real login history</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>Last 7 Days</option><option value={14}>Last 14 Days</option><option value={30}>Last 30 Days</option><option value={90}>Last 90 Days</option>
          </select>
          <button className="mini-btn" onClick={wsExport}>⬇ Export</button>
        </div>
      </div>

      <div className="grid kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="card kpi b"><div className="lbl">Total Visits</div><div className="val">{(t.visits ?? 0).toLocaleString()}</div><div className="trend" style={{ color: 'var(--muted)' }}>logins · last {days} days</div></div>
        <div className="card kpi g"><div className="lbl">Registrations</div><div className="val">{(t.registrations ?? 0).toLocaleString()}</div><div className="trend" style={{ color: 'var(--muted)' }}>new sign-ups in period</div></div>
        <div className="card kpi"><div className="lbl">Total Players</div><div className="val">{(t.players ?? 0).toLocaleString()}</div><div className="trend" style={{ color: 'var(--muted)' }}>all time</div></div>
      </div>

      <div className="card" style={{ marginTop: 'var(--pad)' }}><div className="card-title">👣 Visits per Day</div>
        <div className="ws-chart-box"><Chart data={d.visits} labels={labels} color="#3aa0ff" gid="ws-grad-visits" /></div>
      </div>
      <div className="card" style={{ marginTop: 'var(--pad)' }}><div className="card-title">👥 Registrations per Day</div>
        <div className="ws-chart-box"><Chart data={d.registrations} labels={labels} color="#2ecc71" gid="ws-grad-regs" /></div>
      </div>

      <div className="grid two-col" style={{ marginTop: 'var(--pad)' }}>
        <div className="card"><div className="card-title">📱 Devices</div>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table>
            <thead><tr><th>Device</th><th>Visits</th><th>Share</th></tr></thead>
            <tbody>
              {(d.devices || []).length === 0
                ? <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--muted)', padding: 22 }}>No login data yet.</td></tr>
                : d.devices.map((x) => (
                  <tr key={x.device}><td><b>{x.device}</b></td><td>{x.count.toLocaleString()}</td><td style={{ color: 'var(--muted)' }}>{Math.round((x.count / totalDevice) * 100)}%</td></tr>
                ))}
            </tbody>
          </table></div>
        </div>
        <div className="card"><div className="card-title">🌎 Top Countries</div>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table>
            <thead><tr><th>Country</th><th>Visits</th><th>Share</th></tr></thead>
            <tbody>
              {(d.countries || []).length === 0
                ? <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--muted)', padding: 22 }}>No country data yet.</td></tr>
                : d.countries.map((x) => (
                  <tr key={x.country}><td><b>{x.country}</b></td><td>{x.count.toLocaleString()}</td><td style={{ color: 'var(--muted)' }}>{Math.round((x.count / totalCountry) * 100)}%</td></tr>
                ))}
            </tbody>
          </table></div>
        </div>
      </div>
    </>
  );
}
