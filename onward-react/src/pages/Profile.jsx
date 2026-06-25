// Profile / Settings — faithful HTML→React conversion of the original #view-profile view.
import { useState, useRef, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import useSectionNav from '../hooks/useSectionNav';
import useWelcomePromo from '../hooks/useWelcomePromo';
import { resolvePromoBanner } from '../utils/promoTerms';
import * as playersService from '../services/playersService';

/* ── Sample data mirroring the original inline JS ── */
const GH_DEMO = [
  { id: 'TXN-8841923', game: 'Gates of Olympus', provider: 'Pragmatic Play', cat: 'slots', wager: 200, win: 480, date: '2025-06-10 14:12' },
  { id: 'TXN-8841755', game: 'Lightning Roulette', provider: 'Evolution', cat: 'live', wager: 150, win: 0, date: '2025-06-10 13:48' },
  { id: 'TXN-8841612', game: 'Sweet Bonanza', provider: 'Pragmatic Play', cat: 'slots', wager: 100, win: 220, date: '2025-06-10 12:30' },
  { id: 'TXN-8840988', game: 'Premier League', provider: '1xBet Sports', cat: 'sports', wager: 500, win: 950, date: '2025-06-10 10:05' },
  { id: 'TXN-8840722', game: 'Aviator', provider: 'Spribe', cat: 'crash', wager: 300, win: 0, date: '2025-06-09 22:17' },
  { id: 'TXN-8840511', game: 'Dragon Tiger', provider: 'Evolution', cat: 'live', wager: 200, win: 380, date: '2025-06-09 21:44' },
  { id: 'TXN-8840303', game: 'Buffalo King', provider: 'Pragmatic Play', cat: 'slots', wager: 100, win: 0, date: '2025-06-09 20:30' },
  { id: 'TXN-8840120', game: 'Ocean King 3', provider: 'IGS', cat: 'fish', wager: 250, win: 410, date: '2025-06-09 19:55' },
  { id: 'TXN-8839804', game: 'Baccarat Live', provider: 'Evolution', cat: 'live', wager: 500, win: 490, date: '2025-06-09 18:22' },
  { id: 'TXN-8839601', game: 'Mines', provider: 'Spribe', cat: 'crash', wager: 150, win: 315, date: '2025-06-09 17:10' },
  { id: 'TXN-8839344', game: 'Big Bass Bonanza', provider: 'Pragmatic Play', cat: 'slots', wager: 200, win: 0, date: '2025-06-09 16:05' },
  { id: 'TXN-8839102', game: "Caishen's Gold Fish", provider: 'CQ9', cat: 'fish', wager: 300, win: 540, date: '2025-06-09 15:20' },
  { id: 'TXN-8838890', game: 'Book of Dead', provider: "Play'n GO", cat: 'slots', wager: 100, win: 180, date: '2025-06-09 14:44' },
  { id: 'TXN-8838611', game: 'Crazy Time', provider: 'Evolution', cat: 'live', wager: 200, win: 0, date: '2025-06-09 13:30' },
  { id: 'TXN-8838402', game: 'Limbo', provider: 'Spribe', cat: 'crash', wager: 100, win: 0, date: '2025-06-09 12:15' },
  { id: 'TXN-8838200', game: 'Wolf Gold', provider: 'Pragmatic Play', cat: 'slots', wager: 150, win: 200, date: '2025-06-09 11:00' },
  { id: 'TXN-8837991', game: 'NBA Finals Bet', provider: '1xBet Sports', cat: 'sports', wager: 600, win: 0, date: '2025-06-09 10:30' },
  { id: 'TXN-8837744', game: 'Gonzos Quest', provider: 'NetEnt', cat: 'slots', wager: 200, win: 440, date: '2025-06-09 09:12' },
  { id: 'TXN-8837522', game: 'Dragon Fishing', provider: 'KA Gaming', cat: 'fish', wager: 400, win: 0, date: '2025-06-08 23:45' },
  { id: 'TXN-8837301', game: 'Blackjack Pro', provider: 'Evolution', cat: 'live', wager: 300, win: 580, date: '2025-06-08 22:10' },
  { id: 'TXN-8837100', game: 'Plinko', provider: 'Spribe', cat: 'crash', wager: 100, win: 190, date: '2025-06-08 21:30' },
  { id: 'TXN-8836880', game: 'The Dog House', provider: 'Pragmatic Play', cat: 'slots', wager: 150, win: 0, date: '2025-06-08 20:15' },
  { id: 'TXN-8836611', game: 'Fishing War', provider: 'CGQ', cat: 'fish', wager: 200, win: 350, date: '2025-06-08 19:00' },
  { id: 'TXN-8836400', game: 'Speed Baccarat', provider: 'Evolution', cat: 'live', wager: 500, win: 460, date: '2025-06-08 18:20' },
];

const WAGER_DATA = {
  bonusAmount: 4000,
  multiplier: 20,
  wagered: 7360,
  promos: [
    { name: '200% Welcome Bonus', amount: 4000, type: 'welcome', date: '2025-06-09', multiplier: 20, wagered: 7360, required: 20000, status: 'active' },
    { name: 'Weekly Cashback 5%', amount: 185, type: 'cashback', date: '2025-06-08', multiplier: 1, wagered: 185, required: 185, status: 'completed' },
    { name: 'Monday Reload 50%', amount: 500, type: 'reload', date: '2025-06-02', multiplier: 10, wagered: 5000, required: 5000, status: 'completed' },
  ],
};
const PTYPE = {
  welcome: { icon: '🎁', color: '#4ade80' },
  cashback: { icon: '💰', color: '#a78bfa' },
  reload: { icon: '🔄', color: '#38bdf8' },
  referral: { icon: '👥', color: '#34d399' },
};

const TX_DEMO = [
  { date: '2025-06-10 14:32', type: 'deposit', desc: 'GCash Deposit', amount: +2000, status: 'completed' },
  { date: '2025-06-10 09:15', type: 'referral', desc: 'Referral Commission — juan***', amount: +250, status: 'completed' },
  { date: '2025-06-09 21:48', type: 'cashback', desc: 'Weekly Cashback 5%', amount: +185, status: 'completed' },
  { date: '2025-06-09 18:03', type: 'withdrawal', desc: 'Bank Withdrawal', amount: -1500, status: 'completed' },
  { date: '2025-06-09 12:22', type: 'promotion', desc: '200% Welcome Bonus', amount: +4000, status: 'completed' },
  { date: '2025-06-08 20:11', type: 'rebate', desc: 'Slots Rebate 0.8%', amount: +96, status: 'completed' },
  { date: '2025-06-08 15:44', type: 'deposit', desc: 'Maya Deposit', amount: +1000, status: 'completed' },
  { date: '2025-06-08 11:30', type: 'referral', desc: 'Referral Commission — maria***', amount: +150, status: 'completed' },
  { date: '2025-06-07 22:05', type: 'cashback', desc: 'Daily Cashback 3%', amount: +60, status: 'completed' },
  { date: '2025-06-07 17:19', type: 'withdrawal', desc: 'GCash Withdrawal', amount: -700, status: 'completed' },
  { date: '2025-06-07 10:08', type: 'promotion', desc: 'Reload Bonus Monday 50%', amount: +500, status: 'completed' },
  { date: '2025-06-06 23:55', type: 'rebate', desc: 'Live Casino Rebate 0.5%', amount: +43, status: 'completed' },
  { date: '2025-06-06 16:30', type: 'deposit', desc: 'USDT Deposit', amount: +3000, status: 'completed' },
  { date: '2025-06-06 09:00', type: 'referral', desc: 'Referral Commission — pedro***', amount: +320, status: 'completed' },
  { date: '2025-06-05 20:45', type: 'cashback', desc: 'Weekend Cashback 8%', amount: +416, status: 'completed' },
  { date: '2025-06-05 14:10', type: 'deposit', desc: 'Bank Transfer', amount: +1500, status: 'pending' },
  { date: '2025-06-04 19:20', type: 'withdrawal', desc: 'Bank Withdrawal', amount: -1000, status: 'processing' },
  { date: '2025-06-04 11:05', type: 'promotion', desc: 'Free Spin Winnings', amount: +280, status: 'completed' },
];
const TX_TYPE_STYLE = {
  deposit: { icon: '💳', color: '#4ade80', label: 'Deposit' },
  withdrawal: { icon: '💸', color: '#f87171', label: 'Withdrawal' },
  rebate: { icon: '🎯', color: '#38bdf8', label: 'Rebate' },
  cashback: { icon: '💰', color: '#a78bfa', label: 'Cashback' },
  promotion: { icon: '🎁', color: '#fbbf24', label: 'Promotion' },
  referral: { icon: '👥', color: '#34d399', label: 'Referral' },
};
const TX_STATUS_STYLE = {
  completed: { color: '#4ade80', label: 'Completed' },
  pending: { color: '#fbbf24', label: 'Pending' },
  processing: { color: '#38bdf8', label: 'Processing' },
};

const AG_MEMBERS_DATA = [
  { name: 'juan***', deposit: 85000, winloss: -22400, status: 'active' },
  { name: 'maria***', deposit: 32000, winloss: -8400, status: 'active' },
  { name: 'pedro***', deposit: 420000, winloss: -98000, status: 'active' },
  { name: 'lea***', deposit: 8500, winloss: 12000, status: 'active' },
  { name: 'carlos***', deposit: 3000, winloss: -800, status: 'pending' },
];
const AG_REPORT_ROWS = [
  { label: 'Total Player Losses', thisMonth: 180000, lastMonth: 152000 },
  { label: 'Total Player Wins', thisMonth: 156000, lastMonth: 133000 },
  { label: 'Gross Win/Loss', thisMonth: 24000, lastMonth: 19000 },
  { label: '(-) Promo Deduction 5%', thisMonth: -1200, lastMonth: -950 },
  { label: '(-) Platform Fee 3%', thisMonth: -720, lastMonth: -570 },
  { label: '(-) Game Provider 2%', thisMonth: -480, lastMonth: -380 },
  { label: '(-) Payment Fee 1%', thisMonth: -240, lastMonth: -190 },
  { label: 'Net Profit', thisMonth: 21360, lastMonth: 16910 },
  { label: 'Your Share (30%)', thisMonth: 6408, lastMonth: 5073 },
];

const peso = (v, frac = 0) => '₱' + v.toLocaleString('en', { minimumFractionDigits: frac });

/* ════════════════════════════════════════════ */

// Currency code -> display symbol (falls back to the code itself).
const CUR_SYM = { PHP: '₱', USD: '$', EUR: '€', INR: '₹', THB: '฿', VND: '₫', IDR: 'Rp', MYR: 'RM', CNY: '¥', JPY: '¥' };
const curSym = (c) => CUR_SYM[c] || c || '₱';

export default function Profile() {
  const { openModal, toast } = useUI();
  const { profile, isLoggedIn, loading, logout, updateProfile } = useAuth();
  // Same promotion artwork as the deposit modal / Promotions page sits behind
  // the "activated bonus" card.
  const welcomePromo = useWelcomePromo();
  const welcomeBonusBanner = resolvePromoBanner(welcomePromo || {}, profile?.currency);
  const avatarRef = useRef(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const onAvatarPick = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarBusy(true);
    try {
      const { url } = await playersService.uploadFile(f, 'avatar');
      await updateProfile({ avatar: url });
      toast('Profile photo updated', 'success');
    } catch (err) {
      toast(err.message || 'Could not upload photo', 'error');
    } finally {
      setAvatarBusy(false);
      if (e.target) e.target.value = '';
    }
  };
  const go = useSectionNav();
  const sym = curSym(profile?.currency);
  const bal = Number(profile?.balance || 0);
  const bonus = Number(profile?.bonus || 0);

  // Member-only page: bounce to the public lobby once we know there's no session
  // (covers logout and reaching /profile via the browser Back button).
  useEffect(() => {
    if (!loading && !isLoggedIn) go('lobby');
  }, [loading, isLoggedIn, go]);

  // Left-nav selection: which right-hand panel is shown.
  const [nav, setNav] = useState('security'); // security | transactions | wager | history | agent
  // Settings tab selection inside the main profile panel.
  const [tab, setTab] = useState('security');
  // Mobile drill-in: the account menu is shown until a section is opened, then
  // the page switches to that panel full-width (CSS keys off `.drilled`).
  const [drilled, setDrilled] = useState(false);
  const openSection = (section) => { setNav(section); setDrilled(true); };

  // Open a specific section when arriving from the avatar dropdown
  // (e.g. "Game History" -> history panel).
  const location = useLocation();
  useEffect(() => {
    const s = location.state?.section;
    if (s) { setNav(s); setDrilled(true); }
  }, [location.state]);

  const showProfPanel = nav === 'security';

  return (
    <div id="view-profile">
      <div className={'profile-page' + (drilled ? ' drilled' : '')}>

        {/* H5 drill-in back bar (only shows on mobile when a sub-page is open) */}
        <button id="prof-back-bar" type="button" onClick={() => setDrilled(false)}>← <span>Back to account menu</span></button>

        {/* LEFT SIDEBAR */}
        <div className="prof-sidebar">

          {/* User card */}
          <div className="prof-user-card">
            <div className="prof-user-top">
              <div className="prof-avatar-lg" id="prof-avatar" onClick={() => !avatarBusy && avatarRef.current?.click()}
                style={profile?.avatar ? { backgroundImage: `url(${profile.avatar})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent', cursor: 'pointer' } : { cursor: 'pointer' }}>
                {profile?.avatar ? '' : '🎮'}
                <div className="prof-avatar-edit">{avatarBusy ? '…' : '✏'}</div>
                <input ref={avatarRef} type="file" accept="image/*" onChange={onAvatarPick} style={{ display: 'none' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="prof-username" id="prof-username">{profile?.username || 'Player'}</div>
                <div className="prof-id" title="Your permanent Player ID"
                  onClick={() => { if (profile?.playerCode) { navigator.clipboard?.writeText(profile.playerCode); toast('Player ID copied'); } }}
                  style={{ cursor: profile?.playerCode ? 'pointer' : 'default' }}>
                  {profile?.playerCode || '—'} 📋
                </div>
                <div className="prof-xp-bar"><div className="prof-xp-fill"></div></div>
                <div className="prof-xp-label">VIP {profile?.vipLevel || 0}</div>
              </div>
            </div>
            <div className="prof-balance-section">
              <div className="prof-bal-total-label" data-i18n="prof_total_balance">Total balance</div>
              <div className="prof-bal-total"><span id="prof-bal-main">{(bal + bonus).toFixed(2)}</span> <span>{sym}</span></div>
              <div className="prof-bal-row">
                <span className="prof-bal-row-label" data-i18n="prof_main_balance">Main balance</span>
                <span className="prof-bal-row-val" id="prof-main-bal">{bal.toFixed(2)} {sym}</span>
              </div>
              <div className="prof-bal-row">
                <span className="prof-bal-row-label" data-i18n="prof_bonus_balance">Bonus Balance</span>
                <span className="prof-bal-row-val bonus" id="prof-bonus-bal">{bonus.toFixed(2)} {sym}</span>
              </div>
            </div>
            <div className="prof-action-btns">
              <button className="prof-btn-deposit" onClick={() => openModal('deposit')}>DEPOSIT</button>
              <button className="prof-btn-withdraw" onClick={() => openModal('withdraw')}>WITHDRAW</button>
            </div>
          </div>

          {/* Navigation */}
          <div className="prof-nav">
            <button className={'prof-nav-item' + (nav === 'security' ? ' active' : '')} id="prof-nav-profile" onClick={() => openSection('security')}>
              <span className="prof-nav-icon">👤</span> <span data-i18n="menu_profile">Profile</span>
            </button>
            <button className={'prof-nav-item' + (nav === 'transactions' ? ' active' : '')} id="prof-nav-transactions" onClick={() => openSection('transactions')}>
              <span className="prof-nav-icon">↔️</span> <span data-i18n="menu_transactions">Transactions</span>
            </button>
            <button className={'prof-nav-item' + (nav === 'wager' ? ' active' : '')} onClick={() => openSection('wager')}>
              <span className="prof-nav-icon">🎰</span> <span data-i18n="prof_nav_wager">Wager</span>
            </button>
            <button className={'prof-nav-item' + (nav === 'history' ? ' active' : '')} onClick={() => openSection('history')}>
              <span className="prof-nav-icon">🕐</span> <span data-i18n="prof_nav_history">Game History</span>
            </button>
            <button className={'prof-nav-item' + (nav === 'agent' ? ' active' : '')} id="prof-nav-agent" onClick={() => openSection('agent')}>
              <span className="prof-nav-icon">🧑‍💼</span> <span data-i18n="prof_nav_agent">Agent</span>
            </button>
            <button className="prof-nav-item" onClick={() => { logout(); go('lobby'); }}>
              <span className="prof-nav-icon">🚪</span> <span data-i18n="menu_logout">Log out</span>
            </button>
          </div>

          {/* Referral card */}
          <div className="prof-referral-card">
            <div className="prof-referral-top">
              <div>
                <div className="prof-referral-title" data-i18n="ref_tagline">They join, they win – all thanks to you</div>
                <div className="prof-referral-sub" data-i18n="ref_friend_gift">Give your friend a gift! A special welcome bonus to start with.</div>
              </div>
              <button className="prof-referral-btn" data-i18n="ref_invite_btn">🎁 Invite a Friend</button>
            </div>
            <div className="prof-promo-create">
              <div className="prof-promo-label" data-i18n="ref_create_code">Create and share promocode</div>
              <div className="prof-promo-desc" data-i18n="ref_promo_rules">You can use letters of the Latin alphabet and numbers from 0 to 9. The length of the promocode must be from 6 to 20 characters.</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }} data-i18n="ref_your_code">Your promocode</div>
              <div className="prof-promo-input-row">
                <input type="text" placeholder="Create promocode" className="prof-promo-input" maxLength="20" data-i18n-placeholder="ref_create_code_ph" />
                <button className="prof-promo-save" onClick={() => toast('Promocode saved!', 'success')} data-i18n="ui_save">SAVE</button>
              </div>
            </div>
          </div>

          {/* Active bonus card — banner region matches the promotions banner
              proportion (1200/425); the MORE INFO button stays below it. */}
          <div className="prof-bonus-card">
            {welcomeBonusBanner ? (
              <div className="prof-bonus-banner" style={{ backgroundImage: `url(${welcomeBonusBanner})` }}>
                <div className="prof-bonus-banner-text">
                  <div className="prof-bonus-activated" data-i18n="promo_activated">ACTIVATED</div>
                  <div className="prof-bonus-title" data-i18n="prof_bonus_1st">1ST DEPOSIT BONUS</div>
                  <div className="prof-bonus-sub">125% UP TO 61.51K ₱<br />+100 FREE SPINS</div>
                </div>
              </div>
            ) : (
              <>
                <div className="prof-bonus-activated" data-i18n="promo_activated">ACTIVATED</div>
                <div className="prof-bonus-title" data-i18n="prof_bonus_1st">1ST DEPOSIT BONUS</div>
                <div className="prof-bonus-sub">125% UP TO 61.51K ₱<br />+100 FREE SPINS</div>
                <div className="prof-bonus-deco">125%</div>
              </>
            )}
            <button className="prof-bonus-more" onClick={() => go('promos')} data-i18n="ui_more_info">MORE INFO</button>
          </div>

        </div>

        {/* RIGHT PANEL */}
        <div className="prof-panel" style={{ display: showProfPanel ? '' : 'none' }}>
          <div className="prof-tabs">
            <ProfTab id="security" label="Security" icon="🛡️" i18n="tab_security" tab={tab} setTab={setTab} />
            <ProfTab id="personal" label="Personal" icon="📝" i18n="tab_personal" tab={tab} setTab={setTab} />
            <ProfTab id="bank" label="Bank" icon="🏦" i18n="tab_bank" tab={tab} setTab={setTab} />
            <ProfTab id="provably" label="Provably Fair" icon="✅" i18n="tab_provably" tab={tab} setTab={setTab} />
            <ProfTab id="restrictions" label="Restrictions" icon="🔒" i18n="tab_restrictions" tab={tab} setTab={setTab} />
            <ProfTab id="customization" label="Customization" icon="🎨" i18n="tab_customization" tab={tab} setTab={setTab} />
          </div>

          <div className="prof-content">
            <SecurityTab show={tab === 'security'} />
            <PersonalTab show={tab === 'personal'} toast={toast} />
            <BankTab show={tab === 'bank'} toast={toast} />
            <ProvablyTab show={tab === 'provably'} toast={toast} />
            <RestrictionsTab show={tab === 'restrictions'} toast={toast} />
            <CustomizationTab show={tab === 'customization'} />
          </div>
        </div>

        {/* ══════════ AGENT PANEL ══════════ */}
        <AgentPanel show={nav === 'agent'} toast={toast} />

        {/* ══════════ TRANSACTIONS PANEL ══════════ */}
        <TransactionsPanel show={nav === 'transactions'} />

        {/* ══════════ WAGER PANEL ══════════ */}
        <WagerPanel show={nav === 'wager'} />

        {/* ══════════ GAME HISTORY PANEL ══════════ */}
        <GameHistoryPanel show={nav === 'history'} />

      </div>
    </div>
  );
}

/* ── Settings tab button ── */
function ProfTab({ id, label, icon, i18n, tab, setTab }) {
  return (
    <button className={'prof-tab' + (tab === id ? ' active' : '')} onClick={() => setTab(id)}>
      <span className="prof-tab-icon">{icon}</span> <span data-i18n={i18n}>{label}</span>
    </button>
  );
}

/* Reusable toggle preserving the original `.prof-toggle`/`.on` behaviour. */
function Toggle({ initialOn = false }) {
  const [on, setOn] = useState(initialOn);
  return <div className={'prof-toggle' + (on ? ' on' : '')} onClick={() => setOn((v) => !v)}></div>;
}

/* ── SECURITY TAB (live: verify email/mobile, change password, 2FA) ── */
function VerifyRow({ label, value, verified, onRequest, onConfirm }) {
  const { toast } = useUI();
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    try {
      const r = await onRequest();
      setSent(true);
      // MOCK provider returns the code so it's testable now.
      toast(r?.devCode ? `Code sent (dev): ${r.devCode}` : 'Verification code sent');
    } catch (e) { toast(e.message || 'Could not send code', 'error'); }
    finally { setBusy(false); }
  };
  const confirm = async () => {
    setBusy(true);
    try { await onConfirm(code.trim()); toast(`${label} verified`); setSent(false); setCode(''); }
    catch (e) { toast(e.message || 'Invalid code', 'error'); }
    finally { setBusy(false); }
  };

  return (
    <div className="prof-section">
      <div className="prof-section-title">{label} confirmation</div>
      <div className="prof-section-sub">Confirm your {label.toLowerCase()} to enable withdrawals</div>
      <div className="prof-email-row">
        <span className="prof-email-icon">{label === 'Email' ? '✉️' : '📱'}</span>
        <span className="prof-email-text">{value || '—'}</span>
        <div className="prof-email-status" style={{ background: verified ? 'var(--green,#22c55e)' : undefined }}>{verified ? '✓' : '!'}</div>
      </div>
      {!verified && !sent && (
        <button className="prof-resend-btn" onClick={send} disabled={busy}>{busy ? 'SENDING…' : 'SEND CODE'}</button>
      )}
      {!verified && sent && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code" maxLength={6}
            style={{ flex: 1, background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px' }} />
          <button className="prof-resend-btn" onClick={confirm} disabled={busy}>VERIFY</button>
        </div>
      )}
    </div>
  );
}

function ChangePassword() {
  const { toast } = useUI();
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const f = { width: '100%', background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8, padding: '11px 14px', marginBottom: 10, boxSizing: 'border-box' };

  const submit = async () => {
    if (next.length < 6) { toast('New password must be at least 6 characters', 'error'); return; }
    if (next !== confirm) { toast('Passwords do not match', 'error'); return; }
    setBusy(true);
    try {
      await playersService.changePassword(cur, next);
      toast('Password changed successfully', 'success');
      setCur(''); setNext(''); setConfirm('');
    } catch (e) { toast(e.message || 'Could not change password', 'error'); }
    finally { setBusy(false); }
  };

  return (
    <div className="prof-section">
      <div className="prof-section-title" data-i18n="auth_password">Change Password</div>
      <div className="prof-section-sub">Use at least 6 characters.</div>
      <input type="password" placeholder="Current password" value={cur} onChange={(e) => setCur(e.target.value)} style={f} />
      <input type="password" placeholder="New password" value={next} onChange={(e) => setNext(e.target.value)} style={f} />
      <input type="password" placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} style={f} />
      <button className="prof-save-btn" onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Update Password'}</button>
    </div>
  );
}

function SecurityTab({ show }) {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useUI();
  const [twoFA, setTwoFA] = useState(!!profile?.twoFactorEnabled);

  const toggle2fa = async () => {
    const enabled = !twoFA;
    setTwoFA(enabled);
    try { await playersService.setTwoFactor(enabled); await refreshProfile(); toast(`Two-factor ${enabled ? 'enabled' : 'disabled'}`); }
    catch (e) { setTwoFA(!enabled); toast(e.message || 'Could not update 2FA', 'error'); }
  };

  return (
    <div id="prof-tab-security" style={{ display: show ? 'block' : 'none' }}>
      <VerifyRow label="Email" value={profile?.email} verified={!!profile?.emailVerified}
        onRequest={playersService.requestEmailCode}
        onConfirm={async (c) => { await playersService.confirmEmailCode(c); await refreshProfile(); }} />

      <VerifyRow label="Mobile" value={profile?.phone} verified={!!profile?.mobileVerified}
        onRequest={playersService.requestMobileCode}
        onConfirm={async (c) => { await playersService.confirmMobileCode(c); await refreshProfile(); }} />

      <ChangePassword />

      <div className="prof-section">
        <div className="prof-section-title" data-i18n="prof_2fa">Two-factor Authentication</div>
        <div className="prof-section-sub" data-i18n="prof_2fa_desc">Adds an extra verification step for sensitive actions (optional).</div>
        <div className="prof-toggle-row">
          <div className="prof-toggle-info">
            <div className="prof-toggle-label" data-i18n="prof_2fa_enable">Enable Two-factor Authentication</div>
          </div>
          <div className={'prof-toggle' + (twoFA ? ' on' : '')} onClick={toggle2fa}></div>
        </div>
      </div>
    </div>
  );
}

/* ── PERSONAL TAB (live profile + KYC) ── */
function PersonalTab({ show, toast }) {
  const { profile, updateProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [busy, setBusy] = useState(false);

  useMemo(() => {
    setEmail(profile?.email || '');
    setMobile(profile?.phone || '');
  }, [profile?.email, profile?.phone]);

  const regDate = profile?.registrationDate
    ? new Date(profile.registrationDate).toLocaleDateString()
    : '—';

  const save = async () => {
    setBusy(true);
    try {
      await updateProfile({ email: email.trim(), mobile: mobile.trim() });
      toast('Profile updated!', 'success');
    } catch (e) {
      toast(e.message || 'Could not update profile', 'error');
    } finally { setBusy(false); }
  };

  const ro = { opacity: 0.7, cursor: 'not-allowed' };

  return (
    <div id="prof-tab-personal" style={{ display: show ? 'block' : 'none' }}>

      {/* Personal Info Form — Player ID / username / name / currency / reg date
          are system-fixed (read-only). Only email & mobile are editable. */}
      <div className="prof-section">
        <div className="prof-section-title" data-i18n="prof_personal">Personal Information</div>
        <div className="prof-section-sub" data-i18n="prof_personal_desc">Player ID, username, name, currency and registration date are fixed by the system.</div>
        <div className="prof-form-grid">
          <div className="prof-field"><label>Player ID</label><input type="text" value={profile?.playerCode || '—'} disabled style={ro} /></div>
          <div className="prof-field"><label data-i18n="auth_username_field">Username</label><input type="text" value={profile?.username || ''} disabled style={ro} /></div>
          <div className="prof-field"><label data-i18n="auth_full_name">Name</label><input type="text" value={profile?.fullName || [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || ''} disabled style={ro} /></div>
          <div className="prof-field"><label data-i18n="auth_email">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" /></div>
          <div className="prof-field"><label data-i18n="auth_phone">Mobile Number</label><input type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="+63 9XX XXX XXXX" /></div>
          <div className="prof-field"><label>Date of Birth</label><input type="text" value={profile?.dob || '—'} disabled style={ro} /></div>
          <div className="prof-field"><label>Currency</label><input type="text" value={profile?.currency || ''} disabled style={ro} /></div>
          <div className="prof-field"><label>Registration Date</label><input type="text" value={regDate} disabled style={ro} /></div>
        </div>
        <button className="prof-save-btn" onClick={save} disabled={busy} data-i18n="auth_save_changes">{busy ? 'Saving…' : 'Save Changes'}</button>
      </div>

      {/* KYC / Identity Verification */}
      <KycSection toast={toast} />
    </div>
  );
}

function KycSection({ toast }) {
  const { profile, refreshProfile } = useAuth();
  const status = profile?.kyc_status || 'unverified'; // unverified | pending | approved | rejected
  const [docType, setDocType] = useState('id');
  const [files, setFiles] = useState({ front: null, back: null, selfie: null }); // {name, url}
  const inputs = { front: useRef(null), back: useRef(null), selfie: useRef(null) };

  const LABELS = {
    id: { front: 'Front Side', back: 'Back Side', icon: '🪪' },
    passport: { front: 'Photo Page', back: 'Signature Page', icon: '📘' },
    license: { front: 'Front Side', back: 'Back Side', icon: '🚗' },
  };
  const l = LABELS[docType] || LABELS.id;

  const handleFile = (file, side) => {
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      toast('Only JPG and PNG files are accepted.', 'error'); return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast('File is too large. Maximum size is 10 MB.', 'error'); return;
    }
    const url = URL.createObjectURL(file);
    setFiles((f) => ({ ...f, [side]: { name: file.name, url } }));
  };
  const onChange = (e, side) => handleFile(e.target.files[0], side);
  const onDrop = (e, side) => { e.preventDefault(); handleFile(e.dataTransfer.files[0], side); };

  const [submitting, setSubmitting] = useState(false);
  const submit = async () => {
    if (!files.front || !files.back) {
      toast('Please upload both front and back sides of your document.', 'error'); return;
    }
    setSubmitting(true);
    try {
      // Upload the document images to Firebase Storage, then submit their URLs.
      const up = async (refEl) => {
        const f = refEl.current?.files?.[0];
        if (!f) return '';
        const r = await playersService.uploadFile(f, 'kyc');
        return r?.url || '';
      };
      const [frontUrl, backUrl, selfieUrl] = await Promise.all([
        up(inputs.front), up(inputs.back), up(inputs.selfie),
      ]);
      await playersService.submitKYC({ docType, frontUrl, backUrl, selfieUrl });
      await refreshProfile();
      toast('KYC documents submitted successfully!', 'success');
    } catch (e) {
      toast(e.message || 'Could not submit KYC. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const statusText = status === 'approved'
    ? '✓ Verified — your identity has been approved'
    : status === 'rejected'
      ? '✗ Rejected — please review and resubmit your documents'
      : status === 'pending'
        ? '⏳ Documents submitted — under review (24-48 hours)'
        : 'Not Verified — Submit your documents to enable withdrawals';

  return (
    <div className="kyc-section">
      <div className="prof-section-title" data-i18n="kyc_title">Identity Verification (KYC)</div>
      <div className="prof-section-sub" data-i18n="kyc_desc">Verify your identity to unlock withdrawals and higher limits</div>

      {/* Status bar */}
      <div className={'kyc-status-bar ' + status} id="kyc-status-bar">
        <span>🪪</span> <span id="kyc-status-text">{statusText}</span>
      </div>

      {/* Document type selector */}
      <div className="kyc-doc-type-tabs">
        <button className={'kyc-doc-tab' + (docType === 'id' ? ' active' : '')} onClick={() => setDocType('id')}>🪪 <span data-i18n="kyc_nat_id">National ID</span></button>
        <button className={'kyc-doc-tab' + (docType === 'passport' ? ' active' : '')} onClick={() => setDocType('passport')}>📘 <span data-i18n="kyc_passport">Passport</span></button>
        <button className={'kyc-doc-tab' + (docType === 'license' ? ' active' : '')} onClick={() => setDocType('license')}>🚗 <span data-i18n="kyc_license">Driver's License</span></button>
      </div>

      {/* Tips */}
      <div className="kyc-tips">
        <div className="kyc-tips-title">ℹ️ <span data-i18n="kyc_doc_req">Document Requirements</span></div>
        <ul>
          <li><span data-i18n="kyc_tip1">Photos must be clear, well-lit and all corners visible</span></li>
          <li><span data-i18n="kyc_tip2">Accepted formats: <strong>JPG, PNG</strong> · Max size: <strong>10 MB</strong> per file</span></li>
          <li><span data-i18n="kyc_tip3">Both front and back sides required for ID / Driver's License</span></li>
          <li><span data-i18n="kyc_tip4">Passport: photo page only needed</span></li>
          <li><span data-i18n="kyc_tip5">Document must be valid (not expired)</span></li>
        </ul>
      </div>

      {/* Upload boxes */}
      <div className="kyc-upload-grid">

        {/* Front */}
        <div className={'kyc-upload-box' + (files.front ? ' has-file' : '')} id="kyc-front-box" onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(e, 'front')}>
          <input type="file" accept=".jpg,.jpeg,.png" id="kyc-front-input" ref={inputs.front} onChange={(e) => onChange(e, 'front')} />
          <div className="kyc-upload-check">✓</div>
          <img className="kyc-upload-preview" id="kyc-front-preview" alt="Front" src={files.front?.url} style={{ display: files.front ? 'block' : 'none' }} />
          <span className="kyc-upload-icon" id="kyc-front-icon" style={{ display: files.front ? 'none' : '' }}>{l.icon}</span>
          <div className="kyc-upload-label" id="kyc-front-label" data-i18n="kyc_front">{l.front}</div>
          <div className="kyc-upload-sub" data-i18n="kyc_upload">Click to upload or drag &amp; drop</div>
          <div className="kyc-upload-formats">JPG · PNG</div>
          <div className="kyc-upload-filename" id="kyc-front-name">{files.front ? '✓ ' + files.front.name : ''}</div>
        </div>

        {/* Back */}
        <div className={'kyc-upload-box' + (files.back ? ' has-file' : '')} id="kyc-back-box" onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(e, 'back')}>
          <input type="file" accept=".jpg,.jpeg,.png" id="kyc-back-input" ref={inputs.back} onChange={(e) => onChange(e, 'back')} />
          <div className="kyc-upload-check">✓</div>
          <img className="kyc-upload-preview" id="kyc-back-preview" alt="Back" src={files.back?.url} style={{ display: files.back ? 'block' : 'none' }} />
          <span className="kyc-upload-icon" id="kyc-back-icon" style={{ display: files.back ? 'none' : '' }}>🔄</span>
          <div className="kyc-upload-label" id="kyc-back-label" data-i18n="kyc_back">{l.back}</div>
          <div className="kyc-upload-sub">Click to upload or drag &amp; drop</div>
          <div className="kyc-upload-formats">JPG · PNG</div>
          <div className="kyc-upload-filename" id="kyc-back-name">{files.back ? '✓ ' + files.back.name : ''}</div>
        </div>

      </div>

      {/* Selfie upload (full row) */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>Selfie with Document <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(Optional but speeds up verification)</span></div>
        <div className={'kyc-upload-box' + (files.selfie ? ' has-file' : '')} id="kyc-selfie-box" style={{ minHeight: 120, flexDirection: 'row', gap: 16 }} onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(e, 'selfie')}>
          <input type="file" accept=".jpg,.jpeg,.png" id="kyc-selfie-input" ref={inputs.selfie} onChange={(e) => onChange(e, 'selfie')} />
          <div className="kyc-upload-check">✓</div>
          <img className="kyc-upload-preview" id="kyc-selfie-preview" style={{ maxHeight: 80, width: 'auto', display: files.selfie ? 'block' : 'none' }} alt="Selfie" src={files.selfie?.url} />
          <span className="kyc-upload-icon" id="kyc-selfie-icon" style={{ display: files.selfie ? 'none' : '' }}>🤳</span>
          <div>
            <div className="kyc-upload-label" data-i18n="kyc_selfie_desc">Selfie holding your document</div>
            <div className="kyc-upload-sub">Click to upload or drag &amp; drop · JPG, PNG · Max 10MB</div>
            <div className="kyc-upload-filename" id="kyc-selfie-name">{files.selfie ? '✓ ' + files.selfie.name : ''}</div>
          </div>
        </div>
      </div>

      <button className="kyc-submit-btn" onClick={submit} disabled={submitting} style={submitting ? { opacity: 0.7 } : undefined} data-i18n="kyc_submit">{submitting ? 'Uploading…' : 'Submit for Verification'}</button>
    </div>
  );
}

/* ── BANK TAB ── */
function BankTab({ show, toast }) {
  const { profile, refreshProfile } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [bank, setBank] = useState('');
  const [bankLabel, setBankLabel] = useState('');
  const [acct, setAcct] = useState('');
  const [busy, setBusy] = useState(false);

  // Account holder must match the registered name — locked, not free-typed.
  const registeredName = (profile?.fullName || '').trim();

  const load = async () => {
    try {
      const rows = await playersService.getBankAccounts();
      setAccounts((rows || []).map((a) => ({
        name: a.holder || registeredName,
        bankLabel: a.bankName || a.bank || '',
        acct: a.accountNumber || a.number || '',
        isDefault: (a.status || 'active') === 'active',
      })));
    } catch { /* not logged in / offline */ }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (show) load(); }, [show, profile?.id]);

  // Players may save up to two bank accounts.
  const MAX_ACCOUNTS = 2;
  const hasMax = accounts.length >= MAX_ACCOUNTS;

  const save = async () => {
    if (!bank || !acct.trim()) { toast('Choose a bank and enter the account number.', 'warning'); return; }
    setBusy(true);
    try {
      await playersService.saveBankAccount({ bankName: bankLabel || bank, holder: registeredName, accountNumber: acct.trim() });
      setBank(''); setBankLabel(''); setAcct('');
      await load();
      await refreshProfile();
      toast('Bank account saved!', 'success');
    } catch (e) {
      toast(e.message || 'Could not save bank account.', 'error');
    } finally { setBusy(false); }
  };

  return (
    <div id="prof-tab-bank" style={{ display: show ? 'block' : 'none' }}>
      <div className="prof-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 20 }}>🏦</span>
          <div className="prof-section-title" style={{ margin: 0 }} data-i18n="prof_bank_account">Withdrawal Bank Account</div>
        </div>
        <div className="prof-section-sub" data-i18n="prof_bank_setup">Set up your payout account. Required before your first withdrawal.</div>
      </div>

      {/* Saved accounts list */}
      <div className="prof-section" style={{ paddingTop: 0 }}>
        <div id="bank-saved-list">
          {accounts.length === 0 ? (
            <div style={{ border: '1.5px dashed var(--border)', borderRadius: 12, padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }} data-i18n="prof_no_accounts">
              No withdrawal accounts saved yet. Add one below.
            </div>
          ) : accounts.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, background: 'rgba(240,192,64,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏦</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.bankLabel} · {a.acct}</div>
                </div>
              </div>
              {a.isDefault && <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', background: 'rgba(240,192,64,.15)', color: 'var(--gold)', borderRadius: 20, border: '1px solid rgba(240,192,64,.3)' }}>DEFAULT</span>}
            </div>
          ))}
        </div>

        {/* Add New Account form */}
        <div style={{ border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', background: 'var(--bg3)', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--gold)', fontSize: 18, fontWeight: 700 }}>＋</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }} data-i18n="prof_add_account">Add New Account</span>
          </div>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>

            <div className="prof-field-group">
              <label className="prof-label" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 7, display: 'block' }} data-i18n="prof_account_type">Account Type</label>
              <select className="prof-input" id="bank-name" value={bank}
                onChange={(e) => { setBank(e.target.value); setBankLabel(e.target.options[e.target.selectedIndex].text); }}
                style={{ background: 'var(--bg3)', color: 'var(--text)', borderRadius: 8, padding: '11px 14px', width: '100%', border: '1px solid var(--border)', fontSize: 14, outline: 'none' }}>
                <option value="">Select bank or e-wallet</option>
                <optgroup label="── Banks ──">
                  <option value="maybank">🏦 Maybank</option>
                  <option value="cimb">🏦 CIMB Bank</option>
                  <option value="rhb">🏦 RHB Bank</option>
                  <option value="public">🏦 Public Bank</option>
                  <option value="hongleong">🏦 Hong Leong Bank</option>
                  <option value="ambank">🏦 AmBank</option>
                  <option value="affin">🏦 Affin Bank</option>
                  <option value="bsn">🏦 BSN</option>
                  <option value="ocbc">🏦 OCBC Bank</option>
                  <option value="hsbc">🏦 HSBC Bank</option>
                  <option value="uob">🏦 UOB Bank</option>
                  <option value="alliance">🏦 Alliance Bank</option>
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

            <div className="prof-field-group">
              <label className="prof-label" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 7, display: 'block' }}>Account Holder Name <span style={{ color: 'var(--red)' }}>*</span></label>
              <input className="prof-input" type="text" value={registeredName} readOnly disabled
                style={{ width: '100%', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '11px 14px', color: 'var(--text)', fontSize: 14, outline: 'none', opacity: 0.7, cursor: 'not-allowed' }} />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Must match your registered name.</div>
            </div>

            <div className="prof-field-group">
              <label className="prof-label" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 7, display: 'block' }}>Account Number / Mobile <span style={{ color: 'var(--red)' }}>*</span></label>
              <input className="prof-input" type="text" placeholder="e.g. 0123456789" id="bank-account-number"
                value={acct} onChange={(e) => setAcct(e.target.value)}
                style={{ width: '100%', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '11px 14px', color: 'var(--text)', fontSize: 14, outline: 'none' }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--gold)'; }} onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }} />
            </div>

            {hasMax && (
              <div style={{ fontSize: 12, color: 'var(--gold)', background: 'rgba(240,192,64,.08)', border: '1px solid rgba(240,192,64,.2)', borderRadius: 8, padding: '10px 12px' }}>
                You already have {MAX_ACCOUNTS} withdrawal accounts (the maximum). Contact support to change one.
              </div>
            )}

            <button onClick={save} disabled={busy || hasMax} style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg,var(--gold),var(--gold-dark))', color: '#06091a', fontSize: 15, fontWeight: 800, border: 'none', borderRadius: 10, cursor: (busy || hasMax) ? 'not-allowed' : 'pointer', opacity: (busy || hasMax) ? 0.55 : 1, letterSpacing: '.04em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {busy ? 'Saving…' : '💾 Save Account'}
            </button>

            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              🔒 Encrypted · Used only for withdrawals
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── PROVABLY FAIR TAB ── */
function ProvablyTab({ show, toast }) {
  return (
    <div id="prof-tab-provably" style={{ display: show ? 'block' : 'none' }}>
      <div className="prof-section">
        <div className="prof-section-title" data-i18n="prof_provably">Provably Fair</div>
        <div className="prof-section-sub" data-i18n="prof_provably_desc">Verify game results using cryptographic seeds</div>
        <div className="prof-field" style={{ marginBottom: 14 }}><label data-i18n="prof_client_seed">Client Seed</label><input type="text" defaultValue="7f3a9b2c1e4d8f6a" readOnly /></div>
        <div className="prof-field" style={{ marginBottom: 14 }}><label data-i18n="prof_server_seed">Server Seed (Hashed)</label><input type="text" defaultValue="a1b2c3d4e5f67890..." readOnly /></div>
        <button className="prof-save-btn" onClick={() => toast('Seeds rotated!', 'success')} data-i18n="prof_rotate_seeds">Rotate Seeds</button>
      </div>
    </div>
  );
}

/* ── RESTRICTIONS TAB ── */
function RestrictionsTab({ show, toast }) {
  return (
    <div id="prof-tab-restrictions" style={{ display: show ? 'block' : 'none' }}>
      <div className="prof-section">
        <div className="prof-section-title" data-i18n="prof_responsible">Responsible Gaming</div>
        <div className="prof-section-sub" data-i18n="prof_responsible_desc">Set limits to manage your gaming activity</div>
        <div className="prof-form-grid">
          <div className="prof-field"><label data-i18n="prof_daily_limit">Daily Deposit Limit (₱)</label><input type="number" placeholder="No limit" /></div>
          <div className="prof-field"><label data-i18n="prof_weekly_limit">Weekly Deposit Limit (₱)</label><input type="number" placeholder="No limit" /></div>
          <div className="prof-field"><label data-i18n="prof_monthly_limit">Monthly Deposit Limit (₱)</label><input type="number" placeholder="No limit" /></div>
          <div className="prof-field"><label data-i18n="prof_session_limit">Session Time Limit (hours)</label><input type="number" placeholder="No limit" /></div>
        </div>
        <div className="prof-toggle-row" style={{ marginTop: 16 }}>
          <div className="prof-toggle-info">
            <div className="prof-toggle-label" data-i18n="prof_self_excl">Self-exclusion</div>
            <div className="prof-toggle-desc" data-i18n="prof_self_excl_desc">Temporarily disable your account</div>
          </div>
          <Toggle />
        </div>
        <button className="prof-save-btn" onClick={() => toast('Limits saved!', 'success')} data-i18n="prof_save_limits">Save Limits</button>
      </div>
    </div>
  );
}

/* ── CUSTOMIZATION TAB ── */
function CustomizationTab({ show }) {
  return (
    <div id="prof-tab-customization" style={{ display: show ? 'block' : 'none' }}>
      <div className="prof-section">
        <div className="prof-section-title" data-i18n="prof_display">Display Preferences</div>
        <div className="prof-section-sub" data-i18n="prof_display_desc">Customize your gaming experience</div>
        <div className="prof-toggle-row">
          <div className="prof-toggle-info">
            <div className="prof-toggle-label" data-i18n="prof_show_balance">Show balance in header</div>
          </div>
          <Toggle initialOn />
        </div>
        <div className="prof-toggle-row">
          <div className="prof-toggle-info">
            <div className="prof-toggle-label" data-i18n="prof_animations">Enable animations</div>
          </div>
          <Toggle initialOn />
        </div>
        <div className="prof-toggle-row">
          <div className="prof-toggle-info">
            <div className="prof-toggle-label" data-i18n="prof_sound">Sound effects</div>
          </div>
          <Toggle initialOn />
        </div>
        <div className="prof-toggle-row">
          <div className="prof-toggle-info">
            <div className="prof-toggle-label" data-i18n="prof_chat_notif">Live chat notifications</div>
          </div>
          <Toggle />
        </div>
      </div>
    </div>
  );
}

/* ════════════ TRANSACTIONS PANEL ════════════ */
function TransactionsPanel({ show }) {
  const [filter, setFilter] = useState('all');
  const rows = useMemo(() => (filter === 'all' ? TX_DEMO : TX_DEMO.filter((t) => t.type === filter)), [filter]);
  const totalIn = rows.filter((r) => r.amount > 0).reduce((s, r) => s + r.amount, 0);
  const totalOut = rows.filter((r) => r.amount < 0).reduce((s, r) => s + r.amount, 0);
  const net = totalIn + totalOut;

  const FILTERS = [
    ['all', 'All', 'tx_all'], ['deposit', 'Deposits', 'tx_deposits'], ['withdrawal', 'Withdrawals', 'tx_withdrawals'],
    ['rebate', 'Rebate', 'tx_rebate'], ['cashback', 'Cashback', 'tx_cashback'], ['promotion', 'Promotion', 'tx_promotion'],
    ['referral', 'Referral', 'tx_referral'],
  ];

  return (
    <div id="prof-tx-panel" style={{ display: show ? 'block' : 'none', flex: 1, minWidth: 0, background: 'var(--surface)', borderRadius: 16, overflow: 'hidden', padding: 28 }}>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }} id="tx-filter-tabs">
        {FILTERS.map(([k, label, i18n]) => (
          <button key={k} className={'cat-btn' + (filter === k ? ' active' : '')} onClick={() => setFilter(k)} data-i18n={i18n}>{label}</button>
        ))}
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }} id="tx-summary">
        <div style={{ background: 'var(--bg3)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }} data-i18n="tx_total_in">Total In</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#4ade80' }}>+{peso(totalIn, 2)}</div>
        </div>
        <div style={{ background: 'var(--bg3)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }} data-i18n="tx_total_out">Total Out</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#f87171' }}>{totalOut ? '-' + peso(Math.abs(totalOut), 2) : '₱0.00'}</div>
        </div>
        <div style={{ background: 'var(--bg3)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }} data-i18n="tx_net">Net</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: net >= 0 ? 'var(--gold)' : '#f87171' }}>{(net >= 0 ? '+' : '') + peso(net, 2)}</div>
        </div>
      </div>

      {/* Transactions Table (desktop) */}
      <div style={{ overflowX: 'auto' }} id="tx-table-wrap">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }} id="tx-table">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em' }} data-i18n="tx_col_date">Date</th>
              <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em' }} data-i18n="tx_col_type">Type</th>
              <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em' }} data-i18n="tx_col_desc">Description</th>
              <th style={{ textAlign: 'right', padding: '10px 12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em' }} data-i18n="tx_col_amount">Amount</th>
              <th style={{ textAlign: 'center', padding: '10px 12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em' }} data-i18n="tx_col_status">Status</th>
            </tr>
          </thead>
          <tbody id="tx-tbody">
            {rows.map((tx, i) => {
              const ts = TX_TYPE_STYLE[tx.type] || { icon: '↔️', color: '#aaa', label: tx.type };
              const ss = TX_STATUS_STYLE[tx.status] || { color: '#aaa', label: tx.status };
              const amtColor = tx.amount > 0 ? '#4ade80' : '#f87171';
              const amtSign = tx.amount > 0 ? '+' : '';
              return (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                  <td style={{ padding: 12, color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>{tx.date}</td>
                  <td style={{ padding: 12 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: ts.color + '18', color: ts.color }}>
                      {ts.icon} {ts.label}
                    </span>
                  </td>
                  <td style={{ padding: 12, color: 'var(--text)' }}>{tx.desc}</td>
                  <td style={{ padding: 12, textAlign: 'right', fontWeight: 800, fontSize: 14, color: amtColor, whiteSpace: 'nowrap' }}>{amtSign}₱{Math.abs(tx.amount).toLocaleString('en', { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: 12, textAlign: 'center' }}>
                    <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: ss.color + '18', color: ss.color }}>{ss.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Card list (H5) */}
      <div id="tx-cards">
        {rows.map((tx, i) => {
          const ts = TX_TYPE_STYLE[tx.type] || { icon: '↔️', color: '#aaa', label: tx.type };
          const ss = TX_STATUS_STYLE[tx.status] || { color: '#aaa', label: tx.status };
          const amtColor = tx.amount > 0 ? '#4ade80' : '#f87171';
          const amtSign = tx.amount > 0 ? '+' : '-';
          return (
            <div className="gh-card" key={i}>
              <div className="gh-card-head">
                <span className="gh-card-game">{tx.desc}</span>
                <span className="gh-card-pl" style={{ color: amtColor }}>{amtSign}₱{Math.abs(tx.amount).toLocaleString('en', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="gh-card-body">
                <div className="gh-card-row">
                  <span className="gh-card-label" data-i18n="tx_col_type">Type</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: ts.color + '18', color: ts.color }}>{ts.icon} {ts.label}</span>
                </div>
                <div className="gh-card-row">
                  <span className="gh-card-label" data-i18n="tx_col_status">Status</span>
                  <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: ss.color + '18', color: ss.color }}>{ss.label}</span>
                </div>
                <div className="gh-card-date">{tx.date}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div id="tx-empty" style={{ display: rows.length === 0 ? 'block' : 'none', textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 14 }}>No transactions found.</div>
    </div>
  );
}

/* ════════════ WAGER PANEL ════════════ */
function WagerPanel({ show }) {
  const d = WAGER_DATA;
  const required = d.bonusAmount * d.multiplier;
  const pct = Math.min(100, (d.wagered / required) * 100);
  const remaining = Math.max(0, required - d.wagered);
  const pctStr = pct.toFixed(1) + '%';

  return (
    <div id="prof-wager-panel" style={{ display: show ? 'block' : 'none', flex: 1, minWidth: 0, background: 'var(--surface)', borderRadius: 16, overflow: 'hidden', padding: 28 }}>

      {/* Active Promotion Banner */}
      <div id="wager-promo-banner" style={{ background: 'linear-gradient(135deg,#1a2a0a,#1e3a10)', border: '1px solid rgba(74,222,128,.2)', borderRadius: 12, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 28 }}>🎁</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#4ade80', marginBottom: 2 }} id="wager-promo-name" data-i18n="wager_promo_active">200% Welcome Bonus Active</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }} data-i18n="wager_unlock_desc">Complete wagering requirement to unlock withdrawal</div>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 2 }} data-i18n="wager_bonus_amount">Bonus Amount</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#4ade80' }}>+₱4,000.00</div>
        </div>
      </div>

      {/* Wager Progress */}
      <div style={{ background: 'var(--bg3)', borderRadius: 14, padding: 22, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 4 }} data-i18n="wager_progress">Wagering Progress</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)' }} id="wager-pct-label">{pctStr}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }} data-i18n="wager_wagered_required">Wagered / Required</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--gold)' }}><span id="wager-done">{peso(d.wagered)}</span> / <span id="wager-total">{peso(required)}</span></div>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ height: 12, background: 'rgba(255,255,255,.08)', borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
          <div id="wager-bar" style={{ height: '100%', width: pctStr, background: 'linear-gradient(90deg,var(--gold),#f97316)', borderRadius: 10, transition: 'width 1s ease', position: 'relative' }}>
            <div style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', fontSize: 9, fontWeight: 800, color: '#06091a' }}>{pctStr}</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
          <span>₱0</span>
          <span id="wager-remaining-label" style={{ color: 'rgba(255,165,0,.7)' }}>{peso(remaining)} remaining</span>
          <span id="wager-total-label">{peso(required)}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        <div style={{ background: 'var(--bg3)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>🎰</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }} data-i18n="wager_total_wagered">Wagered</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>₱7,360.00</div>
        </div>
        <div style={{ background: 'var(--bg3)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>🎯</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }} data-i18n="wager_requirement">Requirement</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--gold)' }}>20× <span data-i18n="wager_bonus_word">Bonus</span></div>
        </div>
        <div style={{ background: 'var(--bg3)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>💸</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }} data-i18n="wager_still_needed">Still Needed</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#f87171' }}>₱12,640.00</div>
        </div>
      </div>

      {/* Auto-reset notice */}
      <div style={{ background: 'rgba(251,191,36,.06)', border: '1px solid rgba(251,191,36,.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ fontSize: 20, flexShrink: 0 }}>⚠️</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', marginBottom: 4 }} data-i18n="wager_autoreset">Auto-Reset Rule</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', lineHeight: 1.6 }}><span data-i18n="wager_reset_p1">If your wallet balance reaches</span> <strong style={{ color: '#fbbf24' }} data-i18n="wager_reset_b1">₱1.00 or less</strong><span data-i18n="wager_reset_p2">, all active wagering requirements will</span> <strong style={{ color: '#fbbf24' }} data-i18n="wager_reset_b2">automatically reset</strong> <span data-i18n="wager_reset_p3">and your bonus will be cleared. Keep your balance above ₱1 to protect your progress.</span></div>
        </div>
      </div>

      {/* Active Bonuses taken */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }} data-i18n="wager_promos_taken">Promotions Taken</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} id="wager-promo-list">
          {d.promos.map((p, i) => {
            const pt = PTYPE[p.type] || { icon: '🎁', color: '#fbbf24' };
            const pPct = Math.min(100, (p.wagered / p.required) * 100);
            const isActive = p.status === 'active';
            return (
              <div key={i} style={{ background: 'var(--bg3)', borderRadius: 12, padding: '14px 16px', border: '1px solid ' + (isActive ? 'rgba(74,222,128,.2)' : 'rgba(255,255,255,.06)') }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isActive ? 10 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: 22 }}>{pt.icon}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.date} · {p.multiplier}× requirement · <span style={{ color: pt.color }}>+₱{p.amount.toLocaleString()}</span></div>
                    </div>
                  </div>
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: isActive ? 'rgba(74,222,128,.15)' : 'rgba(100,100,100,.15)', color: isActive ? '#4ade80' : '#888' }}>{isActive ? '🟢 Active' : '✅ Done'}</span>
                </div>
                {isActive && (
                  <>
                    <div style={{ height: 6, background: 'rgba(255,255,255,.08)', borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: pPct.toFixed(1) + '%', background: 'linear-gradient(90deg,' + pt.color + ',' + pt.color + '88)', borderRadius: 6 }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                      <span>₱{p.wagered.toLocaleString()} wagered</span><span>₱{p.required.toLocaleString()} required</span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ════════════ GAME HISTORY PANEL ════════════ */
function GameHistoryPanel({ show }) {
  const [search, setSearch] = useState('');
  const [dateFilt, setDateFilt] = useState('all');
  const [provFilt, setProvFilt] = useState('all');
  const [resFilt, setResFilt] = useState('all');

  const rows = useMemo(() => {
    const now = new Date('2025-06-10');
    const todayStr = '2025-06-10';
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7);
    const monthStart = new Date(now); monthStart.setDate(now.getDate() - 30);
    let r = GH_DEMO;
    if (dateFilt === 'today') r = r.filter((x) => x.date.startsWith(todayStr));
    else if (dateFilt === 'week') r = r.filter((x) => new Date(x.date.substring(0, 10)) >= weekStart);
    else if (dateFilt === 'month') r = r.filter((x) => new Date(x.date.substring(0, 10)) >= monthStart);
    if (provFilt !== 'all') r = r.filter((x) => x.provider === provFilt);
    if (resFilt === 'win') r = r.filter((x) => x.win - x.wager > 0);
    else if (resFilt === 'loss') r = r.filter((x) => x.win - x.wager < 0);
    else if (resFilt === 'break') r = r.filter((x) => x.win - x.wager === 0);
    const s = search.toLowerCase();
    if (s) r = r.filter((x) => x.game.toLowerCase().includes(s) || x.provider.toLowerCase().includes(s) || x.id.toLowerCase().includes(s));
    return r;
  }, [search, dateFilt, provFilt, resFilt]);

  const totalW = rows.reduce((s, r) => s + r.wager, 0);
  const totalWin = rows.reduce((s, r) => s + r.win, 0);
  const netPL = totalWin - totalW;

  const selStyle = { padding: '7px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', outline: 'none', cursor: 'pointer' };
  const onFocusGold = (e) => { e.target.style.borderColor = 'var(--gold)'; };
  const onBlurBorder = (e) => { e.target.style.borderColor = 'var(--border)'; };

  return (
    <div id="prof-history-panel" style={{ display: show ? 'block' : 'none', flex: 1, minWidth: 0, background: 'var(--surface)', borderRadius: 16, overflow: 'hidden', padding: 28 }}>

      {/* Header + Search */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>🎮 <span data-i18n="gh_title">Game History</span></div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }} data-i18n="gh_subtitle">Your recent wagering activity per game</div>
        </div>
        <input type="text" id="gh-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search game or provider..." data-i18n-placeholder="gh_search_ph" style={{ padding: '8px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, fontFamily: 'inherit', outline: 'none', width: 220 }} onFocus={onFocusGold} onBlur={onBlurBorder} />
      </div>

      {/* Filter dropdowns */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }} id="gh-filter-tabs">
        <select id="gh-filter-date" value={dateFilt} onChange={(e) => setDateFilt(e.target.value)} style={selStyle} onFocus={onFocusGold} onBlur={onBlurBorder}>
          <option value="all" data-i18n="gh_all_dates">📅 All Dates</option>
          <option value="today" data-i18n="gh_today">Today</option>
          <option value="week" data-i18n="gh_this_week">This Week</option>
          <option value="month" data-i18n="gh_this_month">This Month</option>
        </select>
        <select id="gh-filter-provider" value={provFilt} onChange={(e) => setProvFilt(e.target.value)} style={selStyle} onFocus={onFocusGold} onBlur={onBlurBorder}>
          <option value="all" data-i18n="gh_all_providers">🏢 All Providers</option>
          <option value="Pragmatic Play">Pragmatic Play</option>
          <option value="Evolution">Evolution</option>
          <option value="1xBet Sports">1xBet Sports</option>
          <option value="Spribe">Spribe</option>
          <option value="IGS">IGS</option>
          <option value="Jili">Jili</option>
        </select>
        <select id="gh-filter-result" value={resFilt} onChange={(e) => setResFilt(e.target.value)} style={selStyle} onFocus={onFocusGold} onBlur={onBlurBorder}>
          <option value="all" data-i18n="gh_win_loss">🏆 Win / Loss</option>
          <option value="win" data-i18n="gh_win">✅ Win</option>
          <option value="loss" data-i18n="gh_loss">❌ Loss</option>
          <option value="break" data-i18n="gh_break">➖ Break Even</option>
        </select>
      </div>

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 18 }} id="gh-summary">
        <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }} data-i18n="gh_total_bets">Total Bets</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }} id="gh-total-bets">{rows.length}</div>
        </div>
        <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }} data-i18n="gh_total_wagered">Total Wagered</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--gold)' }} id="gh-total-wagered">{peso(totalW)}</div>
        </div>
        <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }} data-i18n="gh_total_win">Total Win</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#4ade80' }} id="gh-total-win">{peso(totalWin)}</div>
        </div>
        <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }} data-i18n="gh_net_pl">Net P&amp;L</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: netPL >= 0 ? '#4ade80' : '#f87171' }} id="gh-net-pl">{(netPL >= 0 ? '+' : '') + peso(netPL)}</div>
        </div>
      </div>

      {/* Table (desktop) */}
      <div style={{ overflowX: 'auto' }} id="gh-table-wrap">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 640 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ textAlign: 'left', padding: '9px 12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em' }} data-i18n="gh_col_id">Game ID</th>
              <th style={{ textAlign: 'left', padding: '9px 12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em' }} data-i18n="gh_col_game">Game</th>
              <th style={{ textAlign: 'left', padding: '9px 12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em' }} data-i18n="gh_col_provider">Provider</th>
              <th style={{ textAlign: 'right', padding: '9px 12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em' }} data-i18n="gh_col_wager">Wager</th>
              <th style={{ textAlign: 'right', padding: '9px 12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em' }} data-i18n="gh_col_win">Win</th>
              <th style={{ textAlign: 'right', padding: '9px 12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em' }} data-i18n="gh_col_pl">P&amp;L</th>
              <th style={{ textAlign: 'left', padding: '9px 12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em' }} data-i18n="gh_col_date">Date</th>
            </tr>
          </thead>
          <tbody id="gh-tbody">
            {rows.map((r) => {
              const pl = r.win - r.wager;
              const plColor = pl > 0 ? '#4ade80' : pl < 0 ? '#f87171' : '#aaa';
              const plText = (pl >= 0 ? '+' : '') + '₱' + Math.abs(pl).toLocaleString('en', { minimumFractionDigits: 0 });
              return (
                <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                  <td style={{ padding: '11px 12px', fontSize: 11, color: 'rgba(255,255,255,.4)', fontFamily: 'monospace' }}>{r.id}</td>
                  <td style={{ padding: '11px 12px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>{r.game}</td>
                  <td style={{ padding: '11px 12px', fontSize: 12, color: 'var(--text-muted)' }}>{r.provider}</td>
                  <td style={{ padding: '11px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--text-muted)' }}>₱{r.wager.toLocaleString()}</td>
                  <td style={{ padding: '11px 12px', textAlign: 'right', fontWeight: 700, color: r.win > 0 ? '#4ade80' : 'rgba(255,255,255,.3)' }}>₱{r.win.toLocaleString()}</td>
                  <td style={{ padding: '11px 12px', textAlign: 'right', fontWeight: 800, color: plColor }}>{plText}</td>
                  <td style={{ padding: '11px 12px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{r.date}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Card list (H5) */}
      <div id="gh-cards">
        {rows.map((r) => {
          const pl = r.win - r.wager;
          const plColor = pl > 0 ? '#4ade80' : pl < 0 ? '#f87171' : '#aaa';
          const plText = (pl >= 0 ? '+' : '') + '₱' + Math.abs(pl).toLocaleString('en', { minimumFractionDigits: 0 });
          return (
            <div className="gh-card" key={r.id}>
              <div className="gh-card-head">
                <span className="gh-card-game">{r.game}</span>
                <span className="gh-card-pl" style={{ color: plColor }}>{plText}</span>
              </div>
              <div className="gh-card-body">
                <div className="gh-card-row"><span className="gh-card-label" data-i18n="gh_col_id">Game ID</span><span className="gh-card-id">{r.id}</span></div>
                <div className="gh-card-row"><span className="gh-card-label" data-i18n="gh_col_provider">Provider</span><span>{r.provider}</span></div>
                <div className="gh-card-row">
                  <span><span className="gh-card-label" data-i18n="gh_col_wager">Wager</span> <b style={{ color: 'var(--text)' }}>₱{r.wager.toLocaleString()}</b></span>
                  <span><span className="gh-card-label" data-i18n="gh_col_win">Win</span> <b style={{ color: r.win > 0 ? '#4ade80' : 'rgba(255,255,255,.35)' }}>₱{r.win.toLocaleString()}</b></span>
                </div>
                <div className="gh-card-date">{r.date}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div id="gh-empty" style={{ display: rows.length === 0 ? 'block' : 'none', textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 14 }}>No game history found.</div>
    </div>
  );
}

/* ════════════ AGENT PANEL ════════════ */
function AgentPanel({ show, toast }) {
  const { profile } = useAuth();
  const [status, setStatus] = useState('none'); // none | pending | approved
  const code = 'AGENT88';

  // Agent details & referral link are gated behind a verified account: the
  // player must have an APPROVED KYC before they can apply, view, or share any
  // agent information. Until then we show a locked notice that points them to
  // the Identity Verification (KYC) section.
  const kycApproved = (profile?.kyc_status || 'unverified') === 'approved';

  if (!kycApproved) {
    return (
      <div id="prof-agent-panel" style={{ display: show ? 'block' : 'none', flex: 1, minWidth: 0, background: 'var(--surface)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '56px 32px', textAlign: 'center', minHeight: 420 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(240,192,64,.12)', border: '2px solid rgba(240,192,64,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, marginBottom: 20 }}>🔒</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 8 }} data-i18n="agent_locked_title">Agent Program Locked</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', maxWidth: 360, lineHeight: 1.6, marginBottom: 24 }} data-i18n="agent_locked_desc">
            Complete and pass identity verification (KYC) before you can apply for the Agent program or view your agent details and referral link.
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>
            <span data-i18n="agent_locked_status">KYC status:</span>{' '}
            <b style={{ color: profile?.kyc_status === 'pending' ? 'var(--gold,#f0c040)' : profile?.kyc_status === 'rejected' ? 'var(--red,#e8293a)' : 'rgba(255,255,255,.6)' }}>
              {(profile?.kyc_status || 'unverified').toUpperCase()}
            </b>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="prof-agent-panel" style={{ display: show ? 'block' : 'none', flex: 1, minWidth: 0, background: 'var(--surface)', borderRadius: 16, overflow: 'hidden' }}>

      {/* APPLY SCREEN (shown when not approved) */}
      <div id="ag-apply-screen" style={{ display: status === 'approved' ? 'none' : 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 32px', textAlign: 'center', minHeight: 420 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(240,192,64,.12)', border: '2px solid rgba(240,192,64,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, marginBottom: 20 }}>🧑‍💼</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 8 }} data-i18n="agent_title">Become an Agent</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', maxWidth: 340, lineHeight: 1.6, marginBottom: 28 }} data-i18n="agent_subtitle">Join our Profit Share Program and earn commissions on every player you refer. Fill in the form below to apply.</div>

        <AgentApplyForm show={status === 'none'} toast={toast} onSubmit={() => setStatus('pending')} />
        <AgentPendingScreen show={status === 'pending'} onApprove={() => { setStatus('approved'); toast('🎉 Agent account approved!', 'success'); }} />
      </div>

      {/* DASHBOARD SCREEN (shown when approved) */}
      <AgentDashboard show={status === 'approved'} code={code} toast={toast} />
    </div>
  );
}

function AgentField({ label, required, children }) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'rgba(255,255,255,.4)', display: 'block', marginBottom: 6 }}>
        {label}{required && <> <span style={{ color: 'var(--red)', fontSize: 10 }}>*</span></>}
      </label>
      {children}
    </div>
  );
}

const agInputStyle = { width: '100%', padding: '11px 14px', background: 'var(--bg3)', border: '1.5px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: 14, fontFamily: 'inherit', outline: 'none' };
const agFocus = (e) => { e.target.style.borderColor = 'var(--gold)'; };
const agBlur = (e) => { e.target.style.borderColor = 'var(--border)'; };

function AgentApplyForm({ show, toast, onSubmit }) {
  const utilRef = useRef(null);
  const doc2Ref = useRef(null);
  const [util, setUtil] = useState(null);
  const [doc2, setDoc2] = useState(null);
  const fields = useRef({});

  const handleFile = (e, key, setter) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast('File too large. Max 10MB.', 'error'); e.target.value = ''; return; }
    setter(file.name);
  };

  const submit = () => {
    const f = fields.current;
    if (!f.name?.value.trim() || !f.phone?.value.trim() || !f.method?.value || !f.volume?.value) {
      toast('Please fill in all required fields.', 'error'); return;
    }
    if (!util) { toast('Please upload your Utility Bill.', 'error'); return; }
    if (!doc2) { toast('Please upload your Supporting Document.', 'error'); return; }
    if (!f.ecName?.value.trim() || !f.ecPhone?.value.trim()) { toast('Please fill in Emergency Contact details.', 'error'); return; }
    onSubmit();
    toast('Application submitted! Under review.', 'success');
  };

  const UploadBox = ({ id, inputRef, accept, icon, fname, onChange }) => (
    <label id={id + '-box'} htmlFor={id + '-input'} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '18px 14px', border: '1.5px dashed ' + (fname ? 'rgba(34,197,94,.5)' : 'rgba(255,255,255,.15)'), borderRadius: 10, cursor: 'pointer', background: fname ? 'rgba(34,197,94,.06)' : 'rgba(255,255,255,.03)', transition: 'border-color .2s' }}>
      <input type="file" id={id + '-input'} ref={inputRef} accept={accept} style={{ display: 'none' }} onChange={onChange} />
      <span id={id + '-icon'} style={{ fontSize: 24 }}>{fname ? '✅' : icon}</span>
      <span id={id + '-label'} style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.5)' }} data-i18n="agent_click_upload">{fname ? 'File selected' : 'Click to upload'}</span>
      <span id={id + '-fname'} style={{ fontSize: 11, color: 'var(--gold)', display: fname ? 'block' : 'none' }}>{fname}</span>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,.25)' }}>JPG · PNG · PDF · Max 10MB</span>
    </label>
  );

  return (
    <div id="ag-apply-form" style={{ display: show ? 'block' : 'none', width: '100%', maxWidth: 380, textAlign: 'left' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
        <AgentField label="Full Name">
          <input ref={(el) => (fields.current.name = el)} id="ag-apply-name" type="text" placeholder="Your full name" data-i18n-placeholder="agent_name_ph" style={agInputStyle} onFocus={agFocus} onBlur={agBlur} />
        </AgentField>
        <AgentField label="Contact Number">
          <input ref={(el) => (fields.current.phone = el)} id="ag-apply-phone" type="tel" placeholder="+63 9XX XXX XXXX" style={agInputStyle} onFocus={agFocus} onBlur={agBlur} />
        </AgentField>
        <AgentField label="How will you refer players?">
          <select ref={(el) => (fields.current.method = el)} id="ag-apply-method" defaultValue="" style={{ ...agInputStyle, cursor: 'pointer' }} onFocus={agFocus} onBlur={agBlur}>
            <option value="" data-i18n="agent_select_method">Select a method</option>
            <option>Social Media (Facebook, TikTok, etc.)</option>
            <option>Personal Network / Friends</option>
            <option>Online Communities / Groups</option>
            <option>Streaming / Content Creation</option>
            <option>Other</option>
          </select>
        </AgentField>
        <AgentField label="Expected Monthly Players">
          <select ref={(el) => (fields.current.volume = el)} id="ag-apply-volume" defaultValue="" style={{ ...agInputStyle, cursor: 'pointer' }} onFocus={agFocus} onBlur={agBlur}>
            <option value="" data-i18n="agent_select_range">Select range</option>
            <option>1 – 10 players</option>
            <option>11 – 50 players</option>
            <option>51 – 200 players</option>
            <option>200+ players</option>
          </select>
        </AgentField>

        {/* DIVIDER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.08)' }}></div>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(255,255,255,.3)' }} data-i18n="agent_docs">Documents Required</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.08)' }}></div>
        </div>

        {/* Utility Bill Upload */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'rgba(255,255,255,.4)', display: 'block', marginBottom: 4 }}><span data-i18n="agent_util_bill">Utility Bill</span> <span style={{ color: 'var(--red)', fontSize: 10 }}>*</span></label>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginBottom: 8 }} data-i18n="agent_util_desc">Electricity, water, or internet bill — must show your name &amp; address (issued within 3 months)</div>
          <UploadBox id="ag-util" inputRef={utilRef} accept=".jpg,.jpeg,.png,.pdf" icon="🧾" fname={util} onChange={(e) => handleFile(e, 'util', setUtil)} />
        </div>

        {/* Second Document Upload */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'rgba(255,255,255,.4)', display: 'block', marginBottom: 4 }}><span data-i18n="agent_support_doc">Supporting Document</span> <span style={{ color: 'var(--red)', fontSize: 10 }}>*</span></label>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginBottom: 8 }} data-i18n="agent_support_desc">Bank statement, government-issued ID, or lease agreement (issued within 6 months)</div>
          <UploadBox id="ag-doc2" inputRef={doc2Ref} accept=".jpg,.jpeg,.png,.pdf" icon="📄" fname={doc2} onChange={(e) => handleFile(e, 'doc2', setDoc2)} />
        </div>

        {/* DIVIDER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.08)' }}></div>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(255,255,255,.3)' }} data-i18n="agent_emergency">Emergency Contact</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,.08)' }}></div>
        </div>

        {/* Emergency Contact Name */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'rgba(255,255,255,.4)', display: 'block', marginBottom: 6 }}><span data-i18n="agent_ec_name">Emergency Contact Name</span> <span style={{ color: 'var(--red)', fontSize: 10 }}>*</span></label>
          <input ref={(el) => (fields.current.ecName = el)} id="ag-ec-name" type="text" placeholder="Full name" data-i18n-placeholder="agent_full_name_ph" style={agInputStyle} onFocus={agFocus} onBlur={agBlur} />
        </div>

        {/* Emergency Contact Relationship */}
        <AgentField label="Relationship">
          <select id="ag-ec-rel" defaultValue="" style={{ ...agInputStyle, cursor: 'pointer' }} onFocus={agFocus} onBlur={agBlur}>
            <option value="" data-i18n="agent_select_rel">Select relationship</option>
            <option data-i18n="agent_rel_spouse">Spouse / Partner</option>
            <option data-i18n="agent_rel_parent">Parent</option>
            <option data-i18n="agent_rel_sibling">Sibling</option>
            <option data-i18n="agent_rel_child">Child</option>
            <option data-i18n="agent_rel_friend">Friend</option>
            <option data-i18n="agent_rel_other">Other</option>
          </select>
        </AgentField>

        {/* Emergency Contact Number */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'rgba(255,255,255,.4)', display: 'block', marginBottom: 6 }}><span data-i18n="agent_ec_number">Emergency Contact Number</span> <span style={{ color: 'var(--red)', fontSize: 10 }}>*</span></label>
          <input ref={(el) => (fields.current.ecPhone = el)} id="ag-ec-phone" type="tel" placeholder="+63 9XX XXX XXXX" style={agInputStyle} onFocus={agFocus} onBlur={agBlur} />
        </div>
      </div>{/* /fields */}
      <button onClick={submit} style={{ width: '100%', padding: 13, background: 'linear-gradient(135deg,var(--gold),var(--gold-dark))', border: 'none', borderRadius: 10, color: '#06091a', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '.03em', transition: 'opacity .2s' }} data-i18n="agent_submit">SUBMIT APPLICATION</button>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', textAlign: 'center', marginTop: 10 }} data-i18n="agent_terms_agree">By applying you agree to our Agent Terms &amp; Conditions</div>
    </div>
  );
}

function AgentPendingScreen({ show, onApprove }) {
  return (
    <div id="ag-pending-screen" style={{ display: show ? 'flex' : 'none', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(249,115,22,.12)', border: '2px solid rgba(249,115,22,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>⏳</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }} data-i18n="agent_submitted">Application Submitted!</div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', maxWidth: 300, lineHeight: 1.6, textAlign: 'center' }}>Your application is under review. We'll notify you within 24–48 hours once approved.</div>
      <div style={{ background: 'rgba(249,115,22,.1)', border: '1px solid rgba(249,115,22,.25)', borderRadius: 10, padding: '12px 20px', fontSize: 12, color: 'rgba(255,255,255,.5)' }}>Status: <strong style={{ color: '#f97316' }}>Pending Review</strong></div>
      {/* DEMO only: approve button */}
      <button onClick={onApprove} style={{ marginTop: 8, padding: '8px 20px', background: 'rgba(34,197,94,.15)', border: '1px solid rgba(34,197,94,.3)', borderRadius: 8, color: '#22c55e', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>[DEMO] Approve my application</button>
    </div>
  );
}

function AgentDashboard({ show, code, toast }) {
  const [stab, setStab] = useState('overview');
  const active = AG_MEMBERS_DATA.filter((m) => m.status === 'active').length;
  const grossWL = AG_MEMBERS_DATA.reduce((s, m) => s + m.winloss, 0);
  const netComm = Math.max(0, Math.round(grossWL * -1 * 0.3 * 0.71));
  const link = 'https://legox.com/agent/' + code;

  const stabStyleBase = { padding: '11px 18px', background: 'none', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' };
  const stabStyle = (id) => ({ ...stabStyleBase, borderBottom: '2px solid ' + (stab === id ? '#f0c040' : 'transparent'), color: stab === id ? '#f0c040' : 'rgba(255,255,255,.4)' });

  return (
    <div id="ag-dashboard-screen" style={{ display: show ? 'block' : 'none' }}>
      {/* Header */}
      <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>🧑‍💼 Agent Dashboard</div>
            <span style={{ background: 'rgba(34,197,94,.15)', border: '1px solid rgba(34,197,94,.3)', color: '#22c55e', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20 }}>APPROVED</span>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', marginTop: 2 }}>Profit Share Program — commission based on Win/Loss after deductions</div>
        </div>
        <div style={{ background: 'rgba(240,192,64,.12)', border: '1px solid rgba(240,192,64,.25)', borderRadius: 8, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,.5)' }}>Agent Code</span>
          <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--gold)', fontFamily: "'Montserrat',sans-serif" }} id="ag-code-display">{code}</span>
        </div>
      </div>

      {/* Sub tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,.07)', overflowX: 'auto' }}>
        <button className={'ag-stab' + (stab === 'overview' ? ' active' : '')} onClick={() => setStab('overview')} style={stabStyle('overview')}>📊 Overview</button>
        <button className={'ag-stab' + (stab === 'report' ? ' active' : '')} onClick={() => setStab('report')} style={stabStyle('report')}>📈 Report</button>
        <button className={'ag-stab' + (stab === 'members' ? ' active' : '')} onClick={() => setStab('members')} style={stabStyle('members')}>👥 Members</button>
        <button className={'ag-stab' + (stab === 'finance' ? ' active' : '')} onClick={() => setStab('finance')} style={stabStyle('finance')}>💰 Finance</button>
        <button className={'ag-stab' + (stab === 'share' ? ' active' : '')} onClick={() => setStab('share')} style={stabStyle('share')}>🔗 Share</button>
      </div>

      {/* ── OVERVIEW ── */}
      <div id="ag-panel-overview" style={{ display: stab === 'overview' ? 'block' : 'none', padding: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(255,255,255,.35)', marginBottom: 12 }}>This Month</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
          <AgentKpi color="#f0c040" label="Net Commission" i18n="agent_commission" value={'₱' + netComm.toLocaleString()} sub="after all deductions" />
          <AgentKpi color="#38bdf8" label="Active Players" i18n="agent_active" value={active} sub="in your downline" />
          <AgentKpi color="#22c55e" label="Player Net Loss" i18n="agent_net_loss" value={'₱' + Math.abs(grossWL).toLocaleString()} sub="gross win/loss" />
        </div>

        {/* Quick access grid */}
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(255,255,255,.35)', marginBottom: 12 }} data-i18n="agent_quick">Quick Access</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <QuickBtn onClick={() => setStab('report')} bg="rgba(240,192,64,.15)" icon="📈" title="Win/Loss Report" titleI18n="agent_wl" sub="Profit after deductions" />
          <QuickBtn onClick={() => setStab('members')} bg="rgba(56,189,248,.15)" icon="👥" title="Member Records" titleI18n="agent_records" sub="Admin-approved only" />
          <QuickBtn onClick={() => setStab('finance')} bg="rgba(240,192,64,.15)" icon="💰" title="Finance Center" titleI18n="agent_finance" sub="Deposit for members" />
          <QuickBtn onClick={() => setStab('share')} bg="rgba(232,41,58,.15)" icon="🔗" title="Share Link" titleI18n="agent_share" sub="Invite sub-agents" subI18n="agent_invite" />
        </div>

        {/* How Agent commission works */}
        <div style={{ marginTop: 16, background: 'rgba(232,41,58,.06)', border: '1px solid rgba(232,41,58,.15)', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#e8293a', marginBottom: 6 }}>⚠️ How Agent Commission Works</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.45)', lineHeight: 1.7 }}>
            Commission = <strong style={{ color: '#fff' }}>(Player Losses − Player Wins)</strong> minus Promo % + Platform % + Game Fee % + Payment Fee %<br />
            <span style={{ color: '#f97316' }}>You can go negative if your players win more than they lose.</span>
          </div>
        </div>
      </div>

      {/* ── REPORT ── */}
      <AgentReportPanel show={stab === 'report'} />

      {/* ── MEMBERS ── */}
      <div id="ag-panel-members" style={{ display: stab === 'members' ? 'block' : 'none', padding: 18 }}>
        <div style={{ background: 'rgba(56,189,248,.06)', border: '1px solid rgba(56,189,248,.15)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: 'rgba(255,255,255,.45)' }}>
          ℹ️ All members under your account must be <strong style={{ color: '#38bdf8' }}>approved by admin</strong> before they are linked to you.
        </div>
        <div style={{ border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ background: 'rgba(255,255,255,.03)', padding: '10px 14px 10px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 4, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'rgba(255,255,255,.35)', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
            <span>Player</span><span style={{ textAlign: 'center' }} data-i18n="ui_deposit">Deposit</span><span style={{ textAlign: 'center' }}>Win/Loss</span><span style={{ textAlign: 'center' }} data-i18n="misc_status">Status</span>
          </div>
          <div id="ag-members-list">
            {AG_MEMBERS_DATA.map((m, i) => {
              const wlColor = m.winloss < 0 ? '#22c55e' : '#e8293a';
              const wlLabel = m.winloss < 0 ? '-₱' + Math.abs(m.winloss).toLocaleString() : '+₱' + m.winloss.toLocaleString();
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 4, padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,.04)', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>{m.name}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', textAlign: 'center' }}>₱{m.deposit.toLocaleString()}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: wlColor, textAlign: 'center' }}>{wlLabel}</span>
                  <span style={{ textAlign: 'center' }}><span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, fontWeight: 700, background: m.status === 'active' ? 'rgba(34,197,94,.15)' : 'rgba(249,115,22,.15)', color: m.status === 'active' ? '#22c55e' : '#f97316' }}>{m.status}</span></span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── FINANCE ── */}
      <AgentFinancePanel show={stab === 'finance'} toast={toast} />

      {/* ── SHARE ── */}
      <div id="ag-panel-share" style={{ display: stab === 'share' ? 'block' : 'none', padding: 18 }}>
        <div style={{ background: 'rgba(240,192,64,.06)', border: '1px solid rgba(240,192,64,.2)', borderRadius: 12, padding: 18, marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(240,192,64,.7)', marginBottom: 6 }}>Your Agent Code</div>
          <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 28, fontWeight: 900, color: '#f0c040', marginBottom: 12 }} id="ag-share-code">{code}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(0,0,0,.3)', border: '1px solid rgba(240,192,64,.2)', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', marginBottom: 10 }} onClick={() => { navigator.clipboard?.writeText(link).catch(() => {}); toast('✅ Agent link copied!', 'success'); }}>
            <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'rgba(240,192,64,.8)', flex: 1 }} id="ag-share-link">{link}</span>
            <span style={{ color: '#f0c040', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>📋 Copy</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button onClick={() => toast('Shared to Facebook', 'success')} style={{ padding: 8, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, color: 'rgba(255,255,255,.6)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>📘 Facebook</button>
            <button onClick={() => toast('Shared to Messenger', 'success')} style={{ padding: 8, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, color: 'rgba(255,255,255,.6)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>💬 Messenger</button>
            <button onClick={() => toast('Shared to Telegram', 'success')} style={{ padding: 8, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, color: 'rgba(255,255,255,.6)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>✈️ Telegram</button>
            <button onClick={() => toast('Shared to Viber', 'success')} style={{ padding: 8, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, color: 'rgba(255,255,255,.6)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>💜 Viber</button>
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 10 }}>Referral Stats</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,.05)', paddingBottom: 7 }}><span style={{ color: 'rgba(255,255,255,.4)' }}>Total Link Clicks</span><strong style={{ color: '#fff' }}>1,842</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,.05)', paddingBottom: 7 }}><span style={{ color: 'rgba(255,255,255,.4)' }}>Sub-agents Approved</span><strong style={{ color: '#22c55e' }}>4</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,.4)' }}>Pending Approval</span><strong style={{ color: '#f97316' }}>2</strong></div>
          </div>
        </div>
      </div>

    </div>
  );
}

function AgentKpi({ color, label, i18n, value, sub }) {
  return (
    <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, padding: 14, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: color }}></div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.06em' }} data-i18n={i18n}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 900, color, fontFamily: "'Montserrat',sans-serif" }}>{value}</div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginTop: 3 }}>{sub}</div>
    </div>
  );
}

function QuickBtn({ onClick, bg, icon, title, titleI18n, sub, subI18n }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '18px 12px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color .15s' }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }} data-i18n={titleI18n}>{title}</span>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,.35)' }} data-i18n={subI18n}>{sub}</span>
    </button>
  );
}

function AgentReportPanel({ show }) {
  const [period, setPeriod] = useState('this');
  const fmt = (v) => (v < 0 ? '-' : '') + '₱' + Math.abs(v).toLocaleString();
  const isDeduct = (label) => label.startsWith('(-)');

  const periodBtn = (p) => p === period
    ? { padding: '5px 14px', borderRadius: 6, background: '#f0c040', border: 'none', color: '#06091a', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }
    : { padding: '5px 14px', borderRadius: 6, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.5)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' };

  return (
    <div id="ag-panel-report" style={{ display: show ? 'block' : 'none', padding: 18 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button className={'ag-period' + (period === 'this' ? ' active' : '')} onClick={() => setPeriod('this')} style={periodBtn('this')}>This Month</button>
        <button className={'ag-period' + (period === 'last' ? ' active' : '')} onClick={() => setPeriod('last')} style={periodBtn('last')}>Last Month</button>
      </div>
      <div style={{ border: '1px solid rgba(255,255,255,.07)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ background: 'rgba(255,255,255,.03)', padding: '10px 14px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(255,255,255,.35)', borderBottom: '1px solid rgba(255,255,255,.05)' }} data-i18n="agent_report">Commission Report (Profit Share)</div>
        <div id="ag-report-rows">
          {AG_REPORT_ROWS.map((r, i) => {
            const val = period === 'this' ? r.thisMonth : r.lastMonth;
            const prev = period === 'this' ? r.lastMonth : r.thisMonth;
            const isNet = r.label.includes('Net Profit') || r.label.includes('Your Share');
            const color = isNet ? '#f0c040' : isDeduct(r.label) ? '#e8293a' : val < 0 ? '#e8293a' : '#22c55e';
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderBottom: '1px solid rgba(255,255,255,.04)', background: isNet ? 'rgba(240,192,64,.05)' : undefined }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🪙</div>
                  <span style={{ fontSize: 13, fontWeight: isNet ? 700 : undefined, color: isNet ? '#fff' : 'rgba(255,255,255,.65)' }}>{r.label}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color }}>{fmt(val)}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)' }}>Last: {fmt(prev)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AgentFinancePanel({ show, toast }) {
  const [fin, setFin] = useState('deposit'); // deposit | bonus
  const [depAmt, setDepAmt] = useState(18);
  const [bonusAmt, setBonusAmt] = useState(10);
  const depMember = useRef(null), depPw = useRef(null);
  const bonusMember = useRef(null), bonusPw = useRef(null);

  const finTabStyle = (id, color) => ({ padding: '9px 16px', background: 'none', border: 'none', borderBottom: '2px solid ' + (fin === id ? color : 'transparent'), color: fin === id ? color : 'rgba(255,255,255,.4)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' });
  const amtStyle = (active) => active
    ? { padding: '6px 14px', borderRadius: 6, background: '#f97316', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }
    : { padding: '6px 14px', borderRadius: 6, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', color: 'rgba(255,255,255,.6)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' };
  const inp = { width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, color: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none' };
  const star = { fontSize: 11, color: '#f97316', fontWeight: 700, marginBottom: 5 };

  const submitDeposit = () => {
    const member = depMember.current?.value.trim();
    if (!member) { toast('Please enter member username', 'error'); return; }
    if (!depAmt || depAmt <= 0) { toast('Please enter a valid amount', 'error'); return; }
    if (!depPw.current?.value.trim()) { toast('Please enter fund password', 'error'); return; }
    toast('✅ Deposit of ₱' + depAmt.toLocaleString() + ' sent to ' + member, 'success');
    if (depMember.current) depMember.current.value = '';
    if (depPw.current) depPw.current.value = '';
  };
  const submitBonus = () => {
    const member = bonusMember.current?.value.trim();
    if (!member) { toast('Please enter member username', 'error'); return; }
    if (!bonusAmt || bonusAmt <= 0) { toast('Please enter a valid amount', 'error'); return; }
    if (!bonusPw.current?.value.trim()) { toast('Please enter fund password', 'error'); return; }
    toast('🎁 Bonus of ₱' + bonusAmt.toLocaleString() + ' gifted to ' + member, 'success');
    if (bonusMember.current) bonusMember.current.value = '';
    if (bonusPw.current) bonusPw.current.value = '';
  };

  return (
    <div id="ag-panel-finance" style={{ display: show ? 'block' : 'none', padding: 18 }}>
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,.07)', marginBottom: 16 }}>
        <button className={'ag-fin-tab' + (fin === 'deposit' ? ' active' : '')} onClick={() => setFin('deposit')} style={finTabStyle('deposit', '#f97316')} data-i18n="agent_member_dep">Member Deposit</button>
        <button className={'ag-fin-tab' + (fin === 'bonus' ? ' active' : '')} onClick={() => setFin('bonus')} style={finTabStyle('bonus', '#f97316')}>Bonus Gift</button>
      </div>
      <div id="ag-fin-deposit-wrap" style={{ display: fin === 'deposit' ? 'block' : 'none' }}>
        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>Payment Account — Deposit Balance</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#f97316' }}>₱0</span>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.35)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.06em' }} data-i18n="dep_info">Deposit Info</div>
        <div style={{ marginBottom: 10 }}><div style={star}>* Member Account:</div><input ref={depMember} id="ag-dep-member" type="text" placeholder="Enter member username" style={inp} /></div>
        <div style={{ marginBottom: 10 }}><div style={star}>* Deposit Amount:</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 7 }}>
            {[18, 50, 100, 500].map((v) => (
              <button key={v} onClick={() => setDepAmt(v)} className={'ag-amt' + (depAmt === v ? ' active' : '')} style={amtStyle(depAmt === v)}>{v}</button>
            ))}
          </div>
          <input id="ag-dep-amount" type="number" value={depAmt} onChange={(e) => setDepAmt(Number(e.target.value))} style={inp} />
        </div>
        <div style={{ marginBottom: 10 }}><div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', fontWeight: 700, marginBottom: 5 }} data-i18n="dep_remark">Remark:</div><input id="ag-dep-remark" type="text" placeholder="Enter remark (optional)" style={inp} /></div>
        <div style={{ marginBottom: 16 }}><div style={star}>* Fund Password:</div><input ref={depPw} id="ag-dep-pw" type="password" placeholder="Enter fund password" style={inp} /></div>
        <button onClick={submitDeposit} style={{ width: '100%', padding: 12, background: 'linear-gradient(135deg,#c0410a,#f97316)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }} data-i18n="dep_confirm">Confirm Deposit</button>
      </div>
      <div id="ag-fin-bonus-wrap" style={{ display: fin === 'bonus' ? 'block' : 'none' }}>
        <div style={{ marginBottom: 10 }}><div style={star}>* Member Account:</div><input ref={bonusMember} id="ag-bonus-member" type="text" placeholder="Enter member username" style={inp} /></div>
        <div style={{ marginBottom: 10 }}><div style={star}>* Bonus Amount:</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 7 }}>
            {[10, 50, 100, 200].map((v) => (
              <button key={v} onClick={() => setBonusAmt(v)} className={'ag-bamt' + (bonusAmt === v ? ' active' : '')} style={amtStyle(bonusAmt === v)}>{v}</button>
            ))}
          </div>
          <input id="ag-bonus-amount" type="number" value={bonusAmt} onChange={(e) => setBonusAmt(Number(e.target.value))} style={inp} />
        </div>
        <div style={{ marginBottom: 10 }}><div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', fontWeight: 700, marginBottom: 5 }}>Remark:</div><input type="text" placeholder="Optional" style={inp} /></div>
        <div style={{ marginBottom: 16 }}><div style={star}>* Fund Password:</div><input ref={bonusPw} id="ag-bonus-pw" type="password" placeholder="Enter fund password" style={inp} /></div>
        <button onClick={submitBonus} style={{ width: '100%', padding: 12, background: 'linear-gradient(135deg,#c0410a,#f97316)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Confirm Gift</button>
      </div>
    </div>
  );
}
