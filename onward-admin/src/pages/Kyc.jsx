import { useState, useEffect } from 'react';
import { useUI } from '../context/UIContext';
import { Table, BOk, BPend, BBad } from '../components/ui.jsx';
import { listKYC, approveKYC, rejectKYC } from '../services/kycService';

const DEMO_KYCQ = [
  { row: 'New User 1 · #PLY-82355', n: 'New User 1', p: '#PLY-82355', d: 'Passport', t: '2d ago', st: 'pending' },
  { row: 'LGX09112VND', n: 'Nguyen Anh', p: '#PLY-91120', d: 'National ID (front/back)', t: '2h ago', st: 'pending' },
  { row: 'LGX10588PHP', n: 'Rosa Cruz', p: '#PLY-10588', d: 'Passport', t: '5h ago', st: 'pending' },
  { row: 'LGX10590PHP', n: 'Jun Mendoza', p: '#PLY-10590', d: 'Driver License', t: '1d ago', st: 'pending' },
  { row: 'LGX08200CNY', n: 'Wang Lei', p: '#PLY-08200', d: 'National ID', t: '1d ago', st: 'approved' },
];

const kycBadge = (st) => (st === 'pending' ? <BPend>Pending Review</BPend> : st === 'approved' ? <BOk>Approved</BOk> : <BBad>Rejected</BBad>);

// Map a KYC record from the API into the shape this view renders.
const normalize = (k, i) => ({
  id: k.id ?? i,
  row: k.row || k.username || k.player || k.n || `#${k.id ?? i}`,
  n: k.n || k.name || k.username || 'Player',
  p: k.p || k.player_id || k.pid || `#PLY-${k.id ?? i}`,
  d: k.d || k.document || k.doc_type || 'Document',
  t: k.t || k.submitted || k.submitted_at || '—',
  st: k.st || k.status || 'pending',
});

export default function Kyc() {
  const { toast } = useUI();
  const [queue, setQueue] = useState(DEMO_KYCQ);
  const [loading, setLoading] = useState(true);
  const [reviewIdx, setReviewIdx] = useState(-1);
  // per-section decisions in the modal: { [sectionIdx]: 1 | 0 }
  const [picks, setPicks] = useState({});

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await listKYC();
        const list = Array.isArray(data) ? data : data?.items || data?.data;
        if (active && list && list.length) setQueue(list.map(normalize));
      } catch {
        // fall back to demo rows (already set)
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const pend = queue.filter((k) => k.st === 'pending').length;

  const setStatus = (i, st) => setQueue((prev) => prev.map((k, j) => (j === i ? { ...k, st } : k)));

  const quickApprove = async (i) => {
    const k = queue[i];
    setStatus(i, 'approved');
    try { if (k.id != null) await approveKYC(k.id); } catch { /* offline demo */ }
    toast('KYC approved! ✔ ' + k.n);
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
    try {
      if (k.id != null) { if (rej) await rejectKYC(k.id); else await approveKYC(k.id); }
    } catch { /* offline demo */ }
    closeReview();
    toast(rej ? 'Decision saved — KYC rejected ✗' : 'KYC approved! ✓ ' + k.n);
  };

  const review = reviewIdx >= 0 ? queue[reviewIdx] : null;

  const rows = queue.map((k, i) => [
    k.row,
    k.d,
    k.t,
    kycBadge(k.st),
    <>
      <button className={`mini-btn ${k.st === 'pending' ? 'gold' : ''}`} onClick={() => openReview(i)}>👁 View Doc</button>
      {k.st === 'pending' && <> <button className="mini-btn green" onClick={() => quickApprove(i)}>✓ Approve</button></>}
    </>,
  ]);

  return (
    <>
      <h1 className="hero-h">KYC Verification</h1>
      <div className="hero-sub">{pend} document{pend === 1 ? '' : 's'} pending review — open <b>View Doc</b> to review before approving.</div>
      <div className="card">
        <Table cols={['Player', 'Document', 'Submitted', 'Status', 'Actions']} rows={rows} />
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
                <div className="cell"><div className="lb">Document Type</div><div className="vl">{review.d}</div></div>
                <div className="cell"><div className="lb">Submitted</div><div className="vl">{review.t}</div></div>
                <div className="cell"><div className="lb">Player ID</div><div className="vl">{review.p}</div></div>
                <div className="cell"><div className="lb">Country</div><div className="vl">🇵🇭 Philippines</div></div>
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
                      <div className="kyc-file"><span className="fi">🖼️</span><span><div className="fn">passport_scan.jpg</div><div className="fm">2.8 MB · Uploaded 2026-06-03 09:12</div></span><button className="view" onClick={() => toast('Opening passport_scan.jpg 👁')}>👁 View</button></div>
                    </>
                  )}
                  {si === 1 && (
                    <>
                      <div className="kyc-box"><span className="ok">✓ OTP Verified</span><div className="lb">Registered Mobile</div><div className="vl">+63 9XX XXX 4821</div></div>
                      <div className="kyc-note">OTP sent and confirmed at 2026-06-03 09:10</div>
                    </>
                  )}
                  {si === 2 && (
                    <>
                      <div className="kyc-box"><span className="ok">✓ Email Verified</span><div className="lb">Registered Email</div><div className="vl">use***@gmail.com</div></div>
                      <div className="kyc-note">Verification link confirmed at 2026-06-03 09:08</div>
                    </>
                  )}
                  {si === 3 && (
                    <>
                      <div className="kyc-info" style={{ marginBottom: '10px' }}>
                        <div className="cell"><div className="lb">DOB on ID</div><div className="vl">1992-04-15</div></div>
                        <div className="cell"><div className="lb">DOB on Account</div><div className="vl">1992-04-15</div></div>
                      </div>
                      <div className="kyc-note" style={{ color: 'var(--green)', fontWeight: 800 }}>✓ DOB Match</div>
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
              <button className="btn-save" onClick={save}>💾 Save Decision</button>
              <button className="btn-cancel" onClick={closeReview}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
