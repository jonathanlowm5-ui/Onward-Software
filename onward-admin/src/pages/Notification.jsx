import { useEffect, useMemo, useState } from 'react';
import { useUI } from '../context/UIContext';
import {
  listNotifications,
  createNotification,
  removeNotification,
  sendNotification,
} from '../services/notificationService';
import { getAnnouncement, saveAnnouncement } from '../services/announcementService';

// Original static demo data (NOTIFQ) — used as offline fallback.
const DEMO_NOTIFS = [
  { title: 'Withdrawal Approved ✅', desc: 'Your withdrawal of ₱5,000 has been approved.', type: 'transaction', channel: 'both', target: 'all', sent: 12840, read: 81.2, prio: 'normal', at: '2025-05-30 14:22', scheduled: false },
  { title: 'Exclusive VIP Bonus', desc: 'Log in now to claim your exclusive VIP weekend bonus.', type: 'promo', channel: 'push', target: 'vip_gold', sent: 1240, read: 94.4, prio: 'high', at: '2025-05-29 10:00', scheduled: false },
  { title: 'Scheduled Maintenance', desc: 'Maintenance scheduled May 31, 2am–4am. Please plan acco…', type: 'system', channel: 'in-app', target: 'all', sent: 28400, read: 72.1, prio: 'urgent', at: '2025-05-28 20:00', scheduled: false },
  { title: 'New Game: Sweet Bonanza', desc: 'Sweet Bonanza is now live in our Slots Lobby. Spin to w…', type: 'event', channel: 'push', target: 'all', sent: 8200, read: 68.4, prio: 'normal', at: '2025-05-27 12:00', scheduled: false },
  { title: 'Login from New Device', desc: "A login was detected from a new device. If this wasn't …", type: 'security', channel: 'both', target: 'specific', sent: 320, read: 98.1, prio: 'urgent', at: '2025-05-26 08:44', scheduled: false },
  { title: 'Weekly Cashback Ready', desc: 'Your 10% weekly cashback has been credited to your acco…', type: 'promo', channel: 'in-app', target: 'all', sent: 5100, read: 77.3, prio: 'normal', at: '2025-05-25 09:00', scheduled: false },
  { title: 'Refer a Friend Launch', desc: 'Invite friends and earn ₱500 per referral.', type: 'promo', channel: 'both', target: 'existing', sent: 0, read: null, prio: 'normal', at: '2025-06-01', scheduled: true },
];

const TYPE_ICON = { system: '⚙️', promo: '🎁', transaction: '💳', event: '🎉', security: '🔒' };
const TypeChip = ({ t }) => <span className={`cms-type ty-${t}`}>{TYPE_ICON[t] || ''} {t}</span>;
const PrioCell = ({ p }) => <span className={`cms-pri-${p}`}>{p}</span>;
const fmtK = (v) => (v >= 1000 ? (v / 1000).toFixed(1).replace(/\.0$/, '') + 'K' : String(v));

const TARGET_MAP = { 'All Players': 'all', 'VIP Gold': 'vip_gold', 'Existing Players': 'existing', Specific: 'specific' };
const TARGET_LABEL = { all: 'All Players', vip_gold: 'VIP Gold', existing: 'Existing Players', specific: 'Specific' };

const EMPTY_FORM = {
  title: '', type: 'system', channel: 'in-app', target: 'All Players', prio: 'Normal',
  sched: '', expiry: '', body: '', deep: '', ids: '',
};

export default function Notification() {
  const { toast } = useUI();
  const [notifs, setNotifs] = useState(DEMO_NOTIFS);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: 'all', channel: 'all', q: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editIdx, setEditIdx] = useState(-1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [ann, setAnn] = useState({ enabled: false, text: '', level: 'info' });
  const [annSaving, setAnnSaving] = useState(false);

  useEffect(() => { getAnnouncement().then((a) => a && setAnn({ enabled: !!a.enabled, text: a.text || '', level: a.level || 'info' })).catch(() => {}); }, []);
  const saveAnn = async (patch) => {
    const next = { ...ann, ...patch };
    setAnn(next);
    setAnnSaving(true);
    try { await saveAnnouncement(next); toast(next.enabled ? 'Announcement live ✔' : 'Announcement saved'); }
    catch (e) { toast('⚠ ' + (e.message || 'Save failed')); }
    finally { setAnnSaving(false); }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await listNotifications();
        const rows = Array.isArray(data) ? data : data?.items;
        if (alive && rows && rows.length) {
          setNotifs(rows.map((n) => ({
            id: n.id,
            title: n.title,
            desc: n.desc ?? n.body ?? '',
            type: n.type ?? 'system',
            channel: n.channel ?? 'in-app',
            target: n.target ?? 'all',
            sent: n.sent ?? 0,
            read: n.read ?? null,
            prio: n.prio ?? n.priority ?? 'normal',
            at: n.at ?? n.sentAt ?? n.createdAt ?? '',
            scheduled: !!n.scheduled,
          })));
        }
      } catch {
        if (alive) setNotifs(DEMO_NOTIFS);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const sent = useMemo(() => notifs.filter((n) => !n.scheduled).reduce((s, n) => s + (n.sent || 0), 0), [notifs]);
  const avgRead = useMemo(() => {
    const reads = notifs.filter((n) => n.read != null);
    return reads.length ? (reads.reduce((s, n) => s + n.read, 0) / reads.length).toFixed(1) : '0';
  }, [notifs]);
  const schedN = useMemo(() => notifs.filter((n) => n.scheduled).length, [notifs]);

  const match = (n) =>
    (filter.type === 'all' || n.type === filter.type) &&
    (filter.channel === 'all' || n.channel === filter.channel) &&
    (!filter.q || (n.title + ' ' + n.desc).toLowerCase().includes(filter.q));

  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const openNew = () => {
    setEditIdx(-1);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };
  const openEdit = (i) => {
    const n = notifs[i];
    setEditIdx(i);
    setForm({
      ...EMPTY_FORM,
      title: n.title,
      type: n.type,
      channel: n.channel,
      prio: n.prio.charAt(0).toUpperCase() + n.prio.slice(1),
      body: n.desc,
      target: TARGET_LABEL[n.target] || 'All Players',
    });
    setModalOpen(true);
  };
  const close = () => setModalOpen(false);

  const save = async () => {
    const title = form.title.trim();
    if (!title) { toast('⚠ Title is required'); return; }
    const target = TARGET_MAP[form.target];
    if (target === 'specific' && !form.ids.trim()) {
      toast('⚠ Enter specific player IDs for a Specific target');
      return;
    }
    const base = {
      title,
      desc: form.body.trim() || (editIdx >= 0 ? notifs[editIdx].desc : ''),
      type: form.type,
      channel: form.channel,
      target,
      prio: form.prio.toLowerCase(),
    };

    if (editIdx < 0) {
      if (form.sched) {
        const data = { ...base, scheduled: true, at: form.sched.replace('T', ' '), sent: 0, read: null };
        try { const created = await createNotification(data); if (created?.id) data.id = created.id; } catch { /* offline demo */ }
        setNotifs((p) => [data, ...p]);
        close();
        toast('Notification scheduled 📅 ' + title + ' · ' + data.at);
      } else {
        const data = {
          ...base, scheduled: false,
          at: new Date().toLocaleString('sv-SE').slice(0, 16).replace('T', ' '),
          sent: Math.floor(500 + Math.random() * 30000), read: null,
        };
        try {
          const created = await createNotification(data);
          if (created?.id) { data.id = created.id; await sendNotification(created.id); }
        } catch { /* offline demo */ }
        setNotifs((p) => [data, ...p]);
        close();
        toast('Notification sent 🚀 ' + title + ' · ' + data.sent.toLocaleString() + ' players');
      }
    } else {
      setNotifs((p) => p.map((x, idx) => (idx === editIdx ? { ...x, ...base } : x)));
      close();
      toast('Notification updated 💾 ' + title);
    }
  };

  const del = async (i) => {
    const n = notifs[i];
    try { if (n.id) await removeNotification(n.id); } catch { /* offline demo */ }
    setNotifs((p) => p.filter((_, idx) => idx !== i));
    toast('Notification deleted 🗑 ' + n.title);
  };

  return (
    <>
      <div className="cms-head">
        <div className="grow">
          <h1 className="hero-h">🔔 Notification</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>Manage in-app and push notifications sent to players</div>
        </div>
        <button className="cms-newbtn" onClick={openNew}>+ New Notification</button>
      </div>

      {/* Emergency announcement ticker — scrolls at the top of the player site */}
      <div className="card" style={{ marginBottom: 'var(--pad)', borderTop: '3px solid var(--red,#e8485c)' }}>
        <div className="page-head" style={{ marginBottom: 12 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>🚨 Emergency Announcement Ticker</div>
          <span className="pr" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: ann.enabled ? 'var(--green)' : 'var(--muted)', fontWeight: 700 }}>{ann.enabled ? '● LIVE on site' : '○ Off'}</span>
            <label className="switch"><input type="checkbox" checked={!!ann.enabled} onChange={(e) => { if (e.target.checked && !ann.text.trim()) { toast('Enter a message first', 'error'); return; } saveAnn({ enabled: e.target.checked }); }} /><span className="slider"></span></label>
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>Shows a scrolling message at the very top of every player page. Use for maintenance, emergencies or important notices.</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <label className="fld-lbl">Message</label>
            <input value={ann.text} onChange={(e) => setAnn((s) => ({ ...s, text: e.target.value }))}
              placeholder="e.g. Scheduled maintenance tonight 2–4 AM. Deposits may be delayed."
              style={{ width: '100%', padding: '10px 12px', borderRadius: 9, background: 'var(--panel-3,#1b2541)', color: 'var(--text,#fff)', border: '1px solid var(--border,#243049)' }} />
          </div>
          <div>
            <label className="fld-lbl">Level</label>
            <select value={ann.level} onChange={(e) => setAnn((s) => ({ ...s, level: e.target.value }))}
              style={{ padding: '10px 12px', borderRadius: 9, background: 'var(--panel-3,#1b2541)', color: 'var(--text,#fff)', border: '1px solid var(--border,#243049)' }}>
              <option value="info">ℹ️ Info (blue)</option>
              <option value="warning">⚠️ Warning (amber)</option>
              <option value="critical">🚨 Critical (red)</option>
            </select>
          </div>
          <button className="btn-search" onClick={() => saveAnn({})} disabled={annSaving}>{annSaving ? 'Saving…' : '💾 Save'}</button>
        </div>
      </div>

      <div className="grid kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="card kpi b"><div className="lbl">Total Sent</div><div className="val">{fmtK(sent)}</div><div className="trend" style={{ color: 'var(--muted)' }}>all time</div></div>
        <div className="card kpi g"><div className="lbl">Read Rate</div><div className="val">{avgRead}%</div><div className="trend up">↑ 3.2% this month</div></div>
        <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">Unread</div><div className="val">12.4K</div><div className="trend" style={{ color: 'var(--muted)' }}>across all players</div></div>
        <div className="card kpi" style={{ borderTopColor: '#9b30d9' }}><div className="lbl">Scheduled</div><div className="val">{schedN}</div><div className="trend" style={{ color: 'var(--muted)' }}>pending send</div></div>
      </div>

      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="cms-tbar">
          <span className="ttl">Notifications</span>
          <span className="sp">
            <select value={filter.type} onChange={(e) => setFilter((p) => ({ ...p, type: e.target.value }))}>
              <option value="all">All Types</option>
              <option value="system">System</option>
              <option value="promo">Promo</option>
              <option value="transaction">Transaction</option>
              <option value="event">Event</option>
              <option value="security">Security</option>
            </select>
            <select value={filter.channel} onChange={(e) => setFilter((p) => ({ ...p, channel: e.target.value }))}>
              <option value="all">All Channels</option>
              <option value="in-app">In-App</option>
              <option value="push">Push</option>
              <option value="both">Both</option>
            </select>
            <input placeholder="Search…" value={filter.q} onChange={(e) => setFilter((p) => ({ ...p, q: e.target.value.toLowerCase() }))} />
          </span>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table style={{ minWidth: '1150px' }}>
            <thead><tr><th>Title</th><th>Type</th><th>Channel</th><th>Target</th><th>Sent</th><th>Read Rate</th><th>Priority</th><th>Sent At</th><th>Actions</th></tr></thead>
            <tbody>
              {notifs.filter(match).length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>No notifications match this filter</td></tr>
              ) : (
                notifs.map((n, i) => (match(n) ? (
                  <tr key={i}>
                    <td><div className="cms-title-cell"><div className="t">{n.title}</div><div className="d">{n.desc}</div></div></td>
                    <td><TypeChip t={n.type} /></td>
                    <td><span className="cms-chip">{n.channel}</span></td>
                    <td style={{ color: '#c4cde0' }}>{n.target}</td>
                    <td><span className="cms-num">{(n.sent || 0).toLocaleString()}</span></td>
                    <td>{n.read != null ? <span className="cms-readrate">{n.read}%</span> : <span style={{ opacity: 0.5 }}>—</span>}</td>
                    <td><PrioCell p={n.prio} /></td>
                    <td style={{ color: 'var(--muted)', fontSize: '.72rem', whiteSpace: 'nowrap' }}>{n.scheduled ? 'Scheduled: ' + n.at : n.at}</td>
                    <td><div className="cms-act"><button className="ed" onClick={() => openEdit(i)}>✏️ Edit</button><button className="rm" onClick={() => del(i)}>🗑</button></div></td>
                  </tr>
                ) : null))
              )}
            </tbody>
          </table>
        </div>
        {loading && null}
      </div>

      {modalOpen && (
        <div className="modal-ov show" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
          <div className="pm-modal" style={{ maxWidth: 580 }}>
            <div className="pm-head">
              <span style={{ fontSize: '1.1rem' }}>🔔</span>
              <span><div className="nm">{editIdx < 0 ? 'New Notification' : 'Edit Notification'}</div></span>
              <button className="kyc-x" style={{ marginLeft: 'auto' }} onClick={close}>✕</button>
            </div>
            <div className="pm-body">
              <div className="pm-fld" style={{ marginBottom: 12 }}><label>Title <span className="req-star">*</span></label><input value={form.title} onChange={(e) => setF('title', e.target.value)} placeholder="e.g. Your withdrawal has been approved!" /></div>
              <div className="pm-grid">
                <div className="pm-fld"><label>Type</label><select value={form.type} onChange={(e) => setF('type', e.target.value)}><option value="system">⚙️ System</option><option value="promo">🎁 Promo</option><option value="transaction">💳 Transaction</option><option value="event">🎉 Event</option><option value="security">🔒 Security</option></select></div>
                <div className="pm-fld"><label>Delivery Channel</label><select value={form.channel} onChange={(e) => setF('channel', e.target.value)}><option value="in-app">📱 In-App Only</option><option value="push">📬 Push Only</option><option value="both">📢 Both</option></select></div>
              </div>
              <div className="pm-grid" style={{ marginTop: 12 }}>
                <div className="pm-fld"><label>Target Audience</label><select value={form.target} onChange={(e) => setF('target', e.target.value)}><option>All Players</option><option>VIP Gold</option><option>Existing Players</option><option>Specific</option></select></div>
                <div className="pm-fld"><label>Priority</label><select value={form.prio} onChange={(e) => setF('prio', e.target.value)}><option>Normal</option><option>High</option><option>Urgent</option></select></div>
              </div>
              <div className="pm-grid" style={{ marginTop: 12 }}>
                <div className="pm-fld"><label>Schedule (leave blank = send now)</label><input type="datetime-local" value={form.sched} onChange={(e) => setF('sched', e.target.value)} /></div>
                <div className="pm-fld"><label>Expiry Date &amp; Time</label><input type="datetime-local" value={form.expiry} onChange={(e) => setF('expiry', e.target.value)} /></div>
              </div>
              <div className="pm-fld" style={{ marginTop: 12 }}><label>Message Body</label><textarea className="pwa-ta" value={form.body} onChange={(e) => setF('body', e.target.value)} placeholder="Enter notification message…" /></div>
              <div className="pm-fld" style={{ marginTop: 12 }}><label>Deep-Link URL (e.g. opens promotions page on tap)</label><input value={form.deep} onChange={(e) => setF('deep', e.target.value)} placeholder="https://onward.com/promotions" /></div>
              <div className="pm-fld" style={{ marginTop: 12 }}><label>Specific Player IDs (comma-separated, if target = Specific)</label><input value={form.ids} onChange={(e) => setF('ids', e.target.value)} placeholder="1001, 1042, 2084…" /></div>
            </div>
            <div className="pm-foot">
              <button className="btn-cancel" onClick={close}>Cancel</button>
              <button className="btn-pm-save" onClick={save}>{editIdx < 0 ? 'Send Notification' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
