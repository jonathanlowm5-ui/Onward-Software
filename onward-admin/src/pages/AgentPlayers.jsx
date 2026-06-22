import { useMemo, useState } from 'react';
import { BOk } from '../components/ui.jsx';
import { useUI } from '../context/UIContext';

// Ported from V["agent-players"] (AGPL array).
const AGPL = [
  { n: 'Juan dela Cruz', u: 'juandc', ag: 'marco88', j: 'Jan 2024', dep: '₱85,000', wag: '₱420,000', ggr: '₱42,000', com: '₱2,100', on: 1 },
  { n: 'Maria Santos', u: 'marias', ag: 'jenny_l', j: 'Feb 2024', dep: '₱32,000', wag: '₱180,000', ggr: '₱18,000', com: '₱720', on: 1 },
  { n: 'Pedro Reyes', u: 'pedror', ag: 'marco88', j: 'Aug 2023', dep: '₱420,000', wag: '₱2,100,000', ggr: '₱210,000', com: '₱10,500', on: 1 },
  { n: 'Ana Garcia', u: 'anag', ag: 'reysantos', j: 'May 2024', dep: '₱8,500', wag: '₱42,000', ggr: '₱4,200', com: '₱147', on: 1 },
];

const AGENT_OPTS = [...new Set(AGPL.map((x) => x.ag))];

export default function AgentPlayers() {
  const { toast } = useUI();
  const [ag, setAg] = useState('');
  const [q, setQ] = useState('');
  const [st, setSt] = useState('');

  const visible = useMemo(() => {
    const ql = q.toLowerCase();
    return AGPL.filter((x) =>
      (!ag || x.ag === ag)
      && (x.n + ' ' + x.u).toLowerCase().includes(ql)
      && (st === '' || String(x.on) === st)
    );
  }, [ag, q, st]);

  const reset = () => { setAg(''); setQ(''); setSt(''); };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="hero-h">🎮 Agent Players</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>View all players registered under each agent</div>
        </div>
        <span className="pr"><button className="mini-btn" onClick={() => toast('Agent players exported 📋')}>📋 Export</button></span>
      </div>
      <div className="card">
        <div className="form-grid" style={{ gridTemplateColumns: '1fr 4fr 1fr auto', alignItems: 'end' }}>
          <div className="fld"><label>Agent</label>
            <select value={ag} onChange={(e) => setAg(e.target.value)}>
              <option value="">All Agents</option>
              {AGENT_OPTS.map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div className="fld"><label>Search Player</label><input placeholder="Name or username…" value={q} onInput={(e) => setQ(e.target.value)} /></div>
          <div className="fld"><label>Status</label>
            <select value={st} onChange={(e) => setSt(e.target.value)}>
              <option value="">All</option><option value="1">Active</option><option value="0">Inactive</option>
            </select>
          </div>
          <button className="gl-reset" onClick={reset} title="Reset">↺</button>
        </div>
      </div>
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="card-title">👤 Players under Agents</div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table style={{ minWidth: 1020 }}>
            <thead><tr><th>Player</th><th>Agent</th><th>Joined</th><th>Total Deposit</th><th>Total Wager</th><th>GGR</th><th>Agent Commission</th><th>Status</th></tr></thead>
            <tbody>
              {visible.map((x, i) => (
                <tr key={i}>
                  <td><div className="ag-name">{x.n}</div><div className="ag-email">{x.u}</div></td>
                  <td><span className="ag-user">{x.ag}</span></td>
                  <td style={{ color: '#aab4cc' }}>{x.j}</td>
                  <td><span className="ag-earn">{x.dep}</span></td>
                  <td style={{ fontWeight: 800 }}>{x.wag}</td>
                  <td><span className="ag-rate">{x.ggr}</span></td>
                  <td style={{ color: 'var(--gold)', fontWeight: 900 }}>{x.com}</td>
                  <td>{x.on ? <BOk>Active</BOk> : <span className="sms-draft">Inactive</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
