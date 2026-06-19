import { useState, useRef } from 'react';
import { useUI } from '../context/UIContext';

const NAMES = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Sapphire', 'Ruby', 'Emerald', 'Diamond', 'Royal', 'Legend'];
const ICS = ['🟤', '⚪', '🟡', '💠', '🔵', '🔴', '🟢', '💎', '👑', '🏆'];
const DEP = [1000, 5000, 15000, 50000, 120000, 250000, 500000, 1000000, 2500000, 5000000];
const EXP = [500, 2500, 7500, 25000, 60000, 125000, 250000, 500000, 1250000, 2500000];
const BONUS = [88, 188, 388, 888, 1888, 3888, 8888, 18888, 88888, 188888];
const W_MAX_DAY = [5000, 10000, 20000, 50000, 100000, 200000, 400000, 800000, 1500000, 3000000];
const W_TX_DAY = [3, 3, 4, 5, 6, 8, 10, 12, 15, 20];
const W_MIN = [200, 200, 200, 500, 500, 500, 1000, 1000, 1000, 1000];
const W_MAX_SINGLE = [5000, 10000, 20000, 50000, 100000, 200000, 400000, 800000, 1500000, 3000000];

const initVips = () =>
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((l) => ({
    lv: l,
    n: NAMES[l - 1],
    ic: ICS[l - 1],
    dep: DEP[l - 1],
    exp: EXP[l - 1],
    d: +(l * 0.5).toFixed(1),
    w: +(l * 0.8).toFixed(1),
    m: +(l * 1.2).toFixed(1),
    rb: +(l * 0.3).toFixed(1),
    mgr: l >= 10 ? 'Dedicated' : l >= 7 ? 'Yes' : '—',
    bonus: BONUS[l - 1],
    wMaxDay: W_MAX_DAY[l - 1],
    wTxDay: W_TX_DAY[l - 1],
    wMin: W_MIN[l - 1],
    wMaxSingle: W_MAX_SINGLE[l - 1],
  }));

const icHtml = (v) => (v.icImg ? <img className="vip-ic-img" src={v.icImg} alt="" /> : v.ic);

export default function Vip() {
  const { toast } = useUI();
  const [vips, setVips] = useState(initVips);
  const [cfgOpen, setCfgOpen] = useState(true);
  const [editIdx, setEditIdx] = useState(-1);
  const [draft, setDraft] = useState(null);
  const [icTmp, setIcTmp] = useState(undefined); // undefined=unchanged, null=removed, string=new
  const fileRef = useRef(null);

  const num = (x) => parseFloat(String(x).replace(/[^0-9.]/g, '')) || 0;

  const cfgSet = (i, f, val) => {
    setVips((prev) => {
      const next = prev.map((x, j) => (j === i ? { ...x } : x));
      const v = next[i];
      if (f === 'n' || f === 'mgr') v[f] = String(val).trim() || v[f];
      else v[f] = parseFloat(String(val).replace(/[^0-9.]/g, '')) || 0;
      toast('VIP criteria saved ✔ ' + v.ic + ' V' + v.lv);
      return next;
    });
  };

  const openEdit = (i) => {
    setEditIdx(i);
    setDraft({ ...vips[i] });
    setIcTmp(undefined);
  };
  const closeEdit = () => setEditIdx(-1);

  const setDraftField = (f, val) => setDraft((d) => ({ ...d, [f]: val }));

  const icUpload = (inp) => {
    const f = inp.files && inp.files[0];
    if (!f) return;
    if (f.size > 300 * 1024) { toast('⚠ Image too large — keep it under 300 KB'); inp.value = ''; return; }
    const r = new FileReader();
    r.onload = () => { setIcTmp(r.result); toast('Icon image loaded — press Save Tier 💾'); };
    r.readAsDataURL(f);
    inp.value = '';
  };
  const icRemove = () => { setIcTmp(null); toast('Image removed — emoji icon will be used'); };

  const save = () => {
    setVips((prev) => prev.map((x, j) => {
      if (j !== editIdx) return x;
      const v = { ...x };
      v.n = String(draft.n).trim() || v.n;
      v.ic = String(draft.ic).trim() || v.ic;
      if (icTmp !== undefined) { if (icTmp) v.icImg = icTmp; else delete v.icImg; }
      v.wMaxDay = num(draft.wMaxDay); v.wTxDay = num(draft.wTxDay); v.wMin = num(draft.wMin); v.wMaxSingle = num(draft.wMaxSingle);
      v.dep = num(draft.dep); v.exp = num(draft.exp);
      v.d = num(draft.d); v.w = num(draft.w); v.m = num(draft.m); v.rb = num(draft.rb);
      v.mgr = draft.mgr; v.bonus = num(draft.bonus);
      toast('VIP criteria saved successfully! ✔ ' + v.ic + ' V' + v.lv + ' ' + v.n);
      return v;
    }));
    closeEdit();
  };

  // icon preview in modal
  const prev = draft && (icTmp !== undefined
    ? (icTmp ? <img src={icTmp} alt="" /> : (draft.ic || vips[editIdx].ic))
    : icHtml(vips[editIdx] || draft));

  return (
    <>
      <h1 className="hero-h">VIP Level</h1>
      <div className="hero-sub">10-level VIP configuration — deposit/exp targets, cashback, rebate &amp; level bonuses. <b style={{ color: 'var(--gold)' }}>Click any level to edit.</b></div>
      <div className="grid vip-grid">
        {vips.map((v, i) => (
          <div className="vip-card" onClick={() => openEdit(i)} key={i}>
            <div className="lv">{icHtml(v)} V{v.lv}</div><div className="nm">{v.n}</div>
            <div className="pc">Cashback <b style={{ color: 'var(--gold)' }}>{v.d.toFixed(1)}%</b><br />Rebate <b style={{ color: 'var(--green)' }}>{v.rb.toFixed(1)}%</b></div>
            <span className="edit-hint">✏️ tap to edit</span>
          </div>
        ))}
      </div>
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className={`cfg-head card-title ${cfgOpen ? '' : 'closed'}`} style={{ marginBottom: cfgOpen ? '12px' : '0' }} onClick={() => setCfgOpen((o) => !o)}>VIP Tier Configuration <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)', fontWeight: 700 }}>· edit cells directly</span><span className="caret">▲</span></div>
        <div id="vipCfgBody" className={cfgOpen ? '' : 'hide'}>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table style={{ minWidth: '1080px' }}>
            <thead><tr><th>Tier</th><th>VIP Level</th><th>Deposit Target<br />to Level Up (₱)</th><th>VIP Points (EXP)<br />to Level Up</th><th>Daily<br />Cashback %</th><th>Weekly<br />Cashback %</th><th>Monthly<br />Cashback %</th><th className="rb-blue">Rebate<br />%</th><th>VIP<br />Manager</th><th>Level<br />Bonus</th><th>Edit</th></tr></thead>
            <tbody>{vips.map((v, i) => (
              <tr key={i}>
                <td>{icHtml(v)} <b style={{ color: 'var(--gold)' }}>V{v.lv}</b></td>
                <td><input className="cfg-in" defaultValue={v.n} onChange={(e) => cfgSet(i, 'n', e.target.value)} /></td>
                <td><input className="cfg-in" inputMode="numeric" defaultValue={v.dep} onChange={(e) => cfgSet(i, 'dep', e.target.value)} /></td>
                <td><input className="cfg-in" inputMode="numeric" defaultValue={v.exp} onChange={(e) => cfgSet(i, 'exp', e.target.value)} /></td>
                <td><input className="cfg-in sm" inputMode="decimal" defaultValue={v.d} onChange={(e) => cfgSet(i, 'd', e.target.value)} /><span className="cfg-pct">%</span></td>
                <td><input className="cfg-in sm" inputMode="decimal" defaultValue={v.w} onChange={(e) => cfgSet(i, 'w', e.target.value)} /><span className="cfg-pct">%</span></td>
                <td><input className="cfg-in sm" inputMode="decimal" defaultValue={v.m} onChange={(e) => cfgSet(i, 'm', e.target.value)} /><span className="cfg-pct">%</span></td>
                <td><input className="cfg-in sm" inputMode="decimal" defaultValue={v.rb} onChange={(e) => cfgSet(i, 'rb', e.target.value)} style={{ color: 'var(--blue)' }} /><span className="cfg-pct">%</span></td>
                <td><select className="cfg-sel" defaultValue={v.mgr} onChange={(e) => cfgSet(i, 'mgr', e.target.value)}><option>—</option><option>Yes</option><option>Dedicated</option></select></td>
                <td><input className="cfg-in" inputMode="numeric" defaultValue={v.bonus} onChange={(e) => cfgSet(i, 'bonus', e.target.value)} /></td>
                <td><button className="mini-btn gold" onClick={() => openEdit(i)}>✏️ Edit</button></td>
              </tr>
            ))}</tbody>
          </table></div>
        </div>
      </div>

      {editIdx >= 0 && draft && (
        <div className="modal-ov show" id="vipModal" onClick={(e) => { if (e.target === e.currentTarget) closeEdit(); }}>
          <div className="pm-modal" style={{ maxWidth: '480px' }}>
            <div className="pm-head"><span style={{ fontSize: '1.3rem' }}>💎</span>
              <span><div className="nm" id="vipTitle">✏️ Edit Tier — {prev} V{draft.lv} {draft.n}</div><div className="meta">VIP Tier Configuration</div></span>
              <button className="kyc-x" style={{ marginLeft: 'auto' }} onClick={closeEdit}>✕</button></div>
            <div className="pm-body" id="vipBody">
              <div className="vip-name-row">
                <div className="pm-fld icon-zone"><label>Icon</label>
                  <div className="icon-prev" id="vipIcPrev">{prev}</div>
                  <input className="ic-emoji-in" id="vF_ic" value={draft.ic} maxLength={4} onChange={(e) => setDraftField('ic', e.target.value)} title="Type an emoji" />
                  <div className="ic-btns">
                    <button type="button" onClick={() => fileRef.current && fileRef.current.click()}>📁 PNG</button>
                    <button onClick={icRemove}>✕</button>
                  </div>
                  <input ref={fileRef} type="file" id="vF_icFile" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={(e) => icUpload(e.target)} />
                </div>
                <div className="pm-fld" style={{ flex: 1 }}><label>Tier Name</label><input id="vF_n" value={draft.n} onChange={(e) => setDraftField('n', e.target.value)} style={{ fontWeight: 800, fontSize: '1.05rem', padding: '13px 12px' }} /></div>
              </div>
              <div className="wl-title">💸 Withdrawal Limits</div>
              <div className="wl-grid" style={{ marginBottom: '6px' }}>
                <div className="wl-box wl-gold"><div className="l">Max Daily Withdraw</div><div className="wl-in"><span className="pre">₱</span><input inputMode="numeric" value={draft.wMaxDay} onChange={(e) => setDraftField('wMaxDay', e.target.value)} /></div></div>
                <div className="wl-box wl-blue"><div className="l">Max Transactions / Day</div><div className="wl-in"><span className="pre">#</span><input inputMode="numeric" value={draft.wTxDay} onChange={(e) => setDraftField('wTxDay', e.target.value)} /></div></div>
                <div className="wl-box minw wl-green"><div className="l">Min Withdraw</div><div className="wl-in"><span className="pre">₱</span><input inputMode="numeric" value={draft.wMin} onChange={(e) => setDraftField('wMin', e.target.value)} /></div></div>
                <div className="wl-box wl-orange"><div className="l">Max Withdraw (Single)</div><div className="wl-in"><span className="pre">₱</span><input inputMode="numeric" value={draft.wMaxSingle} onChange={(e) => setDraftField('wMaxSingle', e.target.value)} /></div></div>
              </div>
              <div className="wl-title">⚙️ Tier Settings</div>
              <div className="pm-grid">
                <div className="pm-fld"><label>VIP Level</label><div className="ro" style={{ fontWeight: 800, padding: '10px 0', color: 'var(--gold)' }}>V{draft.lv}</div></div>
                <div className="pm-fld"><label>Deposit Target to Level Up (₱)</label><input inputMode="numeric" value={draft.dep} onChange={(e) => setDraftField('dep', e.target.value)} /></div>
                <div className="pm-fld"><label>VIP Points (EXP) to Level Up</label><input inputMode="numeric" value={draft.exp} onChange={(e) => setDraftField('exp', e.target.value)} /></div>
                <div className="pm-fld"><label>Daily Cashback %</label><input inputMode="decimal" value={draft.d} onChange={(e) => setDraftField('d', e.target.value)} /></div>
                <div className="pm-fld"><label>Weekly Cashback %</label><input inputMode="decimal" value={draft.w} onChange={(e) => setDraftField('w', e.target.value)} /></div>
                <div className="pm-fld"><label>Monthly Cashback %</label><input inputMode="decimal" value={draft.m} onChange={(e) => setDraftField('m', e.target.value)} /></div>
                <div className="pm-fld"><label>Rebate %</label><input inputMode="decimal" value={draft.rb} onChange={(e) => setDraftField('rb', e.target.value)} /></div>
                <div className="pm-fld"><label>VIP Manager</label><select value={draft.mgr} onChange={(e) => setDraftField('mgr', e.target.value)}><option>—</option><option>Yes</option><option>Dedicated</option></select></div>
                <div className="pm-fld"><label>Claimable Level Bonus (₱)</label><input inputMode="numeric" value={draft.bonus} onChange={(e) => setDraftField('bonus', e.target.value)} /></div>
              </div>
            </div>
            <div className="pm-foot"><button className="btn-cancel" onClick={closeEdit}>Cancel</button><button className="btn-pm-save" onClick={save}>💾 Save Tier</button></div>
          </div>
        </div>
      )}
    </>
  );
}
