import { useState } from 'react';
import { useUI } from '../context/UIContext';

const ADS_TYPES = ['H5 Promotion - Regular', 'H5 Promotion - FB Pixel', 'H5 Promotion - FB API', 'H5 Promotion - TikTok Pixel', 'H5 Promotion - Kwai Pixel', 'Download Page - FB Pixel', 'Download Page - FB API', 'Download Page - TikTok Pixel', 'Download Page - Kwai Pixel'];
const ADS_GROUPS = ['FB-PWA'];
const INITIAL_ADSQ = [
  { n: 'FB-PWA', agent: 'H5 PWA', code: 'utr42ky', pixel: '485097137882765', dom: 'https://onward.casino/485097137882765', type: 'Download Page - FB Pixel', grp: 'FB-PWA', ev: [1, 1, 1, 1, 1, 1, 1] },
];

export default function Ads() {
  const { toast } = useUI();
  const [adsq, setAdsq] = useState(INITIAL_ADSQ);
  const [selGrp, setSelGrp] = useState('');
  const [checked, setChecked] = useState({});
  // filter inputs
  const [fGrp, setFGrp] = useState('');
  const [fAgent, setFAgent] = useState('');
  const [fCode, setFCode] = useState('');
  const [fName, setFName] = useState('');
  // applied query (null = show all)
  const [applied, setApplied] = useState(null);

  const groupList = selGrp ? adsq.filter((a) => a.grp === selGrp) : adsq;

  const matchesQuery = (a) => {
    if (!applied) return true;
    const q = (a.n + ' ' + a.agent + ' ' + a.code).toLowerCase();
    const { g, ag, cd, nm } = applied;
    return (!g || q.includes(g)) && (!ag || q.includes(ag)) && (!cd || q.includes(cd)) && (!nm || q.includes(nm));
  };

  const visibleList = groupList.filter(matchesQuery);

  const adsGrpSel = (g) => {
    const next = selGrp === g ? '' : g;
    setSelGrp(next);
    toast(next ? `Filtering: ${g}` : 'Showing all advertisers');
  };
  const adsQuery = () => {
    setApplied({ g: fGrp.toLowerCase(), ag: fAgent.toLowerCase(), cd: fCode.toLowerCase(), nm: fName.toLowerCase() });
    const q = (a) => {
      const s = (a.n + ' ' + a.agent + ' ' + a.code).toLowerCase();
      return (!fGrp || s.includes(fGrp.toLowerCase())) && (!fAgent || s.includes(fAgent.toLowerCase())) && (!fCode || s.includes(fCode.toLowerCase())) && (!fName || s.includes(fName.toLowerCase()));
    };
    const n = groupList.filter(q).length;
    toast(`Query: ${n} match${n === 1 ? '' : 'es'}`);
  };
  const adsDelete = () => {
    const sel = Object.keys(checked).filter((k) => checked[k]).map(Number);
    if (!sel.length) { toast('⚠ Select rows to delete'); return; }
    setAdsq((prev) => prev.filter((_, i) => !sel.includes(i)));
    setChecked({});
    toast(`Deleted ${sel.length} advertiser record${sel.length === 1 ? '' : 's'}`);
  };
  const adsCopy = (i) => {
    const link = adsq[i].dom + '?ic=' + adsq[i].code;
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(() => toast('Tracking link copied 📋 ' + link)).catch(() => toast('Link: ' + link));
    else toast('Link: ' + link);
  };
  const toggleAll = (e) => {
    const c = e.target.checked;
    const next = {};
    visibleList.forEach((a) => { next[adsq.indexOf(a)] = c; });
    setChecked(next);
  };

  const recordCount = visibleList.length;

  return (
    <>
      <div className="page-head">
        <div><h1 className="hero-h">📣 Ads Marketing</h1><div className="hero-sub" style={{ marginBottom: 0 }}>Manage advertisers, channel tracking links, pixels and tokens</div></div>
        <span className="pr"><button className="btn-search" onClick={() => toast('New Channel Group — demo')}>＋ New Channel Group</button></span>
      </div>
      <div className="grid kpi-grid">
        <div className="card kpi b"><div className="lbl">Total Advertisers</div><div className="val">{adsq.length}</div><div className="trend" style={{ color: 'var(--muted)' }}>configured</div></div>
        <div className="card kpi g"><div className="lbl">Active Channels</div><div className="val">{ADS_GROUPS.length}</div><div className="trend" style={{ color: 'var(--muted)' }}>channel groups</div></div>
        <div className="card kpi"><div className="lbl">Pixels Configured</div><div className="val">6</div><div className="trend" style={{ color: 'var(--muted)' }}>tracking active</div></div>
        <div className="card kpi" style={{ borderTopColor: '#9b30d9' }}><div className="lbl">Campaign Types</div><div className="val">{ADS_TYPES.length}</div><div className="trend" style={{ color: 'var(--muted)' }}>H5, Download, PWA…</div></div>
      </div>
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="page-head" style={{ marginBottom: 8 }}><div className="card-title" style={{ marginBottom: 0 }}>📺 Channel Groups</div>
          <span className="pr" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--fs-sm)', fontWeight: 800, color: '#c4cde0' }}>Show All <label className="switch"><input type="checkbox" checked={!selGrp} onChange={() => { setSelGrp(''); toast('Showing all advertisers'); }} /><span className="slider"></span></label></span>
        </div>
        <div>{ADS_GROUPS.length === 0
          ? <span style={{ color: 'var(--muted)' }}>No groups yet</span>
          : ADS_GROUPS.map((g) => <span key={g} className={`grp-chip ${selGrp === g ? 'sel' : ''}`} onClick={() => adsGrpSel(g)}>{g}</span>)}
        </div>
      </div>
      <div className="ads-filter">
        <span className="fl">Filter</span>
        <select value={fGrp} onChange={(e) => setFGrp(e.target.value)}><option value="">Please Select</option>{ADS_GROUPS.map((g) => <option key={g}>{g}</option>)}</select>
        <input placeholder="Agent Account" style={{ width: 130 }} value={fAgent} onChange={(e) => setFAgent(e.target.value)} />
        <input placeholder="Invite Code" style={{ width: 110 }} value={fCode} onChange={(e) => setFCode(e.target.value)} />
        <input placeholder="Channel Name" style={{ width: 130 }} value={fName} onChange={(e) => setFName(e.target.value)} />
        <span className="pr" style={{ display: 'flex', gap: 8 }}>
          <button className="btn-white" onClick={adsQuery}>🔍 Query</button>
          <button className="btn-search" style={{ padding: '8px 16px' }} onClick={() => toast('Add advertiser — demo')}>＋ Add</button>
          <button className="btn-red" onClick={adsDelete}>🗑 Delete</button>
        </span>
      </div>
      <div className="card">
        <div className="page-head" style={{ marginBottom: 12 }}><div className="card-title" style={{ marginBottom: 0 }}>📄 Advertisers</div><span className="pr" style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>{recordCount} record{recordCount === 1 ? '' : 's'}{selGrp ? ' · ' + selGrp : ''}</span></div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table style={{ minWidth: 1060 }}>
          <thead><tr><th><input type="checkbox" className="permcb" onChange={toggleAll} /></th><th>Advertiser Name</th><th>Agent Account</th><th>Invite Code</th><th>Channel Domain</th><th>Type</th><th>Actions</th></tr></thead>
          <tbody>
            {visibleList.length === 0 && (
              <tr><td colSpan={7}><div className="hist-empty">📭 No advertisers in <b>{selGrp}</b> yet — click <b>＋ Add</b> to create the first campaign record for this group.</div></td></tr>
            )}
            {visibleList.map((a) => {
              const i = adsq.indexOf(a);
              return (
                <tr key={i}>
                  <td><input type="checkbox" className="permcb adsck" checked={!!checked[i]} onChange={(e) => setChecked((prev) => ({ ...prev, [i]: e.target.checked }))} /></td>
                  <td><b>{a.n}</b></td><td style={{ color: '#aab4cc' }}>{a.agent}</td>
                  <td><span className="code-chip">{a.code}</span></td>
                  <td><span className="dom-link">{a.dom}</span></td>
                  <td><span className="type-g">{a.type}</span></td>
                  <td><button className="btn-white" style={{ padding: '6px 12px', fontSize: '.7rem' }} onClick={() => toast('Edit advertiser — demo')}>✏️ Edit</button>
                    <button className="mini-btn" onClick={() => adsCopy(i)}>📋 Copy</button>
                    <button className="ev-btn" onClick={() => toast('Events config — demo')}>📊 Events</button></td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      </div>
    </>
  );
}
