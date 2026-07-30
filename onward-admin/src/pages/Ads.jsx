import { useCallback, useEffect, useState } from 'react';
import { useUI } from '../context/UIContext';
import {
  listAdsConnectors, saveAdsConnectors,
  listAdsCampaigns, createAdsCampaign, updateAdsCampaign, deleteAdsCampaign,
} from '../services/marketingService';

/*
 * Ads Marketing — connect ad platforms (credentials per platform), track ads
 * campaigns with budgets, and see real attribution: registrations and first-
 * time deposits are matched by UTM/referral code against the player base, so
 * CPA / cost-per-FTD / ROAS / profit are computed from live platform data.
 */
const PLATFORMS = [
  ['google', '🔍 Google Ads', ['developerToken', 'clientId', 'clientSecret', 'refreshToken', 'customerId']],
  ['meta', '📘 Meta (Facebook) Ads', ['accessToken', 'adAccountId', 'pixelId']],
  ['tiktok', '🎵 TikTok Ads', ['accessToken', 'advertiserId']],
  ['telegram', '✈️ Telegram Ads', ['apiToken', 'accountId']],
  ['x', '𝕏 X (Twitter) Ads', ['apiKey', 'apiSecret', 'accessToken', 'accessSecret']],
  ['snapchat', '👻 Snapchat Ads', ['clientId', 'clientSecret', 'refreshToken']],
  ['custom', '🔌 Custom Advertising API', ['apiUrl', 'apiKey']],
];
const PLABEL = Object.fromEntries(PLATFORMS.map(([k, l]) => [k, l]));

const inp = { width: '100%', padding: '9px 12px', borderRadius: 9, background: 'var(--panel-3,#1b2541)', color: 'var(--text,#fff)', border: '1px solid var(--border,#243049)', fontSize: '.78rem', fontWeight: 600 };
const lbl = { display: 'block', fontSize: '.62rem', color: 'var(--muted)', fontWeight: 800, letterSpacing: '.8px', textTransform: 'uppercase', marginBottom: 5 };
const money = (n) => Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

export default function Ads() {
  const { toast } = useUI();
  const [connectors, setConnectors] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [open, setOpen] = useState(false);
  const [metricsFor, setMetricsFor] = useState(null); // campaign being edited
  const [form, setForm] = useState({ name: '', platform: 'meta', connectorId: '', dailyBudget: '', lifetimeBudget: '', utm: '', spend: '', impressions: '', clicks: '' });
  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const load = useCallback(() => {
    listAdsConnectors().then(setConnectors).catch(() => {});
    listAdsCampaigns().then(setCampaigns).catch(() => {});
  }, []);
  useEffect(() => { load(); const id = setInterval(load, 30000); return () => clearInterval(id); }, [load]);

  /* ---- connectors ---- */
  const addConnector = (platform) => setConnectors((p) => [...p, { id: '', platform, label: PLABEL[platform], accountId: '', config: {} }]);
  const setConn = (i, patch) => setConnectors((p) => p.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const setConnCfg = (i, k, v) => setConnectors((p) => p.map((c, j) => (j === i ? { ...c, config: { ...c.config, [k]: v } } : c)));
  const delConn = (i) => setConnectors((p) => p.filter((_, j) => j !== i));
  const saveConns = async () => {
    try { setConnectors(await saveAdsConnectors(connectors)); toast('Ad connectors saved ✅'); }
    catch (e) { toast('⚠ ' + (e.message || 'Save failed')); }
  };

  /* ---- campaigns ---- */
  const create = async () => {
    if (!form.name.trim()) { toast('⚠ Name required'); return; }
    try {
      await createAdsCampaign(form);
      setOpen(false);
      load();
      toast('Ads campaign added ✅' + (form.utm ? ' — registrations with referral code "' + form.utm + '" are attributed automatically' : ''));
    } catch (e) { toast('⚠ ' + (e.message || 'Failed')); }
  };
  const saveMetrics = async () => {
    try {
      await updateAdsCampaign(metricsFor.id, { metrics: { spend: metricsFor.metrics.spend, impressions: metricsFor.metrics.impressions, clicks: metricsFor.metrics.clicks }, status: metricsFor.status });
      setMetricsFor(null);
      load();
      toast('Metrics updated 💾');
    } catch (e) { toast('⚠ ' + (e.message || 'Failed')); }
  };
  const del = async (c) => { try { await deleteAdsCampaign(c.id); load(); toast('Deleted 🗑'); } catch (e) { toast('⚠ ' + e.message); } };

  /* ---- dashboard totals ---- */
  const tot = campaigns.reduce((s, c) => ({
    spend: s.spend + (c.metrics?.spend || 0),
    impressions: s.impressions + (c.metrics?.impressions || 0),
    clicks: s.clicks + (c.metrics?.clicks || 0),
    regs: s.regs + (c.metrics?.registrations || 0),
    ftd: s.ftd + (c.metrics?.ftd || 0),
    revenue: s.revenue + (c.metrics?.revenue || 0),
  }), { spend: 0, impressions: 0, clicks: 0, regs: 0, ftd: 0, revenue: 0 });
  const roas = tot.spend ? tot.revenue / tot.spend : 0;

  return (
    <>
      <div className="page-head">
        <div><h1 className="hero-h">📣 Ads Marketing</h1><div className="hero-sub" style={{ marginBottom: 0 }}>Connect ad platforms, manage budgets and track real attribution — registrations & FTDs matched by UTM/referral code</div></div>
        <span className="pr"><button className="btn-search" onClick={() => setOpen(true)}>＋ Add Campaign</button></span>
      </div>

      {/* Spend dashboard */}
      <div className="grid kpi-grid">
        <div className="card kpi r"><div className="lbl">Total Spend</div><div className="val">{money(tot.spend)}</div><div className="trend" style={{ color: 'var(--muted)' }}>{tot.impressions.toLocaleString()} impressions · {tot.clicks.toLocaleString()} clicks</div></div>
        <div className="card kpi b"><div className="lbl">Registrations / FTD</div><div className="val">{tot.regs} / {tot.ftd}</div><div className="trend" style={{ color: 'var(--muted)' }}>CPA {money(tot.regs ? tot.spend / tot.regs : 0)} · per FTD {money(tot.ftd ? tot.spend / tot.ftd : 0)}</div></div>
        <div className="card kpi g"><div className="lbl">Revenue (attributed)</div><div className="val">{money(tot.revenue)}</div><div className="trend" style={{ color: 'var(--muted)' }}>from deposits of attributed players</div></div>
        <div className="card kpi" style={{ borderTopColor: roas >= 1 ? 'var(--green)' : '#ff8c42' }}><div className="lbl">ROAS / Profit</div><div className="val">{roas.toFixed(2)}x</div><div className="trend" style={{ color: tot.revenue - tot.spend >= 0 ? 'var(--green)' : 'var(--red)' }}>{tot.revenue - tot.spend >= 0 ? '▲' : '▼'} {money(tot.revenue - tot.spend)} P/L</div></div>
      </div>

      {/* Campaigns */}
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="card-title">Campaigns</div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table style={{ minWidth: 1150 }}>
          <thead><tr><th>Campaign</th><th>Platform</th><th>Status</th><th>Budget (D/L)</th><th>Spend</th><th>Impr.</th><th>Clicks</th><th>CTR</th><th>CPC</th><th>Regs</th><th>FTD</th><th>ROAS</th><th>P/L</th><th>Actions</th></tr></thead>
          <tbody>
            {campaigns.length === 0 ? (
              <tr><td colSpan={14} style={{ textAlign: 'center', color: 'var(--muted)', padding: 22 }}>No ads campaigns yet. Add one and set its UTM/referral code — registrations and deposits attribute automatically.</td></tr>
            ) : campaigns.map((c) => (
              <tr key={c.id}>
                <td><b>{c.name}</b>{c.utm && <div style={{ color: 'var(--muted)', fontSize: '.66rem' }}>utm: {c.utm}</div>}</td>
                <td>{PLABEL[c.platform] || c.platform}</td>
                <td><span className={`stchip ${c.status === 'active' ? 'st-active' : c.status === 'paused' ? 'st-up' : 'st-comp'}`}>{c.status}</span></td>
                <td style={{ fontSize: '.7rem' }}>{money(c.dailyBudget)} / {money(c.lifetimeBudget)}</td>
                <td style={{ color: 'var(--red)', fontWeight: 800 }}>{money(c.metrics?.spend)}</td>
                <td>{(c.metrics?.impressions || 0).toLocaleString()}</td>
                <td>{(c.metrics?.clicks || 0).toLocaleString()}</td>
                <td>{(c.kpi?.ctr || 0).toFixed(2)}%</td>
                <td>{money(c.kpi?.cpc)}</td>
                <td style={{ fontWeight: 800 }}>{c.metrics?.registrations || 0}</td>
                <td style={{ fontWeight: 800 }}>{c.metrics?.ftd || 0}</td>
                <td style={{ color: (c.kpi?.roas || 0) >= 1 ? 'var(--green)' : 'var(--muted)', fontWeight: 800 }}>{(c.kpi?.roas || 0).toFixed(2)}x</td>
                <td style={{ color: (c.kpi?.profit || 0) >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 800 }}>{money(c.kpi?.profit)}</td>
                <td><div className="cms-act">
                  <button className="ed" onClick={() => setMetricsFor(JSON.parse(JSON.stringify(c)))}>✏️ Metrics</button>
                  <button className="rm" onClick={() => del(c)}>🗑</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table></div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
          💡 Give each ads campaign a <b>UTM / referral code</b> and use it in your ad landing links (players registering with it are attributed). Spend/impressions/clicks come from the ad platform — paste them via “✏️ Metrics” or push them automatically to <code>PATCH /api/marketing/ads/campaigns/:id</code>.
        </div>
      </div>

      {/* Connectors */}
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="page-head" style={{ marginBottom: 10 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>🔌 Platform Connections</div>
          <span className="pr" style={{ display: 'flex', gap: 8 }}>
            <select style={{ ...inp, width: 'auto', padding: '6px 10px' }} defaultValue="" onChange={(e) => { if (e.target.value) { addConnector(e.target.value); e.target.value = ''; } }}>
              <option value="">＋ Connect platform…</option>
              {PLATFORMS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
            <button className="btn-search" onClick={saveConns}>💾 Save</button>
          </span>
        </div>
        {connectors.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: '.75rem' }}>No ad platforms connected. Add Google / Meta / TikTok / Telegram / X / Snapchat / custom credentials here — keys are stored server-side and masked.</div>
        ) : connectors.map((c, i) => {
          const fields = (PLATFORMS.find(([k]) => k === c.platform) || [null, null, []])[2];
          return (
            <div key={c.id || i} style={{ border: '1px solid var(--border,#243049)', borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                <span className="cms-chip">{PLABEL[c.platform]}</span>
                <input style={{ ...inp, width: 200 }} value={c.label || ''} onChange={(e) => setConn(i, { label: e.target.value })} placeholder="Label" />
                <input style={{ ...inp, width: 180 }} value={c.accountId || ''} onChange={(e) => setConn(i, { accountId: e.target.value })} placeholder="Account ID" />
                {c.connected && <span className="badge ok">Credentials set</span>}
                <button className="del-btn" style={{ marginLeft: 'auto' }} onClick={() => delConn(i)}>🗑</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 10 }}>
                {fields.map((f) => (
                  <div key={f}><label style={lbl}>{f}</label><input style={inp} value={c.config?.[f] || ''} onChange={(e) => setConnCfg(i, f, e.target.value)} placeholder={f} /></div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ===== ADD CAMPAIGN ===== */}
      {open && (
        <div className="modal-ov show" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="pm-modal" style={{ maxWidth: 560 }}>
            <div className="pm-head"><span style={{ fontSize: '1.1rem' }}>📣</span><span><div className="nm">Add Ads Campaign</div></span><button className="kyc-x" style={{ marginLeft: 'auto' }} onClick={() => setOpen(false)}>✕</button></div>
            <div className="pm-body">
              <div className="pm-fld" style={{ marginBottom: 12 }}><label>Name <span className="req-star">*</span></label><input value={form.name} onChange={(e) => setF('name', e.target.value)} placeholder="e.g. July FB Lead Gen — PH" /></div>
              <div className="pm-grid">
                <div className="pm-fld"><label>Platform</label><select value={form.platform} onChange={(e) => setF('platform', e.target.value)}>{PLATFORMS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
                <div className="pm-fld"><label>Connection</label><select value={form.connectorId} onChange={(e) => setF('connectorId', e.target.value)}><option value="">—</option>{connectors.map((c) => <option key={c.id} value={c.id}>{c.label || PLABEL[c.platform]}</option>)}</select></div>
              </div>
              <div className="pm-grid" style={{ marginTop: 12 }}>
                <div className="pm-fld"><label>Daily budget</label><input value={form.dailyBudget} onChange={(e) => setF('dailyBudget', e.target.value)} placeholder="e.g. 500" /></div>
                <div className="pm-fld"><label>Lifetime budget</label><input value={form.lifetimeBudget} onChange={(e) => setF('lifetimeBudget', e.target.value)} placeholder="e.g. 15000" /></div>
              </div>
              <div className="pm-fld" style={{ marginTop: 12 }}><label>UTM / referral code (attribution)</label><input value={form.utm} onChange={(e) => setF('utm', e.target.value)} placeholder="e.g. FB-JULY — use as referral code in your ad links" /></div>
              <div className="pm-grid" style={{ marginTop: 12 }}>
                <div className="pm-fld"><label>Spend so far</label><input value={form.spend} onChange={(e) => setF('spend', e.target.value)} placeholder="0" /></div>
                <div className="pm-fld"><label>Impressions</label><input value={form.impressions} onChange={(e) => setF('impressions', e.target.value)} placeholder="0" /></div>
              </div>
              <div className="pm-fld" style={{ marginTop: 12 }}><label>Clicks</label><input value={form.clicks} onChange={(e) => setF('clicks', e.target.value)} placeholder="0" /></div>
            </div>
            <div className="pm-foot"><button className="btn-cancel" onClick={() => setOpen(false)}>Cancel</button><button className="btn-pm-save" onClick={create}>Add Campaign</button></div>
          </div>
        </div>
      )}

      {/* ===== EDIT METRICS ===== */}
      {metricsFor && (
        <div className="modal-ov show" onClick={(e) => { if (e.target === e.currentTarget) setMetricsFor(null); }}>
          <div className="pm-modal" style={{ maxWidth: 460 }}>
            <div className="pm-head"><span style={{ fontSize: '1.1rem' }}>📊</span><span><div className="nm">{metricsFor.name} — metrics</div></span><button className="kyc-x" style={{ marginLeft: 'auto' }} onClick={() => setMetricsFor(null)}>✕</button></div>
            <div className="pm-body">
              <div className="pm-grid">
                <div className="pm-fld"><label>Spend</label><input value={metricsFor.metrics.spend} onChange={(e) => setMetricsFor((p) => ({ ...p, metrics: { ...p.metrics, spend: e.target.value } }))} /></div>
                <div className="pm-fld"><label>Impressions</label><input value={metricsFor.metrics.impressions} onChange={(e) => setMetricsFor((p) => ({ ...p, metrics: { ...p.metrics, impressions: e.target.value } }))} /></div>
              </div>
              <div className="pm-grid" style={{ marginTop: 12 }}>
                <div className="pm-fld"><label>Clicks</label><input value={metricsFor.metrics.clicks} onChange={(e) => setMetricsFor((p) => ({ ...p, metrics: { ...p.metrics, clicks: e.target.value } }))} /></div>
                <div className="pm-fld"><label>Status</label><select value={metricsFor.status} onChange={(e) => setMetricsFor((p) => ({ ...p, status: e.target.value }))}><option value="active">active</option><option value="paused">paused</option><option value="completed">completed</option></select></div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10 }}>Registrations, FTD and revenue are attributed automatically from the UTM code — no manual entry.</div>
            </div>
            <div className="pm-foot"><button className="btn-cancel" onClick={() => setMetricsFor(null)}>Cancel</button><button className="btn-pm-save" onClick={saveMetrics}>💾 Save</button></div>
          </div>
        </div>
      )}
    </>
  );
}
