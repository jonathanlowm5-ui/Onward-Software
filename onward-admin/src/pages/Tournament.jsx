import { useEffect, useMemo, useRef, useState } from 'react';
import { useUI } from '../context/UIContext';
import { listTournaments, saveTournaments } from '../services/tournamentService';
import { listGames } from '../services/gameService';
import { uploadImage } from '../services/uploadService';

/*
 * Tournament admin — create/edit the tournaments shown on the player site
 * (promotions page → TOURNAMENTS). Each tournament has an uploadable banner,
 * a buy-in / join condition, a prize pool, and a provider + selected games.
 */

let idSeq = 0;
const newId = () => 't' + Date.now().toString(36) + (idSeq++).toString(36);

const EMPTY = {
  id: '', enabled: true, title: '', desc: '', banner: '',
  start: '', end: '', buyIn: '', prize: '', prizeFs: '', provider: '', games: [],
};

function statusOf(t) {
  const now = Date.now();
  if (t.enabled === false) return ['draft', 'st-draft'];
  const s = t.start ? Date.parse(t.start) : NaN;
  const e = t.end ? Date.parse(t.end) : NaN;
  if (!Number.isNaN(e) && now > e) return ['completed', 'st-comp'];
  if (!Number.isNaN(s) && now < s) return ['upcoming', 'st-up'];
  return ['active', 'st-active'];
}

export default function Tournament() {
  const { toast } = useUI();
  const [tours, setTours] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState('all');

  // Game catalogue for the provider/games picker.
  const [allGames, setAllGames] = useState([]);
  useEffect(() => {
    listTournaments().then((d) => setTours(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoaded(true));
    listGames({ enabled: 1 }).then((d) => {
      const rows = Array.isArray(d) ? d : (d?.items || []);
      setAllGames(rows);
    }).catch(() => {});
  }, []);

  const providers = useMemo(
    () => [...new Set(allGames.map((g) => g.provider).filter(Boolean))].sort(),
    [allGames]
  );

  const persist = async (next, msg) => {
    setTours(next);
    try { const saved = await saveTournaments(next); setTours(saved); toast(msg || 'Saved ✔'); }
    catch (e) { toast('⚠ ' + (e?.response?.data?.error || e.message || 'Save failed')); }
  };

  /* ---------- editor modal ---------- */
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [gameQ, setGameQ] = useState('');
  const bannerRef = useRef(null);
  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const openNew = () => { setForm({ ...EMPTY, id: newId() }); setEditId(null); setGameQ(''); setOpen(true); };
  const openEdit = (t) => { setForm({ ...EMPTY, ...t }); setEditId(t.id); setGameQ(''); setOpen(true); };
  const close = () => setOpen(false);

  const pickBanner = async (file) => {
    if (!file) return;
    setUploading(true);
    try { const { url } = await uploadImage(file); setF('banner', url); }
    catch (e) { toast('⚠ Upload failed: ' + (e.message || '')); }
    finally { setUploading(false); }
  };

  const toggleGame = (name) => setForm((p) => ({
    ...p,
    games: p.games.includes(name) ? p.games.filter((g) => g !== name) : [...p.games, name],
  }));

  // Games offered in the picker: match the chosen provider (if any) + search.
  const pickerGames = useMemo(() => {
    const q = gameQ.trim().toLowerCase();
    let rows = allGames;
    if (form.provider) rows = rows.filter((g) => g.provider === form.provider);
    if (q) rows = rows.filter((g) => String(g.name || '').toLowerCase().includes(q));
    return rows.slice(0, 30);
  }, [allGames, form.provider, gameQ]);

  const save = () => {
    if (!form.title.trim()) { toast('⚠ Title is required'); return; }
    const exists = tours.some((t) => t.id === form.id);
    const next = exists ? tours.map((t) => (t.id === form.id ? form : t)) : [form, ...tours];
    persist(next, editId ? 'Tournament updated 💾' : 'Tournament created ✅');
    setOpen(false);
  };
  const del = (id) => persist(tours.filter((t) => t.id !== id), 'Tournament deleted 🗑');
  const toggleEnabled = (id) => persist(tours.map((t) => (t.id === id ? { ...t, enabled: t.enabled === false } : t)));

  const list = filter === 'all' ? tours : tours.filter((t) => statusOf(t)[0] === filter);
  const filters = [['all', 'All'], ['active', '🟢 Active'], ['upcoming', '📅 Upcoming'], ['completed', '✅ Completed'], ['draft', '📝 Draft']];

  return (
    <>
      <div className="page-head">
        <div><h1 className="hero-h">🏆 Tournament</h1><div className="hero-sub" style={{ marginBottom: 0 }}>Create and manage the tournaments shown to players on the promotions page</div></div>
        <span className="pr"><button className="btn-search" onClick={openNew}>＋ New Tournament</button></span>
      </div>

      <div className="grid kpi-grid">
        <div className="card kpi"><div className="lbl">Active</div><div className="val">{tours.filter((t) => statusOf(t)[0] === 'active').length}</div><div className="trend" style={{ color: 'var(--muted)' }}>running now</div></div>
        <div className="card kpi g"><div className="lbl">Upcoming</div><div className="val">{tours.filter((t) => statusOf(t)[0] === 'upcoming').length}</div><div className="trend" style={{ color: 'var(--muted)' }}>scheduled</div></div>
        <div className="card kpi b"><div className="lbl">Completed</div><div className="val">{tours.filter((t) => statusOf(t)[0] === 'completed').length}</div><div className="trend" style={{ color: 'var(--muted)' }}>past end date</div></div>
        <div className="card kpi" style={{ borderTopColor: '#9b6dff' }}><div className="lbl">Total</div><div className="val">{tours.length}</div><div className="trend" style={{ color: 'var(--muted)' }}>all tournaments</div></div>
      </div>

      <div className="pilltabs">{filters.map((t) => (
        <button key={t[0]} className={`pill ${filter === t[0] ? 'active' : ''}`} onClick={() => setFilter(t[0])}>{t[1]}</button>
      ))}</div>

      <div className="tour-grid">
        {list.length === 0
          ? <div className="card"><div className="hist-empty">{loaded ? 'No tournaments in this filter. Click “＋ New Tournament”.' : 'Loading…'}</div></div>
          : list.map((t) => {
            const [st, cls] = statusOf(t);
            return (
              <div key={t.id} className="tour-card">
                {t.banner
                  ? <img src={t.banner} alt="" style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
                  : <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, background: 'linear-gradient(135deg,#1a0a5e,#0d47a1)' }}>🏆</div>}
                <div className="tour-body">
                  <div className="tour-title">{t.title} <span className={`stchip ${cls}`}>{st}</span></div>
                  <div className="tour-desc">{t.desc || '—'}</div>
                  <div className="tour-stats">
                    <div className="lot-box"><div className="l">Prize Pool</div><div className="v gold">{t.prize || '—'}{t.prizeFs ? ` + ${t.prizeFs}` : ''}</div></div>
                    <div className="lot-box"><div className="l">Buy-in / Join</div><div className="v" style={{ color: 'var(--blue)' }}>{t.buyIn || 'Free'}</div></div>
                  </div>
                  <div className="tour-dates">📅 {(t.start || 'now').replace('T', ' ')} → {(t.end || 'no end').replace('T', ' ')}</div>
                  <div className="tour-dates">🎮 {t.provider || 'All providers'}{t.games?.length ? ` · ${t.games.length} game${t.games.length > 1 ? 's' : ''}` : ' · all games'}</div>
                  <div className="tour-acts">
                    <label className="switch" title={t.enabled === false ? 'Enable' : 'Disable'}><input type="checkbox" checked={t.enabled !== false} onChange={() => toggleEnabled(t.id)} /><span className="slider"></span></label>
                    <button className="mini-btn gold" style={{ flex: '0 0 auto' }} onClick={() => openEdit(t)}>✏️ Edit</button>
                    <button className="del-btn" style={{ flex: '0 0 auto' }} onClick={() => del(t.id)}>🗑</button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* ===== EDITOR ===== */}
      {open && (
        <div className="modal-ov show" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
          <div className="pm-modal" style={{ maxWidth: 640 }}>
            <div className="pm-head">
              <span style={{ fontSize: '1.1rem' }}>🏆</span>
              <span><div className="nm">{editId ? 'Edit Tournament' : 'New Tournament'}</div></span>
              <button className="kyc-x" style={{ marginLeft: 'auto' }} onClick={close}>✕</button>
            </div>
            <div className="pm-body">
              <div className="pm-fld" style={{ marginBottom: 12 }}><label>Title <span className="req-star">*</span></label><input value={form.title} onChange={(e) => setF('title', e.target.value)} placeholder="e.g. May Slots Championship" /></div>
              <div className="pm-fld" style={{ marginBottom: 12 }}><label>Description</label><textarea className="pwa-ta" value={form.desc} onChange={(e) => setF('desc', e.target.value)} placeholder="What players compete for and how to win…" /></div>

              <div className="pm-fld" style={{ marginBottom: 12 }}>
                <label>Tournament Banner (recommended 1200 × 425)</label>
                {form.banner && <img src={form.banner} alt="" style={{ width: '100%', aspectRatio: '1200/425', objectFit: 'cover', borderRadius: 8, marginBottom: 6 }} />}
                <input ref={bannerRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => pickBanner(e.target.files?.[0])} />
                <button className="mini-btn" onClick={() => bannerRef.current?.click()} disabled={uploading}>{uploading ? 'Uploading…' : (form.banner ? 'Replace banner' : '⬆ Upload banner')}</button>
                {form.banner && <button className="del-btn" style={{ marginLeft: 6 }} onClick={() => setF('banner', '')}>Remove</button>}
              </div>

              <div className="pm-grid">
                <div className="pm-fld"><label>Start</label><input type="datetime-local" value={form.start} onChange={(e) => setF('start', e.target.value)} /></div>
                <div className="pm-fld"><label>End</label><input type="datetime-local" value={form.end} onChange={(e) => setF('end', e.target.value)} /></div>
              </div>

              <div className="pm-grid" style={{ marginTop: 12 }}>
                <div className="pm-fld"><label>Buy-in / Join condition</label><input value={form.buyIn} onChange={(e) => setF('buyIn', e.target.value)} placeholder="e.g. Free — min bet ₱1 · or ₱500 buy-in" /></div>
                <div className="pm-fld"><label>Prize Pool</label><input value={form.prize} onChange={(e) => setF('prize', e.target.value)} placeholder="e.g. ₱200,000" /></div>
              </div>
              <div className="pm-grid" style={{ marginTop: 12 }}>
                <div className="pm-fld"><label>Extra prize (optional)</label><input value={form.prizeFs} onChange={(e) => setF('prizeFs', e.target.value)} placeholder="e.g. 2000 FS" /></div>
                <div className="pm-fld"><label>Provider</label>
                  <select value={form.provider} onChange={(e) => setF('provider', e.target.value)}>
                    <option value="">🌐 All providers</option>
                    {providers.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* Selected games picker */}
              <div className="pm-fld" style={{ marginTop: 12 }}>
                <label>Selected games ({form.games.length ? form.games.length + ' selected' : 'none selected = all games count'})</label>
                {form.games.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {form.games.map((g) => (
                      <span key={g} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(90,169,255,.15)', color: '#8fc2ff', borderRadius: 999, padding: '3px 9px', fontSize: 11, fontWeight: 700 }}>
                        {g}<button onClick={() => toggleGame(g)} style={{ background: 'none', border: 'none', color: '#8fc2ff', cursor: 'pointer', fontSize: 12, padding: 0, lineHeight: 1 }}>✕</button>
                      </span>
                    ))}
                  </div>
                )}
                <input value={gameQ} onChange={(e) => setGameQ(e.target.value)} placeholder="Search games to add…" style={{ marginBottom: 6 }} />
                <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid var(--border,#243049)', borderRadius: 8, padding: 6 }}>
                  {pickerGames.length === 0
                    ? <div style={{ color: 'var(--muted)', fontSize: 12, padding: 6 }}>{allGames.length ? 'No games match.' : 'Game list unavailable.'}</div>
                    : pickerGames.map((g) => (
                      <label key={g.id ?? g.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', cursor: 'pointer', fontSize: 12.5, color: 'var(--text,#dfe6f5)' }}>
                        <input type="checkbox" checked={form.games.includes(g.name)} onChange={() => toggleGame(g.name)} />
                        <span style={{ flex: 1 }}>{g.name}</span>
                        <span style={{ color: 'var(--muted)', fontSize: 10.5 }}>{g.provider}</span>
                      </label>
                    ))}
                </div>
              </div>

              <div className="pm-check" style={{ marginTop: 12 }}><input type="checkbox" checked={form.enabled !== false} onChange={(e) => setF('enabled', e.target.checked)} /><div><div className="t">Live</div><div className="d">Show this tournament to players</div></div></div>
            </div>
            <div className="pm-foot">
              <button className="btn-cancel" onClick={close}>Cancel</button>
              <button className="btn-pm-save" onClick={save}>{editId ? 'Save Changes' : 'Create Tournament'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
