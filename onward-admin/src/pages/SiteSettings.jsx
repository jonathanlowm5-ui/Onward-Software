import { useEffect, useState } from 'react';
import { useUI } from '../context/UIContext';
import { getSettings, updateSettings } from '../services/cmsService';
import { getGeoBlock, saveGeoBlock } from '../services/playerService';

// Self-contained country / IP restriction panel. Blocks registration AND login
// from the listed countries (ISO 3166 alpha-2 codes, e.g. US, GB, CN).
function GeoBlockCard() {
  const { toast } = useUI();
  const [enabled, setEnabled] = useState(false);
  const [countries, setCountries] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    getGeoBlock()
      .then((d) => { if (!alive) return; setEnabled(!!d.enabled); setCountries(Array.isArray(d.countries) ? d.countries : []); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const persist = async (nextEnabled, nextCountries) => {
    setBusy(true);
    try {
      const saved = await saveGeoBlock(nextEnabled, nextCountries);
      setEnabled(!!saved.enabled);
      setCountries(Array.isArray(saved.countries) ? saved.countries : []);
      toast('Country restrictions saved ✔');
    } catch (e) {
      toast('⚠ Save failed: ' + (e.message || 'error'));
    } finally { setBusy(false); }
  };

  const addCodes = () => {
    const codes = input.toUpperCase().split(/[\s,]+/).map((c) => c.trim().slice(0, 2)).filter((c) => /^[A-Z]{2}$/.test(c));
    if (!codes.length) { toast('Enter 2-letter country codes, e.g. US, GB, CN'); return; }
    const next = [...new Set([...countries, ...codes])];
    setInput('');
    persist(enabled, next);
  };
  const removeCode = (c) => persist(enabled, countries.filter((x) => x !== c));
  const toggle = () => persist(!enabled, countries);

  return (
    <div className="set-card" style={{ marginTop: 16 }}>
      <div className="ch">🚫 Country / IP Restrictions</div>
      <div className="desc">Block registration and login from specific countries (detected by IP). Use ISO 2-letter codes — e.g. <b>US</b>, <b>GB</b>, <b>CN</b>, <b>SG</b>.</div>
      <div className="gss-sec-tog" style={{ margin: '8px 0' }}>
        <label className="switch"><input type="checkbox" checked={enabled} disabled={busy} onChange={toggle} /><span className="slider"></span></label>
        {enabled ? 'Country blocking ENABLED' : 'Country blocking disabled'}
      </div>
      <div style={{ display: 'flex', gap: 8, margin: '8px 0' }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="US, GB, CN…"
          onKeyDown={(e) => { if (e.key === 'Enter') addCodes(); }}
          style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border,#1e2d47)', background: 'var(--bg3,#0b1224)', color: 'var(--text,#fff)' }} />
        <button className="gss-savebtn" style={{ margin: 0 }} disabled={busy} onClick={addCodes}>Add</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
        {countries.length === 0 && <span style={{ color: 'var(--muted,#8898b8)', fontSize: 13 }}>No countries blocked.</span>}
        {countries.map((c) => (
          <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: 'rgba(255,102,117,.12)', border: '1px solid rgba(255,102,117,.35)', color: '#ff9aa6', fontSize: 13, fontWeight: 700 }}>
            {c}<button onClick={() => removeCode(c)} disabled={busy} style={{ background: 'none', border: 'none', color: '#ff9aa6', cursor: 'pointer', fontWeight: 900 }}>✕</button>
          </span>
        ))}
      </div>
    </div>
  );
}

// Original static defaults — used as offline fallback.
const DEFAULT_CFG = { online: true, name: 'Onward Gaming', url: 'https://onward.com', currency: 'PHP', minDep: 100, minWd: 500, maxWdDay: 50000 };
const DEFAULT_SEC = { force2fa: true, kycWd: true, maint: false, regOpen: true };
const DEFAULT_FEATURES = [
  { k: 'games', em: '🎰', name: 'Games', on: true }, { k: 'deposits', em: '💳', name: 'Deposits', on: true },
  { k: 'withdrawals', em: '💸', name: 'Withdrawals', on: true }, { k: 'registrations', em: '📝', name: 'Registrations', on: true },
  { k: 'bonuses', em: '🎁', name: 'Bonuses', on: true }, { k: 'sports', em: '🌐', name: 'Sports', on: true },
  { k: 'affiliates', em: '🤝', name: 'Affiliates', on: true }, { k: 'livechat', em: '💬', name: 'Live Chat', on: true },
  { k: 'slots', em: '🎰', name: 'Slots', on: true }, { k: 'livecasino', em: '🃏', name: 'Live Casino', on: true },
  { k: 'sportsbet', em: '🏀', name: 'Sports Betting', on: true }, { k: 'fish', em: '🐠', name: 'Fish Games', on: true },
  { k: 'crash', em: '💥', name: 'Crash Games', on: true },
];

const CURRENCIES = [
  ['PHP', 'PHP – Philippine Peso'], ['CNY', 'CNY – Chinese Yuan'], ['VND', 'VND – Vietnamese Dong'],
  ['USD', 'USD – US Dollar'], ['BRL', 'BRL – Brazilian Real'],
];
const SEC_LABELS = { force2fa: 'Force 2FA', kycWd: 'KYC requirement', maint: 'Maintenance mode', regOpen: 'New registrations' };

export default function SiteSettings() {
  const { toast } = useUI();
  const [cfg, setCfg] = useState(DEFAULT_CFG);
  const [sec, setSec] = useState(DEFAULT_SEC);
  const [features, setFeatures] = useState(DEFAULT_FEATURES);
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const s = await getSettings();
        if (alive && s && typeof s === 'object') {
          if (s.site) setCfg((p) => ({ ...p, ...s.site }));
          if (s.security) setSec((p) => ({ ...p, ...s.security }));
          if (Array.isArray(s.features) && s.features.length) {
            setFeatures(DEFAULT_FEATURES.map((f) => {
              const m = s.features.find((x) => x.k === f.k);
              return m ? { ...f, on: !!m.on } : f;
            }));
          }
        }
      } catch {
        if (alive) { setCfg(DEFAULT_CFG); setSec(DEFAULT_SEC); setFeatures(DEFAULT_FEATURES); }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const persist = async (patch) => { try { await updateSettings(patch); } catch { /* offline demo */ } };

  const setCfgField = (k, v) => setCfg((p) => ({ ...p, [k]: v }));

  const masterToggle = () => {
    setCfg((p) => {
      const online = !p.online;
      toast(online ? 'Site is now ONLINE 🟢 players can access normally' : '⚠ Site set OFFLINE 🔴 — platform now in maintenance mode');
      persist({ site: { ...p, online } });
      return { ...p, online };
    });
  };

  const cfgSave = () => {
    if (cfg.url && !/^https?:\/\//i.test(cfg.url)) { toast('⚠ Site URL must start with http(s)://'); return; }
    if (Number(cfg.minWd) < Number(cfg.minDep)) { toast('⚠ Min withdrawal is below min deposit — double-check values'); }
    persist({ site: cfg });
    toast('Site configuration saved ✅ ' + cfg.name + ' · ' + cfg.currency + ' · min dep ₱' + cfg.minDep);
  };

  const secToggle = (k) => {
    setSec((p) => {
      const next = { ...p, [k]: !p[k] };
      toast(SEC_LABELS[k] + (next[k] ? ' enabled ✅' : ' disabled ⚫'));
      persist({ security: next });
      return next;
    });
  };

  const featToggle = (i) => {
    setFeatures((p) => {
      const next = p.map((f, idx) => (idx === i ? { ...f, on: !f.on } : f));
      const f = next[i];
      toast(f.em + ' ' + f.name + (f.on ? ' enabled ✅ — live for players' : ' disabled ⚫ — hidden from players'));
      persist({ features: next });
      return next;
    });
  };

  return (
    <>
      <div className="gss-banner">
        <span className="ic">🌐</span>
        <div><div className="tt">Global Site Switch</div><div className="sb">Master on/off for the entire platform. Turning this off puts the site into maintenance mode immediately.</div></div>
        <div className="gss-status">
          <span className="stt" style={{ color: cfg.online ? 'var(--green)' : 'var(--red)' }}>{cfg.online ? '🟢 ONLINE' : '🔴 OFFLINE'}</span>
          <label className="switch"><input type="checkbox" checked={cfg.online} onChange={masterToggle} /><span className="slider"></span></label>
        </div>
      </div>

      <div className="gss-2col">
        <div>
          <div className="set-card" style={{ marginBottom: 16 }}>
            <div className="ch">🌐 Site Configuration</div>
            <div className="gss-set-fld"><label>Site Name</label><input value={cfg.name} onChange={(e) => setCfgField('name', e.target.value)} /></div>
            <div className="gss-set-fld"><label>Site URL</label><input value={cfg.url} onChange={(e) => setCfgField('url', e.target.value)} /></div>
            <div className="gss-set-fld"><label>Default Currency</label>
              <select value={cfg.currency} onChange={(e) => setCfgField('currency', e.target.value)}>
                {CURRENCIES.map((c) => <option key={c[0]} value={c[0]}>{c[1]}</option>)}
              </select>
            </div>
            <div className="gss-set-fld"><label>Min Deposit (₱)</label><input value={cfg.minDep} inputMode="numeric" onChange={(e) => setCfgField('minDep', e.target.value)} /></div>
            <div className="gss-set-fld"><label>Min Withdrawal (₱)</label><input value={cfg.minWd} inputMode="numeric" onChange={(e) => setCfgField('minWd', e.target.value)} /></div>
            <button className="gss-savebtn" onClick={cfgSave}>Save Changes</button>
          </div>
          <div className="set-card">
            <div className="ch">🔒 Security</div>
            <div className="gss-sec-tog"><label className="switch"><input type="checkbox" checked={sec.force2fa} onChange={() => secToggle('force2fa')} /><span className="slider"></span></label> Force 2FA for withdrawals</div>
            <div className="gss-sec-tog"><label className="switch"><input type="checkbox" checked={sec.kycWd} onChange={() => secToggle('kycWd')} /><span className="slider"></span></label> KYC required for withdrawal</div>
            <div className="gss-sec-tog"><label className="switch"><input type="checkbox" checked={sec.maint} onChange={() => secToggle('maint')} /><span className="slider"></span></label> Maintenance mode</div>
            <div className="gss-sec-tog"><label className="switch"><input type="checkbox" checked={sec.regOpen} onChange={() => secToggle('regOpen')} /><span className="slider"></span></label> New registrations open</div>
            <div className="gss-set-fld" style={{ margin: '6px 0 0' }}><label>Max Withdrawal / Day (₱)</label><input value={cfg.maxWdDay} inputMode="numeric" onChange={(e) => setCfgField('maxWdDay', e.target.value)} /></div>
          </div>
          <GeoBlockCard />
        </div>
        <div className="set-card gss-feat">
          <div className="ch">🌐 Global Site Switch</div>
          <div className="desc">Control the master switch and all sub-feature toggles for the entire platform. Each switch affects live players immediately.</div>
          <div className="gss-toglist">
            {features.map((f, i) => (
              <div className="gss-tog" key={f.k}>
                <label className="switch"><input type="checkbox" checked={f.on} onChange={() => featToggle(i)} /><span className="slider"></span></label>
                <span className="em">{f.em}</span>{f.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
