import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';
import { saveBankAccount } from '../../services/playersService';

const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '7px' };
const fieldStyle = { width: '100%', background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '9px', padding: '11px 14px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };

// Post-registration "Set Up Withdrawal Account" modal (#bank-setup-modal).
export default function BankSetupModal() {
  const { activeModal, modalData, closeModal, toast } = useUI();
  const { profile, refreshProfile } = useAuth();
  const open = activeModal === 'bank';
  const [type, setType] = useState('');
  const [number, setNumber] = useState('');
  const [busy, setBusy] = useState(false);

  // Account holder MUST match the player's registered name — so we lock it to
  // the registered full name rather than letting the player type a mismatch.
  const registeredName = (profile?.fullName || modalData?.name || '').trim();

  const save = async () => {
    if (!type) { toast('Select a bank or e-wallet', 'error'); return; }
    if (!number.trim()) { toast('Enter the account number', 'error'); return; }
    setBusy(true);
    try {
      await saveBankAccount({ bankName: type, holder: registeredName, accountNumber: number });
      toast('Withdrawal account saved');
      await refreshProfile();
      closeModal();
    } catch (e) {
      toast(e.message || 'Could not save account', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal id="bank-setup-modal" open={open} onClose={closeModal} maxWidth="460px" modalStyle={{ padding: 0, overflow: 'hidden' }} zIndex={999}>
      <div style={{ padding: '22px 24px 16px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: '17px', fontWeight: 900, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>🏦 <span data-i18n="bsm_title">Set Up Withdrawal Account</span></div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }} data-i18n="bsm_sub">Required to process future withdrawals securely.</div>
          </div>
          <button onClick={closeModal} style={{ background: 'rgba(255,255,255,.08)', border: 'none', color: 'var(--text-muted)', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', flexShrink: 0, marginLeft: '12px' }}>✕</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px' }}>✅</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gold)' }} data-i18n="bsm_step1">Account Created</span>
          </div>
          <div style={{ flex: 1, height: '2px', background: 'linear-gradient(to right,var(--gold),var(--border))', margin: '0 12px', borderRadius: '2px' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px' }}>🏦</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }} data-i18n="bsm_step2">Bank Details</span>
          </div>
        </div>
      </div>
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ background: 'rgba(240,192,64,.07)', border: '1px solid rgba(240,192,64,.18)', borderRadius: '10px', padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '16px' }}>💡</span>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <span data-i18n="bsm_enc_p1">Your bank details are</span> <strong style={{ color: 'var(--text)' }} data-i18n="bsm_enc_b">encrypted</strong><span data-i18n="bsm_enc_p2"> and only used for withdrawals.</span>
          </div>
        </div>
        <div>
          <label style={labelStyle} data-i18n="bsm_acct_type">Account Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} style={fieldStyle}>
            <option value="" data-i18n="bsm_select">Select bank or e-wallet</option>
            <optgroup label="── Banks ──">
              <option value="maybank">🏦 Maybank</option>
              <option value="cimb">🏦 CIMB Bank</option>
              <option value="rhb">🏦 RHB Bank</option>
              <option value="public">🏦 Public Bank</option>
              <option value="hongleong">🏦 Hong Leong Bank</option>
              <option value="ambank">🏦 AmBank</option>
              <option value="ocbc">🏦 OCBC Bank</option>
              <option value="hsbc">🏦 HSBC Bank</option>
              <option value="uob">🏦 UOB Bank</option>
            </optgroup>
            <optgroup label="── E-Wallets ──">
              <option value="tng">💙 Touch 'n Go</option>
              <option value="grabpay">💚 GrabPay</option>
              <option value="boost">❤️ Boost</option>
              <option value="shopeepay">🧡 ShopeePay</option>
              <option value="gcash">💜 GCash</option>
            </optgroup>
          </select>
        </div>
        <div>
          <label style={labelStyle}><span data-i18n="bsm_holder">Account Holder Name</span> <span style={{ color: 'var(--red)' }}>*</span></label>
          <input type="text" value={registeredName} readOnly disabled style={{ ...fieldStyle, opacity: 0.75, cursor: 'not-allowed' }} />
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>Must match your registered name. Contact support to change it.</div>
        </div>
        <div>
          <label style={labelStyle}>Account / Mobile Number <span style={{ color: 'var(--red)' }}>*</span></label>
          <input type="text" placeholder="Account or e-wallet number" value={number} onChange={(e) => setNumber(e.target.value)} style={fieldStyle} />
        </div>
        <button className="btn btn-primary" style={{ width: '100%', padding: '13px', fontSize: '15px', opacity: busy ? 0.7 : 1 }} onClick={save} disabled={busy}>
          {busy ? 'Saving…' : 'Save & Finish →'}
        </button>
      </div>
    </Modal>
  );
}
