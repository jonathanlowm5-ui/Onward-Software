import { useState, useEffect } from 'react';
import CatLayout from '../components/common/CatLayout.jsx';
import { fetchLeaderboard } from '../services/contentService';

const RANK_CLASS = { 1: 'gold', 2: 'silver', 3: 'bronze' };
const RANK_ICON = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function Leaderboard() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let alive = true;
    fetchLeaderboard().then((data) => { if (alive) setRows(data); });
    return () => { alive = false; };
  }, []);

  return (
    <div id="view-leaderboard">
      <CatLayout
        eyebrow="Leaderboard"
        title="Leaderboard"
        blurb="Climb the weekly rankings to win a share of the prize pool."
        listEyebrow="This week"
        listTitle="Top players"
      >
        {rows.length ? (
          <div className="lb-list">
            {rows.map((r) => (
              <div key={r.id || r.rank} className={`lb-row${r.rank <= 3 ? ' top' : ''}`}>
                <div className={`lb-rank ${RANK_CLASS[r.rank] || ''}`}>{RANK_ICON[r.rank] || r.rank}</div>
                <div className="lb-name">{r.name}</div>
                <div className="lb-points">{Number(r.points).toLocaleString()}<span>pts</span></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="cat-empty">No rankings yet this week.</div>
        )}
      </CatLayout>
    </div>
  );
}
