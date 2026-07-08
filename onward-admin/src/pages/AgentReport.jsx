import { useEffect, useState } from 'react';
import { agentDashboard } from '../services/agentService';

/*
 * Agent Dashboard — live KPIs + 30-day application / approval charts +
 * status funnel + top agents by downline GGR.
 */
const money = (v) => Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const ST_LABEL = {
  pending: ['⏳ Pending', '#ff8c42'],
  document_review: ['📄 Document Review', '#4da3ff'],
  under_investigation: ['🔍 Investigation', '#9b6dff'],
  need_more_documents: ['📎 Need Documents', '#ffd166'],
  approved: ['✅ Approved', '#3ddc84'],
  rejected: ['✗ Rejected', '#ff5c5c'],
};

function Bars({ days, values, color }) {
  const max = Math.max(1, ...values);
  return (
    <div className="bars-wrap"><div className="bars">
      {values.map((v, i) => (
        <div className="bar" key={i} title={`${days[i]}: ${v}`}
          style={{ height: `${Math.max(4, Math.round((v / max) * 100))}%`, background: color }}>
          <span>{i % 5 === 0 ? days[i].slice(5) : ''}</span>
        </div>
      ))}
    </div></div>
  );
}

export default function AgentReport() {
  const [d, setD] = useState(null);

  useEffect(() => {
    const load = () => agentDashboard().then(setD).catch(() => {});
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  if (!d) return <><h1 className="hero-h">📊 Agent Dashboard</h1><div className="card">Loading…</div></>;
  const k = d.kpis || {};
  const totalApps = Object.values(d.byStatus || {}).reduce((s, n) => s + n, 0) || 1;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="hero-h">📊 Agent Dashboard</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>Live overview of the agent programme — refreshes every 30s</div>
        </div>
      </div>

      <div className="grid kpi-grid">
        <div className="card kpi b"><div className="lbl">Total Agents</div><div className="val">{k.totalAgents ?? 0}</div><div className="trend" style={{ color: 'var(--muted)' }}>{k.activeAgents ?? 0} active · {k.suspended ?? 0} suspended · {k.blacklisted ?? 0} blacklisted</div></div>
        <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">Applications in Workflow</div><div className="val">{k.pendingApplications ?? 0}</div><div className="trend" style={{ color: 'var(--muted)' }}>awaiting a decision</div></div>
        <div className="card kpi g"><div className="lbl">Referred Players</div><div className="val">{(k.referredPlayers ?? 0).toLocaleString()}</div><div className="trend" style={{ color: 'var(--muted)' }}>across all agents</div></div>
        <div className="card kpi"><div className="lbl">Commission Paid / Pending</div><div className="val">{money(k.commissionPaid)}</div><div className="trend" style={{ color: '#ff8c42' }}>{money(k.commissionPending)} pending</div></div>
      </div>

      <div className="grid two-col" style={{ marginTop: 'var(--pad)' }}>
        <div className="card">
          <div className="card-title">📥 Applications — Last 30 Days</div>
          <Bars days={d.charts.days} values={d.charts.appsPerDay} />
        </div>
        <div className="card">
          <div className="card-title">✅ Approvals — Last 30 Days</div>
          <Bars days={d.charts.days} values={d.charts.approvalsPerDay} color="var(--green,#3ddc84)" />
        </div>
      </div>

      <div className="grid two-col" style={{ marginTop: 'var(--pad)' }}>
        <div className="card">
          <div className="card-title">🔀 Workflow Funnel</div>
          <div className="rowlist">
            {Object.entries(d.byStatus || {}).map(([st, n]) => {
              const [label, color] = ST_LABEL[st] || [st, 'var(--muted)'];
              return (
                <div className="rowline" key={st} style={{ alignItems: 'center', gap: 10 }}>
                  <span className="k" style={{ minWidth: 170 }}>{label}</span>
                  <span style={{ flex: 1, height: 8, background: 'rgba(255,255,255,.06)', borderRadius: 5, overflow: 'hidden' }}>
                    <span style={{ display: 'block', width: `${Math.round((n / totalApps) * 100)}%`, height: '100%', background: color }} />
                  </span>
                  <span className="v" style={{ minWidth: 34, textAlign: 'right' }}>{n}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card">
          <div className="card-title">🏆 Top Agents by Downline GGR</div>
          <div className="rowlist">
            {(d.topAgents || []).length === 0 && <div className="rowline"><span className="k" style={{ color: 'var(--muted)' }}>No agent activity yet.</span></div>}
            {(d.topAgents || []).map((a, i) => (
              <div className="rowline" key={a.id}>
                <span className="k">{['🥇', '🥈', '🥉'][i] || '·'} <b style={{ color: 'var(--text,#fff)' }}>{a.username}</b> <span style={{ color: 'var(--muted)', fontSize: 11 }}>{a.code} · {a.players} player{a.players === 1 ? '' : 's'}</span></span>
                <span className="v" style={{ color: 'var(--gold)' }}>{money(a.ggr)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
