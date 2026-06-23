import { useState } from 'react';
import Modal from './Modal.jsx';
import { useUI } from '../../context/UIContext';

/*
 * Use Code modal (#usecode). Opened from the sidebar "Use Code" entry. Lets a
 * player enter a promocode to activate a bonus — a dedicated panel, separate
 * from the promotion detail view.
 */
const VALID_PROMO_CODES = ['WELCOME100', 'LEGOX', 'VIP500', 'FREESPIN55'];

export default function UseCodeModal() {
  const { activeModal, closeModal, toast } = useUI();
  const open = activeModal === 'usecode';
  const [code, setCode] = useState('');

  if (!open) return null;

  const activate = () => {
    const val = code.trim();
    if (!val) { toast('Please enter a promocode', 'error'); return; }
    if (VALID_PROMO_CODES.includes(val.toUpperCase())) {
      toast('🎉 Promocode activated! Your bonus has been added.', 'success');
      setCode('');
      closeModal();
    } else {
      toast('❌ Invalid promocode. Please try again.', 'error');
    }
  };

  return (
    <Modal id="usecode-modal" open={open} onClose={closeModal} maxWidth="420px">
      <div className="modal-header">
        <span className="modal-title">🎟️ Use Promocode</span>
        <button className="modal-close" onClick={closeModal}>✕</button>
      </div>
      <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 40 }}>🎫</div>
          <div style={{ fontWeight: 800, color: 'var(--text,#fff)' }}>Have a Special Promocode?</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted,#8898b8)' }}>Enter it below to activate your exclusive bonus.</div>
        </div>
        <input
          type="text"
          placeholder="Enter promocode"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') activate(); }}
          style={{
            width: '100%', padding: '13px 14px', borderRadius: 10, textAlign: 'center',
            background: 'var(--bg3,#0c1322)', color: 'var(--text,#fff)', border: '1px solid var(--border,#243049)',
            fontSize: 16, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', boxSizing: 'border-box',
          }}
        />
        <button
          onClick={activate}
          style={{
            width: '100%', padding: '13px', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontWeight: 900, fontSize: 15, color: '#1a1205',
            background: 'linear-gradient(180deg,#ffd75e,#f0c040)', boxShadow: '0 8px 20px rgba(240,192,64,.32)',
          }}
        >ACTIVATE</button>
      </div>
    </Modal>
  );
}
