import { useState } from 'react';
import Modal from './Modal.jsx';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

/*
 * Use Code modal (#usecode). Opened from the sidebar "Use Code" entry. Redeems
 * an admin-generated voucher via POST /api/vouchers/redeem — money rewards are
 * credited to the balance instantly, everything is validated server-side
 * (expiry, max uses, one redemption per player).
 */
export default function UseCodeModal() {
  const { activeModal, closeModal, openModal, toast } = useUI();
  const { isLoggedIn, refreshProfile } = useAuth();
  const open = activeModal === 'usecode';
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const activate = async () => {
    const val = code.trim();
    if (!val) { toast('Please enter a promocode', 'error'); return; }
    if (!isLoggedIn) { closeModal(); openModal('login'); return; }
    setBusy(true);
    try {
      const { data } = await api.post('/vouchers/redeem', { code: val });
      toast(data.credited > 0
        ? `🎉 ${data.value} credited to your balance!`
        : `🎉 Code ${data.code} activated! ${data.value || ''} will be added to your account.`, 'success');
      refreshProfile?.(); // header balance
      setCode('');
      closeModal();
    } catch (e) {
      toast('❌ ' + (e?.response?.data?.error || 'Invalid promocode. Please try again.'), 'error');
    } finally {
      setBusy(false);
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
          disabled={busy}
          style={{
            width: '100%', padding: '13px', borderRadius: 10, border: 'none', cursor: busy ? 'wait' : 'pointer',
            fontWeight: 900, fontSize: 15, color: '#1a1205', opacity: busy ? 0.7 : 1,
            background: 'linear-gradient(180deg,#ffd75e,#f0c040)', boxShadow: '0 8px 20px rgba(240,192,64,.32)',
          }}
        >{busy ? 'CHECKING…' : 'ACTIVATE'}</button>
      </div>
    </Modal>
  );
}
