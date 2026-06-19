import { useState } from 'react';
import { useUI } from '../context/UIContext';

const SPORTS_TABS = [
  ['football', '⚽ Football'],
  ['basketball', '🏀 Basketball'],
  ['tennis', '🎾 Tennis'],
  ['baseball', '⚾ Baseball'],
  ['volleyball', '🏐 Volleyball'],
  ['boxing', '🥊 Boxing'],
  ['esports', '🎮 Esports'],
];

const INITIAL_LEAGUES = {
  football: [
    { n: 'UEFA Champions League', st: 'active', live: 1, pre: 1, mkts: 48, max: 50000 },
    { n: 'English Premier League', st: 'active', live: 1, pre: 1, mkts: 62, max: 50000 },
    { n: 'La Liga', st: 'active', live: 1, pre: 1, mkts: 44, max: 40000 },
    { n: 'Serie A', st: 'active', live: 0, pre: 1, mkts: 38, max: 30000 },
    { n: 'Bundesliga', st: 'active', live: 1, pre: 1, mkts: 41, max: 35000 },
    { n: 'Philippine Football League', st: 'suspended', live: 0, pre: 0, mkts: 0, max: 20000 },
    { n: 'World Cup Qualifiers', st: 'active', live: 1, pre: 1, mkts: 55, max: 100000 },
    { n: 'AFC Cup', st: 'disabled', live: 0, pre: 0, mkts: 0, max: 10000 },
  ],
  basketball: [
    { n: 'NBA', st: 'active', live: 1, pre: 1, mkts: 120, max: 100000 },
    { n: 'PBA', st: 'active', live: 1, pre: 1, mkts: 34, max: 30000 },
    { n: 'EuroLeague', st: 'active', live: 0, pre: 1, mkts: 28, max: 25000 },
  ],
  tennis: [
    { n: 'ATP Tour', st: 'active', live: 1, pre: 1, mkts: 90, max: 40000 },
    { n: 'WTA Tour', st: 'active', live: 1, pre: 1, mkts: 73, max: 40000 },
  ],
  baseball: [
    { n: 'MLB', st: 'active', live: 1, pre: 1, mkts: 80, max: 50000 },
    { n: 'NPB Japan', st: 'active', live: 0, pre: 1, mkts: 22, max: 20000 },
  ],
  volleyball: [
    { n: 'FIVB World', st: 'active', live: 0, pre: 1, mkts: 14, max: 15000 },
  ],
  boxing: [
    { n: 'World Title Fights', st: 'active', live: 1, pre: 1, mkts: 9, max: 80000 },
  ],
  esports: [
    { n: 'Dota 2 Majors', st: 'active', live: 1, pre: 1, mkts: 31, max: 25000 },
    { n: 'CS2 Premier', st: 'suspended', live: 0, pre: 0, mkts: 0, max: 25000 },
  ],
};

const clone = (obj) => JSON.parse(JSON.stringify(obj));

export default function Sports() {
  const { toast } = useUI();
  const [tab, setTab] = useState('football');
  const [leagues, setLeagues] = useState(() => clone(INITIAL_LEAGUES));
  const [search, setSearch] = useState('');

  const list = leagues[tab];
  const all = Object.values(leagues).flat();
  const tabLabel = SPORTS_TABS.find((t) => t[0] === tab)[1];

  const update = (i, mut) => {
    setLeagues((prev) => {
      const next = clone(prev);
      mut(next[tab][i]);
      return next;
    });
  };

  const spToggle = (i) => {
    setLeagues((prev) => {
      const next = clone(prev);
      const l = next[tab][i];
      l.st = l.st === 'active' ? 'suspended' : 'active';
      if (l.st === 'suspended') { l.live = 0; l.pre = 0; l.mkts = 0; }
      toast(l.n + ' ' + (l.st === 'active' ? 'resumed ▶' : 'suspended ⏸'));
      return next;
    });
  };

  const spDisable = (i) => {
    setLeagues((prev) => {
      const next = clone(prev);
      const l = next[tab][i];
      l.st = 'disabled'; l.live = 0; l.pre = 0; l.mkts = 0;
      toast(l.n + ' disabled 🚫');
      return next;
    });
  };

  const q = search.toLowerCase();

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="hero-h">⚽ Sports Control</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>Manage sports betting — leagues, markets, odds and live event toggles</div>
        </div>
        <span className="pr" style={{ display: 'flex', gap: 8 }}>
          <button className="mini-btn" onClick={() => toast('Sports feeds refreshed 🔄')}>🔄 Refresh</button>
          <button className="btn-search" onClick={() => toast('Add League — demo')}>＋ Add League</button>
        </span>
      </div>
      <div className="grid kpi-grid">
        <div className="card kpi g"><div className="lbl">Active Sports</div><div className="val">7</div><div className="trend" style={{ color: 'var(--muted)' }}>enabled for betting</div></div>
        <div className="card kpi b"><div className="lbl">Live Events</div><div className="val">18</div><div className="trend" style={{ color: 'var(--muted)' }}>currently in-play</div></div>
        <div className="card kpi"><div className="lbl">Open Markets</div><div className="val">{all.reduce((a, l) => a + l.mkts, 0)}</div><div className="trend" style={{ color: 'var(--muted)' }}>accepting bets</div></div>
        <div className="card kpi r"><div className="lbl">Suspended</div><div className="val">{all.filter((l) => l.st === 'suspended').length}</div><div className="trend" style={{ color: 'var(--muted)' }}>markets paused</div></div>
      </div>
      <div className="pilltabs">
        {SPORTS_TABS.map((t) => (
          <button key={t[0]} className={`pill ${tab === t[0] ? 'active' : ''}`} onClick={() => setTab(t[0])}>{t[1]}</button>
        ))}
      </div>
      <div className="card">
        <div className="page-head" style={{ marginBottom: 12 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>{tabLabel} — Leagues</div>
          <span className="pr" style={{ display: 'flex', gap: 8 }}>
            <input className="qsearch" placeholder="Search league…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="qsearch" style={{ width: 'auto' }}>
              <option>All Status</option><option>Active</option><option>Suspended</option><option>Disabled</option>
            </select>
          </span>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table id="spTbl" style={{ minWidth: 920 }}>
            <thead>
              <tr><th>League / Event</th><th>Status</th><th>Live Betting</th><th>Pre-Match</th><th>Open Markets</th><th>Max Bet (₱)</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {list.map((l, i) => (
                <tr key={l.n} style={{ display: !q || l.n.toLowerCase().includes(q) ? '' : 'none' }}>
                  <td><b>{l.n}</b></td>
                  <td><span className={`stchip st-${l.st === 'active' ? 'active' : l.st === 'suspended' ? 'susp' : 'dis'}`}>{l.st}</span></td>
                  <td>
                    <label className="switch">
                      <input type="checkbox" checked={!!l.live} onChange={(e) => { update(i, (x) => { x.live = e.target.checked ? 1 : 0; }); toast('Live betting ' + (e.target.checked ? 'on' : 'off') + ': ' + l.n); }} />
                      <span className="slider"></span>
                    </label>
                  </td>
                  <td>
                    <label className="switch">
                      <input type="checkbox" checked={!!l.pre} onChange={(e) => { update(i, (x) => { x.pre = e.target.checked ? 1 : 0; }); toast('Pre-match ' + (e.target.checked ? 'on' : 'off') + ': ' + l.n); }} />
                      <span className="slider"></span>
                    </label>
                  </td>
                  <td><span className="mkt-n">{l.mkts}</span></td>
                  <td>
                    <input className="seq-in" style={{ width: 84 }} value={l.max} inputMode="numeric"
                      onChange={(e) => { const v = e.target.value; update(i, (x) => { x.max = parseInt(v) || 0; }); toast('Max bet updated: ' + l.n + ' → ₱' + v); }} />
                  </td>
                  <td>
                    <button className="icon-act" title={l.st === 'active' ? 'Suspend' : 'Resume'} onClick={() => spToggle(i)}>{l.st === 'active' ? '⏸' : '▶'}</button>{' '}
                    <button className="icon-act red" title="Disable" onClick={() => spDisable(i)}>🚫</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="card-title">🌐 Global Sports Settings</div>
        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          <div className="fld"><label>Default Max Bet (₱)</label><input defaultValue="50000" /></div>
          <div className="fld"><label>Default Min Bet (₱)</label><input defaultValue="10" /></div>
          <div className="fld"><label>Max Payout (₱)</label><input defaultValue="500000" /></div>
        </div>
        <div className="gset-row">
          <span className="tg"><label className="switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label>Live Betting Enabled</span>
          <span className="tg"><label className="switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label>Parlay / Accumulator Bets</span>
          <span className="tg"><label className="switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label>Cash Out Feature</span>
          <span className="tg"><label className="switch"><input type="checkbox" /><span className="slider"></span></label>Maintenance Mode</span>
        </div>
        <div style={{ marginTop: 14, textAlign: 'right' }}><button className="btn-search" onClick={() => toast('Sports settings saved! ✔')}>💾 Save Settings</button></div>
      </div>
    </>
  );
}
