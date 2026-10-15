import { useEffect, useState } from 'react';
import { useUI } from '../context/UIContext';
import { getOtpLog } from '../services/configService';

const chChip = (c) => <span className={`otp-ch ${c === 'email' ? 'och-email' : 'och-sms'}`}>{c === 'email' ? 'Email' : 'Mobile'}</span>;
const stClass = (a) => (a === 'verified' ? 'otp-st-success' : a === 'failed' ? 'otp-st-failed' : 'otp-st-expired');

const dlCsv = (name, header, rows) => {
  const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
};

export default function OtpReport() {
  const { toast } = useUI();
  const [chan, setChan] = useState('all');
  const [action, setAction] = useState('all');
  const [q, setQ] = useState('');
  const [rows, setRows] = useState(null);

  useEffect(() => {
    setRows(null);
    getOtpLog(chan === 'all' ? undefined : chan).then((d) => setRows(Array.isArray(d) ? d : [])).catch(() => setRows([]));
  }, [chan]);

  const all = rows || [];
  const count = (a) => all.filter((r) => r.action === a).length;
  const sent = count('sent'); const verified = count('verified'); const failed = count('failed');
  const filtered = all.filter((r) =>
    (action === 'all' || r.action === action) &&
    (!q || (r.username || String(r.playerId) || '').toLowerCase().includes(q.toLowerCase())));

  const byChannel = ['email', 'mobile'].map((ch) => {
    const rs = all.filter((r) => r.channel === ch);
    return { ch, total: rs.length, sent: rs.filter((r) => r.action === 'sent').length, verified: rs.filter((r) => r.action === 'verified').length, failed: rs.filter((r) => r.action === 'failed').length };
  });

  const otpExport = () => {
    dlCsv('otp-report.csv', ['Time', 'Player', 'Channel', 'Target', 'Action', 'IP'],
      filtered.map((r) => [r.createdAt, r.username || r.playerId, r.channel, r.target, r.action, r.ip]));
    toast('OTP report exported ⬇ ' + filtered.length + ' events');
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="hero-h">🔑 OTP Report</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>One-time password delivery and verification events — from the real OTP log</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={chan} onChange={(e) => setChan(e.target.value)}>
            <option value="all">All Channels</option><option value="email">Email</option><option value="mobile">Mobile</option>
          </select>
          <button className="mini-btn" onClick={otpExport}>⬇ Export</button>
        </div>
      </div>

      <div className="grid kpi-grid">
        <div className="card kpi b"><div className="lbl">OTP Events</div><div className="val">{all.length.toLocaleString()}</div><div className="trend" style={{ color: 'var(--muted)' }}>latest {all.length} logged</div></div>
        <div className="card kpi"><div className="lbl">Sent</div><div className="val">{sent.toLocaleString()}</div><div className="trend" style={{ color: 'var(--muted)' }}>codes issued</div></div>
        <div className="card kpi g"><div className="lbl">Verified</div><div className="val">{verified.toLocaleString()}</div><div className="trend" style={{ color: 'var(--muted)' }}>{sent > 0 ? Math.round((verified / sent) * 100) + '% of sent' : '—'}</div></div>
        <div className="card kpi r"><div className="lbl">Failed</div><div className="val">{failed.toLocaleString()}</div><div className="trend" style={{ color: 'var(--muted)' }}>wrong / expired codes</div></div>
      </div>

      <div className="grid two-col" style={{ marginTop: 'var(--pad)' }}>
        {byChannel.map((c) => (
          <div className="card" key={c.ch}>
            <div className="card-title">{c.ch === 'email' ? '📧 Email' : '💬 Mobile'} Channel</div>
            <div className="rowlist">
              <div className="rowline"><span className="k">Total events</span><span className="v">{c.total.toLocaleString()}</span></div>
              <div className="rowline"><span className="k">Sent</span><span className="v">{c.sent.toLocaleString()}</span></div>
              <div className="rowline"><span className="k">Verified</span><span className="v" style={{ color: 'var(--green)' }}>{c.verified.toLocaleString()}</span></div>
              <div className="rowline"><span className="k">Failed</span><span className="v" style={{ color: 'var(--red)' }}>{c.failed.toLocaleString()}</span></div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div className="card-title" style={{ marginBottom: 0 }}>Recent OTP Events</div>
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <input className="otp-search" placeholder="Search player…" value={q} onChange={(e) => setQ(e.target.value)} />
            <select className="otp-search" value={action} onChange={(e) => setAction(e.target.value)}>
              <option value="all">All Actions</option><option value="sent">Sent</option><option value="verified">Verified</option><option value="failed">Failed</option>
            </select>
          </span>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0, marginTop: 10 }}><table style={{ minWidth: 860 }}>
          <thead><tr><th>Time</th><th>Player</th><th>Channel</th><th>Target</th><th>Action</th><th>IP</th></tr></thead>
          <tbody>
            {rows === null
              ? <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>Loading…</td></tr>
              : filtered.length === 0
                ? <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>No OTP events yet.</td></tr>
                : filtered.slice(0, 200).map((r, i) => (
                  <tr key={i}>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--muted)', fontSize: '.72rem' }}>{String(r.createdAt || '').replace('T', ' ').slice(0, 19)}</td>
                    <td><b>{r.username || r.playerId || '—'}</b></td>
                    <td>{chChip(r.channel)}</td>
                    <td style={{ color: 'var(--muted)', fontSize: '.74rem' }}>{r.target || '—'}</td>
                    <td><span className={stClass(r.action)}>{r.action}</span></td>
                    <td style={{ color: 'var(--muted)' }}>{r.ip || '—'}</td>
                  </tr>
                ))}
          </tbody>
        </table></div>
      </div>
    </>
  );
}
