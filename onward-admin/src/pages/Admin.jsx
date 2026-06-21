import { useState, useEffect, useCallback } from 'react';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import { listAdmins, createAdmin, updateAdmin, deleteAdminAccount } from '../services/authService';

const PERM_LABEL = {
  'players.edit': 'Edit player details',
  'players.delete': 'Delete players',
  'players.adjust': 'Adjust balances (credit/debit)',
  'players.resetpw': "Reset a player's password",
  'players.status': 'Suspend / activate players',
  'players.kick': 'Kick online sessions',
  'kyc.approve': 'Approve / reject KYC',
  'transactions.approve': 'Approve deposits / withdrawals',
  'settings.manage': 'Manage settings & bonuses',
  'admins.manage': 'Manage admin accounts',
};

const initials = (n) => (n || '').replace(/[^a-zA-Z0-9 ]/g, '').split(/[\s_]+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || (n || '?').slice(0, 2).toUpperCase();
const roleChip = (r) => <span className={`rolechip r-${r === 'superadmin' ? 'super' : r === 'manager' ? 'mgr' : r === 'support' ? 'sup' : 'ana'}`}>{r}</span>;

export default function Admin() {
  const { toast } = useUI();
  const { can, admin } = useAuth();
  const allowed = can('admins.manage');

  const [data, setData] = useState({ admins: [], roles: [], permissions: [] });
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null); // null | {mode, username, password, role, perms:Set}

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await listAdmins()); }
    catch (e) { toast('Could not load admins: ' + (e?.response?.data?.error || e.message)); }
    finally { setLoading(false); }
  }, [toast]);
  useEffect(() => { if (allowed) load(); else setLoading(false); }, [allowed, load]);

  const openAdd = () => setForm({ mode: 'add', username: '', password: '', role: 'admin', perms: new Set() });
  const openEdit = (a) => setForm({ mode: 'edit', username: a.username, password: '', role: a.role, perms: new Set(a.customPermissions || []) });
  const close = () => setForm(null);
  const togglePerm = (p) => setForm((f) => { const s = new Set(f.perms); s.has(p) ? s.delete(p) : s.add(p); return { ...f, perms: s }; });

  const save = async () => {
    const payload = { role: form.role, permissions: Array.from(form.perms) };
    try {
      if (form.mode === 'add') {
        if (!form.username.trim()) { toast('Username required'); return; }
        if (form.password.length < 8) { toast('Password must be at least 8 characters'); return; }
        await createAdmin({ username: form.username.trim(), password: form.password, ...payload });
        toast('Admin created ✔');
      } else {
        if (form.password && form.password.length < 8) { toast('Password must be at least 8 characters'); return; }
        await updateAdmin(form.username, { ...payload, ...(form.password ? { password: form.password } : {}) });
        toast('Admin updated ✔');
      }
      close();
      load();
    } catch (e) { toast('Save failed: ' + (e?.response?.data?.error || e.message)); }
  };

  const remove = async (a) => {
    if (!window.confirm(`Delete admin @${a.username}?`)) return;
    try { await deleteAdminAccount(a.username); toast('Admin deleted'); load(); }
    catch (e) { toast('Delete failed: ' + (e?.response?.data?.error || e.message)); }
  };

  if (!allowed) {
    return (
      <>
        <h1 className="hero-h">🧑‍💼 Admin Management</h1>
        <div className="card" style={{ marginTop: 12 }}>
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>
            🔒 You don’t have permission to manage admin accounts. Ask a superadmin.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-head">
        <div><h1 className="hero-h">🧑‍💼 Admin Management</h1><div className="hero-sub" style={{ marginBottom: 0 }}>Create admins and control what each role can do. You are signed in as <b>{admin?.username}</b> ({admin?.role}).</div></div>
        <span className="pr"><button className="btn-search" onClick={openAdd}>＋ Add Admin</button></span>
      </div>

      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table style={{ minWidth: '760px' }}>
          <thead><tr><th>Admin</th><th>Role</th><th>Permissions</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="4" style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>Loading…</td></tr>
              : data.admins.length ? data.admins.map((a) => (
                <tr key={a.username}>
                  <td><span className="adm-cell"><span className="pavatar">{initials(a.username)}</span><span><div className="an">@{a.username}</div></span></span></td>
                  <td>{roleChip(a.role)}</td>
                  <td><span style={{ fontSize: 12, color: 'var(--muted)' }}>{a.permissions.includes('*') ? 'All permissions' : (a.permissions.length ? a.permissions.length + ' permission(s)' : 'View only')}</span></td>
                  <td>
                    <button className="mini-btn" onClick={() => openEdit(a)}>✏️ Edit</button>{' '}
                    {a.username !== admin?.username && <button className="act-suspend" onClick={() => remove(a)}>Delete</button>}
                  </td>
                </tr>
              )) : <tr><td colSpan="4" style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>No admins.</td></tr>}
          </tbody>
        </table></div>
      </div>

      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="card-title">🛡️ Roles</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.8 }}>
          <div><b style={{ color: 'var(--gold)' }}>superadmin</b> — full access (everything).</div>
          <div><b>manager</b> — edit players, adjust balances, reset passwords, KYC + transaction approvals.</div>
          <div><b>admin</b> — suspend/kick players, approve KYC + transactions. <i>No edit/delete/adjust.</i></div>
          <div><b>support</b> — suspend players, approve KYC.</div>
          <div><b>viewer</b> — view only.</div>
          <div style={{ marginTop: 6 }}>Tick extra permissions below a role to grant beyond its default.</div>
        </div>
      </div>

      {form && (
        <div className="modal-ov show" onClick={(e) => { if (e.target === e.currentTarget) close(); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', zIndex: 4000, overflowY: 'auto' }}>
          <div style={{ width: 'min(520px,100%)', background: 'var(--surface,#0f1830)', border: '1px solid var(--border,#1e2d47)', borderRadius: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid var(--border,#1e2d47)' }}>
              <b style={{ color: 'var(--text,#fff)' }}>{form.mode === 'add' ? 'Add Admin' : `Edit @${form.username}`}</b>
              <button onClick={close} style={{ background: 'rgba(255,255,255,.08)', border: 'none', color: '#fff', width: 28, height: 28, borderRadius: 8, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {form.mode === 'add' && (
                <div className="fld"><label>Username</label><input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} placeholder="e.g. jsupport" /></div>
              )}
              <div className="fld"><label>{form.mode === 'add' ? 'Password (min 8)' : 'New password (optional)'}</label><input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder={form.mode === 'add' ? 'Min 8 characters' : 'Leave blank to keep'} /></div>
              <div className="fld"><label>Role</label>
                <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                  {data.roles.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Extra permissions</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}>
                  {data.permissions.map((p) => (
                    <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text,#fff)', cursor: form.role === 'superadmin' ? 'not-allowed' : 'pointer', opacity: form.role === 'superadmin' ? 0.5 : 1 }}>
                      <input type="checkbox" disabled={form.role === 'superadmin'} checked={form.role === 'superadmin' || form.perms.has(p)} onChange={() => togglePerm(p)} />
                      {PERM_LABEL[p] || p}
                    </label>
                  ))}
                </div>
                {form.role === 'superadmin' && <div style={{ fontSize: 12, color: 'var(--gold)', marginTop: 6 }}>Superadmin already has all permissions.</div>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, padding: '0 18px 18px' }}>
              <button className="btn-search" onClick={save}>💾 Save</button>
              <button className="btn-ghost" onClick={close}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
