import { useState, useMemo } from 'react';
import { useUI } from '../context/UIContext';

const FLOATQ = [
  { name: 'Welcome Bonus Float', pos: 'bottom-right', pages: ['All Pages'], anim: 'slide', close: 'Never', clicks: 8420, active: true },
  { name: 'New Game: Aviator', pos: 'bottom-left', pages: ['Homepage', 'Lobby'], anim: 'bounce', close: '10s', clicks: 5840, active: true },
  { name: 'VIP Invite Banner', pos: 'center', pages: ['Homepage'], anim: 'fade', close: '5s', clicks: 3210, active: true },
  { name: 'May Reload Promo', pos: 'bottom-right', pages: ['Cashier'], anim: 'fade', close: 'Never', clicks: 1940, active: false },
];

const ANIM_ICON = { slide: '↑', bounce: '🏀', fade: '✨', none: '—' };
const flAnimIcon = (a) => ANIM_ICON[a] || '';
const PAGES = ['All Pages', 'Homepage', 'Game Lobby', 'Cashier', 'Promotions', 'Register'];
// edit prefill page name map: Lobby → "Game Lobby"
const PAGE_MAP = { Lobby: 'Game Lobby' };

export default function Floating() {
  const { toast } = useUI();
  const [floats, setFloats] = useState(FLOATQ);
  const [fPos, setFPos] = useState('all');
  const [fQ, setFQ] = useState('');

  // modal state
  const [open, setOpen] = useState(false);
  const [editIdx, setEditIdx] = useState(-1);
  const [mName, setMName] = useState('');
  const [mDesktop, setMDesktop] = useState('');
  const [mMobile, setMMobile] = useState('');
  const [mPos, setMPos] = useState('bottom-right');
  const [mAnim, setMAnim] = useState('slide');
  const [mOffX, setMOffX] = useState('20');
  const [mOffY, setMOffY] = useState('20');
  const [mClose, setMClose] = useState('0');
  const [mCta, setMCta] = useState('');
  const [mPages, setMPages] = useState([]);
  const [mStart, setMStart] = useState('');
  const [mEnd, setMEnd] = useState('');
  const [mActive, setMActive] = useState(true);

  const active = floats.filter((f) => f.active).length;

  const visible = useMemo(() => {
    const q = fQ.toLowerCase();
    return floats.filter((f) => (fPos === 'all' || f.pos === fPos) && (!q || f.name.toLowerCase().includes(q)));
  }, [floats, fPos, fQ]);

  const toggle = (i) => {
    setFloats((prev) => prev.map((f, idx) => (idx === i ? { ...f, active: !f.active } : f)));
    const f = floats[i];
    toast((f.active ? 'Float hidden ⚫ ' : 'Float activated ✅ ') + f.name);
  };
  const del = (i) => {
    const f = floats[i];
    setFloats((prev) => prev.filter((_, idx) => idx !== i));
    toast('Floating image deleted 🗑 ' + f.name);
  };

  const close = () => setOpen(false);

  // mutually exclusive "All Pages"
  const togglePage = (page) => {
    setMPages((prev) => {
      if (page === 'All Pages') {
        return prev.includes('All Pages') ? [] : ['All Pages'];
      }
      let next = prev.filter((p) => p !== 'All Pages');
      if (next.includes(page)) next = next.filter((p) => p !== page);
      else next = [...next, page];
      return next;
    });
  };

  const openNew = () => {
    setEditIdx(-1);
    setMName('');
    setMDesktop('');
    setMMobile('');
    setMPos('bottom-right');
    setMAnim('slide');
    setMOffX('20');
    setMOffY('20');
    setMClose('0');
    setMCta('');
    setMPages([]);
    setMStart('');
    setMEnd('');
    setMActive(true);
    setOpen(true);
  };

  const openEdit = (i) => {
    const f = floats[i];
    setEditIdx(i);
    setMName(f.name);
    setMDesktop('');
    setMMobile('');
    setMPos(f.pos);
    setMAnim(f.anim);
    setMOffX('20');
    setMOffY('20');
    setMClose(f.close === 'Never' ? '0' : String(parseInt(f.close, 10)));
    setMCta('');
    setMPages(PAGES.filter((p) => f.pages.some((fp) => (PAGE_MAP[fp] || fp) === p)));
    setMStart('');
    setMEnd('');
    setMActive(f.active);
    setOpen(true);
  };

  const save = () => {
    const name = mName.trim();
    if (!name) { toast('⚠ Image Name is required'); return; }
    const pages = [...mPages];
    if (pages.length === 0) { toast('⚠ Select at least one display page'); return; }
    const closeS = parseInt(mClose, 10);
    const closeVal = closeS ? closeS + 's' : 'Never';
    const editing = editIdx >= 0;
    const rec = {
      name,
      pos: mPos,
      pages,
      anim: mAnim,
      close: closeVal,
      clicks: editing ? floats[editIdx].clicks : 0,
      active: mActive,
    };
    if (editing) {
      setFloats((prev) => prev.map((f, idx) => (idx === editIdx ? rec : f)));
      toast('Floating image updated 💾 ' + name);
    } else {
      setFloats((prev) => [rec, ...prev]);
      toast('Floating image created ✅ ' + name + ' · ' + mPos);
    }
    setOpen(false);
  };

  return (
    <>
      <div className="cms-head"><div className="grow"><h1 className="hero-h">🖼️ Floating Image</h1><div className="hero-sub" style={{ marginBottom: 0 }}>Manage floating overlay images and banners on the casino frontend</div></div>
        <button className="cms-newbtn" onClick={openNew}>+ New Floating Image</button></div>
      <div className="grid kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="card kpi g"><div className="lbl">Active Floats</div><div className="val">{active}</div><div className="trend" style={{ color: 'var(--muted)' }}>showing now</div></div>
        <div className="card kpi b"><div className="lbl">Total Impressions</div><div className="val">284K</div><div className="trend" style={{ color: 'var(--muted)' }}>this month</div></div>
        <div className="card kpi"><div className="lbl">Total Clicks</div><div className="val">18.4K</div><div className="trend" style={{ color: 'var(--muted)' }}>this month</div></div>
        <div className="card kpi" style={{ borderTopColor: '#9b30d9' }}><div className="lbl">CTR</div><div className="val">6.5%</div><div className="trend" style={{ color: 'var(--muted)' }}>click-through rate</div></div>
      </div>
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="cms-tbar"><span className="ttl">Floating Images</span><span className="sp">
          <select value={fPos} onChange={(e) => setFPos(e.target.value)}>
            <option value="all">All Positions</option>
            <option value="bottom-right">Bottom Right</option>
            <option value="bottom-left">Bottom Left</option>
            <option value="center">Center</option>
            <option value="top-right">Top Right</option>
          </select>
          <input placeholder="Search…" value={fQ} onChange={(e) => setFQ(e.target.value)} /></span></div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table style={{ minWidth: 980 }}>
          <thead><tr><th>Name</th><th>Preview</th><th>Position</th><th>Pages</th><th>Animation</th><th>Auto-Close</th><th>Clicks</th><th>Active</th><th>Actions</th></tr></thead>
          <tbody>
            {visible.length === 0 ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px' }}>No floating images match this filter</td></tr>
            ) : visible.map((f) => {
              const i = floats.indexOf(f);
              return (
                <tr key={i}>
                  <td style={{ fontWeight: 800 }}>{f.name}</td>
                  <td><span className="cms-prev">🖼️</span></td>
                  <td><span className="cms-chip">{f.pos}</span></td>
                  <td style={{ color: '#c4cde0' }}>{f.pages.join(', ')}</td>
                  <td style={{ color: '#c4cde0' }}>{flAnimIcon(f.anim)} {f.anim}</td>
                  <td style={{ color: '#c4cde0' }}>{f.close}</td>
                  <td><span className="cms-num">{f.clicks.toLocaleString()}</span></td>
                  <td><label className="switch"><input type="checkbox" checked={f.active} onChange={() => toggle(i)} /><span className="slider"></span></label></td>
                  <td><div className="cms-act"><button className="ed" onClick={() => openEdit(i)}>✏️ Edit</button><button className="rm" onClick={() => del(i)}>🗑</button></div></td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      </div>

      {open && (
        <div className="modal-ov show" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
          <div className="pm-modal" style={{ maxWidth: '560px' }}>
            <div className="pm-head"><span style={{ fontSize: '1.1rem' }}>🖼️</span><span><div className="nm">{editIdx >= 0 ? 'Edit Floating Image' : 'New Floating Image'}</div></span>
              <button className="kyc-x" style={{ marginLeft: 'auto' }} onClick={close}>✕</button></div>
            <div className="pm-body">
              <div className="pm-fld" style={{ marginBottom: 12 }}><label>Image Name <span className="req-star">*</span></label><input placeholder="e.g. Welcome Bonus Float" value={mName} onChange={(e) => setMName(e.target.value)} /></div>
              <div className="pm-grid">
                <div className="pm-fld"><label>Desktop Image URL</label><input placeholder="https://cdn.onward.com/float/banner" value={mDesktop} onChange={(e) => setMDesktop(e.target.value)} /></div>
                <div className="pm-fld"><label>Mobile Image URL</label><input placeholder="https://cdn.onward.com/float/banner" value={mMobile} onChange={(e) => setMMobile(e.target.value)} /></div>
              </div>
              <div className="pm-grid" style={{ marginTop: 12 }}>
                <div className="pm-fld"><label>Position</label><select value={mPos} onChange={(e) => setMPos(e.target.value)}>
                  <option value="bottom-right">↘ Bottom Right</option>
                  <option value="bottom-left">↙ Bottom Left</option>
                  <option value="center">⌖ Center</option>
                  <option value="top-right">↗ Top Right</option>
                  <option value="top-left">↖ Top Left</option>
                </select></div>
                <div className="pm-fld"><label>Animation</label><select value={mAnim} onChange={(e) => setMAnim(e.target.value)}>
                  <option value="slide">Slide Up</option>
                  <option value="bounce">Bounce</option>
                  <option value="fade">Fade</option>
                  <option value="none">None</option>
                </select></div>
              </div>
              <div className="pm-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginTop: 12 }}>
                <div className="pm-fld"><label>Offset X (px)</label><input value={mOffX} inputMode="numeric" onChange={(e) => setMOffX(e.target.value)} /></div>
                <div className="pm-fld"><label>Offset Y (px)</label><input value={mOffY} inputMode="numeric" onChange={(e) => setMOffY(e.target.value)} /></div>
                <div className="pm-fld"><label>Auto-Close (sec) <span style={{ color: 'var(--muted)', fontWeight: 700 }}>0 = never</span></label><input value={mClose} inputMode="numeric" onChange={(e) => setMClose(e.target.value)} /></div>
              </div>
              <div className="pm-fld" style={{ marginTop: 12 }}><label>CTA Link URL</label><input placeholder="https://onward.com/promotions" value={mCta} onChange={(e) => setMCta(e.target.value)} /></div>
              <div className="pm-fld" style={{ margin: '12px 0 4px' }}><label>Display Pages</label></div>
              <div className="pm-pages">
                {PAGES.map((page) => {
                  const on = mPages.includes(page);
                  return (
                    <label key={page} className={`pm-page ${on ? 'on' : ''}`}><input type="checkbox" checked={on} onChange={() => togglePage(page)} /> {page}</label>
                  );
                })}
              </div>
              <div className="pm-grid" style={{ marginTop: 12 }}>
                <div className="pm-fld"><label>Start Date</label><input type="datetime-local" value={mStart} onChange={(e) => setMStart(e.target.value)} /></div>
                <div className="pm-fld"><label>End Date</label><input type="datetime-local" value={mEnd} onChange={(e) => setMEnd(e.target.value)} /></div>
              </div>
              <div className="pm-check"><input type="checkbox" checked={mActive} onChange={(e) => setMActive(e.target.checked)} /><div><div className="t">Active</div><div className="d">Show this floating image on the frontend</div></div></div>
            </div>
            <div className="pm-foot"><button className="btn-cancel" onClick={close}>Cancel</button>
              <button className="btn-pm-save" onClick={save}>{editIdx >= 0 ? 'Save Changes' : 'Create Floating Image'}</button></div>
          </div>
        </div>
      )}
    </>
  );
}
