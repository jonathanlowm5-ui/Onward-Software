import { useEffect, useRef, useState } from 'react';
import { useUI } from '../context/UIContext';
import { uploadImage } from '../services/uploadService';
import { getPageBanners, savePageBanners, getPageHeroes, savePageHeroes, getSocialLinks, saveSocialLinks } from '../services/pageBannerService';

const PAGE_BANNER_LIST = [
  { key: 'jackpots', label: '👑 Jackpots' },
  { key: 'vip', label: '💎 VIP Club' },
  { key: 'referral', label: '🤝 Referral' },
  { key: 'missions', label: '🎯 Mission' },
  { key: 'agent', label: '🧑‍💼 Agent' },
  { key: 'follow', label: '📣 Follow Us' },
];

// Original WEBDESIGN defaults.
const DEFAULT_WD = {
  logo: { text: 'ONWARD', emoji: '⚽', img: '' },
  btnBg: '#f4b223',
  btnTx: '#10131c',
  withdraw: { c1: '#1f4e79', c2: '#0e8a7a' },
  vip: { c1: '#3a2410', c2: '#140d06', ac: '#e8a23d' },
  banners: [
    { name: 'Casino', c1: '#ff5a3c', c2: '#c41e3a', e: '🎰' },
    { name: 'Sport', c1: '#1fa05f', c2: '#0c5c39', e: '⚽' },
    { name: 'Promotions', c1: '#c026d3', c2: '#7c1d8f', e: '🎁' },
    { name: 'Giveaway', c1: '#2563eb', c2: '#1e3a8a', e: '📱' },
    { name: 'Rewards', c1: '#e8a23d', c2: '#b8771e', e: '💵' },
  ],
};

export default function WebDesign() {
  const { toast } = useUI();
  const [wd, setWd] = useState(DEFAULT_WD);
  const [saving, setSaving] = useState(false);

  // Load the saved design (merges over the built-in defaults).
  useEffect(() => {
    import('../services/api').then(({ default: api }) =>
      api.get('/web-design').then((r) => {
        const d = r.data || {};
        if (Object.keys(d).length) {
          setWd((p) => ({
            ...p,
            logo: { ...p.logo, ...(d.logo || {}) },
            btnBg: d.btnBg || p.btnBg,
            btnTx: d.btnTx || p.btnTx,
            withdraw: { ...p.withdraw, ...(d.withdraw || {}) },
            vip: { ...p.vip, ...(d.vip || {}) },
          }));
        }
      }).catch(() => {}));
  }, []);

  const setLogo = (k, v) => setWd((p) => ({ ...p, logo: { ...p.logo, [k]: v } }));
  const [logoUploading, setLogoUploading] = useState(false);
  const uploadLogo = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast('⚠ Logo too large — keep it under 2 MB'); return; }
    setLogoUploading(true);
    try {
      const { url } = await uploadImage(file);
      setWd((p) => ({ ...p, logo: { ...p.logo, img: url } }));
      toast('Logo uploaded ✔ — click Save to publish');
    } catch (err) { toast('⚠ ' + (err.message || 'Upload failed')); }
    finally { setLogoUploading(false); }
  };
  const setField = (k, v) => setWd((p) => ({ ...p, [k]: v }));
  const setWithdraw = (k, v) => setWd((p) => ({ ...p, withdraw: { ...p.withdraw, [k]: v } }));
  const setVip = (k, v) => setWd((p) => ({ ...p, vip: { ...p.vip, [k]: v } }));
  const save = async () => {
    setSaving(true);
    try {
      const { default: api } = await import('../services/api');
      await api.put('/web-design', { logo: wd.logo, btnBg: wd.btnBg, btnTx: wd.btnTx, withdraw: wd.withdraw, vip: wd.vip });
      toast('Website design saved ✔ — live on the player site');
    } catch (e) { toast('⚠ ' + (e.message || 'Save failed')); }
    finally { setSaving(false); }
  };

  // Page hero banners (uploadable, consistent size on the player site).
  const [pageBanners, setPageBanners] = useState({});
  const [pbUploading, setPbUploading] = useState('');
  useEffect(() => { getPageBanners().then((d) => setPageBanners(d || {})).catch(() => {}); }, []);
  const uploadPageBanner = (key) => async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { toast('⚠ Image too large — keep it under 4 MB'); return; }
    setPbUploading(key);
    try {
      const { url } = await uploadImage(file);
      const next = await savePageBanners({ [key]: url });
      setPageBanners(next || {});
      toast('Banner uploaded ✔ — live on the page');
    } catch (err) { toast('⚠ ' + (err.message || 'Upload failed')); }
    finally { setPbUploading(''); }
  };
  const clearPageBanner = async (key) => {
    try { const next = await savePageBanners({ [key]: '' }); setPageBanners(next || {}); toast('Banner removed'); }
    catch (err) { toast('⚠ ' + (err.message || 'Failed')); }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="hero-h">🎨 Website Design</h1>
          <div className="hero-sub">Customize the player-facing front-end look — logo, colors, cards &amp; banners.</div>
        </div>
        <button className="btn-pm-save" onClick={save} disabled={saving}>{saving ? 'Saving…' : '💾 Save Design'}</button>
      </div>

      {/* Floating save — this page is long; keep the button always reachable */}
      <button
        className="btn-pm-save"
        onClick={save}
        disabled={saving}
        style={{ position: 'fixed', right: 22, bottom: 22, zIndex: 900, boxShadow: '0 10px 30px rgba(0,0,0,.5)', padding: '13px 22px' }}
      >{saving ? 'Saving…' : '💾 Save Design'}</button>

      {/* Page hero banners — uploadable, one consistent size */}
      <div className="card" style={{ marginBottom: 'var(--pad)' }}>
        <div className="card-title">🖼 Page Hero Banners</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>Upload a banner for each page — all render at the same size (recommended <b style={{ color: 'var(--text)' }}>1200 × 320 px</b>, 16:9-ish wide, under 4 MB). Leave empty to keep the built-in hero.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
          {PAGE_BANNER_LIST.map((p) => (
            <div key={p.key} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>{p.label}</div>
              <div style={{ width: '100%', aspectRatio: '1200 / 320', borderRadius: 8, overflow: 'hidden', background: 'var(--panel-3,#1b2541)', border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                {pageBanners[p.key]
                  ? <img src={pageBanners[p.key]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 12, color: 'var(--muted)' }}>No banner — built-in hero</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <input type="file" accept="image/*" onChange={uploadPageBanner(p.key)} />
                {pbUploading === p.key && <span style={{ color: 'var(--gold)' }}>…</span>}
                {pageBanners[p.key] && <button className="del-btn" onClick={() => clearPageBanner(p.key)}>🗑</button>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <PageHeroTextCard />

      <SocialLinksCard />

      {/* Welcome Bonus card background — wide banner behind the 4 tier cards */}
      <div className="card" style={{ marginBottom: 'var(--pad)' }}>
        <div className="card-title">🎁 Welcome Bonus Card Background</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
          Background photo behind the Welcome Bonus card on the Promotions page (the wide banner with the 4 tiers).
          Recommended <b style={{ color: 'var(--text)' }}>1400 × 280 px</b> (wide ~5:1, under 4 MB). It's cover-fitted, so it scales to the card.
          Leave empty to keep the default blue gradient.
        </div>
        <div style={{ maxWidth: 560 }}>
          <div style={{ width: '100%', aspectRatio: '1400 / 280', borderRadius: 10, overflow: 'hidden', background: 'var(--panel-3,#1b2541)', border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            {pageBanners.welcomeCard
              ? <img src={pageBanners.welcomeCard} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 12, color: 'var(--muted)' }}>No image — default blue gradient</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <input type="file" accept="image/*" onChange={uploadPageBanner('welcomeCard')} />
            {pbUploading === 'welcomeCard' && <span style={{ color: 'var(--gold)' }}>…</span>}
            {pageBanners.welcomeCard && <button className="del-btn" onClick={() => clearPageBanner('welcomeCard')}>🗑 Remove</button>}
          </div>
        </div>
      </div>

      {/* Promocode bar background — the "Have a Special Promocode?" bar */}
      <div className="card" style={{ marginBottom: 'var(--pad)' }}>
        <div className="card-title">🎟️ Promocode Bar Background</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
          Background photo for the "Have a Special Promocode?" bar at the top of the Promotions page.
          Recommended <b style={{ color: 'var(--text)' }}>1200 × 140 px</b> (wide ~8.5:1, under 4 MB). Cover-fitted with a dark overlay so the text stays readable.
          Leave empty to keep the default surface colour.
        </div>
        <div style={{ maxWidth: 560 }}>
          <div style={{ width: '100%', aspectRatio: '1200 / 140', borderRadius: 10, overflow: 'hidden', background: 'var(--panel-3,#1b2541)', border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            {pageBanners.promoCodeBar
              ? <img src={pageBanners.promoCodeBar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 12, color: 'var(--muted)' }}>No image — default surface colour</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <input type="file" accept="image/*" onChange={uploadPageBanner('promoCodeBar')} />
            {pbUploading === 'promoCodeBar' && <span style={{ color: 'var(--gold)' }}>…</span>}
            {pageBanners.promoCodeBar && <button className="del-btn" onClick={() => clearPageBanner('promoCodeBar')}>🗑 Remove</button>}
          </div>
        </div>
      </div>

      <div className="wd-grid">
        <div className="wd-card">
          <h3>🧩 Side Panel Logo</h3>
          <div className="wd-d">The logo shown at the top of the player site sidebar.</div>

          <div className="wd-fld">
            <label>Logo Image (upload)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ width: 132, height: 44, borderRadius: 8, border: '1px dashed var(--border)', background: 'rgba(255,255,255,.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {wd.logo.img
                  ? <img src={wd.logo.img} alt="logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  : <span style={{ color: 'var(--muted)', fontSize: 11 }}>No image</span>}
              </div>
              <label className="mini-btn" style={{ cursor: 'pointer' }}>
                {logoUploading ? 'Uploading…' : (wd.logo.img ? 'Replace' : '⬆ Upload logo')}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadLogo} disabled={logoUploading} />
              </label>
              {wd.logo.img && <button type="button" className="mini-btn" onClick={() => setLogo('img', '')} style={{ color: 'var(--red,#ff4d5e)' }}>Remove</button>}
            </div>
            <div className="wd-d" style={{ marginTop: 6 }}>Recommended: a wide PNG with transparent background, ~264 × 88 px (renders ~132 × 44). When set, it replaces the emoji + text below.</div>
          </div>

          <div className="wd-fld"><label>Logo Text {wd.logo.img && <span style={{ color: 'var(--muted)', fontWeight: 600 }}>(fallback when no image)</span>}</label><input className="wd-txt" value={wd.logo.text} onChange={(e) => setLogo('text', e.target.value)} /></div>
          <div className="wd-fld"><label>Logo Icon (emoji or symbol)</label><input className="wd-txt" value={wd.logo.emoji} onChange={(e) => setLogo('emoji', e.target.value)} /></div>
          <div className="wd-prev-label">Preview</div>
          <div className="wd-logo-prev">
            {wd.logo.img
              ? <img src={wd.logo.img} alt="logo" style={{ maxHeight: 34, maxWidth: 150, objectFit: 'contain' }} />
              : <><span className="wd-logo-emoji">{wd.logo.emoji}</span><span className="wd-logo-text">{wd.logo.text}</span></>}
            <span className="wd-logo-chip">CASINO</span>
          </div>
        </div>

        <div className="wd-card">
          <h3>🎨 Button Color</h3>
          <div className="wd-d">Primary call-to-action button on the front-end.</div>
          <div className="wd-row"><label>Button Background</label><div className="wd-col"><span className="hex">{wd.btnBg.toUpperCase()}</span><input type="color" value={wd.btnBg} onChange={(e) => setField('btnBg', e.target.value)} /></div></div>
          <div className="wd-row"><label>Button Text</label><div className="wd-col"><span className="hex">{wd.btnTx.toUpperCase()}</span><input type="color" value={wd.btnTx} onChange={(e) => setField('btnTx', e.target.value)} /></div></div>
          <div className="wd-prev-label">Preview</div>
          <button className="wd-btn-prev" style={{ background: wd.btnBg, color: wd.btnTx }}>Deposit Now</button>
        </div>

        <div className="wd-card">
          <h3>💳 Withdrawal Card</h3>
          <div className="wd-d">Gradient — or upload a background image — for the player's saved card / withdrawal screen.</div>
          <div className="wd-row"><label>Gradient Start</label><div className="wd-col"><span className="hex">{wd.withdraw.c1.toUpperCase()}</span><input type="color" value={wd.withdraw.c1} onChange={(e) => setWithdraw('c1', e.target.value)} /></div></div>
          <div className="wd-row"><label>Gradient End</label><div className="wd-col"><span className="hex">{wd.withdraw.c2.toUpperCase()}</span><input type="color" value={wd.withdraw.c2} onChange={(e) => setWithdraw('c2', e.target.value)} /></div></div>
          <div className="wd-fld" style={{ margin: '6px 0' }}>
            <label>3 Card Styles <span style={{ color: 'var(--gold)', fontWeight: 700 }}>· 1000 × 630 px each (bank-card ratio) — players choose one</span></label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {[{ n: 1, c: '#1f4e79,#0e8a7a' }, { n: 2, c: '#5b2a86,#2d1b69' }, { n: 3, c: '#1fa05f,#0c5c39' }].map(({ n, c }) => {
                const k = 'withdrawCard' + n;
                return (
                  <div key={k} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 8 }}>
                    <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 6 }}>Style {n}</div>
                    <div style={{ width: '100%', aspectRatio: '1.586', borderRadius: 10, overflow: 'hidden', marginBottom: 6, background: pageBanners[k] ? undefined : `linear-gradient(135deg,${c})` }}>
                      {pageBanners[k] && <img src={pageBanners[k]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <input type="file" accept="image/*" onChange={uploadPageBanner(k)} style={{ maxWidth: 112, fontSize: 11 }} />
                      {pbUploading === k && <span style={{ color: 'var(--gold)' }}>…</span>}
                      {pageBanners[k] && <button className="del-btn" onClick={() => clearPageBanner(k)}>🗑</button>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>Players pick one of these 3 styles on the withdrawal card. Leave a style empty to use its default colour; text stays overlaid.</div>
          </div>
          <div className="wd-prev-label">Preview (Style 1) — real player-site card size</div>
          <div className="wd-cardp" style={{
            maxWidth: 420, aspectRatio: '1.586 / 1', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            ...(pageBanners.withdrawCard1
              ? { background: `linear-gradient(rgba(6,12,26,.3),rgba(6,12,26,.45)), url(${pageBanners.withdrawCard1}) center/cover` }
              : { background: 'linear-gradient(135deg,#1f4e79,#0e8a7a)' }),
          }}>
            <div className="ttl">Your credit card</div><div className="lbl">Enter number</div>
            <div className="num">0000 0000 0000 0000</div>
            <div className="brands"><span>VISA</span><span className="mc"><i></i><i></i></span></div>
          </div>
        </div>

        <div className="wd-card">
          <h3>👑 VIP Background</h3>
          <div className="wd-d">Background of the VIP level card on the front-end.</div>
          <div className="wd-row"><label>Gradient Start</label><div className="wd-col"><span className="hex">{wd.vip.c1.toUpperCase()}</span><input type="color" value={wd.vip.c1} onChange={(e) => setVip('c1', e.target.value)} /></div></div>
          <div className="wd-row"><label>Gradient End</label><div className="wd-col"><span className="hex">{wd.vip.c2.toUpperCase()}</span><input type="color" value={wd.vip.c2} onChange={(e) => setVip('c2', e.target.value)} /></div></div>
          <div className="wd-row"><label>Accent Color</label><div className="wd-col"><span className="hex">{wd.vip.ac.toUpperCase()}</span><input type="color" value={wd.vip.ac} onChange={(e) => setVip('ac', e.target.value)} /></div></div>
          <div className="wd-fld" style={{ margin: '8px 0' }}>
            <label>Per-Tier Backgrounds <span style={{ color: 'var(--gold)', fontWeight: 700 }}>· 1000 × 240 px each</span></label>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>Upload a different background for each VIP level (1–10). Optional — overrides the gradient for that tier; text stays overlaid.</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 10 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
                const k = 'vip' + n;
                return (
                  <div key={k} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 8 }}>
                    <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 6 }}>VIP {n}</div>
                    <div style={{ width: '100%', aspectRatio: '1000 / 240', borderRadius: 6, overflow: 'hidden', background: 'var(--panel-3,#1b2541)', border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                      {pageBanners[k] ? <img src={pageBanners[k]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 10, color: 'var(--muted)' }}>gradient</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <input type="file" accept="image/*" onChange={uploadPageBanner(k)} style={{ maxWidth: 112, fontSize: 11 }} />
                      {pbUploading === k && <span style={{ color: 'var(--gold)' }}>…</span>}
                      {pageBanners[k] && <button className="del-btn" onClick={() => clearPageBanner(k)}>🗑</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="wd-prev-label">Preview (VIP 1)</div>
          <div className="wd-vipp" style={pageBanners.vip1 ? { background: `linear-gradient(rgba(8,6,2,.45),rgba(8,6,2,.6)), url(${pageBanners.vip1}) center/cover`, '--wd-vac': wd.vip.ac } : { background: `linear-gradient(135deg,${wd.vip.c1},${wd.vip.c2})`, '--wd-vac': wd.vip.ac }}>
            <span className="cur">Current Level</span><div className="lv">VIP 1</div>
            <div className="vrow">Deposit — PHP 1,000 / 1,600</div><div className="bar"><i style={{ width: '62%' }}></i></div>
            <div className="vrow">VIP Points — 404 / 4,000</div><div className="bar"><i style={{ width: '10%' }}></i></div>
            <div className="hex">★</div>
          </div>
        </div>
      </div>

      <TopBannerButtonsCard />
    </>
  );
}

// Editable hero TEXT (eyebrow / title / description) for the content pages —
// like a promo's title/description, but for the page headers (Jackpots, VIP…).
const HERO_TEXT_PAGES = [
  { key: 'jackpots', label: '👑 Jackpots' },
  { key: 'vip', label: '💎 VIP Club' },
  { key: 'referral', label: '🤝 Referral' },
  { key: 'missions', label: '🎯 Mission' },
];
function PageHeroTextCard() {
  const { toast } = useUI();
  const [heroes, setHeroes] = useState({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { getPageHeroes().then((d) => setHeroes(d || {})).catch(() => {}); }, []);
  const setField = (key, field, val) => setHeroes((p) => ({ ...p, [key]: { ...(p[key] || {}), [field]: val } }));
  const save = async () => {
    setBusy(true);
    try { const saved = await savePageHeroes(heroes); setHeroes(saved || heroes); toast('Page hero text saved ✔'); }
    catch (e) { toast('⚠ Save failed: ' + (e.message || 'error')); }
    finally { setBusy(false); }
  };
  const inp = { width: '100%', padding: '9px 12px', borderRadius: 8, background: 'var(--bg3,#0b1224)', color: 'var(--text,#fff)', border: '1px solid var(--border,#243049)', fontFamily: 'inherit', fontSize: 14 };
  return (
    <div className="card" style={{ marginBottom: 'var(--pad)' }}>
      <div className="card-title">✏️ Page Hero Text</div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>Edit the eyebrow / title / description shown on each page header (when no hero banner image is uploaded). Leave a field empty to keep the built-in default.</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
        {HERO_TEXT_PAGES.map((p) => {
          const h = heroes[p.key] || {};
          return (
            <div key={p.key} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontWeight: 800 }}>{p.label}</div>
              <input style={inp} value={h.eyebrow || ''} onChange={(e) => setField(p.key, 'eyebrow', e.target.value)} placeholder="Eyebrow (e.g. EXCLUSIVE)" />
              <input style={inp} value={h.title || ''} onChange={(e) => setField(p.key, 'title', e.target.value)} placeholder="Title (e.g. Onward Jackpots)" />
              <textarea style={{ ...inp, resize: 'vertical', minHeight: 64, lineHeight: 1.5 }} value={h.desc || ''} onChange={(e) => setField(p.key, 'desc', e.target.value)} placeholder="Description…" />
            </div>
          );
        })}
      </div>
      <button className="gss-savebtn" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save Hero Text'}</button>
    </div>
  );
}

// Official social-media links for the footer "Follow Us" row.
const SOCIAL_FIELDS = [
  { key: 'facebook', label: '📘 Facebook', ph: 'https://facebook.com/yourpage' },
  { key: 'telegram', label: '✈️ Telegram', ph: 'https://t.me/yourchannel' },
  { key: 'whatsapp', label: '💬 WhatsApp', ph: 'https://wa.me/60123456789' },
  { key: 'instagram', label: '📷 Instagram', ph: 'https://instagram.com/yourpage' },
  { key: 'twitter', label: '🐦 Twitter / X', ph: 'https://twitter.com/yourpage' },
  { key: 'kwai', label: '🎵 Kwai', ph: 'https://kwai.com/@yourpage' },
];
function SocialLinksCard() {
  const { toast } = useUI();
  const [links, setLinks] = useState({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { getSocialLinks().then((d) => setLinks(d || {})).catch(() => {}); }, []);
  const save = async () => {
    setBusy(true);
    try { const saved = await saveSocialLinks(links); setLinks(saved || links); toast('Social links saved ✔'); }
    catch (e) { toast('⚠ Save failed: ' + (e.message || 'error')); }
    finally { setBusy(false); }
  };
  const inp = { width: '100%', padding: '9px 12px', borderRadius: 8, background: 'var(--bg3,#0b1224)', color: 'var(--text,#fff)', border: '1px solid var(--border,#243049)', fontFamily: 'inherit', fontSize: 14 };
  return (
    <div className="card" style={{ marginBottom: 'var(--pad)' }}>
      <div className="card-title">🔗 Social Media Links</div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>Paste the full URL for each account. Only the ones you fill in show in the footer “Follow Us” row on the player site. Leave blank to hide an icon.</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
        {SOCIAL_FIELDS.map((s) => (
          <div key={s.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontWeight: 800, fontSize: 13 }}>{s.label}</label>
            <input style={inp} value={links[s.key] || ''} onChange={(e) => setLinks((p) => ({ ...p, [s.key]: e.target.value }))} placeholder={s.ph} />
          </div>
        ))}
      </div>
      <button className="gss-savebtn" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save Social Links'}</button>
    </div>
  );
}


/*
 * Top Banner Buttons — LIVE editor for the header pills on the player site
 * (/api/top-buttons): label, icon, gradient colours, target URL, on/off per
 * button, plus the bar background colour. Saved buttons apply immediately.
 */
function TopBannerButtonsCard() {
  const { toast } = useUI();
  const [cfg, setCfg] = useState(null);
  const [busy, setBusy] = useState(false);
  const iconInputRef = useRef(null);
  const iconTargetRef = useRef(-1);

  // Upload a custom icon image for one button (replaces the emoji on the site).
  const pickIcon = (i) => { iconTargetRef.current = i; iconInputRef.current?.click(); };
  const onIconFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    const i = iconTargetRef.current;
    if (!file || i < 0) return;
    try {
      const { uploadImage } = await import('../services/uploadService');
      const { url } = await uploadImage(file);
      const next = { ...cfg, buttons: cfg.buttons.map((b, j) => (j === i ? { ...b, iconImg: url } : b)) };
      setCfg(next);
      persist(next, 'Icon uploaded ✔ — live on the player site (refresh it)');
    } catch (err) { toast('⚠ Upload failed: ' + (err.message || '')); }
  };

  useEffect(() => {
    import('../services/api').then(({ default: api }) =>
      api.get('/top-buttons').then((r) => setCfg(r.data)).catch(() => setCfg({ bg: '', buttons: [] })));
  }, []);

  const setBtn = (i, k, v) => setCfg((p) => ({ ...p, buttons: p.buttons.map((b, j) => (j === i ? { ...b, [k]: v } : b)) }));
  const addBtn = () => setCfg((p) => ({ ...p, buttons: [...p.buttons, { id: '', label: 'New Button', icon: '🎯', c1: '#b81a5a', c2: '#7d0d3d', url: '/', enabled: true, badge: false }] }));
  const delBtn = (i) => setCfg((p) => ({ ...p, buttons: p.buttons.filter((_, j) => j !== i) }));
  const move = (i, dir) => setCfg((p) => {
    const arr = [...p.buttons];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return p;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    return { ...p, buttons: arr };
  });

  const persist = async (nextCfg, msg) => {
    setBusy(true);
    try {
      const { default: api } = await import('../services/api');
      const r = await api.put('/top-buttons', nextCfg);
      setCfg(r.data);
      toast(msg || 'Top banner buttons saved ✔ — live on the player site (refresh the site to see it)');
    } catch (e) { toast('⚠ ' + (e.response?.data?.error || e.message || 'Save failed')); }
    finally { setBusy(false); }
  };

  const save = () => persist(cfg);

  // Show/hide switches apply immediately — no separate save needed.
  const toggleEnabled = (i, v) => {
    const next = { ...cfg, buttons: cfg.buttons.map((b, j) => (j === i ? { ...b, enabled: v } : b)) };
    setCfg(next);
    persist(next, v ? 'Button shown ✔ — live on the player site (refresh it)' : 'Button hidden ✔ — live on the player site (refresh it)');
  };

  // Restore the built-in default set (Promotions + Giveaway on; Casino,
  // Sport, Rewards ready to switch on). The backend treats an empty list as
  // "use defaults".
  const resetDefaults = () => {
    if (!window.confirm('Replace the current buttons with the default set (Promotions + Giveaway)?')) return;
    persist({ buttons: [], bg: '' }, 'Top banner reset to defaults ↺ — live on the player site');
  };

  if (!cfg) return <div className="wd-card" style={{ marginTop: 16 }}><h3>🏟️ Top Banner Buttons</h3><div className="wd-d">Loading…</div></div>;
  const inp = { padding: '7px 10px', borderRadius: 8, background: 'var(--bg3,#0b1224)', color: 'var(--text,#fff)', border: '1px solid var(--border,#243049)', fontFamily: 'inherit', fontSize: 13 };

  return (
    <div className="wd-card" style={{ marginTop: 16 }}>
      <input ref={iconInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onIconFile} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <h3 style={{ marginBottom: 0 }}>🏟️ Top Banner Buttons</h3>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="mini-btn" onClick={resetDefaults} disabled={busy}>↺ Reset to default</button>
          <button className="mini-btn" onClick={addBtn}>＋ Add button</button>
          <button className="btn-search" onClick={save} disabled={busy}>{busy ? 'Saving…' : '💾 Save'}</button>
        </span>
      </div>
      <div className="wd-d">The category buttons across the top of the player site. Toggle which show, set colours, icon and where each one sends the customer (internal route like /promotions or a full https:// URL).</div>
      <div className="wd-d" style={{ color: 'var(--gold)', marginTop: 2 }}>
        🖼️ Icon uploads: square <b>PNG with transparent background</b>, <b>96 × 96 px</b> recommended (64–128 px works — it renders at 20 × 20 in the pill), keep it under <b>100 KB</b>.
      </div>

      <div className="wd-row" style={{ marginBottom: 10 }}>
        <label>Bar background</label>
        <div className="wd-col">
          <span className="hex">{(cfg.bg || 'default').toUpperCase()}</span>
          <input type="color" value={cfg.bg || '#0c1120'} onChange={(e) => setCfg((p) => ({ ...p, bg: e.target.value }))} />
          {cfg.bg && <button className="del-btn" onClick={() => setCfg((p) => ({ ...p, bg: '' }))}>Reset</button>}
        </div>
      </div>

      {cfg.buttons.map((b, i) => (
        <div key={b.id || i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', opacity: b.enabled === false ? 0.55 : 1 }}>
          <label className="switch" title="Show on the player site (applies immediately)"><input type="checkbox" checked={b.enabled !== false} onChange={(e) => toggleEnabled(i, e.target.checked)} /><span className="slider"></span></label>
          <span style={{ position: 'relative', display: 'inline-flex' }}>
            <button
              onClick={() => pickIcon(i)}
              title="Click to upload an icon (PNG/JPG/WebP)"
              style={{ width: 42, height: 36, borderRadius: 8, border: '1px dashed var(--border,#243049)', background: 'rgba(0,0,0,.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 2 }}
            >
              {b.iconImg
                ? <img src={b.iconImg} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                : <span style={{ fontSize: 16 }}>{b.icon || '⬆'}</span>}
            </button>
            {b.iconImg && (
              <button
                title="Remove image"
                onClick={() => { const next = { ...cfg, buttons: cfg.buttons.map((x, j) => (j === i ? { ...x, iconImg: '' } : x)) }; setCfg(next); persist(next, 'Icon image removed'); }}
                style={{ position: 'absolute', top: -6, right: -6, width: 16, height: 16, borderRadius: '50%', border: 'none', background: '#e8506a', color: '#fff', fontSize: 9, lineHeight: 1, cursor: 'pointer', padding: 0 }}
              >✕</button>
            )}
          </span>
          <input style={{ ...inp, width: 140 }} value={b.label} onChange={(e) => setBtn(i, 'label', e.target.value)} placeholder="Label" />
          <div className="wd-col"><span className="hex">Start</span><input type="color" value={b.c1} onChange={(e) => setBtn(i, 'c1', e.target.value)} /></div>
          <div className="wd-col"><span className="hex">End</span><input type="color" value={b.c2} onChange={(e) => setBtn(i, 'c2', e.target.value)} /></div>
          <input style={{ ...inp, flex: 1, minWidth: 180 }} value={b.url} onChange={(e) => setBtn(i, 'url', e.target.value)} placeholder="/promotions or https://…" title="Where the button sends the customer" />
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--muted)' }} title="Show the live promotions count badge">
            <input type="checkbox" checked={!!b.badge} onChange={(e) => setBtn(i, 'badge', e.target.checked)} /> badge
          </label>
          <span style={{ display: 'flex', gap: 4 }}>
            <button className="mini-btn" onClick={() => move(i, -1)} title="Move left">←</button>
            <button className="mini-btn" onClick={() => move(i, 1)} title="Move right">→</button>
            <button className="del-btn" onClick={() => delBtn(i)}>🗑</button>
          </span>
        </div>
      ))}

      <div className="wd-prev-label">Preview (enabled buttons only)</div>
      <div className="wd-banners" style={cfg.bg ? { background: cfg.bg, padding: 10, borderRadius: 10 } : undefined}>
        {cfg.buttons.filter((b) => b.enabled !== false).map((b, i) => (
          <div className="wd-pill" key={i} style={{ background: `linear-gradient(110deg,${b.c1},${b.c2})` }}>
            {b.iconImg
              ? <img src={b.iconImg} alt="" style={{ width: 18, height: 18, objectFit: 'contain', marginRight: 6, verticalAlign: 'middle' }} />
              : <span className="pe">{b.icon}</span>}{b.label}
          </div>
        ))}
      </div>
    </div>
  );
}
