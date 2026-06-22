import { useState, useMemo } from 'react';
import { useUI } from '../context/UIContext';

const ANNQ = [
  { title: 'Welcome to Onward!', desc: 'Get your 200% Welcome Bonus today. T&C apply.', type: 'welcome', target: 'new', freq: 'Once Only', sched: '2025-01-01 00:00', prio: 1, active: true },
  { title: 'May Mega Promotion', desc: 'Deposit this May and get up to ₱10,000 bonus!', type: 'promo', target: 'all', freq: 'Per Session', sched: '2025-05-01 00:00 → 2025-05-31 23:59', prio: 2, active: true },
  { title: 'System Maintenance – 2am–4am', desc: 'Scheduled maintenance on May 31, 2am–4am. Deposits & wi…', type: 'maintenance', target: 'all', freq: 'Every Visit', sched: '2025-05-30 22:00 → 2025-05-31 04:00', prio: 1, active: true },
  { title: 'New Game Alert: Gates of Olympus', desc: 'Gates of Olympus is now live! Spin for epic multipliers…', type: 'alert', target: 'all', freq: 'Per Session', sched: '2025-05-20 00:00', prio: 3, active: true },
  { title: 'VIP Cashback Weekend', desc: 'VIP players enjoy 20% cashback this weekend!', type: 'promo', target: 'vip', freq: 'Once Only', sched: '2025-05-24 00:00 → 2025-05-26 23:59', prio: 2, active: false },
  { title: 'Refer a Friend – Earn ₱500', desc: 'Invite a friend, they deposit, you earn ₱500 instantly.', type: 'promo', target: 'existing', freq: 'Once Only', sched: '2025-06-01 00:00 → 2025-06-30 23:59', prio: 4, active: false },
];

const TYPE_ICON = { welcome: '🎉', promo: '🎁', maintenance: '🔧', alert: '⚠️' };
const TARGET_MAP = { 'All Players': 'all', 'New Players': 'new', 'Existing Players': 'existing', 'VIP Players': 'vip' };
const TARGET_REV = { all: 'All Players', new: 'New Players', existing: 'Existing Players', vip: 'VIP Players' };

function AnnTypeChip({ t }) {
  return <span className={`cms-type ty-${t}`}>{(TYPE_ICON[t] || '') + ' ' + t}</span>;
}

export default function Popout() {
  const { toast } = useUI();
  const [anns, setAnns] = useState(ANNQ);
  const [fType, setFType] = useState('all');
  const [fQ, setFQ] = useState('');

  // modal state
  const [open, setOpen] = useState(false);
  const [editIdx, setEditIdx] = useState(-1);
  const [mTitle, setMTitle] = useState('');
  const [mType, setMType] = useState('welcome');
  const [mTarget, setMTarget] = useState('All Players');
  const [mFreq, setMFreq] = useState('Every Visit');
  const [mPrio, setMPrio] = useState('');
  const [mStart, setMStart] = useState('');
  const [mEnd, setMEnd] = useState('');
  const [mBody, setMBody] = useState('');
  const [mDesktop, setMDesktop] = useState('');
  const [mMobile, setMMobile] = useState('');
  const [mCtaText, setMCtaText] = useState('');
  const [mCtaUrl, setMCtaUrl] = useState('');
  const [mActive, setMActive] = useState(true);

  const total = anns.length;
  const active = anns.filter((a) => a.active).length;
  const sched = anns.filter((a) => a.sched.includes('→')).length;

  const visible = useMemo(() => {
    const q = fQ.toLowerCase();
    return anns.filter((a) => (fType === 'all' || a.type === fType) && (!q || (a.title + ' ' + a.desc).toLowerCase().includes(q)));
  }, [anns, fType, fQ]);

  const toggle = (i) => {
    setAnns((prev) => prev.map((a, idx) => (idx === i ? { ...a, active: !a.active } : a)));
    const a = anns[i];
    toast((a.active ? 'Announcement hidden ⚫ ' : 'Announcement activated ✅ ') + a.title);
  };
  const del = (i) => {
    const a = anns[i];
    setAnns((prev) => prev.filter((_, idx) => idx !== i));
    toast('Announcement deleted 🗑 ' + a.title);
  };

  const close = () => setOpen(false);

  const openNew = () => {
    setEditIdx(-1);
    setMTitle('');
    setMType('welcome');
    setMTarget('All Players');
    setMFreq('Every Visit');
    setMPrio('');
    setMStart('');
    setMEnd('');
    setMBody('');
    setMDesktop('');
    setMMobile('');
    setMCtaText('');
    setMCtaUrl('');
    setMActive(true);
    setOpen(true);
  };

  const openEdit = (i) => {
    const a = anns[i];
    setEditIdx(i);
    setMTitle(a.title);
    setMType(a.type);
    setMTarget(TARGET_REV[a.target] || 'All Players');
    setMFreq(a.freq);
    setMPrio(String(a.prio));
    setMStart('');
    setMEnd('');
    setMBody(a.desc);
    setMDesktop('');
    setMMobile('');
    setMCtaText('');
    setMCtaUrl('');
    setMActive(a.active);
    setOpen(true);
  };

  const save = () => {
    const title = mTitle.trim();
    if (!title) { toast('⚠ Title is required'); return; }
    const target = TARGET_MAP[mTarget] || 'all';
    const editing = editIdx >= 0;
    const sch = mStart
      ? mStart.replace('T', ' ') + (mEnd ? ' → ' + mEnd.replace('T', ' ') : '')
      : (editing ? anns[editIdx].sched : 'Immediate');
    const rec = {
      title,
      desc: mBody,
      type: mType,
      target,
      freq: mFreq,
      sched: sch,
      prio: parseInt(mPrio, 10) || 1,
      active: mActive,
    };
    if (editing) {
      setAnns((prev) => prev.map((a, idx) => (idx === editIdx ? rec : a)));
      toast('Announcement updated 💾 ' + title);
    } else {
      setAnns((prev) => [rec, ...prev]);
      toast('Announcement created ✅ ' + title + (mActive ? ' · live now' : ' · inactive'));
    }
    setOpen(false);
  };

  return (
    <>
      <div className="cms-head"><div className="grow"><h1 className="hero-h">📢 Popout Announcement</h1><div className="hero-sub" style={{ marginBottom: 0 }}>Manage pop-up announcements shown to players on the casino website</div></div>
        <button className="cms-newbtn" onClick={openNew}>+ New Announcement</button></div>
      <div className="grid kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="card kpi b"><div className="lbl">Total</div><div className="val">{total}</div><div className="trend" style={{ color: 'var(--muted)' }}>announcements</div></div>
        <div className="card kpi g"><div className="lbl">Active Now</div><div className="val">{active}</div><div className="trend" style={{ color: 'var(--muted)' }}>showing to players</div></div>
        <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">Scheduled</div><div className="val">{sched}</div><div className="trend" style={{ color: 'var(--muted)' }}>upcoming</div></div>
        <div className="card kpi" style={{ borderTopColor: '#9b30d9' }}><div className="lbl">Avg Dismissal</div><div className="val">68%</div><div className="trend" style={{ color: 'var(--muted)' }}>players close it</div></div>
      </div>
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="cms-tbar"><span className="ttl">Announcements</span><span className="sp">
          <select value={fType} onChange={(e) => setFType(e.target.value)}>
            <option value="all">All Types</option>
            <option value="welcome">Welcome</option>
            <option value="promo">Promo</option>
            <option value="maintenance">Maintenance</option>
            <option value="alert">Alert</option>
          </select>
          <input placeholder="Search…" value={fQ} onChange={(e) => setFQ(e.target.value)} /></span></div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table style={{ minWidth: 1050 }}>
          <thead><tr><th>Title</th><th>Type</th><th>Target</th><th>Frequency</th><th>Schedule</th><th>Priority</th><th>Active</th><th>Actions</th></tr></thead>
          <tbody>
            {visible.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px' }}>No announcements match this filter</td></tr>
            ) : visible.map((a) => {
              const i = anns.indexOf(a);
              return (
                <tr key={i}>
                  <td><div className="cms-title-cell"><div className="t">{a.title}</div><div className="d">{a.desc}</div></div></td>
                  <td><AnnTypeChip t={a.type} /></td>
                  <td style={{ color: '#c4cde0' }}>{a.target}</td>
                  <td style={{ color: '#c4cde0' }}>{a.freq}</td>
                  <td style={{ color: 'var(--muted)', fontSize: '.72rem', whiteSpace: 'nowrap' }}>{a.sched}</td>
                  <td><span className="cms-prio">{a.prio}</span></td>
                  <td><label className="switch"><input type="checkbox" checked={a.active} onChange={() => toggle(i)} /><span className="slider"></span></label></td>
                  <td><div className="cms-act"><button className="ed" onClick={() => openEdit(i)}>✏️ Edit</button><button className="rm" onClick={() => del(i)}>🗑</button></div></td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      </div>

      {open && (
        <div className="modal-ov show" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
          <div className="pm-modal" style={{ maxWidth: '580px' }}>
            <div className="pm-head"><span style={{ fontSize: '1.1rem' }}>📢</span><span><div className="nm">{editIdx >= 0 ? 'Edit Announcement' : 'New Announcement'}</div></span>
              <button className="kyc-x" style={{ marginLeft: 'auto' }} onClick={close}>✕</button></div>
            <div className="pm-body">
              <div className="pm-fld" style={{ marginBottom: 12 }}><label>Title <span className="req-star">*</span></label><input placeholder="e.g. Welcome to Onward Casino!" value={mTitle} onChange={(e) => setMTitle(e.target.value)} /></div>
              <div className="pm-grid">
                <div className="pm-fld"><label>Type</label><select value={mType} onChange={(e) => setMType(e.target.value)}>
                  <option value="welcome">🎉 Welcome</option>
                  <option value="promo">🎁 Promo</option>
                  <option value="maintenance">🔧 Maintenance</option>
                  <option value="alert">⚠️ Alert</option>
                </select></div>
                <div className="pm-fld"><label>Target Audience</label><select value={mTarget} onChange={(e) => setMTarget(e.target.value)}>
                  <option>All Players</option>
                  <option>New Players</option>
                  <option>Existing Players</option>
                  <option>VIP Players</option>
                </select></div>
              </div>
              <div className="pm-grid" style={{ marginTop: 12 }}>
                <div className="pm-fld"><label>Display Frequency</label><select value={mFreq} onChange={(e) => setMFreq(e.target.value)}>
                  <option>Every Visit</option>
                  <option>Once Only</option>
                  <option>Per Session</option>
                </select></div>
                <div className="pm-fld"><label>Priority (1 = highest)</label><input inputMode="numeric" value={mPrio} onChange={(e) => setMPrio(e.target.value)} /></div>
              </div>
              <div className="pm-grid" style={{ marginTop: 12 }}>
                <div className="pm-fld"><label>Start Date &amp; Time</label><input type="datetime-local" value={mStart} onChange={(e) => setMStart(e.target.value)} /></div>
                <div className="pm-fld"><label>End Date &amp; Time</label><input type="datetime-local" value={mEnd} onChange={(e) => setMEnd(e.target.value)} /></div>
              </div>
              <div className="pm-fld" style={{ marginTop: 12 }}><label>Message Body</label><textarea className="pwa-ta" placeholder="Enter the announcement message shown to players…" value={mBody} onChange={(e) => setMBody(e.target.value)}></textarea></div>
              <div className="pm-grid" style={{ marginTop: 12 }}>
                <div className="pm-fld"><label>Desktop Image URL</label><input placeholder="https://cdn.onward.com/ann/desktop" value={mDesktop} onChange={(e) => setMDesktop(e.target.value)} /></div>
                <div className="pm-fld"><label>Mobile Image URL</label><input placeholder="https://cdn.onward.com/ann/mobile" value={mMobile} onChange={(e) => setMMobile(e.target.value)} /></div>
              </div>
              <div className="pm-grid" style={{ marginTop: 12 }}>
                <div className="pm-fld"><label>CTA Button Text</label><input placeholder="Claim Now" value={mCtaText} onChange={(e) => setMCtaText(e.target.value)} /></div>
                <div className="pm-fld"><label>CTA Button URL</label><input placeholder="https://onward.com/promotions" value={mCtaUrl} onChange={(e) => setMCtaUrl(e.target.value)} /></div>
              </div>
              <div className="pm-check"><input type="checkbox" checked={mActive} onChange={(e) => setMActive(e.target.checked)} /><div><div className="t">Active</div><div className="d">Show this announcement to players immediately</div></div></div>
            </div>
            <div className="pm-foot"><button className="btn-cancel" onClick={close}>Cancel</button>
              <button className="btn-pm-save" onClick={save}>{editIdx >= 0 ? 'Save Changes' : 'Create Announcement'}</button></div>
          </div>
        </div>
      )}
    </>
  );
}
