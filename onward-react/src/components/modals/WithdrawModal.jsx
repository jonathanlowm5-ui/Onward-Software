import { useMemo, useState } from 'react';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';
import { withdraw } from '../../services/playersService';

/*
 * Rich withdrawal modal — two columns: payout methods (left) and the
 * destination + amount + checkout (right), matching the deposit modal style.
 */

const TABS = ['All', 'Cards', 'Crypto', 'E-wallets'];

const WD_METHODS = [
  { id: 'card', name: 'Withdraw to Card', type: 'card', star: true },
  { id: 'btc', name: 'Bitcoin (BTC)', type: 'crypto' },
  { id: 'jeton', name: 'Jeton', type: 'card' },
  { id: 'eth', name: 'Ethereum (ETH)', type: 'crypto', tag: 'ERC-20' },
  { id: 'usdt', name: 'USDT', type: 'crypto', tag: 'TRC20' },
  { id: 'bch', name: 'Bitcoin Cash (BCH)', type: 'crypto' },
  { id: 'ltc', name: 'Litecoin (LTC)', type: 'crypto' },
  { id: 'usdc', name: 'USD Coin (USDC)', type: 'crypto', tag: 'ERC-20' },
  { id: 'ton', name: 'TON', type: 'crypto' },
];

function icon(m) {
  const n = m.name.toLowerCase();
  if (m.type === 'card' && n.includes('card')) return { card: true };
  if (n.includes('jeton')) return { e: 'Jeton', bg: 'transparent', text: true };
  if (n.includes('bitcoin cash') || n.includes('bch')) return { e: '₿', bg: '#2fb86a' };
  if (n.includes('bitcoin') || n.includes('btc')) return { e: '₿', bg: '#f7931a' };
  if (n.includes('eth')) return { e: 'Ξ', bg: '#6b7bd6' };
  if (n.includes('usdt')) return { e: '₮', bg: '#26a17b' };
  if (n.includes('usdc') || n.includes('usd coin')) return { e: '$', bg: '#2775ca' };
  if (n.includes('litecoin') || n.includes('ltc')) return { e: 'Ł', bg: '#5b6c8f' };
  if (n.includes('ton')) return { e: '▼', bg: '#0098ea' };
  if (n.includes('gcash')) return { e: 'G', bg: '#0a7cff' };
  if (n.includes('maya')) return { e: 'M', bg: '#16c79a' };
  return { e: m.name.charAt(0), bg: '#3a4a6a' };
}

export default function WithdrawModal() {
  const { activeModal, closeModal, toast, currency } = useUI();
  const { isLoggedIn, profile, refreshProfile } = useAuth();
  const open = activeModal === 'withdraw';

  const [tab, setTab] = useState('All');
  const [method, setMethod] = useState('card');
  const [dest, setDest] = useState('');
  const [amount, setAmount] = useState('');
  const [showDetails, setShowDetails] = useState(true);
  const [busy, setBusy] = useState(false);

  const sym = currency?.symbol || '₱';
  const cur = currency?.code || profile?.currency || 'PHP';
  const balance = Number(profile?.balance || 0);
  const MIN = 500;
  const MAX = 60771;
  const amt = Number(String(amount).replace(/[^0-9.]/g, '')) || 0;
  const fee = 0;
  const receive = Math.max(0, amt - fee);
  const insufficient = amt > balance;
  const money = (n) => `${sym}${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const region = profile?.country || 'Malaysia';

  const methods = useMemo(() => {
    if (tab === 'Cards') return WD_METHODS.filter((m) => m.type === 'card');
    if (tab === 'Crypto') return WD_METHODS.filter((m) => m.type === 'crypto');
    if (tab === 'E-wallets') return [
      { id: 'ew1', name: region.toLowerCase().includes('malays') ? 'Touch ’n Go' : 'GCash', type: 'ewallet' },
      { id: 'ew2', name: 'Maya', type: 'ewallet' },
    ];
    return WD_METHODS;
  }, [tab, region]);
  const activeId = methods.some((m) => m.id === method) ? method : (methods[0]?.id || '');
  const active = methods.find((m) => m.id === activeId) || WD_METHODS.find((m) => m.id === activeId) || { id: activeId, name: '', type: 'card' };

  const canWithdraw = isLoggedIn && amt >= MIN && amt <= balance && amt <= MAX;

  if (!open) return null;

  const isCard = active.type === 'card';
  const isCrypto = active.type === 'crypto';
  const destTitle = isCard ? 'Your credit card' : isCrypto ? `Your ${active.name} wallet` : 'Your account';
  const destLabel = isCard ? 'Enter number' : isCrypto ? 'Wallet address' : 'Account number';
  const destPh = isCard ? '0000 0000 0000 0000' : isCrypto ? `Enter ${active.name} address` : 'Enter account number';

  const doWithdraw = async () => {
    if (!isLoggedIn) { toast('Please log in to withdraw', 'error'); return; }
    if (amt < MIN) { toast(`Minimum withdrawal is ${money(MIN)}`, 'error'); return; }
    if (insufficient) { toast('Insufficient funds', 'error'); return; }
    setBusy(true);
    try {
      await withdraw({ amount: amt, method: active.name || 'Withdrawal', destination: dest });
      await refreshProfile();
      toast(`Withdrawal request for ${money(amt)} submitted`);
      closeModal();
    } catch (e) {
      toast(e.message || 'Withdrawal failed', 'error');
    } finally { setBusy(false); }
  };

  return (
    <div className="dep2-ov" onClick={(e) => { if (e.target.classList.contains('dep2-ov')) closeModal(); }}>
      <div className="dep2">
        <button className="dep2-x" onClick={closeModal}>✕</button>
        <div className="dep2-grid">
          {/* LEFT */}
          <div className="dep2-left">
            <div className="dep2-lhead">
              <span className="dep2-title">Payment methods</span>
              <span className="dep2-region">🌏 {region} ▾</span>
            </div>
            <div className="dep2-tabs">
              <button className="dep2-search">🔍</button>
              {TABS.map((t) => <button key={t} className={`dep2-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>)}
            </div>
            <div className="dep2-methods">
              {methods.map((m) => {
                const ic = icon(m);
                return (
                  <button key={m.id} className={`dep2-method${activeId === m.id ? ' active' : ''}`} onClick={() => setMethod(m.id)}>
                    {ic.card
                      ? <div className="dep2-badges"><span className="wd-bdg wd-visa">VISA</span><span className="wd-bdg wd-mc">●●</span></div>
                      : <span className="dep2-mico" style={{ background: ic.bg, fontSize: ic.text ? 12 : 16 }}>{ic.e}</span>}
                    {m.tag && <span className="wd-tag">{m.tag}</span>}
                    <div className="dep2-mname">{activeId === m.id && <span style={{ color: 'var(--green,#34c759)' }}>✓ </span>}{m.name}{m.star ? ' ★' : ''}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT */}
          <div className="dep2-right">
            <div className="wd-dest">
              <div className="wd-dest-title">{destTitle}</div>
              <div className="wd-dest-label">{destLabel}</div>
              <input className="wd-dest-input" placeholder={destPh} value={dest} onChange={(e) => setDest(e.target.value)} />
              {isCard && <div className="wd-brandrow"><span className="wd-bdg wd-visa">VISA</span><span className="wd-bdg wd-mc">●●</span></div>}
            </div>

            <div className="wd-amt-label">Withdrawal amount</div>
            <div className="wd-amt-limit">Limit for one transfer is {money(MIN)} – {money(MAX)} {cur}</div>
            <div className={`wd-amt-input${insufficient ? ' err' : ''}`}>
              <span style={{ color: 'var(--gold,#f0c040)', fontWeight: 800 }}>{sym}</span>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0.00" />
            </div>
            {insufficient && <div className="wd-amt-err">Insufficient funds. Available for payout: {money(balance)}</div>}

            <div className="wd-checkout">
              <div className="dep2-receive-head">
                <span>Checkout: <b style={{ color: 'var(--gold,#f0c040)' }}>{money(amt)}</b></span>
                <button className="dep2-details" onClick={() => setShowDetails((s) => !s)}>Details {showDetails ? '▲' : '▾'}</button>
              </div>
              {showDetails && (
                <div className="dep2-receive-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
                  <div><div className="dep2-rk">Total amount</div><div className="dep2-rv">{money(amt)}</div></div>
                  <div><div className="dep2-rk">You receive</div><div className="dep2-rv">{money(receive)}</div></div>
                  <div><div className="dep2-rk">Fee</div><div className="dep2-rv">0.00%</div></div>
                </div>
              )}
            </div>

            <div className="wd-note">ⓘ Payment processing might take up to 24 hours</div>
            <button className={`wd-btn${canWithdraw ? ' ready' : ' disabled'}`} onClick={doWithdraw} disabled={!canWithdraw || busy}>
              {busy ? 'Processing…' : 'WITHDRAW'}
            </button>
          </div>
        </div>

        <div className="wd-footer">
          <span>Daily withdrawal limits</span>
          <span>0 / {money(MAX)} {cur}</span>
        </div>
      </div>
    </div>
  );
}
