import { useEffect, useState } from 'react';
import { useUI } from '../context/UIContext';
import { listMissions, saveMissions } from '../services/missionService';

/*
 * Mission admin — create/edit the missions shown on the player site's
 * Missions page (icon, title, description, type, target, reward, duration).
 */

let idSeq = 0;
const newId = () => 'm' + Date.now().toString(36) + (idSeq++).toString(36);

const TYPES = [
  ['deposit', '💳 Deposit'],
  ['wager', '🎲 Wager'],
  ['login', '📅 Login'],
  ['referral', '🤝 Referral'],
  ['game', '🎮 Game'],
  ['other', '🎯 Other'],
];
const TYPE_LABEL = Object.fromEntries(TYPES);

const EMPTY = { id: '', enabled: true, icon: '🎯', title: '', desc: '', type: 'deposit', target: '', reward: '', duration: '' };

export default function Mission() {
  const { toast } = useUI();
  const [missions, setMissions] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [typeF, setTypeF] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    listMissions().then((d) => setMissions(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoaded(true));
  }, []);

  const persist = async (next, msg) => {
    setMissions(next);
    try { const saved = await saveMissions(next); setMissions(saved); toast(msg || 'Saved ✔'); }
    catch (e) { toast('⚠ ' + (e?.response?.data?.error || e.message || 'Save failed')); }
  };

  /* ---------- editor modal ---------- */
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const openNew = () => { setForm({ ...EMPTY, id: newId() }); setEditId(null); setOpen(true); };
  const openEdit = (m) => { setForm({ ...EMPTY, ...m }); setEditId(m.id); setOpen(true); };
  const close = () => setOpen(false);

  const save = () => {
    if (!form.title.trim()) { toast('⚠ Title is required'); return; }
    const exists = missions.some((m) => m.id === form.id);
    const next = exists ? missions.map((m) => (m.id === form.id ? form : m)) : [form, ...missions];
    persist(next, editId ? 'Mission updated 💾' : 'Mission created ✅');
    setOpen(false);
  };
  const del = (id) => {
    const m = missions.find((x) => x.id === id);
    persist(missions.filter((x) => x.id !== id), `Mission deleted 🗑 ${m?.title || ''}`);
  };
  const toggle = (id) => persist(missions.map((m) => (m.id === id ? { ...m, enabled: m.enabled === false } : m)));

  const visible = (m) => (!typeF || m.type === typeF) && m.title.toLowerCase().includes(query.toLowerCase());
  const shown = missions.filter(visible);

  return (
    <>
      <div className="page-head">
        <div><h1 className="hero-h">🎯 Mission</h1><div className="hero-sub" style={{ marginBottom: 0 }}>Create and manage the missions shown on the player Missions page</div></div>
        <span className="pr"><button className="btn-search" onClick={openNew}>＋ Create Mission</button></span>
      </div>

      <div className="grid kpi-grid">
        <div className="card kpi b"><div className="lbl">Total Missions</div><div className="val">{missions.length}</div></div>
        <div className="card kpi g"><div className="lbl">Active</div><div className="val">{missions.filter((m) => m.enabled !== false).length}</div></div>
        <div className="card kpi"><div className="lbl">Off</div><div className="val">{missions.filter((m) => m.enabled === false).length}</div></div>
        <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">Types in use</div><div className="val">{new Set(missions.map((m) => m.type)).size}</div></div>
      </div>

      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="page-head" style={{ marginBottom: 12 }}><div className="card-title" style={{ marginBottom: 0 }}>Mission List</div>
          <span className="pr" style={{ display: 'flex', gap: 8 }}>
            <select className="qsearch" style={{ width: 'auto' }} value={typeF} onChange={(e) => setTypeF(e.target.value)}>
              <option value="">All Types</option>
              {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <input className="qsearch" placeholder="Search mission…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </span>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table style={{ minWidth: 980 }}>
          <thead><tr><th>Mission</th><th>Type</th><th>Target</th><th>Reward</th><th>Duration</th><th>Active</th><th>Actions</th></tr></thead>
          <tbody>
            {shown.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>
                {loaded ? (missions.length ? 'No missions match this filter.' : 'No missions yet — click “＋ Create Mission”.') : 'Loading…'}
              </td></tr>
            ) : shown.map((m) => (
              <tr key={m.id}>
                <td><b>{m.icon} {m.title}</b>{m.desc && <div style={{ color: 'var(--muted)', fontSize: '.7rem', fontWeight: 500 }}>{m.desc}</div>}</td>
                <td>{TYPE_LABEL[m.type] || m.type}</td>
                <td>{m.target || '—'}</td>
                <td style={{ color: 'var(--gold)', fontWeight: 900 }}>{m.reward || '—'}</td>
                <td>{m.duration || '—'}</td>
                <td><span className={m.enabled !== false ? 'on-chip' : 'off-chip'} style={{ cursor: 'pointer' }} onClick={() => toggle(m.id)}>{m.enabled !== false ? '✅ On' : '⬜ Off'}</span></td>
                <td><button className="mini-btn gold" onClick={() => openEdit(m)}>✏️</button> <button className="del-btn" onClick={() => del(m.id)}>🗑</button></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>

      {/* ===== EDITOR ===== */}
      {open && (
        <div className="modal-ov show" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
          <div className="pm-modal" style={{ maxWidth: 560 }}>
            <div className="pm-head">
              <span style={{ fontSize: '1.1rem' }}>🎯</span>
              <span><div className="nm">{editId ? 'Edit Mission' : 'New Mission'}</div></span>
              <button className="kyc-x" style={{ marginLeft: 'auto' }} onClick={close}>✕</button>
            </div>
            <div className="pm-body">
              <div className="pm-grid" style={{ gridTemplateColumns: '80px 1fr' }}>
                <div className="pm-fld"><label>Icon</label><input value={form.icon} onChange={(e) => setF('icon', e.target.value)} placeholder="🎯" maxLength={4} style={{ textAlign: 'center', fontSize: '1.2rem' }} /></div>
                <div className="pm-fld"><label>Title <span className="req-star">*</span></label><input value={form.title} onChange={(e) => setF('title', e.target.value)} placeholder="e.g. Weekly Wager" /></div>
              </div>
              <div className="pm-fld" style={{ marginTop: 12 }}><label>Description (shown to players)</label><input value={form.desc} onChange={(e) => setF('desc', e.target.value)} placeholder="e.g. Wager ₱10,000 this week" /></div>
              <div className="pm-grid" style={{ marginTop: 12 }}>
                <div className="pm-fld"><label>Type</label>
                  <select value={form.type} onChange={(e) => setF('type', e.target.value)}>
                    {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="pm-fld"><label>Target</label><input value={form.target} onChange={(e) => setF('target', e.target.value)} placeholder="e.g. 7  ·  ₱10,000" /></div>
              </div>
              <div className="pm-grid" style={{ marginTop: 12 }}>
                <div className="pm-fld"><label>Reward</label><input value={form.reward} onChange={(e) => setF('reward', e.target.value)} placeholder="e.g. ₱200  ·  50 FS" /></div>
                <div className="pm-fld"><label>Duration</label><input value={form.duration} onChange={(e) => setF('duration', e.target.value)} placeholder="e.g. 7 days  ·  Ongoing" /></div>
              </div>
              <div className="pm-check" style={{ marginTop: 12 }}><input type="checkbox" checked={form.enabled !== false} onChange={(e) => setF('enabled', e.target.checked)} /><div><div className="t">Active</div><div className="d">Show this mission to players</div></div></div>
            </div>
            <div className="pm-foot">
              <button className="btn-cancel" onClick={close}>Cancel</button>
              <button className="btn-pm-save" onClick={save}>{editId ? 'Save Changes' : 'Create Mission'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
