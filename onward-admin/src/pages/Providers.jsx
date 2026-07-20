import { useEffect, useMemo, useState } from 'react';
import { useUI } from '../context/UIContext';
import { listGames, toggleGame, updateGame, createGame, removeGame } from '../services/gameService';
import { uploadImage } from '../services/uploadService';
import { getConfig, saveConfig } from '../services/configService';

// Game categories offered when adding / editing a game.
const CATS = [['slots', 'Slots'], ['live', 'Live Casino'], ['crash', 'Crash'], ['fishing', 'Fish'], ['table', 'Table'], ['sports', 'Sports']];
const catLabel = (c) => (CATS.find(([k]) => k === c)?.[1] || c || 'slots');
const EMPTY_GAME = { name: '', provider: '', category: 'slots', image: '', launchUrl: '', enabled: true };

// Real providers — derived from the live games catalog. Provider details (logo,
// enable/disable) persist to providersConfig; per-provider game management edits
// the games catalog directly.
export default function Providers() {
  const { toast } = useUI();
  const [games, setGames] = useState([]);
  const [cfg, setCfg] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [busyProv, setBusyProv] = useState('');

  const load = () => Promise.all([listGames(), getConfig()])
    .then(([g, c]) => {
      setGames(Array.isArray(g) ? g : []);
      setCfg(c?.providersConfig || {});
      setLoaded(true);
    })
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
    // Manually-added providers (saved in config, no games yet) still appear.
    for (const name of Object.keys(cfg)) {
      if (!map[name]) map[name] = { name, total: 0, enabled: 0, cats: new Set(), manual: true };
    }
    return Object.values(map)
      .map((p) => ({ ...p, on: cfg[p.name]?.enabled !== false, logo: cfg[p.name]?.logo || '' }))
      .sort((a, b) => b.total - a.total);
  }, [games, cfg]);

  // ---- Add / edit provider (name + logo, stored in providersConfig) ----
  const [provModal, setProvModal] = useState(null); // { name, logo, editing } | null
  const [provBusy, setProvBusy] = useState(false);
  const openAddProvider = () => setProvModal({ name: '', logo: '', editing: false });
  const openEditProvider = (p) => setProvModal({ name: p.name, orig: p.name, logo: p.logo || '', editing: true });
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
    const dupe = providers.some((p) => p.name.toLowerCase() === name.toLowerCase() && p.name !== provModal.orig);
    if (dupe) { toast('⚠ That provider already exists'); return; }
    setProvBusy(true);
    try {
      let nextCfg = { ...cfg };
      // Rename: move the config entry and re-tag the provider's games.
      if (provModal.editing && provModal.orig && provModal.orig !== name) {
        nextCfg[name] = { ...(nextCfg[provModal.orig] || {}), manual: nextCfg[provModal.orig]?.manual };
        delete nextCfg[provModal.orig];
        const toMove = games.filter((g) => (g.provider || 'Unknown') === provModal.orig);
        for (const g of toMove) { await updateGame(g.id, { ...g, provider: name }).catch(() => {}); }
      }
      nextCfg[name] = { ...(nextCfg[name] || {}), enabled: nextCfg[name]?.enabled !== false, logo: provModal.logo || '', manual: nextCfg[name]?.manual ?? (providers.find((p) => p.name === name)?.total ? undefined : true) };
      await saveConfig({ providersConfig: nextCfg });
      setCfg(nextCfg);
      toast(provModal.editing ? `✅ Provider saved` : `✅ Provider "${name}" added — open it to add games`);
      setProvModal(null);
      if (provModal.editing && provModal.orig !== name && selProv === provModal.orig) setSelProv(name);
      load();
    } catch (e) { toast('⚠ ' + (e.message || 'Save failed')); }
    finally { setProvBusy(false); }
  };

  const toggleProvider = async (p) => {
    const target = !p.on;
    setBusyProv(p.name);
    try {
      const nextCfg = { ...cfg, [p.name]: { ...(cfg[p.name] || {}), enabled: target } };
      await saveConfig({ providersConfig: nextCfg });
      setCfg(nextCfg);
      // Bulk-toggle this provider's games to match (only the ones out of sync).
      const outOfSync = games.filter((g) => (g.provider || 'Unknown') === p.name && !!g.enabled !== target);
      for (const g of outOfSync) { await toggleGame(g.id).catch(() => {}); }
      toast(`${p.name} ${target ? 'enabled ✅' : 'disabled ⏸'} — ${outOfSync.length} game(s) ${target ? 'shown' : 'hidden'} on the frontend`);
      load();
    } catch (e) { toast('⚠ ' + (e.message || 'Toggle failed')); }
    finally { setBusyProv(''); }
  };

  // ---- Provider detail: games under one provider ----
  const [selProv, setSelProv] = useState(null);
  const [gq, setGq] = useState('');
  const provGames = useMemo(() => {
    if (!selProv) return [];
    const q = gq.trim().toLowerCase();
    return games
      .filter((g) => (g.provider || 'Unknown') === selProv)
      .filter((g) => !q || String(g.name || '').toLowerCase().includes(q))
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  }, [games, selProv, gq]);

  const [gameBusy, setGameBusy] = useState('');
  const toggleOneGame = async (g) => {
    setGameBusy(g.id);
    try {
      const updated = await toggleGame(g.id);
      setGames((prev) => prev.map((x) => (x.id === g.id ? { ...x, enabled: updated?.enabled ?? !x.enabled } : x)));
    } catch (e) { toast('⚠ ' + (e.message || 'Toggle failed')); }
    finally { setGameBusy(''); }
  };
  const deleteGame = async (g) => {
    if (!window.confirm(`Delete "${g.name}"? This removes it from the catalog.`)) return;
    setGameBusy(g.id);
    try { await removeGame(g.id); setGames((prev) => prev.filter((x) => x.id !== g.id)); toast(`🗑 ${g.name} deleted`); }
    catch (e) { toast('⚠ ' + (e.message || 'Delete failed')); }
    finally { setGameBusy(''); }
  };

  // ---- Add / edit a single game ----
  const [gameModal, setGameModal] = useState(null); // { ...game fields, id?, editing }
  const [gmBusy, setGmBusy] = useState(false);
  const openAddGame = () => setGameModal({ ...EMPTY_GAME, provider: selProv, editing: false });
  const openEditGame = (g) => setGameModal({ id: g.id, name: g.name || '', provider: g.provider || selProv, category: g.category || 'slots', image: g.image || '', launchUrl: g.launchUrl || '', enabled: g.enabled !== false, _orig: g, editing: true });
  const setGm = (k, v) => setGameModal((m) => ({ ...m, [k]: v }));
  const uploadGameImg = async (e) => {
    const file = e.target.files && e.target.files[0]; e.target.value = '';
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast('⚠ Image too large — keep it under 2 MB'); return; }
    try { const { url } = await uploadImage(file); setGm('image', url); toast('Icon uploaded ✔'); }
    catch (err) { toast('⚠ ' + (err.message || 'Upload failed')); }
  };
  const submitGame = async () => {
    if (!gameModal.name.trim()) { toast('⚠ Game name is required'); return; }
    setGmBusy(true);
    try {
      const payload = { name: gameModal.name.trim(), provider: (gameModal.provider || '').trim(), category: gameModal.category, image: gameModal.image, launchUrl: gameModal.launchUrl, enabled: gameModal.enabled };
      if (gameModal.editing) {
        // PUT rebuilds the record — send the full existing game merged with edits.
        const updated = await updateGame(gameModal.id, { ...gameModal._orig, ...payload });
        setGames((prev) => prev.map((x) => (x.id === gameModal.id ? { ...x, ...updated } : x)));
        toast(`✅ ${payload.name} saved`);
      } else {
        const created = await createGame(payload);
        setGames((prev) => [created, ...prev]);
        toast(`✅ ${created.name} added`);
      }
      setGameModal(null);
    } catch (e) { toast('⚠ ' + (e.message || 'Save failed')); }
    finally { setGmBusy(false); }
  };

  const kpi = useMemo(() => ({
    total: providers.length,
    on: providers.filter((p) => p.on).length,
    games: games.length,
    enabledGames: games.filter((g) => g.enabled).length,
  }), [providers, games]);

  const selP = providers.find((p) => p.name === selProv);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="hero-h">🕹️ Game Providers</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>Click a provider to manage its games — add, edit, enable/disable individually. Toggling a provider bulk-enables/disables all its games.</div>
        </div>
        <span className="pr" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="mini-btn gold" onClick={openAddProvider}>➕ Add Provider</button>
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
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: 26 }}>
                  {loaded ? 'No providers yet — click ➕ Add Provider, or import games via Game List.' : 'Loading…'}
                </td></tr>
              )}
              {providers.map((p) => (
                <tr key={p.name} style={{ opacity: p.on ? 1 : 0.55, cursor: 'pointer' }} onClick={() => { setSelProv(p.name); setGq(''); }}>
                  <td>
                    <span className="prov-logo" style={{ background: '#243049', overflow: 'hidden', padding: 0 }}>
                      {p.logo ? <img src={p.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : p.name.slice(0, 2).toUpperCase()}
                    </span>
                    <b style={{ marginLeft: 8 }}>{p.name}</b>
                    {p.total === 0 && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: 'var(--gold)' }}>NEW · add games</span>}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{[...p.cats].map(catLabel).join(' · ') || '—'}</td>
                  <td style={{ fontWeight: 800 }}>{p.total}</td>
                  <td><span className={p.enabled ? 'on-chip' : 'off-chip'}>{p.enabled} / {p.total}</span></td>
                  <td>{p.on ? <span className="api-on">enabled</span> : <span className="api-off">disabled</span>}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button className="mini-btn" onClick={() => { setSelProv(p.name); setGq(''); }}>🎮 Games</button>
                    <button className="mini-btn" style={{ marginLeft: 6 }} onClick={() => openEditProvider(p)}>✏️</button>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <label className="switch">
                      <input type="checkbox" checked={p.on} disabled={busyProv === p.name} onChange={() => toggleProvider(p)} />
                      <span className="slider"></span>
                    </label>
                    {busyProv === p.name && <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 8 }}>saving…</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---- Provider detail drawer: games under the selected provider ---- */}
      {selProv && (
        <div className="dep2-ov" onClick={(e) => { if (e.target.classList.contains('dep2-ov')) setSelProv(null); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(4,8,18,.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 900, padding: 20 }}>
          <div className="card" style={{ width: 860, maxWidth: '96vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            <div className="page-head" style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="prov-logo" style={{ background: '#243049', overflow: 'hidden', padding: 0 }}>
                  {selP?.logo ? <img src={selP.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : selProv.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <div className="card-title" style={{ marginBottom: 0 }}>{selProv}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{provGames.length} game{provGames.length === 1 ? '' : 's'} shown · {selP?.enabled}/{selP?.total} enabled</div>
                </div>
              </div>
              <span className="pr" style={{ display: 'flex', gap: 8 }}>
                <button className="mini-btn gold" onClick={openAddGame}>➕ Add Game</button>
                <button className="mini-btn" onClick={() => setSelProv(null)}>✕ Close</button>
              </span>
            </div>
            <input value={gq} onChange={(e) => setGq(e.target.value)} placeholder="🔍 Search games in this provider…"
              style={{ padding: '9px 12px', borderRadius: 8, background: 'var(--bg3,#0b1224)', color: 'var(--text,#fff)', border: '1px solid var(--border,#243049)', fontSize: 13, marginBottom: 10 }} />
            <div className="table-wrap" style={{ border: '1px solid var(--border)', borderRadius: 10, overflowY: 'auto', flex: 1 }}>
              <table style={{ minWidth: 640 }}>
                <thead><tr><th>Game</th><th>Category</th><th>Enabled</th><th>Actions</th></tr></thead>
                <tbody>
                  {provGames.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--muted)', padding: 22 }}>
                      {gq ? 'No games match your search.' : 'No games yet — click ➕ Add Game.'}
                    </td></tr>
                  )}
                  {provGames.map((g) => (
                    <tr key={g.id} style={{ opacity: g.enabled ? 1 : 0.55 }}>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          {g.image ? <img src={g.image} alt="" style={{ width: 30, height: 30, borderRadius: 6, objectFit: 'cover' }} /> : <span style={{ fontSize: 18 }}>🎰</span>}
                          <b>{g.name}</b>
                        </span>
                      </td>
                      <td><span className={`catchip ${g.category}`}>{catLabel(g.category)}</span></td>
                      <td>
                        <label className="switch">
                          <input type="checkbox" checked={!!g.enabled} disabled={gameBusy === g.id} onChange={() => toggleOneGame(g)} />
                          <span className="slider"></span>
                        </label>
                      </td>
                      <td>
                        <button className="mini-btn" onClick={() => openEditGame(g)}>✏️ Edit</button>
                        <button className="mini-btn" style={{ marginLeft: 6, color: 'var(--red,#ff4d5e)' }} disabled={gameBusy === g.id} onClick={() => deleteGame(g)}>🗑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
              <button className="mini-btn gold" onClick={submitProvider} disabled={provBusy}>{provBusy ? 'Saving…' : (provModal.editing ? 'Save' : 'Add Provider')}</button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Add / edit game modal ---- */}
      {gameModal && (
        <div className="dep2-ov" onClick={(e) => { if (e.target.classList.contains('dep2-ov')) setGameModal(null); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(4,8,18,.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div className="card" style={{ width: 460, maxWidth: '94vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{gameModal.editing ? '✏️ Edit Game' : '➕ Add Game'}</span>
              <button className="mini-btn" onClick={() => setGameModal(null)}>✕</button>
            </div>
            <div className="fld" style={{ marginBottom: 10 }}>
              <label>Game Name <span style={{ color: 'var(--red,#ff4d5e)' }}>*</span></label>
              <input value={gameModal.name} onChange={(e) => setGm('name', e.target.value)} placeholder="e.g. Sweet Bonanza" />
            </div>
            <div className="fld" style={{ marginBottom: 10 }}>
              <label>Provider</label>
              <input value={gameModal.provider} onChange={(e) => setGm('provider', e.target.value)} placeholder="Provider name" />
            </div>
            <div className="fld" style={{ marginBottom: 10 }}>
              <label>Category</label>
              <select value={gameModal.category} onChange={(e) => setGm('category', e.target.value)}>
                {CATS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </div>
            <div className="fld" style={{ marginBottom: 10 }}>
              <label>Game Icon</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 60, height: 60, borderRadius: 8, border: '1px dashed var(--border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--panel-3,#1b2541)' }}>
                  {gameModal.image ? <img src={gameModal.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 22 }}>🎰</span>}
                </div>
                <label className="mini-btn" style={{ cursor: 'pointer' }}>⬆ Upload<input type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadGameImg} /></label>
                {gameModal.image && <button className="mini-btn" onClick={() => setGm('image', '')}>Remove</button>}
              </div>
            </div>
            <div className="fld" style={{ marginBottom: 10 }}>
              <label>Launch URL <span style={{ color: 'var(--muted)', fontWeight: 600 }}>(optional)</span></label>
              <input value={gameModal.launchUrl} onChange={(e) => setGm('launchUrl', e.target.value)} placeholder="https://… (leave empty for aggregator launch)" />
            </div>
            <label className="pm-check" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <input type="checkbox" checked={gameModal.enabled} onChange={(e) => setGm('enabled', e.target.checked)} /> Enabled (visible to players)
            </label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="mini-btn" onClick={() => setGameModal(null)}>Cancel</button>
              <button className="mini-btn gold" onClick={submitGame} disabled={gmBusy}>{gmBusy ? 'Saving…' : (gameModal.editing ? 'Save Game' : 'Add Game')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
