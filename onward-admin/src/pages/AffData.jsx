import { Fragment, useEffect, useMemo, useState } from 'react';
import { useUI } from '../context/UIContext';
import { listApplications, updateApplication } from '../services/agentService';

// Real affiliate/agent applications overview (full CRM lives in Agent → Agent Approval).
const ST = {
  pending: ['⏳ Pending', 's-pend'],
  reviewing: ['🔍 Reviewing', 's-pend'],
  need_more_documents: ['📄 Docs Needed', 's-pend'],
  approved: ['✅ Approved', 's-app'],
  rejected: ['❌ Rejected', 's-rej'],
};
const chip = (s) => {
  const [label, cls] = ST[s] || [s, 's-pend'];
  return <span className={`aa-status2 ${cls}`}>{label}</span>;
};

export default function AffData() {
  const { toast } = useUI();
  const [apps, setApps] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState(null);

  const load = () => listApplications()
    .then((rows) => { setApps(Array.isArray(rows) ? rows : []); setLoaded(true); })
    .catch((e) => { setLoaded(true); toast('⚠ ' + (e.message || 'Failed to load applications')); });
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const visible = useMemo(() => {
    const ql = q.toLowerCase();
    return apps.filter((a) => !ql || [a.username, a.fullName, a.email, a.phone, a.playerCode].some((v) => (v || '').toLowerCase().includes(ql)));
  }, [apps, q]);

  const kpi = useMemo(() => ({
    pending: apps.filter((a) => !['approved', 'rejected'].includes(a.status)).length,
    approved: apps.filter((a) => a.status === 'approved').length,
    rejected: apps.filter((a) => a.status === 'rejected').length,
  }), [apps]);

  const decide = async (a, status) => {
    try {
      await updateApplication(a.id, { status });
      toast(status === 'approved' ? `Application approved ✅ ${a.username}` : `Application rejected ❌ ${a.username}`);
      load();
    } catch (e) { toast('⚠ ' + (e.message || 'Update failed')); }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="hero-h">🤝 Affiliate Data — Player MLM</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>Live affiliate applications from players · Full CRM workflow (docs, risk, plans) lives in <b>Agent → Agent Approval</b></div>
        </div>
        <span className="pr">
          <input className="qsearch" placeholder="Search name / email / code…" value={q} onInput={(e) => setQ(e.target.value)} />
        </span>
      </div>

      <div className="grid kpi-grid">
        <div className="card kpi b"><div className="lbl">Applications</div><div className="val">{apps.length}</div><div className="trend" style={{ color: 'var(--muted)' }}>all time</div></div>
        <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">Awaiting Decision</div><div className="val">{kpi.pending}</div><div className="trend" style={{ color: 'var(--muted)' }}>pending / reviewing</div></div>
        <div className="card kpi g"><div className="lbl">Approved</div><div className="val">{kpi.approved}</div><div className="trend" style={{ color: 'var(--muted)' }}>active affiliates</div></div>
        <div className="card kpi r"><div className="lbl">Rejected</div><div className="val">{kpi.rejected}</div><div className="trend" style={{ color: 'var(--muted)' }}>declined</div></div>
      </div>

      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table style={{ minWidth: 1000 }}>
            <thead><tr><th>Applicant</th><th>Player Code</th><th>Applied</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {visible.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: 26 }}>
                  {loaded ? (q ? 'No applications match this search.' : 'No affiliate applications yet — players apply from the frontend affiliate page.') : 'Loading…'}
                </td></tr>
              )}
              {visible.map((a) => (
                <Fragment key={a.id}>
                  <tr>
                    <td><div className="ag-name">{a.fullName || a.username}</div><div className="ag-email">{a.username} · {a.email}</div></td>
                    <td><span className="code-chip">{a.playerCode || '—'}</span></td>
                    <td style={{ color: '#aab4cc' }}>{(a.createdAt || '').slice(0, 10)}</td>
                    <td>{chip(a.status)}</td>
                    <td>
                      <button className="mini-btn" onClick={() => setOpenId(openId === a.id ? null : a.id)}>{openId === a.id ? '▲ Hide' : '👁 View'}</button>{' '}
                      {a.status !== 'approved' && <button className="mini-btn gold" onClick={() => decide(a, 'approved')}>✅ Approve</button>}{' '}
                      {a.status !== 'rejected' && a.status !== 'approved' && <button className="mini-btn" onClick={() => decide(a, 'rejected')}>❌ Reject</button>}
                    </td>
                  </tr>
                  {openId === a.id && (
                    <tr>
                      <td colSpan={5} style={{ background: 'var(--panel-3,#1b2541)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10, padding: 10, fontSize: 12 }}>
                          <div><div style={{ color: 'var(--muted)' }}>Phone</div><b>{a.phone || '—'}</b></div>
                          <div><div style={{ color: 'var(--muted)' }}>Email</div><b>{a.email || '—'}</b></div>
                          <div><div style={{ color: 'var(--muted)' }}>Bank</div><b>{a.bank || a.bankName || '—'} {a.bankAccountNumber || a.accountNumber || ''}</b></div>
                          <div><div style={{ color: 'var(--muted)' }}>Risk</div><b>{a.riskLevel || 'unrated'}</b></div>
                          <div><div style={{ color: 'var(--muted)' }}>Remarks</div><b>{a.remarks || '—'}</b></div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
