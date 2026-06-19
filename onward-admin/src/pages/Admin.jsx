import { useState, useMemo } from 'react';
import { useUI } from '../context/UIContext';

const ROLE_META = {
  super: ['👑 Super Admin', 'r-super'],
  mgr: ['🔧 Manager', 'r-mgr'],
  sup: ['🎧 Support', 'r-sup'],
  fin: ['💰 Finance', 'r-fin'],
  game: ['🎮 Game Manager', 'r-game'],
  ana: ['📊 Analyst', 'r-ana'],
};

const INITIAL_ADMINS = [
  { n: 'Super Admin', u: 'superadmin', e: 'super@onward.com', r: 'super', perms: ['dashboard', 'players', 'kyc', 'vip'], more: 14, last: 'Just now', st: 1, locked: 1 },
  { n: 'John Manager', u: 'jmanager', e: 'john@onward.com', r: 'mgr', perms: ['dashboard', 'players', 'kyc', 'vip'], more: 10, last: '2h ago', st: 1 },
  { n: 'Ana Support', u: 'asupport', e: 'ana@onward.com', r: 'sup', perms: ['dashboard', 'players', 'kyc'], more: 0, last: '30m ago', st: 1 },
  { n: 'Leo Finance', u: 'lfinance', e: 'leo@onward.com', r: 'fin', perms: ['dashboard', 'withdrawals', 'deposits', 'bonuses'], more: 1, last: '1d ago', st: 1 },
  { n: 'Gam Manager', u: 'gmanager', e: 'gam@onward.com', r: 'game', perms: ['dashboard', 'games', 'bets', 'providers'], more: 0, last: '3d ago', st: 1 },
];

const initials = (n) =>
  n.replace(/[^a-zA-Z ]/g, '').split(/[\s_]+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() ||
  n.slice(0, 2).toUpperCase();

export default function Admin() {
  const { toast } = useUI();
  const [admins, setAdmins] = useState(INITIAL_ADMINS);
  const [filter, setFilter] = useState('');

  const act = admins.filter((a) => a.st).length;

  const admToggle = (i) => {
    setAdmins((prev) => {
      const next = prev.map((a, idx) => (idx === i ? { ...a, st: a.st ? 0 : 1 } : a));
      toast(next[i].st ? '@' + next[i].u + ' activated ✔' : '@' + next[i].u + ' suspended ⛔');
      return next;
    });
  };

  const q = filter.toLowerCase();
  const visible = useMemo(
    () => admins.map((a, i) => ({ a, i })).filter(({ a }) =>
      (a.n + ' ' + a.e + ' ' + a.u + ' ' + a.perms.join(' ')).toLowerCase().includes(q)),
    [admins, q]
  );

  return (
    <>
      <div className="page-head">
        <div><h1 className="hero-h">🧑‍💼 Admin Management</h1><div className="hero-sub" style={{ marginBottom: 0 }}>Add admins and control their access permissions</div></div>
        <span className="pr"><button className="btn-search" onClick={() => toast('Add New Admin — demo')}>＋ Add New Admin</button></span>
      </div>
      <div className="grid kpi-grid">
        <div className="card kpi b"><div className="lbl">Total Admins</div><div className="val">{admins.length}</div></div>
        <div className="card kpi g"><div className="lbl">Active Now</div><div className="val">2</div></div>
        <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">Super Admins</div><div className="val">{admins.filter((a) => a.r === 'super').length}</div></div>
        <div className="card kpi r"><div className="lbl">Suspended</div><div className="val">{admins.length - act}</div></div>
      </div>
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="page-head" style={{ marginBottom: '12px' }}><div className="card-title" style={{ marginBottom: 0 }}>Admin Accounts</div>
          <span className="pr"><input className="qsearch" placeholder="Search admin…" value={filter} onChange={(e) => setFilter(e.target.value)} /></span></div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table style={{ minWidth: '900px' }}>
          <thead><tr><th>Admin</th><th>Email</th><th>Role</th><th>Permissions</th><th>Last Login</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{visible.map(({ a, i }) => {
            const [rl, rc] = ROLE_META[a.r];
            return (
              <tr key={i}>
                <td><span className="adm-cell"><span className="pavatar">{initials(a.n)}</span><span><div className="an">{a.n}</div><div className="au">@{a.u}</div></span></span></td>
                <td>{a.e}</td>
                <td><span className={`rolechip ${rc}`}>{rl}</span></td>
                <td><span className="permchips">{a.perms.map((x, xi) => <span key={xi}>{x}</span>)}{a.more ? <span className="more">+{a.more} more</span> : null}</span></td>
                <td>{a.last}</td>
                <td>{a.st ? <span className="badge ok">Active</span> : <span className="badge bad">Suspended</span>}</td>
                <td><button className="mini-btn" onClick={() => toast('Edit admin: @' + a.u + ' — demo')}>✏️ Edit</button>{a.locked ? null : (a.st
                  ? <> <button className="act-suspend" onClick={() => admToggle(i)}>Suspend</button></>
                  : <> <button className="act-activate" onClick={() => admToggle(i)}>Activate</button></>)}</td>
              </tr>
            );
          })}</tbody>
        </table></div>
      </div>
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="card-title">🛡️ Roles &amp; Permissions Reference</div>
        <div className="roles-ref">
          <div className="role-card" style={{ borderColor: 'rgba(244,178,35,.4)' }}><div className="rn" style={{ color: 'var(--gold)' }}>👑 Super Admin</div><div className="rd">Full access to all features including admin management, financial approvals, system settings, and security controls.</div></div>
          <div className="role-card"><div className="rn" style={{ color: 'var(--blue)' }}>🔧 Manager</div><div className="rd">Access to players, finance, games, and promotions. Cannot modify system settings or add admins.</div></div>
          <div className="role-card"><div className="rn" style={{ color: 'var(--green)' }}>🎧 Support</div><div className="rd">View-only access to players and transactions. Can add notes but cannot approve withdrawals or modify data.</div></div>
          <div className="role-card"><div className="rn" style={{ color: '#ff8c42' }}>💰 Finance</div><div className="rd">Access to deposits, withdrawals, and financial reports only. No access to player personal data or games.</div></div>
          <div className="role-card"><div className="rn" style={{ color: '#c69bff' }}>🎮 Game Manager</div><div className="rd">Access to game catalog, providers, and game settings. Cannot access player accounts or financial data.</div></div>
          <div className="role-card"><div className="rn" style={{ color: '#c8d2e4' }}>📊 Analyst</div><div className="rd">Read-only access to analytics, reports, and dashboards. No ability to modify any data.</div></div>
        </div>
      </div>
    </>
  );
}
