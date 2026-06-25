import { useEffect, useState } from 'react';
import { useUI } from '../context/UIContext';
import { uploadImage } from '../services/uploadService';
import { getPageBanners, savePageBanners } from '../services/pageBannerService';

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
  logo: { text: 'ONWARD', emoji: '⚽' },
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

  const setLogo = (k, v) => setWd((p) => ({ ...p, logo: { ...p.logo, [k]: v } }));
  const setField = (k, v) => setWd((p) => ({ ...p, [k]: v }));
  const setWithdraw = (k, v) => setWd((p) => ({ ...p, withdraw: { ...p.withdraw, [k]: v } }));
  const setVip = (k, v) => setWd((p) => ({ ...p, vip: { ...p.vip, [k]: v } }));
  const setBanner = (i, k, v) =>
    setWd((p) => ({ ...p, banners: p.banners.map((b, idx) => (idx === i ? { ...b, [k]: v } : b)) }));

  const save = () => toast('Website design saved ✔ — applied to front-end');

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
        <button className="btn-pm-save" onClick={save}>💾 Save Design</button>
      </div>

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

      <div className="wd-grid">
        <div className="wd-card">
          <h3>🧩 Side Panel Logo</h3>
          <div className="wd-d">The logo shown at the top of the player site sidebar.</div>
          <div className="wd-fld"><label>Logo Text</label><input className="wd-txt" value={wd.logo.text} onChange={(e) => setLogo('text', e.target.value)} /></div>
          <div className="wd-fld"><label>Logo Icon (emoji or symbol)</label><input className="wd-txt" value={wd.logo.emoji} onChange={(e) => setLogo('emoji', e.target.value)} /></div>
          <div className="wd-prev-label">Preview</div>
          <div className="wd-logo-prev"><span className="wd-logo-emoji">{wd.logo.emoji}</span><span className="wd-logo-text">{wd.logo.text}</span><span className="wd-logo-chip">CASINO</span></div>
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
          <div className="wd-d">Gradient of the player's saved card / withdrawal screen.</div>
          <div className="wd-row"><label>Gradient Start</label><div className="wd-col"><span className="hex">{wd.withdraw.c1.toUpperCase()}</span><input type="color" value={wd.withdraw.c1} onChange={(e) => setWithdraw('c1', e.target.value)} /></div></div>
          <div className="wd-row"><label>Gradient End</label><div className="wd-col"><span className="hex">{wd.withdraw.c2.toUpperCase()}</span><input type="color" value={wd.withdraw.c2} onChange={(e) => setWithdraw('c2', e.target.value)} /></div></div>
          <div className="wd-prev-label">Preview</div>
          <div className="wd-cardp" style={{ background: `linear-gradient(135deg,${wd.withdraw.c1},${wd.withdraw.c2})` }}>
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
          <div className="wd-prev-label">Preview</div>
          <div className="wd-vipp" style={{ background: `linear-gradient(135deg,${wd.vip.c1},${wd.vip.c2})`, '--wd-vac': wd.vip.ac }}>
            <span className="cur">Current Level</span><div className="lv">VIP 1</div>
            <div className="vrow">Deposit — PHP 1,000 / 1,600</div><div className="bar"><i style={{ width: '62%' }}></i></div>
            <div className="vrow">VIP Points — 404 / 4,000</div><div className="bar"><i style={{ width: '10%' }}></i></div>
            <div className="hex">★</div>
          </div>
        </div>
      </div>

      <div className="wd-card" style={{ marginTop: 16 }}>
        <h3>🏟️ Top Banner Buttons</h3>
        <div className="wd-d">The category buttons across the top of the front-end (Casino, Sport, etc.).</div>
        {wd.banners.map((b, i) => (
          <div className="wd-ban-row" key={i}>
            <input className="wd-txt" value={b.name} onChange={(e) => setBanner(i, 'name', e.target.value)} />
            <div className="wd-col"><span className="hex">Start</span><input type="color" value={b.c1} onChange={(e) => setBanner(i, 'c1', e.target.value)} /></div>
            <div className="wd-col"><span className="hex">End</span><input type="color" value={b.c2} onChange={(e) => setBanner(i, 'c2', e.target.value)} /></div>
            <span style={{ fontSize: '1.3rem', textAlign: 'center' }}>{b.e}</span>
          </div>
        ))}
        <div className="wd-prev-label">Preview</div>
        <div className="wd-banners">
          {wd.banners.map((b, i) => (
            <div className="wd-pill" key={i} style={{ background: `linear-gradient(135deg,${b.c1},${b.c2})` }}>
              <span className="pe">{b.e}</span>{b.name}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
