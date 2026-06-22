import { useState } from 'react';
import { useUI } from '../context/UIContext';

const RADS_OVERALL = { reg: 1240, fd: 680, bal: 62400, depU: 4820, depAmt: "98,340.50", depCnt: 6210, wdU: 1840, wdAmt: "-71,200", wdCnt: 2140, diff: "27,140.50", inc: "8,450.75" };
const RADS_DIRECT = { reg: 940, fd: 520, fdAmt: 48600, depU: 3640, depAmt: "76,800.25", depCnt: 4820, wdU: 1380, wdAmt: "-56,400", wdCnt: 1640, diff: "20,400.25", inc: "6,320.50" };
const RADS_VIRAL = { reg: 300, fd: 160, bal: 13800, depU: 1180, depAmt: "21,540.25", depCnt: 1390, wdU: 460, wdAmt: "-14,800", wdCnt: 500, diff: "6,740.25", inc: "2,130.25" };

const radsRow = (cur, d, balVal) => (
  <tr>
    <td className="name">{cur}</td>
    <td className="rep-blue">{d.reg.toLocaleString()}</td>
    <td className="rep-blue">{d.fd.toLocaleString()}</td>
    <td className="rep-mut">{balVal.toLocaleString()}</td>
    <td className="rep-blue">{d.depU.toLocaleString()}</td>
    <td className="rep-g">{d.depAmt}</td>
    <td className="rep-mut">{d.depCnt.toLocaleString()}</td>
    <td className="rep-mut">{d.wdU.toLocaleString()}</td>
    <td className="rep-red">{d.wdAmt}</td>
    <td className="rep-mut">{d.wdCnt.toLocaleString()}</td>
    <td className="rep-green">{d.diff}</td>
    <td style={{ color: '#ff8c42', fontWeight: 800 }}>{d.inc}</td>
  </tr>
);

export default function AdsEval() {
  const { toast } = useUI();
  const [cur, setCur] = useState('PHP');

  const radsRefresh = () => toast("Ads evaluation refreshed ↻ 1,240 registrations · ₱27,140.50 net profit");
  const radsQueryRun = () => toast("Query run 🔍 " + cur + " · All Channel Groups");

  return (
    <>
      <div className="rep-head"><div className="grow"><h1 className="hero-h">📣 Ads Evaluation</h1><div className="hero-sub" style={{ marginBottom: 0 }}>Analyse campaign performance — registrations, deposits, withdrawals and incentives</div></div>
        <div className="acts"><button className="rep-btn" onClick={radsRefresh}>↻ Refresh</button></div></div>
      <div className="grid kpi-grid">
        <div className="card kpi b"><div className="lbl">Total Registrations</div><div className="val">1,240</div><div className="trend" style={{ color: 'var(--muted)' }}>across all campaigns</div></div>
        <div className="card kpi g"><div className="lbl">Total Deposit Amount</div><div className="val">₱98,340.50</div><div className="trend" style={{ color: 'var(--muted)' }}>overall</div></div>
        <div className="card kpi"><div className="lbl">Net Dep-Wd Diff</div><div className="val">₱27,140.50</div><div className="trend" style={{ color: 'var(--muted)' }}>platform profit</div></div>
        <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">Total Incentives</div><div className="val">₱8,450.75</div><div className="trend" style={{ color: 'var(--muted)' }}>bonuses given</div></div>
      </div>
      <div className="ads-filters">
        <div className="fld2"><label>Currency</label><select value={cur} onChange={(e) => setCur(e.target.value)}><option>PHP</option><option>VND</option><option>CNY</option></select></div>
        <div className="fld2"><label>Channel Group</label><select><option>All Channel Groups</option><option>FB-PWA</option><option>Google SEA</option><option>TikTok PH</option><option>Organic</option></select></div>
        <div className="fld2"><label>From</label><input type="datetime-local" /></div>
        <div className="fld2"><label>To</label><input type="datetime-local" /></div>
        <div className="fld2"><label>Timezone</label><select><option>UTC+08:00 (Manila)</option><option>UTC+07:00 (Hanoi)</option><option>UTC+08:00 (Beijing)</option></select></div>
        <button className="qbtn" onClick={radsQueryRun}>🔍 Query</button>
      </div>
      <div className="ads-sec">
        <div className="ads-sech"><span>📊</span><span className="t">Overall Results</span><span className="tag ads-tag-all">All campaigns combined</span></div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table className="rep-tbl" style={{ minWidth: '1180px' }}>
          <thead><tr><th>Currency</th><th>Registrations</th><th>First Deposits</th><th>Balance Amt</th><th>Dep. Users</th><th>Dep. Amount</th><th>Dep. Count</th><th>WD Users</th><th>WD Amount</th><th>WD Count</th><th>Dep-WD Diff</th><th>Incentive</th></tr></thead>
          <tbody>{radsRow(cur, RADS_OVERALL, RADS_OVERALL.bal)}</tbody>
        </table></div>
      </div>
      <div className="ads-sec">
        <div className="ads-sech"><span>👤</span><span className="t">Direct Referral Results</span><span className="tag ads-tag-direct">Level 1 referrals only</span></div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table className="rep-tbl" style={{ minWidth: '1180px' }}>
          <thead><tr><th>Currency</th><th>Registrations</th><th>First Deposits</th><th>First Dep. Amt</th><th>Dep. Users</th><th>Dep. Amount</th><th>Dep. Count</th><th>WD Users</th><th>WD Amount</th><th>WD Count</th><th>Dep-WD Diff</th><th>Incentive</th></tr></thead>
          <tbody>{radsRow(cur, RADS_DIRECT, RADS_DIRECT.fdAmt)}</tbody>
        </table></div>
      </div>
      <div className="ads-sec">
        <div className="ads-sech"><span>🌀</span><span className="t">Viral / Fission Results</span><span className="tag ads-tag-viral">Indirect referral chains</span></div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table className="rep-tbl" style={{ minWidth: '1180px' }}>
          <thead><tr><th>Currency</th><th>Registrations</th><th>First Deposits</th><th>Balance Amt</th><th>Dep. Users</th><th>Dep. Amount</th><th>Dep. Count</th><th>WD Users</th><th>WD Amount</th><th>WD Count</th><th>Dep-WD Diff</th><th>Incentive</th></tr></thead>
          <tbody>{radsRow(cur, RADS_VIRAL, RADS_VIRAL.bal)}</tbody>
        </table></div>
      </div>
    </>
  );
}
