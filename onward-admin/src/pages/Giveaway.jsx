import { useEffect, useRef, useState } from 'react';
import { useUI } from '../context/UIContext';
import { uploadImage } from '../services/uploadService';
import api from '../services/api';

/*
 * Giveaway — the player site's Giveaways page content (GET/PUT /giveaways).
 * Each entry: icon/image, title, prize, description, min deposit, end date.
 */
const EMPTY = { id: '', enabled: true, icon: '🎁', title: '', prize: '', desc: '', minDeposit: 0, endsAt: '', participants: 0, image: '' };

export default function Giveaway() {
  const { toast } = useUI();
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get('/giveaways').then((r) => setItems(Array.isArray(r.data) ? r.data : [])).catch(() => {}).finally(() => setLoaded(true));
  }, []);

  const persist = async (next, msg) => {
    setItems(next);
    try { const r = await api.put('/giveaways', { items: next }); setItems(r.data); toast(msg || 'Saved ✔'); }
    catch (e) { toast('⚠ ' + (e.message || 'Save failed')); }
  };

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const openNew = () => { setForm({ ...EMPTY, id: 'gw' + Date.now().toString(36) }); setEditId(null); setOpen(true); };
  const openEdit = (g) => { setForm({ ...EMPTY, ...g }); setEditId(g.id); setOpen(true); };

  const pick = async (file) => {
    if (!file) return;
    setUploading(true);
    try { const { url } = await uploadImage(file); setF('image', url); }
    catch (e) { toast('⚠ Upload failed: ' + (e.message || '')); }
    finally { setUploading(false); }
  };

  const save = () => {
    if (!form.title || !form.prize) { toast('⚠ Title and prize are required'); return; }
    const exists = items.some((g) => g.id === form.id);
    persist(exists ? items.map((g) => (g.id === form.id ? form : g)) : [form, ...items],
      editId ? 'Giveaway updated 💾' : 'Giveaway created ✅ — live on the player site');
    setOpen(false);
  };
  const del = (id) => persist(items.filter((g) => g.id !== id), 'Giveaway deleted 🗑');
  const toggle = (id) => persist(items.map((g) => (g.id === id ? { ...g, enabled: g.enabled === false } : g)));

  return (
    <>
      <div className="page-head">
        <div><h1 className="hero-h">🎉 Giveaways</h1><div className="hero-sub" style={{ marginBottom: 0 }}>Prize giveaways shown on the player site's Giveaways page</div></div>
        <span className="pr"><button className="btn-search" onClick={openNew}>＋ New Giveaway</button></span>
      </div>

      <div className="grid kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="card kpi b"><div className="lbl">Total</div><div className="val">{items.length}</div></div>
        <div className="card kpi g"><div className="lbl">Live</div><div className="val">{items.filter((g) => g.enabled !== false).length}</div></div>
        <div className="card kpi" style={{ borderTopColor: '#9b6dff' }}><div className="lbl">Ending Soon</div><div className="val">{items.filter((g) => g.endsAt && Date.parse(g.endsAt) - Date.now() < 7 * 864e5 && Date.parse(g.endsAt) > Date.now()).length}</div></div>
      </div>

      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        {items.length === 0 ? (
          <div className="hist-empty">{loaded ? 'No giveaways yet — click “＋ New Giveaway”.' : 'Loading…'}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 14 }}>
            {items.map((g) => (
              <div key={g.id} style={{ background: 'var(--panel-3,#1b2541)', border: '1px solid var(--border,#243049)', borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  {g.image ? <img src={g.image} alt="" style={{ width: 44, height: 44, borderRadius: 9, objectFit: 'cover' }} /> : <span style={{ fontSize: 30 }}>{g.icon || '🎁'}</span>}
                  <div>
                    <div style={{ fontWeight: 800, color: 'var(--text,#fff)' }}>{g.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--gold)' }}>{g.prize}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', minHeight: 30 }}>{g.desc}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                  {g.minDeposit > 0 ? `Min deposit ${Number(g.minDeposit).toLocaleString()}` : 'No deposit required'}
                  {g.endsAt ? ` · ends ${String(g.endsAt).slice(0, 10)}` : ' · no end date'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                  <label className="switch"><input type="checkbox" checked={g.enabled !== false} onChange={() => toggle(g.id)} /><span className="slider"></span></label>
                  <span style={{ fontSize: 12, color: g.enabled !== false ? 'var(--green)' : 'var(--muted)', fontWeight: 700 }}>{g.enabled !== false ? 'Live' : 'Off'}</span>
                  <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                    <button className="ed" onClick={() => openEdit(g)}>✏️</button>
                    <button className="rm" onClick={() => del(g.id)}>🗑</button>
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
              <span style={{ fontSize: '1.1rem' }}>🎉</span>
              <span><div className="nm">{editId ? 'Edit Giveaway' : 'New Giveaway'}</div></span>
              <button className="kyc-x" style={{ marginLeft: 'auto' }} onClick={() => setOpen(false)}>✕</button>
            </div>
            <div className="pm-body">
              <div className="pm-grid">
                <div className="pm-fld"><label>Title <span className="req-star">*</span></label><input value={form.title} onChange={(e) => setF('title', e.target.value)} placeholder="iPhone 16 Pro Giveaway" /></div>
                <div className="pm-fld"><label>Prize <span className="req-star">*</span></label><input value={form.prize} onChange={(e) => setF('prize', e.target.value)} placeholder="iPhone 16 Pro Max 256GB" /></div>
              </div>
              <div className="pm-fld" style={{ marginTop: 10 }}><label>Description / entry condition</label><input value={form.desc} onChange={(e) => setF('desc', e.target.value)} placeholder="Deposit ₱500+ during the event to enter" /></div>
              <div className="pm-grid" style={{ marginTop: 10 }}>
                <div className="pm-fld"><label>Icon (emoji)</label><input value={form.icon} onChange={(e) => setF('icon', e.target.value)} placeholder="🎁" /></div>
                <div className="pm-fld"><label>Min deposit to enter (0 = none)</label><input type="number" value={form.minDeposit} onChange={(e) => setF('minDeposit', Number(e.target.value))} /></div>
              </div>
              <div className="pm-grid" style={{ marginTop: 10 }}>
                <div className="pm-fld"><label>Ends at</label><input type="datetime-local" value={form.endsAt ? String(form.endsAt).slice(0, 16) : ''} onChange={(e) => setF('endsAt', e.target.value ? new Date(e.target.value).toISOString() : '')} /></div>
                <div className="pm-fld">
                  <label>Banner image (optional)</label>
                  {form.image && <img src={form.image} alt="" style={{ width: '100%', height: 60, objectFit: 'cover', borderRadius: 8, marginBottom: 6 }} />}
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => pick(e.target.files?.[0])} />
                  <button className="mini-btn" onClick={() => fileRef.current?.click()} disabled={uploading}>{uploading ? 'Uploading…' : (form.image ? 'Replace' : '⬆ Upload')}</button>
                </div>
              </div>
              <div className="pm-check" style={{ marginTop: 12 }}><input type="checkbox" checked={form.enabled !== false} onChange={(e) => setF('enabled', e.target.checked)} /><div><div className="t">Live</div><div className="d">Show on the player site</div></div></div>
            </div>
            <div className="pm-foot">
              <button className="btn-cancel" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn-pm-save" onClick={save}>{editId ? 'Save Changes' : 'Create Giveaway'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
