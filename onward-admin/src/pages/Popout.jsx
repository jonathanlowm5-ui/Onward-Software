import { useEffect, useRef, useState } from 'react';
import { useUI } from '../context/UIContext';
import { getAnnouncement, saveAnnouncement } from '../services/announcementService';
import { uploadImage } from '../services/uploadService';

/*
 * Popout Announcement admin — manages what players see on the casino site:
 *   • Ticker messages  — the scrolling marquee at the top (multiple supported).
 *   • Pop-out modals   — an image + message shown over the site, clickable
 *                        through to a link, with a close button.
 * Both are persisted through PUT /api/announcement (which merges keys).
 */

let idSeq = 0;
const newId = () => 'a' + Date.now().toString(36) + (idSeq++).toString(36);

const LEVELS = [
  { v: 'info', label: 'ℹ️ Info (blue)' },
  { v: 'warning', label: '⚠️ Warning (amber)' },
  { v: 'critical', label: '🚨 Critical (red)' },
];

const EMPTY_POP = { id: '', enabled: true, title: '', message: '', image: '', mobileImage: '', link: '', ctaText: '' };

export default function Popout() {
  const { toast } = useUI();
  const [tickers, setTickers] = useState([]);
  const [popouts, setPopouts] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // pop-out editor modal
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_POP);
  const [editId, setEditId] = useState(null);
  const [uploading, setUploading] = useState('');
  const deskRef = useRef(null);
  const mobRef = useRef(null);

  useEffect(() => {
    getAnnouncement()
      .then((a) => {
        setTickers(Array.isArray(a?.tickers) ? a.tickers : []);
        setPopouts(Array.isArray(a?.popouts) ? a.popouts : []);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const persistTickers = async (next) => {
    setTickers(next);
    try { await saveAnnouncement({ tickers: next }); toast('Ticker messages saved ✔'); }
    catch (e) { toast('⚠ ' + (e.message || 'Save failed')); }
  };
  const persistPopouts = async (next, msg) => {
    setPopouts(next);
    try { await saveAnnouncement({ popouts: next }); toast(msg || 'Pop-out saved ✔'); }
    catch (e) { toast('⚠ ' + (e.message || 'Save failed')); }
  };

  /* ---------- tickers ---------- */
  const addTicker = () => setTickers((p) => [...p, { id: newId(), text: '', level: 'info', enabled: true }]);
  const setTicker = (id, patch) => setTickers((p) => p.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const delTicker = (id) => persistTickers(tickers.filter((t) => t.id !== id));
  const saveTickers = () => {
    const clean = tickers.filter((t) => String(t.text).trim());
    persistTickers(clean);
  };

  /* ---------- pop-outs ---------- */
  const openNew = () => { setForm({ ...EMPTY_POP, id: newId() }); setEditId(null); setOpen(true); };
  const openEdit = (p) => { setForm({ ...EMPTY_POP, ...p }); setEditId(p.id); setOpen(true); };
  const close = () => setOpen(false);
  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const pickImage = async (file, key) => {
    if (!file) return;
    setUploading(key);
    try { const { url } = await uploadImage(file); setF(key, url); }
    catch (e) { toast('⚠ Upload failed: ' + (e.message || '')); }
    finally { setUploading(''); }
  };

  const savePop = () => {
    if (!form.title.trim() && !form.message.trim() && !form.image.trim()) {
      toast('⚠ Add an image, title or message'); return;
    }
    const exists = popouts.some((p) => p.id === form.id);
    const next = exists ? popouts.map((p) => (p.id === form.id ? form : p)) : [form, ...popouts];
    persistPopouts(next, editId ? 'Pop-out updated 💾' : 'Pop-out created ✅');
    setOpen(false);
  };
  const togglePop = (id) => persistPopouts(popouts.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)));
  const delPop = (id) => persistPopouts(popouts.filter((p) => p.id !== id), 'Pop-out deleted 🗑');

  const activeTickers = tickers.filter((t) => t.enabled && String(t.text).trim()).length;
  const activePops = popouts.filter((p) => p.enabled).length;

  return (
    <>
      <div className="cms-head">
        <div className="grow">
          <h1 className="hero-h">📢 Popout Announcement</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>Manage the scrolling ticker and pop-up announcements shown on the casino website</div>
        </div>
        <button className="cms-newbtn" onClick={openNew}>+ New Pop-out</button>
      </div>

      <div className="grid kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="card kpi b"><div className="lbl">Ticker Messages</div><div className="val">{tickers.length}</div><div className="trend" style={{ color: 'var(--muted)' }}>{activeTickers} live</div></div>
        <div className="card kpi g"><div className="lbl">Pop-outs</div><div className="val">{popouts.length}</div><div className="trend" style={{ color: 'var(--muted)' }}>{activePops} live</div></div>
        <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">Ticker Status</div><div className="val" style={{ fontSize: '1.1rem' }}>{activeTickers ? '● Showing' : '○ Off'}</div><div className="trend" style={{ color: 'var(--muted)' }}>top of every page</div></div>
        <div className="card kpi" style={{ borderTopColor: '#9b30d9' }}><div className="lbl">Pop-out Status</div><div className="val" style={{ fontSize: '1.1rem' }}>{activePops ? '● Showing' : '○ Off'}</div><div className="trend" style={{ color: 'var(--muted)' }}>modal over site</div></div>
      </div>

      {/* ===== TICKER MESSAGES ===== */}
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="page-head" style={{ marginBottom: 12 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>📰 Ticker Messages</div>
          <span className="pr" style={{ display: 'flex', gap: 8 }}>
            <button className="ed" onClick={addTicker}>+ Add message</button>
            <button className="btn-search" onClick={saveTickers}>💾 Save ticker</button>
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>Each message scrolls across the top of every player page. Add several — they rotate together. The bar colour follows the most severe active message.</div>
        {tickers.length === 0 ? (
          <div style={{ color: 'var(--muted)', padding: '10px 0' }}>No ticker messages yet. Click “+ Add message”.</div>
        ) : tickers.map((t) => (
          <div key={t.id} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
            <input
              value={t.text}
              onChange={(e) => setTicker(t.id, { text: e.target.value })}
              placeholder="e.g. Scheduled maintenance tonight 2–4 AM."
              style={{ flex: 1, minWidth: 240, padding: '9px 12px', borderRadius: 9, background: 'var(--panel-3,#1b2541)', color: 'var(--text,#fff)', border: '1px solid var(--border,#243049)' }}
            />
            <select value={t.level} onChange={(e) => setTicker(t.id, { level: e.target.value })}
              style={{ padding: '9px 12px', borderRadius: 9, background: 'var(--panel-3,#1b2541)', color: 'var(--text,#fff)', border: '1px solid var(--border,#243049)' }}>
              {LEVELS.map((l) => <option key={l.v} value={l.v}>{l.label}</option>)}
            </select>
            <label className="switch"><input type="checkbox" checked={!!t.enabled} onChange={(e) => setTicker(t.id, { enabled: e.target.checked })} /><span className="slider"></span></label>
            <button className="rm" onClick={() => delTicker(t.id)}>🗑</button>
          </div>
        ))}
      </div>

      {/* ===== POP-OUTS ===== */}
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="page-head" style={{ marginBottom: 12 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>🖼 Pop-out Announcements</div>
          <button className="ed" onClick={openNew}>+ New Pop-out</button>
        </div>
        {popouts.length === 0 ? (
          <div style={{ color: 'var(--muted)', padding: '10px 0' }}>{loaded ? 'No pop-outs yet. Create one with an image, message and link.' : 'Loading…'}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
            {popouts.map((p) => (
              <div key={p.id} style={{ background: 'var(--panel-3,#1b2541)', border: '1px solid var(--border,#243049)', borderRadius: 12, overflow: 'hidden' }}>
                {p.image
                  ? <img src={p.image} alt="" style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
                  : <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 32 }}>🖼</div>}
                <div style={{ padding: 12 }}>
                  <div style={{ fontWeight: 700, color: 'var(--text,#fff)', marginBottom: 4 }}>{p.title || '(no title)'}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', minHeight: 32, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.message || '—'}</div>
                  {p.link && <div style={{ fontSize: 11, color: '#5aa9ff', marginTop: 6, wordBreak: 'break-all' }}>🔗 {p.link}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                    <label className="switch"><input type="checkbox" checked={!!p.enabled} onChange={() => togglePop(p.id)} /><span className="slider"></span></label>
                    <span style={{ fontSize: 12, color: p.enabled ? 'var(--green)' : 'var(--muted)', fontWeight: 700 }}>{p.enabled ? 'Live' : 'Off'}</span>
                    <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                      <button className="ed" onClick={() => openEdit(p)}>✏️</button>
                      <button className="rm" onClick={() => delPop(p.id)}>🗑</button>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== POP-OUT EDITOR ===== */}
      {open && (
        <div className="modal-ov show" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
          <div className="pm-modal" style={{ maxWidth: 560 }}>
            <div className="pm-head">
              <span style={{ fontSize: '1.1rem' }}>🖼</span>
              <span><div className="nm">{editId ? 'Edit Pop-out' : 'New Pop-out'}</div></span>
              <button className="kyc-x" style={{ marginLeft: 'auto' }} onClick={close}>✕</button>
            </div>
            <div className="pm-body">
              <div className="pm-fld" style={{ marginBottom: 12 }}><label>Title</label><input value={form.title} onChange={(e) => setF('title', e.target.value)} placeholder="e.g. Welcome to Onward!" /></div>
              <div className="pm-fld" style={{ marginBottom: 12 }}><label>Message</label><textarea className="pwa-ta" value={form.message} onChange={(e) => setF('message', e.target.value)} placeholder="Announcement message shown to players…" /></div>

              <div className="pm-grid">
                <div className="pm-fld">
                  <label>Photo (desktop)</label>
                  {form.image && <img src={form.image} alt="" style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 8, marginBottom: 6 }} />}
                  <input ref={deskRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => pickImage(e.target.files?.[0], 'image')} />
                  <button className="ed" onClick={() => deskRef.current?.click()} disabled={uploading === 'image'}>{uploading === 'image' ? 'Uploading…' : (form.image ? 'Replace photo' : '⬆ Upload photo')}</button>
                  {form.image && <button className="rm" style={{ marginLeft: 6 }} onClick={() => setF('image', '')}>Remove</button>}
                </div>
                <div className="pm-fld">
                  <label>Photo (mobile, optional)</label>
                  {form.mobileImage && <img src={form.mobileImage} alt="" style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 8, marginBottom: 6 }} />}
                  <input ref={mobRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => pickImage(e.target.files?.[0], 'mobileImage')} />
                  <button className="ed" onClick={() => mobRef.current?.click()} disabled={uploading === 'mobileImage'}>{uploading === 'mobileImage' ? 'Uploading…' : (form.mobileImage ? 'Replace photo' : '⬆ Upload photo')}</button>
                  {form.mobileImage && <button className="rm" style={{ marginLeft: 6 }} onClick={() => setF('mobileImage', '')}>Remove</button>}
                </div>
              </div>

              <div className="pm-grid" style={{ marginTop: 12 }}>
                <div className="pm-fld"><label>Click-through Link (opens on tap)</label><input value={form.link} onChange={(e) => setF('link', e.target.value)} placeholder="/promotions or https://…" /></div>
                <div className="pm-fld"><label>Button Text</label><input value={form.ctaText} onChange={(e) => setF('ctaText', e.target.value)} placeholder="Learn More" /></div>
              </div>

              <div className="pm-check" style={{ marginTop: 12 }}><input type="checkbox" checked={form.enabled} onChange={(e) => setF('enabled', e.target.checked)} /><div><div className="t">Active</div><div className="d">Show this pop-out to players</div></div></div>
            </div>
            <div className="pm-foot">
              <button className="btn-cancel" onClick={close}>Cancel</button>
              <button className="btn-pm-save" onClick={savePop}>{editId ? 'Save Changes' : 'Create Pop-out'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
