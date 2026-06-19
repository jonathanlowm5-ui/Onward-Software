import { useRef, useState } from 'react';
import { useUI } from '../context/UIContext';

const PWA_MODES = ['Download APP', 'PWA (Quick Install)', 'PWA (Priority) + Native APP', 'Native APP (Priority) + PWA'];
const PWA_TRIG = ['Download APP', 'PWA (Quick Install)', 'PWA (Priority) + Native APP', 'Native APP (Priority) + PWA', 'Native APP'];
const PWA_CURS = ['CNY', 'VND', 'BRL', 'BTC', 'USDT'];
const RB_CHANNELS = [['4', 'Facebook'], ['5', 'TikTok'], ['9', 'Kwai'], ['10', 'Google'], ['20', '小步网络'], ['21', 'OKSPIN'], ['22', 'SNAPTUBE'], ['23', 'BIGO'], ['24', 'APPLUCK'], ['34', 'Trafficstars'], ['56', 'MG SKY'], ['58', 'Macan Native'], ['60', 'Propellerads'], ['61', 'MiniTrax']];
const RB_EVENTS = ['CompleteRegistration', 'FirstDeposit', 'Purchase', 'AddToCart', 'AddToWishlist', 'Contact', 'Subscribe'];
const GT_LANGS = ['English', 'Portuguese (Brazil)', 'Spanish', 'Hindi', 'Russian', 'Thai', 'Vietnamese', 'Malay', 'Indonesian', 'German', 'Korean', 'Japanese', 'Bengali', 'Turkish', 'Traditional Chinese', 'Arabic', 'Burmese', 'Khmer', 'French', 'Amharic', 'Swahili', 'Filipino', 'Urdu', 'Nepali', 'Uzbek', 'Sinhala'];

const PWA_TABS = [['settings', 'PWA Settings'], ['blocked', 'PWA Blocked Domains'], ['h5', 'H5 to PWA Conversion'], ['guide', 'Domain Install Guide'], ['google', 'Google Template'], ['site', 'Site Name'], ['roibest', 'ROIBest Ads']];

const initPwas = () => ({
  mode: 'PWA (Priority) + Native APP', trigger: 'Enable', template: 'Main Domain',
  amt: { CNY: 31, VND: 0, BRL: 0, BTC: 0, USDT: 0 }, target: 'User Deposit Page',
  android: 'PWA (Priority) + Native APP', ios: 'Native APP', interval: '1 Hour',
  rwMethod: 'Reminder', rw: { CNY: [100, 10], VND: [0, 0], BRL: [0, 0], BTC: [0, 0], USDT: [0, 0] },
  h5: { on: true, trig: 'On First Visit', delay: 3 },
  site: { name: '', tag: '' },
  guide: { main: '', url: '', banner: true, ns1: 'ns1.onward-cdn.com', ns2: 'ns2.onward-cdn.com' },
});

const initRoibest = () => ({
  enabled: true, appId: '', method: 'Packaged Integration',
  reportUrl: 'https://sdk-report.roibestopenapi.com/report/fb/event',
  queryUrl: 'https://sdk-report.roibestopenapi.com/fbclid/get',
  swUrl: './service-worker.js', swInject: false,
  mgsky: [['purchase', 'EVENT_PURCHASE'], ['pay', 'EVENT_PURCHASE'], ['register', 'EVENT_COMPLETE_REGISTRATION'], ['first_deposit', 'EVENT_FIRST_DEPOSIT']],
});

const GT_DEF = () => ({ tpl: 'PWA Install', name: 'PWA Install', icon: '', app: '', co: '', dl: '', rev: '', age: 'Rated for 18+', sub: '', desc: '', shots: [], tags: [], stars: { 5: 90, 4: 14, 3: 3, 2: 2, 1: 2 }, reviews: [], pop: '', langs: [] });

const DIG_DOMAINS = [
  { dom: 'play-lgx1.com', ip: '104.21.14.88', cdn: 'Cloudflare', ssl: 'Wildcard', exp: '2026-06-01', assign: 'Yes', status: 'active', ns1: 'ns1.onward-cdn.com', ns2: 'ns2.onward-cdn.com', industry: 'Casino' },
  { dom: 'lgx-win.bet', ip: '172.67.182.39', cdn: 'Cloudflare', ssl: "Let's Enc.", exp: '2025-10-14', assign: 'Yes', status: 'active', ns1: 'ns1.onward-cdn.com', ns2: 'ns2.onward-cdn.com', industry: 'Sports' },
  { dom: 'lgx-vip.casino', ip: '192.168.40.11', cdn: 'Self-resolve', ssl: "Let's Enc.", exp: '2025-08-22', assign: 'No', status: 'warning', ns1: '—', ns2: '—', industry: 'Lottery' },
  { dom: 'mirror2.lgx.bet', ip: '104.18.27.60', cdn: 'Cloudflare', ssl: 'Wildcard', exp: '2026-03-30', assign: 'Yes', status: 'active', ns1: 'ns1.onward-cdn.com', ns2: 'ns2.onward-cdn.com', industry: 'Casino' },
  { dom: 'backup.onward.live', ip: '203.0.113.5', cdn: 'Self-resolve', ssl: 'None', exp: '—', assign: 'No', status: 'warning', ns1: '—', ns2: '—', industry: 'Live Casino' },
];
const DIG_DNS = [
  { dom: 'play-lgx1.com', type: 'A', name: '@', val: '104.21.14.88', ttl: 'Auto', prox: 'Yes', stat: 'active' },
  { dom: 'play-lgx1.com', type: 'CNAME', name: 'www', val: 'play-lgx1.com.', ttl: 'Auto', prox: 'Yes', stat: 'active' },
  { dom: 'play-lgx1.com', type: 'TXT', name: '@', val: 'v=spf1 include:onward-cdn.com ~all', ttl: '3600', prox: 'No', stat: 'active' },
  { dom: 'lgx-win.bet', type: 'A', name: '@', val: '172.67.182.39', ttl: 'Auto', prox: 'Yes', stat: 'active' },
  { dom: 'lgx-win.bet', type: 'CNAME', name: 'www', val: 'lgx-win.bet.', ttl: 'Auto', prox: 'Yes', stat: 'active' },
  { dom: 'mirror2.lgx.bet', type: 'A', name: '@', val: '104.18.27.60', ttl: 'Auto', prox: 'Yes', stat: 'active' },
  { dom: 'mirror2.lgx.bet', type: 'CNAME', name: 'cdn', val: 'cdn.onward-cdn.com.', ttl: '300', prox: 'No', stat: 'active' },
  { dom: 'lgx-vip.casino', type: 'A', name: '@', val: '192.168.40.11', ttl: '3600', prox: 'No', stat: 'warn' },
  { dom: 'backup.onward.live', type: 'A', name: '@', val: '203.0.113.5', ttl: '3600', prox: 'No', stat: 'warn' },
];

const PwaSelect = ({ opts, value, onChange, w }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} style={w ? { maxWidth: w } : undefined}>
    {opts.map((o) => <option key={o} value={o}>{o}</option>)}
  </select>
);

export default function Pwa() {
  const { toast } = useUI();
  const [tab, setTab] = useState('settings');
  const [pwas, setPwas] = useState(initPwas);
  const [roibest, setRoibest] = useState(initRoibest);
  const [gt, setGt] = useState(GT_DEF);
  const [domQuery, setDomQuery] = useState('');
  const [domQueryInput, setDomQueryInput] = useState('');
  const [domains, setDomains] = useState([]);
  const [rbOut, setRbOut] = useState(null);
  const [rbTest, setRbTest] = useState({ linkId: '4740128923061846', event: 'CompleteRegistration', cur: 'USD', val: '19.99' });
  const [abdOpen, setAbdOpen] = useState(false);
  const [abdForm, setAbdForm] = useState({ ind: '', assign: 'No', dom: '', em: 'Disable', rm: '' });
  const iconRef = useRef(null);
  const shotRef = useRef(null);
  const [tagInput, setTagInput] = useState('');
  const [rev, setRev] = useState({ n: '', r: '', c: '' });

  const setP = (patch) => setPwas((p) => ({ ...p, ...patch }));
  const setRB = (patch) => setRoibest((p) => ({ ...p, ...patch }));
  const setGT = (patch) => setGt((p) => ({ ...p, ...patch }));

  const gtOverall = () => {
    let n = 0, d = 0;
    for (const s of [1, 2, 3, 4, 5]) { n += s * gt.stars[s]; d += gt.stars[s]; }
    return d ? (n / d).toFixed(1) : '0.0';
  };

  /* ---- save handlers ---- */
  const pwaSave = () => toast('PWA settings saved ✅ ' + pwas.mode + ' · popup every ' + pwas.interval + ' · reward CNY ' + pwas.rw.CNY[0]);
  const pwaH5Save = () => toast('H5 → PWA conversion saved ✅ ' + (pwas.h5.on ? 'ON · ' + pwas.h5.trig + ' · ' + pwas.h5.delay + 's delay' : 'OFF'));
  const pwaSiteSave = () => {
    if (!pwas.site.name.trim()) { toast('⚠ Site Name is required'); return; }
    toast('Site name saved ✅ ' + pwas.site.name + (pwas.site.tag ? ' — ' + pwas.site.tag : ''));
  };
  const rbSave = () => toast('ROIBest settings saved ✅ ' + (roibest.enabled ? 'enabled' : 'disabled') + (roibest.appId ? ' · App ' + roibest.appId : ' · set AppID'));

  const rbRunReport = () => {
    const linkId = (rbTest.linkId || '').trim();
    if (!linkId) { setRbOut({ err: '// link_id is required' }); return; }
    if (!roibest.enabled) { setRbOut({ err: '// ROIBest is disabled — enable it in Integration Settings first' }); return; }
    const extra = {};
    if (rbTest.event === 'Purchase') { extra.currency = rbTest.cur || 'USD'; extra.value = parseFloat(rbTest.val) || 0; }
    const body = { link_id: linkId, event_name: rbTest.event, extra };
    setRbOut({ text: 'POST ' + roibest.reportUrl + '\nContent-Type: application/json\n\n' + JSON.stringify(body, null, 2) + '\n\n↓ response\n' + JSON.stringify({ code: 0, msg: 'success', data: {} }, null, 2) });
    toast('Event reported ✓ ' + rbTest.event + ' · link_id ' + linkId.slice(0, 8) + '… · code 0');
  };

  const digSave = () => {
    const { main, url, ns1, ns2, banner } = pwas.guide;
    if (!ns1 || !ns2) { toast('⚠ Both nameservers (NS1 and NS2) are required'); return; }
    const nsRe = /^[a-z0-9.-]+\.[a-z]{2,}$/i;
    if (!nsRe.test(ns1)) { toast('⚠ Invalid NS1 hostname: ' + ns1); return; }
    if (!nsRe.test(ns2)) { toast('⚠ Invalid NS2 hostname: ' + ns2); return; }
    if (ns1.toLowerCase() === ns2.toLowerCase()) { toast('⚠ NS1 and NS2 must be different'); return; }
    if (url && !/^https?:\/\//i.test(url)) { toast('⚠ Install Guide URL must start with http:// or https://'); return; }
    toast('Install guide saved ✅ NS1 ' + ns1 + ' · NS2 ' + ns2 + (banner ? ' · banner ON' : ' · banner OFF'));
    void main;
  };
  const digCopy = (txt, lbl) => {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(() => toast('Copied 📋 ' + lbl)).catch(() => toast(txt));
    else toast(txt);
  };

  /* ---- blocked domains ---- */
  const abdQuery = () => {
    const q = domQueryInput.trim().toLowerCase();
    setDomQuery(q);
    toast(q ? 'Query 🔍 "' + q + '"' : 'Query cleared — showing all domains');
  };
  const openAbd = () => {
    if (domains.length >= 5) { toast('⚠ Limit reached — maximum 5 anti-block domains'); return; }
    setAbdForm({ ind: '', assign: 'No', dom: '', em: 'Disable', rm: '' });
    setAbdOpen(true);
  };
  const abdSubmit = () => {
    if (!abdForm.ind) { toast('⚠ Please select an Industry Domain'); return; }
    const raw = abdForm.dom.trim();
    if (!raw) { toast('⚠ Enter at least one domain'); return; }
    const doms = raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    const bad = doms.find((d) => !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(d));
    if (bad) { toast('⚠ Invalid domain: ' + bad); return; }
    const dup = doms.find((d) => domains.some((x) => x.dom === d));
    if (dup) { toast('⚠ Domain already exists: ' + dup); return; }
    if (domains.length + doms.length > 5) { toast('⚠ Limit 5 — you can add ' + (5 - domains.length) + ' more'); return; }
    const added = doms.map((d) => ({ dom: d, dns: 'Self-resolve', assign: abdForm.assign, ns1: 'ns1.onward-dns.com', ns2: 'ns2.onward-dns.com', ind: abdForm.ind, em: abdForm.em, rm: abdForm.rm.trim() }));
    setDomains((p) => [...p, ...added]);
    setAbdOpen(false);
    setDomQuery('');
    toast('Anti-block domain' + (doms.length > 1 ? 's' : '') + ' added ✅ ' + doms.join(', ') + ' (' + (domains.length + doms.length) + '/5)');
  };
  const abdDel = (i) => {
    const d = domains[i];
    setDomains((p) => p.filter((_, idx) => idx !== i));
    toast('Domain removed 🗑 ' + d.dom + ' (' + (domains.length - 1) + '/5)');
  };
  const abdEmToggle = (i) => {
    setDomains((p) => p.map((d, idx) => (idx === i ? { ...d, em: d.em === 'Enable' ? 'Disable' : 'Enable' } : d)));
    const d = domains[i];
    const next = d.em === 'Enable' ? 'Disable' : 'Enable';
    toast(next === 'Enable' ? 'Emergency popup ENABLED 🚨 ' + d.dom + ' — players will be guided to the APK' : 'Emergency popup disabled — ' + d.dom);
  };

  /* ---- google template ---- */
  const gtIconPick = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => { setGT({ icon: ev.target.result }); toast('App icon uploaded 🖼️ ' + f.name); };
    r.readAsDataURL(f);
  };
  const gtShotPick = (e) => {
    const fs = [...(e.target.files || [])].slice(0, 5 - gt.shots.length);
    if (!fs.length) return;
    let left = fs.length;
    const acc = [];
    fs.forEach((f) => {
      const r = new FileReader();
      r.onload = (ev) => {
        acc.push(ev.target.result);
        if (--left === 0) { setGt((p) => ({ ...p, shots: [...p.shots, ...acc] })); toast('Screenshot' + (fs.length > 1 ? 's' : '') + ' added 📸 ' + (gt.shots.length + acc.length) + '/5'); }
      };
      r.readAsDataURL(f);
    });
  };
  const gtShotDel = (i) => { setGt((p) => ({ ...p, shots: p.shots.filter((_, idx) => idx !== i) })); toast('Screenshot removed 🗑 ' + (gt.shots.length - 1) + '/5'); };
  const gtAddTag = () => {
    const v = tagInput.trim();
    if (!v) { toast('⚠ Enter a tag first'); return; }
    if (gt.tags.length >= 20) { toast('⚠ Maximum 20 tags'); return; }
    if (gt.tags.includes(v)) { toast('⚠ Tag already added: ' + v); return; }
    setGt((p) => ({ ...p, tags: [...p.tags, v] }));
    setTagInput('');
    toast('Tag added 🏷️ ' + v + ' (' + (gt.tags.length + 1) + '/20)');
  };
  const gtDelTag = (i) => { const t = gt.tags[i]; setGt((p) => ({ ...p, tags: p.tags.filter((_, idx) => idx !== i) })); toast('Tag removed ✕ ' + t); };
  const gtClearTags = () => { if (!gt.tags.length) { toast('No tags to clear'); return; } setGt((p) => ({ ...p, tags: [] })); toast('All tags cleared 🧹 0/20'); };
  const gtSlide = (s, v) => setGt((p) => ({ ...p, stars: { ...p.stars, [s]: +v } }));
  const gtAddReview = () => {
    const n = rev.n.trim(); const r = Math.min(5, Math.max(1, +rev.r || 5)); const c = rev.c.trim();
    if (!n) { toast('⚠ Reviewer name is required'); return; }
    if (!c) { toast('⚠ Review comment is required'); return; }
    setGt((p) => ({ ...p, reviews: [...p.reviews, { n, r, c }] }));
    setRev({ n: '', r: '', c: '' });
    toast('Review added 💬 ' + n + ' · ★ ' + r + ' (' + (gt.reviews.length + 1) + ' total)');
  };
  const gtLang = (l, on) => setGt((p) => ({ ...p, langs: on ? (p.langs.includes(l) ? p.langs : [...p.langs, l]) : p.langs.filter((x) => x !== l) }));
  const gtSave = () => {
    if (!gt.co.trim()) { toast('⚠ Company Name is required'); return; }
    if (!gt.desc.trim()) { toast('⚠ App Description is required'); return; }
    if (!gt.pop.trim()) { toast('⚠ App Pop-up Text is required'); return; }
    toast('Google template saved ✅ ' + gt.tpl + ' · ★ ' + gtOverall() + ' · ' + gt.tags.length + ' tags · ' + gt.langs.length + ' languages');
  };
  const gtReset = () => { setGt(GT_DEF()); toast('Google template reset ♻️ back to defaults'); };

  /* ============ TAB RENDERERS ============ */
  const renderSettings = () => (
    <>
      <div className="pwa-sec">Global Settings</div>
      <div className="pwa-inline" style={{ marginBottom: 6 }}>
        {PWA_MODES.map((m) => (
          <label className="pwa-radio" key={m}><input type="radio" name="pwMode" value={m} checked={pwas.mode === m} onChange={() => setP({ mode: m })} /> {m}</label>
        ))}
      </div>
      <div className="pwa-sec">Basic Settings</div>
      <div className="pwa-tblx">
        <div className="pwa-row"><div className="pl">Popup Guide Trigger</div><div className="pc"><PwaSelect opts={['Enable', 'Disable']} value={pwas.trigger} onChange={(v) => setP({ trigger: v })} w="130px" /></div></div>
        <div className="pwa-row"><div className="pl">Template</div><div className="pc"><input type="text" value={pwas.template} onChange={(e) => setP({ template: e.target.value })} /></div></div>
        <div className="pwa-row"><div className="pl">Popup Amount Display</div><div className="pc"><div className="pwa-inline">
          {PWA_CURS.map((c) => <span className="pwa-cur" key={c}><b>{c}</b><input type="text" value={pwas.amt[c]} inputMode="numeric" onChange={(e) => setPwas((p) => ({ ...p, amt: { ...p.amt, [c]: e.target.value } }))} /></span>)}
        </div></div></div>
        <div className="pwa-row"><div className="pl"><span className="req-red">*</span>Popup Target Page</div><div className="pc"><PwaSelect opts={['User Deposit Page', 'Home Page', 'Promotions Page', 'Game Lobby']} value={pwas.target} onChange={(v) => setP({ target: v })} w="220px" /></div></div>
        <div className="pwa-row"><div className="pl"><span className="req-red">*</span>Android Popup Trigger Type</div><div className="pc"><PwaSelect opts={PWA_TRIG} value={pwas.android} onChange={(v) => setP({ android: v })} w="260px" />
          <div className="pwa-hint">Native APP: Configure the download URL via "APP Settings" → "Parameters" → the source listed on the page</div></div></div>
        <div className="pwa-row"><div className="pl"><span className="req-red">*</span>Apple (iOS) Popup Trigger Type</div><div className="pc"><PwaSelect opts={PWA_TRIG} value={pwas.ios} onChange={(v) => setP({ ios: v })} w="260px" />
          <div className="pwa-hint">Native APP: Configure the download URL via "APP Settings" → "Parameters" → the source listed on the page</div></div></div>
        <div className="pwa-row"><div className="pl">Popup Time Interval <span className="pw-q" title="Minimum time between two install popups for the same player">?</span></div><div className="pc"><PwaSelect opts={['30 Minutes', '1 Hour', '3 Hours', '6 Hours', '12 Hours', '24 Hours']} value={pwas.interval} onChange={(v) => setP({ interval: v })} w="160px" /></div></div>
      </div>
      <div className="pwa-sec" style={{ marginTop: 22 }}>After Recharge User Installs PWA / APK — Reward<span className="sub">Award a bonus to users who install the PWA or APK after making a deposit</span></div>
      <div className="pwa-tblx">
        <div className="pwa-row"><div className="pl">Reward Method</div><div className="pc"><PwaSelect opts={['Reminder', 'Auto Credit', 'Manual Review']} value={pwas.rwMethod} onChange={(v) => setP({ rwMethod: v })} w="160px" /></div></div>
        <div className="pwa-row"><div className="pl">Reward Amount</div><div className="pc"><div style={{ overflowX: 'auto' }}><table className="pwa-rwtbl" style={{ minWidth: '430px' }}>
          <thead><tr><th>Currency</th><th>Reward Amount</th><th style={{ textAlign: 'right' }}>Withdrawal<br />Turnover Required</th></tr></thead>
          <tbody>{PWA_CURS.map((c) => (
            <tr key={c}><td className="cur">{c}</td>
              <td><input type="text" value={pwas.rw[c][0]} inputMode="numeric" onChange={(e) => setPwas((p) => ({ ...p, rw: { ...p.rw, [c]: [e.target.value, p.rw[c][1]] } }))} /></td>
              <td className="tw"><input type="text" value={pwas.rw[c][1]} inputMode="numeric" onChange={(e) => setPwas((p) => ({ ...p, rw: { ...p.rw, [c]: [p.rw[c][0], e.target.value] } }))} /></td></tr>
          ))}</tbody>
        </table></div></div></div>
      </div>
      <div style={{ marginTop: 16 }}><button className="btn-white" onClick={pwaSave}>Submit Now</button></div>
    </>
  );

  const renderBlocked = () => {
    const list = domains.filter((d) => !domQuery || d.dom.toLowerCase().includes(domQuery));
    return (
      <>
        <div className="pwa-guide">
          <div className="gt">📋 PWA Anti-Block Domain Guide</div>
          <ol>
            <li>The PWA anti-block domains and game domains have been separated. The probability of a PWA domain being blocked will be greatly reduced — please use with confidence.</li>
            <li>If a game domain is blocked, you can switch at any time in the backend. Players will not notice any interruption.</li>
            <li>If a PWA domain is unfortunately blocked, there is no need to panic. We have implemented anti-block protection — users can still access normally within 100 days. At that point, you can enable the emergency rescue popup to guide players to download the APK.</li>
            <li>The APK can be uploaded via <span style={{ color: 'var(--gold)', fontWeight: 800 }}>"APP Settings"</span> → <span style={{ color: 'var(--gold)', fontWeight: 800 }}>"Update Configuration"</span>.</li>
            <li>Converting H5 to PWA anti-block domains can both improve retention and prevent the lobby domain from being blocked, reducing damage to the platform.</li>
          </ol>
        </div>
        <div className="abd-toolbar">
          <input placeholder="Domain address" value={domQueryInput} onChange={(e) => setDomQueryInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') abdQuery(); }} />
          <button className="mini-btn" onClick={() => toast('Instructions opened 📖 see the Anti-Block Domain Guide above')}>Open Instructions</button>
          <button className="mini-btn" onClick={abdQuery}>Query</button>
          <button className="btn-white" style={{ padding: '10px 16px' }} onClick={openAbd}>＋ Add (Limit 5)</button>
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table style={{ minWidth: '1100px' }}>
            <thead><tr><th><input type="checkbox" readOnly /></th><th>PWA Anti-Block Domain</th><th>DNS Resolution Method</th><th>Assignment Status <span className="pw-q" title="Whether the domain has been assigned to a live CDN slot">?</span></th><th>NS1</th><th>NS2</th><th>Industry Domain</th><th>Emergency Popup</th><th>Remark</th><th>Actions</th></tr></thead>
            <tbody>{list.length ? list.map((d) => {
              const i = domains.indexOf(d);
              return (
                <tr key={i}>
                  <td><input type="checkbox" className="abd-ck" /></td>
                  <td style={{ fontWeight: 800, color: 'var(--blue)' }}>{d.dom}</td>
                  <td>{d.dns}</td>
                  <td>{d.assign === 'Yes' ? <span className="badge ok">Yes</span> : <span className="badge pend">No</span>}</td>
                  <td style={{ fontSize: '.7rem', color: 'var(--muted)' }}>{d.ns1}</td>
                  <td style={{ fontSize: '.7rem', color: 'var(--muted)' }}>{d.ns2}</td>
                  <td>{d.ind}</td>
                  <td><button className={'mini-btn' + (d.em === 'Enable' ? ' gold' : '')} onClick={() => abdEmToggle(i)}>{d.em === 'Enable' ? '🚨 Enabled' : 'Disabled'}</button></td>
                  <td style={{ color: 'var(--muted)' }}>{d.rm || '—'}</td>
                  <td><button className="mini-btn" onClick={() => abdDel(i)}>🗑 Delete</button></td>
                </tr>
              );
            }) : <tr><td colSpan={10} className="abd-nodata">No Data{domQuery ? ` — no domains match "${domQuery}"` : ''}</td></tr>}</tbody>
          </table></div>
        </div>
      </>
    );
  };

  const renderH5 = () => (
    <div className="card">
      <div className="card-title">H5 User to PWA Conversion</div>
      <div className="pwa-tblx">
        <div className="pwa-row"><div className="pl">Enable H5 → PWA Redirect</div><div className="pc"><label className="switch"><input type="checkbox" checked={pwas.h5.on} onChange={(e) => setPwas((p) => ({ ...p, h5: { ...p.h5, on: e.target.checked } }))} /><span className="slider"></span></label></div></div>
        <div className="pwa-row"><div className="pl">Conversion Trigger</div><div className="pc"><PwaSelect opts={['On First Visit', 'On Second Visit', 'After Deposit', 'After Login']} value={pwas.h5.trig} onChange={(v) => setPwas((p) => ({ ...p, h5: { ...p.h5, trig: v } }))} w="170px" /></div></div>
        <div className="pwa-row"><div className="pl">Redirect Delay (seconds)</div><div className="pc"><input type="number" value={pwas.h5.delay} min="0" max="60" style={{ maxWidth: '90px' }} onChange={(e) => setPwas((p) => ({ ...p, h5: { ...p.h5, delay: Math.max(0, +e.target.value || 0) } }))} /></div></div>
      </div>
      <div style={{ marginTop: 14 }}><button className="btn-white" onClick={pwaH5Save}>Submit Now</button></div>
    </div>
  );

  const renderGuide = () => {
    const g = pwas.guide;
    const setG = (patch) => setPwas((p) => ({ ...p, guide: { ...p.guide, ...patch } }));
    const sdBadge = (s) => s === 'active' ? <span className="dig-badge ok">✅ Active</span> : <span className="dig-badge warn">⚠ Needs setup</span>;
    const yBadge = (v) => v === 'Yes' ? <span className="dig-badge ok">Yes</span> : <span className="dig-badge warn">No</span>;
    const tBadge = (t) => t === 'A' ? <span className="dig-badge info">A</span> : t === 'CNAME' ? <span className="dig-badge gold">CNAME</span> : <span className="dig-badge" style={{ background: 'rgba(155,48,217,.13)', color: '#c69bff' }}>TXT</span>;
    const stBadge = (s) => s === 'active' ? <span className="dig-badge ok">✅</span> : <span className="dig-badge warn">⚠</span>;
    const mono = { fontFamily: "'Roboto Mono','Courier New',ui-monospace,monospace", fontWeight: 700 };
    return (
      <div className="dig-wrap">
        <div className="dig-card">
          <div className="dig-chead"><span className="ic">⚙️</span><div><div className="tt">Domain Install Guide Configuration</div><div className="sub">Set the install guide page and the anti-block nameservers</div></div></div>
          <div className="dig-cbody" style={{ padding: 0 }}>
            <div className="pwa-tblx" style={{ border: 'none', borderRadius: 0 }}>
              <div className="pwa-row"><div className="pl">Main Domain</div><div className="pc"><input type="text" value={g.main} placeholder="e.g. pusta88.com" style={{ maxWidth: 'none' }} onChange={(e) => setG({ main: e.target.value })} /></div></div>
              <div className="pwa-row"><div className="pl">Install Guide URL</div><div className="pc"><input type="text" value={g.url} placeholder="https://pusta88.com/install" style={{ maxWidth: 'none' }} onChange={(e) => setG({ url: e.target.value })} /></div></div>
              <div className="pwa-row"><div className="pl">Nameserver 1 (NS1)</div><div className="pc"><input type="text" value={g.ns1} placeholder="ns1.yourdns.com" style={{ maxWidth: 'none', ...mono }} onChange={(e) => setG({ ns1: e.target.value })} /></div></div>
              <div className="pwa-row"><div className="pl">Nameserver 2 (NS2)</div><div className="pc"><input type="text" value={g.ns2} placeholder="ns2.yourdns.com" style={{ maxWidth: 'none', ...mono }} onChange={(e) => setG({ ns2: e.target.value })} /></div></div>
              <div className="pwa-row"><div className="pl">Show Guide Banner</div><div className="pc"><label className="switch"><input type="checkbox" checked={g.banner} onChange={(e) => setG({ banner: e.target.checked })} /><span className="slider"></span></label></div></div>
            </div>
          </div>
          <div style={{ padding: '14px 17px' }}><button className="btn-white" onClick={digSave}>Submit Now</button></div>
        </div>

        <div className="dig-card">
          <div className="dig-chead"><span className="ic">📋</span><div><div className="tt">Setup Guide</div><div className="sub">Step-by-step PWA anti-block domain configuration</div></div></div>
          <div className="dig-cbody">
            <div className="dig-step"><div className="sn">1</div><div className="sc"><b>Purchase a clean domain</b> from Namecheap, GoDaddy, Dynadot, or similar. Avoid domains with any prior gambling or spam history — use a fresh registration. Recommended extensions: <code>.com</code> <code>.bet</code> <code>.casino</code> <code>.live</code></div></div>
            <div className="dig-step"><div className="sn">2</div><div className="sc"><b>Set nameservers</b> at your registrar's DNS management panel to point to Onward's CDN nameservers (see Nameservers section below), or choose <b>Self-resolve</b> and manually configure A/CNAME records to your server IP.</div></div>
            <div className="dig-step"><div className="sn">3</div><div className="sc"><b>Add the domain</b> under <b>PWA Settings → PWA Blocked Domains → ＋ Add</b>. Fill in Industry Domain, Assignment Status, and DNS Resolution Method. Submit to register it in the system.</div></div>
            <div className="dig-step"><div className="sn">4</div><div className="sc"><b>Wait for propagation</b> — typically 10–30 minutes for Cloudflare-proxied domains, up to 24 hours for self-resolve. You can verify using <code>dig +short yourdomain.com</code> or an online DNS propagation checker.</div></div>
            <div className="dig-step"><div className="sn">5</div><div className="sc"><b>SSL is issued automatically</b> by Let's Encrypt or Cloudflare once DNS resolves. Test the install popup on Android Chrome (Add to Home Screen) and on iOS Safari (Share → Add to Home Screen).</div></div>
            <div className="dig-step"><div className="sn">6</div><div className="sc"><b>Keep 2+ standby domains</b> assigned at all times. If the primary is blocked, you can rotate instantly in the Blocked Domains tab — players will not notice any interruption. Enable <b>Emergency Popup</b> on a standby domain as a safety net.</div></div>
          </div>
        </div>

        <div className="dig-card">
          <div className="dig-chead"><span className="ic">🌐</span><div><div className="tt">Onward CDN Nameservers</div><div className="sub">Point your registrar's NS records to these values</div></div><span className="pill-ok">Required for CDN mode</span></div>
          <div className="dig-cbody">
            <div className="dig-ns-box">
              <div className="dig-ns-item"><label>Primary Nameserver (NS1)</label><div className="val">{g.ns1}<button className="dig-copybtn" onClick={() => digCopy(g.ns1, 'NS1')}>📋 Copy</button></div></div>
              <div className="dig-ns-item"><label>Secondary Nameserver (NS2)</label><div className="val">{g.ns2}<button className="dig-copybtn" onClick={() => digCopy(g.ns2, 'NS2')}>📋 Copy</button></div></div>
            </div>
            <div className="dig-warn-box">⚠ <b>Do not use these nameservers for your main lobby domain.</b> These are dedicated anti-block PWA nameservers only. Your main casino domain should use separate, unrelated DNS to avoid co-blocking. CDN requires all nameserver locations to be fully configured before domain activation — backend records will be saved, Cloudflare or CDN interfaces will not be called directly.</div>
            <div style={{ marginTop: 14 }}>
              <div className="dig-prop-grid">
                <div className="dig-prop"><div className="lbl">CDN Provider</div><div className="val">Cloudflare Anycast</div></div>
                <div className="dig-prop"><div className="lbl">Propagation Time</div><div className="val">10 – 30 min (up to 24h)</div></div>
                <div className="dig-prop"><div className="lbl">SSL Auto-Provision</div><div className="val">✅ Let's Encrypt + Wildcard</div></div>
                <div className="dig-prop"><div className="lbl">DDoS Protection</div><div className="val">✅ Layer 3/4/7 included</div></div>
                <div className="dig-prop"><div className="lbl">Emergency Access Window</div><div className="val">100 days post-block</div></div>
                <div className="dig-prop"><div className="lbl">Max Domains (per account)</div><div className="val">5 anti-block PWA domains</div></div>
              </div>
            </div>
          </div>
        </div>

        <div className="dig-card">
          <div className="dig-chead"><span className="ic">🗂️</span><div><div className="tt">Registered Domains</div><div className="sub">All configured PWA anti-block domains</div></div><span className="pill-ok">{DIG_DOMAINS.filter((d) => d.status === 'active').length} active · {DIG_DOMAINS.filter((d) => d.status !== 'active').length} needs setup</span></div>
          <div style={{ overflowX: 'auto' }}><table className="dig-tbl" style={{ minWidth: '900px' }}>
            <thead><tr><th>Domain</th><th>IP Address</th><th>CDN / Method</th><th>SSL</th><th>SSL Expiry</th><th>Assignment</th><th>Industry</th><th>NS1</th><th>NS2</th><th>Status</th></tr></thead>
            <tbody>{DIG_DOMAINS.map((d) => (
              <tr key={d.dom}>
                <td><div className="copy-cell" style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span className="mono" style={{ color: 'var(--blue)' }}>{d.dom}</span><button className="dig-copybtn" onClick={() => digCopy(d.dom, 'domain')}>📋</button></div></td>
                <td><span className="mono">{d.ip}</span></td>
                <td><span className={'dig-badge ' + (d.cdn === 'Cloudflare' ? 'ok' : 'info')}>{d.cdn}</span></td>
                <td style={{ fontSize: '.72rem' }}>{d.ssl}</td>
                <td style={{ fontSize: '.72rem' }}>{d.exp}</td>
                <td>{yBadge(d.assign)}</td>
                <td style={{ color: 'var(--muted)' }}>{d.industry}</td>
                <td className="mono" style={{ fontSize: '.66rem', color: 'var(--muted)' }}>{d.ns1}</td>
                <td className="mono" style={{ fontSize: '.66rem', color: 'var(--muted)' }}>{d.ns2}</td>
                <td>{sdBadge(d.status)}</td>
              </tr>
            ))}</tbody>
          </table></div>
        </div>

        <div className="dig-card">
          <div className="dig-chead"><span className="ic">📡</span><div><div className="tt">DNS Records</div><div className="sub">A, CNAME and TXT records for each domain</div></div></div>
          <div style={{ overflowX: 'auto' }}><table className="dig-tbl" style={{ minWidth: '820px' }}>
            <thead><tr><th>Domain</th><th>Type</th><th>Name</th><th>Value / Target</th><th>TTL</th><th>Proxied</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>{DIG_DNS.map((r, idx) => (
              <tr key={idx}>
                <td className="mono" style={{ fontSize: '.68rem', color: 'var(--blue)' }}>{r.dom}</td>
                <td>{tBadge(r.type)}</td>
                <td className="mono">{r.name}</td>
                <td><div className="copy-cell"><span className="mono" style={{ wordBreak: 'break-all' }}>{r.val}</span><button className="dig-copybtn" onClick={() => digCopy(r.val, r.type + ' record')}>📋</button></div></td>
                <td style={{ color: 'var(--muted)' }}>{r.ttl}</td>
                <td>{r.prox === 'Yes' ? <span className="dig-badge ok">🟠 Yes</span> : <span className="dig-badge info">No</span>}</td>
                <td>{stBadge(r.stat)}</td>
                <td><button className="mini-btn" onClick={() => toast('DNS record verified 🔍 ' + r.type + ' ' + r.name + ' → ' + r.dom)}>Verify</button></td>
              </tr>
            ))}</tbody>
          </table></div>
        </div>

        <div className="dig-card">
          <div className="dig-chead"><span className="ic">🔧</span><div><div className="tt">Self-Resolve DNS Setup</div><div className="sub">Manual A/CNAME configuration if not using CDN nameservers</div></div><span className="pill-pend">Optional</span></div>
          <div className="dig-cbody">
            <div className="pwa-guide" style={{ border: 'none', padding: 0 }}>
              <ol style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 8, color: '#c4cde0', fontSize: 'var(--fs-sm)', lineHeight: 1.6 }}>
                <li>Log in to your domain registrar (e.g. Namecheap → "Advanced DNS", GoDaddy → "DNS", Cloudflare → "DNS Records").</li>
                <li>Add an <b style={{ color: 'var(--blue)' }}>A record</b>: Name = <code>@</code>, Value = your server IP, TTL = Auto.</li>
                <li>Add a <b style={{ color: 'var(--gold)' }}>CNAME record</b>: Name = <code>www</code>, Value = <code>yourdomain.com.</code> (with trailing dot), TTL = Auto.</li>
                <li>Optionally add a <b style={{ color: '#c69bff' }}>TXT record</b> for SPF: Name = <code>@</code>, Value = <code>v=spf1 include:onward-cdn.com ~all</code>.</li>
                <li>Back in Onward admin, set <b>DNS Resolution Method = Self-resolve</b> when adding the domain. The system saves the record only — no Cloudflare API call is made.</li>
                <li>SSL will be issued automatically within ~5 minutes after DNS propagates. If SSL fails, check that port 80 is accessible for ACME challenge validation.</li>
              </ol>
            </div>
            <div className="dig-warn-box" style={{ marginTop: 12 }}>⚠ <b>Self-resolve domains do not get Cloudflare proxy protection.</b> Your server IP will be publicly visible. For maximum anti-block protection, use CDN nameserver mode instead.</div>
          </div>
        </div>
      </div>
    );
  };

  const renderGoogle = () => (
    <>
      <div style={{ color: 'var(--blue)', fontWeight: 800, fontSize: 'var(--fs-sm)', marginBottom: 10 }}>Edit</div>
      <div className="pwa-tblx">
        <div className="pwa-row"><div className="pl"><span className="req-red">*</span>Google Template</div><div className="pc"><PwaSelect opts={['PWA Install', 'APK Install', 'Lite Landing']} value={gt.tpl} onChange={(v) => setGT({ tpl: v })} /></div></div>
        <div className="pwa-row"><div className="pl">Template Name</div><div className="pc"><input type="text" value={gt.name} style={{ maxWidth: 'none' }} onChange={(e) => setGT({ name: e.target.value })} /></div></div>
        <div className="pwa-row"><div className="pl"><span className="req-red">*</span>App Icon</div><div className="pc"><div className="pwa-inline">
          <div className="gt-iconbox" onClick={() => iconRef.current && iconRef.current.click()}>{gt.icon ? <img src={gt.icon} alt="" /> : '🖼️'}</div>
          <div className="gt-upnote">JPG, JPEG, and PNG images supported<br />Recommended size: <b>512 × 512 px</b></div>
          <input type="file" ref={iconRef} accept="image/png,image/jpeg" style={{ display: 'none' }} onChange={gtIconPick} /></div></div></div>
        <div className="pwa-row"><div className="pl">App Name</div><div className="pc"><input type="text" value={gt.app} placeholder="e.g. Pusta88 Casino" style={{ maxWidth: 'none' }} onChange={(e) => setGT({ app: e.target.value })} /></div></div>
        <div className="pwa-row"><div className="pl"><span className="req-red">*</span>Company Name</div><div className="pc"><div className="pwa-inline" style={{ width: '100%' }}>
          <input type="text" value={gt.co} placeholder="e.g. Onward Ltd." style={{ flex: 1, maxWidth: 'none' }} onChange={(e) => setGT({ co: e.target.value })} />
          <span style={{ color: '#9fb0d0', fontSize: 'var(--fs-xs)', fontWeight: 700 }}><span className="req-red">*</span>App Download Count</span>
          <input type="text" value={gt.dl} placeholder="e.g. 999999" style={{ width: '140px' }} onChange={(e) => setGT({ dl: e.target.value })} /></div></div></div>
        <div className="pwa-row"><div className="pl"><span className="req-red">*</span>App Review Count</div><div className="pc"><div className="pwa-inline" style={{ width: '100%' }}>
          <input type="text" value={gt.rev} placeholder="e.g. 10000" style={{ width: '160px' }} onChange={(e) => setGT({ rev: e.target.value })} />
          <span style={{ color: '#9fb0d0', fontSize: 'var(--fs-xs)', fontWeight: 700 }}><span className="req-red">*</span>Applicable Age</span>
          <PwaSelect opts={['Rated for 18+', 'Rated for 12+', 'Rated for 3+']} value={gt.age} onChange={(v) => setGT({ age: v })} w="160px" /></div></div></div>
        <div className="pwa-row"><div className="pl">Subtitle</div><div className="pc"><input type="text" value={gt.sub} placeholder="e.g. Best Online Casino" style={{ maxWidth: 'none' }} onChange={(e) => setGT({ sub: e.target.value })} /></div></div>
        <div className="pwa-row"><div className="pl"><span className="req-red">*</span>App Description</div><div className="pc">
          <textarea className="pwa-ta" maxLength={5000} placeholder="Brief description of your app…" value={gt.desc} onChange={(e) => setGT({ desc: e.target.value })} />
          <div className="gt-cnt">{gt.desc.length} / 5000</div></div></div>
        <div className="pwa-row"><div className="pl"><span className="req-red">*</span>App Screenshot</div><div className="pc">
          <div className="gt-shotrow">{gt.shots.map((s, i) => <div className="gt-shot" key={i} title="Click to remove" onClick={() => gtShotDel(i)}><img src={s} alt="" /></div>)}{gt.shots.length < 5 ? <div className="gt-shot add" onClick={() => shotRef.current && shotRef.current.click()}>＋</div> : null}</div>
          <input type="file" ref={shotRef} accept="image/*" multiple style={{ display: 'none' }} onChange={gtShotPick} />
          <div className="gt-upnote">Upload 3–5 app screenshots · JPG, JPEG, PNG, GIF · aspect ratio 9:18 · 320×480 ≤ size ≤ 1440×2560</div></div></div>
        <div className="pwa-row"><div className="pl"><span className="req-red">*</span>App Tag</div><div className="pc">
          <div className="gt-tagrow"><input type="text" placeholder="Enter tag" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') gtAddTag(); }} /><button className="mini-btn gold" onClick={gtAddTag}>Add</button><button className="mini-btn" onClick={gtClearTags}>Clear</button></div>
          <div className="gt-chips">{gt.tags.length ? gt.tags.map((t, i) => <span className="gt-chip" key={i}>{t}<span onClick={() => gtDelTag(i)}>✕</span></span>) : <span style={{ color: 'var(--muted)', fontSize: '.68rem' }}>No tags yet</span>}</div>
          <div className="gt-cnt">{gt.tags.length}/20</div></div></div>
        <div className="pwa-row"><div className="pl"><span className="req-red">*</span>Rating Settings</div><div className="pc">
          <div className="gt-rate">
            <div className="gt-overall"><div className="n">{gtOverall()}</div><div className="t">Overall Rating</div></div>
            <div className="gt-sliders">{[5, 4, 3, 2, 1].map((s) => <div className="gt-srow" key={s}><b>{s}</b><input type="range" min="0" max="100" value={gt.stars[s]} onChange={(e) => gtSlide(s, e.target.value)} /></div>)}</div>
          </div></div></div>
        <div className="pwa-row"><div className="pl"><span className="req-red">*</span>Review Section Settings</div><div className="pc">
          {gt.reviews.map((r, i) => <div className="gt-rev" key={i}><div className="av">👤</div><div><b>{r.n}</b> <span className="st">★ {r.r}</span><div style={{ color: '#c4cde0' }}>{r.c}</div></div></div>)}
          <div className="pwa-inline"><input type="text" placeholder="Reviewer Name" style={{ flex: 1 }} value={rev.n} onChange={(e) => setRev((p) => ({ ...p, n: e.target.value }))} /><input type="text" placeholder="Rating (e.g. 5)" style={{ width: '110px' }} inputMode="decimal" value={rev.r} onChange={(e) => setRev((p) => ({ ...p, r: e.target.value }))} /></div>
          <textarea className="pwa-ta" placeholder="Review comment…" style={{ minHeight: '60px' }} value={rev.c} onChange={(e) => setRev((p) => ({ ...p, c: e.target.value }))} />
          <div><button className="mini-btn gold" onClick={gtAddReview}>＋ Add comment</button></div></div></div>
        <div className="pwa-row"><div className="pl"><span className="req-red">*</span>App Pop-up Text</div><div className="pc"><input type="text" value={gt.pop} placeholder="e.g. Install our app for the best experience!" style={{ maxWidth: 'none' }} onChange={(e) => setGT({ pop: e.target.value })} /></div></div>
        <div className="pwa-row"><div className="pl">Store Language</div><div className="pc">
          <div className="gt-langs">{GT_LANGS.map((l) => <label className={'gt-lang' + (gt.langs.includes(l) ? ' on' : '')} key={l}><input type="checkbox" checked={gt.langs.includes(l)} onChange={(e) => gtLang(l, e.target.checked)} /> {l}</label>)}</div></div></div>
      </div>
      <div style={{ marginTop: 16, display: 'flex', gap: 10 }}><button className="btn-white" onClick={gtSave}>Submit Now</button><button className="btn-ghost" onClick={gtReset}>Reset</button></div>
    </>
  );

  const renderSite = () => (
    <div className="card">
      <div className="card-title">Site Name Configuration</div>
      <div className="pwa-tblx">
        <div className="pwa-row"><div className="pl">Site Name</div><div className="pc"><input type="text" value={pwas.site.name} placeholder="e.g. Pusta88" style={{ maxWidth: 'none' }} onChange={(e) => setPwas((p) => ({ ...p, site: { ...p.site, name: e.target.value } }))} /></div></div>
        <div className="pwa-row"><div className="pl">Site Tagline</div><div className="pc"><input type="text" value={pwas.site.tag} placeholder="e.g. Best Online Casino Philippines" style={{ maxWidth: 'none' }} onChange={(e) => setPwas((p) => ({ ...p, site: { ...p.site, tag: e.target.value } }))} /></div></div>
      </div>
      <div style={{ marginTop: 14 }}><button className="btn-white" onClick={pwaSiteSave}>Submit Now</button></div>
    </div>
  );

  const renderRoi = () => {
    const lsKey = '__rb_' + (roibest.appId || '<AppID>') + '_link_id';
    const uuidKey = '__rb_' + (roibest.appId || '<AppID>') + '_uuid';
    return (
      <>
        <div className="pwa-guide" style={{ marginBottom: 14 }}>
          <div className="gt">📡 ROIBest Ad Attribution <span className="rb-badge">v1.3.1</span></div>
          <ol>
            <li>ROIBest captures ad-click params (uuid, link_id, fbclid/ttclid…) on launch and reports conversions back to Facebook, TikTok, Kwai, Google and others — one unified endpoint auto-routes by channel.</li>
            <li>Create an App in the ROIBest backend to get your <b>AppID</b>, configure the pixel/token, then promote with ROIBest-generated links.</li>
            <li>Report <b>CompleteRegistration</b>, <b>FirstDeposit</b> and <b>Purchase</b> events as players convert. Promotion links cannot be cross-posted between channels.</li>
          </ol>
        </div>
        <div className="rb-wrap">
          <div className="rb-card">
            <div className="rbh">⚙️ Integration Settings</div>
            <div className="rb-fld"><label>Enabled</label><select value={roibest.enabled ? 'Enabled' : 'Disabled'} onChange={(e) => setRB({ enabled: e.target.value === 'Enabled' })}><option>Enabled</option><option>Disabled</option></select></div>
            <div className="rb-fld"><label>App ID</label><input className="rb-mono" value={roibest.appId} placeholder="e.g. 1029384756 (Backend → App Management)" onChange={(e) => setRB({ appId: e.target.value })} /><div className="hint">Backend → App Management → AppID</div></div>
            <div className="rb-fld"><label>Integration Method</label><select value={roibest.method} onChange={(e) => setRB({ method: e.target.value })}><option>Packaged Integration</option><option>URL / Self-Developed</option></select><div className="hint">Packaged: params land in localStorage. URL: ROIBest appends params to your H5 URL.</div></div>
            <div className="rb-fld"><label>Event Report URL</label><input className="rb-mono" value={roibest.reportUrl} onChange={(e) => setRB({ reportUrl: e.target.value })} /></div>
            <div className="rb-fld"><label>Query Params URL</label><input className="rb-mono" value={roibest.queryUrl} onChange={(e) => setRB({ queryUrl: e.target.value })} /></div>
            <div style={{ marginTop: 6 }}><button className="btn-white" onClick={rbSave}>Submit Now</button></div>
          </div>
          <div className="rb-card">
            <div className="rbh">🔧 Service Worker (self-dev only)</div>
            <div className="rb-fld"><label>Inject SW</label><select value={roibest.swInject ? 'On' : 'Off'} onChange={(e) => setRB({ swInject: e.target.value === 'On' })}><option>Off</option><option>On</option></select></div>
            <div className="rb-fld"><label>Service Worker URL</label><input className="rb-mono" value={roibest.swUrl} placeholder="./service-worker.js" onChange={(e) => setRB({ swUrl: e.target.value })} /></div>
            <div className="rb-fld"><label>Read Key Params (localStorage)</label>
              <div className="rb-code">{`const link_id = JSON.parse(localStorage.getItem('${lsKey}'));\nconst uuid    = JSON.parse(localStorage.getItem('${uuidKey}'));`}</div>
              <div className="hint">Set <span className="rb-mono">window.__rb_app.swUrl</span> before &lt;/head&gt;, then add <span className="rb-mono">importScripts("./notification-sw.js")</span> in your SW.</div></div>
          </div>
        </div>
        <div className="rb-card" style={{ marginTop: 16 }}>
          <div className="rbh">📶 Supported Channels <span className="hint" style={{ fontWeight: 600, color: 'var(--muted)' }}>(channel_id — links cannot be cross-posted)</span></div>
          <div className="rb-chan">{RB_CHANNELS.map((c) => <span className="rb-chip" key={c[0]}>{c[1]}<span className="id">{c[0]}</span></span>)}</div>
        </div>
        <div className="rb-wrap" style={{ marginTop: 16 }}>
          <div className="rb-card">
            <div className="rbh">🧪 Event Reporting Tester</div>
            <div className="rb-fld"><label>link_id</label><input className="rb-mono" value={rbTest.linkId} onChange={(e) => setRbTest((p) => ({ ...p, linkId: e.target.value }))} /></div>
            <div className="rb-fld"><label>event_name</label><select value={rbTest.event} onChange={(e) => setRbTest((p) => ({ ...p, event: e.target.value }))}>{RB_EVENTS.map((ev) => <option key={ev}>{ev}</option>)}</select></div>
            <div className="rb-fld" style={{ display: 'flex', gap: 10 }}><div style={{ flex: 1 }}><label>currency</label><input value={rbTest.cur} onChange={(e) => setRbTest((p) => ({ ...p, cur: e.target.value }))} /></div><div style={{ flex: 1 }}><label>value</label><input value={rbTest.val} inputMode="decimal" onChange={(e) => setRbTest((p) => ({ ...p, val: e.target.value }))} /></div></div>
            <button className="rb-run rb-tester" onClick={rbRunReport}>▶ POST /report/fb/event</button>
            <div className="rb-tester"><div className="rb-out">{rbOut ? (rbOut.err ? <span style={{ color: '#ff7b72' }}>{rbOut.err}</span> : rbOut.text) : <span className="muted">{'// Response will appear here'}</span>}</div></div>
          </div>
          <div className="rb-card">
            <div className="rbh">🗺️ MgskyAds Event Mapping <span className="hint" style={{ fontWeight: 600, color: 'var(--muted)' }}>(MIS → Pixel Config)</span></div>
            <table className="rb-tbl"><thead><tr><th>Reported Event</th><th>→ MgskyAds Standard</th></tr></thead>
              <tbody>{roibest.mgsky.map((m, i) => <tr key={i}><td className="ev">{m[0]}</td><td className="ev" style={{ color: 'var(--gold)' }}>{m[1]}</td></tr>)}</tbody>
            </table>
            <div className="hint" style={{ marginTop: 10 }}>Case-insensitive matching. Unmapped events pass through as-is. MgskyAds only recognises <span className="rb-mono">EVENT_COMPLETE_REGISTRATION</span>, <span className="rb-mono">EVENT_FIRST_DEPOSIT</span>, <span className="rb-mono">EVENT_PURCHASE</span>.</div>
          </div>
        </div>
      </>
    );
  };

  const renderTab = () => {
    switch (tab) {
      case 'settings': return renderSettings();
      case 'blocked': return renderBlocked();
      case 'h5': return renderH5();
      case 'guide': return renderGuide();
      case 'google': return renderGoogle();
      case 'roibest': return renderRoi();
      case 'site': default: return renderSite();
    }
  };

  return (
    <>
      <div className="page-head"><div><h1 className="hero-h">📱 PWA Settings</h1><div className="hero-sub" style={{ marginBottom: 0 }}>Configure Progressive Web App install prompts, popup triggers and install rewards</div></div></div>
      <div className="ptabs">{PWA_TABS.map((t) => <button className={'ptab' + (tab === t[0] ? ' active' : '')} key={t[0]} onClick={() => setTab(t[0])}>{t[1]}</button>)}</div>
      {renderTab()}

      {abdOpen && (
        <div className="modal-ov show" onClick={(e) => { if (e.target === e.currentTarget) setAbdOpen(false); }}>
          <div className="pm-modal" style={{ maxWidth: 540 }}>
            <div className="pm-head"><span style={{ fontSize: '1.1rem' }}>＋</span><span><div className="nm">Add Anti-Block Domain</div></span>
              <button className="kyc-x" style={{ marginLeft: 'auto' }} onClick={() => setAbdOpen(false)}>✕</button></div>
            <div className="pm-body" style={{ padding: 0 }}>
              <div className="pwa-tblx" style={{ border: 'none', borderRadius: 0 }}>
                <div className="pwa-row"><div className="pl">Industry Domain</div><div className="pc">
                  <select value={abdForm.ind} style={{ maxWidth: 'none' }} onChange={(e) => setAbdForm((p) => ({ ...p, ind: e.target.value }))}><option value="">Please Select</option><option>Casino</option><option>Sports</option><option>Lottery</option><option>Slots</option><option>Live Casino</option></select></div></div>
                <div className="pwa-row"><div className="pl">Assignment Status</div><div className="pc"><div className="pwa-inline">
                  <label className="pwa-radio"><input type="radio" name="abdAssign" value="Yes" checked={abdForm.assign === 'Yes'} onChange={() => setAbdForm((p) => ({ ...p, assign: 'Yes' }))} /> Yes</label>
                  <label className="pwa-radio"><input type="radio" name="abdAssign" value="No" checked={abdForm.assign === 'No'} onChange={() => setAbdForm((p) => ({ ...p, assign: 'No' }))} /> No</label></div></div></div>
                <div className="pwa-row"><div className="pl">DNS Resolution Method</div><div className="pc">
                  <label className="pwa-radio"><input type="radio" name="abdDns" value="Self-resolve" defaultChecked /> <b>Self-resolve</b></label>
                  <div style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)', lineHeight: 1.6 }}>Manual resolution: Open your domain homepage, configure DNS resolution. CDN requires all locations to be fully configured before setup. Backend records will be saved, Cloudflare or CDN interfaces will not be called.</div></div></div>
                <div className="pwa-row"><div className="pl">PWA Anti-Block Domain</div><div className="pc">
                  <textarea className="pwa-ta" placeholder="Enter domain(s)…" value={abdForm.dom} onChange={(e) => setAbdForm((p) => ({ ...p, dom: e.target.value }))} />
                  <div style={{ color: 'var(--red)', fontSize: 'var(--fs-xs)' }}>Multiple domains, separated by English commas</div></div></div>
                <div className="pwa-row"><div className="pl">Emergency Popup</div><div className="pc"><div className="pwa-inline">
                  <label className="pwa-radio"><input type="radio" name="abdEm" value="Enable" checked={abdForm.em === 'Enable'} onChange={() => setAbdForm((p) => ({ ...p, em: 'Enable' }))} /> Enable</label>
                  <label className="pwa-radio"><input type="radio" name="abdEm" value="Disable" checked={abdForm.em === 'Disable'} onChange={() => setAbdForm((p) => ({ ...p, em: 'Disable' }))} /> Disable</label></div></div></div>
                <div className="pwa-row"><div className="pl">Remark</div><div className="pc">
                  <textarea className="pwa-ta" placeholder="Optional note…" style={{ minHeight: '56px' }} value={abdForm.rm} onChange={(e) => setAbdForm((p) => ({ ...p, rm: e.target.value }))} /></div></div>
              </div>
            </div>
            <div className="pm-foot"><button className="btn-cancel" onClick={() => setAbdOpen(false)}>Cancel</button>
              <button className="btn-white" onClick={abdSubmit}>Submit Now</button></div>
          </div>
        </div>
      )}
    </>
  );
}
