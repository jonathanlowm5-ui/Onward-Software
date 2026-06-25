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

// Three method groups. Each maps to a bank_channels type.
const TABS = [
  { key: 'Wallet', type: 'ewallet' },
  { key: 'Bank', type: 'bank' },
  { key: 'Crypto', type: 'crypto' },
];

// Default e-wallets per region (used when the admin hasn't configured channels).
function walletDefaults(country) {
  const c = String(country || '').toLowerCase();
  if (c.includes('malays')) return ['Touch ’n Go', 'Alipay', 'WeChat Pay'];
  if (c.includes('thai')) return ['TrueMoney', 'Alipay', 'WeChat Pay'];
  if (c.includes('indones')) return ['DANA', 'OVO', 'Alipay'];
  if (c.includes('vietnam')) return ['MoMo', 'ZaloPay', 'Alipay'];
  return ['GCash', 'Maya', 'Alipay', 'WeChat Pay']; // Philippines / default
}
const BANK_DEFAULTS = ['Bank Transfer'];
const CRYPTO_DEFAULTS = ['USDT (TRC20)'];

// Brand-ish icon for a method by name.
function methodIcon(name) {
  const n = String(name).toLowerCase();
  if (n.includes('gcash')) return { e: 'G', bg: '#0a7cff' };
  if (n.includes('maya') || n.includes('paymaya')) return { e: 'M', bg: '#16c79a' };
  if (n.includes('alipay')) return { e: '支', bg: '#1677ff' };
  if (n.includes('wechat') || n.includes('we chat')) return { e: '💬', bg: '#2dc100' };
  if (n.includes('touch') || n.includes('tng') || n.includes('n go') || n.includes('’n go')) return { e: 'TnG', bg: '#1a47b8' };
  if (n.includes('truemoney')) return { e: 'T', bg: '#f47b20' };
  if (n.includes('dana')) return { e: 'D', bg: '#118eea' };
  if (n.includes('ovo')) return { e: 'O', bg: '#4c2a86' };
  if (n.includes('momo')) return { e: 'M', bg: '#a50064' };
  if (n.includes('zalo')) return { e: 'Z', bg: '#0068ff' };
  if (n.includes('grab')) return { e: 'G', bg: '#00b14f' };
  if (n.includes('usdt') || n.includes('tether')) return { e: '₮', bg: '#26a17b' };
  if (n.includes('btc') || n.includes('bitcoin')) return { e: '₿', bg: '#f7931a' };
  if (n.includes('eth')) return { e: 'Ξ', bg: '#627eea' };
  if (n.includes('crypto')) return { e: '₮', bg: '#26a17b' };
  if (n.includes('bank')) return { e: '🏦', bg: '#3a4a6a' };
  return { e: name.charAt(0).toUpperCase(), bg: '#3a4a6a' };
}

export default function DepositModal() {
  const { activeModal, closeModal, toast, currency } = useUI();
  const { isLoggedIn, profile, refreshProfile } = useAuth();
  const open = activeModal === 'deposit';

  const [tab, setTab] = useState('Wallet');
  const [method, setMethod] = useState('');
  const [amount, setAmount] = useState('1520');
  const [quick, setQuick] = useState(DEFAULT_QUICK);
  const [channels, setChannels] = useState([]);
  const [showDetails, setShowDetails] = useState(true);
  const [bonusOn, setBonusOn] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    api.get('/deposit-config')
      .then((r) => { if (Array.isArray(r.data?.quickAmounts) && r.data.quickAmounts.length) setQuick(r.data.quickAmounts); })
      .catch(() => {});
    api.get('/bank-channels?active=1')
      .then((r) => { if (Array.isArray(r.data)) setChannels(r.data.filter((c) => c.dep && c.on)); })
      .catch(() => {});
  }, [open]);

  // Methods for the active tab: admin-configured channels of that type, else
  // region-aware defaults.
  const activeType = (TABS.find((t) => t.key === tab) || TABS[0]).type;
  const methods = useMemo(() => {
    const fromCh = channels.filter((c) => c.type === activeType).map((c) => ({ id: c.id, name: c.n, sub: c.acct || '' }));
    if (fromCh.length) return fromCh;
    const defs = activeType === 'ewallet' ? walletDefaults(profile?.country)
      : activeType === 'bank' ? BANK_DEFAULTS : CRYPTO_DEFAULTS;
    return defs.map((n, i) => ({ id: `def-${activeType}-${i}`, name: n, sub: '' }));
  }, [channels, activeType, profile?.country]);
  const activeMethodId = methods.some((m) => m.id === method) ? method : (methods[0]?.id || '');
  const activeMethodName = (methods.find((m) => m.id === activeMethodId) || {}).name || '';

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
      await depositRequest({ amount: amt, method: activeMethodName || tab });
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
                <button key={t.key} className={`dep2-tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>{t.key}</button>
              ))}
            </div>
            <div className="dep2-methods">
              {methods.map((m) => {
                const ic = methodIcon(m.name);
                return (
                  <button key={m.id} className={`dep2-method${activeMethodId === m.id ? ' active' : ''}`} onClick={() => setMethod(m.id)}>
                    <span className="dep2-mico" style={{ background: ic.bg }}>{ic.e}</span>
                    <div className="dep2-mname">{activeMethodId === m.id && <span style={{ color: 'var(--green,#34c759)' }}>✓ </span>}{m.name}</div>
                    {m.sub && <div className="dep2-msub">{m.sub}</div>}
                  </button>
                );
              })}
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
