import { useState } from 'react';
import { useUI } from '../context/UIContext';

const INITIAL_TOURS = [
  { n: '🎰 May Slots Championship', st: 'active', d: 'Compete for ₱200,000 in prizes across all slot games this May!', pp: '₱200,000', pt: '1,842', from: '2026-05-01 00:00', to: '2026-05-31 23:59', feat: 1 },
  { n: '🎴 Live Casino Weekend Showdown', st: 'active', d: '3-day live casino tournament — biggest single win takes the crown.', pp: '₱80,000', pt: '420', from: '2026-05-24 00:00', to: '2026-05-26 23:59', feat: 0 },
  { n: '✈️ June Crash Leaderboard', st: 'upcoming', d: 'Fly highest in Aviator and Crash games throughout June.', pp: '₱150,000', pt: '0', from: '2026-06-01 00:00', to: '2026-06-30 23:59', feat: 1 },
  { n: '🎰 April Slots Madness', st: 'completed', d: 'April tournament — concluded.', pp: '₱100,000', pt: '2,100', from: '2026-04-01 00:00', to: '2026-04-30 23:59', feat: 0 },
  { n: '💎 High Roller VIP Tournament', st: 'draft', d: 'Exclusive VIP-only high roller tournament draft.', pp: '₱500,000', pt: '0', from: 'TBD', to: 'TBD', feat: 0 },
];

function TourChip({ st }) {
  if (st === 'active') return <span className="stchip st-active">active</span>;
  if (st === 'upcoming') return <span className="stchip st-up">upcoming</span>;
  if (st === 'completed') return <span className="stchip st-comp">completed</span>;
  return <span className="stchip st-draft">draft</span>;
}

export default function Tournament() {
  const { toast } = useUI();
  const [tours, setTours] = useState(INITIAL_TOURS);
  const [filter, setFilter] = useState('all');

  const list = filter === 'all' ? tours : tours.filter((t) => t.st === filter);

  const delTour = (idx) => {
    setTours((prev) => prev.filter((_, i) => i !== idx));
    toast('Tournament deleted');
  };

  const filters = [['all', 'All'], ['active', '🟢 Active'], ['upcoming', '📅 Upcoming'], ['completed', '✅ Completed'], ['draft', '📝 Draft']];

  return (
    <>
      <div className="page-head">
        <div><h1 className="hero-h">🏆 Tournament</h1><div className="hero-sub" style={{ marginBottom: 0 }}>Create and manage competitive tournaments with leaderboards, prizes and player rankings</div></div>
        <span className="pr"><button className="btn-search" onClick={() => toast('New Tournament — demo')}>＋ New Tournament</button></span>
      </div>
      <div className="grid kpi-grid">
        <div className="card kpi"><div className="lbl">Active Tournaments</div><div className="val">{tours.filter((t) => t.st === 'active').length}</div><div className="trend" style={{ color: 'var(--muted)' }}>running now</div></div>
        <div className="card kpi g"><div className="lbl">Total Participants</div><div className="val">2,262</div><div className="trend" style={{ color: 'var(--muted)' }}>across all active</div></div>
        <div className="card kpi b"><div className="lbl">Prize Pool (Active)</div><div className="val">₱280K</div><div className="trend" style={{ color: 'var(--muted)' }}>to be distributed</div></div>
        <div className="card kpi" style={{ borderTopColor: '#9b6dff' }}><div className="lbl">Completed</div><div className="val">{tours.filter((t) => t.st === 'completed').length}</div><div className="trend" style={{ color: 'var(--muted)' }}>all time</div></div>
      </div>
      <div className="pilltabs">{filters.map((t) => (
        <button key={t[0]} className={`pill ${filter === t[0] ? 'active' : ''}`} onClick={() => setFilter(t[0])}>{t[1]}</button>
      ))}</div>
      <div className="tour-grid">
        {list.length === 0
          ? <div className="card"><div className="hist-empty">No tournaments in this filter.</div></div>
          : list.map((t) => {
            const ti = tours.indexOf(t);
            return (
              <div key={ti} className={`tour-card ${t.feat ? 'featured' : ''}`}>
                {t.feat ? <div className="feat-band">⭐ FEATURED</div> : null}
                <div className="tour-body">
                  <div className="tour-title">{t.n} <TourChip st={t.st} /></div>
                  <div className="tour-desc">{t.d}</div>
                  <div className="tour-stats">
                    <div className="lot-box"><div className="l">Prize Pool</div><div className="v gold">{t.pp}</div></div>
                    <div className="lot-box"><div className="l">Participants</div><div className="v" style={{ color: 'var(--blue)' }}>{t.pt}</div></div>
                  </div>
                  <div className="tour-dates">📅 {t.from} → {t.to}</div>
                  <div className="tour-acts">
                    <button className="mini-btn" onClick={() => toast(`Leaderboard: ${t.n.replace(/'/g, '')} — top: juan_dc88 ₱182K T/O 🥇`)}>📊 Leaderboard</button>
                    <button className="mini-btn gold" style={{ flex: '0 0 auto' }} onClick={() => toast('Edit tournament — demo')}>✏️ Edit</button>
                    <button className="del-btn" style={{ flex: '0 0 auto' }} onClick={() => delTour(ti)}>🗑</button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </>
  );
}
