import { useEffect, useMemo, useState } from 'react';
import { useUI } from '../context/UIContext';
import {
  listApplications, getApplication, updateApplication, bulkApplications,
  listPlans, listManagers, downloadCsv,
} from '../services/agentService';

/*
 * Agent Approval — CRM-style workflow queue for agent applications.
 * Statuses: pending → document_review → under_investigation →
 *           need_more_documents → approved | rejected
 */
const STATUSES = [
  ['pending', '⏳ Pending', '#ff8c42'],
  ['document_review', '📄 Document Review', '#4da3ff'],
  ['under_investigation', '🔍 Investigation', '#9b6dff'],
  ['need_more_documents', '📎 Need Documents', '#ffd166'],
  ['approved', '✅ Approved', '#3ddc84'],
  ['rejected', '✗ Rejected', '#ff5c5c'],
];
const ST = Object.fromEntries(STATUSES.map(([v, l, c]) => [v, { l, c }]));
const RISKS = ['unrated', 'low', 'medium', 'high'];
const RISK_COLOR = { unrated: 'var(--muted)', low: '#3ddc84', medium: '#ffd166', high: '#ff5c5c' };

const stBadge = (st) => {
  const m = ST[st] || { l: st, c: 'var(--muted)' };
  return <span className="aa-status2" style={{ background: m.c + '22', color: m.c, border: `1px solid ${m.c}55` }}>{m.l}</span>;
};
const fmt = (t) => { if (!t) return '—'; const d = new Date(t); return Number.isNaN(d.getTime()) ? String(t) : d.toLocaleString(); };
const Check = ({ ok, label }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: ok ? 'var(--green)' : '#ff8c42' }}>
    {ok ? '✓' : '✗'} {label}
  </span>
);

export default function AgentApproval() {
  const { toast } = useUI();
  const [apps, setApps] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('');
  const [sel, setSel] = useState([]); // selected ids (bulk)
  const [plans, setPlans] = useState([]);
  const [managers, setManagers] = useState([]);

  const load = () => listApplications().then((rows) => { setApps(Array.isArray(rows) ? rows : []); setLoaded(true); }).catch(() => setLoaded(true));
  useEffect(() => {
    load();
    listPlans().then(setPlans).catch(() => {});
    listManagers().then(setManagers).catch(() => {});
    const id = setInterval(load, 25000); // approval queue: poll for new applications
    return () => clearInterval(id);
  }, []);

  const visible = useMemo(() => {
    const ql = q.toLowerCase();
    return apps.filter((a) =>
      (!tab || a.status === tab)
      && (!ql || [a.fullName, a.username, a.email, a.phone, a.playerCode].some((v) => (v || '').toLowerCase().includes(ql))));
  }, [apps, q, tab]);

  const counts = useMemo(() => {
    const c = {};
    STATUSES.forEach(([v]) => { c[v] = apps.filter((a) => a.status === v).length; });
    return c;
  }, [apps]);
  const inQueue = apps.filter((a) => !['approved', 'rejected'].includes(a.status)).length;

  /* ---------- bulk selection ---------- */
  const toggleSel = (id) => setSel((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleAll = () => setSel((p) => (p.length === visible.length ? [] : visible.map((a) => a.id)));

  const bulk = async (status) => {
    if (!sel.length) { toast('Select applications first'); return; }
    const remarks = status === 'rejected' ? (window.prompt('Rejection remarks (sent to applicants):') ?? null) : '';
    if (remarks === null) return;
    try {
      await bulkApplications(sel, { status, remarks });
      toast(`${sel.length} application(s) → ${ST[status]?.l || status}`);
      setSel([]);
      load();
    } catch (e) { toast('⚠ ' + (e.message || 'Bulk action failed')); }
  };

  const exportCsv = () => {
    downloadCsv('agent-applications.csv',
      ['Applied', 'Full name', 'Username', 'Email', 'Phone', 'Bank', 'Account', 'Status', 'Risk', 'Remarks'],
      visible.map((a) => [(a.createdAt || '').slice(0, 10), a.fullName, a.username, a.email, a.phone, a.bankName, a.bankAccountNo, a.status, a.riskLevel, a.remarks]));
    toast('CSV exported ⬇ agent-applications.csv');
  };

  /* ---------- detail / review modal ---------- */
  const [detail, setDetail] = useState(null);   // full application (+history/player/eligibility)
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);

  const openDetail = async (id) => {
    try { const d = await getApplication(id); setDetail(d); setRemarks(d.remarks || ''); }
    catch (e) { toast('⚠ ' + (e.message || 'Could not load application')); }
  };
  const close = () => setDetail(null);

  const act = async (patch, msg) => {
    if (!detail) return;
    setBusy(true);
    try {
      await updateApplication(detail.id, { remarks, ...patch });
      toast(msg || 'Saved ✔');
      const d = await getApplication(detail.id).catch(() => null);
      if (d && patch.status && !['approved', 'rejected'].includes(patch.status)) { setDetail(d); }
      else close();
      load();
    } catch (e) { toast('⚠ ' + (e.message || 'Action failed')); }
    finally { setBusy(false); }
  };

  const setMeta = async (key, value) => {
    if (!detail) return;
    try {
      await updateApplication(detail.id, { [key]: value });
      setDetail((p) => ({ ...p, [key]: value }));
      toast('Saved ✔');
      load();
    } catch (e) { toast('⚠ ' + (e.message || 'Save failed')); }
  };

  const cell = (lb, vl) => (
    <div className="cell"><div className="lb">{lb}</div><div className="vl">{vl || '—'}</div></div>
  );

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="hero-h">✅ Agent Approval</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>
            {inQueue} application{inQueue === 1 ? '' : 's'} in the workflow — applicants must pass KYC + email + mobile verification before they can apply.
          </div>
        </div>
        <span className="pr"><button className="mini-btn" onClick={exportCsv}>📋 Export CSV</button></span>
      </div>

      {/* status funnel */}
      <div className="grid kpi-grid" style={{ gridTemplateColumns: 'repeat(6,1fr)' }}>
        {STATUSES.map(([v, l, c]) => (
          <div key={v} className="card kpi" style={{ borderTopColor: c, cursor: 'pointer', outline: tab === v ? `1px solid ${c}` : 'none' }}
            onClick={() => setTab(tab === v ? '' : v)}>
            <div className="lbl">{l}</div><div className="val">{counts[v] || 0}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="page-head" style={{ marginBottom: 12 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>📄 Applications {tab ? `· ${ST[tab].l}` : ''}</div>
          <span className="pr" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {sel.length > 0 && (
              <>
                <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 800 }}>{sel.length} selected</span>
                <button className="mini-btn" onClick={() => bulk('document_review')}>📄 To Review</button>
                <button className="mini-btn green" onClick={() => bulk('approved')}>✅ Approve</button>
                <button className="btn-cancel-red" style={{ padding: '7px 12px' }} onClick={() => bulk('rejected')}>✗ Reject</button>
              </>
            )}
            <input className="qsearch" placeholder="Name, username, email, phone…" value={q} onInput={(e) => setQ(e.target.value)} />
          </span>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table style={{ minWidth: 1100 }}>
            <thead><tr>
              <th><input type="checkbox" className="permcb" checked={visible.length > 0 && sel.length === visible.length} onChange={toggleAll} /></th>
              <th>Applicant</th><th>Username</th><th>Contact</th><th>Banking</th><th>Docs</th><th>Applied</th><th>Risk</th><th>Status</th><th></th>
            </tr></thead>
            <tbody>
              {visible.length === 0 && (
                <tr><td colSpan={10} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>
                  {loaded ? 'No applications' + (tab ? ` in ${ST[tab].l}` : ' yet — players apply from the Agent page on the site.') : 'Loading…'}
                </td></tr>
              )}
              {visible.map((a) => (
                <tr key={a.id}>
                  <td><input type="checkbox" className="permcb" checked={sel.includes(a.id)} onChange={() => toggleSel(a.id)} /></td>
                  <td><div className="ag-name">{a.fullName}</div><div className="ag-email">{a.email}</div></td>
                  <td><span className="ag-user">{a.username}</span></td>
                  <td>{a.phone || '—'}</td>
                  <td><div style={{ fontWeight: 700 }}>{a.bankName || '—'}</div><div className="ag-email">{a.bankAccountNo || ''}</div></td>
                  <td>{(a.documents || []).length} file{(a.documents || []).length === 1 ? '' : 's'}</td>
                  <td style={{ color: '#aab4cc' }}>{(a.createdAt || '').slice(0, 10)}</td>
                  <td><span style={{ color: RISK_COLOR[a.riskLevel] || 'var(--muted)', fontWeight: 800, textTransform: 'capitalize' }}>{a.riskLevel || 'unrated'}</span></td>
                  <td>{stBadge(a.status)}</td>
                  <td><button className="mini-btn gold" onClick={() => openDetail(a.id)}>👁 Review</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------------- review modal ---------------- */}
      {detail && (
        <div className="modal-ov show" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
          <div className="kyc-modal" style={{ maxWidth: 860 }}>
            <div className="kyc-head">
              <span style={{ fontSize: '1.2rem' }}>🧑‍💼</span>
              <span>
                <div className="t">{detail.fullName} <span style={{ marginLeft: 8 }}>{stBadge(detail.status)}</span></div>
                <div className="s">@{detail.username} · applied {fmt(detail.createdAt)}</div>
              </span>
              <button className="kyc-x" onClick={close} aria-label="Close">✕</button>
            </div>
            <div className="kyc-body">
              {/* eligibility */}
              {detail.eligibility && (
                <div className="kyc-status" style={{ gap: 14, flexWrap: 'wrap' }}>
                  <span className="os">Eligibility:</span>
                  <Check ok={detail.eligibility.kycApproved} label="KYC approved" />
                  <Check ok={detail.eligibility.emailVerified} label="Email verified" />
                  <Check ok={detail.eligibility.mobileVerified} label="Mobile verified" />
                </div>
              )}

              {/* personal */}
              <div className="card-title" style={{ marginTop: 10 }}>👤 Personal Information</div>
              <div className="kyc-info">
                {cell('Full name', detail.fullName)}
                {cell('Username', detail.username)}
                {cell('Email', detail.email)}
                {cell('Phone', detail.phone)}
                {cell('Date of birth', detail.dob)}
                {cell('Country', detail.country)}
                {cell('Address', detail.address)}
                {cell('Emergency contact', detail.emergencyContact)}
                {cell('Currency', detail.currency)}
                {cell('Marketing channels', (detail.channels || []).join(', '))}
                {cell('Experience', detail.experience)}
                {cell('Expected players', detail.expectedPlayers)}
              </div>

              {/* banking */}
              <div className="card-title" style={{ marginTop: 14 }}>🏦 Banking Information</div>
              <div className="kyc-info">
                {cell('Bank', detail.bankName)}
                {cell('Account name', detail.bankAccountName)}
                {cell('Account number', detail.bankAccountNo)}
                {cell('Branch', detail.bankBranch)}
              </div>

              {/* documents */}
              <div className="card-title" style={{ marginTop: 14 }}>📎 Documents ({(detail.documents || []).length})</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {(detail.documents || []).length === 0 && <div className="kyc-note">No documents uploaded.</div>}
                {(detail.documents || []).map((d, i) => {
                  const url = typeof d === 'string' ? d : d.url;
                  const label = (typeof d === 'object' && d.name) || `Document ${i + 1}`;
                  return (
                    <a key={i} href={url} target="_blank" rel="noreferrer" style={{ display: 'block', width: 140 }}>
                      <img src={url} alt={label} style={{ width: 140, height: 90, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)', display: 'block' }} />
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, textAlign: 'center' }}>{label} · View full</div>
                    </a>
                  );
                })}
              </div>

              {/* assignment */}
              <div className="card-title" style={{ marginTop: 14 }}>⚙️ Assessment & Assignment</div>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                <div className="fld"><label>Risk level</label>
                  <select value={detail.riskLevel || 'unrated'} onChange={(e) => setMeta('riskLevel', e.target.value)}>
                    {RISKS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="fld"><label>Commission plan</label>
                  <select value={detail.planId || ''} onChange={(e) => setMeta('planId', e.target.value)}>
                    <option value="">— default —</option>
                    {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="fld"><label>Account manager</label>
                  <select value={detail.managerId || ''} onChange={(e) => setMeta('managerId', e.target.value)}>
                    <option value="">— unassigned —</option>
                    {managers.map((m) => <option key={m.id || m.name} value={m.id || m.name}>{m.name}</option>)}
                  </select>
                </div>
              </div>

              {/* remarks */}
              <div className="fld" style={{ marginTop: 10 }}>
                <label>Remarks (sent to the applicant on status change)</label>
                <textarea rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="e.g. Please upload a clearer photo of your bank statement…" style={{ width: '100%' }} />
              </div>

              {/* workflow actions */}
              <div className="kyc-status" style={{ marginTop: 12, gap: 8, flexWrap: 'wrap' }}>
                <span className="os">Workflow:</span>
                {detail.status !== 'document_review' && !['approved', 'rejected'].includes(detail.status) && (
                  <button className="mini-btn" disabled={busy} onClick={() => act({ status: 'document_review' }, 'Moved to Document Review 📄')}>📄 Document Review</button>
                )}
                {detail.status !== 'under_investigation' && !['approved', 'rejected'].includes(detail.status) && (
                  <button className="mini-btn" disabled={busy} onClick={() => act({ status: 'under_investigation' }, 'Moved to Investigation 🔍')}>🔍 Investigate</button>
                )}
                {detail.status !== 'need_more_documents' && !['approved', 'rejected'].includes(detail.status) && (
                  <button className="mini-btn" disabled={busy} onClick={() => act({ status: 'need_more_documents' }, 'Documents requested 📎 — applicant notified')}>📎 Request Documents</button>
                )}
                <span style={{ flex: 1 }} />
                {detail.status !== 'approved' && (
                  <button className="mini-btn green" disabled={busy} onClick={() => act({ status: 'approved' }, 'Application approved ✅ — agent activated')}>✅ Approve</button>
                )}
                {detail.status !== 'rejected' && (
                  <button className="btn-cancel-red" style={{ padding: '8px 14px' }} disabled={busy} onClick={() => act({ status: 'rejected' }, 'Application rejected ✗ — applicant notified')}>✗ Reject</button>
                )}
              </div>

              {/* history timeline */}
              <div className="card-title" style={{ marginTop: 16 }}>🕐 History</div>
              <div className="rowlist">
                {(detail.history || []).slice().reverse().map((h, i) => (
                  <div className="rowline" key={i}>
                    <span className="k">
                      <b style={{ color: 'var(--text,#fff)' }}>{h.action}</b>
                      {h.remarks ? <span style={{ color: 'var(--muted)' }}> — {h.remarks}</span> : ''}
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{h.admin}{h.ip ? ` · ${h.ip}` : ''}</div>
                    </span>
                    <span className="feed-time">{fmt(h.createdAt)}</span>
                  </div>
                ))}
                {(detail.history || []).length === 0 && <div className="rowline"><span className="k" style={{ color: 'var(--muted)' }}>No history yet.</span></div>}
              </div>
            </div>
            <div className="kyc-foot">
              <button className="btn-save" disabled={busy} onClick={() => act({}, 'Remarks saved 💾')}>💾 Save Remarks</button>
              <button className="btn-cancel" onClick={close}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
