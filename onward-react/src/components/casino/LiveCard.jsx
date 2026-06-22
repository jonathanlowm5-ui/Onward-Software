import { useUI } from '../../context/UIContext';

// Mirrors renderLiveCard(). Live dealer tile.
export default function LiveCard({ live }) {
  const l = live;
  const { openModal } = useUI();
  const players = typeof l.players === 'number' ? l.players.toLocaleString() : l.players;

  return (
    <div className="live-card" onClick={() => openModal('register')}>
      <div className="live-thumb">
        {l.img
          ? <img src={l.img} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', position: 'absolute', inset: 0 }} alt={l.provider} />
          : <span>🎰</span>}
        <div className="live-tag">● LIVE</div>
      </div>
      <div className="live-body">
        <div className="live-game-name">{l.provider}</div>
        <div className="live-meta">
          <span className="live-players">{players} players</span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="btn btn-primary btn-sm" style={{ flex: 1, padding: '8px 0', fontSize: '12px' }} onClick={(e) => { e.stopPropagation(); openModal('register'); }}>Play</button>
        </div>
      </div>
    </div>
  );
}
