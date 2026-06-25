import { useEffect, useMemo, useState } from 'react';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';
import { deposit as depositRequest } from '../../services/playersService';
import api from '../../services/api';

/*
 * Rich deposit modal — two columns: payment methods (left) and the bonus +
 * amount + receive summary (right). Quick-select chips are admin-configurable
 * (/api/deposit-config) and show the bonus each amount earns.
 */

// First-deposit bonus model (matches the reference design). Could be wired to
// the backend later; kept here so the panel renders the right numbers.
const BONUS = { pct: 1.25, max: 60770, min: 1215.42, fs: 100, spins: 1, label: '1ST DEPOSIT BONUS', pctLabel: '125%' };
const DEFAULT_QUICK = [730, 1000, 2500, 5000, 10000, 25000, 50000, 60770];

function shortAmt(n) {
  const v = Number(n) || 0;
  if (v >= 1000) { const k = v / 1000; return (Number.isInteger(k) ? k : +k.toFixed(2)) + 'K'; }
  return String(v);
}
const calcBonus = (amt) => (amt >= BONUS.min ? Math.min(amt * BONUS.pct, BONUS.max) : 0);

const TABS = ['Recommended', 'All', 'Cards', 'Gift card', 'Crypto'];

// Payment methods (brand logos approximated with styled badges).
const METHODS = [
  { id: 'card', name: 'Credit card #1', star: true, badges: ['visa', 'mc'] },
  { id: 'giftbuy', name: 'Buy a Giftcard', badges: ['mc', 'visa', 'paypal', 'gpay', 'apple'] },
  { id: 'giftpay', name: 'Pay by Giftcard', sub: 'paysafecard', badges: ['paypal', 'psc'] },
  { id: 'crypto', name: 'Crypto', badges: ['usdt'], wide: false },
];

function Badge({ k }) {
  const map = {
    visa: { t: 'VISA', bg: '#fff', c: '#1a1f71' },
    mc: { t: '●●', bg: '#fff', c: '#eb001b' },
    paypal: { t: 'PayPal', bg: '#fff', c: '#003087' },
    gpay: { t: 'GPay', bg: '#fff', c: '#5f6368' },
    apple: { t: ' Pay', bg: '#fff', c: '#000' },
    psc: { t: 'paysafe', bg: '#fff', c: '#00a4e0' },
    usdt: { t: '₮', bg: '#26a17b', c: '#fff' },
  };
  const b = map[k] || { t: k, bg: '#fff', c: '#000' };
  return <span style={{ background: b.bg, color: b.c, fontWeight: 800, fontSize: 10, padding: '2px 5px', borderRadius: 4, lineHeight: 1.2 }}>{b.t}</span>;
}

export default function DepositModal() {
  const { activeModal, closeModal, toast, currency } = useUI();
  const { isLoggedIn, profile, refreshProfile } = useAuth();
  const open = activeModal === 'deposit';

  const [tab, setTab] = useState('Recommended');
  const [method, setMethod] = useState('card');
  const [amount, setAmount] = useState('1520');
  const [quick, setQuick] = useState(DEFAULT_QUICK);
  const [showDetails, setShowDetails] = useState(true);
  const [bonusOn, setBonusOn] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    api.get('/deposit-config')
      .then((r) => { if (Array.isArray(r.data?.quickAmounts) && r.data.quickAmounts.length) setQuick(r.data.quickAmounts); })
      .catch(() => {});
  }, [open]);

  const sym = currency?.symbol || '₱';
  const amt = Number(String(amount).replace(/[^0-9.]/g, '')) || 0;
  const bonus = useMemo(() => (bonusOn ? calcBonus(amt) : 0), [amt, bonusOn]);
  const fs = bonusOn && amt >= BONUS.min ? BONUS.fs : 0;
  const receive = amt + bonus;
  const money = (n) => `${sym}${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const region = profile?.country || 'Malaysia';

  if (!open) return null;

  const doDeposit = async () => {
    if (!isLoggedIn) { toast('Please log in to deposit', 'error'); return; }
    if (!(amt >= 100)) { toast('Minimum deposit is ₱100', 'error'); return; }
    setBusy(true);
    try {
      await depositRequest({ amount: amt, method });
      await refreshProfile();
      toast(`Deposit request for ${money(amt)} submitted`);
      closeModal();
    } catch (e) {
      toast(e.message || 'Deposit failed', 'error');
    } finally { setBusy(false); }
  };

  return (
    <div className="dep2-ov" onClick={(e) => { if (e.target.classList.contains('dep2-ov')) closeModal(); }}>
      <div className="dep2">
        <button className="dep2-x" onClick={closeModal}>✕</button>
        <div className="dep2-grid">
          {/* ---------- LEFT: payment methods ---------- */}
          <div className="dep2-left">
            <div className="dep2-lhead">
              <span className="dep2-title">Payment methods</span>
              <span className="dep2-region">🌏 {region} ▾</span>
            </div>
            <div className="dep2-tabs">
              <button className="dep2-search">🔍</button>
              {TABS.map((t) => (
                <button key={t} className={`dep2-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
              ))}
            </div>
            <div className="dep2-skins">Skins</div>
            <div className="dep2-methods">
              {METHODS.map((m) => (
                <button key={m.id} className={`dep2-method${method === m.id ? ' active' : ''}`} onClick={() => setMethod(m.id)}>
                  <div className="dep2-badges">{m.badges.map((b, i) => <Badge key={i} k={b} />)}</div>
                  <div className="dep2-mname">{method === m.id && <span style={{ color: 'var(--green,#34c759)' }}>✓ </span>}{m.name}{m.star && ' ★'}</div>
                  {m.sub && <div className="dep2-msub">{m.sub}</div>}
                </button>
              ))}
            </div>
          </div>

          {/* ---------- RIGHT: bonus + amount + receive ---------- */}
          <div className="dep2-right">
            {bonusOn ? (
              <div className="dep2-bonus">
                <div className="dep2-bonus-top">{BONUS.label} | FROM {money(BONUS.min)}</div>
                <div className="dep2-bonus-main">{BONUS.pctLabel} UP TO <span style={{ color: 'var(--green,#34c759)' }}>{sym}{shortAmt(BONUS.max)}</span></div>
                <div className="dep2-bonus-fs">+{BONUS.fs} FREE SPINS</div>
                <div className="dep2-bonus-pct">{BONUS.pctLabel}</div>
              </div>
            ) : (
              <div className="dep2-bonus dep2-nobonus">
                <div className="dep2-bonus-top">NO BONUS</div>
                <div className="dep2-bonus-main">Play with your real balance only — no wagering required.</div>
              </div>
            )}
            <button className="dep2-changebonus" onClick={() => setBonusOn((b) => !b)}>🔄 Click to change bonus {bonusOn ? '— switch to No bonus' : '— switch to 125% bonus'}</button>

            <div className="dep2-sumlabel">Enter your sum</div>
            <div className="dep2-suminput">
              <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
              <span className="dep2-suminput-bonus">+ 🎁 {money(bonus)}</span>
            </div>

            <div className="dep2-chips">
              {quick.map((v) => {
                const b = bonusOn ? calcBonus(Number(v)) : 0;
                return (
                  <button key={v} className={`dep2-chip${amt === Number(v) ? ' active' : ''}`} onClick={() => setAmount(String(v))}>
                    {b > 0 && <span className="dep2-chip-bonus">+{shortAmt(b)}</span>}
                    <span className="dep2-chip-amt">{shortAmt(v)}</span>
                  </button>
                );
              })}
            </div>

            <div className="dep2-receive">
              <div className="dep2-receive-head">
                <span>Receive: <b style={{ color: 'var(--gold,#f0c040)' }}>{money(receive)}</b></span>
                <button className="dep2-details" onClick={() => setShowDetails((s) => !s)}>Details {showDetails ? '▲' : '▾'}</button>
              </div>
              {showDetails && (
                <div className="dep2-receive-grid">
                  <div><div className="dep2-rk">Your sum</div><div className="dep2-rv">{money(amt)}</div></div>
                  <div><div className="dep2-rk">Bonus</div><div className="dep2-rv" style={{ color: 'var(--green,#34c759)' }}>+ {money(bonus)}</div></div>
                  <div><div className="dep2-rk">FS</div><div className="dep2-rv">{fs}FS</div></div>
                  <div><div className="dep2-rk">Rainbow Spin Wheel</div><div className="dep2-rv">{BONUS.spins} Spin</div></div>
                </div>
              )}
            </div>

            <button className="dep2-deposit" onClick={doDeposit} disabled={busy}>{busy ? 'Processing…' : `DEPOSIT ${money(amt)}`}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
