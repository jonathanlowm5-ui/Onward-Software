import { useState } from 'react';
import { useUI } from '../context/UIContext';

const SOCIAL = [
  { k: 'facebook', name: 'Facebook', ic: '📘', bg: 'rgba(58,120,255,.18)', ph: 'https://facebook.com/yourpage', np: 'e.g. OnwardOfficial', url: '', disp: '', active: true },
  { k: 'telegram', name: 'Telegram', ic: '✈️', bg: 'rgba(58,160,255,.16)', ph: 'https://t.me/yourgroup', np: 'e.g. OnwardChannel', url: '', disp: '', active: true },
  { k: 'whatsapp', name: 'WhatsApp', ic: '💬', bg: 'rgba(46,204,113,.16)', ph: 'https://wa.me/639XXXXXXXX', np: 'e.g. Onward Support', url: '', disp: '', active: true },
  { k: 'instagram', name: 'Instagram', ic: '📷', bg: 'rgba(214,73,150,.18)', ph: 'https://instagram.com/yourpage', np: 'e.g. @OnwardOfficial', url: '', disp: '', active: true },
  { k: 'tiktok', name: 'TikTok', ic: '🎵', bg: 'rgba(155,48,217,.16)', ph: 'https://tiktok.com/@yourpage', np: 'e.g. @OnwardGaming', url: '', disp: '', active: true },
  { k: 'youtube', name: 'YouTube', ic: '▶️', bg: 'rgba(255,77,94,.16)', ph: 'https://youtube.com/@yourchannel', np: 'e.g. Onward Gaming', url: '', disp: '', active: true },
  { k: 'twitter', name: 'Twitter / X', ic: '𝕏', bg: 'rgba(120,140,170,.18)', ph: 'https://x.com/yourhandle', np: 'e.g. @OnwardPH', url: '', disp: '', active: true },
];

export default function PageLinks() {
  const { toast } = useUI();
  const [social, setSocial] = useState(SOCIAL);

  const setField = (i, field, value) => {
    setSocial((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  };

  const saveAll = () => {
    const filled = social.filter((s) => s.url.trim() !== '').length;
    const bad = social.find((s) => s.url.trim() !== '' && !/^https?:\/\//i.test(s.url));
    if (bad) { toast('⚠ ' + bad.name + ' URL must start with http:// or https://'); return; }
    const active = social.filter((s) => s.active).length;
    toast('Social links saved ✅ ' + filled + ' platform' + (filled !== 1 ? 's' : '') + ' configured · ' + active + ' active');
  };

  const preview = (i) => {
    const s = social[i];
    const u = s.url;
    if (!u) { toast('⚠ Enter a URL for ' + s.name + ' first'); return; }
    if (!/^https?:\/\//i.test(u)) { toast('⚠ Invalid URL — add http:// or https://'); return; }
    window.open(u, '_blank');
    toast('Opening preview ↗ ' + s.name);
  };

  return (
    <>
      <div className="set-head">
        <div className="grow">
          <h1 className="hero-h">🔗 Social Media Page Links</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>Manage all official social media page URLs displayed to players</div>
        </div>
        <div className="acts"><button className="set-saveall" onClick={saveAll}>💾 Save All</button></div>
      </div>
      <div className="set-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table className="soc-tbl" style={{ minWidth: '920px' }}>
            <thead>
              <tr>
                <th>Platform</th>
                <th>Page / Channel URL</th>
                <th>Display Name</th>
                <th style={{ textAlign: 'center' }}>Active</th>
                <th style={{ textAlign: 'center' }}>Preview</th>
              </tr>
            </thead>
            <tbody>
              {social.map((s, i) => (
                <tr key={s.k}>
                  <td><div className="soc-plat"><span className="soc-ic" style={{ background: s.bg }}>{s.ic}</span>{s.name}</div></td>
                  <td><input value={s.url} onChange={(e) => setField(i, 'url', e.target.value)} placeholder={s.ph} /></td>
                  <td className="soc-name"><input value={s.disp} onChange={(e) => setField(i, 'disp', e.target.value)} placeholder={s.np} /></td>
                  <td style={{ textAlign: 'center' }}><input type="checkbox" className="soc-ck" checked={s.active} onChange={(e) => setField(i, 'active', e.target.checked)} /></td>
                  <td style={{ textAlign: 'center' }}><button className="soc-prev" onClick={() => preview(i)}>↗</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
