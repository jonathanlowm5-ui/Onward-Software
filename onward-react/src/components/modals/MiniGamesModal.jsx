import Modal from './Modal.jsx';
import { useUI } from '../../context/UIContext';
import useGames from '../../hooks/useGames';
import GameCard from '../casino/GameCard.jsx';

/*
 * Mini Games modal (#fortune). The sidebar "Mini Games" entry opens this; it
 * shows a grid of instant / mini games from the live catalogue (falling back to
 * the full list) so the games actually render. Reuses GameCard + Modal styling.
 */
export default function MiniGamesModal() {
  const { activeModal, closeModal } = useUI();
  const { games, loading } = useGames();
  const open = activeModal === 'fortune';
  if (!open) return null;

  const mini = games.filter((g) => ['crash', 'instant', 'arcade', 'mini'].includes(g.cat));
  const list = (mini.length ? mini : games).slice(0, 24);

  return (
    <Modal id="fortune-modal" open={open} onClose={closeModal} maxWidth="900px">
      <div className="modal-header">
        <span className="modal-title">🎡 Mini Games</span>
        <button className="modal-close" onClick={closeModal}>✕</button>
      </div>
      <div className="modal-body">
        {loading && !games.length ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading games…</div>
        ) : list.length ? (
          <div className="game-grid">
            {list.map((g, i) => <GameCard key={g.id ?? i} game={g} />)}
          </div>
        ) : (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No mini games available right now.</div>
        )}
      </div>
    </Modal>
  );
}
