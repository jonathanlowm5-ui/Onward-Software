import { useState, useEffect, useMemo } from 'react';
import { useUI } from '../context/UIContext';
import { listGames, toggleGame, updateGame, createGame } from '../services/gameService';
import { uploadImage } from '../services/uploadService';
import api from '../services/api';

const EMPTY_GAME = { name: '', provider: '', category: 'slots', image: '', launchUrl: '', enabled: true };

// ---- Static demo catalog (original GAMES) — used as fallback on API error/empty ----
const PG_NAMES = ['Alchemy Gold', "Alibaba's Cave Of Fortune", 'Anubis Wrath', 'Asgardian Rising', 'Bakery Bonanza', 'Bali Vacation', 'Battleground Royale', 'Bikini Paradise', 'Buffalo Win', 'Butterfly Blossom', 'Caishen Wins', 'Candy Bonanza'];
const PG_COLORS = ['#8e2de2', '#ff4d5e', '#b8860b', '#2ecc71', '#ff8c42', '#d63384', '#3aa0ff', '#e07b00', '#7a0d28', '#0b6e4f', '#5e2a9e', '#1a6fd4'];

const DEMO_GAMES = [
  ...PG_NAMES.map((n, i) => ({ n, prov: 'PG Soft', cat: 'slots', langs: '', id: 38001 + i, hot: 0, seq: 100 + i, on: 1, pop: 0, popD: 0, popM: 0, seqD: 0, seqM: 0, cl: PG_COLORS[i] })),
  { popD: 1, seqD: 0, popM: 1, seqM: 0, n: 'Sweet Bonanza', prov: 'Pragmatic', cat: 'slots', langs: 'EN, CN, VN, PH', id: 21001, hot: 1, seq: 1, on: 1, pop: 1, cl: '#d63384' },
  { popD: 1, seqD: 0, popM: 1, seqM: 0, n: 'Gates of Olympus', prov: 'Pragmatic', cat: 'slots', langs: 'EN, CN', id: 21002, hot: 1, seq: 2, on: 1, pop: 1, cl: '#b8860b' },
  { popD: 0, seqD: 0, popM: 0, seqM: 0, n: 'Starlight Princess', prov: 'Pragmatic', cat: 'slots', langs: 'EN', id: 21003, hot: 0, seq: 3, on: 1, pop: 0, cl: '#8e2de2' },
  { popD: 1, seqD: 0, popM: 1, seqM: 0, n: 'Aviator', prov: 'Spribe', cat: 'crash', langs: 'EN, CN, VN', id: 30001, hot: 1, seq: 1, on: 1, pop: 1, cl: '#7a0d28' },
  { popD: 1, seqD: 0, popM: 1, seqM: 0, n: 'Crazy Time', prov: 'Evolution', cat: 'live', langs: 'EN, PH', id: 40001, hot: 1, seq: 1, on: 1, pop: 1, cl: '#ff4d5e' },
  { popD: 0, seqD: 0, popM: 0, seqM: 0, n: 'Baccarat A12', prov: 'Evolution', cat: 'live', langs: 'EN', id: 40002, hot: 0, seq: 2, on: 1, pop: 0, cl: '#0b2c5e' },
  { popD: 0, seqD: 0, popM: 0, seqM: 0, n: 'Royal Fishing', prov: 'Jili', cat: 'fish', langs: 'EN, CN', id: 50001, hot: 0, seq: 1, on: 1, pop: 0, cl: '#063f2e' },
];

// Normalize an API game record to the demo row shape used by the table.
function normalize(g, i) {
  return {
    n: g.n ?? g.name ?? g.title ?? 'Game',
    prov: g.prov ?? g.provider ?? g.providerName ?? '',
    cat: g.cat ?? g.category ?? 'slots',
    langs: g.langs ?? g.languages ?? '',
    id: g.id ?? g.gameId ?? g._id ?? i,
    hot: g.hot ? 1 : 0,
    seq: g.seq ?? g.sequence ?? 0,
    on: (g.on ?? g.enabled ?? g.active ?? 1) ? 1 : 0,
    pop: (g.pop || g.popular) ? 1 : 0,
    popD: g.popD ? 1 : 0,
    popM: g.popM ? 1 : 0,
  };
}

export default function GameList() {
  const { toast } = useUI();
  const [games, setGames] = useState(DEMO_GAMES);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ q: '', prov: '', cat: '', st: '' });
  const [syncing, setSyncing] = useState(false);
  // Add Game modal
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_GAME);
  const [addBusy, setAddBusy] = useState(false);
  const setAdd = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const uploadGameImg = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast('⚠ Image too large — keep it under 2 MB'); return; }
    try { const { url } = await uploadImage(file); setAdd('image', url); toast('Icon uploaded ✔'); }
    catch (err) { toast('⚠ ' + (err.message || 'Upload failed')); }
  };
  const submitAdd = async () => {
    if (!form.name.trim()) { toast('⚠ Game name is required'); return; }
    if (!form.provider.trim()) { toast('⚠ Provider is required'); return; }
    setAddBusy(true);
    try {
      const created = await createGame({ ...form, name: form.name.trim(), provider: form.provider.trim() });
      setGames((prev) => [normalize(created), ...prev]);
      toast(`✅ ${created.name} added`);
      setShowAdd(false); setForm(EMPTY_GAME);
    } catch (e) { toast('⚠ ' + (e.message || 'Failed to add game')); }
    finally { setAddBusy(false); }
  };

  // Star toggle: features/removes a game in the player site's Popular sections.
  const togglePopular = async (g) => {
    try {
      const r = await api.patch(`/games/${g.id}/popular`);
      setGames((prev) => prev.map((x) => (x.id === g.id ? { ...x, pop: r.data.popular ? 1 : 0 } : x)));
      toast(r.data.popular ? `⭐ ${g.n} featured in Popular Games` : `☆ ${g.n} removed from Popular Games`);
    } catch (e) { toast('⚠ ' + (e.message || 'Update failed')); }
  };

  // One-click import of the bundled heibao catalogue (4,995 games with hosted
  // webp icons, all ≤29KB). Idempotent — only missing games are added.
  const syncHeibao = async () => {
    setSyncing(true);
    try {
      let total = 0;
      let round = 0;
      // Repeat until the whole catalogue is present (each call is idempotent).
      for (;;) {
        const r = await api.post('/games/heibao-sync', { limit: 1200 });
        total += r.data.imported;
        round += 1;
        toast(`Importing… ${r.data.total - r.data.remaining}/${r.data.total} games`);
        if (!r.data.remaining || round > 10) break;
      }
      toast(total ? `Imported ${total} games ✅ — reloading…` : 'Catalogue already complete ✔');
      if (total) setTimeout(() => window.location.reload(), 1200);
    } catch (e) { toast('⚠ ' + (e.message || 'Import failed')); }
    finally { setSyncing(false); }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await listGames();
        const arr = Array.isArray(data) ? data : data?.games || data?.data || [];
        if (active) {
          if (arr.length) setGames(arr.map(normalize));
          else setGames(DEMO_GAMES);
        }
      } catch {
        if (active) setGames(DEMO_GAMES);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const provNames = useMemo(() => [...new Set(games.map((g) => g.prov))], [games]);

  const list = useMemo(
    () => games.filter((g) =>
      (!filters.q || g.n.toLowerCase().includes(filters.q)) &&
      (!filters.prov || g.prov === filters.prov) &&
      (!filters.cat || g.cat === filters.cat) &&
      (filters.st === '' || String(g.on) === filters.st)),
    [games, filters]
  );

  const setField = (k, v) => setFilters((f) => ({ ...f, [k]: v }));
  const resetFilters = () => setFilters({ q: '', prov: '', cat: '', st: '' });

  // Enable/disable toggle — wired to toggleGame (this removes the game from the frontend).
  const onToggleActive = async (game) => {
    const next = game.on ? 0 : 1;
    setGames((prev) => prev.map((g) => (g === game ? { ...g, on: next } : g)));
    try {
      await toggleGame(game.id);
      toast(game.n + (next ? ' enabled ✅' : ' disabled — removed from frontend'));
    } catch {
      setGames((prev) => prev.map((g) => (g.id === game.id ? { ...g, on: game.on } : g)));
      toast('⚠ Failed to update ' + game.n);
    }
  };

  const onToggleHot = (game, checked) => {
    setGames((prev) => prev.map((g) => (g === game ? { ...g, hot: checked ? 1 : 0 } : g)));
    toast(game.n + (checked ? ' marked HOT 🔥' : ' unmarked'));
    updateGame(game.id, { hot: checked ? 1 : 0 }).catch(() => {});
  };

  const onSeqChange = (game, value) => {
    const seq = parseInt(value) || 0;
    setGames((prev) => prev.map((g) => (g === game ? { ...g, seq } : g)));
    toast('Sequence updated: ' + game.n + ' → ' + value);
    updateGame(game.id, { seq }).catch(() => {});
  };

  const exportGames = () => {
    const head = ['Game', 'Provider', 'Category', 'Languages', 'Game ID', 'Hot', 'Sequence', 'Active', 'Popular'];
    const rows = games.map((g) => [g.n, g.prov, g.cat, g.langs || 'not set', g.id, g.hot ? 'Yes' : 'No', g.seq, g.on ? 'On' : 'Off', g.pop ? 'Yes' : 'No']);
    const csv = [head, ...rows].map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'onward-games.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Catalog exported ⬇ onward-games.csv');
  };

  return (
    <>
      <div className="gl-filter">
        <div className="fld">
          <label>Search Game</label>
          <input value={filters.q} placeholder="🔍 Game name…" onInput={(e) => setField('q', e.target.value.toLowerCase())} />
        </div>
        <div className="fld">
          <label>Provider</label>
          <select value={filters.prov} onChange={(e) => setField('prov', e.target.value)}>
            <option value="">All Providers</option>
            {provNames.map((x) => <option key={x}>{x}</option>)}
          </select>
        </div>
        <div className="fld">
          <label>Category</label>
          <select value={filters.cat} onChange={(e) => setField('cat', e.target.value)}>
            <option value="">All Categories</option>
            <option value="slots">Slots</option>
            <option value="live">Live Casino</option>
            <option value="crash">Crash</option>
            <option value="fish">Fish</option>
          </select>
        </div>
        <div className="fld">
          <label>Status</label>
          <select value={filters.st} onChange={(e) => setField('st', e.target.value)}>
            <option value="">All</option>
            <option value="1">Active</option>
            <option value="0">Disabled</option>
          </select>
        </div>
        <button className="gl-reset" onClick={resetFilters} title="Reset">↺</button>
      </div>
      <div className="card">
        <div className="page-head" style={{ marginBottom: 12 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>
            🎰 Game List <span className="res-chip" id="glCount">{list.length} games</span>
          </div>
          <span className="pr" style={{ display: 'flex', gap: 8 }}>
            <button className="mini-btn gold" onClick={() => { setForm(EMPTY_GAME); setShowAdd(true); }}>➕ Add Game</button>
            <button className="mini-btn" onClick={syncHeibao} disabled={syncing}>{syncing ? 'Importing…' : '📥 Import Game Catalogue'}</button>
            <button className="mini-btn" onClick={exportGames}>⬇ Export</button>
          </span>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table id="glTbl" style={{ minWidth: 1080 }}>
            <thead>
              <tr><th>Game</th><th>Provider</th><th>Category</th><th>Language Support</th><th>Game ID</th><th>Hot Game</th><th>Sequence</th><th>Active</th><th>Popular</th></tr>
            </thead>
            <tbody>
              {list.map((g) => (
                <tr key={g.id}>
                  <td><b>{g.n}</b></td>
                  <td style={{ color: '#aab4cc' }}>{g.prov}</td>
                  <td><span className={`catchip ${g.cat}`}>{g.cat === 'live' ? 'live casino' : g.cat}</span></td>
                  <td>{g.langs ? g.langs : <span className="notset">— not set —</span>}</td>
                  <td><span className="gid">{g.id}</span></td>
                  <td>
                    <label className="switch">
                      <input type="checkbox" checked={!!g.hot} onChange={(e) => onToggleHot(g, e.target.checked)} />
                      <span className="slider"></span>
                    </label>
                  </td>
                  <td>
                    <input className="seq-in" value={g.seq} inputMode="numeric" onChange={(e) => onSeqChange(g, e.target.value)} />
                  </td>
                  <td>
                    <span className={g.on ? 'on-chip' : 'off-chip'} style={{ cursor: 'pointer' }} onClick={() => onToggleActive(g)}>
                      {g.on ? '✅ On' : 'Off'}
                    </span>
                  </td>
                  <td>
                    <button className={`star-btn ${(g.pop || g.popD || g.popM) ? 'on' : ''}`} onClick={() => togglePopular(g)} title="Feature in Popular Games">
                      {(g.pop || g.popD || g.popM) ? '⭐' : '☆'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <div className="dep2-ov" onClick={(e) => { if (e.target.classList.contains('dep2-ov')) setShowAdd(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(4,8,18,.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 460, maxWidth: '94vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>➕ Add Game</span>
              <button className="mini-btn" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <div className="fld" style={{ marginBottom: 10 }}>
              <label>Game Name <span style={{ color: 'var(--red,#ff4d5e)' }}>*</span></label>
              <input value={form.name} onChange={(e) => setAdd('name', e.target.value)} placeholder="e.g. Sweet Bonanza" />
            </div>
            <div className="fld" style={{ marginBottom: 10 }}>
              <label>Provider <span style={{ color: 'var(--red,#ff4d5e)' }}>*</span></label>
              <input list="gl-provs" value={form.provider} onChange={(e) => setAdd('provider', e.target.value)} placeholder="e.g. Pragmatic — type a new one to create it" />
              <datalist id="gl-provs">{provNames.map((p) => <option key={p} value={p} />)}</datalist>
            </div>
            <div className="fld" style={{ marginBottom: 10 }}>
              <label>Category</label>
              <select value={form.category} onChange={(e) => setAdd('category', e.target.value)}>
                <option value="slots">Slots</option>
                <option value="live">Live Casino</option>
                <option value="crash">Crash</option>
                <option value="fishing">Fish</option>
                <option value="table">Table</option>
                <option value="sports">Sports</option>
              </select>
            </div>
            <div className="fld" style={{ marginBottom: 10 }}>
              <label>Game Icon</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 60, height: 60, borderRadius: 8, border: '1px dashed var(--border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--panel-3,#1b2541)' }}>
                  {form.image ? <img src={form.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 22 }}>🎰</span>}
                </div>
                <label className="mini-btn" style={{ cursor: 'pointer' }}>⬆ Upload<input type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadGameImg} /></label>
                {form.image && <button className="mini-btn" onClick={() => setAdd('image', '')}>Remove</button>}
              </div>
            </div>
            <div className="fld" style={{ marginBottom: 10 }}>
              <label>Launch URL <span style={{ color: 'var(--muted)', fontWeight: 600 }}>(optional)</span></label>
              <input value={form.launchUrl} onChange={(e) => setAdd('launchUrl', e.target.value)} placeholder="https://… (leave empty for aggregator launch)" />
            </div>
            <label className="pm-check" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <input type="checkbox" checked={form.enabled} onChange={(e) => setAdd('enabled', e.target.checked)} /> Enabled (visible to players)
            </label>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="mini-btn" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="mini-btn gold" onClick={submitAdd} disabled={addBusy}>{addBusy ? 'Adding…' : 'Add Game'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
