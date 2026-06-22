import { useState } from 'react';
import { useUI } from '../context/UIContext';

// Ported from V["comm-tiers"] (CTIERS / CT_RULES / CT_MILES / CT_KILL engine).
const CT_TYPES = ['GGR — Gross Gaming Revenue', 'NGR — Net Gaming Revenue', 'Turnover — Total Wager', 'Deposit Amount'];
const CT_TRIGS = ['First deposit only', 'Every deposit', 'Lifetime deposits'];
const CT_REWARDS = ['Cash (₱)', 'Bonus Credits', 'Free Spins'];
const CT_ACTIONS = ['Forfeit Bonus', 'Flag for Review', 'Hold Payout'];

const CTIERS_INIT = [
  { name: 'Level 1 — Direct Referral', sub: 'Players you personally invited', accent: 'gold', type: CT_TYPES[0], pct: 5, minDep: 100, minPlayers: 1, minTurn: 0, on: 1 },
  { name: 'Level 2 — Sub-Referral', sub: 'Players referred by your Level 1', accent: 'cyan', type: CT_TYPES[0], pct: 3, minDep: 100, minPlayers: 5, minTurn: 10000, on: 1 },
  { name: 'Level 3 — Deep Network', sub: 'Players referred by your Level 2', accent: 'purple', type: CT_TYPES[0], pct: 1, minDep: 100, minPlayers: 10, minTurn: 50000, on: 1 },
];
const RULES_INIT = [{ dep: 100, wager: 300, trigger: 'First deposit only', on: 1 }];
const MILES_INIT = [
  { tier: 'Tier 1', min: 1, type: 'Cash (₱)', amt: 50 },
  { tier: 'Tier 2', min: 3, type: 'Cash (₱)', amt: 150 },
  { tier: 'Tier 3', min: 10, type: 'Cash (₱)', amt: 500 },
  { tier: 'Tier 4', min: 25, type: 'Bonus Credits', amt: 1000 },
];
const KILL_INIT = {
  enabled: 1,
  name: { on: 1, action: 'Forfeit Bonus' },
  ip: { on: 1, thr: 1, action: 'Forfeit Bonus' },
  device: { on: 1, thr: 1, action: 'Forfeit Bonus' },
  bonus: { on: 1, max: 500, action: 'Forfeit Bonus' },
};

const ctRuleText = (r) =>
  r.on
    ? `✅ When B deposits ≥ ₱${r.dep} and wagers ≥ ₱${r.wager} → Rule triggered · Trigger: ${r.trigger}`
    : '⚪ Rule inactive — will not trigger any bonus';

function killSummary(k) {
  if (!k.enabled) {
    return (
      <>
        <span className="live" style={{ background: '#6b7280', boxShadow: 'none' }}></span>
        <b style={{ color: '#9aa4b8' }}>Kill Switch Disabled</b> — no automatic forfeiture is applied.
      </>
    );
  }
  const parts = [];
  if (k.name.on) parts.push('same name');
  if (k.ip.on) parts.push(`same IP (≥${k.ip.thr})`);
  if (k.device.on) parts.push(`same device (≥${k.device.thr})`);
  if (k.bonus.on) parts.push(`bonus exceeds ₱${k.bonus.max}`);
  return (
    <>
      <span className="live"></span>
      <b>Kill Switch Active:</b> Bonus forfeited if {parts.length ? parts.join(', ') : '— (no conditions enabled)'}.
    </>
  );
}

export default function CommTiers() {
  const { toast } = useUI();
  const [tiers, setTiers] = useState(CTIERS_INIT);
  const [rules, setRules] = useState(RULES_INIT);
  const [miles, setMiles] = useState(MILES_INIT);
  const [kill, setKill] = useState(KILL_INIT);

  const setTier = (i, patch) => setTiers((p) => p.map((t, j) => (j === i ? { ...t, ...patch } : t)));
  const setRule = (i, patch) => setRules((p) => p.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const setMile = (i, patch) => setMiles((p) => p.map((m, j) => (j === i ? { ...m, ...patch } : m)));

  const opt = (arr) => arr.map((o) => <option key={o}>{o}</option>);

  return (
    <>
      <div className="page-head">
        <div><h1 className="hero-h">🏆 Commission Tiers</h1><div className="hero-sub">Configure MLM commission rates per level and affiliate rank.</div></div>
        <button className="btn-pm-save" onClick={() => toast('Commission tiers saved ✔')}>💾 Save Tiers</button>
      </div>
      <div className="ct-grid">
        {tiers.map((t, i) => (
          <div className={`ct-card ${t.accent}`} key={i}>
            <h3>{t.name}</h3><div className="ct-sub">{t.sub}</div>
            <div className="ct-fld"><label>Commission Type</label>
              <select value={t.type} onChange={(e) => setTier(i, { type: e.target.value })}>{opt(CT_TYPES)}</select>
            </div>
            <div className="ct-fld ct-pct"><label>Commission %</label>
              <input type="number" value={t.pct} onInput={(e) => setTier(i, { pct: +e.target.value || 0 })} /><span className="suf">%</span>
            </div>
            <div className="ct-fld"><label>Min Qualifying Deposit (₱)</label>
              <input type="number" value={t.minDep} onInput={(e) => setTier(i, { minDep: +e.target.value || 0 })} />
            </div>
            <div className="ct-fld"><label>Min Players (Downline)</label>
              <input type="number" value={t.minPlayers} onInput={(e) => setTier(i, { minPlayers: +e.target.value || 0 })} />
            </div>
            <div className="ct-fld"><label>Min Turnover (₱)</label>
              <input type="number" value={t.minTurn} onInput={(e) => setTier(i, { minTurn: +e.target.value || 0 })} />
            </div>
            <label className="ct-active">
              <input type="checkbox" checked={!!t.on} onChange={(e) => setTier(i, { on: e.target.checked ? 1 : 0 })} />Enabled
            </label>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="ct-sec-head"><span className="t">🎁 Referral Bonus Trigger</span><div className="acts"><button className="btn-pm-save" onClick={() => toast('Referral bonus rules saved ✔')}>💾 Save</button></div></div>
        <div className="ct-info"><b>💡 How it works:</b> When a referred player (B) meets the minimum deposit <b>AND</b> minimum wager below, the referrer (A) automatically receives the additional bonus amount.<br />Example: <b>A</b> introduces <b>B</b> → B deposits ₱300 and wagers ₱1,000 → <span className="ex">A receives +₱35 bonus</span></div>
        <div>
          {rules.map((r, i) => (
            <div className="ct-rule" key={i}>
              <div className="ct-rule-top"><span className="ct-rule-no">Rule #{i + 1}</span>
                <label className="ct-active-inline"><input type="checkbox" checked={!!r.on} onChange={(e) => setRule(i, { on: e.target.checked ? 1 : 0 })} />Active</label>
              </div>
              <div className="ct-rule-grid">
                <div className="ct-fld"><label>Referee Min Deposit (₱)</label><input type="number" value={r.dep} onInput={(e) => setRule(i, { dep: +e.target.value || 0 })} /></div>
                <div className="ct-fld"><label>Referee Min Wager (₱)</label><input type="number" value={r.wager} onInput={(e) => setRule(i, { wager: +e.target.value || 0 })} /></div>
                <div className="ct-fld"><label>Trigger</label><select value={r.trigger} onChange={(e) => setRule(i, { trigger: e.target.value })}>{opt(CT_TRIGS)}</select></div>
              </div>
              <div className={`ct-preview ${r.on ? '' : 'off'}`}>{ctRuleText(r)}</div>
              {rules.length > 1 && <button className="ct-rule-del" onClick={() => setRules((p) => p.filter((_, j) => j !== i))}>✕ Remove Rule</button>}
            </div>
          ))}
        </div>
        <button className="ct-add" onClick={() => setRules((p) => [...p, { dep: 100, wager: 300, trigger: 'First deposit only', on: 1 }])}>+ Add Another Rule</button>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="ct-sec-head"><span className="t">🎖️ Referral Milestone Tiers</span>
          <div className="acts">
            <button className="btn-cancel" onClick={() => setMiles((p) => [...p, { tier: 'Tier ' + (p.length + 1), min: 0, type: 'Cash (₱)', amt: 0 }])}>+ Add Tier</button>
            <button className="btn-pm-save" onClick={() => toast('Milestone tiers saved ✔')}>💾 Save</button>
          </div>
        </div>
        <div className="hero-sub" style={{ marginBottom: 12 }}>When a referrer reaches the minimum number of active referrals, they receive the bonus reward.</div>
        <div>
          {miles.map((m, i) => (
            <div className="ct-mile-row" key={i}>
              <div className="ct-fld"><label>Tier</label><input className="ct-tier-lbl" value={m.tier} onChange={(e) => setMile(i, { tier: e.target.value })} /></div>
              <div className="ct-fld"><label>Min Referrals</label><input type="number" value={m.min} onChange={(e) => setMile(i, { min: +e.target.value || 0 })} /></div>
              <div className="ct-fld"><label>Reward Type</label><select value={m.type} onChange={(e) => setMile(i, { type: e.target.value })}>{opt(CT_REWARDS)}</select></div>
              <div className="ct-fld"><label>Reward Amount</label><input className="ct-amt" type="number" value={m.amt} onChange={(e) => setMile(i, { amt: +e.target.value || 0 })} /></div>
              <button className="ct-mile-del" onClick={() => setMiles((p) => p.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
        </div>
      </div>

      <div className="card ct-kill" style={{ marginTop: 18 }}>
        <div className="ct-kill-head">
          <div className="ct-kill-title"><span className="dot"></span><div>KILL SWITCH — REFERRAL FRAUD DETECTION<span className="sub">Automatically forfeit bonus if referrer and referee share identifying info</span></div></div>
          <label className="ct-kill-en">Enabled<label className="switch green"><input type="checkbox" checked={!!kill.enabled} onChange={(e) => setKill((k) => ({ ...k, enabled: e.target.checked ? 1 : 0 }))} /><span className="slider"></span></label></label>
        </div>
        <div className="ct-warn">⚠️ When any of the enabled conditions below are matched between the referrer and referee, the referral bonus will be <b>automatically forfeited</b> and flagged for admin review.</div>

        <div className="ct-krow"><div className="ct-krow-main">
          <div className="ct-krow-l"><label className="switch green"><input type="checkbox" checked={!!kill.name.on} onChange={(e) => setKill((k) => ({ ...k, name: { ...k.name, on: e.target.checked ? 1 : 0 } }))} /><span className="slider"></span></label>
            <div className="ct-krow-nm">👤 Same Full Name<span className="d">Referrer and referee share the same registered name</span></div></div>
          <div className="ct-krow-act"><select value={kill.name.action} onChange={(e) => setKill((k) => ({ ...k, name: { ...k.name, action: e.target.value } }))}>{opt(CT_ACTIONS)}</select></div>
        </div></div>

        <div className="ct-krow"><div className="ct-krow-main">
          <div className="ct-krow-l"><label className="switch green"><input type="checkbox" checked={!!kill.ip.on} onChange={(e) => setKill((k) => ({ ...k, ip: { ...k.ip, on: e.target.checked ? 1 : 0 } }))} /><span className="slider"></span></label>
            <div className="ct-krow-nm">🌐 Same IP Address<span className="d">Both accounts registered or logged in from the same IP</span></div></div>
          <div className="ct-krow-act"><select value={kill.ip.action} onChange={(e) => setKill((k) => ({ ...k, ip: { ...k.ip, action: e.target.value } }))}>{opt(CT_ACTIONS)}</select></div>
        </div><div className="ct-thr">Trigger threshold:<input type="number" value={kill.ip.thr} onInput={(e) => setKill((k) => ({ ...k, ip: { ...k.ip, thr: +e.target.value || 0 } }))} />account(s) from same IP</div></div>

        <div className="ct-krow"><div className="ct-krow-main">
          <div className="ct-krow-l"><label className="switch green"><input type="checkbox" checked={!!kill.device.on} onChange={(e) => setKill((k) => ({ ...k, device: { ...k.device, on: e.target.checked ? 1 : 0 } }))} /><span className="slider"></span></label>
            <div className="ct-krow-nm">🖥️ Same Device<span className="d">Both accounts share the same device fingerprint / UUID</span></div></div>
          <div className="ct-krow-act"><select value={kill.device.action} onChange={(e) => setKill((k) => ({ ...k, device: { ...k.device, action: e.target.value } }))}>{opt(CT_ACTIONS)}</select></div>
        </div><div className="ct-thr">Trigger threshold:<input type="number" value={kill.device.thr} onInput={(e) => setKill((k) => ({ ...k, device: { ...k.device, thr: +e.target.value || 0 } }))} />account(s) from same device</div></div>

        <div className="ct-krow"><div className="ct-krow-main">
          <div className="ct-krow-l"><label className="switch green"><input type="checkbox" checked={!!kill.bonus.on} onChange={(e) => setKill((k) => ({ ...k, bonus: { ...k.bonus, on: e.target.checked ? 1 : 0 } }))} /><span className="slider"></span></label>
            <div className="ct-krow-nm">💰 Bonus Exceeds Threshold<span className="d">Forfeit if total referral bonus claimed exceeds the limit</span></div></div>
          <div className="ct-krow-act"><select value={kill.bonus.action} onChange={(e) => setKill((k) => ({ ...k, bonus: { ...k.bonus, action: e.target.value } }))}>{opt(CT_ACTIONS)}</select></div>
        </div><div className="ct-thr">Max bonus per referrer: ₱<input type="number" value={kill.bonus.max} onInput={(e) => setKill((k) => ({ ...k, bonus: { ...k.bonus, max: +e.target.value || 0 } }))} />then forfeit any excess</div></div>

        <div className="ct-kill-sum">{killSummary(kill)}</div>
        <button className="ct-kill-save" onClick={() => toast('Kill switch settings saved ✔')}>🔴 Save Kill Switch Settings</button>
      </div>
    </>
  );
}
