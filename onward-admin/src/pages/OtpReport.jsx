import { useState } from 'react';
import { useUI } from '../context/UIContext';

const OTP_CHAN = [
  { ch: "SMS", ic: "💬", sent: 8420, del: 98.1, ver: 90.4, fail: 9.6 },
  { ch: "Email", ic: "📧", sent: 3210, del: 99.2, ver: 93.8, fail: 6.2 },
  { ch: "Authenticator", ic: "🔒", sent: 1210, del: 100, ver: 98.1, fail: 1.9 },
];
const OTP_PURP = [
  { p: "Login Verification", c: 6840, s: 53.3, succ: 92.1 }, { p: "Withdrawal Auth", c: 3120, s: 24.3, succ: 94.8 },
  { p: "Password Reset", c: 1480, s: 11.5, succ: 88.4 }, { p: "Registration", c: 840, s: 6.5, succ: 96.2 }, { p: "Profile Change", c: 560, s: 4.4, succ: 91.0 },
];
const OTP_EVENTS = [
  { ts: "2026-06-02 14:32:11", player: "Juan dela Cruz", ch: "sms", purpose: "Login", contact: "+63 912 ***6789", code: "479601", att: 1, st: "success" },
  { ts: "2026-06-02 14:28:44", player: "Maria Santos", ch: "email", purpose: "Withdrawal", contact: "mar***@email.com", code: "269970", att: 1, st: "success" },
  { ts: "2026-06-02 14:21:08", player: "Unknown", ch: "sms", purpose: "Login", contact: "+63 917 ***0011", code: "746651", att: 3, st: "failed" },
  { ts: "2026-06-02 14:15:33", player: "Pedro Reyes", ch: "auth", purpose: "Withdrawal", contact: "TOTP", code: "——————", att: 1, st: "success" },
  { ts: "2026-06-02 14:10:22", player: "Ana Garcia", ch: "sms", purpose: "Password Reset", contact: "+63 919 ***3344", code: "703843", att: 2, st: "expired" },
  { ts: "2026-06-02 13:58:01", player: "Carlo Mendoza", ch: "email", purpose: "Registration", contact: "car***@email.com", code: "450692", att: 1, st: "success" },
  { ts: "2026-06-02 13:44:17", player: "Unknown", ch: "sms", purpose: "Login", contact: "+63 908 ***5521", code: "354271", att: 5, st: "failed" },
  { ts: "2026-06-02 13:30:09", player: "Rosa Cruz", ch: "sms", purpose: "Withdrawal", contact: "+63 921 ***8812", code: "359923", att: 1, st: "success" },
  { ts: "2026-06-02 13:22:55", player: "Jun Mendoza", ch: "email", purpose: "Password Reset", contact: "jun***@email.com", code: "147352", att: 1, st: "success" },
  { ts: "2026-06-02 13:10:44", player: "Liza Reyes", ch: "sms", purpose: "Login", contact: "+63 905 ***2233", code: "999128", att: 2, st: "expired" },
  { ts: "2026-06-02 12:58:30", player: "Marco Tan", ch: "auth", purpose: "Withdrawal", contact: "TOTP", code: "——————", att: 1, st: "success" },
  { ts: "2026-06-02 12:47:18", player: "Unknown", ch: "sms", purpose: "Login", contact: "+63 916 ***4490", code: "796199", att: 4, st: "failed" },
  { ts: "2026-06-02 13:58:01", player: "Cris Dela Paz", ch: "email", purpose: "Registration", contact: "cri***@email.com", code: "383115", att: 1, st: "success" },
];
const otpChChip = (c) => <span className={`otp-ch och-${c === "auth" ? "auth" : c}`}>{c === "sms" ? "SMS" : c === "email" ? "Email" : "Auth"}</span>;

export default function OtpReport() {
  const { toast } = useUI();
  const [range, setRange] = useState('Last 7 Days');
  const [chan, setChan] = useState('all');
  const [stat, setStat] = useState('all');
  const [q, setQ] = useState('');

  const otpMatch = (e) => (chan === "all" || e.ch === chan) && (stat === "all" || e.st === stat) && (!q || e.player.toLowerCase().includes(q.toLowerCase()));
  const otpExport = () => toast("OTP report exported ⬇ " + OTP_EVENTS.length + " events (codes redacted)");

  const filtered = OTP_EVENTS.filter(otpMatch);

  return (
    <>
      <div className="rep-head"><div className="grow"><h1 className="hero-h">🔑 OTP Report</h1><div className="hero-sub" style={{ marginBottom: 0 }}>One-time password usage, delivery rates and security events</div></div>
        <div className="acts"><select value={range} onChange={(e) => setRange(e.target.value)}><option>Last 7 Days</option><option>Last 30 Days</option><option>Today</option></select><select value={chan} onChange={(e) => setChan(e.target.value)}><option value="all">All Channels</option><option value="sms">SMS</option><option value="email">Email</option><option value="auth">Authenticator</option></select><button className="rep-btn" onClick={otpExport}>⬇ Export</button></div></div>
      <div className="grid kpi-grid">
        <div className="card kpi b"><div className="lbl">OTPs Sent (7d)</div><div className="val">12,840</div><div className="trend" style={{ color: 'var(--muted)' }}>all channels</div></div>
        <div className="card kpi g"><div className="lbl">Delivery Rate</div><div className="val">98.4%</div><div className="trend up">↑ 0.3% vs last week</div></div>
        <div className="card kpi"><div className="lbl">Success Rate</div><div className="val">91.2%</div><div className="trend" style={{ color: 'var(--muted)' }}>verified / sent</div></div>
        <div className="card kpi r"><div className="lbl">Failed / Expired</div><div className="val">1,128</div><div className="trend down">8.8% failure rate</div></div>
      </div>
      <div className="rep-2col">
        <div className="rep-card" style={{ marginTop: 0 }}><div className="rch">OTP by Channel</div>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table className="rep-tbl">
            <thead><tr><th>Channel</th><th>Sent</th><th>Delivered</th><th>Verified</th><th>Failed</th></tr></thead>
            <tbody>{OTP_CHAN.map((c, i) => <tr key={i}><td className="name">{c.ic} {c.ch}</td><td className="rep-g">{c.sent.toLocaleString()}</td><td className="rep-green">{c.del}%</td><td className="rep-blue">{c.ver}%</td><td className="rep-red">{c.fail}%</td></tr>)}</tbody>
          </table></div></div>
        <div className="rep-card" style={{ marginTop: 0 }}><div className="rch">OTP by Purpose</div>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table className="rep-tbl">
            <thead><tr><th>Purpose</th><th>Count</th><th>Share</th><th>Success</th></tr></thead>
            <tbody>{OTP_PURP.map((p, i) => <tr key={i}><td>{p.p}</td><td className="rep-g">{p.c.toLocaleString()}</td><td className="rep-blue">{p.s}%</td><td className="rep-green">{p.succ}%</td></tr>)}</tbody>
          </table></div></div>
      </div>
      <div className="rep-card"><div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '15px 18px', flexWrap: 'wrap' }}><div className="rch" style={{ padding: 0 }}>Recent OTP Events</div>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}><input className="otp-search" placeholder="Search player…" value={q} onChange={(e) => setQ(e.target.value)} /><select className="otp-search" value={stat} onChange={(e) => setStat(e.target.value)}><option value="all">All Status</option><option value="success">Success</option><option value="failed">Failed</option><option value="expired">Expired</option></select></span></div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table className="rep-tbl" style={{ minWidth: '1000px' }}>
          <thead><tr><th>Timestamp</th><th>Player</th><th>Channel</th><th>Purpose</th><th>Phone / Email</th><th>OTP Code</th><th>Attempts</th><th>Status</th></tr></thead>
          <tbody>{filtered.length ? filtered.map((e, i) => (
            <tr key={i}>
              <td className="rep-mut" style={{ fontFamily: "'Roboto Mono','Courier New',ui-monospace,monospace", fontSize: '.72rem' }}>{e.ts}</td>
              <td className={e.player === "Unknown" ? "otp-unknown" : "name"}>{e.player}</td>
              <td>{otpChChip(e.ch)}</td>
              <td className="rep-mut">{e.purpose}</td>
              <td className="rep-mut" style={{ fontSize: '.74rem' }}>{e.contact}</td>
              <td><span className="otp-code">{e.code}</span></td>
              <td className={e.att >= 3 ? "rep-red" : ""} style={{ fontWeight: 800 }}>{e.att}</td>
              <td><span className={`otp-st-${e.st}`}>{e.st}</span></td>
            </tr>
          )) : <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--muted)', padding: '22px' }}>No OTP events match this filter</td></tr>}</tbody>
        </table></div>
      </div>
    </>
  );
}
