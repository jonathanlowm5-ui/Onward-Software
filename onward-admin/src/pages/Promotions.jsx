import { useEffect, useState } from 'react';
import { useUI } from '../context/UIContext';
import { Table } from '../components/ui.jsx';
import { listPromotions, togglePromotion, removePromotion, createPromotion, updatePromotion, reorderPromotions } from '../services/promotionService';
import { uploadImage } from '../services/uploadService';
import { getMiniGames, saveMiniGames } from '../services/minigameService';
import { listBankChannels } from '../services/bankService';
import { buildPromoTerms } from '../utils/promoTerms';

/* ---------- demo data (fallbacks) ---------- */
const DEMO_PROMOS = [
  { n: '200% Welcome Bonus', d: 'Get 200% on your first deposit up to ₱10,000', t: 'welcome', tc: 'vt-pct', b: '200%', mx: 'max ₱10,000', md: '₱500', w: '30x', to: '0x', cl: '1,842', ex: 'No expiry', on: 1 },
  { n: 'Daily 50% Reload', d: '50% reload every day on your deposits', t: 'deposit', tc: 'vt-cash', b: '50%', mx: 'max ₱5,000', md: '₱200', w: '20x', to: '0x', cl: '8,421', ex: 'No expiry', on: 1 },
  { n: 'Refer & Earn ₱500', d: 'Earn ₱500 for every friend you refer', t: 'referral', tc: 'vt-cash', b: '₱500', mx: 'max ₱500', md: '₱0', w: '10x', to: '0x', cl: '620', ex: 'No expiry', on: 1 },
  { n: 'Weekly Cashback 10%', d: 'Get 10% cashback on net losses every week', t: 'cashback', tc: 'vt-fs', b: '10%', mx: 'max ₱20,000', md: '₱1,000', w: '5x', to: '0x', cl: '3,102', ex: 'No expiry', on: 1 },
  { n: '100 Free Spins', d: '100 free spins on selected slots', t: 'freespin', tc: 'vt-nd', b: '100 spins', mx: 'max ₱0', md: '₱300', w: '40x', to: '0x', cl: '1,240', ex: '2025-12-31T23:59', on: 0 },
];

const PROMO_TABS = [['promos', '🎁 Promotions'], ['mini', '🎰 Mini Games'], ['bigwins', '⚡ Big Wins'], ['settings', '⚙️ Settings'], ['tier', '👑 Tier Control'], ['kyc', '✅ KYC Bonus']];

const SLICE_TYPES = ['Cash', 'Bonus', 'Free Spin', 'Token', 'Physical', 'None'];
const SLICE_REQS = ['T/O', 'Deposit', 'None'];
const INITIAL_SLICES = [
  { l: '₱50 Cash', type: 'Cash', p: 50, seq: 1, w: 30, qty: 0, claimed: 0, req: 'T/O', mult: 3, c: '#e8253a', on: 1 },
  { l: '₱100 Cash', type: 'Cash', p: 100, seq: 2, w: 20, qty: 0, claimed: 0, req: 'T/O', mult: 3, c: '#f4b223', on: 1 },
  { l: '₱200 Cash', type: 'Cash', p: 200, seq: 3, w: 15, qty: 0, claimed: 0, req: 'T/O', mult: 3, c: '#2ecc71', on: 1 },
  { l: 'Free Spin x3', type: 'Free Spin', p: 3, seq: 4, w: 12, qty: 0, claimed: 0, req: 'None', mult: 0, c: '#3ab7ff', on: 1 },
  { l: '₱500 Cash', type: 'Cash', p: 500, seq: 5, w: 8, qty: 0, claimed: 0, req: 'T/O', mult: 3, c: '#a86dff', on: 1 },
  { l: '₱1,000 Cash', type: 'Cash', p: 1000, seq: 6, w: 5, qty: 0, claimed: 0, req: 'T/O', mult: 3, c: '#ff7a1a', on: 1 },
  { l: 'Try Again', type: 'None', p: 0, seq: 7, w: 7, qty: 0, claimed: 0, req: 'None', mult: 0, c: '#14182a', on: 1 },
  { l: '₱5,000 JACKPOT', type: 'Cash', p: 5000, seq: 8, w: 3, qty: 0, claimed: 0, req: 'T/O', mult: 3, c: '#f7e08b', on: 1 },
];

const INITIAL_WHEEL_THEME = { bgImage: '', titleImage: '', frameImage: '', pinImage: '', tokenImage: '', buttonImage: '', title: 'WHEEL OF FORTUNE', rimColor: '#f4b223', hubColor: '#f4b223', pointerColor: '#f4b223', bulbs: true, discScale: 0.74 };
const INITIAL_WHEEL_CFG = { enabled: true, image: '', theme: { ...INITIAL_WHEEL_THEME }, freeSpinsPerDay: 1, spinCost: 50, maxPerDay: 5 };
const INITIAL_TICKET_CFG = { enabled: true, drawDate: '', totalTickets: 10000, winnersCount: 50, earnBy: 'Every ₱100 deposited', minDeposit: 100, maxPerPlayer: 50 };

const INITIAL_BIGWINS = [
  { g: 'Coin Splash Dice', ic: '🎲', pl: 'Use***', m: 16, pz: '₱ 2,772.64', cat: 'Slots', on: 1 },
  { g: 'Fortune Mouse', ic: '🐭', pl: 'bim90***', m: 20, pz: '₱ 6,150.50', cat: 'Slots', on: 1 },
  { g: 'Demi Gods VI', ic: '⚡', pl: 'eduar***', m: 34, pz: '₱ 4,440.66', cat: 'Slots', on: 1 },
  { g: 'Fire 4: Cash', ic: '🔥', pl: 'Use***', m: 10, pz: '₱ 4,158.96', cat: 'Slots', on: 1 },
  { g: 'Wild Tiger 2', ic: '🐯', pl: 'play***', m: 55, pz: '₱ 12,440.00', cat: 'Slots', on: 1 },
  { g: 'Lucky Coins', ic: '🪙', pl: 'jorg***', m: 28, pz: '₱ 8,920.00', cat: 'Slots', on: 1 },
  { g: 'Elvis Frog', ic: '🐸', pl: 'mar***', m: 42, pz: '₱ 9,310.00', cat: 'Slots', on: 1 },
  { g: 'Plinko', ic: '🎯', pl: 'tan***', m: 18, pz: '₱ 3,640.00', cat: 'Crash', on: 1 },
  { g: 'Book of Crown', ic: '📘', pl: 'vik***', m: 31, pz: '₱ 7,200.00', cat: 'Slots', on: 1 },
  { g: 'Thunder Crown', ic: '👑', pl: 'ana***', m: 60, pz: '₱ 18,500.00', cat: 'Slots', on: 1 },
];

const TIER_RC_INIT = [
  { n: 'Novice', c: '#8a7f78', fs: 1, mx: 3, sc: 50, jr: '1', tm: '1', pb: 0, on: 1 },
  { n: 'Sender', c: '#3aa0ff', fs: 1, mx: 5, sc: 40, jr: '1.5', tm: '1.2', pb: 5, on: 1 },
  { n: 'Gambler', c: '#4f8fe8', fs: 2, mx: 5, sc: 35, jr: '2', tm: '1.5', pb: 10, on: 1 },
  { n: 'Leery', c: '#9b6dff', fs: 2, mx: 7, sc: 30, jr: '2.5', tm: '1.8', pb: 15, on: 1 },
  { n: 'Sharple', c: '#a86dff', fs: 3, mx: 7, sc: 25, jr: '3', tm: '2', pb: 20, on: 1 },
  { n: 'Expert', c: '#b07aff', fs: 3, mx: 10, sc: 20, jr: '3.5', tm: '2.5', pb: 25, on: 1 },
  { n: 'Master', c: '#ff4d5e', fs: 5, mx: 10, sc: 15, jr: '4', tm: '3', pb: 30, on: 1 },
  { n: 'Boss', c: '#ff6675', fs: 5, mx: 15, sc: 10, jr: '5', tm: '4', pb: 40, on: 1 },
  { n: 'Major', c: '#f4b223', fs: 7, mx: 20, sc: 0, jr: '6', tm: '5', pb: 50, on: 1 },
  { n: 'Grand', c: '#7ec8ff', fs: 10, mx: 999, sc: 0, jr: '8', tm: '8', pb: 75, on: 1 },
];

const KB_AWARDS = [
  ['mar***', 'kb-prog', 'In Progress', 45],
  ['jorg***', 'kb-done', 'Completed', 100],
  ['eduar***', 'kb-prog', 'In Progress', 30],
  ['Use***', 'kb-wd', 'Withdrawn', 100],
  ['tan***', 'kb-pend', 'Pending', 0],
  ['ana***', 'kb-prog', 'In Progress', 22],
];

/* map a promo `type` to its coloured pill class */
const TYPE_CLASS = { welcome: 'vt-pct', deposit: 'vt-cash', referral: 'vt-cash', cashback: 'vt-fs', freespin: 'vt-nd' };
const typeClass = (t) => TYPE_CLASS[t] || 'vt-pct';

/* normalize a server promotion record to the table-display shape.
 * Keeps the raw backend record under `raw` so the edit modal can prefill. */
function normalizePromo(p) {
  if (p && p.n && p.tc && !p.title) return p; // already a demo row
  const type = p.type || p.t || 'welcome';
  return {
    n: p.title || p.name || p.n || '—',
    d: p.description || p.d || '—',
    t: type,
    tc: typeClass(type),
    b: p.bonus || p.b || '—',
    mx: p.maxBonus ? ('max ' + p.maxBonus) : (p.mx || 'max ₱0'),
    md: p.minDeposit || p.md || '₱0',
    w: p.wager || p.w || '0x',
    to: p.turnover || p.to || '0x',
    cl: p.claims || p.cl || '0',
    ex: p.endDate || p.expiry || p.ex || 'No expiry',
    on: ((p.status ? p.status === 'active' : (p.active ?? p.on)) ? 1 : 0),
    id: p.id ?? p._id,
    raw: p,
  };
}

/* a blank promotion form */
const EMPTY_PROMO = {
  title: '', type: 'welcome', currency: '', country: '', bonus: '', maxBonus: '', minDeposit: '', wager: '', turnover: '',
  description: '', image: '', banners: {}, startDate: '', endDate: '', status: 'active', buttonText: '', buttonLink: '',
  // promotion rules / eligibility logic
  requirement: 'Deposit (T/O)', bonusType: 'Bonus', refreshCycle: 'Once',
  isExclusive: 'no', hidden: 'no', isAccumulate: 'no', promoDeductOnWithdraw: 'no',
  claimLimitDaily: 0, minDepositAmt: 0, depositCount: 0, maxClaimAmount: 0,
  maxWinningMultiply: 0, percentage: 0, multiply: 1, sequence: 0, minBalance: 0, freeSpins: 0,
  days: [],
  // step 2 — allow lists
  allowProducts: [], allowPlayerGroups: [], allowBanks: [], allowRiskGroups: [],
};
const PROMO_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const PROMO_PRODUCTS = ['JDB', 'JILI', 'JOKER', 'KINGMIDAS', 'VICTORY POKER', 'YESBINGO', 'DS88', 'PG SOFT', 'PRAGMATIC', 'EVOLUTION', 'SPRIBE', 'CQ9', 'FA CHAI', 'PLAYTECH', 'HABANERO'];
const PROMO_PLAYER_GROUPS = ['Normal', 'VIP', 'VVIP', 'High Roller', 'New Player', 'Affiliate'];
const PROMO_RISK_GROUPS = ['Low Risk', 'Medium Risk', 'High Risk', 'Watch List'];

// A "Select All" + checklist allow-list. Checkbox width and label casing are
// forced inline because the global .pm-fld rules stretch inputs to 100% and
// uppercase labels.
const AL_CB = { width: 16, height: 16, flexShrink: 0, margin: 0, cursor: 'pointer' };
const AL_ROW = { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 13, fontWeight: 600, color: 'var(--text)', textTransform: 'none', letterSpacing: 'normal', cursor: 'pointer', marginBottom: 0, minWidth: 128 };
function AllowList({ title, hint, options, selected, onChange }) {
  const sel = Array.isArray(selected) ? selected : [];
  const allSel = options.length > 0 && options.every((o) => sel.includes(o));
  const toggle = (o) => onChange(sel.includes(o) ? sel.filter((x) => x !== o) : [...sel, o]);
  const toggleAll = () => onChange(allSel ? [] : [...options]);
  return (
    <div className="pm-fld" style={{ gridColumn: '1 / -1' }}>
      <label>{title} {hint && <span style={{ color: 'var(--muted)', fontWeight: 600, textTransform: 'none', letterSpacing: 'normal' }}>{hint}</span>}</label>
      <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px', maxHeight: 200, overflowY: 'auto', background: 'var(--bg3,#0b1224)' }}>
        <label style={{ ...AL_ROW, display: 'flex', borderBottom: '1px solid var(--border)', paddingBottom: 7, marginBottom: 5 }}>
          <input type="checkbox" style={AL_CB} checked={allSel} onChange={toggleAll} /> Select All
        </label>
        {options.length === 0 && <div style={{ fontSize: 12, color: 'var(--muted)', padding: '4px 0' }}>No options.</div>}
        <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: 18, rowGap: 2 }}>
          {options.map((o) => (
            <label key={o} style={AL_ROW}><input type="checkbox" style={AL_CB} checked={sel.includes(o)} onChange={() => toggle(o)} /> {o}</label>
          ))}
        </div>
      </div>
    </div>
  );
}

const PROMO_REQUIREMENTS = ['Deposit (T/O)', 'Deposit (Winover)', 'Product (T/O)', 'Product (Winover)', 'Multi-Product (T/O)', 'Multi-Product (Winover)'];
const PROMO_BONUS_TYPES = ['Bonus', 'Free Credit', 'Referral Share', 'Register Bonus'];
const PROMO_REFRESH = ['Everytime', 'Once', 'Hourly', 'Daily', 'Weekly', 'Monthly'];
const yn = (v) => (v === true || v === 'yes' || v === 1 || v === '1') ? 'yes' : 'no';

const PROMO_CURRENCIES = ['PHP', 'USD', 'EUR', 'INR', 'THB', 'VND', 'IDR', 'MYR', 'CNY', 'JPY'];
const PROMO_COUNTRIES = ['Philippines', 'Malaysia', 'Singapore', 'Thailand', 'Indonesia', 'Vietnam'];
// Suggested currency per country (the editor offers it when a country is picked).
const COUNTRY_CURRENCY = { Philippines: 'PHP', Malaysia: 'MYR', Singapore: 'USD', Thailand: 'THB', Indonesia: 'IDR', Vietnam: 'VND' };

/* ===================== create / edit modal ===================== */
function PromoEditModal({ initial, onClose, onSaved }) {
  const { toast } = useUI();
  const [f, setF] = useState(() => ({ ...EMPTY_PROMO, ...(initial || {}) }));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bannerCur, setBannerCur] = useState('PHP');
  const [bannerUploading, setBannerUploading] = useState(false);
  const [step, setStep] = useState(1); // 1 = details/rules, 2 = allow lists
  const [bankOptions, setBankOptions] = useState([]);
  useEffect(() => {
    let alive = true;
    listBankChannels()
      .then((rows) => { if (alive) setBankOptions([...new Set((Array.isArray(rows) ? rows : []).map((b) => b.bankName || b.name || b.label).filter(Boolean))]); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const setMulti = (k) => (arr) => setF((p) => ({ ...p, [k]: arr }));
  // Picking a country auto-fills the matching currency (only when currency is
  // still on Auto) so country + currency promos stay consistent.
  const onCountry = (e) => {
    const country = e.target.value;
    setF((p) => ({ ...p, country, currency: (!p.currency && COUNTRY_CURRENCY[country]) ? COUNTRY_CURRENCY[country] : p.currency }));
  };
  const isEdit = !!(initial && initial.id);

  const pickImage = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { toast('⚠ Image too large — keep it under 4 MB'); return; }
    setUploading(true);
    try {
      const { url } = await uploadImage(file);
      setF((p) => ({ ...p, image: url }));
      toast('Image uploaded ✔');
    } catch (err) {
      toast('⚠ Upload failed: ' + (err.message || 'error'));
    } finally {
      setUploading(false);
    }
  };

  // Upload a banner for one currency and store it under f.banners[currency].
  const pickCurrencyBanner = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { toast('⚠ Image too large — keep it under 4 MB'); return; }
    setBannerUploading(true);
    try {
      const { url } = await uploadImage(file);
      setF((p) => ({ ...p, banners: { ...(p.banners || {}), [bannerCur]: url } }));
      toast(`${bannerCur} banner uploaded ✔`);
    } catch (err) {
      toast('⚠ Upload failed: ' + (err.message || 'error'));
    } finally {
      setBannerUploading(false);
    }
  };
  const removeCurrencyBanner = (cur) => setF((p) => {
    const b = { ...(p.banners || {}) };
    delete b[cur];
    return { ...p, banners: b };
  });

  const submit = async () => {
    if (!f.title.trim()) { toast('Promotion title is required', 'error'); return; }
    setBusy(true);
    // Send the whole form — the backend clean() keeps only the fields it knows
    // (basic info, rules, and the step-2 allow lists). Spreading avoids dropping
    // newly-added fields.
    const payload = { ...f, title: f.title.trim(), banners: f.banners || {} };
    try {
      const saved = isEdit ? await updatePromotion(initial.id, payload) : await createPromotion(payload);
      toast(isEdit ? 'Promotion updated ✔ live on player site' : 'Promotion created ✔ live on player site');
      onSaved(saved);
    } catch (err) {
      toast('⚠ Save failed: ' + (err.message || 'error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-ov show" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pm-modal" style={{ maxWidth: 620 }}>
        <div className="pm-head">
          <span style={{ fontSize: '1.3rem' }}>🎁</span>
          <span><div className="nm">{isEdit ? 'Edit Promotion' : 'Create Promotion'}</div><div className="meta">Shown on the player Promotions page</div></span>
          <button className="kyc-x" style={{ marginLeft: 'auto' }} onClick={onClose}>✕</button>
        </div>
        <div className="pm-body">
          <div style={{ display: step === 1 ? 'block' : 'none' }}>
          <div className="pm-grid">
            <div className="pm-fld" style={{ gridColumn: '1 / -1' }}><label>Title <span style={{ color: 'var(--red)' }}>*</span></label><input value={f.title} onChange={set('title')} placeholder="200% Welcome Bonus" /></div>
            <div className="pm-fld"><label>Section</label><select value={f.type} onChange={set('type')}><option value="welcome">Welcome</option><option value="deposit">Deposit</option><option value="reload">Reload</option><option value="cashback">Cashback</option><option value="freespin">Freespin</option><option value="referral">Referral</option><option value="tournament">Tournament</option></select><div className="pm-hint">Which page section it appears in. (Bonus type, %, amounts & limits are set in Promotion Rules below.)</div></div>
            <div className="pm-fld"><label>Country</label><select value={f.country} onChange={onCountry}><option value="">All countries</option>{PROMO_COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
            <div className="pm-fld"><label>Currency</label><select value={f.currency} onChange={set('currency')}><option value="">Auto (player's currency)</option>{PROMO_CURRENCIES.map((c) => <option key={c} value={c}>{c} only</option>)}</select></div>
            <div className="pm-fld"><label>Status</label><select value={f.status} onChange={set('status')}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
            <div className="pm-fld"><label>Start Date</label><input type="date" value={f.startDate} onChange={set('startDate')} /></div>
            <div className="pm-fld"><label>End Date (expiry)</label><input type="date" value={f.endDate} onChange={set('endDate')} /></div>
            <AllowList title="Day (List)" hint="(days the promo is active — empty = every day)" options={PROMO_DAYS} selected={f.days} onChange={setMulti('days')} />
            <div className="pm-fld" style={{ gridColumn: '1 / -1' }}>
              <label>Description <span style={{ color: 'var(--muted)', fontWeight: 600 }}>(one line per row — shows under the title)</span></label>
              <textarea value={f.description} onChange={set('description')} rows={2}
                placeholder={'100% UP TO ₱2,060\n+25 FREE SPINS'}
                style={{ width: '100%', resize: 'vertical', padding: '9px 12px', borderRadius: 8, background: 'var(--bg3,#0b1224)', color: 'var(--text,#fff)', border: '1px solid var(--border,#243049)', fontFamily: 'inherit', fontSize: 14, lineHeight: 1.5 }} />
            </div>
            <div className="pm-fld"><label>Button Text</label><input value={f.buttonText} onChange={set('buttonText')} placeholder="Deposit Now" /></div>
            <div className="pm-fld"><label>Button Link</label><input value={f.buttonLink} onChange={set('buttonLink')} placeholder="/deposit" /></div>

            {/* ===== Promotion Rules / eligibility logic ===== */}
            <div className="pm-fld" style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
              <div style={{ fontWeight: 800, color: 'var(--gold)', fontSize: 14 }}>⚙️ Promotion Rules</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Eligibility &amp; claim logic. For a multi-step <b>Welcome Bonus</b> (1st/2nd/3rd/4th deposit), create one promo per deposit and set <b>Sequence</b> 1, 2, 3, 4 — the backend uses Sequence to know the deposit step.</div>
            </div>
            <div className="pm-fld" style={{ gridColumn: '1 / -1' }}><label>1 · Requirement</label>
              <select value={f.requirement} onChange={set('requirement')}>{PROMO_REQUIREMENTS.map((r) => <option key={r} value={r}>{r}</option>)}</select>
              <div className="pm-hint">Eligibility criteria — T/O = turnover, Winover = winover requirement before withdrawal.</div>
            </div>
            <div className="pm-fld"><label>2 · Type (bonus)</label>
              <select value={f.bonusType} onChange={set('bonusType')}>{PROMO_BONUS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
            </div>
            <div className="pm-fld"><label>3 · Refresh Cycle</label>
              <select value={f.refreshCycle} onChange={set('refreshCycle')}>{PROMO_REFRESH.map((c) => <option key={c} value={c}>{c}</option>)}</select>
              <div className="pm-hint">How often it's claimable (Everytime / Once / Hourly / Daily / Weekly / Monthly).</div>
            </div>
            <div className="pm-fld"><label>4 · Is Exclusive</label>
              <select value={yn(f.isExclusive)} onChange={set('isExclusive')}><option value="no">No</option><option value="yes">Yes</option></select>
              <div className="pm-hint">Yes = a player can claim only once, ever.</div>
            </div>
            <div className="pm-fld"><label>5 · Hidden</label>
              <select value={yn(f.hidden)} onChange={set('hidden')}><option value="no">No</option><option value="yes">Yes</option></select>
              <div className="pm-hint">Yes = hidden from players (not shown on the site).</div>
            </div>
            <div className="pm-fld"><label>6 · Claim Limit (Daily)</label><input value={f.claimLimitDaily} inputMode="numeric" onChange={set('claimLimitDaily')} placeholder="0" /><div className="pm-hint">Total daily claims for all players. 0 = unlimited.</div></div>
            <div className="pm-fld"><label>7 · Min Deposit</label><input value={f.minDepositAmt} inputMode="decimal" onChange={set('minDepositAmt')} placeholder="0" /><div className="pm-hint">Minimum deposit to qualify.</div></div>
            <div className="pm-fld"><label>8 · No. of Deposit</label><input value={f.depositCount} inputMode="numeric" onChange={set('depositCount')} placeholder="0" /><div className="pm-hint">Deposits required to claim. 0 = anytime.</div></div>
            <div className="pm-fld"><label>9 · Max Claim Amount</label><input value={f.maxClaimAmount} inputMode="decimal" onChange={set('maxClaimAmount')} placeholder="0" /><div className="pm-hint">Max bonus payout.</div></div>
            <div className="pm-fld"><label>10 · Max Winning Multiply</label><input value={f.maxWinningMultiply} inputMode="decimal" onChange={set('maxWinningMultiply')} placeholder="0" /><div className="pm-hint">+5 = (depo+promo)×5; -50 = fixed max 50; 0 = no forfeit.</div></div>
            <div className="pm-fld"><label>11 · Is Accumulate</label>
              <select value={yn(f.isAccumulate)} onChange={set('isAccumulate')}><option value="no">No</option><option value="yes">Yes</option></select>
              <div className="pm-hint">Deposit bonus → always No.</div>
            </div>
            <div className="pm-fld"><label>12 · Promo Deduct on Withdrawal</label>
              <select value={yn(f.promoDeductOnWithdraw)} onChange={set('promoDeductOnWithdraw')}><option value="no">No</option><option value="yes">Yes</option></select>
              <div className="pm-hint">Yes = bonus amount deducted from the withdrawal.</div>
            </div>
            <div className="pm-fld"><label>13 · Percentage (%)</label><input value={f.percentage} inputMode="decimal" onChange={set('percentage')} placeholder="0" /><div className="pm-hint">Bonus percentage.</div></div>
            <div className="pm-fld"><label>14 · Multiply (T/O or Winover)</label><input value={f.multiply} inputMode="decimal" onChange={set('multiply')} placeholder="1" /><div className="pm-hint">Turnover/winover multiple. Default 1.</div></div>
            <div className="pm-fld"><label>15 · Sequence</label><input value={f.sequence} inputMode="numeric" onChange={set('sequence')} placeholder="0" /><div className="pm-hint">Step order (1st=1, 2nd=2, …) for multi-step welcome bonuses.</div></div>
            <div className="pm-fld"><label>16 · Min Balance</label><input value={f.minBalance} inputMode="decimal" onChange={set('minBalance')} placeholder="0" /><div className="pm-hint">Claim only if wallet ≤ this. 0 = no check.</div></div>
            <div className="pm-fld"><label>17 · Free Spins (FS)</label><input value={f.freeSpins} inputMode="numeric" onChange={set('freeSpins')} placeholder="0" /><div className="pm-hint">Number of free spins granted. 0 = none.</div></div>

            {/* Live auto-card preview — title on top, description below (no image needed) */}
            <div className="pm-fld" style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
              <label>Auto Card Preview <span style={{ color: 'var(--muted)', fontWeight: 600 }}>(title + description build the card automatically)</span></label>
              <div style={{ maxWidth: 300, background: 'linear-gradient(135deg,#0e1e32 0%,#162038 60%,#1c2842 100%)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 18px 16px', display: 'flex', flexDirection: 'column', minHeight: 172 }}>
                {f.image ? (
                  <div style={{ width: '100%', aspectRatio: '1200 / 425', backgroundImage: `url(${f.image})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: 10, marginBottom: 12, position: 'relative', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,rgba(8,13,26,.88) 0%,rgba(8,13,26,.6) 38%,rgba(8,13,26,.08) 62%,transparent 100%)' }} />
                    <div style={{ position: 'relative', zIndex: 1, padding: '0 14px', maxWidth: '64%' }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: '#fff', textTransform: 'uppercase', lineHeight: 1.2, marginBottom: 5 }}>{f.title || '2ND DEPOSIT BONUS'}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,.7)', lineHeight: 1.45, whiteSpace: 'pre-line' }}>{f.description || '100% UP TO ₱2,060\n+25 FREE SPINS'}</div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontWeight: 800, fontSize: 17, color: '#fff', textTransform: 'uppercase', lineHeight: 1.2 }}>{f.title || '2ND DEPOSIT BONUS'}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', marginTop: 8, lineHeight: 1.5, whiteSpace: 'pre-line' }}>{f.description || '100% UP TO ₱2,060\n+25 FREE SPINS'}</div>
                  </>
                )}
                <button style={{ marginTop: 12, width: '100%', padding: '9px 0', borderRadius: 8, border: 'none', fontWeight: 800, fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase', color: '#06091a', background: 'linear-gradient(135deg,#f0c040,#d99a00)', cursor: 'default' }}>{f.buttonText || 'Claim now'}</button>
              </div>
            </div>
            <div className="pm-fld" style={{ gridColumn: '1 / -1' }}>
              <label>Default Banner <span style={{ color: 'var(--gold)', fontWeight: 700 }}>· recommended 1200 × 425 px</span></label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="file" accept="image/*" onChange={pickImage} />
                {uploading && <span style={{ color: 'var(--gold)' }}>uploading…</span>}
                {f.image && <img src={f.image} alt="" style={{ height: 40, borderRadius: 6 }} />}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5 }}>Size: <b style={{ color: 'var(--text)' }}>1200 × 425 px</b> · PNG or JPG · keep under 4 MB. Used on the lobby banner and promo cards.</div>
            </div>
            <div className="pm-fld" style={{ gridColumn: '1 / -1' }}>
              <label>Currency Banners <span style={{ color: 'var(--muted)', fontWeight: 600 }}>(optional — players see the banner for their own currency, e.g. an MYR banner with RM amounts)</span></label>
              <div style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700, marginBottom: 6 }}>Same size: 1200 × 425 px</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <select value={bannerCur} onChange={(e) => setBannerCur(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--panel-3,#1b2541)', color: 'var(--text,#fff)', border: '1px solid var(--border,#243049)' }}>
                  {PROMO_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="file" accept="image/*" onChange={pickCurrencyBanner} />
                {bannerUploading && <span style={{ color: 'var(--gold)' }}>uploading…</span>}
              </div>
              {f.banners && Object.keys(f.banners).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
                  {Object.entries(f.banners).map(([cur, url]) => (
                    <div key={cur} style={{ position: 'relative', border: '1px solid var(--border,#243049)', borderRadius: 8, padding: 6, textAlign: 'center' }}>
                      <img src={url} alt={cur} style={{ height: 44, borderRadius: 4, display: 'block' }} />
                      <div style={{ fontSize: 11, fontWeight: 800, marginTop: 3 }}>{cur}</div>
                      <button type="button" onClick={() => removeCurrencyBanner(cur)} title="Remove" style={{ position: 'absolute', top: -8, right: -8, width: 20, height: 20, borderRadius: '50%', border: 'none', background: 'var(--red,#ff4d5e)', color: '#fff', cursor: 'pointer', fontSize: 12, lineHeight: '20px' }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Auto-generated Terms & Conditions preview. Lines 1–6 update live
              from the fields above; 7–12 are fixed. Shown to members on the
              player Promo Detail modal — no manual typing needed. */}
          <div style={{ marginTop: 16, borderTop: '1px dashed var(--border)', paddingTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)', marginBottom: 2 }}>TERMS &amp; CONDITIONS <span style={{ color: 'var(--muted)', fontWeight: 600 }}>(auto-generated — shown to members)</span></div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>Lines 1–6 fill from the package above; 7–12 are fixed.{f.currency ? '' : ' Currency is set to Auto — each member sees their own currency (PHP shown as example below).'}</div>
            <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 180, overflowY: 'auto' }}>
              {buildPromoTerms(f).map((t, i) => (
                <li key={i} style={{ fontSize: 11.5, lineHeight: 1.45, color: i < 6 ? 'var(--text)' : 'var(--muted)' }}>{t}</li>
              ))}
            </ol>
          </div>
          </div>{/* /step 1 */}

          {/* ===== STEP 2 — Allow lists (Multi-Product, player group, bank, risk) ===== */}
          <div style={{ display: step === 2 ? 'block' : 'none' }}>
            <div className="pm-grid">
              <div className="pm-fld" style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontWeight: 800, color: 'var(--gold)', fontSize: 14 }}>✅ Allow Lists</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Restrict who/what this promotion covers. Leave a list empty = allow everything.</div>
              </div>
              <AllowList title="Allow Products" hint="(Multi-Product — games/providers this promo applies to)" options={PROMO_PRODUCTS} selected={f.allowProducts} onChange={setMulti('allowProducts')} />
              <AllowList title="Allow Player Groups" options={PROMO_PLAYER_GROUPS} selected={f.allowPlayerGroups} onChange={setMulti('allowPlayerGroups')} />
              <AllowList title="Allow Banks" hint="(from your configured bank channels)" options={bankOptions} selected={f.allowBanks} onChange={setMulti('allowBanks')} />
              <AllowList title="Allow Risk Groups" options={PROMO_RISK_GROUPS} selected={f.allowRiskGroups} onChange={setMulti('allowRiskGroups')} />
            </div>
          </div>
        </div>
        <div className="pm-foot">
          {step === 1 ? (
            <>
              <button className="btn-cancel" onClick={onClose}>Cancel</button>
              <button className="btn-pm-save" onClick={() => setStep(2)}>Next →</button>
            </>
          ) : (
            <>
              <button className="btn-cancel" onClick={() => setStep(1)}>← Back</button>
              <button className="btn-pm-save" onClick={submit} disabled={busy || uploading}>{busy ? 'Saving…' : (isEdit ? '💾 Update' : '＋ Create')}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===================== sub-views ===================== */

function PromosTab({ promos, setPromos, loading, onEdit }) {
  const { toast } = useUI();
  const [typeF, setTypeF] = useState('');
  const [query, setQuery] = useState('');

  const visible = (x) => (!typeF || x.t === typeF) && x.n.toLowerCase().includes(query.toLowerCase());

  const onToggle = async (idx, checked) => {
    const x = promos[idx];
    setPromos((prev) => prev.map((p, i) => (i === idx ? { ...p, on: checked ? 1 : 0 } : p)));
    if (x.id != null) {
      try { await togglePromotion(x.id); } catch { /* keep optimistic state on demo/offline */ }
    }
    toast(`${x.n} ${checked ? 'activated ✔' : 'deactivated'}`);
  };
  const onDelete = async (idx) => {
    const x = promos[idx];
    setPromos((prev) => prev.filter((_, i) => i !== idx));
    if (x.id != null) {
      try { await removePromotion(x.id); } catch { /* */ }
    }
    toast(`Promotion deleted: ${x.n}`);
  };
  // Adjust the banner/display sequence — move a promo up or down and persist.
  const move = async (idx, dir) => {
    const j = idx + dir;
    if (j < 0 || j >= promos.length) return;
    const next = [...promos];
    [next[idx], next[j]] = [next[j], next[idx]];
    setPromos(next);
    const ids = next.map((p) => p.id).filter(Boolean);
    if (ids.length) {
      try { await reorderPromotions(ids); toast('Order updated ✔'); }
      catch (e) { toast('⚠ ' + (e.message || 'Reorder failed')); }
    }
  };
  const reordering = !!typeF || !!query.trim(); // disable arrows while filtered

  return (
    <>
      <div className="grid kpi-grid">
        <div className="card kpi"><div className="lbl">Total Promos</div><div className="val">{loading ? '…' : promos.length}</div><div className="trend" style={{ color: 'var(--muted)' }}>all packages</div></div>
        <div className="card kpi g"><div className="lbl">Active</div><div className="val">{promos.filter((x) => x.on).length}</div><div className="trend" style={{ color: 'var(--muted)' }}>running now</div></div>
        <div className="card kpi b"><div className="lbl">Total Claims</div><div className="val">15.2K</div><div className="trend" style={{ color: 'var(--muted)' }}>all time</div></div>
        <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">Bonus Paid Out</div><div className="val">₱2.4M</div><div className="trend" style={{ color: 'var(--muted)' }}>this month</div></div>
      </div>
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="page-head" style={{ marginBottom: 12 }}><div className="card-title" style={{ marginBottom: 0 }}>Promotion Packages</div>
          <span className="pr" style={{ display: 'flex', gap: 8 }}>
            <select className="qsearch" style={{ width: 'auto' }} value={typeF} onChange={(e) => setTypeF(e.target.value)}><option value="">All Types</option><option value="welcome">Welcome</option><option value="deposit">Deposit</option><option value="reload">Reload</option><option value="cashback">Cashback</option><option value="freespin">Freespin</option><option value="referral">Referral</option><option value="tournament">Tournament</option></select>
            <input className="qsearch" placeholder="Search promo…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </span>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table style={{ minWidth: 1100 }}>
          <thead><tr><th>Order</th><th>Promotion</th><th>Type</th><th>Bonus</th><th>Min Dep</th><th>Wager</th><th>Turnover</th><th>Claims</th><th>Expiry</th><th>Active</th><th>Actions</th></tr></thead>
          <tbody>{promos.map((x, i) => (
            <tr key={x.id ?? i} style={{ display: visible(x) ? '' : 'none' }}>
              <td style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 2 }}>
                  <button className="mini-btn" disabled={reordering || i === 0 || !x.id} title="Move up" style={{ padding: '0 7px', lineHeight: '18px' }} onClick={() => move(i, -1)}>▲</button>
                  <button className="mini-btn" disabled={reordering || i === promos.length - 1 || !x.id} title="Move down" style={{ padding: '0 7px', lineHeight: '18px' }} onClick={() => move(i, 1)}>▼</button>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>#{i + 1}</div>
              </td>
              <td className="promo-cell">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {(() => {
                    const r = x.raw || {};
                    const thumb = r.image || (r.banners && Object.values(r.banners)[0]) || '';
                    return thumb
                      ? <img src={thumb} alt="" style={{ width: 54, height: 30, objectFit: 'cover', borderRadius: 5, flexShrink: 0, border: '1px solid var(--border)' }} />
                      : <span style={{ width: 54, height: 30, borderRadius: 5, flexShrink: 0, border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'var(--muted)' }}>🖼</span>;
                  })()}
                  <div style={{ minWidth: 0 }}>
                    <div className="pn">{x.n}
                      {(x.raw?.country || x.raw?.currency) && (
                        <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 800, color: '#8fc0ff', background: 'rgba(59,130,246,.16)', border: '1px solid rgba(59,130,246,.35)', borderRadius: 999, padding: '1px 7px' }}>
                          🌏 {[x.raw?.country, x.raw?.currency].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </div>
                    <div className="pd">{x.d}</div>
                  </div>
                </div>
              </td>
              <td><span className={`vtype ${x.tc}`}>{x.t}</span></td>
              <td className="bonus-cell">{x.b}<span className="mx">{x.mx}</span></td>
              <td>{x.md}</td><td className="wager-b">{x.w}</td><td className="turn-o">{x.to}</td>
              <td style={{ fontWeight: 800 }}>{x.cl}</td>
              <td style={x.on ? undefined : { color: 'var(--muted)' }}>{x.ex}</td>
              <td><label className="switch"><input type="checkbox" checked={!!x.on} onChange={(e) => onToggle(i, e.target.checked)} /><span className="slider"></span></label></td>
              <td><button className="mini-btn gold" onClick={() => onEdit(x)}>✏️ Edit</button> <button className="del-btn" onClick={() => onDelete(i)}>🗑</button></td>
            </tr>
          ))}</tbody>
        </table></div>
      </div>
    </>
  );
}

// Equal-sized segments visually; weight only controls win chance.
function wheelGrad(slices) {
  const act = slices.filter((x) => x.on);
  const n = act.length || 1;
  const seg = 360 / n;
  return 'conic-gradient(' + act.map((x, i) => `${x.c} ${(i * seg).toFixed(1)}deg ${((i + 1) * seg).toFixed(1)}deg`).join(',') + ')';
}

// Theme image-slot tile styles (the upload grid in the Theme card).
const slotWrap = { display: 'flex', flexDirection: 'column', gap: 6 };
const slotLabel = { fontSize: 12, fontWeight: 700, color: 'var(--muted,#8898b8)', textAlign: 'center' };
const slotBox = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  height: 96, padding: 8, borderRadius: 10, border: '1px dashed var(--border,#243049)',
  overflow: 'hidden', position: 'relative',
};
const slotEmpty = { color: 'var(--muted,#8898b8)', fontSize: 13, fontWeight: 700 };
const slotDel = {
  background: 'none', border: 'none', color: 'var(--red,#e8293a)', cursor: 'pointer',
  fontSize: 12, fontWeight: 700, padding: '2px 0', alignSelf: 'center',
};

function MgWheel({ slices, setSlices, wheelCfg = {}, setWheelCfg, onSave, saving }) {
  const { toast } = useUI();
  const [rot, setRot] = useState(0);
  const [imgUploading, setImgUploading] = useState(false);
  const tot = slices.filter((x) => x.on).reduce((a, x) => a + x.w, 0);

  const update = (idx, key, val) => setSlices((prev) => prev.map((s, i) => (i === idx ? { ...s, [key]: val } : s)));
  const addSlice = () => { setSlices((prev) => [...prev, { l: 'New Prize', type: 'Cash', p: 0, seq: prev.length + 1, w: 5, qty: 0, claimed: 0, req: 'T/O', mult: 3, c: '#3aa0ff', on: 1 }]); toast('Slice added ＋'); };
  const removeSlice = (idx) => { setSlices((prev) => prev.filter((_, i) => i !== idx)); toast('Slice removed'); };

  // Upload a custom wheel PNG. When set, the player wheel shows this image
  // instead of the generated colour wheel.
  const pickWheelImage = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { toast('⚠ Image too large — keep it under 4 MB'); return; }
    setImgUploading(true);
    try {
      const { url } = await uploadImage(file);
      setWheelCfg?.((s) => ({ ...s, image: url }));
      toast('Wheel image uploaded ✔');
    } catch (err) {
      toast('⚠ Upload failed: ' + (err.message || 'error'));
    } finally { setImgUploading(false); }
  };
  const removeWheelImage = () => setWheelCfg?.((s) => ({ ...s, image: '' }));

  // Theme design controls (background, title banner, colours).
  const theme = wheelCfg.theme || {};
  const setTheme = (k, v) => setWheelCfg?.((s) => ({ ...s, theme: { ...(s.theme || {}), [k]: v } }));
  const [themeUploading, setThemeUploading] = useState('');
  // Generic image-slot uploader: upload, then apply the URL via `apply(url)`.
  const pickSlotImage = (slotKey, apply) => async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { toast('⚠ Image too large — keep it under 4 MB'); return; }
    setThemeUploading(slotKey);
    try {
      const { url } = await uploadImage(file);
      apply(url);
      toast('Image uploaded ✔');
    } catch (err) {
      toast('⚠ Upload failed: ' + (err.message || 'error'));
    } finally { setThemeUploading(''); }
  };
  // One upload tile (label, preview, upload, remove) — mirrors the reference grid.
  const renderSlot = ({ key, label, url, apply, bg }) => (
    <div style={slotWrap}>
      <div style={slotLabel}>{label}</div>
      <label style={{ ...slotBox, background: bg || 'var(--bg3,#0b1224)' }} title={`Upload ${label}`}>
        {url
          ? <img src={url} alt={label} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          : <span style={slotEmpty}>{themeUploading === key ? 'Uploading…' : '＋ Upload'}</span>}
        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={pickSlotImage(key, apply)} />
      </label>
      {url && <button style={slotDel} onClick={(ev) => { ev.preventDefault(); apply(''); }}>🗑 Remove</button>}
    </div>
  );
  const spinTest = () => {
    const next = rot + 1080 + Math.floor(Math.random() * 360);
    setRot(next);
    const act = slices.filter((x) => x.on);
    const total = act.reduce((a, x) => a + x.w, 0) || 1;
    let r = Math.random() * total; let win = act[0];
    for (const x of act) { r -= x.w; if (r <= 0) { win = x; break; } }
    setTimeout(() => toast('🎡 Spin result: ' + win.l + (win.p > 0 ? ' — ₱' + win.p.toLocaleString() : '') + ' !'), 2400);
  };

  return (
    <div className="wheel-grid">
      <div className="card">
        <div className="page-head" style={{ marginBottom: 12 }}><div className="card-title" style={{ marginBottom: 0 }}>🎡 Wheel Slices</div>
          <span className="pr" style={{ display: 'flex', gap: 8 }}>
            <button className="mini-btn" style={{ background: 'rgba(58,160,255,.18)', borderColor: 'var(--blue)', color: 'var(--blue)' }} onClick={addSlice}>＋ Add Slice</button>
            <button className="btn-search" onClick={onSave} disabled={saving}>{saving ? 'Saving…' : '💾 Save Wheel'}</button>
          </span>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table style={{ minWidth: 900 }}>
          <thead><tr>
            <th>#</th><th>Name</th><th>Type</th><th>Prize</th><th>Sequence</th>
            <th>Percentage</th><th>Quantity</th><th>Claimed Qty</th><th>Requirement</th>
            <th>Multiply</th><th>Colour</th><th>Active</th><th>Del</th>
          </tr></thead>
          <tbody>{slices.map((x, i) => (
            <tr key={i}>
              <td style={{ color: 'var(--muted)', textAlign: 'center' }}>{i + 1}</td>
              <td><input className="slice-in" value={x.l} onChange={(e) => update(i, 'l', e.target.value)} /></td>
              <td>
                <select className="slice-in" value={x.type || 'Cash'} onChange={(e) => update(i, 'type', e.target.value)}>
                  {SLICE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </td>
              <td><input className="slice-in num" style={{ color: 'var(--gold)' }} value={x.p} onChange={(e) => update(i, 'p', parseInt(e.target.value) || 0)} /></td>
              <td><input className="slice-in num" value={x.seq ?? i + 1} onChange={(e) => update(i, 'seq', parseInt(e.target.value) || 0)} /></td>
              <td><input className="slice-in num" value={x.w} onChange={(e) => update(i, 'w', parseFloat(e.target.value) || 0)} /></td>
              <td><input className="slice-in num" value={x.qty ?? 0} onChange={(e) => update(i, 'qty', parseInt(e.target.value) || 0)} title="0 = unlimited" /></td>
              <td style={{ color: 'var(--muted)', textAlign: 'center' }}>{(x.claimed ?? 0).toLocaleString()}</td>
              <td>
                <select className="slice-in" value={x.req || 'T/O'} onChange={(e) => update(i, 'req', e.target.value)}>
                  {SLICE_REQS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </td>
              <td><input className="slice-in num" value={x.mult ?? 0} onChange={(e) => update(i, 'mult', parseInt(e.target.value) || 0)} /></td>
              <td><input type="color" value={x.c || '#3aa0ff'} onChange={(e) => update(i, 'c', e.target.value)} style={{ width: 34, height: 26, padding: 0, border: '1px solid var(--border)', borderRadius: 6, background: 'none', cursor: 'pointer' }} /></td>
              <td><label className="switch"><input type="checkbox" checked={!!x.on} onChange={(e) => update(i, 'on', e.target.checked ? 1 : 0)} /><span className="slider"></span></label></td>
              <td><button className="del-x" onClick={() => removeSlice(i)}>✕</button></td>
            </tr>
          ))}</tbody>
          <tfoot><tr style={{ borderTop: '2px solid var(--border)' }}>
            <td colSpan={5} style={{ textAlign: 'right', color: 'var(--muted)', fontWeight: 700, padding: '8px 6px' }}>Totals</td>
            <td style={{ fontWeight: 800, color: tot === 100 ? 'var(--green)' : 'var(--red)' }}>{tot.toFixed(4)}</td>
            <td style={{ fontWeight: 800, color: 'var(--green)' }}>{slices.reduce((a, s) => a + (Number(s.qty) || 0), 0).toLocaleString()}</td>
            <td style={{ fontWeight: 800, color: 'var(--red)' }}>{slices.reduce((a, s) => a + (Number(s.claimed) || 0), 0).toLocaleString()}</td>
            <td colSpan={4}></td>
          </tr></tfoot>
        </table></div>
        <div className="tw-row"><span style={{ color: 'var(--muted)' }}>Total Win Chance:</span><span className={tot === 100 ? 'tw-ok' : 'tw-bad'}>{tot}%</span></div>
      </div>
      <div>
        <div className="card"><div className="card-title" style={{ textAlign: 'center' }}>Live Preview</div>
          <div className="wheel-wrap">
            {(() => {
              const act = slices.filter((s) => s.on);
              const n = act.length || 1;
              const seg = 360 / n;
              const D = 250;          // disc diameter
              const R = D / 2;
              const pt = (deg, rad) => { const a = (deg - 90) * (Math.PI / 180); return { x: R + rad * Math.cos(a), y: R + rad * Math.sin(a) }; };
              return (
                <div style={{ position: 'relative', width: D, height: D, margin: '0 auto 8px' }}>
                  {/* disc */}
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    ...(wheelCfg.image
                      ? { backgroundImage: `url(${wheelCfg.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                      : { background: wheelGrad(slices) }),
                    transform: `rotate(${rot}deg)`, transition: 'transform 2.2s cubic-bezier(.17,.67,.27,1)',
                    border: '6px solid #f4b223', boxShadow: '0 0 0 3px rgba(0,0,0,.45), inset 0 0 26px rgba(0,0,0,.45)',
                  }}>
                    {!wheelCfg.image && act.map((s, i) => {
                      const c = (i + 0.5) * seg;
                      const p = pt(c, R * 0.6);
                      return <span key={i} style={{ position: 'absolute', left: p.x, top: p.y, transform: `translate(-50%,-50%) rotate(${c}deg)`, fontSize: 11, fontWeight: 800, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,.85)', whiteSpace: 'nowrap', pointerEvents: 'none' }}>{s.l}</span>;
                    })}
                  </div>
                  {/* hub */}
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 30, height: 30, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #fff2c0, #f4b223)', border: '2px solid rgba(0,0,0,.35)', zIndex: 2 }} />
                  {/* sequence badges 1..n around the clock (1 at top, clockwise) */}
                  {act.map((s, i) => {
                    const p = pt(i * seg, R + 4);
                    return <span key={`b${i}`} style={{ position: 'absolute', left: p.x, top: p.y, transform: 'translate(-50%,-50%)', width: 22, height: 22, borderRadius: '50%', background: '#0b1224', color: '#fff', border: '2px solid #f4b223', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3, boxShadow: '0 2px 5px rgba(0,0,0,.5)' }}>{i + 1}</span>;
                  })}
                </div>
              );
            })()}
            <button className="spin-btn" onClick={spinTest}>▶ Spin Test</button>
          </div>
          {/* Custom wheel image (PNG) — overrides the generated colour wheel */}
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 12, paddingTop: 12 }}>
            <div className="fld-lbl" style={{ marginBottom: 6 }}>Wheel Image <span style={{ color: 'var(--muted)', fontWeight: 600 }}>(optional PNG — square, transparent background)</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <input type="file" accept="image/png,image/*" onChange={pickWheelImage} />
              {imgUploading && <span style={{ color: 'var(--gold)' }}>uploading…</span>}
              {wheelCfg.image && (
                <>
                  <img src={wheelCfg.image} alt="wheel" style={{ height: 40, width: 40, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }} />
                  <button className="del-btn" onClick={removeWheelImage}>🗑 Remove</button>
                </>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>For a custom image the prizes use equal segments in the slice order above. Save to publish.</div>
          </div>
        </div>
        <div className="card" style={{ marginTop: 'var(--pad)' }}>
          <div className="card-title">🎨 Theme <span style={{ color: 'var(--muted)', fontSize: 12, fontWeight: 600 }}>(upload each element — change anytime)</span></div>
          <div className="fld" style={{ marginBottom: 14 }}>
            <label>Title Text <span style={{ color: 'var(--muted)', fontWeight: 600, fontSize: 11 }}>(used when no Title image)</span></label>
            <input value={theme.title || ''} onChange={(e) => setTheme('title', e.target.value)} placeholder="WHEEL OF FORTUNE" />
          </div>
          {/* Image-slot grid — Background & Title behind, Frame is the rim,
              Prize is the disc, Pin sits in the CENTRE, Token at the BOTTOM, Button below. */}
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>Layout: <b style={{ color: 'var(--text)' }}>Background · Title · Frame (rim) → Prize (disc) · Pin (centre) · Token (bottom) · Button</b></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12 }}>
            {renderSlot({ key: 'bgImage', label: 'Background', url: theme.bgImage, apply: (u) => setTheme('bgImage', u) })}
            {renderSlot({ key: 'titleImage', label: 'Title', url: theme.titleImage, apply: (u) => setTheme('titleImage', u) })}
            {renderSlot({ key: 'frameImage', label: 'Frame (rim)', url: theme.frameImage, apply: (u) => setTheme('frameImage', u) })}
            {renderSlot({ key: 'prizeImage', label: 'Prize Wheel (disc)', url: wheelCfg.image, apply: (u) => setWheelCfg?.((s) => ({ ...s, image: u })) })}
            {renderSlot({ key: 'pinImage', label: 'Pin (centre)', url: theme.pinImage, apply: (u) => setTheme('pinImage', u) })}
            {renderSlot({ key: 'tokenImage', label: 'Token (bottom)', url: theme.tokenImage, apply: (u) => setTheme('tokenImage', u) })}
            {renderSlot({ key: 'buttonImage', label: 'Button', url: theme.buttonImage, apply: (u) => setTheme('buttonImage', u) })}
          </div>
          {/* Prize fit — how big the prize disc sits inside the frame ring */}
          {theme.frameImage && (
            <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: 'var(--bg3,#0b1224)', border: '1px solid var(--border)' }}>
              <label className="fld-lbl" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span>Prize size inside frame</span>
                <b style={{ color: 'var(--gold)' }}>{Math.round((theme.discScale ?? 0.74) * 100)}%</b>
              </label>
              <input type="range" min="50" max="100" step="1" value={Math.round((theme.discScale ?? 0.74) * 100)}
                onChange={(e) => setTheme('discScale', (parseInt(e.target.value, 10) || 74) / 100)} style={{ width: '100%' }} />
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Shrink the prize wheel so it sits neatly inside your frame ring — increase until the gold rim hugs the prize edge.</div>
            </div>
          )}
          {/* Fallback colours — used for any element that has no uploaded image */}
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 14, paddingTop: 12 }}>
            <div className="fld-lbl" style={{ marginBottom: 8 }}>Fallback Colours <span style={{ color: 'var(--muted)', fontWeight: 600 }}>(used where no image is uploaded)</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div><label className="fld-lbl">Rim / Frame</label><input type="color" value={theme.rimColor || '#f4b223'} onChange={(e) => setTheme('rimColor', e.target.value)} style={{ width: '100%', height: 38, borderRadius: 8, background: 'none', border: '1px solid var(--border)' }} /></div>
              <div><label className="fld-lbl">Hub</label><input type="color" value={theme.hubColor || '#f4b223'} onChange={(e) => setTheme('hubColor', e.target.value)} style={{ width: '100%', height: 38, borderRadius: 8, background: 'none', border: '1px solid var(--border)' }} /></div>
              <div><label className="fld-lbl">Pointer / Pin</label><input type="color" value={theme.pointerColor || '#f4b223'} onChange={(e) => setTheme('pointerColor', e.target.value)} style={{ width: '100%', height: 38, borderRadius: 8, background: 'none', border: '1px solid var(--border)' }} /></div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)', fontSize: 14, marginTop: 12 }}>
              <input type="checkbox" checked={theme.bulbs !== false} onChange={(e) => setTheme('bulbs', e.target.checked)} /> Show light-bulb rim
            </label>
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10 }}>Upload PNGs with transparent backgrounds for Title, Frame, Pin, Token &amp; Button. Changes go live on the player wheel after <b>Save Wheel</b>.</div>
        </div>
        <div className="card" style={{ marginTop: 'var(--pad)' }}><div className="card-title">📊 Wheel Stats</div>
          <div className="wstat-row"><span className="k">Total Spins Today</span><span className="v">911</span></div>
          <div className="wstat-row"><span className="k">Spins This Month</span><span className="v">21,620</span></div>
          <div className="wstat-row"><span className="k">Total Prize Paid</span><span className="v" style={{ color: 'var(--gold)' }}>₱249,674</span></div>
          <div className="wstat-row"><span className="k">Most Won Prize</span><span className="v" style={{ color: 'var(--green)' }}>₱100 Cash</span></div>
        </div>
      </div>
    </div>
  );
}

function MgTicket() {
  const { toast } = useUI();
  return (
    <div className="lt-grid">
      <div className="card">
        <div className="page-head" style={{ marginBottom: 12 }}><div className="card-title" style={{ marginBottom: 0 }}>🎟️ Ticket Prize Pool</div>
          <span className="pr"><button className="gen-btn" onClick={() => toast('Ticket pool generated 🔄 10,000 tickets')}>🔄 Generate</button></span>
        </div>
        <div className="fld" style={{ marginBottom: 12 }}><label>Draw Date &amp; Time</label><input defaultValue="07/01/2026 08:00 PM" /></div>
        <div className="pm-grid">
          <div className="pm-fld"><label>Total Tickets</label><input defaultValue="10000" /></div>
          <div className="pm-fld"><label>Winners Count</label><input defaultValue="50" /></div>
        </div>
        <div className="fld" style={{ margin: '12px 0' }}><label>Ticket Format</label><select><option>6-Digit Number (000000–999999)</option><option>8-Char Alphanumeric</option><option>4-Digit Number</option></select></div>
        <div className="fld" style={{ marginBottom: 12 }}><label>Earn Ticket By</label><select><option>Every ₱100 deposited</option><option>Every ₱500 wagered</option><option>Daily login</option></select></div>
        <div className="pm-grid">
          <div className="pm-fld"><label>Min Deposit (₱)</label><input defaultValue="₱ 100" /></div>
          <div className="pm-fld"><label>Min Wager (₱)</label><input defaultValue="₱ 500" /></div>
        </div>
        <button className="runbtn" onClick={() => toast('🎯 Draw executed! 50 winners selected — results published')}>🎯 Run Draw Now</button>
      </div>
      <div>
        <div className="card"><div className="card-title">🏆 Prize Tiers</div>
          <Table cols={['Rank', 'Prize', 'Winners']} rows={[
            [<b key="r">🥇 1st</b>, <span key="p" style={{ color: 'var(--gold)', fontWeight: 900 }}>₱50,000 Cash</span>, '1'],
            [<b key="r">🥈 2nd</b>, <span key="p" style={{ color: 'var(--gold)', fontWeight: 900 }}>₱20,000 Cash</span>, '3'],
            [<b key="r">🥉 3rd</b>, <span key="p" style={{ color: 'var(--gold)', fontWeight: 900 }}>₱10,000 Cash</span>, '5'],
            [<b key="r">4th–10th</b>, <span key="p" style={{ color: 'var(--gold)', fontWeight: 900 }}>₱5,000 Cash</span>, '7'],
            [<b key="r">11th–30th</b>, <span key="p" style={{ color: 'var(--gold)', fontWeight: 900 }}>₱1,000 Cash</span>, '20'],
            [<b key="r">31st–50th</b>, <span key="p" style={{ color: 'var(--gold)', fontWeight: 900 }}>₱500 Cash</span>, '20'],
          ]} style={{ border: 'none', borderRadius: 0 }} />
        </div>
        <div className="card" style={{ marginTop: 'var(--pad)' }}><div className="card-title">📄 Recent Draws</div>
          <Table cols={['Date', 'Winners', 'Paid', 'Status']} rows={[
            ['2026-05-31', '50 winners', <span key="p" style={{ color: 'var(--gold)', fontWeight: 900 }}>₱210,000</span>, <span key="s" className="badge ok">completed</span>],
            ['2026-04-30', '50 winners', <span key="p" style={{ color: 'var(--gold)', fontWeight: 900 }}>₱195,000</span>, <span key="s" className="badge ok">completed</span>],
            ['2026-03-31', '50 winners', <span key="p" style={{ color: 'var(--gold)', fontWeight: 900 }}>₱180,000</span>, <span key="s" className="badge ok">completed</span>],
          ]} style={{ border: 'none', borderRadius: 0 }} />
        </div>
      </div>
    </div>
  );
}

function MgSettings({ wheelCfg, setWheelCfg, ticketCfg, setTicketCfg, onSave, saving }) {
  const w = (k, v) => setWheelCfg((s) => ({ ...s, [k]: v }));
  const t = (k, v) => setTicketCfg((s) => ({ ...s, [k]: v }));
  const numv = (v) => Math.max(0, parseInt(String(v).replace(/[^0-9]/g, ''), 10) || 0);
  return (
    <div className="mgs-grid">
      <div className="card"><div className="card-title">🎡 Fortune Wheel Settings</div>
        <div className="kb-tgl"><label className="switch"><input type="checkbox" checked={!!wheelCfg.enabled} onChange={(e) => w('enabled', e.target.checked)} /><span className="slider"></span></label>Wheel Enabled</div>
        <div className="kb-tgl"><label className="switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label>Show on Login</div>
        <div className="kb-tgl" style={{ marginBottom: 8 }}><label className="switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label>Sound Effects</div>
        <div className="fld" style={{ marginBottom: 12 }}><label>Free Spins per Day</label><input value={wheelCfg.freeSpinsPerDay} onChange={(e) => w('freeSpinsPerDay', numv(e.target.value))} /></div>
        <div className="fld" style={{ marginBottom: 12 }}><label>Paid Spin Cost (₱)</label><input value={wheelCfg.spinCost} onChange={(e) => w('spinCost', numv(e.target.value))} /></div>
        <div className="fld"><label>Max Spins per Day (per player)</label><input value={wheelCfg.maxPerDay} onChange={(e) => w('maxPerDay', numv(e.target.value))} /></div>
      </div>
      <div>
        <div className="card"><div className="card-title">🎟️ Lucky Ticket Settings</div>
          <div className="kb-tgl"><label className="switch"><input type="checkbox" checked={!!ticketCfg.enabled} onChange={(e) => t('enabled', e.target.checked)} /><span className="slider"></span></label>Lucky Ticket Enabled</div>
          <div className="kb-tgl" style={{ marginBottom: 8 }}><label className="switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label>Email Notification on Win</div>
          <div className="fld" style={{ marginBottom: 12 }}><label>Draw Date &amp; Time</label><input value={ticketCfg.drawDate} onChange={(e) => t('drawDate', e.target.value)} placeholder="07/01/2026 08:00 PM" /></div>
          <div className="fld" style={{ marginBottom: 12 }}><label>Total Tickets</label><input value={ticketCfg.totalTickets} onChange={(e) => t('totalTickets', numv(e.target.value))} /></div>
          <div className="fld"><label>Max Tickets per Player</label><input value={ticketCfg.maxPerPlayer} onChange={(e) => t('maxPerPlayer', numv(e.target.value))} /></div>
        </div>
        <div style={{ marginTop: 'var(--pad)', textAlign: 'right' }}><button className="btn-search" onClick={onSave} disabled={saving}>{saving ? 'Saving…' : '💾 Save Settings'}</button></div>
      </div>
    </div>
  );
}

function MiniTab({ slices, setSlices, wheelCfg, setWheelCfg, ticketCfg, setTicketCfg, onSave, saving }) {
  const [mgTab, setMgTab] = useState('wheel');
  return (
    <>
      <div className="mg-pills">
        <button className={`mg-pill ${mgTab === 'wheel' ? 'active' : ''}`} onClick={() => setMgTab('wheel')}>🎡 Fortune Wheel</button>
        <button className={`mg-pill ${mgTab === 'ticket' ? 'active' : ''}`} onClick={() => setMgTab('ticket')}>🎟️ Lucky Ticket</button>
        <button className={`mg-pill ${mgTab === 'set' ? 'active' : ''}`} onClick={() => setMgTab('set')}>⚙️ Settings</button>
      </div>
      {mgTab === 'wheel' ? <MgWheel slices={slices} setSlices={setSlices} wheelCfg={wheelCfg} setWheelCfg={setWheelCfg} onSave={onSave} saving={saving} />
        : mgTab === 'ticket' ? <MgTicket />
          : <MgSettings wheelCfg={wheelCfg} setWheelCfg={setWheelCfg} ticketCfg={ticketCfg} setTicketCfg={setTicketCfg} onSave={onSave} saving={saving} />}
    </>
  );
}

function BigwinsTab({ bigwins, setBigwins }) {
  const { toast } = useUI();
  const [catF, setCatF] = useState('');
  const [query, setQuery] = useState('');
  const visible = (x) => (!catF || x.cat === catF) && (x.g + ' ' + x.pl).toLowerCase().includes(query.toLowerCase());

  const toggle = (idx, checked) => {
    const x = bigwins[idx];
    setBigwins((prev) => prev.map((b, i) => (i === idx ? { ...b, on: checked ? 1 : 0 } : b)));
    toast(`${x.g} ${checked ? 'shown on strip ✔' : 'hidden from strip'}`);
  };
  const del = (idx) => { const x = bigwins[idx]; setBigwins((prev) => prev.filter((_, i) => i !== idx)); toast(`Entry deleted: ${x.g}`); };

  const tickerChips = bigwins.filter((x) => x.on).map((x, i) => (
    <span key={i} className="tick-chip"><span className="ti">{x.ic}</span><span><div className="tn">{x.g}</div><div className="tm">{x.pl} · x{x.m}</div></span><span className="tp">{x.pz}</span></span>
  ));

  return (
    <>
      <div className="page-head">
        <div><h1 className="hero-h" style={{ fontSize: '1.15rem' }}>⚡ Big Wins — Casino Front End</h1><div className="hero-sub" style={{ marginBottom: 0 }}>Control what appears in the Big Wins scrolling strip on the casino homepage</div></div>
        <span className="pr" style={{ display: 'flex', gap: 8 }}><button className="mini-btn" onClick={() => toast('Strip refreshed 🔄')}>🔄 Refresh</button><button className="btn-search" onClick={() => toast('Add Win — demo')}>＋ Add Win</button></span>
      </div>
      <div className="grid kpi-grid">
        <div className="card kpi"><div className="lbl">Total Entries</div><div className="val">{bigwins.length}</div><div className="trend" style={{ color: 'var(--muted)' }}>in strip</div></div>
        <div className="card kpi g"><div className="lbl">Active</div><div className="val">{bigwins.filter((x) => x.on).length}</div><div className="trend" style={{ color: 'var(--muted)' }}>showing now</div></div>
        <div className="card kpi b"><div className="lbl">Highest Win</div><div className="val">₱18,500.00</div></div>
        <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">Strip Status</div><div className="val" style={{ fontSize: '1rem', color: 'var(--green)' }}>● LIVE</div><label className="switch"><input type="checkbox" defaultChecked onChange={(e) => toast(e.target.checked ? 'Strip is LIVE ●' : 'Strip paused')} /><span className="slider"></span></label></div>
      </div>
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="page-head" style={{ marginBottom: 12 }}><div className="card-title" style={{ marginBottom: 0 }}>⚡ Big Win Entries</div>
          <span className="pr" style={{ display: 'flex', gap: 8 }}>
            <select className="qsearch" style={{ width: 'auto' }} value={catF} onChange={(e) => setCatF(e.target.value)}><option value="">All Categories</option><option>Slots</option><option>Crash</option></select>
            <input className="qsearch" placeholder="Search game or player…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </span>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table style={{ minWidth: 1020 }}>
          <thead><tr><th>Game</th><th>Icon</th><th>Player</th><th>Multiplier</th><th>Prize</th><th>Category</th><th>Show on Strip</th><th>Actions</th></tr></thead>
          <tbody>{bigwins.map((x, i) => (
            <tr key={i} style={{ display: visible(x) ? '' : 'none' }}>
              <td><span className="bw-icon">{x.ic}</span><b>{x.g}</b></td><td style={{ fontSize: '1.05rem' }}>{x.ic}</td>
              <td><span className="mask">{x.pl}</span></td><td className="mult">x{x.m}</td>
              <td className="prize-g">{x.pz}</td><td>{x.cat === 'Crash' ? '💥 Crash' : '🎰 Slots'}</td>
              <td><label className="switch"><input type="checkbox" checked={!!x.on} onChange={(e) => toggle(i, e.target.checked)} /><span className="slider"></span></label></td>
              <td><button className="mini-btn gold" onClick={() => toast(`Edit win: ${x.g} — demo`)}>✏️</button> <button className="del-btn" onClick={() => del(i)}>🗑</button></td>
            </tr>
          ))}</tbody>
        </table></div>
      </div>
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="page-head" style={{ marginBottom: 0 }}><div className="card-title" style={{ marginBottom: 0 }}>🖥️ Casino Strip Preview — Live Ticker</div>
          <span className="pr" style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 800 }}>Speed: <select className="qsearch" style={{ width: 'auto' }}><option value="30s">Normal</option><option value="16s">Fast</option><option value="55s">Slow</option></select> Pause on hover <label className="switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label></span>
        </div>
        <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 800, padding: '10px 2px 0' }}>⚡ Big Wins</div>
        <div className="ticker-shell paused"><div className="ticker-track">{tickerChips}{tickerChips}</div></div>
        <div className="live-note">● Live — changes here reflect immediately on the casino homepage</div>
      </div>
    </>
  );
}

function TierTab({ tiers, setTiers }) {
  const { toast } = useUI();
  const update = (idx, key, val) => setTiers((prev) => prev.map((t, i) => (i === idx ? { ...t, [key]: val } : t)));
  return (
    <>
      <div className="hintbar">👑<span>Configure different spin rates and ticket multipliers per VIP tier. Higher tiers get better odds and more free spins.</span></div>
      <div className="card"><div className="card-title">👑 Tier Rate Control</div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table style={{ minWidth: 980 }}>
          <thead><tr><th>VIP Tier</th><th>Free Spins/Day</th><th>Max Spins/Day</th><th>Spin Cost (₱)</th><th style={{ color: 'var(--gold)' }}>Jackpot Rate %</th><th style={{ color: 'var(--blue)' }}>Ticket Multiplier</th><th style={{ color: 'var(--green)' }}>Prize Boost %</th><th>Enabled</th></tr></thead>
          <tbody>{tiers.map((t, i) => (
            <tr key={i}>
              <td><span className="tdot" style={{ background: t.c }}></span><b>{t.n}</b></td>
              <td><input className="slice-in num" style={{ color: 'var(--text)' }} value={t.fs} onChange={(e) => update(i, 'fs', e.target.value)} /></td>
              <td><input className="slice-in num" style={{ color: 'var(--text)' }} value={t.mx} onChange={(e) => update(i, 'mx', e.target.value)} /></td>
              <td><input className="slice-in num" style={{ color: 'var(--text)' }} value={t.sc} onChange={(e) => update(i, 'sc', e.target.value)} /></td>
              <td><input className="slice-in num rate-g" value={t.jr} onChange={(e) => update(i, 'jr', e.target.value)} /></td>
              <td><input className="slice-in num rate-b" value={t.tm} onChange={(e) => update(i, 'tm', e.target.value)} /></td>
              <td><input className="slice-in num rate-gr" value={t.pb} onChange={(e) => update(i, 'pb', e.target.value)} /></td>
              <td><label className="switch"><input type="checkbox" checked={!!t.on} onChange={(e) => { update(i, 'on', e.target.checked ? 1 : 0); toast(`${t.n} tier ${e.target.checked ? 'enabled ✔' : 'disabled'}`); }} /><span className="slider"></span></label></td>
            </tr>
          ))}</tbody>
        </table></div>
        <div style={{ marginTop: 14, textAlign: 'right' }}><button className="btn-search" onClick={() => toast('Tier rates saved! ✔ 10 tiers updated')}>💾 Save Tier Rates</button></div>
      </div>
    </>
  );
}

function KycTab() {
  const { toast } = useUI();
  const [wm, setWm] = useState('5');
  return (
    <>
      <div className="hintbar green">✅<span>Players receive this bonus <b>automatically</b> when their KYC verification is approved. Configure the bonus amount, deposit trigger and withdrawal turnover below.</span></div>
      <div className="grid kpi-grid">
        <div className="card kpi g"><div className="lbl">KYC Approved (Today)</div><div className="val">3</div></div>
        <div className="card kpi"><div className="lbl">Bonuses Issued (Month)</div><div className="val">109</div></div>
        <div className="card kpi b"><div className="lbl">Total Bonus Paid Out</div><div className="val">₱55,782</div></div>
        <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">Bonus Enabled</div><div className="val" style={{ fontSize: '1rem', color: 'var(--green)' }}>● ACTIVE</div><label className="switch"><input type="checkbox" defaultChecked onChange={(e) => toast(e.target.checked ? 'KYC bonus ACTIVE ●' : 'KYC bonus disabled')} /><span className="slider"></span></label></div>
      </div>
      <div className="kb-grid" style={{ marginTop: 'var(--pad)' }}>
        <div className="card"><div className="card-title">🧧 Bonus Configuration</div>
          <div className="fld" style={{ marginBottom: 12 }}><label>Bonus Type</label><select><option>Fixed Amount (₱)</option><option>% of First Deposit</option></select></div>
          <div className="fld" style={{ marginBottom: 12 }}><label>Bonus Amount (₱)</label><input defaultValue="₱ 500" /></div>
          <div className="fld" style={{ marginBottom: 12 }}><label>Max Bonus Cap (₱) <span style={{ color: 'var(--muted)', fontWeight: 700 }}>(for % type)</span></label><input defaultValue="₱ 5000" /></div>
          <div className="fld" style={{ marginBottom: 12 }}><label>Trigger</label><select><option>On KYC Approval (instant, no deposit needed)</option><option>On first deposit after KYC</option></select></div>
          <div className="fld" style={{ marginBottom: 12 }}><label>Minimum Deposit (₱)</label><input defaultValue="₱ 100" /></div>
          <div className="fld" style={{ marginBottom: 8 }}><label>Bonus Expiry (days after issuance)</label><input defaultValue="7" /></div>
          <div className="kb-tgl"><label className="switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label>One-time per player only</div>
          <div className="kb-tgl"><label className="switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label>Auto-credit on approval</div>
          <div className="kb-tgl"><label className="switch"><input type="checkbox" /><span className="slider"></span></label>SMS notification on award</div>
          <div className="kb-tgl"><label className="switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label>Email notification on award</div>
        </div>
        <div>
          <div className="card"><div className="card-title">🔄 Turnover / Withdrawal Requirement</div>
            <div className="fld" style={{ marginBottom: 4 }}><label>Wager Multiplier</label></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><input className="wm-box" value={wm} onChange={(e) => setWm(e.target.value)} /><span style={{ color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>× bonus amount must be wagered before withdrawal</span></div>
            <div className="wm-hint">e.g. ₱500 bonus × {wm || 0} = <b>₱{((parseInt(wm) || 0) * 500).toLocaleString()}</b> must be wagered before withdrawal</div>
            <div className="fld" style={{ marginBottom: 12 }}><label>Applicable Games for Turnover</label><select><option>All Games</option><option>Slots only</option><option>Exclude Live Casino</option></select></div>
            <div className="fld" style={{ marginBottom: 12 }}><label>Minimum Withdrawal (₱)</label><input defaultValue="₱ 500" /></div>
            <div className="fld" style={{ marginBottom: 8 }}><label>Max Withdrawal of Bonus Winnings (₱)</label><input defaultValue="₱ 10000" /></div>
            <div className="kb-tgl"><label className="switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label>Forfeit bonus if withdrawal attempted before turnover</div>
            <div className="kb-tgl"><label className="switch"><input type="checkbox" /><span className="slider"></span></label>Allow partial withdrawal (pro-rated turnover)</div>
          </div>
          <div className="card" style={{ marginTop: 'var(--pad)' }}><div className="card-title">📄 Recent Awards</div>
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table style={{ minWidth: 480 }}>
              <thead><tr><th>Player</th><th>Bonus</th><th>Turnover</th><th>Status</th></tr></thead>
              <tbody>{KB_AWARDS.map((a, i) => (
                <tr key={i}>
                  <td><span className="mask">{a[0]}</span></td><td style={{ color: 'var(--gold)', fontWeight: 900 }}>₱500</td>
                  <td><div className="tp-lbl">₱2,500</div><div className="tprog"><i style={{ width: `${a[3]}%`, background: a[3] >= 100 ? 'var(--green)' : 'var(--blue)' }}></i></div></td>
                  <td><span className={`kbst ${a[1]}`}>{a[2]}</span></td>
                </tr>
              ))}</tbody>
            </table></div>
          </div>
          <div style={{ marginTop: 'var(--pad)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn-cancel" onClick={() => toast('Changes discarded')}>Discard</button>
            <button className="btn-search" onClick={() => toast('KYC Bonus config saved! ✔')}>💾 Save KYC Bonus Config</button>
          </div>
        </div>
      </div>
    </>
  );
}

function SettingsTab() {
  const { toast } = useUI();
  return (
    <div className="card"><div className="card-title">⚙️ Promotion Settings</div>
      <div className="kb-tgl"><label className="switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label>Auto-apply best eligible bonus at deposit</div>
      <div className="kb-tgl"><label className="switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label>Show promotion banners on homepage</div>
      <div className="kb-tgl"><label className="switch"><input type="checkbox" /><span className="slider"></span></label>Allow stacking multiple active bonuses</div>
      <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 12 }}>
        <div className="fld"><label>Max Active Bonuses per Player</label><input defaultValue="1" /></div>
        <div className="fld"><label>Bonus Abuse Flag Threshold</label><input defaultValue="3 accounts / device" /></div>
      </div>
      <div style={{ marginTop: 14, textAlign: 'right' }}><button className="btn-search" onClick={() => toast('Promotion settings saved! ✔')}>💾 Save Settings</button></div>
    </div>
  );
}

/* ===================== main ===================== */

export default function Promotions() {
  const { toast } = useUI();
  const [tab, setTab] = useState('promos');
  const [promos, setPromos] = useState(DEMO_PROMOS);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | {} (new) | backend record (edit)
  const [slices, setSlices] = useState(INITIAL_SLICES);
  const [bigwins, setBigwins] = useState(INITIAL_BIGWINS);
  const [tiers, setTiers] = useState(TIER_RC_INIT);
  const [wheelCfg, setWheelCfg] = useState(INITIAL_WHEEL_CFG);
  const [ticketCfg, setTicketCfg] = useState(INITIAL_TICKET_CFG);
  const [savingMg, setSavingMg] = useState(false);

  // Load the persisted Fortune Wheel + Lucky Ticket config so the editor shows
  // the same data the player site plays against.
  useEffect(() => {
    let alive = true;
    getMiniGames().then((cfg) => {
      if (!alive || !cfg) return;
      if (Array.isArray(cfg.wheel?.slices) && cfg.wheel.slices.length) setSlices(cfg.wheel.slices);
      if (cfg.wheel) setWheelCfg((s) => ({ ...s, enabled: cfg.wheel.enabled, image: cfg.wheel.image || '', theme: { ...INITIAL_WHEEL_THEME, ...(cfg.wheel.theme || {}) }, freeSpinsPerDay: cfg.wheel.freeSpinsPerDay, spinCost: cfg.wheel.spinCost, maxPerDay: cfg.wheel.maxPerDay }));
      if (cfg.ticket) setTicketCfg((s) => ({ ...s, ...cfg.ticket }));
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const saveMiniGamesCfg = async () => {
    setSavingMg(true);
    try {
      const saved = await saveMiniGames({ wheel: { ...wheelCfg, slices }, ticket: ticketCfg });
      if (saved?.wheel?.slices) setSlices(saved.wheel.slices);
      toast('Mini games saved ✔ — live on the player site');
    } catch (e) {
      toast('⚠ ' + (e.message || 'Save failed'));
    } finally { setSavingMg(false); }
  };

  const reload = async () => {
    try {
      const res = await listPromotions();
      const arr = Array.isArray(res) ? res : (res?.data || res?.items || res?.promotions || []);
      if (Array.isArray(arr) && arr.length) setPromos(arr.map(normalizePromo));
      else setPromos(DEMO_PROMOS); // nothing on the server yet -> sample data
    } catch {
      // error -> keep whatever is on screen (demo fallback)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { let alive = true; reload().finally(() => { if (!alive) return; }); return () => { alive = false; }; }, []);

  const onEdit = (x) => {
    if (x.id == null) { toast('This is sample data — use ＋ Create Promotion to add a real one'); return; }
    setEditing(x.raw || x);
  };
  const onSaved = async () => { setEditing(null); await reload(); };

  return (
    <>
      <div className="page-head">
        <div><h1 className="hero-h">🔔 Promotions</h1><div className="hero-sub" style={{ marginBottom: 0 }}>Manage bonus packages, wager requirements, banners and eligibility rules</div></div>
        <span className="pr"><button className="btn-search" onClick={() => setEditing({})}>＋ Create Promotion</button></span>
      </div>
      <div className="ptabs">{PROMO_TABS.map((t) => (
        <button key={t[0]} className={`ptab ${tab === t[0] ? 'active' : ''}`} onClick={() => setTab(t[0])}>{t[1]}</button>
      ))}</div>
      {tab === 'promos' ? <PromosTab promos={promos} setPromos={setPromos} loading={loading} onEdit={onEdit} />
        : tab === 'mini' ? <MiniTab slices={slices} setSlices={setSlices} wheelCfg={wheelCfg} setWheelCfg={setWheelCfg} ticketCfg={ticketCfg} setTicketCfg={setTicketCfg} onSave={saveMiniGamesCfg} saving={savingMg} />
          : tab === 'bigwins' ? <BigwinsTab bigwins={bigwins} setBigwins={setBigwins} />
            : tab === 'tier' ? <TierTab tiers={tiers} setTiers={setTiers} />
              : tab === 'kyc' ? <KycTab />
                : <SettingsTab />}
      {editing !== null && <PromoEditModal initial={editing} onClose={() => setEditing(null)} onSaved={onSaved} />}
    </>
  );
}
