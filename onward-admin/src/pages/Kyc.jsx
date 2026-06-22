import { useState, useEffect } from 'react';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import { Table, BOk, BPend, BBad } from '../components/ui.jsx';
import { listKYC, approveKYC, rejectKYC, getKycConfig, saveKycConfig } from '../services/kycService';

const DEMO_KYCQ = [
  { row: 'New User 1 · #PLY-82355', n: 'New User 1', p: '#PLY-82355', d: 'Passport', t: '2d ago', st: 'pending' },
  { row: 'LGX09112VND', n: 'Nguyen Anh', p: '#PLY-91120', d: 'National ID (front/back)', t: '2h ago', st: 'pending' },
  { row: 'LGX10588PHP', n: 'Rosa Cruz', p: '#PLY-10588', d: 'Passport', t: '5h ago', st: 'pending' },
  { row: 'LGX10590PHP', n: 'Jun Mendoza', p: '#PLY-10590', d: 'Driver License', t: '1d ago', st: 'pending' },
  { row: 'LGX08200CNY', n: 'Wang Lei', p: '#PLY-08200', d: 'National ID', t: '1d ago', st: 'approved' },
];

const kycBadge = (st) => (st === 'pending' ? <BPend>Pending Review</BPend> : st === 'approved' ? <BOk>Approved</BOk> : <BBad>Rejected</BBad>);

const DOC_LABEL = { id: 'National ID', passport: 'Passport', license: "Driver's License" };
const docLabel = (d) => DOC_LABEL[d] || d || 'Document';
const fmtTime = (t) => { if (!t) return '—'; const d = new Date(t); return Number.isNaN(d.getTime()) ? String(t) : d.toLocaleString(); };

// Map a KYC record from the API into the shape this view renders (username-first,
// with the player's real registration data for the review sections).
const normalize = (k, i) => {
  const pl = k.player || {};
  return {
    id: k.id ?? i,
    row: pl.username || k.username || k.row || `#${k.id ?? i}`,
    n: pl.fullName || pl.username || k.username || 'Player',
    p: pl.username || k.username || '—',
    d: docLabel(k.docType || k.doc_type || k.d),
    t: k.createdAt ? fmtTime(k.createdAt) : (k.t || k.submitted || '—'),
    st: k.status || k.st || 'pending',
    frontUrl: k.frontUrl || '',
    backUrl: k.backUrl || '',
    selfieUrl: k.selfieUrl || '',
    // real player info
    email: pl.email || '—',
    phone: pl.phone || '—',
    dob: pl.dob || '—',
    country: pl.country || '',
    playerCode: pl.playerCode || '',
    emailVerified: !!pl.emailVerified,
    mobileVerified: !!pl.mobileVerified,
    registrationDate: pl.registrationDate ? fmtTime(pl.registrationDate) : '—',
  };
};

function KycImg({ label, url }) {
  return (
    <a href={url} target="_blank" rel="noreferrer" style={{ display: 'block', width: 150 }}>
      <img src={url} alt={label} style={{ width: 150, height: 95, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)', display: 'block' }} />
      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, textAlign: 'center' }}>{label} · View full</div>
    </a>
  );
}

export default function Kyc() {
  const { toast } = useUI();
  const { can } = useAuth();
  const mayApprove = can('kyc.approve');
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewIdx, setReviewIdx] = useState(-1);
  // per-section decisions in the modal: { [sectionIdx]: 1 | 0 }
  const [picks, setPicks] = useState({});
  // KYC approval bonus (credited to the player when KYC is approved, if > 0)
  const [kycBonus, setKycBonus] = useState(0);
  const [bonusInput, setBonusInput] = useState('');

  useEffect(() => {
    getKycConfig().then((c) => { setKycBonus(Number(c.kycBonus || 0)); setBonusInput(String(c.kycBonus || 0)); }).catch(() => {});
  }, []);
  const saveBonus = async () => {
    try {
      const c = await saveKycConfig(Math.max(0, Number(bonusInput) || 0));
      setKycBonus(Number(c.kycBonus || 0));
      toast('KYC approval bonus set to ₱' + Number(c.kycBonus || 0).toLocaleString());
    } catch (e) { toast('Could not save bonus: ' + (e.message || 'error')); }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await listKYC();
        const list = Array.isArray(data) ? data : data?.items || data?.data || [];
        if (active) setQueue(list.map(normalize)); // real data only (may be empty)
      } catch {
        if (active) setQueue(DEMO_KYCQ); // offline-only fallback
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const pend = queue.filter((k) => k.st === 'pending').length;

  const setStatus = (i, st) => setQueue((prev) => prev.map((k, j) => (j === i ? { ...k, st } : k)));

  const approvedToast = (name, r) =>
    toast('KYC approved! ✔ ' + name + (r && r.bonusCredited ? ' · ₱' + Number(r.bonusCredited).toLocaleString() + ' bonus credited' : ''));

  const quickApprove = async (i) => {
    const k = queue[i];
    setStatus(i, 'approved');
    try {
      if (k.id != null) { const r = await approveKYC(k.id); approvedToast(k.n, r); return; }
    } catch { /* offline demo */ }
    approvedToast(k.n);
  };

  const openReview = (i) => { setReviewIdx(i); setPicks({}); };
  const closeReview = () => setReviewIdx(-1);

  const SECTIONS = [
    { ic: '🪪', tt: 'Identity Document', dd: "Government ID, Driver's License, or Passport — any one required" },
    { ic: '📲', tt: 'Mobile Number Verification', dd: 'OTP sent to registered mobile number' },
    { ic: '📧', tt: 'Email Verification', dd: 'Confirmation link sent to registered email' },
    { ic: '🎂', tt: 'Date of Birth Match', dd: 'DOB on ID must match account registration date' },
  ];

  const pick = (si, ok) => setPicks((p) => ({ ...p, [si]: ok }));
  const pickAll = (ok) => {
    const all = {};
    SECTIONS.forEach((_, si) => { all[si] = ok; });
    setPicks(all);
    toast(ok ? 'All sections approved ✓' : 'All sections rejected ✗');
  };

  const save = async () => {
    const decided = Object.keys(picks).length;
    if (decided < SECTIONS.length) { toast('⚠ Review all sections before saving'); return; }
    const rej = Object.values(picks).some((v) => !v);
    const k = queue[reviewIdx];
    setStatus(reviewIdx, rej ? 'rejected' : 'approved');
    let r = null;
    try {
      if (k.id != null) { if (rej) await rejectKYC(k.id); else r = await approveKYC(k.id); }
    } catch { /* offline demo */ }
    closeReview();
    if (rej) toast('Decision saved — KYC rejected ✗'); else approvedToast(k.n, r);
  };

  const review = reviewIdx >= 0 ? queue[reviewIdx] : null;

  const rows = queue.map((k, i) => [
    k.row,
    k.d,
    k.t,
    kycBadge(k.st),
    <>
      <button className={`mini-btn ${k.st === 'pending' ? 'gold' : ''}`} onClick={() => openReview(i)}>👁 View Doc</button>
      {mayApprove && k.st === 'pending' && <> <button className="mini-btn green" onClick={() => quickApprove(i)}>✓ Approve</button></>}
    </>,
  ]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="hero-h">KYC Verification</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>
            {pend} document{pend === 1 ? '' : 's'} pending review — open <b>View Doc</b> to review before approving.
            {kycBonus > 0
              ? <> · <b style={{ color: 'var(--gold)' }}>₱{kycBonus.toLocaleString()} bonus</b> is credited on approval.</>
              : <> · No approval bonus set.</>}
          </div>
        </div>
        <span className="pr" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, color: 'var(--muted)' }}>KYC Approval Bonus (₱)</label>
          <input type="number" min="0" value={bonusInput} onChange={(e) => setBonusInput(e.target.value)} placeholder="0" style={{ width: 110 }} />
          <button className="btn-search" onClick={saveBonus}>Save</button>
        </span>
      </div>
      <div className="card">
        <Table cols={['Player (username)', 'Document', 'Submitted', 'Status', 'Actions']} rows={rows} />
      </div>

      {review && (
        <div className="modal-ov show" id="kycModal" onClick={(e) => { if (e.target === e.currentTarget) closeReview(); }}>
          <div className="kyc-modal">
            <div className="kyc-head">
              <span style={{ fontSize: '1.2rem' }}>🪪</span>
              <span><div className="t">KYC Documents</div><div className="s" id="kycTitleSub">{review.n} · Submitted {review.t}</div></span>
              <button className="kyc-x" onClick={closeReview} aria-label="Close">✕</button>
            </div>
            <div className="kyc-body" id="kycBody">
              <div className="kyc-info">
                <div className="cell"><div className="lb">Username</div><div className="vl">{review.p}</div></div>
                <div className="cell"><div className="lb">Player ID</div><div className="vl">{review.playerCode || '—'}</div></div>
                <div className="cell"><div className="lb">Document Type</div><div className="vl">{review.d}</div></div>
                <div className="cell"><div className="lb">Submitted</div><div className="vl">{review.t}</div></div>
                <div className="cell"><div className="lb">Country</div><div className="vl">{review.country || '—'}</div></div>
                <div className="cell"><div className="lb">Registered</div><div className="vl">{review.registrationDate}</div></div>
              </div>
              <div className="kyc-status"><span className="os">Overall Status:</span><span className="pend">⏳ Pending Review</span></div>
              <div className="kyc-status"><button className="btn-appall" onClick={() => pickAll(1)}>✓ Approve All</button><button className="btn-rejall" onClick={() => pickAll(0)}>✗ Reject All</button></div>

              {SECTIONS.map((s, si) => (
                <div className="kyc-sec" key={si}>
                  <div className="sh"><span className="ic">{s.ic}</span><span><div className="tt">{s.tt}</div><div className="dd">{s.dd}</div></span><span className="sub-tag">✓ Submitted</span></div>
                  {si === 0 && (
                    <>
                      <div className="kyc-box" style={{ padding: 0, border: 'none', background: 'transparent' }}><div className="lb" style={{ marginBottom: '6px' }}>Document Type</div>
                        <select className="kyc-sel" defaultValue={review.d}><option>{review.d}</option><option>National ID</option><option>Driver License</option><option>Passport</option></select></div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                        {review.frontUrl && <KycImg label="Front" url={review.frontUrl} />}
                        {review.backUrl && <KycImg label="Back" url={review.backUrl} />}
                        {review.selfieUrl && <KycImg label="Selfie" url={review.selfieUrl} />}
                        {!review.frontUrl && !review.backUrl && !review.selfieUrl && (
                          <div className="kyc-note">No document images were uploaded for this submission.</div>
                        )}
                      </div>
                    </>
                  )}
                  {si === 1 && (
                    <>
                      <div className="kyc-box"><span className={review.mobileVerified ? 'ok' : 'pend'}>{review.mobileVerified ? '✓ OTP Verified' : '⏳ Not verified'}</span><div className="lb">Registered Mobile</div><div className="vl">{review.phone}</div></div>
                      <div className="kyc-note">{review.mobileVerified ? 'Mobile number confirmed by the player.' : 'Player has not verified their mobile yet.'}</div>
                    </>
                  )}
                  {si === 2 && (
                    <>
                      <div className="kyc-box"><span className={review.emailVerified ? 'ok' : 'pend'}>{review.emailVerified ? '✓ Email Verified' : '⏳ Not verified'}</span><div className="lb">Registered Email</div><div className="vl">{review.email}</div></div>
                      <div className="kyc-note">{review.emailVerified ? 'Email confirmed by the player.' : 'Player has not verified their email yet.'}</div>
                    </>
                  )}
                  {si === 3 && (
                    <>
                      <div className="kyc-info" style={{ marginBottom: '10px' }}>
                        <div className="cell"><div className="lb">DOB on Account</div><div className="vl">{review.dob}</div></div>
                        <div className="cell"><div className="lb">Document Type</div><div className="vl">{review.d}</div></div>
                      </div>
                      <div className="kyc-note">Confirm the date of birth on the uploaded document matches the account DOB above.</div>
                    </>
                  )}
                  <div className="kyc-acts">
                    <button className={`btn-app ${picks[si] === 1 ? 'sel' : ''}`} onClick={() => pick(si, 1)}>✓ Approve</button>
                    <button className={`btn-rej ${picks[si] === 0 ? 'sel' : ''}`} onClick={() => pick(si, 0)}>✗ Reject</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="kyc-foot">
              {mayApprove ? <button className="btn-save" onClick={save}>💾 Save Decision</button> : <span style={{ fontSize: 12, color: 'var(--muted)' }}>🔒 No KYC approval permission</span>}
              <button className="btn-cancel" onClick={closeReview}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
