import { useState } from 'react';
import { useUI } from '../context/UIContext';

const INITIAL_IPBLOCKS = [
  { ip: '185.220.101.45', type: 'Tor Exit', reason: 'Anonymiser auto-block', pl: '—', at: '2026-06-11 22:14', exp: '2026-06-18', st: 'active' },
  { ip: '103.86.49.0/24', type: 'VPN Range', reason: 'NordVPN range', pl: '—', at: '2026-06-10 08:30', exp: 'Permanent', st: 'active' },
  { ip: '172.16.0.3', type: 'Manual', reason: 'Multi-account fraud (carloslim)', pl: 'carloslim', at: '2026-06-09 14:02', exp: 'Permanent', st: 'active' },
  { ip: '49.145.22.187', type: 'Auto', reason: '12 failed logins', pl: 'junmen07', at: '2026-06-12 06:45', exp: '2026-06-13', st: 'expiring' },
];

function nowStamp() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}

function TogRow({ n, d, on }) {
  const [checked, setChecked] = useState(!!on);
  return (
    <div className="set-row">
      <div className="si"><div className="sn">{n}</div><div className="sd">{d}</div></div>
      <label className="switch">
        <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
        <span className="slider"></span>
      </label>
      <span className={`onoff ${checked ? 'on' : 'off'}`}>{checked ? 'On' : 'Off'}</span>
    </div>
  );
}

function NumRow({ n, d, v }) {
  return (
    <div className="set-row">
      <div className="si"><div className="sn">{n}</div><div className="sd">{d}</div></div>
      <input className="num" defaultValue={v} />
    </div>
  );
}

export default function Security() {
  const { toast } = useUI();
  const [ipblocks, setIpblocks] = useState(INITIAL_IPBLOCKS);
  const [ipbInput, setIpbInput] = useState('');

  const ipbAdd = () => {
    const v = ipbInput.trim();
    if (!v) { toast('⚠ Enter an IP in the search box first'); return; }
    setIpblocks((prev) => [{ ip: v, type: 'Manual', reason: 'Manually blocked by admin', pl: '—', at: nowStamp(), exp: 'Permanent', st: 'active' }, ...prev]);
    toast('IP blocked 🚫 ' + v);
  };
  const ipbBlockFlagged = () => {
    setIpblocks((prev) => [{ ip: '7 flagged IPs', type: 'Auto', reason: 'Bulk block — suspicious activity', pl: '—', at: nowStamp(), exp: '2026-06-19', st: 'active' }, ...prev]);
    toast('All 7 flagged IPs blocked 🚫');
  };
  const ipbUnblock = (i) => {
    const ip = ipblocks[i].ip;
    setIpblocks((prev) => prev.filter((_, idx) => idx !== i));
    toast('Unblocked ✔ ' + ip);
  };

  return (
    <>
      <div className="page-head">
        <div><h1 className="hero-h">🔒 Security</h1><div className="hero-sub" style={{ marginBottom: 0 }}>Monitor and manage platform security settings</div></div>
        <span className="pr"><button className="btn-search" onClick={() => toast('Security settings saved! ✔')}>💾 Save Changes</button></span>
      </div>
      <div className="grid kpi-grid">
        <div className="card kpi r"><div className="lbl">Failed Logins (24h)</div><div className="val">142</div><div className="trend up">↑ 18% vs yesterday</div></div>
        <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">Suspicious IPs</div><div className="val">7</div><div className="trend" style={{ color: 'var(--muted)' }}>flagged today</div></div>
        <div className="card kpi g"><div className="lbl">2FA Enabled Players</div><div className="val">1,284</div><div className="trend" style={{ color: 'var(--muted)' }}>24.5% of users</div></div>
        <div className="card kpi b"><div className="lbl">Active Sessions</div><div className="val">3,847</div><div className="trend" style={{ color: 'var(--muted)' }}>right now</div></div>
      </div>
      <div className="sec-grid" style={{ marginTop: 'var(--pad)' }}>
        <div className="card"><div className="card-title">🔑 Login Security</div>
          <TogRow n="Force 2FA for Admins" d="Require 2FA for all admin accounts" on={1} />
          <NumRow n="Max Login Attempts" d="Lock account after X failed attempts" v={5} />
          <NumRow n="Account Lockout Duration" d="Minutes before auto-unlock" v={30} />
          <NumRow n="Session Timeout (minutes)" d="Auto-logout inactive users" v={60} />
          <TogRow n="Single Device Login" d="Only one active session per user" on={0} />
        </div>
        <div className="card"><div className="card-title">🌐 IP &amp; Access Control</div>
          <TogRow n="IP Whitelist (Admin Panel)" d="Only allow admin access from whitelisted IPs" on={0} />
          <div style={{ padding: '10px 0' }}><div className="sn" style={{ fontWeight: 800, fontSize: 'var(--fs-sm)', marginBottom: '7px' }}>Whitelisted IPs</div>
            <textarea className="ips-area" placeholder={'One IP or CIDR per line e.g.\n192.168.1.1\n10.0.0.0/24'}></textarea></div>
          <TogRow n="Block VPN / Proxy / Tor" d="Auto-reject connections from anonymisers" on={1} />
          <TogRow n="Auto-block on Failed Logins" d="Temporarily block IP after exceeding login attempts" on={1} />
          <div className="set-row"><div className="si"><div className="sn">Country Restrictions</div><div className="sd">Block access from specific countries</div></div><button className="mini-btn" onClick={() => toast('Country restriction manager — demo')}>Manage →</button></div>
        </div>
        <div className="card"><div className="card-title">🚨 Fraud Detection</div>
          <TogRow n="Auto-flag Same IP Accounts" d="Flag multiple accounts on same IP" on={1} />
          <TogRow n="Same Device Detection" d="Detect shared device fingerprints" on={1} />
          <NumRow n="Max Accounts Per IP" d="Auto-suspend beyond this limit" v={3} />
          <NumRow n="Withdrawal Risk Threshold" d="Manual review above this amount (₱)" v={50000} />
        </div>
        <div className="card"><div className="card-title">🔐 Password Policy</div>
          <NumRow n="Min Password Length" d="" v={8} />
          <TogRow n="Require Uppercase" d="" on={1} />
          <TogRow n="Require Numbers" d="" on={1} />
          <TogRow n="Require Special Characters" d="" on={0} />
          <NumRow n="Password Expiry (days)" d="0 = never expires" v={0} />
        </div>
      </div>
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="page-head" style={{ marginBottom: '12px' }}>
          <div className="card-title" style={{ marginBottom: 0 }}>🚫 IP Block Manager</div>
          <span className="pr" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input className="qsearch" id="ipbInput" placeholder="Search IP, reason or player" value={ipbInput} onChange={(e) => setIpbInput(e.target.value)} />
            <select className="qsearch" style={{ width: 'auto' }}><option>All Types</option><option>Manual</option><option>Auto</option><option>VPN Range</option><option>Tor Exit</option></select>
            <button className="mini-btn gold" onClick={ipbAdd}>＋ Add IP Block</button>
            <button className="act-suspend" onClick={ipbBlockFlagged}>🚫 Block All Flagged</button>
          </span>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr>{['IP Address', 'Type', 'Reason', 'Linked Player', 'Blocked At', 'Expires', 'Status', 'Actions'].map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
            <tbody>
              {ipblocks.map((b, i) => (
                <tr key={i}>
                  <td><span className="ipmono">{b.ip}</span></td>
                  <td>{b.type}</td>
                  <td>{b.reason}</td>
                  <td>{b.pl}</td>
                  <td>{b.at}</td>
                  <td>{b.exp}</td>
                  <td>{b.st === 'active' ? <span className="badge bad">Blocked</span> : <span className="badge pend">Expiring</span>}</td>
                  <td><button className="mini-btn green" onClick={() => ipbUnblock(i)}>Unblock</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
