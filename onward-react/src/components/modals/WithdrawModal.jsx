import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';
import { getBankAccounts, withdraw } from '../../services/playersService';

const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '7px' };
const inputStyle = { width: '100%', background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '9px', padding: '11px 14px', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };

export default function WithdrawModal() {
  const { activeModal, closeModal, toast } = useUI();
  const { profile, currency } = { ...useAuth(), ...useUI() };
  const open = activeModal === 'withdraw';
  const [accounts, setAccounts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  const balance = profile?.balance != null ? Number(profile.balance) : 0;

  useEffect(() => {
    if (!open) return;
    getBankAccounts().then((a) => {
      setAccounts(a || []);
      if (a && a.length) setSelected(a[0].id);
    }).catch(() => setAccounts([]));
  }, [open]);

  const submit = async () => {
    const amt = Number(amount);
    if (!accounts.length) { toast('Add a withdrawal account first', 'error'); return; }
    if (!amt || amt < 500) { toast('Minimum withdrawal is ₱500', 'error'); return; }
    if (amt > balance) { toast('Amount exceeds your balance', 'error'); return; }
    setBusy(true);
    try {
      await withdraw({ accountId: selected, amount: amt });
      toast('Withdrawal request submitted');
      closeModal();
    } catch (e) {
      toast(e.message || 'Withdrawal failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal id="withdraw-modal" open={open} onClose={closeModal} maxWidth="460px" modalStyle={{ padding: 0, overflow: 'hidden' }} zIndex={1100}>
      <div style={{ padding: '20px 24px 16px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: '17px', fontWeight: 900, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '10px' }}>💸 Withdraw Funds</div>
          <button onClick={closeModal} style={{ background: 'rgba(255,255,255,.08)', border: 'none', color: 'var(--text-muted)', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>✕</button>
        </div>
      </div>
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ background: 'rgba(240,192,64,.07)', border: '1px solid rgba(240,192,64,.18)', borderRadius: '10px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Available Balance</span>
          <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--gold)' }}>{currency.symbol} {balance.toFixed(2)}</span>
        </div>

        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px' }}>Select Withdrawal Account</div>
          {accounts.length ? (
            <div id="wd-accounts-list" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {accounts.map((a) => (
                <button key={a.id} onClick={() => setSelected(a.id)} style={{ ...inputStyle, textAlign: 'left', borderColor: selected === a.id ? 'var(--gold)' : 'var(--border)', cursor: 'pointer' }}>
                  {a.bank || a.type} · {a.number || a.account}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ border: '1.5px dashed var(--border)', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🏦</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>No bank account linked yet</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>Add a withdrawal account in your Profile → Bank tab first.</div>
            </div>
          )}
        </div>

        <div>
          <label style={labelStyle}>Amount (₱)</label>
          <input type="number" placeholder="Min ₱500" value={amount} onChange={(e) => setAmount(e.target.value)} style={inputStyle} />
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
            {[500, 1000, 2000, 5000].map((v) => (
              <button key={v} className="cat-btn" onClick={() => setAmount(String(v))} style={{ flex: 1, justifyContent: 'center', fontSize: '13px' }}>₱{v.toLocaleString()}</button>
            ))}
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '10px', padding: '12px 14px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
          ⏱ Processing time: <strong style={{ color: 'var(--text)' }}>15 min – 24 hrs</strong><br />
          📋 Min withdrawal: <strong style={{ color: 'var(--text)' }}>₱500</strong> &nbsp;·&nbsp; Max: <strong style={{ color: 'var(--text)' }}>₱50,000/day</strong><br />
          🔒 Withdrawals are encrypted and processed securely
        </div>

        <button className="btn btn-primary" style={{ width: '100%', padding: '13px', fontSize: '15px', opacity: busy ? 0.7 : 1 }} onClick={submit} disabled={busy}>
          {busy ? 'Submitting…' : 'Submit Withdrawal Request →'}
        </button>
      </div>
    </Modal>
  );
}
