import { useEffect, useRef, useState } from 'react';
import { useUI } from '../context/UIContext';
import { uploadImage } from '../services/uploadService';
import api from '../services/api';

/*
 * Floating Image — small clickable promo widgets (50–100 px) pinned to a
 * corner of the player site. Upload the artwork (desktop + optional mobile),
 * pick position, size, animation and the click-through link.
 */
const POSITIONS = [
  ['bottom-right', '↘ Bottom right'],
  ['bottom-left', '↙ Bottom left'],
  ['top-right', '↗ Top right'],
  ['top-left', '↖ Top left'],
  ['center-right', '→ Center right'],
  ['center-left', '← Center left'],
];
const ANIMS = [['slide', '↑ Slide in'], ['bounce', '🏀 Bounce'], ['fade', '✨ Fade'], ['none', '— None']];

const EMPTY = { id: '', name: '', image: '', mobileImage: '', position: 'bottom-right', size: 72, link: '', animation: 'slide', closable: true, enabled: true };

export default function Floating() {
  const { toast } = useUI();
  const [floats, setFloats] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get('/floating/all').then((r) => setFloats(Array.isArray(r.data) ? r.data : [])).catch(() => {}).finally(() => setLoaded(true));
  }, []);

  const persist = async (next, msg) => {
    setFloats(next);
    try { const r = await api.put('/floating', { items: next }); setFloats(r.data); toast(msg || 'Saved ✔'); }
    catch (e) { toast('⚠ ' + (e.message || 'Save failed')); }
  };

  /* ---------- editor ---------- */
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [uploading, setUploading] = useState('');
  const deskRef = useRef(null);
  const mobRef = useRef(null);
  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const openNew = () => { setForm({ ...EMPTY, id: 'fl' + Date.now().toString(36) }); setEditId(null); setOpen(true); };
  const openEdit = (f) => { setForm({ ...EMPTY, ...f }); setEditId(f.id); setOpen(true); };

  const pick = async (file, key) => {
    if (!file) return;
    setUploading(key);
    try { const { url } = await uploadImage(file); setF(key, url); }
    catch (e) { toast('⚠ Upload failed: ' + (e.message || '')); }
    finally { setUploading(''); }
  };

  const save = () => {
    if (!form.image) { toast('⚠ Upload the floating image first'); return; }
    const exists = floats.some((f) => f.id === form.id);
    const next = exists ? floats.map((f) => (f.id === form.id ? form : f)) : [form, ...floats];
    persist(next, editId ? 'Float updated 💾' : 'Float created ✅ — live on the player site');
    setOpen(false);
  };
  const del = (id) => persist(floats.filter((f) => f.id !== id), 'Float deleted 🗑');
  const toggle = (id) => persist(floats.map((f) => (f.id === id ? { ...f, enabled: f.enabled === false } : f)));

  return (
    <>
      <div className="page-head">
        <div><h1 className="hero-h">🖼️ Floating Image</h1><div className="hero-sub" style={{ marginBottom: 0 }}>Small clickable promo widgets (50–100 px) pinned to a corner of the player site</div></div>
        <span className="pr"><button className="btn-search" onClick={openNew}>＋ New Float</button></span>
      </div>

      <div className="grid kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="card kpi b"><div className="lbl">Total</div><div className="val">{floats.length}</div></div>
        <div className="card kpi g"><div className="lbl">Live</div><div className="val">{floats.filter((f) => f.enabled !== false).length}</div></div>
        <div className="card kpi" style={{ borderTopColor: '#9b6dff' }}><div className="lbl">Max on site</div><div className="val">10</div></div>
      </div>

      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        {floats.length === 0 ? (
          <div className="hist-empty">{loaded ? 'No floating images yet — click “＋ New Float” and upload one.' : 'Loading…'}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 14 }}>
            {floats.map((f) => (
              <div key={f.id} style={{ background: 'var(--panel-3,#1b2541)', border: '1px solid var(--border,#243049)', borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 110, marginBottom: 10, background: 'rgba(0,0,0,.25)', borderRadius: 9 }}>
                  <img src={f.image} alt="" style={{ width: f.size, height: f.size, objectFit: 'contain' }} />
                </div>
                <div style={{ fontWeight: 800, color: 'var(--text,#fff)', marginBottom: 4 }}>{f.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{f.size}px · {f.position} · {f.animation}{f.link ? ' · 🔗' : ''}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                  <label className="switch"><input type="checkbox" checked={f.enabled !== false} onChange={() => toggle(f.id)} /><span className="slider"></span></label>
                  <span style={{ fontSize: 12, color: f.enabled !== false ? 'var(--green)' : 'var(--muted)', fontWeight: 700 }}>{f.enabled !== false ? 'Live' : 'Off'}</span>
                  <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                    <button className="ed" onClick={() => openEdit(f)}>✏️</button>
                    <button className="rm" onClick={() => del(f.id)}>🗑</button>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {open && (
        <div className="modal-ov show" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="pm-modal" style={{ maxWidth: 560 }}>
            <div className="pm-head">
              <span style={{ fontSize: '1.1rem' }}>🖼️</span>
              <span><div className="nm">{editId ? 'Edit Float' : 'New Floating Image'}</div></span>
              <button className="kyc-x" style={{ marginLeft: 'auto' }} onClick={() => setOpen(false)}>✕</button>
            </div>
            <div className="pm-body">
              <div className="pm-fld" style={{ marginBottom: 12 }}><label>Name (internal)</label><input value={form.name} onChange={(e) => setF('name', e.target.value)} placeholder="e.g. Welcome Bonus Float" /></div>

              <div className="pm-grid">
                <div className="pm-fld">
                  <label>Image (desktop) <span className="req-star">*</span></label>
                  {form.image && <div style={{ display: 'flex', justifyContent: 'center', background: 'rgba(0,0,0,.25)', borderRadius: 8, padding: 8, marginBottom: 6 }}><img src={form.image} alt="" style={{ width: form.size, height: form.size, objectFit: 'contain' }} /></div>}
                  <input ref={deskRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => pick(e.target.files?.[0], 'image')} />
                  <button className="mini-btn" onClick={() => deskRef.current?.click()} disabled={uploading === 'image'}>{uploading === 'image' ? 'Uploading…' : (form.image ? 'Replace' : '⬆ Upload image')}</button>
                </div>
                <div className="pm-fld">
                  <label>Image (mobile, optional)</label>
                  {form.mobileImage && <div style={{ display: 'flex', justifyContent: 'center', background: 'rgba(0,0,0,.25)', borderRadius: 8, padding: 8, marginBottom: 6 }}><img src={form.mobileImage} alt="" style={{ width: form.size, height: form.size, objectFit: 'contain' }} /></div>}
                  <input ref={mobRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => pick(e.target.files?.[0], 'mobileImage')} />
                  <button className="mini-btn" onClick={() => mobRef.current?.click()} disabled={uploading === 'mobileImage'}>{uploading === 'mobileImage' ? 'Uploading…' : (form.mobileImage ? 'Replace' : '⬆ Upload image')}</button>
                  {form.mobileImage && <button className="del-btn" style={{ marginLeft: 6 }} onClick={() => setF('mobileImage', '')}>Remove</button>}
                </div>
              </div>

              <div className="pm-fld" style={{ marginTop: 14 }}>
                <label>Size — {form.size}px (50–100)</label>
                <input type="range" min="50" max="100" step="2" value={form.size} onChange={(e) => setF('size', Number(e.target.value))} style={{ width: '100%' }} />
              </div>

              <div className="pm-grid" style={{ marginTop: 12 }}>
                <div className="pm-fld"><label>Position</label>
                  <select value={form.position} onChange={(e) => setF('position', e.target.value)}>
                    {POSITIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="pm-fld"><label>Animation</label>
                  <select value={form.animation} onChange={(e) => setF('animation', e.target.value)}>
                    {ANIMS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div className="pm-fld" style={{ marginTop: 12 }}><label>Click-through link</label><input value={form.link} onChange={(e) => setF('link', e.target.value)} placeholder="/promotions or https://…" /></div>

              <div className="pm-grid" style={{ marginTop: 12 }}>
                <div className="pm-check"><input type="checkbox" checked={form.closable !== false} onChange={(e) => setF('closable', e.target.checked)} /><div><div className="t">Closable</div><div className="d">Show a small ✕ (hides for the session)</div></div></div>
                <div className="pm-check"><input type="checkbox" checked={form.enabled !== false} onChange={(e) => setF('enabled', e.target.checked)} /><div><div className="t">Live</div><div className="d">Show on the player site</div></div></div>
              </div>
            </div>
            <div className="pm-foot">
              <button className="btn-cancel" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn-pm-save" onClick={save}>{editId ? 'Save Changes' : 'Create Float'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
