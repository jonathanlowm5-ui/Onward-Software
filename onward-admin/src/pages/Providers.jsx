import { useEffect, useMemo, useRef, useState } from 'react';
import { useUI } from '../context/UIContext';
import { listGames, toggleGame, updateGame, createGame, removeGame } from '../services/gameService';
import { uploadImage } from '../services/uploadService';
import { getConfig, saveConfig } from '../services/configService';

const CATS = [['slots', 'Slots'], ['live', 'Live Casino'], ['crash', 'Crash'], ['fishing', 'Fish'], ['table', 'Table'], ['sports', 'Sports']];
const catLabel = (c) => (CATS.find(([k]) => k === c)?.[1] || c || 'slots');

// Language support tiles (top-left code · language name), matching the grid.
const LANGS = [
  ['US', 'English'], ['CN', 'Chinese'], ['BR', 'Portuguese'], ['ES', 'Spanish'], ['IN', 'Hindi'],
  ['ID', 'Indonesian'], ['TH', 'Thai'], ['VN', 'Vietnamese'], ['MY', 'Malay'], ['KR', 'Korean'],
  ['JP', 'Japanese'], ['TR', 'Turkish'], ['SA', 'Arabic'], ['DE', 'German'], ['FR', 'French'],
  ['RU', 'Russian'], ['PH', 'Filipino'], ['BD', 'Bengali'], ['MM', 'Burmese'], ['KH', 'Khmer'],
];
const parseLangs = (s) => new Set(String(s || '').split(',').map((x) => x.trim().toUpperCase()).filter(Boolean));
const joinLangs = (set) => [...set].join(', ');

const BLANK_FORM = () => ({ editId: null, editRaw: null, name: '', code: '', category: 'slots', rtp: '96.0', langs: new Set(['US']), image: '', hot: false, enabled: true, seq: 0 });

// Build the full backend game object (PUT rebuilds the record, so send everything).
const gamePayload = (g, edits = {}) => {
  const r = { ...g, ...edits };
  return {
    name: String(r.name || '').trim(), provider: String(r.provider || '').trim(),
    category: r.category || 'slots', code: String(r.code || '').trim(), langs: String(r.langs || '').trim(),
    rtp: Number(r.rtp) || 0, image: r.image || '', launchUrl: r.launchUrl || '',
    badge: r.badge || '', color: r.color || '', icon: r.icon || '',
    hot: !!r.hot, popular: !!r.popular, enabled: !!r.enabled,
    order: Number.isFinite(+r.order) ? +r.order : 0,
  };
};

export default function Providers() {
  const { toast } = useUI();
  const [games, setGames] = useState([]);
  const [cfg, setCfg] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [busyProv, setBusyProv] = useState('');

  const load = () => Promise.all([listGames(), getConfig()])
    .then(([g, c]) => { setGames(Array.isArray(g) ? g : []); setCfg(c?.providersConfig || {}); setLoaded(true); })
    .catch((e) => { setLoaded(true); toast('⚠ ' + (e.message || 'Failed to load providers')); });
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const providers = useMemo(() => {
    const map = {};
    for (const g of games) {
      const p = g.provider || 'Unknown';
      map[p] = map[p] || { name: p, total: 0, enabled: 0, cats: new Set() };
      map[p].total++;
      if (g.enabled) map[p].enabled++;
      if (g.category) map[p].cats.add(g.category);
    }
    for (const name of Object.keys(cfg)) if (!map[name]) map[name] = { name, total: 0, enabled: 0, cats: new Set(), manual: true };
    return Object.values(map)
      .map((p) => ({ ...p, on: cfg[p.name]?.enabled !== false, logo: cfg[p.name]?.logo || '' }))
      .sort((a, b) => b.total - a.total);
  }, [games, cfg]);

  const kpi = useMemo(() => ({
    total: providers.length, on: providers.filter((p) => p.on).length,
    games: games.length, enabledGames: games.filter((g) => g.enabled).length,
  }), [providers, games]);

  // ---- Add / edit provider (name + logo) ----
  const [provModal, setProvModal] = useState(null);
  const [provBusy, setProvBusy] = useState(false);
  const uploadProvLogo = async (e) => {
    const file = e.target.files && e.target.files[0]; e.target.value = '';
    if (!file) return;
    if (file.size > 1024 * 1024) { toast('⚠ Logo too large — keep it under 1 MB'); return; }
    try { const { url } = await uploadImage(file); setProvModal((m) => ({ ...m, logo: url })); toast('Logo uploaded ✔'); }
    catch (err) { toast('⚠ ' + (err.message || 'Upload failed')); }
  };
  const submitProvider = async () => {
    const name = provModal.name.trim();
    if (!name) { toast('⚠ Enter a provider name'); return; }
    if (providers.some((p) => p.name.toLowerCase() === name.toLowerCase() && p.name !== provModal.orig)) { toast('⚠ That provider already exists'); return; }
    setProvBusy(true);
    try {
      let nextCfg = { ...cfg };
      if (provModal.editing && provModal.orig && provModal.orig !== name) {
        nextCfg[name] = { ...(nextCfg[provModal.orig] || {}) };
        delete nextCfg[provModal.orig];
        for (const g of games.filter((g) => (g.provider || 'Unknown') === provModal.orig)) await updateGame(g.id, gamePayload(g, { provider: name })).catch(() => {});
      }
      nextCfg[name] = { ...(nextCfg[name] || {}), enabled: nextCfg[name]?.enabled !== false, logo: provModal.logo || '', manual: nextCfg[name]?.manual ?? true };
      await saveConfig({ providersConfig: nextCfg });
      setCfg(nextCfg);
      const wasNew = !provModal.editing;
      setProvModal(null);
      toast(provModal.editing ? '✅ Provider saved' : `✅ Provider "${name}" added`);
      await load();
      if (wasNew) openDrawer(name); // jump straight into managing its games
    } catch (e) { toast('⚠ ' + (e.message || 'Save failed')); }
    finally { setProvBusy(false); }
  };

  const toggleProvider = async (p) => {
    const target = !p.on; setBusyProv(p.name);
    try {
      const nextCfg = { ...cfg, [p.name]: { ...(cfg[p.name] || {}), enabled: target } };
      await saveConfig({ providersConfig: nextCfg }); setCfg(nextCfg);
      const outOfSync = games.filter((g) => (g.provider || 'Unknown') === p.name && !!g.enabled !== target);
      for (const g of outOfSync) await toggleGame(g.id).catch(() => {});
      toast(`${p.name} ${target ? 'enabled ✅' : 'disabled ⏸'} — ${outOfSync.length} game(s) ${target ? 'shown' : 'hidden'}`);
      load();
    } catch (e) { toast('⚠ ' + (e.message || 'Toggle failed')); }
    finally { setBusyProv(''); }
  };

  // ---- Provider drawer (Game Playlist + Add Game tabs) ----
  const [drawer, setDrawer] = useState(null); // provider name | null
  const [tab, setTab] = useState('playlist');
  const [gq, setGq] = useState('');
  const [langFilter, setLangFilter] = useState('');
  const [form, setForm] = useState(BLANK_FORM());
  const [gBusy, setGBusy] = useState('');
  const [saveBusy, setSaveBusy] = useState(false);
  const fileRef = useRef(null);
  const openDrawer = (name) => { setDrawer(name); setTab('playlist'); setGq(''); setLangFilter(''); setForm(BLANK_FORM()); };

  const drawerProv = providers.find((p) => p.name === drawer);
  const drawerCat = drawerProv ? (catLabel([...drawerProv.cats][0] || 'slots')) : 'Slots';
  const provGames = useMemo(() => {
    if (!drawer) return [];
    const q = gq.trim().toLowerCase();
    return games
      .filter((g) => (g.provider || 'Unknown') === drawer)
      .filter((g) => !q || String(g.name || '').toLowerCase().includes(q))
      .filter((g) => !langFilter || parseLangs(g.langs).has(langFilter))
      .sort((a, b) => (a.order || 0) - (b.order || 0) || String(a.name || '').localeCompare(String(b.name || '')));
  }, [games, drawer, gq, langFilter]);

  const patchGame = async (g, edits, msg) => {
    setGBusy(g.id);
    try {
      const updated = await updateGame(g.id, gamePayload(g, edits));
      setGames((prev) => prev.map((x) => (x.id === g.id ? { ...x, ...updated } : x)));
      if (msg) toast(msg);
    } catch (e) { toast('⚠ ' + (e.message || 'Update failed')); }
    finally { setGBusy(''); }
  };
  const toggleActive = async (g) => {
    setGBusy(g.id);
    try { const u = await toggleGame(g.id); setGames((prev) => prev.map((x) => (x.id === g.id ? { ...x, enabled: u?.enabled ?? !x.enabled } : x))); }
    catch (e) { toast('⚠ ' + (e.message || 'Toggle failed')); } finally { setGBusy(''); }
  };
  const deleteGame = async (g) => {
    if (!window.confirm(`Delete "${g.name}"?`)) return;
    setGBusy(g.id);
    try { await removeGame(g.id); setGames((prev) => prev.filter((x) => x.id !== g.id)); toast(`🗑 ${g.name} deleted`); }
    catch (e) { toast('⚠ ' + (e.message || 'Delete failed')); } finally { setGBusy(''); }
  };

  // Add / edit game form
  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const toggleLang = (code) => setForm((p) => { const s = new Set(p.langs); s.has(code) ? s.delete(code) : s.add(code); return { ...p, langs: s }; });
  const openEditGame = (g) => { setForm({ editId: g.id, editRaw: g, name: g.name || '', code: g.code || '', category: g.category || 'slots', rtp: String(g.rtp || '96.0'), langs: parseLangs(g.langs), image: g.image || '', hot: !!g.hot, enabled: g.enabled !== false, seq: g.order || 0 }); setTab('add'); };
  const uploadCover = async (file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast('⚠ Image too large — under 2 MB'); return; }
    try { const { url } = await uploadImage(file); setF('image', url); toast('Cover uploaded ✔'); }
    catch (err) { toast('⚠ ' + (err.message || 'Upload failed')); }
  };
  const submitGame = async () => {
    if (!form.name.trim()) { toast('⚠ Game name is required'); return; }
    setSaveBusy(true);
    try {
      const fields = { name: form.name.trim(), provider: drawer, category: form.category, code: form.code.trim(), langs: joinLangs(form.langs), rtp: Number(form.rtp) || 0, image: form.image, hot: form.hot, enabled: form.enabled, order: Number(form.seq) || 0 };
      if (form.editId) {
        const updated = await updateGame(form.editId, gamePayload(form.editRaw || {}, fields));
        setGames((prev) => prev.map((x) => (x.id === form.editId ? { ...x, ...updated } : x)));
        toast(`✅ ${fields.name} saved`);
      } else {
        const created = await createGame(gamePayload({}, fields));
        setGames((prev) => [created, ...prev]);
        toast(`✅ ${created.name} added to ${drawer}`);
      }
      setForm(BLANK_FORM()); setTab('playlist');
    } catch (e) { toast('⚠ ' + (e.message || 'Save failed')); }
    finally { setSaveBusy(false); }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="hero-h">🕹️ Game Providers</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>Click a provider to open its game playlist — add, edit and toggle games. Toggling a provider bulk-enables/disables all its games.</div>
        </div>
        <span className="pr" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="mini-btn gold" onClick={() => setProvModal({ name: '', logo: '', editing: false })}>➕ Add Provider</button>
          <button className="mini-btn" onClick={() => { setLoaded(false); load().then(() => toast('Providers refreshed 🔄')); }}>🔄 Refresh</button>
        </span>
      </div>

      <div className="grid kpi-grid">
        <div className="card kpi b"><div className="lbl">Providers</div><div className="val">{kpi.total}</div><div className="trend" style={{ color: 'var(--muted)' }}>{kpi.on} enabled</div></div>
        <div className="card kpi g"><div className="lbl">Games</div><div className="val">{kpi.games}</div><div className="trend" style={{ color: 'var(--muted)' }}>in catalog</div></div>
        <div className="card kpi"><div className="lbl">Live On Frontend</div><div className="val">{kpi.enabledGames}</div><div className="trend" style={{ color: 'var(--muted)' }}>enabled games</div></div>
        <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">Hidden</div><div className="val">{kpi.games - kpi.enabledGames}</div><div className="trend" style={{ color: 'var(--muted)' }}>disabled games</div></div>
      </div>

      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table style={{ minWidth: 900 }}>
            <thead><tr><th>Provider</th><th>Categories</th><th>Games</th><th>Enabled Games</th><th>Status</th><th>Manage</th><th>Enabled</th></tr></thead>
            <tbody>
              {providers.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: 26 }}>{loaded ? 'No providers yet — click ➕ Add Provider.' : 'Loading…'}</td></tr>
              )}
              {providers.map((p) => (
                <tr key={p.name} style={{ opacity: p.on ? 1 : 0.55, cursor: 'pointer' }} onClick={() => openDrawer(p.name)}>
                  <td>
                    <span className="prov-logo" style={{ background: '#243049', overflow: 'hidden', padding: 0 }}>{p.logo ? <img src={p.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : p.name.slice(0, 2).toUpperCase()}</span>
                    <b style={{ marginLeft: 8 }}>{p.name}</b>
                    {p.total === 0 && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: 'var(--gold)' }}>NEW · add games</span>}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{[...p.cats].map(catLabel).join(' · ') || '—'}</td>
                  <td style={{ fontWeight: 800 }}>{p.total}</td>
                  <td><span className={p.enabled ? 'on-chip' : 'off-chip'}>{p.enabled} / {p.total}</span></td>
                  <td>{p.on ? <span className="api-on">enabled</span> : <span className="api-off">disabled</span>}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button className="mini-btn" onClick={() => openDrawer(p.name)}>🎮 Games</button>
                    <button className="mini-btn" style={{ marginLeft: 6 }} onClick={() => setProvModal({ name: p.name, orig: p.name, logo: p.logo || '', editing: true })}>✏️</button>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <label className="switch"><input type="checkbox" checked={p.on} disabled={busyProv === p.name} onChange={() => toggleProvider(p)} /><span className="slider"></span></label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---- Provider drawer ---- */}
      {drawer !== null && (
        <div className="dep2-ov" onClick={(e) => { if (e.target.classList.contains('dep2-ov')) setDrawer(null); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(4,8,18,.74)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 900, padding: '30px 16px', overflowY: 'auto' }}>
          <div className="card" style={{ width: 720, maxWidth: '96vw', display: 'flex', flexDirection: 'column' }}>
            <div className="page-head" style={{ marginBottom: 8 }}>
              <div className="card-title" style={{ marginBottom: 0 }}>⚙️ {drawer} <span style={{ color: 'var(--muted)', fontWeight: 600 }}>— {drawerCat}</span></div>
              <button className="mini-btn" onClick={() => setDrawer(null)}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 18, borderBottom: '1px solid var(--border)', marginBottom: 14 }}>
              <button className="gl-tab" onClick={() => setTab('playlist')} style={tabStyle(tab === 'playlist')}>🎮 Game Playlist</button>
              <button className="gl-tab" onClick={() => { setForm(BLANK_FORM()); setTab('add'); }} style={tabStyle(tab === 'add')}>＋ {form.editId ? 'Edit Game' : 'Add Game'}</button>
            </div>

            {tab === 'playlist' ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                  <div style={{ fontWeight: 800 }}>Total: {provGames.length} game{provGames.length === 1 ? '' : 's'}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select value={langFilter} onChange={(e) => setLangFilter(e.target.value)} style={inp}>
                      <option value="">🌐 All Languages</option>
                      {LANGS.map(([c, n]) => <option key={c} value={c}>{c} · {n}</option>)}
                    </select>
                    <input value={gq} onChange={(e) => setGq(e.target.value)} placeholder="Search game name…" style={inp} />
                  </div>
                </div>
                <div className="table-wrap" style={{ border: '1px solid var(--border)', borderRadius: 10, maxHeight: '58vh', overflowY: 'auto' }}>
                  <table style={{ minWidth: 620 }}>
                    <thead><tr><th>SEQ</th><th>Game</th><th>Game ID</th><th>Hot</th><th>Active</th><th>Photo</th></tr></thead>
                    <tbody>
                      {provGames.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 22 }}>{gq || langFilter ? 'No games match.' : 'No games yet — use the ＋ Add Game tab.'}</td></tr>}
                      {provGames.map((g) => (
                        <tr key={g.id} style={{ opacity: g.enabled ? 1 : 0.55 }}>
                          <td><input className="seq-in" defaultValue={g.order || 0} inputMode="numeric" onBlur={(e) => { const v = parseInt(e.target.value) || 0; if (v !== (g.order || 0)) patchGame(g, { order: v }); }} style={{ width: 54 }} /></td>
                          <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{g.image ? <img src={g.image} alt="" style={{ width: 30, height: 30, borderRadius: 6, objectFit: 'cover' }} /> : <span style={{ fontSize: 18 }}>🎰</span>}<b>{g.name}</b></span></td>
                          <td><span className="gid">{g.code || g.id}</span></td>
                          <td><input type="checkbox" checked={!!g.hot} disabled={gBusy === g.id} onChange={(e) => patchGame(g, { hot: e.target.checked })} /></td>
                          <td><span className={g.enabled ? 'on-chip' : 'off-chip'} style={{ cursor: 'pointer' }} onClick={() => toggleActive(g)}>{g.enabled ? '✅ On' : 'Off'}</span></td>
                          <td>
                            <button className="mini-btn gold" onClick={() => openEditGame(g)}>✏️ Edit</button>
                            <button className="mini-btn" style={{ marginLeft: 6, color: 'var(--red,#ff4d5e)' }} disabled={gBusy === g.id} onClick={() => deleteGame(g)}>🗑</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>{form.editId ? 'Edit this game.' : `Add a new game to ${drawer}'s playlist.`}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div className="fld"><label>Game Name <span style={{ color: 'var(--red,#ff4d5e)' }}>*</span></label><input value={form.name} onChange={(e) => setF('name', e.target.value)} placeholder="e.g. Wild West Gold" /></div>
                  <div className="fld"><label>Game ID</label><input value={form.code} onChange={(e) => setF('code', e.target.value)} placeholder="e.g. 37060" /></div>
                  <div className="fld"><label>Category</label><select value={form.category} onChange={(e) => setF('category', e.target.value)}>{CATS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
                  <div className="fld"><label>RTP %</label><input value={form.rtp} inputMode="decimal" onChange={(e) => setF('rtp', e.target.value)} placeholder="96.0" /></div>
                </div>

                <div className="fld" style={{ marginBottom: 12 }}>
                  <label>Language Support</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))', gap: 8 }}>
                    {LANGS.map(([c, n]) => {
                      const on = form.langs.has(c);
                      return (
                        <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', borderRadius: 8, border: `1px solid ${on ? 'var(--gold)' : 'var(--border)'}`, background: on ? 'rgba(240,192,64,.08)' : 'var(--bg3,#0b1224)', cursor: 'pointer' }}>
                          <input type="checkbox" checked={on} onChange={() => toggleLang(c)} style={{ margin: 0 }} />
                          <span style={{ lineHeight: 1.1 }}><span style={{ fontSize: 10, color: 'var(--muted)', display: 'block' }}>{c}</span><b style={{ fontSize: 11 }}>{n.toUpperCase()}</b></span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="fld" style={{ marginBottom: 10 }}>
                  <label>Game Photo / Cover Image</label>
                  <div onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); uploadCover(e.dataTransfer.files?.[0]); }}
                    style={{ border: '1px dashed var(--border)', borderRadius: 10, padding: form.image ? 10 : '26px 14px', textAlign: 'center', cursor: 'pointer', background: 'var(--bg3,#0b1224)' }}>
                    {form.image
                      ? <img src={form.image} alt="" style={{ maxHeight: 90, borderRadius: 8, objectFit: 'contain' }} />
                      : <><div style={{ fontSize: 26 }}>🖼️</div><div style={{ color: 'var(--muted)', fontSize: 13 }}>Click or drag &amp; drop image here</div><div style={{ color: 'var(--muted)', fontSize: 11 }}>PNG, JPG, WebP — recommended 120×160px</div></>}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { uploadCover(e.target.files?.[0]); e.target.value = ''; }} />
                </div>
                <div className="fld" style={{ marginBottom: 12 }}>
                  <label>Or paste image URL:</label>
                  <input value={form.image} onChange={(e) => setF('image', e.target.value)} placeholder="https://cdn.example.com/game-cover.jpg" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <label style={cardToggle(form.hot)} onClick={() => setF('hot', !form.hot)}>
                    <input type="checkbox" checked={form.hot} onChange={() => setF('hot', !form.hot)} style={{ margin: 0 }} />
                    <span><b>HOT GAME</b><span style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>MARK AS HOT 🔥</span></span>
                  </label>
                  <label style={cardToggle(form.enabled)} onClick={() => setF('enabled', !form.enabled)}>
                    <input type="checkbox" checked={form.enabled} onChange={() => setF('enabled', !form.enabled)} style={{ margin: 0 }} />
                    <span><b>ACTIVE</b><span style={{ display: 'block', fontSize: 11, color: 'var(--muted)' }}>ENABLE IMMEDIATELY</span></span>
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  {form.editId && <button className="mini-btn" onClick={() => { setForm(BLANK_FORM()); setTab('playlist'); }}>Cancel</button>}
                  <button className="mini-btn gold" onClick={submitGame} disabled={saveBusy}>{saveBusy ? 'Saving…' : (form.editId ? 'Save Game' : '＋ Add Game to Playlist')}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- Add / edit provider modal ---- */}
      {provModal && (
        <div className="dep2-ov" onClick={(e) => { if (e.target.classList.contains('dep2-ov')) setProvModal(null); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(4,8,18,.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 420, maxWidth: '94vw' }}>
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{provModal.editing ? '✏️ Edit Provider' : '➕ Add Provider'}</span>
              <button className="mini-btn" onClick={() => setProvModal(null)}>✕</button>
            </div>
            <div className="fld" style={{ marginBottom: 10 }}>
              <label>Provider Name <span style={{ color: 'var(--red,#ff4d5e)' }}>*</span></label>
              <input value={provModal.name} onChange={(e) => setProvModal((m) => ({ ...m, name: e.target.value }))} placeholder="e.g. Pragmatic Play" />
            </div>
            <div className="fld" style={{ marginBottom: 12 }}>
              <label>Logo <span style={{ color: 'var(--muted)', fontWeight: 600 }}>(optional)</span></label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 54, height: 54, borderRadius: 8, border: '1px dashed var(--border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--panel-3,#1b2541)' }}>
                  {provModal.logo ? <img src={provModal.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 12, color: 'var(--muted)' }}>{provModal.name.slice(0, 2).toUpperCase() || 'Logo'}</span>}
                </div>
                <label className="mini-btn" style={{ cursor: 'pointer' }}>⬆ Upload<input type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadProvLogo} /></label>
                {provModal.logo && <button className="mini-btn" onClick={() => setProvModal((m) => ({ ...m, logo: '' }))}>Remove</button>}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="mini-btn" onClick={() => setProvModal(null)}>Cancel</button>
              <button className="mini-btn gold" onClick={submitProvider} disabled={provBusy}>{provBusy ? 'Saving…' : (provModal.editing ? 'Save' : 'Add & Manage Games')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const inp = { padding: '8px 11px', borderRadius: 8, background: 'var(--bg3,#0b1224)', color: 'var(--text,#fff)', border: '1px solid var(--border,#243049)', fontSize: 13 };
const tabStyle = (active) => ({ background: 'none', border: 'none', padding: '8px 2px', marginBottom: -1, borderBottom: `2px solid ${active ? 'var(--gold)' : 'transparent'}`, color: active ? 'var(--gold)' : 'var(--muted)', fontWeight: 700, fontSize: 14, cursor: 'pointer' });
const cardToggle = (on) => ({ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, border: `1px solid ${on ? 'var(--gold)' : 'var(--border)'}`, background: on ? 'rgba(240,192,64,.08)' : 'var(--bg3,#0b1224)', cursor: 'pointer' });
