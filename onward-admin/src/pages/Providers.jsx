import { useState } from 'react';
import { useUI } from '../context/UIContext';

// Category counts originally derived from the shared GAMES catalog.
const GAME_CAT_COUNTS = { slots: 13, live: 2, fish: 2, crash: 2 };

const INITIAL_PROVQ = [
  { n: 'Evolution', cat: 'live', rank: 1, api: 1, hot: 1, on: 1, cl: '#1a6fd4', lg: 'EV' },
  { n: 'Spribe', cat: 'crash', rank: 2, api: 1, hot: 1, on: 1, cl: '#7a0d28', lg: 'SP' },
  { n: 'Jili', cat: 'fish', rank: 3, api: 1, hot: 0, on: 1, cl: '#b8860b', lg: 'JL' },
  { n: 'BGaming', cat: 'slots', rank: 4, api: 1, hot: 0, on: 1, cl: '#e0a800', lg: 'B' },
  { n: 'Pragmatic', cat: 'fish', rank: 5, api: 1, hot: 0, on: 1, cl: '#e07b00', lg: 'PP' },
  { n: 'Nolimit City', cat: 'slots', rank: 6, api: 1, hot: 0, on: 1, cl: '#444', lg: 'NC' },
  { n: 'Hacksaw', cat: 'slots', rank: 7, api: 1, hot: 0, on: 1, cl: '#0b6e4f', lg: 'H' },
  { n: 'PG Soft', cat: 'slots', rank: 8, api: 1, hot: 0, on: 1, cl: '#222', lg: 'PG' },
  { n: 'Pragmatic', cat: 'slots', rank: 9, api: 1, hot: 0, on: 1, cl: '#e07b00', lg: 'PP' },
];

const PROV_PILLS = [
  ['all', '🎮 All Games'],
  ['slots', '🎰 Slots'],
  ['live', '🎥 Live Casino'],
  ['fish', '🐟 Fish Games'],
  ['crash', '💥 Crash Games'],
];

function CatChip({ cat }) {
  const label = cat === 'live' ? '🎥 Live Casino' : cat === 'crash' ? '💥 Crash Games' : cat === 'fish' ? '🐟 Fish Games' : '🎰 Slots';
  return <span className={`catchip ${cat}`}>{label}</span>;
}

const clone = (obj) => JSON.parse(JSON.stringify(obj));
const MEDALS = ['🥇', '🥈', '🥉'];

export default function Providers() {
  const { toast } = useUI();
  const [tab, setTab] = useState('all');
  const [provq, setProvq] = useState(() => clone(INITIAL_PROVQ));

  const list = tab === 'all' ? provq : provq.filter((x) => x.cat === tab);
  const cnt = (c) => GAME_CAT_COUNTS[c] || 0;
  const uniqueNames = [...new Set(provq.map((x) => x.n))];

  const update = (provider, mut) => {
    setProvq((prev) => {
      const next = clone(prev);
      const idx = prev.indexOf(provider);
      mut(next[idx]);
      return next;
    });
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="hero-h">🕹️ Game Providers</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>Manage providers, filter by game category and control availability</div>
        </div>
        <span className="pr" style={{ display: 'flex', gap: 8 }}>
          <button className="mini-btn" onClick={() => toast('Providers refreshed 🔄 — all APIs online')}>🔄 Refresh</button>
          <button className="btn-search" onClick={() => toast('Add Provider — demo')}>＋ Add Provider</button>
        </span>
      </div>
      <div className="grid kpi-grid">
        <div className="card kpi b"><div className="lbl">Total Providers</div><div className="val">{uniqueNames.length}</div></div>
        <div className="card kpi g"><div className="lbl">🎰 Slots</div><div className="val">551</div><div className="trend" style={{ color: 'var(--muted)' }}>games</div></div>
        <div className="card kpi"><div className="lbl">🎥 Live Casino</div><div className="val">{cnt('live') + 1}</div><div className="trend" style={{ color: 'var(--muted)' }}>games</div></div>
        <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">🐟 Fish / 💥 Crash</div><div className="val">{cnt('fish') + cnt('crash') + 2}</div><div className="trend" style={{ color: 'var(--muted)' }}>games</div></div>
      </div>
      <div className="pilltabs">
        {PROV_PILLS.map((t) => (
          <button key={t[0]} className={`pill ${tab === t[0] ? 'active' : ''}`} onClick={() => setTab(t[0])}>{t[1]}</button>
        ))}
      </div>
      <div className="toolbar">
        <select style={{ flex: 3 }}>
          <option>All Providers</option>
          {uniqueNames.map((x) => <option key={x}>{x}</option>)}
        </select>
        <select style={{ flex: '0 0 110px' }}><option>All Status</option><option>Active</option><option>Off</option></select>
        <select style={{ flex: '0 0 100px' }}><option>All API</option><option>Online</option><option>Offline</option></select>
        <span className="res-chip" style={{ alignSelf: 'center' }}>{list.length} providers</span>
      </div>
      <div className="card">
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table style={{ minWidth: 1050 }}>
            <thead>
              <tr><th>Logo</th><th>Provider</th><th>Category</th><th>🔥 Hot Rank</th><th>API</th><th>Hot</th><th>Active</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {list.map((pv, i) => (
                <tr key={`${pv.n}-${i}`}>
                  <td><span className="prov-logo" style={{ background: pv.cl }}>{pv.lgImg ? <img src={pv.lgImg} alt="" /> : pv.lg}</span></td>
                  <td><b>{pv.n}</b></td>
                  <td><CatChip cat={pv.cat} /></td>
                  <td>
                    {pv.rank <= 3 ? <span className="medal">{MEDALS[pv.rank - 1]}</span> : null}
                    <input className="seq-in" value={pv.rank} inputMode="numeric"
                      onChange={(e) => { const v = e.target.value; update(pv, (x) => { x.rank = parseInt(v) || 0; }); toast('Hot rank updated: ' + pv.n + ' → ' + v); }} />
                  </td>
                  <td><span className={pv.api ? 'api-on' : 'api-off'}>{pv.api ? 'online' : 'offline'}</span></td>
                  <td>
                    <label className="switch">
                      <input type="checkbox" checked={!!pv.hot} onChange={(e) => { update(pv, (x) => { x.hot = e.target.checked ? 1 : 0; }); toast(pv.n + ' ' + (e.target.checked ? 'marked HOT 🔥' : 'unmarked')); }} />
                      <span className="slider"></span>
                    </label>
                  </td>
                  <td><span className={pv.on ? 'on-chip' : 'off-chip'}>{pv.on ? '✅ On' : 'Off'}</span></td>
                  <td>
                    <button className="mini-btn gold" onClick={() => toast('Configure: ' + pv.n + ' — demo')}>⚙️ Configure</button>{' '}
                    <button className="mini-btn" onClick={() => toast('Sync started: ' + pv.n + ' — playlist updating…')}>Sync</button>
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
