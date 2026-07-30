import { useEffect, useMemo, useState } from 'react';
import { BOk, BBad } from '../components/ui.jsx';
import { useUI } from '../context/UIContext';
import { listAgents } from '../services/agentService';

// Real referral links — one per approved agent code, pointing at the live frontend.
const FRONTEND = 'https://onward-1590a.web.app';
const linkFor = (code) => `${FRONTEND}/?ref=${code}`;

export default function ReferralLinks() {
  const { toast } = useUI();
  const [agents, setAgents] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [q, setQ] = useState('');

  useEffect(() => {
    listAgents()
      .then((rows) => { setAgents(Array.isArray(rows) ? rows : []); setLoaded(true); })
      .catch((e) => { setLoaded(true); toast('⚠ ' + (e.message || 'Failed to load agents')); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const visible = useMemo(() => {
    const ql = q.toLowerCase();
    return agents.filter((a) => !ql || [a.username, a.code].some((v) => (v || '').toLowerCase().includes(ql)));
  }, [agents, q]);

  const copy = (code) => {
    const url = linkFor(code);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => toast('Link copied 📋 ' + url)).catch(() => toast('Copy this: ' + url));
    } else toast('Copy this: ' + url);
  };

  const totalPlayers = agents.reduce((s, a) => s + Number(a.stats?.players || 0), 0);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="hero-h">Referral Links</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>Live referral links for every approved agent — signups with <b>?ref=CODE</b> attach the player to that agent</div>
        </div>
        <span className="pr">
          <input className="qsearch" placeholder="Search agent / code…" value={q} onInput={(e) => setQ(e.target.value)} />
        </span>
      </div>

      <div className="grid kpi-grid">
        <div className="card kpi b"><div className="lbl">Agents</div><div className="val">{agents.length}</div><div className="trend" style={{ color: 'var(--muted)' }}>with referral codes</div></div>
        <div className="card kpi g"><div className="lbl">Referred Players</div><div className="val">{totalPlayers}</div><div className="trend" style={{ color: 'var(--muted)' }}>across all links</div></div>
        <div className="card kpi"><div className="lbl">Active Agents</div><div className="val">{agents.filter((a) => (a.status || 'active') === 'active').length}</div><div className="trend" style={{ color: 'var(--muted)' }}>links accepting signups</div></div>
      </div>

      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table style={{ minWidth: 900 }}>
            <thead><tr><th>Agent</th><th>Code</th><th>Referral Link</th><th>Players</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {visible.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 26 }}>
                  {loaded ? (q ? 'No agents match this search.' : 'No approved agents yet — approve applications under Agent → Agent Approval.') : 'Loading…'}
                </td></tr>
              )}
              {visible.map((a) => (
                <tr key={a.id}>
                  <td><div className="ag-name">{a.username}</div></td>
                  <td><span className="code-chip">{a.code}</span></td>
                  <td style={{ fontFamily: "'Roboto Mono',ui-monospace,monospace", fontSize: 12, color: '#aab4cc' }}>{linkFor(a.code)}</td>
                  <td style={{ fontWeight: 800 }}>{a.stats?.players ?? 0}</td>
                  <td>{(a.status || 'active') === 'active' ? <BOk>Active</BOk> : <BBad>{a.status}</BBad>}</td>
                  <td><button className="mini-btn gold" onClick={() => copy(a.code)}>📋 Copy Link</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
