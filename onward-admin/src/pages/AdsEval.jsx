import { useEffect, useState } from 'react';
import { useUI } from '../context/UIContext';
import { listAdsCampaigns, getSummary } from '../services/marketingService';

const money = (v) => Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const PLATFORM_ICON = { google: '🔍', meta: '📘', tiktok: '🎵', telegram: '✈️', x: '🐦', snapchat: '👻', custom: '🔗' };

export default function AdsEval() {
  const { toast } = useUI();
  const [camps, setCamps] = useState(null);
  const [sum, setSum] = useState(null);

  const load = () => Promise.all([listAdsCampaigns(), getSummary()])
    .then(([c, s]) => { setCamps(Array.isArray(c) ? c : []); setSum(s); });
  useEffect(() => { load().catch(() => {}); }, []);

  const radsRefresh = () => load()
    .then(() => toast('Ads evaluation refreshed ↻'))
    .catch(() => toast('⚠ Refresh failed'));

  if (!camps) return <><h1 className="hero-h">📣 Ads Evaluation</h1><div className="card">Loading…</div></>;

  const totSpend = camps.reduce((s, c) => s + Number(c.metrics?.spend || 0), 0);
  const totRegs = camps.reduce((s, c) => s + Number(c.metrics?.registrations || 0), 0);
  const totFtd = camps.reduce((s, c) => s + Number(c.metrics?.ftd || 0), 0);
  const totRevenue = camps.reduce((s, c) => s + Number(c.metrics?.revenue || 0), 0);
  const totProfit = totRevenue - totSpend;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="hero-h">📣 Ads Evaluation</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>Campaign performance — registrations and revenue attributed by UTM code from real platform data</div>
        </div>
        <div><button className="mini-btn" onClick={radsRefresh}>↻ Refresh</button></div>
      </div>

      <div className="grid kpi-grid">
        <div className="card kpi b"><div className="lbl">Registrations</div><div className="val">{totRegs.toLocaleString()}</div><div className="trend" style={{ color: 'var(--muted)' }}>{totFtd.toLocaleString()} first deposits</div></div>
        <div className="card kpi g"><div className="lbl">Attributed Revenue</div><div className="val">{money(totRevenue)}</div><div className="trend" style={{ color: 'var(--muted)' }}>approved deposits</div></div>
        <div className="card kpi"><div className="lbl">Ad Spend</div><div className="val">{money(sum?.adSpend ?? totSpend)}</div><div className="trend" style={{ color: 'var(--muted)' }}>{(sum?.adsCampaigns ?? camps.length)} campaigns</div></div>
        <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">Profit</div><div className="val" style={{ color: totProfit >= 0 ? 'var(--green)' : 'var(--red)' }}>{money(totProfit)}</div><div className="trend" style={{ color: 'var(--muted)' }}>revenue − spend</div></div>
      </div>

      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="card-title">📊 Campaign Results</div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table style={{ minWidth: 1100 }}>
          <thead><tr><th>Campaign</th><th>Platform</th><th>Status</th><th>Spend</th><th>Impr.</th><th>Clicks</th><th>CTR</th><th>Regs</th><th>FTD</th><th>Revenue</th><th>ROAS</th><th>Profit</th></tr></thead>
          <tbody>
            {camps.length === 0
              ? <tr><td colSpan={12} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>No ads campaigns yet — create them under Marketing → Ads.</td></tr>
              : camps.map((c) => {
                const m = c.metrics || {};
                const k = c.kpi || {};
                return (
                  <tr key={c.id}>
                    <td><b>{c.name}</b>{c.utm ? <span style={{ color: 'var(--muted)', fontSize: 11 }}> · {c.utm}</span> : null}</td>
                    <td>{PLATFORM_ICON[c.platform] || '🔗'} {c.platform}</td>
                    <td><span className={`badge ${c.status === 'active' ? 'ok' : c.status === 'paused' ? 'pend' : 'off'}`}>{c.status}</span></td>
                    <td>{money(m.spend)}</td>
                    <td style={{ color: 'var(--muted)' }}>{Number(m.impressions || 0).toLocaleString()}</td>
                    <td style={{ color: 'var(--muted)' }}>{Number(m.clicks || 0).toLocaleString()}</td>
                    <td style={{ color: 'var(--muted)' }}>{Number(k.ctr || 0).toFixed(2)}%</td>
                    <td style={{ fontWeight: 800 }}>{Number(m.registrations || 0).toLocaleString()}</td>
                    <td>{Number(m.ftd || 0).toLocaleString()}</td>
                    <td style={{ color: 'var(--gold)' }}>{money(m.revenue)}</td>
                    <td>{Number(k.roas || 0).toFixed(2)}×</td>
                    <td style={{ color: (k.profit || 0) >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 800 }}>{money(k.profit)}</td>
                  </tr>
                );
              })}
          </tbody>
        </table></div>
      </div>
    </>
  );
}
