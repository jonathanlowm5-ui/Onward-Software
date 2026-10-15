import Modal from './Modal.jsx';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';

// Game launch modal (#game-modal). For guests it prompts registration; for
// logged-in players the launch URL is resolved via gamesService.launchGame.
export default function GameModal() {
  const { activeModal, modalData, closeModal, openModal } = useUI();
  const { isLoggedIn } = useAuth();
  const game = modalData || {};

  return (
    <Modal id="game-modal" open={activeModal === 'game'} onClose={closeModal} maxWidth="800px">
      <div className="modal-header">
        <span className="modal-title" id="game-modal-title" data-i18n="misc_game">{game.name || 'Game'}</span>
        <button className="modal-close" onClick={closeModal}>✕</button>
      </div>
      <div style={{ background: '#000', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
        <div style={{ fontSize: '80px' }} id="game-modal-icon">{game.icon || '🎰'}</div>
        <div style={{ fontSize: '20px', fontFamily: "'Montserrat',sans-serif", color: 'var(--gold)' }} id="game-modal-name">{game.name}</div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Game iframe would load here in production</p>
        {!isLoggedIn && (
          <button className="btn btn-primary" style={{ padding: '12px 28px' }} onClick={() => { closeModal(); openModal('register'); }}>
            🎁 Register to Play for Real Money
          </button>
        )}
      </div>
    </Modal>
  );
}
