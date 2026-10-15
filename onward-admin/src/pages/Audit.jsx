import { useEffect, useState } from 'react';
import { getAuditLog } from '../services/configService';

const methodColor = (m) => (m === 'DELETE' ? 'var(--red)' : m === 'POST' ? 'var(--green)' : m === 'PUT' || m === 'PATCH' ? 'var(--gold)' : 'var(--blue)');

export default function Audit() {
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    const load = () => getAuditLog().then((d) => setRows(Array.isArray(d) ? d : [])).catch(() => setRows([]));
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  const shown = (rows || []).filter((r) => !q
    || [r.admin, r.role, r.method, r.path, r.ip].some((v) => String(v || '').toLowerCase().includes(q.toLowerCase())));

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="hero-h">Audit Logs</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>Every mutating admin action, recorded automatically — refreshes every 30s</div>
        </div>
      </div>
      <div className="card">
        <input className="otp-search" placeholder="Search admin, path, method, IP…" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: 10 }} />
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table style={{ minWidth: 820 }}>
          <thead><tr><th>Time</th><th>Admin</th><th>Role</th><th>Method</th><th>Path</th><th>IP</th></tr></thead>
          <tbody>
            {rows === null
              ? <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>Loading…</td></tr>
              : shown.length === 0
                ? <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>{q ? 'No entries match this search.' : 'No audit entries yet — admin actions appear here.'}</td></tr>
                : shown.slice(0, 200).map((r, i) => (
                  <tr key={i}>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--muted)', fontSize: '.72rem' }}>{String(r.createdAt || '').replace('T', ' ').slice(0, 19)}</td>
                    <td><b>{r.admin || '—'}</b></td>
                    <td style={{ color: 'var(--muted)' }}>{r.role || '—'}</td>
                    <td><span style={{ color: methodColor(r.method), fontWeight: 800 }}>{r.method}</span></td>
                    <td style={{ fontFamily: "'Roboto Mono','Courier New',ui-monospace,monospace", fontSize: '.72rem' }}>{r.path}</td>
                    <td style={{ color: 'var(--muted)' }}>{r.ip || '—'}</td>
                  </tr>
                ))}
          </tbody>
        </table></div>
      </div>
    </>
  );
}
