import { useState } from 'react';
import { useUI } from '../context/UIContext';

const INITIAL_MISSIONS = [
  { n: 'First Deposit Hero', t: 'Deposit', ti: '💳', tg: '1,000', rw: '100 FS', du: '30 days', cm: '1,842', on: 1 },
  { n: 'Weekend Warrior', t: 'Wager', ti: '🎲', tg: '50,000', rw: '₱500', du: '3 days', cm: '284', on: 1 },
  { n: 'Daily Login Streak', t: 'Login', ti: '📅', tg: '7', rw: '50 FS', du: '7 days', cm: '5,231', on: 1 },
  { n: 'Refer a Friend', t: 'Referral', ti: '🤝', tg: '1', rw: '₱200', du: 'Ongoing', cm: '128', on: 0 },
  { n: 'Slot Champion', t: 'Game', ti: '🎮', tg: '100', rw: '₱1000', du: '7 days', cm: '44', on: 0 },
];

export default function Mission() {
  const { toast } = useUI();
  const [missions, setMissions] = useState(INITIAL_MISSIONS);
  const [typeF, setTypeF] = useState('');
  const [query, setQuery] = useState('');

  const visible = (m) => (!typeF || m.t === typeF) && m.n.toLowerCase().includes(query.toLowerCase());

  const toggle = (idx) => {
    setMissions((prev) => prev.map((m, i) => (i === idx ? { ...m, on: m.on ? 0 : 1 } : m)));
    const m = missions[idx];
    toast(`${m.n} ${m.on ? 'turned off' : 'activated ✔'}`);
  };
  const del = (idx) => {
    const m = missions[idx];
    setMissions((prev) => prev.filter((_, i) => i !== idx));
    toast(`Mission deleted: ${m.n}`);
  };

  return (
    <>
      <div className="page-head">
        <div><h1 className="hero-h">🎯 Mission</h1><div className="hero-sub" style={{ marginBottom: 0 }}>Create and manage player missions and challenges</div></div>
        <span className="pr"><button className="btn-search" onClick={() => toast('Create Mission — demo')}>＋ Create Mission</button></span>
      </div>
      <div className="grid kpi-grid">
        <div className="card kpi b"><div className="lbl">Total Missions</div><div className="val">{missions.length}</div></div>
        <div className="card kpi g"><div className="lbl">Active</div><div className="val">{missions.filter((m) => m.on).length}</div></div>
        <div className="card kpi"><div className="lbl">Completions Today</div><div className="val">248</div></div>
        <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">Rewards Paid Out</div><div className="val">₱84K</div></div>
      </div>
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="page-head" style={{ marginBottom: 12 }}><div className="card-title" style={{ marginBottom: 0 }}>Mission List</div>
          <span className="pr" style={{ display: 'flex', gap: 8 }}>
            <select className="qsearch" style={{ width: 'auto' }} value={typeF} onChange={(e) => setTypeF(e.target.value)}><option value="">All Types</option><option>Deposit</option><option>Wager</option><option>Login</option><option>Referral</option><option>Game</option></select>
            <input className="qsearch" placeholder="Search mission…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </span>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table style={{ minWidth: 980 }}>
          <thead><tr><th>Mission</th><th>Type</th><th>Target</th><th>Reward</th><th>Duration</th><th>Completions</th><th>Active</th><th>Actions</th></tr></thead>
          <tbody>{missions.map((m, i) => (
            <tr key={i} style={{ display: visible(m) ? '' : 'none' }}>
              <td><b>{m.n}</b></td><td>{m.ti} {m.t}</td><td>{m.tg}</td>
              <td style={{ color: 'var(--gold)', fontWeight: 900 }}>{m.rw}</td><td>{m.du}</td>
              <td style={{ color: 'var(--blue)', fontWeight: 800 }}>{m.cm}</td>
              <td><span className={m.on ? 'on-chip' : 'off-chip'} style={{ cursor: 'pointer' }} onClick={() => toggle(i)}>{m.on ? '✅ On' : '⬜ Off'}</span></td>
              <td><button className="mini-btn gold" onClick={() => toast(`Edit mission: ${m.n} — demo`)}>✏️</button> <button className="del-btn" onClick={() => del(i)}>🗑</button></td>
            </tr>
          ))}</tbody>
        </table></div>
      </div>
    </>
  );
}
