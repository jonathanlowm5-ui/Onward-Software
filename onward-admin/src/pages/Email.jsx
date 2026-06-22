import { useState } from 'react';
import { useUI } from '../context/UIContext';

const INITIAL_EMAILQ = [
  { sub: 'Your Weekly Cashback is Ready!', tg: 'All Active', rc: '18,420', at: 'Mon 08:00', op: '41.2%', ctr: '18.4%', st: 'sent' },
  { sub: 'New VIP Benefits Unlocked 💎', tg: 'VIP Players', rc: '1,284', at: 'Wed 10:00', op: '58.3%', ctr: '24.1%', st: 'sent' },
  { sub: 'We Miss You — 50 Free Spins Inside', tg: 'Inactive 14d', rc: '3,842', at: 'Sat 12:00', op: '—', ctr: '—', st: 'sched' },
];

export default function Email() {
  const { toast } = useUI();
  const [emailq, setEmailq] = useState(INITIAL_EMAILQ);
  const [statusF, setStatusF] = useState('');

  const cancel = (idx) => {
    setEmailq((prev) => prev.filter((_, i) => i !== idx));
    toast('Scheduled email cancelled');
  };

  return (
    <>
      <div className="page-head">
        <div><h1 className="hero-h">📧 Email Campaign</h1><div className="hero-sub" style={{ marginBottom: 0 }}>Design and send targeted email campaigns</div></div>
        <span className="pr"><button className="btn-search" onClick={() => toast('New Email Campaign — demo')}>＋ New Email Campaign</button></span>
      </div>
      <div className="grid kpi-grid">
        <div className="card kpi b"><div className="lbl">Emails Sent Today</div><div className="val">8,420</div></div>
        <div className="card kpi g"><div className="lbl">Open Rate</div><div className="val">34.8%</div></div>
        <div className="card kpi"><div className="lbl">Click Rate</div><div className="val">12.4%</div></div>
        <div className="card kpi r"><div className="lbl">Unsubscribes</div><div className="val">24</div></div>
      </div>
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="page-head" style={{ marginBottom: 12 }}><div className="card-title" style={{ marginBottom: 0 }}>Email Campaigns</div>
          <span className="pr" style={{ display: 'flex', gap: 8 }}>
            <select className="qsearch" style={{ width: 'auto' }} value={statusF} onChange={(e) => setStatusF(e.target.value)}><option value="">All Status</option><option value="sent">Sent</option><option value="sched">Scheduled</option></select>
            <button className="mini-btn" onClick={() => toast('Exported! ⬇ email-campaigns.csv')}>⬇ Export</button>
          </span>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table style={{ minWidth: 980 }}>
          <thead><tr><th>Subject</th><th>Target</th><th>Recipients</th><th>Sent</th><th>Open Rate</th><th>CTR</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{emailq.map((c, i) => (
            <tr key={i} style={{ display: !statusF || c.st === statusF ? '' : 'none' }}>
              <td><b>{c.sub}</b></td><td>{c.tg}</td><td>{c.rc}</td><td>{c.at}</td>
              <td style={{ color: c.op === '—' ? 'var(--muted)' : 'var(--green)', fontWeight: 800 }}>{c.op}</td>
              <td style={{ color: c.ctr === '—' ? 'var(--muted)' : 'var(--gold)', fontWeight: 800 }}>{c.ctr}</td>
              <td>{c.st === 'sent' ? <span className="sms-sent">Sent</span> : <span className="sms-sched">Scheduled</span>}</td>
              <td>{c.st === 'sent'
                ? <button className="mini-btn" onClick={() => toast(`Campaign report: ${c.sub.replace(/'/g, '')} — ${c.op} opens · ${c.ctr} clicks`)}>View</button>
                : <>
                  <button className="mini-btn" onClick={() => toast('Edit campaign — demo')}>Edit</button>{' '}
                  <button className="btn-cancel-red" onClick={() => cancel(i)}>Cancel</button>
                </>}
              </td>
            </tr>
          ))}</tbody>
        </table></div>
      </div>
    </>
  );
}
