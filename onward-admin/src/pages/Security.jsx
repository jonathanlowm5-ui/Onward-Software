import { useEffect, useState } from 'react';
import { useUI } from '../context/UIContext';
import { getConfig, saveConfig } from '../services/configService';

/*
 * Security — persisted as settings.securityConfig:
 *   { ipBlocks: [{ ip, note, enabled, addedAt }], toggles: {…} }
 * ipBlocks are REALLY enforced by the backend: blocked IPs are rejected at
 * player registration and login (see backend routes/player.js).
 */
const DEF_TOGGLES = {
  force2fa: true, maxAttempts: 5, lockoutMin: 30, sessionMin: 60, singleDevice: false,
  ipWhitelist: false, whitelistIps: '', blockVpn: true, autoBlock: true,
  flagSameIp: true, sameDevice: true, maxPerIp: 3, riskThreshold: 50000,
  minPwLen: 8, reqUpper: true, reqNum: true, reqSpecial: false, pwExpiry: 0,
};

const nowStamp = () => new Date().toISOString().slice(0, 16).replace('T', ' ');
// IPv4 (optional CIDR) or IPv6-ish (optional prefix).
const ipOk = (v) => /^(\d{1,3})(\.\d{1,3}){3}(\/\d{1,2})?$/.test(v) || (v.includes(':') && /^[0-9a-fA-F:]+(\/\d{1,3})?$/.test(v));

export default function Security() {
  const { toast } = useUI();
  const [sec, setSec] = useState(null); // null = loading
  const [ipbInput, setIpbInput] = useState('');
  const [noteInput, setNoteInput] = useState('');

  useEffect(() => {
    getConfig()
      .then((c) => {
        const s = c.securityConfig || {};
        setSec({ ipBlocks: Array.isArray(s.ipBlocks) ? s.ipBlocks : [], toggles: { ...DEF_TOGGLES, ...(s.toggles || {}) } });
      })
      .catch(() => { setSec({ ipBlocks: [], toggles: { ...DEF_TOGGLES } }); toast('⚠ Could not load security config'); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Every mutation persists via saveConfig.
  const persist = (next, msg) => {
    setSec(next);
    saveConfig({ securityConfig: next })
      .then(() => msg && toast(msg))
      .catch((e) => toast('⚠ ' + (e.message || 'Save failed')));
  };

  const setTog = (k, v, msg) => persist({ ...sec, toggles: { ...sec.toggles, [k]: v } }, msg);

  const ipbAdd = () => {
    const v = ipbInput.trim();
    if (!v) { toast('⚠ Enter an IP address first'); return; }
    if (!ipOk(v)) { toast('⚠ Not a valid IPv4/IPv6 address: ' + v); return; }
    if (sec.ipBlocks.some((b) => b.ip === v)) { toast('⚠ IP already blocked: ' + v); return; }
    persist({ ...sec, ipBlocks: [{ ip: v, note: noteInput.trim() || 'Manually blocked by admin', enabled: true, addedAt: nowStamp() }, ...sec.ipBlocks] }, 'IP blocked 🚫 ' + v + ' — enforced at login & registration');
    setIpbInput(''); setNoteInput('');
  };
  const ipbRemove = (i) => {
    const ip = sec.ipBlocks[i].ip;
    persist({ ...sec, ipBlocks: sec.ipBlocks.filter((_, idx) => idx !== i) }, 'Unblocked ✔ ' + ip);
  };
  const ipbToggle = (i) => {
    const b = sec.ipBlocks[i];
    persist({ ...sec, ipBlocks: sec.ipBlocks.map((x, idx) => (idx === i ? { ...x, enabled: !x.enabled } : x)) }, (b.enabled ? 'Block disabled ⚫ ' : 'Block enabled 🚫 ') + b.ip);
  };

  if (!sec) return <div className="hist-empty">Loading security config…</div>;
  const t = sec.toggles;
  const activeBlocks = sec.ipBlocks.filter((b) => b.enabled !== false).length;

  const TogRow = ({ n, d, k }) => (
    <div className="set-row">
      <div className="si"><div className="sn">{n}</div><div className="sd">{d}</div></div>
      <label className="switch">
        <input type="checkbox" checked={!!t[k]} onChange={(e) => setTog(k, e.target.checked, n + (e.target.checked ? ' enabled ✅' : ' disabled ⚫'))} />
        <span className="slider"></span>
      </label>
      <span className={`onoff ${t[k] ? 'on' : 'off'}`}>{t[k] ? 'On' : 'Off'}</span>
    </div>
  );
  const NumRow = ({ n, d, k }) => (
    <div className="set-row">
      <div className="si"><div className="sn">{n}</div><div className="sd">{d}</div></div>
      <input className="num" defaultValue={t[k]} inputMode="numeric"
        onBlur={(e) => { const v = parseInt(e.target.value) || 0; if (v !== t[k]) setTog(k, v, n + ' saved 💾 ' + v); }} />
    </div>
  );

  return (
    <>
      <div className="page-head">
        <div><h1 className="hero-h">🔒 Security</h1><div className="hero-sub" style={{ marginBottom: 0 }}>Monitor and manage platform security settings</div></div>
        <span className="pr"><button className="btn-search" onClick={() => persist(sec, 'Security settings saved ✅')}>💾 Save Changes</button></span>
      </div>
      <div className="grid kpi-grid">
        <div className="card kpi r"><div className="lbl">Blocked IPs</div><div className="val">{activeBlocks}</div><div className="trend" style={{ color: 'var(--muted)' }}>enforced at login &amp; register</div></div>
        <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">Block Rules</div><div className="val">{sec.ipBlocks.length}</div><div className="trend" style={{ color: 'var(--muted)' }}>total (incl. disabled)</div></div>
        <div className="card kpi g"><div className="lbl">Max Login Attempts</div><div className="val">{t.maxAttempts}</div><div className="trend" style={{ color: 'var(--muted)' }}>before lockout</div></div>
        <div className="card kpi b"><div className="lbl">Session Timeout</div><div className="val">{t.sessionMin}m</div><div className="trend" style={{ color: 'var(--muted)' }}>auto-logout</div></div>
      </div>
      <div className="sec-grid" style={{ marginTop: 'var(--pad)' }}>
        <div className="card"><div className="card-title">🔑 Login Security</div>
          <TogRow n="Force 2FA for Admins" d="Require 2FA for all admin accounts" k="force2fa" />
          <NumRow n="Max Login Attempts" d="Lock account after X failed attempts" k="maxAttempts" />
          <NumRow n="Account Lockout Duration" d="Minutes before auto-unlock" k="lockoutMin" />
          <NumRow n="Session Timeout (minutes)" d="Auto-logout inactive users" k="sessionMin" />
          <TogRow n="Single Device Login" d="Only one active session per user" k="singleDevice" />
        </div>
        <div className="card"><div className="card-title">🌐 IP &amp; Access Control</div>
          <TogRow n="IP Whitelist (Admin Panel)" d="Only allow admin access from whitelisted IPs" k="ipWhitelist" />
          <div style={{ padding: '10px 0' }}><div className="sn" style={{ fontWeight: 800, fontSize: 'var(--fs-sm)', marginBottom: '7px' }}>Whitelisted IPs</div>
            <textarea className="ips-area" placeholder={'One IP or CIDR per line e.g.\n192.168.1.1\n10.0.0.0/24'} defaultValue={t.whitelistIps}
              onBlur={(e) => { if (e.target.value !== t.whitelistIps) setTog('whitelistIps', e.target.value, 'Whitelist saved 💾'); }}></textarea></div>
          <TogRow n="Block VPN / Proxy / Tor" d="Auto-reject connections from anonymisers" k="blockVpn" />
          <TogRow n="Auto-block on Failed Logins" d="Temporarily block IP after exceeding login attempts" k="autoBlock" />
        </div>
        <div className="card"><div className="card-title">🚨 Fraud Detection</div>
          <TogRow n="Auto-flag Same IP Accounts" d="Flag multiple accounts on same IP" k="flagSameIp" />
          <TogRow n="Same Device Detection" d="Detect shared device fingerprints" k="sameDevice" />
          <NumRow n="Max Accounts Per IP" d="Auto-suspend beyond this limit" k="maxPerIp" />
          <NumRow n="Withdrawal Risk Threshold" d="Manual review above this amount (₱)" k="riskThreshold" />
        </div>
        <div className="card"><div className="card-title">🔐 Password Policy</div>
          <NumRow n="Min Password Length" d="" k="minPwLen" />
          <TogRow n="Require Uppercase" d="" k="reqUpper" />
          <TogRow n="Require Numbers" d="" k="reqNum" />
          <TogRow n="Require Special Characters" d="" k="reqSpecial" />
          <NumRow n="Password Expiry (days)" d="0 = never expires" k="pwExpiry" />
        </div>
      </div>
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="page-head" style={{ marginBottom: '4px' }}>
          <div className="card-title" style={{ marginBottom: 0 }}>🚫 IP Block Manager</div>
          <span className="pr" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input className="qsearch" id="ipbInput" placeholder="IP to block e.g. 203.0.113.5" value={ipbInput} onChange={(e) => setIpbInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') ipbAdd(); }} />
            <input className="qsearch" placeholder="Note / reason (optional)" value={noteInput} onChange={(e) => setNoteInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') ipbAdd(); }} />
            <button className="mini-btn gold" onClick={ipbAdd}>＋ Add IP Block</button>
          </span>
        </div>
        <div className="hero-sub" style={{ marginBottom: 12 }}>Blocked IPs are rejected at player login &amp; registration.</div>
        <div className="table-wrap">
          <table>
            <thead><tr>{['IP Address', 'Note', 'Added At', 'Status', 'Actions'].map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
            <tbody>
              {sec.ipBlocks.length ? sec.ipBlocks.map((b, i) => (
                <tr key={b.ip + i}>
                  <td><span className="ipmono">{b.ip}</span></td>
                  <td>{b.note || '—'}</td>
                  <td>{b.addedAt || '—'}</td>
                  <td>{b.enabled !== false ? <span className="badge bad">Blocked</span> : <span className="badge pend">Disabled</span>}</td>
                  <td>
                    <button className="mini-btn" onClick={() => ipbToggle(i)}>{b.enabled !== false ? 'Disable' : 'Enable'}</button>{' '}
                    <button className="mini-btn green" onClick={() => ipbRemove(i)}>Unblock</button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: 22 }}>No blocked IPs — add one above</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
