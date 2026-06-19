import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { IMG0 as LOGO } from '../assets/images';

// Login gate — preserves the original captcha UX, then authenticates against the
// shared backend (offline-safe fallback opens the panel locally).
export default function Login() {
  const { login } = useAuth();
  const { toast } = useUI();
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [cap, setCap] = useState('');
  const [code, setCode] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [err, setErr] = useState('');

  const newCaptcha = useCallback(() => setCode(String(Math.floor(1000 + Math.random() * 9000))), []);
  useEffect(() => { newCaptcha(); }, [newCaptcha]);

  const doLogin = async () => {
    if (!user.trim()) { setErr('Please enter your username.'); return; }
    if (cap.trim() !== code) { setErr('Verification code does not match.'); newCaptcha(); setCap(''); return; }
    setErr('');
    await login(user.trim(), pass);
    toast('Welcome back, Super Admin 👋');
  };

  return (
    <div id="loginGate" style={{ display: 'flex' }}>
      <div className="login-wrap">
        <div className="login-logo">
          <img className="brand-logo brand-logo-lg" src={LOGO} alt="ONWARD" />
          <div className="sub">A D M I N &nbsp; P A N E L</div>
        </div>
        <div className="login-card">
          <div className="lfield">
            <span className="ico">👤</span>
            <input value={user} onChange={(e) => setUser(e.target.value)} type="text" placeholder="Username" autoComplete="username"
              onKeyDown={(e) => e.key === 'Enter' && doLogin()} />
          </div>
          <div className="lfield">
            <span className="ico">🔒</span>
            <input value={pass} onChange={(e) => setPass(e.target.value)} type={showPass ? 'text' : 'password'} placeholder="Password" autoComplete="current-password"
              onKeyDown={(e) => e.key === 'Enter' && doLogin()} />
            <button className="eye" type="button" onClick={() => setShowPass((v) => !v)} aria-label="Show password">👁</button>
          </div>
          <div className="lfield">
            <span className="ico captcha-box" id="capCode" style={{ width: '90px', flexBasis: '90px' }}>{code}</span>
            <input value={cap} onChange={(e) => setCap(e.target.value)} type="text" inputMode="numeric" maxLength={4} placeholder="Verification Code"
              onKeyDown={(e) => e.key === 'Enter' && doLogin()} />
          </div>
          <button className="btn-signin" onClick={doLogin}>Sign In</button>
          <div className="login-err" id="lgErr">{err}</div>
          <div className="login-hint">Enter the 4-digit code shown on the left</div>
        </div>
      </div>
    </div>
  );
}
