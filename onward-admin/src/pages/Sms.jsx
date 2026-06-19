import { useState } from 'react';
import { useUI } from '../context/UIContext';

const INITIAL_SMSQ = [
  { n: 'Welcome Back Inactive', seg: 'Inactive 7 days', rc: '4,821', at: 'Today 10:00', dl: '98.1%', ctr: '14.2%', st: 'sent' },
  { n: 'Weekend Bonus Alert', seg: 'All Active', rc: '12,450', at: 'Fri 09:00', dl: '96.8%', ctr: '22.1%', st: 'sent' },
  { n: 'VIP Exclusive Drop', seg: 'VIP Level+', rc: '286', at: 'Tomorrow 14:00', dl: '—', ctr: '—', st: 'sched' },
  { n: 'New Game Launch', seg: 'Slots Players', rc: '—', at: 'Draft', dl: '—', ctr: '—', st: 'draft' },
];
const SEG_SIZE = { 'All Players': '18,204', 'All Active': '12,450', 'Inactive 7 days': '4,821', 'VIP Level+': '286', 'Slots Players': '7,902', 'New Players (30d)': '1,180' };

function StatusChip({ st }) {
  if (st === 'sent') return <span className="sms-sent">Sent</span>;
  if (st === 'sched') return <span className="sms-sched">Scheduled</span>;
  return <span className="sms-draft">Draft</span>;
}

export default function Sms() {
  const { toast } = useUI();
  const [smsq, setSmsq] = useState(INITIAL_SMSQ);
  const [statusF, setStatusF] = useState('');

  const cancel = (idx) => {
    const name = smsq[idx].n;
    setSmsq((prev) => prev.map((c, i) => (i === idx ? { ...c, st: 'draft', at: 'Draft', rc: '—' } : c)));
    toast(`Campaign cancelled — moved to drafts: ${name}`);
  };
  const sendDraft = (idx) => {
    const c = smsq[idx];
    const rc = SEG_SIZE[c.seg] || '1,000';
    setSmsq((prev) => prev.map((x, i) => (i === idx ? { ...x, st: 'sent', rc, at: 'Just now', dl: '99.0%', ctr: '0.0%' } : x)));
    toast(`Campaign sent 🚀 ${c.n} → ${rc} recipients`);
  };

  return (
    <>
      <div className="page-head">
        <div><h1 className="hero-h">💬 SMS Campaign</h1><div className="hero-sub" style={{ marginBottom: 0 }}>Send SMS messages to targeted player segments</div></div>
        <span className="pr"><button className="btn-search" onClick={() => toast('New SMS Campaign — demo')}>＋ New SMS Campaign</button></span>
      </div>
      <div className="grid kpi-grid">
        <div className="card kpi b"><div className="lbl">Sent Today</div><div className="val">1,248</div></div>
        <div className="card kpi g"><div className="lbl">Delivered</div><div className="val">97.2%</div></div>
        <div className="card kpi"><div className="lbl">Click-Throughs</div><div className="val">342</div></div>
        <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">Opt-Outs</div><div className="val">12</div></div>
      </div>
      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="page-head" style={{ marginBottom: 12 }}><div className="card-title" style={{ marginBottom: 0 }}>SMS Campaigns</div>
          <span className="pr"><select className="qsearch" style={{ width: 'auto' }} value={statusF} onChange={(e) => setStatusF(e.target.value)}><option value="">All Status</option><option value="sent">Sent</option><option value="sched">Scheduled</option><option value="draft">Draft</option></select></span>
        </div>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table style={{ minWidth: 960 }}>
          <thead><tr><th>Campaign</th><th>Target Segment</th><th>Recipients</th><th>Sent At</th><th>Delivered</th><th>CTR</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{smsq.map((c, i) => (
            <tr key={i} style={{ display: !statusF || c.st === statusF ? '' : 'none' }}>
              <td><b>{c.n}</b></td><td>{c.seg}</td><td>{c.rc}</td><td>{c.at}</td>
              <td style={{ color: c.dl === '—' ? 'var(--muted)' : 'var(--green)', fontWeight: 800 }}>{c.dl}</td>
              <td style={{ color: c.ctr === '—' ? 'var(--muted)' : 'var(--gold)', fontWeight: 800 }}>{c.ctr}</td>
              <td><StatusChip st={c.st} /></td>
              <td>{c.st === 'sent'
                ? <button className="mini-btn" onClick={() => toast(`Campaign report: ${c.n} — ${c.rc} recipients · ${c.dl} delivered · ${c.ctr} CTR`)}>View</button>
                : c.st === 'sched'
                  ? <>
                    <button className="mini-btn" onClick={() => toast(`Edit campaign: ${c.n} — demo`)}>Edit</button>{' '}
                    <button className="btn-cancel-red" onClick={() => cancel(i)}>Cancel</button>
                  </>
                  : <>
                    <button className="mini-btn" onClick={() => toast(`Edit campaign: ${c.n} — demo`)}>Edit</button>{' '}
                    <button className="btn-send-gold" onClick={() => sendDraft(i)}>Send</button>
                  </>}
              </td>
            </tr>
          ))}</tbody>
        </table></div>
      </div>
    </>
  );
}
