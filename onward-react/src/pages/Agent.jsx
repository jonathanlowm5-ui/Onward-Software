import { useCallback, useEffect, useRef, useState } from 'react';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import { uploadFile } from '../services/playersService';
import api from '../services/api';

/*
 * Agent / affiliate page.
 *
 * Guest        → marketing pitch + join CTA.
 * Logged in    → eligibility checklist (KYC approved + email + mobile verified),
 *                then the application form (personal + banking + documents).
 * Applied      → live status tracker (pending → document review → investigation
 *                → need more documents → approved / rejected) + timeline,
 *                with extra-document upload when requested.
 * Approved     → agent panel: referral code, downline, commissions.
 */
const STEPS = [
  { num: '1', icon: '🪪', title: 'Verify Your Account', desc: 'Complete KYC and verify your email and mobile number — only verified players can become agents.' },
  { num: '2', icon: '📝', title: 'Apply as Agent', desc: 'Fill in your details, banking info and supporting documents. Our team reviews every application.' },
  { num: '3', icon: '💸', title: 'Refer & Earn', desc: 'Share your agent code. Earn CPA and revenue-share commission on every player you bring in.' },
];

const CHANNELS = ['Facebook', 'Telegram', 'TikTok', 'YouTube', 'Instagram', 'Community / Offline'];

const FLOW = [
  ['pending', '⏳', 'Submitted'],
  ['document_review', '📄', 'Document Review'],
  ['under_investigation', '🔍', 'Investigation'],
  ['approved', '✅', 'Approved'],
];
const ST_LABEL = {
  pending: ['⏳ Pending Review', '#ff9f43'],
  document_review: ['📄 Document Review', '#4da3ff'],
  under_investigation: ['🔍 Under Investigation', '#9b6dff'],
  need_more_documents: ['📎 More Documents Needed', '#ffd166'],
  approved: ['✅ Approved', '#22c55e'],
  rejected: ['✗ Rejected', '#ff5c5c'],
};

const money = (v) => Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const fmt = (t) => { if (!t) return ''; const d = new Date(t); return Number.isNaN(d.getTime()) ? String(t) : d.toLocaleString(); };

const card = { background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: 18 };
const inputSt = { width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 9, padding: '10px 12px', color: '#fff', fontSize: 14 };
const lblSt = { display: 'block', fontSize: 12, color: 'rgba(255,255,255,.5)', fontWeight: 700, marginBottom: 5 };

function Fld({ label, req, children }) {
  return (
    <div>
      <label style={lblSt}>{label} {req && <span style={{ color: '#e8293a' }}>*</span>}</label>
      {children}
    </div>
  );
}

export default function Agent() {
  const { toast, openModal } = useUI();
  const { profile, isLoggedIn } = useAuth();

  const [me, setMe] = useState(null);           // { application, agent, history } | null
  const [elig, setElig] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isLoggedIn) { setLoading(false); return; }
    setLoading(true);
    try {
      const r = await api.get('/agents/me');
      setMe(r.data);
    } catch {
      setMe(null);
      try { const e = await api.get('/agents/eligibility'); setElig(e.data); } catch { /* ignore */ }
    } finally { setLoading(false); }
  }, [isLoggedIn]);
  useEffect(() => { load(); }, [load]);

  const agent = me?.agent && me.agent.status !== 'blacklisted' ? me.agent : null;
  const application = me?.application || null;
  const showForm = isLoggedIn && !agent && (!application || application.status === 'rejected');

  return (
    <div id="view-agent">
      <div className="ref-page">
        <div className="ref-inner">

          {/* Hero */}
          <div className="ref-hero">
            <div className="ref-hero-icon">🧑‍💼</div>
            <div className="ref-hero-content">
              <div className="ref-hero-title">Become an<br /><span>Onward Agent</span></div>
              <div className="ref-hero-sub">Partner with Onward and earn CPA + revenue-share commission on every player you refer. Real-time tracking, monthly payouts, dedicated support.</div>
            </div>
          </div>

          {loading && <div style={{ ...card, textAlign: 'center', color: 'rgba(255,255,255,.5)' }}>Loading…</div>}

          {/* ---------------- APPROVED AGENT PANEL ---------------- */}
          {!loading && agent && <AgentPanel agent={agent} suspended={me.agent.status === 'suspended'} toast={toast} />}

          {/* ---------------- APPLICATION STATUS TRACKER ---------------- */}
          {!loading && !agent && application && application.status !== 'rejected' && (
            <StatusTracker application={application} history={me?.history || []} onUploaded={load} toast={toast} />
          )}

          {/* rejected note */}
          {!loading && !agent && application?.status === 'rejected' && (
            <div style={{ ...card, borderColor: 'rgba(255,92,92,.4)', marginBottom: 18 }}>
              <div style={{ fontWeight: 800, color: '#ff5c5c', marginBottom: 6 }}>✗ Your previous application was rejected</div>
              {application.remarks && <div style={{ fontSize: 13, color: 'rgba(255,255,255,.6)' }}>Reason: {application.remarks}</div>}
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', marginTop: 4 }}>You can submit a new application below.</div>
            </div>
          )}

          {/* ---------------- ELIGIBILITY + FORM ---------------- */}
          {!loading && showForm && (
            <>
              <Eligibility elig={elig} />
              {elig?.eligible
                ? <ApplyForm profile={profile} toast={toast} onDone={load} />
                : null}
            </>
          )}

          {/* ---------------- GUEST MARKETING ---------------- */}
          {!loading && !isLoggedIn && (
            <>
              <div className="ref-how-title">How It Works</div>
              <div className="ref-steps">
                {STEPS.map((s, i) => (
                  <div key={i} className="ref-step">
                    <div className="ref-step-num">{s.num}</div>
                    <span className="ref-step-icon">{s.icon}</span>
                    <div className="ref-step-title">{s.title}</div>
                    <div className="ref-step-desc">{s.desc}</div>
                  </div>
                ))}
              </div>
              <div className="ref-cta">
                <div>
                  <div className="ref-cta-text">Ready to start earning?</div>
                  <div className="ref-cta-sub">Create an account, verify it, and apply — it's free and your earning potential is unlimited.</div>
                </div>
                <button className="ref-cta-btn" onClick={() => openModal('register')}>🚀 Join & Apply</button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

/* ================= eligibility checklist ================= */
function Eligibility({ elig }) {
  const items = [
    ['kycApproved', '🪪 KYC verified (IC / passport approved)'],
    ['emailVerified', '📧 Email verified'],
    ['mobileVerified', '📲 Mobile number verified'],
  ];
  return (
    <div style={{ ...card, marginBottom: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 10 }}>✅ Eligibility Check</div>
      <div style={{ display: 'grid', gap: 8 }}>
        {items.map(([k, label]) => {
          const ok = !!elig?.[k];
          return (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: ok ? '#22c55e' : 'rgba(255,255,255,.55)' }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, background: ok ? 'rgba(34,197,94,.18)' : 'rgba(255,255,255,.08)', border: `1px solid ${ok ? 'rgba(34,197,94,.5)' : 'rgba(255,255,255,.15)'}` }}>{ok ? '✓' : '•'}</span>
              {label}
            </div>
          );
        })}
      </div>
      {!elig?.eligible && (
        <div style={{ marginTop: 12, fontSize: 13, color: '#ff9f43' }}>
          Complete the missing steps in <a href="/profile" style={{ color: 'var(--gold,#ffd166)', fontWeight: 700 }}>My Profile → Verification</a> to unlock the agent application.
        </div>
      )}
    </div>
  );
}

/* ================= application form ================= */
function ApplyForm({ profile, toast, onDone }) {
  const [f, setF] = useState({
    fullName: profile?.fullName || '', phone: profile?.phone || '', email: profile?.email || '',
    dob: profile?.dob || '', country: profile?.country || '', address: '',
    emergencyContact: '', channels: [], experience: '', expectedPlayers: '', notes: '',
    bankName: '', bankAccountName: '', bankAccountNo: '', bankBranch: '',
  });
  const [docs, setDocs] = useState([]); // [{name,url}]
  const [selfie, setSelfie] = useState(''); // selfie-with-ID url
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const fileRef = useRef(null);
  const selfieRef = useRef(null);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const toggleCh = (c) => set('channels', f.channels.includes(c) ? f.channels.filter((x) => x !== c) : [...f.channels, c]);

  const pick = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const { url } = await uploadFile(file, 'agent');
        setDocs((p) => [...p, { name: file.name, url }]);
      }
      toast('Document uploaded ✔', 'success');
    } catch (e) { toast('Upload failed: ' + (e.response?.data?.error || e.message), 'error'); }
    finally { setUploading(false); }
  };

  const pickSelfie = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadFile(file, 'agent');
      setSelfie(url);
      toast('Selfie uploaded ✔', 'success');
    } catch (e) { toast('Upload failed: ' + (e.response?.data?.error || e.message), 'error'); }
    finally { setUploading(false); }
  };

  const submit = async () => {
    if (!f.fullName || !f.phone || !f.email) { toast('Fill in your name, phone and email', 'error'); return; }
    if (!f.bankName || !f.bankAccountName || !f.bankAccountNo) { toast('Banking details are required', 'error'); return; }
    if (!selfie) { toast('Please upload a selfie holding your ID', 'error'); return; }
    setSending(true);
    try {
      await api.post('/agents/apply', { ...f, selfieWithId: selfie, documents: docs });
      toast('Application submitted! 🎉 Track its status here.', 'success');
      onDone();
    } catch (e) { toast(e.response?.data?.error || 'Could not submit application', 'error'); }
    finally { setSending(false); }
  };

  const grid2 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 };

  return (
    <div style={{ ...card, marginBottom: 18 }}>
      <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 12 }}>📝 Agent Application</div>

      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--gold,#ffd166)', margin: '4px 0 10px' }}>👤 Personal Information</div>
      <div style={grid2}>
        <Fld label="Full name" req><input style={inputSt} value={f.fullName} onChange={(e) => set('fullName', e.target.value)} /></Fld>
        <Fld label="Phone" req><input style={inputSt} value={f.phone} onChange={(e) => set('phone', e.target.value)} /></Fld>
        <Fld label="Email" req><input style={inputSt} value={f.email} onChange={(e) => set('email', e.target.value)} /></Fld>
        <Fld label="Date of birth"><input style={inputSt} type="date" value={f.dob} onChange={(e) => set('dob', e.target.value)} /></Fld>
        <Fld label="Country"><input style={inputSt} value={f.country} onChange={(e) => set('country', e.target.value)} /></Fld>
        <Fld label="Emergency contact"><input style={inputSt} value={f.emergencyContact} onChange={(e) => set('emergencyContact', e.target.value)} placeholder="Name · phone" /></Fld>
      </div>
      <div style={{ marginTop: 12 }}>
        <Fld label="Address"><input style={inputSt} value={f.address} onChange={(e) => set('address', e.target.value)} /></Fld>
      </div>

      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--gold,#ffd166)', margin: '18px 0 10px' }}>📣 How will you promote?</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {CHANNELS.map((c) => (
          <button key={c} type="button" onClick={() => toggleCh(c)}
            style={{ padding: '8px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: `1px solid ${f.channels.includes(c) ? 'var(--gold,#ffd166)' : 'rgba(255,255,255,.15)'}`, background: f.channels.includes(c) ? 'rgba(255,209,102,.15)' : 'rgba(255,255,255,.04)', color: f.channels.includes(c) ? 'var(--gold,#ffd166)' : 'rgba(255,255,255,.7)' }}>
            {c}
          </button>
        ))}
      </div>
      <div style={{ ...grid2, marginTop: 12 }}>
        <Fld label="Experience (years / networks)"><input style={inputSt} value={f.experience} onChange={(e) => set('experience', e.target.value)} placeholder="e.g. 2 years running a Telegram group" /></Fld>
        <Fld label="Expected players / month"><input style={inputSt} value={f.expectedPlayers} onChange={(e) => set('expectedPlayers', e.target.value)} placeholder="e.g. 20–50" /></Fld>
      </div>

      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--gold,#ffd166)', margin: '18px 0 10px' }}>🏦 Banking Information (for commission payouts)</div>
      <div style={grid2}>
        <Fld label="Bank name" req><input style={inputSt} value={f.bankName} onChange={(e) => set('bankName', e.target.value)} /></Fld>
        <Fld label="Account holder name" req><input style={inputSt} value={f.bankAccountName} onChange={(e) => set('bankAccountName', e.target.value)} /></Fld>
        <Fld label="Account number" req><input style={inputSt} value={f.bankAccountNo} onChange={(e) => set('bankAccountNo', e.target.value)} /></Fld>
        <Fld label="Branch (optional)"><input style={inputSt} value={f.bankBranch} onChange={(e) => set('bankBranch', e.target.value)} /></Fld>
      </div>

      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--gold,#ffd166)', margin: '18px 0 10px' }}>🤳 Selfie with ID <span style={{ color: '#e8293a' }}>*</span></div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginBottom: 8 }}>A clear photo of yourself holding your IC / passport next to your face — both your face and the ID details must be readable.</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        {selfie && (
          <span style={{ position: 'relative', display: 'inline-block' }}>
            <img src={selfie} alt="Selfie with ID" style={{ width: 110, height: 82, objectFit: 'cover', borderRadius: 10, border: '1px solid rgba(34,197,94,.5)' }} />
            <button onClick={() => setSelfie('')} style={{ position: 'absolute', top: -7, right: -7, width: 20, height: 20, borderRadius: '50%', border: 'none', background: '#e8293a', color: '#fff', fontSize: 11, cursor: 'pointer', lineHeight: 1 }}>✕</button>
          </span>
        )}
        <input ref={selfieRef} type="file" accept="image/*" capture="user" style={{ display: 'none' }} onChange={(e) => pickSelfie(e.target.files?.[0])} />
        <button type="button" className="ref-copy-btn" disabled={uploading} onClick={() => selfieRef.current?.click()}>{uploading ? 'Uploading…' : (selfie ? '🔄 Replace selfie' : '🤳 Upload selfie with ID')}</button>
        {selfie && <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 700 }}>✓ Uploaded</span>}
      </div>

      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--gold,#ffd166)', margin: '18px 0 10px' }}>📎 Supporting Documents</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginBottom: 8 }}>Bank statement / proof of account, plus anything that supports your application (audience screenshots, page insights…).</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {docs.map((d, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, padding: '6px 10px' }}>
            📄 {d.name}
            <button onClick={() => setDocs((p) => p.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#ff5c5c', cursor: 'pointer' }}>✕</button>
          </span>
        ))}
        <input ref={fileRef} type="file" accept="image/*,.pdf" multiple style={{ display: 'none' }} onChange={(e) => pick(e.target.files)} />
        <button type="button" className="ref-copy-btn" disabled={uploading} onClick={() => fileRef.current?.click()}>{uploading ? 'Uploading…' : '⬆ Upload document'}</button>
      </div>

      <div style={{ marginTop: 16 }}>
        <Fld label="Anything else we should know?"><textarea style={{ ...inputSt, minHeight: 60 }} value={f.notes} onChange={(e) => set('notes', e.target.value)} /></Fld>
      </div>

      <button className="ref-cta-btn" style={{ marginTop: 16, width: '100%' }} disabled={sending} onClick={submit}>
        {sending ? 'Submitting…' : '🚀 Submit Application'}
      </button>
    </div>
  );
}

/* ================= status tracker ================= */
function StatusTracker({ application, history, onUploaded, toast }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const st = application.status;
  const [label, color] = ST_LABEL[st] || [st, '#fff'];
  const idx = st === 'need_more_documents' ? 1 : FLOW.findIndex(([v]) => v === st);

  const pick = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const docs = [];
      for (const file of Array.from(files)) {
        const { url } = await uploadFile(file, 'agent');
        docs.push({ name: file.name, url });
      }
      await api.post('/agents/me/documents', { documents: docs });
      toast('Documents sent — back under review ✔', 'success');
      onUploaded();
    } catch (e) { toast(e.response?.data?.error || 'Upload failed', 'error'); }
    finally { setUploading(false); }
  };

  return (
    <div style={{ ...card, marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 16 }}>📋 Your Agent Application</div>
        <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 800, color, background: color + '22', border: `1px solid ${color}55`, borderRadius: 20, padding: '5px 12px' }}>{label}</span>
      </div>

      {/* progress steps */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        {FLOW.map(([v, ic, lb], i) => {
          const done = i < idx || st === 'approved';
          const cur = i === idx && st !== 'approved';
          const c = done ? '#22c55e' : cur ? color : 'rgba(255,255,255,.25)';
          return (
            <div key={v} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: 15, background: done ? 'rgba(34,197,94,.15)' : cur ? color + '22' : 'rgba(255,255,255,.05)', border: `2px solid ${c}` }}>{done ? '✓' : ic}</div>
                <div style={{ fontSize: 10, marginTop: 4, color: c, fontWeight: 700, maxWidth: 76 }}>{lb}</div>
              </div>
              {i < FLOW.length - 1 && <div style={{ flex: 1, height: 2, background: done ? '#22c55e' : 'rgba(255,255,255,.12)', margin: '0 6px 16px' }} />}
            </div>
          );
        })}
      </div>

      {/* action needed */}
      {st === 'need_more_documents' && (
        <div style={{ background: 'rgba(255,209,102,.08)', border: '1px solid rgba(255,209,102,.35)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
          <div style={{ fontWeight: 800, color: '#ffd166', marginBottom: 4 }}>📎 Action needed — upload the requested documents</div>
          {application.remarks && <div style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', marginBottom: 8 }}>{application.remarks}</div>}
          <input ref={fileRef} type="file" accept="image/*,.pdf" multiple style={{ display: 'none' }} onChange={(e) => pick(e.target.files)} />
          <button className="ref-copy-btn" disabled={uploading} onClick={() => fileRef.current?.click()}>{uploading ? 'Uploading…' : '⬆ Upload documents'}</button>
        </div>
      )}

      {/* timeline */}
      <div style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,.5)', margin: '10px 0 8px' }}>History</div>
      <div style={{ display: 'grid', gap: 8 }}>
        {history.slice().reverse().map((h, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, fontSize: 13 }}>
            <span style={{ color: 'var(--gold,#ffd166)' }}>•</span>
            <span style={{ flex: 1 }}>
              <b>{h.action}</b>
              {h.remarks ? <span style={{ color: 'rgba(255,255,255,.55)' }}> — {h.remarks}</span> : ''}
            </span>
            <span style={{ color: 'rgba(255,255,255,.4)', fontSize: 12 }}>{fmt(h.createdAt)}</span>
          </div>
        ))}
        {history.length === 0 && <div style={{ fontSize: 13, color: 'rgba(255,255,255,.4)' }}>Submitted — awaiting review.</div>}
      </div>
    </div>
  );
}

/* ================= approved agent panel ================= */
function AgentPanel({ agent, suspended, toast }) {
  const [downline, setDownline] = useState([]);
  const [comms, setComms] = useState([]);

  useEffect(() => {
    api.get('/agents/me/downline').then((r) => setDownline(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    api.get('/agents/me/commission').then((r) => setComms(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  const stats = agent.stats || {};
  const copy = () => { navigator.clipboard.writeText(agent.code); toast('Agent code copied! 📋', 'success'); };

  return (
    <>
      {suspended && (
        <div style={{ ...card, borderColor: 'rgba(255,159,67,.45)', marginBottom: 18, color: '#ff9f43', fontWeight: 700 }}>
          ⏸ Your agent account is suspended — commissions are paused. Contact support for details.
        </div>
      )}

      {/* Stats */}
      <div className="ref-stats">
        <div className="ref-stat-card"><div className="ref-stat-label">Referred Players</div><div className="ref-stat-val">{stats.players ?? downline.length}</div><div className="ref-stat-sub">{stats.activePlayers ?? 0} depositing</div></div>
        <div className="ref-stat-card"><div className="ref-stat-label">Downline GGR</div><div className="ref-stat-val">{money(stats.ggr)}</div><div className="ref-stat-sub">all time</div></div>
        <div className="ref-stat-card"><div className="ref-stat-label">Commission Earned</div><div className="ref-stat-val">{money(stats.earned)}</div><div className="ref-stat-sub">paid out</div></div>
        <div className="ref-stat-card"><div className="ref-stat-label">Pending</div><div className="ref-stat-val">{money(stats.pending)}</div><div className="ref-stat-sub">next payout</div></div>
      </div>

      {/* Agent code */}
      <div className="ref-link-card">
        <div className="ref-link-title">Your Agent Code</div>
        <div className="ref-link-sub">New players enter this code as their referral code when registering — they'll be tracked to your downline automatically.</div>
        <div className="ref-link-row">
          <input className="ref-link-input" type="text" value={agent.code} readOnly />
          <button className="ref-copy-btn" onClick={copy}>📋 Copy Code</button>
        </div>
      </div>

      {/* Downline */}
      <div className="ref-how-title">Your Players ({downline.length})</div>
      <div className="ref-earnings-card">
        <table className="ref-table">
          <thead><tr><th>Player</th><th>Joined</th><th>Deposits</th><th>Wagered</th><th>GGR</th></tr></thead>
          <tbody>
            {downline.length === 0 && <tr><td colSpan={5} style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No referred players yet — share your code!</td></tr>}
            {downline.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.username}</strong></td>
                <td style={{ color: 'var(--text-muted)' }}>{(p.registrationDate || '').slice(0, 10)}</td>
                <td>{money(p.depositTotal)} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>×{p.depositCount}</span></td>
                <td>{money(p.wagered)}</td>
                <td style={{ color: 'var(--gold)', fontWeight: 700 }}>{money(p.ggr)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Commission history */}
      <div className="ref-how-title">Commission History</div>
      <div className="ref-earnings-card" style={{ marginBottom: 18 }}>
        <table className="ref-table">
          <thead><tr><th>Period</th><th>Type</th><th>Detail</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>
            {comms.length === 0 && <tr><td colSpan={5} style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No commission records yet — they're generated monthly.</td></tr>}
            {comms.map((c) => (
              <tr key={c.id}>
                <td>{c.period}</td>
                <td style={{ textTransform: 'capitalize' }}>{c.kind}</td>
                <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{c.detail}</td>
                <td style={{ color: 'var(--gold)', fontWeight: 700 }}>{money(c.amount)} {c.currency || ''}</td>
                <td>{c.status === 'paid' ? <span style={{ color: '#22c55e', fontWeight: 700 }}>✅ Paid</span> : <span style={{ color: '#ff9f43', fontWeight: 700 }}>⏳ Pending</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
