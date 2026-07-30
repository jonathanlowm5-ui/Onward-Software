import { useCallback, useEffect, useRef, useState } from 'react';
import { useUI } from '../../context/UIContext';
import {
  getProviders, saveProviders, testProvider,
  previewAudience, listAudiences, saveAudiences,
  listCampaigns, createCampaign, sendCampaign, deleteCampaign,
  getAutomations, saveAutomations, getSummary, tick,
} from '../../services/marketingService';

/*
 * CampaignModule — the shared UI for SMS / Email / Push campaigns. One engine,
 * one UX; each channel only passes its icon/name and message-field layout.
 */

const st = {
  input: { width: '100%', padding: '9px 12px', borderRadius: 9, background: 'var(--panel-3,#1b2541)', color: 'var(--text,#fff)', border: '1px solid var(--border,#243049)', fontSize: '.78rem', fontWeight: 600 },
  lbl: { display: 'block', fontSize: '.62rem', color: 'var(--muted)', fontWeight: 800, letterSpacing: '.8px', textTransform: 'uppercase', marginBottom: 5 },
};
const Field = ({ label, children }) => (<div style={{ minWidth: 0 }}><label style={st.lbl}>{label}</label>{children}</div>);

const STATUS_CHIP = {
  draft: ['📝 Draft', 'st-draft'], scheduled: ['📅 Scheduled', 'st-up'],
  running: ['⏳ Running', 'st-up'], sent: ['✅ Sent', 'st-active'], failed: ['❌ Failed', 'st-comp'],
};

/* ---------- Audience builder (shared) ---------- */
export function AudienceBuilder({ filters, setFilters, adhoc, setAdhoc, allowCsv }) {
  const { toast } = useUI();
  const [preview, setPreview] = useState(null);
  const [audiences, setAudiences] = useState([]);
  const fileRef = useRef(null);
  const setF = (k, v) => setFilters((p) => ({ ...p, [k]: v }));

  useEffect(() => { listAudiences().then(setAudiences).catch(() => {}); }, []);

  const doPreview = async () => {
    try { setPreview(await previewAudience(filters)); }
    catch (e) { toast('⚠ ' + (e.message || 'Preview failed')); }
  };
  const saveAud = async () => {
    const name = window.prompt('Save this audience as:');
    if (!name) return;
    try {
      const next = [...audiences, { id: '', name, filters }];
      setAudiences(await saveAudiences(next));
      toast('Audience saved ✅ ' + name);
    } catch (e) { toast('⚠ ' + (e.message || 'Save failed')); }
  };
  const loadAud = (id) => {
    const a = audiences.find((x) => x.id === id);
    if (a) { setFilters(a.filters || {}); setPreview(null); toast('Audience loaded: ' + a.name); }
  };
  const importCsv = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const nums = String(reader.result).split(/[\n,;]+/).map((x) => x.trim()).filter((x) => /^[+0-9][0-9 -]{5,}$/.test(x));
      setAdhoc(nums);
      toast(`Imported ${nums.length} phone numbers 📱 (targeting overrides filters)`);
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ border: '1px solid var(--border,#243049)', borderRadius: 10, padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <b style={{ fontSize: '.75rem' }}>🎯 Audience</b>
        {audiences.length > 0 && (
          <select style={{ ...st.input, width: 'auto', padding: '5px 8px' }} defaultValue="" onChange={(e) => e.target.value && loadAud(e.target.value)}>
            <option value="">Load saved…</option>
            {audiences.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        )}
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {allowCsv && <>
            <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={(e) => importCsv(e.target.files?.[0])} />
            <button className="mini-btn" onClick={() => fileRef.current?.click()}>📎 Import CSV</button>
          </>}
          <button className="mini-btn" onClick={saveAud}>💾 Save audience</button>
          <button className="mini-btn gold" onClick={doPreview}>👁 Preview</button>
        </span>
      </div>

      {adhoc?.length > 0 ? (
        <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>
          📎 <b style={{ color: 'var(--gold)' }}>{adhoc.length}</b> imported numbers will be targeted (filters ignored).{' '}
          <button className="del-btn" onClick={() => setAdhoc([])}>Clear import</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 10 }}>
          <Field label="Country"><input style={st.input} value={filters.country || ''} onChange={(e) => setF('country', e.target.value)} placeholder="e.g. Philippines" /></Field>
          <Field label="Currency"><input style={st.input} value={filters.currency || ''} onChange={(e) => setF('currency', e.target.value)} placeholder="PHP / MYR…" /></Field>
          <Field label="Min VIP level"><input style={st.input} inputMode="numeric" value={filters.vipMin ?? ''} onChange={(e) => setF('vipMin', e.target.value)} placeholder="0" /></Field>
          <Field label="Activity">
            <select style={st.input} value={filters.activity || ''} onChange={(e) => setF('activity', e.target.value)}>
              <option value="">Any</option>
              <option value="active">Active (7 days)</option>
              <option value="inactive30">Inactive 30+ days</option>
            </select>
          </Field>
          <Field label="Registered from"><input style={st.input} type="date" value={filters.registeredFrom || ''} onChange={(e) => setF('registeredFrom', e.target.value)} /></Field>
          <Field label="Registered to"><input style={st.input} type="date" value={filters.registeredTo || ''} onChange={(e) => setF('registeredTo', e.target.value)} /></Field>
          <Field label="Min deposits (count)"><input style={st.input} inputMode="numeric" value={filters.minDeposits || ''} onChange={(e) => setF('minDeposits', e.target.value)} placeholder="e.g. 1" /></Field>
          <Field label="Min deposited (amount)"><input style={st.input} value={filters.minDepositAmount || ''} onChange={(e) => setF('minDepositAmount', e.target.value)} placeholder="e.g. 1000" /></Field>
          <Field label="Agent / referral code"><input style={st.input} value={filters.agentCode || ''} onChange={(e) => setF('agentCode', e.target.value)} /></Field>
          <Field label="Specific players (comma sep.)"><input style={st.input} value={(filters.usernames || []).join(', ')} onChange={(e) => setF('usernames', e.target.value.split(/[\s,;]+/).filter(Boolean))} placeholder="usernames / emails / IDs" /></Field>
          <Field label="Exclude players"><input style={st.input} value={(filters.exclude || []).join(', ')} onChange={(e) => setF('exclude', e.target.value.split(/[\s,;]+/).filter(Boolean))} placeholder="usernames to skip" /></Field>
        </div>
      )}

      {preview && (
        <div style={{ marginTop: 10, fontSize: '.72rem', color: 'var(--muted)' }}>
          🎯 Matches <b style={{ color: 'var(--gold)' }}>{preview.count.toLocaleString()}</b> players
          {preview.sample.length > 0 && <> — e.g. {preview.sample.slice(0, 4).map((s) => s.username).join(', ')}</>}
          <span style={{ marginLeft: 8, color: 'var(--muted)' }}>(opted-out players are always excluded)</span>
        </div>
      )}
    </div>
  );
}

/* ---------- Provider settings card ---------- */
function ProvidersCard({ channel, adapters, providers, onSaved }) {
  const { toast } = useUI();
  const [cfg, setCfg] = useState(providers);
  useEffect(() => setCfg(providers), [providers]);
  const chAdapters = Object.entries(adapters).filter(([, a]) => a.channel === channel);

  const addProvider = (type) => setCfg((p) => ({ ...p, list: [...p.list, { id: 'new' + Date.now().toString(36), type, label: adapters[type].label, config: {} }] }));
  const setProv = (id, patch) => setCfg((p) => ({ ...p, list: p.list.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  const setProvCfg = (id, k, v) => setCfg((p) => ({ ...p, list: p.list.map((x) => (x.id === id ? { ...x, config: { ...x.config, [k]: v } } : x)) }));
  const delProv = (id) => setCfg((p) => ({ ...p, list: p.list.filter((x) => x.id !== id), activeId: p.activeId === id ? '' : p.activeId, backupId: p.backupId === id ? '' : p.backupId }));

  const save = async () => {
    try {
      const all = await getProviders();
      const next = { ...all.providers, [channel]: cfg };
      const r = await saveProviders(next);
      onSaved(r.providers);
      toast('Provider settings saved ✅');
    } catch (e) { toast('⚠ ' + (e.message || 'Save failed')); }
  };
  const test = async (id) => {
    const to = window.prompt(channel === 'sms' ? 'Send test SMS to (phone number):' : channel === 'email' ? 'Send test email to:' : 'Test target (token / blank):') || '';
    if (channel !== 'push' && !to) return;
    try {
      const r = await testProvider(channel, id, to);
      toast(r.ok ? '✅ Test sent successfully' + (r.failedOver ? ' (via backup!)' : '') : '❌ ' + (r.error || 'Test failed'));
    } catch (e) { toast('❌ ' + (e.message || 'Test failed')); }
  };

  return (
    <div className="card" style={{ marginTop: 'var(--pad)' }}>
      <div className="page-head" style={{ marginBottom: 10 }}>
        <div className="card-title" style={{ marginBottom: 0 }}>🔌 Provider Settings</div>
        <span className="pr" style={{ display: 'flex', gap: 8 }}>
          <select style={{ ...st.input, width: 'auto', padding: '6px 10px' }} defaultValue="" onChange={(e) => { if (e.target.value) { addProvider(e.target.value); e.target.value = ''; } }}>
            <option value="">＋ Add provider…</option>
            {chAdapters.map(([k, a]) => <option key={k} value={k}>{a.label}</option>)}
          </select>
          <button className="btn-search" onClick={save}>💾 Save</button>
        </span>
      </div>

      {cfg.list.length === 0 ? (
        <div style={{ color: 'var(--muted)', fontSize: '.75rem' }}>
          No provider configured yet — add one above. {channel === 'push' && 'Tip: the built-in "In-app" provider needs no credentials and delivers to the player notification bell.'}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
            <Field label="Active provider">
              <select style={{ ...st.input, width: 220 }} value={cfg.activeId} onChange={(e) => setCfg((p) => ({ ...p, activeId: e.target.value }))}>
                <option value="">(first in list)</option>
                {cfg.list.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </Field>
            <Field label="Backup provider (auto-failover)">
              <select style={{ ...st.input, width: 220 }} value={cfg.backupId} onChange={(e) => setCfg((p) => ({ ...p, backupId: e.target.value }))}>
                <option value="">None</option>
                {cfg.list.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </Field>
          </div>
          {cfg.list.map((p) => (
            <div key={p.id} style={{ border: '1px solid var(--border,#243049)', borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                <span className="cms-chip">{adapters[p.type]?.label || p.type}</span>
                <input style={{ ...st.input, width: 200 }} value={p.label} onChange={(e) => setProv(p.id, { label: e.target.value })} placeholder="Label" />
                {cfg.activeId === p.id && <span className="badge ok">ACTIVE</span>}
                {cfg.backupId === p.id && <span className="badge pend">BACKUP</span>}
                <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                  <button className="mini-btn" onClick={() => test(p.id)}>🧪 Test connection</button>
                  <button className="del-btn" onClick={() => delProv(p.id)}>🗑</button>
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 10 }}>
                {(adapters[p.type]?.fields || []).map((f) => (
                  <Field key={f} label={f}>
                    {f === 'bodyTemplate' || f === 'headers'
                      ? <textarea className="pwa-ta" style={{ minHeight: 60, fontSize: '.72rem' }} value={p.config?.[f] || ''} onChange={(e) => setProvCfg(p.id, f, e.target.value)} placeholder={f === 'bodyTemplate' ? '{"to":"{{to}}","text":"{{message}}"}' : '{"Authorization":"Bearer …"}'} />
                      : <input style={st.input} value={p.config?.[f] || ''} onChange={(e) => setProvCfg(p.id, f, e.target.value)} placeholder={f} />}
                  </Field>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

/* ---------- Automations card (channel-scoped) ---------- */
function AutomationsCard({ channel }) {
  const { toast } = useUI();
  const [all, setAll] = useState([]);
  const [triggers, setTriggers] = useState([]);
  useEffect(() => { getAutomations().then((r) => { setAll(r.items); setTriggers(r.triggers); }).catch(() => {}); }, []);
  const mine = all.filter((a) => a.channel === channel);

  const persist = async (next) => {
    setAll(next);
    try { const r = await saveAutomations(next); setAll(r.items); toast('Automations saved ✅'); }
    catch (e) { toast('⚠ ' + (e.message || 'Save failed')); }
  };
  const add = () => persist([...all, { id: '', enabled: true, trigger: 'registration', channel, delayMinutes: 0, subject: '', message: 'Hi {{FirstName}}, welcome to Onward! 🎉' }]);
  const setA = (id, patch) => setAll((p) => p.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  const del = (id) => persist(all.filter((a) => a.id !== id));

  return (
    <div className="card" style={{ marginTop: 'var(--pad)' }}>
      <div className="page-head" style={{ marginBottom: 10 }}>
        <div className="card-title" style={{ marginBottom: 0 }}>🤖 Automations <span style={{ fontSize: '.65rem', color: 'var(--muted)', fontWeight: 600 }}>(trigger → wait → send via this channel)</span></div>
        <span className="pr" style={{ display: 'flex', gap: 8 }}>
          <button className="mini-btn" onClick={add}>＋ Add rule</button>
          <button className="btn-search" onClick={() => persist(all)}>💾 Save</button>
        </span>
      </div>
      {mine.length === 0 ? (
        <div style={{ color: 'var(--muted)', fontSize: '.75rem' }}>No automation rules for this channel — e.g. registration → welcome message, first deposit → congratulation, 30 days inactive → reactivation.</div>
      ) : mine.map((a) => (
        <div key={a.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
          <label className="switch"><input type="checkbox" checked={a.enabled !== false} onChange={(e) => setA(a.id, { enabled: e.target.checked })} /><span className="slider"></span></label>
          <select style={{ ...st.input, width: 160 }} value={a.trigger} onChange={(e) => setA(a.id, { trigger: e.target.value })}>
            {triggers.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
          <span style={{ fontSize: '.7rem', color: 'var(--muted)' }}>wait</span>
          <input style={{ ...st.input, width: 70 }} inputMode="numeric" value={a.delayMinutes} onChange={(e) => setA(a.id, { delayMinutes: e.target.value })} />
          <span style={{ fontSize: '.7rem', color: 'var(--muted)' }}>min →</span>
          {channel !== 'sms' && <input style={{ ...st.input, width: 170 }} value={a.subject} onChange={(e) => setA(a.id, { subject: e.target.value })} placeholder="Subject / title" />}
          <input style={{ ...st.input, flex: 1, minWidth: 220 }} value={a.message} onChange={(e) => setA(a.id, { message: e.target.value })} placeholder="Message — {{FirstName}} {{Amount}}…" />
          <button className="del-btn" onClick={() => del(a.id)}>🗑</button>
        </div>
      ))}
    </div>
  );
}

/* ---------- The module ---------- */
export default function CampaignModule({ channel, icon, title, sub, messagePlaceholder, extraFields }) {
  const { toast } = useUI();
  const [summary, setSummary] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [providers, setProviders] = useState(null);
  const [adapters, setAdapters] = useState({});
  const [open, setOpen] = useState(false);

  const load = useCallback(() => {
    listCampaigns(channel).then(setCampaigns).catch(() => {});
    getSummary().then(setSummary).catch(() => {});
  }, [channel]);

  useEffect(() => {
    load();
    getProviders().then((r) => { setProviders(r.providers); setAdapters(r.adapters); }).catch(() => {});
    // The tick doubles as the scheduler worker — polling it runs due
    // campaigns/automation jobs even without an external cron.
    const id = setInterval(() => { tick().catch(() => {}); load(); }, 30000);
    return () => clearInterval(id);
  }, [load]);

  /* --- create form state --- */
  const [form, setForm] = useState({ name: '', subject: '', message: '', html: '', image: '', link: '', scheduleAt: '' });
  const [filters, setFilters] = useState({});
  const [adhoc, setAdhoc] = useState([]);
  const [busy, setBusy] = useState(false);
  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const openNew = () => { setForm({ name: '', subject: '', message: '', html: '', image: '', link: '', scheduleAt: '' }); setFilters({}); setAdhoc([]); setOpen(true); };

  const submit = async (action) => {
    if (!form.name.trim()) { toast('⚠ Campaign name is required'); return; }
    if (!form.message.trim() && !form.html.trim()) { toast('⚠ Message is required'); return; }
    if (action === 'schedule' && !form.scheduleAt) { toast('⚠ Pick a schedule date/time'); return; }
    setBusy(true);
    try {
      const r = await createCampaign({ channel, ...form, filters, adhocRecipients: adhoc, action });
      setOpen(false);
      load();
      if (action === 'send') toast(`🚀 Sent: ${r.result?.stats?.sent ?? 0}/${r.result?.stats?.targeted ?? 0} delivered${r.result?.stats?.failedOver ? ' (backup provider used)' : ''}`);
      else toast(action === 'schedule' ? '📅 Campaign scheduled' : '📝 Draft saved');
    } catch (e) { toast('⚠ ' + (e.message || 'Failed')); }
    finally { setBusy(false); }
  };

  const sendNow = async (c) => {
    try {
      const r = await sendCampaign(c.id);
      toast(`🚀 Sent: ${r.result?.stats?.sent ?? 0}/${r.result?.stats?.targeted ?? 0}`);
      load();
    } catch (e) { toast('⚠ ' + (e.message || 'Send failed')); }
  };
  const del = async (c) => { try { await deleteCampaign(c.id); load(); toast('Deleted 🗑'); } catch (e) { toast('⚠ ' + e.message); } };

  const exportCsv = () => {
    const rows = [['Name', 'Status', 'Targeted', 'Sent', 'Failed', 'Opened', 'Clicked', 'Created', 'SentAt'],
      ...campaigns.map((c) => [c.name, c.status, c.stats?.targeted, c.stats?.sent, c.stats?.failed, c.stats?.opened, c.stats?.clicked, c.createdAt, c.sentAt])];
    const csv = rows.map((r) => r.map((x) => '"' + String(x ?? '').replace(/"/g, '""') + '"').join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `onward-${channel}-campaigns.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <div className="page-head">
        <div><h1 className="hero-h">{icon} {title}</h1><div className="hero-sub" style={{ marginBottom: 0 }}>{sub}</div></div>
        <span className="pr"><button className="btn-search" onClick={openNew}>＋ New Campaign</button></span>
      </div>

      {/* Unified marketing summary */}
      {summary && (
        <div className="grid kpi-grid">
          <div className="card kpi b"><div className="lbl">All Campaigns</div><div className="val">{summary.campaigns.total}</div><div className="trend" style={{ color: 'var(--muted)' }}>{summary.campaigns.running} running · {summary.campaigns.scheduled} scheduled · {summary.campaigns.failed} failed</div></div>
          <div className="card kpi g"><div className="lbl">Messages Sent</div><div className="val">{(summary.sent.sms + summary.sent.email + summary.sent.push).toLocaleString()}</div><div className="trend" style={{ color: 'var(--muted)' }}>📱{summary.sent.sms} ✉️{summary.sent.email} 🔔{summary.sent.push}</div></div>
          <div className="card kpi"><div className="lbl">Delivery / Open / Click</div><div className="val" style={{ fontSize: '1.15rem' }}>{summary.deliveryRate}% · {summary.openRate}% · {summary.clickRate}%</div><div className="trend" style={{ color: 'var(--muted)' }}>email opens & clicks tracked</div></div>
          <div className="card kpi" style={{ borderTopColor: '#9b6dff' }}><div className="lbl">Ad Spend</div><div className="val">{summary.adSpend.toLocaleString()}</div><div className="trend" style={{ color: 'var(--muted)' }}>{summary.adsCampaigns} ads campaigns · {summary.jobsQueued} jobs queued</div></div>
        </div>
      )}

      {/* Campaigns table */}
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="page-head" style={{ marginBottom: 10 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>Campaigns</div>
          <button className="mini-btn" onClick={exportCsv}>⬇ Export CSV</button>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table style={{ minWidth: 940 }}>
          <thead><tr><th>Campaign</th><th>Status</th><th>Targeted</th><th>Sent</th><th>Failed</th>{channel === 'email' && <><th>Opened</th><th>Clicked</th></>}<th>When</th><th>Actions</th></tr></thead>
          <tbody>
            {campaigns.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--muted)', padding: 22 }}>No campaigns yet — click “＋ New Campaign”.</td></tr>
            ) : campaigns.map((c) => {
              const [label, cls] = STATUS_CHIP[c.status] || [c.status, 'st-draft'];
              return (
                <tr key={c.id}>
                  <td><b>{c.name}</b>{c.subject && <div style={{ color: 'var(--muted)', fontSize: '.68rem' }}>{c.subject}</div>}</td>
                  <td><span className={`stchip ${cls}`}>{label}</span></td>
                  <td>{c.stats?.targeted ?? '—'}</td>
                  <td style={{ color: 'var(--green)', fontWeight: 800 }}>{c.stats?.sent ?? 0}{c.stats?.failedOver ? <span title="delivered via backup provider"> ⚠</span> : ''}</td>
                  <td style={{ color: c.stats?.failed ? 'var(--red)' : 'var(--muted)' }}>{c.stats?.failed ?? 0}</td>
                  {channel === 'email' && <><td>{c.stats?.opened ?? 0}</td><td>{c.stats?.clicked ?? 0}</td></>}
                  <td style={{ color: 'var(--muted)', fontSize: '.68rem', whiteSpace: 'nowrap' }}>{(c.status === 'scheduled' ? '📅 ' + (c.scheduleAt || '') : (c.sentAt || c.createdAt || '')).replace('T', ' ').slice(0, 16)}</td>
                  <td><div className="cms-act">
                    {(c.status === 'draft' || c.status === 'scheduled' || c.status === 'failed') && <button className="ed" onClick={() => sendNow(c)}>🚀 Send</button>}
                    <button className="rm" onClick={() => del(c)}>🗑</button>
                  </div></td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      </div>

      {providers && <ProvidersCard channel={channel} adapters={adapters} providers={providers[channel]} onSaved={setProviders} />}
      <AutomationsCard channel={channel} />

      {/* ===== CREATE CAMPAIGN ===== */}
      {open && (
        <div className="modal-ov show" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="pm-modal" style={{ maxWidth: 760 }}>
            <div className="pm-head">
              <span style={{ fontSize: '1.1rem' }}>{icon}</span>
              <span><div className="nm">New {title.replace(' Campaign', '')} Campaign</div></span>
              <button className="kyc-x" style={{ marginLeft: 'auto' }} onClick={() => setOpen(false)}>✕</button>
            </div>
            <div className="pm-body">
              <div className="pm-fld" style={{ marginBottom: 12 }}><label>Campaign name <span className="req-star">*</span></label><input value={form.name} onChange={(e) => setF('name', e.target.value)} placeholder="e.g. Weekend Reload Blast" /></div>

              {extraFields && extraFields({ form, setF })}

              <div className="pm-fld" style={{ marginBottom: 6 }}>
                <label>Message <span className="req-star">*</span></label>
                <textarea className="pwa-ta" style={{ minHeight: 90 }} value={form.message} onChange={(e) => setF('message', e.target.value)} placeholder={messagePlaceholder} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>
                Variables: <code>{'{{FirstName}} {{FullName}} {{Username}} {{Balance}} {{Currency}} {{PlayerCode}}'}</code>
              </div>

              <AudienceBuilder filters={filters} setFilters={setFilters} adhoc={adhoc} setAdhoc={setAdhoc} allowCsv={channel === 'sms'} />

              <div className="pm-grid" style={{ marginTop: 12 }}>
                <div className="pm-fld"><label>Schedule for (used by “Schedule”)</label><input type="datetime-local" value={form.scheduleAt} onChange={(e) => setF('scheduleAt', e.target.value)} /></div>
              </div>
            </div>
            <div className="pm-foot" style={{ gap: 8 }}>
              <button className="btn-cancel" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn-cancel" disabled={busy} onClick={() => submit('draft')}>📝 Save draft</button>
              <button className="btn-cancel" disabled={busy} onClick={() => submit('schedule')}>📅 Schedule</button>
              <button className="btn-pm-save" disabled={busy} onClick={() => submit('send')}>{busy ? 'Sending…' : '🚀 Send now'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
