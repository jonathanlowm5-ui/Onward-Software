import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';
import { deposit as depositRequest } from '../../services/playersService';
import api from '../../services/api';
import telegramLogo from '../../assets/social/telegram.svg';
import googleLogo from '../../assets/social/google.svg';

const EMPTY_REG = {
  name: '', username: '', email: '', phone: '',
  country: '', dob: '', currency: 'PHP', password: '', confirm: '', referral: '',
};

// Currencies offered at registration (must match backend playerUtils.CURRENCIES).
const CURRENCIES = ['PHP', 'USD', 'EUR', 'INR', 'THB', 'VND', 'IDR', 'MYR', 'CNY', 'JPY'];

// International dialing code per country — used to auto-fill the mobile prefix.
const DIAL_CODES = {
  Philippines: '+63', Malaysia: '+60', Singapore: '+65', Thailand: '+66',
  Indonesia: '+62', Vietnam: '+84', Other: '',
};

/**
 * Login / Register / Deposit modal — the original #auth-modal with its three
 * tab panels. Login & registration run through the Firebase-backed AuthContext.
 */
export default function AuthModal() {
  const { activeModal, closeModal, openModal, toast } = useUI();
  const { login, register, error, setError, forgotPassword } = useAuth();

  const doForgot = async (e) => {
    e.preventDefault();
    const email = window.prompt('Enter your account email to reset your password:');
    if (!email) return;
    try {
      await forgotPassword(email.trim());
      toast('If that email exists, a reset link has been sent.');
    } catch (err) {
      toast(err.message || 'Could not process request', 'error');
    }
  };

  // Deposit now has its own rich modal (DepositModal); AuthModal handles auth.
  const open = activeModal === 'login' || activeModal === 'register';
  const [tab, setTab] = useState('login');
  const [busy, setBusy] = useState(false);

  // Login form
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  // Register form
  const [reg, setReg] = useState(EMPTY_REG);
  // Currencies offered at registration come from the admin (enabled list).
  const [currencies, setCurrencies] = useState(CURRENCIES);
  useEffect(() => {
    let alive = true;
    api.get('/currency-rates')
      .then((r) => { const en = r.data?.enabled; if (alive && Array.isArray(en) && en.length) setCurrencies(en); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (open) {
      setTab(activeModal);
      setError('');
    }
  }, [open, activeModal, setError]);

  const setR = (k) => (e) => setReg((s) => ({ ...s, [k]: e.target.value }));

  // Auto-detect the dialing code from the chosen country and prefix the mobile
  // field with it (e.g. Malaysia -> +60, Philippines -> +63), keeping any local
  // number the player already typed.
  const onCountry = (e) => {
    const country = e.target.value;
    const code = DIAL_CODES[country] || '';
    setReg((s) => {
      const rest = String(s.phone || '').replace(/^\s*\+\d{1,4}\s*/, '').trimStart();
      const phone = code ? (rest ? `${code} ${rest}` : `${code} `) : rest;
      return { ...s, country, phone };
    });
  };

  const doLogin = async () => {
    if (!loginUser || !loginPass) { toast('Enter your username and password', 'error'); return; }
    setBusy(true);
    try {
      await login(loginUser, loginPass);
      toast('Welcome back!');
      closeModal();
    } catch (e) {
      toast(e.message || 'Login failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const doRegister = async () => {
    if (!reg.username) { toast('Please choose a username.', 'error'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reg.email)) { toast('Please enter a valid email.', 'error'); return; }
    if (reg.password.length < 6) { toast('Password must be at least 6 characters.', 'error'); return; }
    if (reg.confirm !== reg.password) { toast('Passwords do not match.', 'error'); return; }
    if (!reg.name.trim()) { toast('Please enter your full name (as on your bank account).', 'error'); return; }
    if (!reg.phone) { toast('Please enter your mobile number.', 'error'); return; }
    setBusy(true);
    try {
      await register({
        email: reg.email,
        password: reg.password,
        fullName: reg.name.trim(),
        username: reg.username,
        phone: reg.phone,
        mobile: reg.phone,
        country: reg.country,
        dob: reg.dob,
        currency: reg.currency,
        referral_code: reg.referral,
      });
      toast('Account created! Welcome bonus added.');
      closeModal();
      openModal('bank', { name: reg.name.trim() });
    } catch (e) {
      toast(e.message || 'Registration failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal id="auth-modal" open={open} onClose={closeModal}>
      <div className="modal-header">
        <span className="modal-title" id="modal-title" data-i18n="auth_welcome_back">
          {tab === 'register' ? 'Create Account' : tab === 'deposit' ? 'Deposit Funds' : 'Welcome Back'}
        </span>
        <button className="modal-close" onClick={closeModal}>✕</button>
      </div>

      {tab !== 'deposit' && (
        <div className="modal-tabs">
          <button className={`modal-tab${tab === 'login' ? ' active' : ''}`} id="tab-login" onClick={() => setTab('login')} data-i18n="ui_login">Login</button>
          <button className={`modal-tab${tab === 'register' ? ' active' : ''}`} id="tab-register" onClick={() => setTab('register')} data-i18n="ui_register">Register</button>
        </div>
      )}

      {/* LOGIN PANEL */}
      <div className={`tab-panel${tab === 'login' ? ' active' : ''}`} id="panel-login">
        <div className="modal-body">
          <div className="modal-promo">
            <span style={{ fontSize: '24px' }}>🎁</span>
            <div>
              <div className="modal-promo-amount" data-i18n="auth_welcome_bonus">Welcome Back Bonus!</div>
              <div className="modal-promo-text" style={{ color: 'var(--text-muted)', fontSize: '12px' }}><span data-i18n="auth_daily_reload_desc">Daily reload up to ₱5,000</span></div>
            </div>
          </div>
          <div className="form-group">
            <label data-i18n="auth_username">Username or Email</label>
            <input type="text" id="login-user" placeholder="Enter your username" value={loginUser} onChange={(e) => setLoginUser(e.target.value)} />
          </div>
          <div className="form-group">
            <label data-i18n="auth_password">Password</label>
            <input type="password" id="login-pass" placeholder="Enter your password" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && doLogin()} />
          </div>
          {error && tab === 'login' && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <button className="btn btn-primary" style={{ width: '100%', padding: '13px', fontSize: '15px', marginBottom: '12px', opacity: busy ? 0.7 : 1 }} onClick={doLogin} disabled={busy}>
            <span data-i18n="auth_login_play">{busy ? 'Logging in…' : '🎰 Login & Play'}</span>
          </button>
          <div className="form-divider" data-i18n="auth_or_continue">or continue with</div>
          <button className="social-btn"><img src={telegramLogo} alt="" className="social-logo" /> <span data-i18n="auth_telegram">Continue with Telegram</span></button>
          <button className="social-btn"><img src={googleLogo} alt="" className="social-logo" /> <span data-i18n="auth_google">Continue with Google</span></button>
          <div className="form-footer">
            <a href="#" onClick={doForgot} data-i18n="auth_forgot">Forgot Password?</a> &nbsp;·&nbsp;{' '}
            <span data-i18n="auth_new">New?</span>{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); setTab('register'); }} data-i18n="auth_register_here">Register Here</a>
          </div>
        </div>
      </div>

      {/* REGISTER PANEL */}
      <div className={`tab-panel${tab === 'register' ? ' active' : ''}`} id="panel-register">
        <div className="modal-body">
          <div className="modal-promo">
            <span style={{ fontSize: '24px' }}>💰</span>
            <div>
              <div className="modal-promo-amount"><span data-i18n="reg_welcome_bonus">200% Welcome Bonus!</span></div>
              <div className="modal-promo-text" style={{ color: 'var(--text-muted)', fontSize: '12px' }}><span data-i18n="reg_first_deposit_sub">Up to ₱10,000 on first deposit</span></div>
            </div>
          </div>
          <div className="form-group">
            <label data-i18n="auth_full_name">Full Name (as on your bank account)</label>
            <input type="text" id="reg-name" placeholder="Juan Dela Cruz" value={reg.name} onChange={setR('name')} />
          </div>
          <div className="form-group">
            <label data-i18n="auth_username_field">Username</label>
            <input type="text" id="reg-username" placeholder="Choose a username" value={reg.username} onChange={setR('username')} />
          </div>
          <div className="form-group">
            <label data-i18n="auth_email">Email</label>
            <input type="email" id="reg-email" placeholder="your@email.com" value={reg.email} onChange={setR('email')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label data-i18n="auth_phone">Mobile Number</label>
              <input type="tel" id="reg-phone" placeholder={`${DIAL_CODES[reg.country] || '+63'} 9XX XXX XXXX`} value={reg.phone} onChange={setR('phone')} />
            </div>
            <div className="form-group">
              <label data-i18n="auth_currency">Currency</label>
              <select id="reg-currency" value={reg.currency} onChange={setR('currency')} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#0c1322', color: '#fff', border: '1px solid #2a3a5c', fontSize: '14px' }}>
                {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label data-i18n="auth_country">Country</label>
              <select id="reg-country" value={reg.country} onChange={onCountry} style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#0c1322', color: '#fff', border: '1px solid #2a3a5c', fontSize: '14px' }}>
                <option value="">Select country</option><option>Philippines</option><option>Malaysia</option><option>Singapore</option><option>Thailand</option><option>Indonesia</option><option>Vietnam</option><option>Other</option>
              </select>
            </div>
            <div className="form-group">
              <label data-i18n="auth_dob">Date of Birth</label>
              <input type="date" id="reg-dob" value={reg.dob} onChange={setR('dob')} />
            </div>
          </div>
          <div className="form-group">
            <label data-i18n="auth_password">Password</label>
            <input type="password" id="reg-password" placeholder="Min. 6 characters" value={reg.password} onChange={setR('password')} />
          </div>
          <div className="form-group">
            <label data-i18n="auth_confirm_password">Confirm Password</label>
            <input type="password" id="reg-confirm" placeholder="Re-enter password" value={reg.confirm} onChange={setR('confirm')} />
          </div>
          <div className="form-group">
            <label data-i18n="auth_ref_code">Referral Code (Optional)</label>
            <input type="text" id="reg-referral" placeholder="Enter referral code" value={reg.referral} onChange={setR('referral')} />
          </div>
          {error && tab === 'register' && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <button className="btn btn-red" style={{ width: '100%', padding: '13px', fontSize: '15px', marginBottom: '12px', opacity: busy ? 0.7 : 1 }} onClick={doRegister} disabled={busy}>
            <span data-i18n="reg_create_btn">{busy ? 'Creating…' : '🎁 Create Account & Claim Bonus'}</span>
          </button>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
            <span data-i18n="reg_terms_text">By registering, you confirm you are 18+ and agree to our</span>{' '}
            <a href="#" style={{ color: 'var(--gold)' }} data-i18n="reg_terms">Terms of Service</a>{' '}
            <span data-i18n="reg_and">and</span>{' '}
            <a href="#" style={{ color: 'var(--gold)' }} data-i18n="reg_privacy">Privacy Policy</a>.
          </p>
        </div>
      </div>

      {/* DEPOSIT PANEL */}
      {tab === 'deposit' && <DepositPanel />}
    </Modal>
  );
}

// Compact money label for the quick-select chips (1000 -> 1K, 2500 -> 2.5K,
// 60770 -> 60.77K, 730 -> 730).
function shortAmt(n) {
  const v = Number(n) || 0;
  if (v >= 1000) {
    const k = v / 1000;
    return (Number.isInteger(k) ? k : +k.toFixed(2)) + 'K';
  }
  return String(v);
}

function DepositPanel() {
  const { toast, closeModal } = useUI();
  const { isLoggedIn, refreshProfile } = useAuth();
  const [method, setMethod] = useState('GCash');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [quick, setQuick] = useState([500, 1000, 2000, 5000, 10000, 20000]);
  const methods = ['GCash', 'Maya', 'Bank'];

  useEffect(() => {
    let alive = true;
    api.get('/deposit-config')
      .then((r) => { if (alive && Array.isArray(r.data?.quickAmounts) && r.data.quickAmounts.length) setQuick(r.data.quickAmounts); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const doDeposit = async () => {
    const amt = Number(amount);
    if (!amt || amt < 100) { toast('Minimum deposit is ₱100', 'error'); return; }
    if (!isLoggedIn) { toast('Please log in to deposit', 'error'); return; }
    setBusy(true);
    try {
      await depositRequest({ amount: amt, method });
      await refreshProfile();
      toast(`Deposit request for ₱${amt.toLocaleString()} submitted (${method})`);
      closeModal();
    } catch (e) {
      toast(e.message || 'Deposit failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="tab-panel active" id="panel-deposit">
      <div className="modal-body">
        <h3 style={{ fontFamily: "'Montserrat',sans-serif", marginBottom: '20px' }} data-i18n="dep_title">Deposit Funds</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '20px' }} id="payment-methods">
          {methods.map((m) => (
            <button key={m} className={`cat-btn${method === m ? ' active' : ''}`} style={{ justifyContent: 'center' }} onClick={() => setMethod(m)}>{m}</button>
          ))}
        </div>
        <div className="form-group">
          <label data-i18n="dep_amount_label">Amount (₱)</label>
          <input type="number" placeholder="Min ₱100" id="deposit-amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', marginBottom: '20px' }}>
          {quick.map((v) => (
            <button key={v} className={`cat-btn${Number(amount) === Number(v) ? ' active' : ''}`} style={{ justifyContent: 'center', padding: '9px 6px' }} onClick={() => setAmount(String(v))}>{shortAmt(v)}</button>
          ))}
        </div>
        <div style={{ padding: '14px', background: 'rgba(240,192,64,.08)', border: '1px solid rgba(240,192,64,.2)', borderRadius: 'var(--radius)', marginBottom: '20px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <span data-i18n="dep_first_bonus">💡 First deposit gets</span> <strong style={{ color: 'var(--gold)' }} data-i18n="dep_bonus_pct">200% bonus</strong> <span data-i18n="dep_first_bonus_end">up to ₱10,000</span>
        </div>
        <button className="btn btn-primary" style={{ width: '100%', padding: '13px', fontSize: '15px', opacity: busy ? 0.7 : 1 }} onClick={doDeposit} disabled={busy}>
          <span data-i18n="dep_proceed">{busy ? 'Submitting…' : 'Proceed to Payment →'}</span>
        </button>
      </div>
    </div>
  );
}
