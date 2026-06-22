// Ported from V["agent-report"] — static performance KPIs.
export default function AgentReport() {
  return (
    <>
      <h1 className="hero-h">Agent Report</h1>
      <div className="hero-sub">Agent performance reporting.</div>
      <div className="grid kpi-grid">
        <div className="card kpi"><div className="lbl">Active Agents</div><div className="val">48</div></div>
        <div className="card kpi g"><div className="lbl">Agent NGR (MTD)</div><div className="val">₱2.4M</div></div>
        <div className="card kpi b"><div className="lbl">New Players via Agents</div><div className="val">1,180</div></div>
        <div className="card kpi r"><div className="lbl">Commission Owed</div><div className="val">₱612K</div></div>
      </div>
    </>
  );
}
