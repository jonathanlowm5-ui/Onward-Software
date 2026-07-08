import { useEffect, useMemo, useState } from 'react';
import { useUI } from '../context/UIContext';
import { listGames, toggleGame } from '../services/gameService';
import { getConfig, saveConfig } from '../services/configService';

// Real providers — derived from the live games catalog, enable/disable persists to
// providersConfig AND bulk-toggles that provider's games (hides them on the frontend).
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
    return Object.values(map)
      .map((p) => ({ ...p, on: cfg[p.name]?.enabled !== false }))
      .sort((a, b) => b.total - a.total);
  }, [games, cfg]);

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

  const kpi = useMemo(() => ({
    total: providers.length,
    on: providers.filter((p) => p.on).length,
    games: games.length,
    enabledGames: games.filter((g) => g.enabled).length,
  }), [providers, games]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="hero-h">🕹️ Game Providers</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>Live providers from the games catalog — toggling a provider bulk-enables/disables its games on the frontend</div>
        </div>
        <span className="pr">
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
            <thead><tr><th>Provider</th><th>Categories</th><th>Games</th><th>Enabled Games</th><th>Status</th><th>Enabled</th></tr></thead>
            <tbody>
              {providers.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 26 }}>
                  {loaded ? 'No games in the catalog yet — add games under Games, or import via Games API.' : 'Loading…'}
                </td></tr>
              )}
              {providers.map((p) => (
                <tr key={p.name} style={{ opacity: p.on ? 1 : 0.55 }}>
                  <td><span className="prov-logo" style={{ background: '#243049' }}>{p.name.slice(0, 2).toUpperCase()}</span> <b style={{ marginLeft: 8 }}>{p.name}</b></td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{[...p.cats].join(' · ') || '—'}</td>
                  <td style={{ fontWeight: 800 }}>{p.total}</td>
                  <td><span className={p.enabled ? 'on-chip' : 'off-chip'}>{p.enabled} / {p.total}</span></td>
                  <td>{p.on ? <span className="api-on">enabled</span> : <span className="api-off">disabled</span>}</td>
                  <td>
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
    </>
  );
}
