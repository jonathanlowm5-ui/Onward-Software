import { useEffect, useState } from 'react';
import { Table, BOk, BPend, BBad, BInfo } from '../components/ui.jsx';
import { useUI } from '../context/UIContext';
import { listWithdrawals, approveTransaction, rejectTransaction } from '../services/walletService';

// Original static demo rows (WDQ) — used as offline fallback. Badge cells are
// produced at render time so they match the original markup.
const DEMO_WDS = [
  { id: 'WD-202506-0001', pl: 'LGX10422PHP', m: 'GCash', amt: '₱25,000', risk: 'low', st: 'pending' },
  { id: 'WD-202506-0002', pl: 'LGX07733PHP', m: 'Bank', amt: '₱85,000', risk: 'med', st: 'pending' },
  { id: 'WD-202506-0003', pl: 'LGX06120CNY', m: 'USDT', amt: '¥9,000', risk: 'high', st: 'review' },
  { id: 'WD-202506-0004', pl: 'LGX05518PHP', m: 'GCash', amt: '₱2,500', risk: 'low', st: 'paid' },
];

const riskBadge = (r) =>
  r === 'low' ? <BOk>Low</BOk> : r === 'med' ? <BPend>Med</BPend> : <BBad>High</BBad>;

const wdBadge = (st) =>
  st === 'paid' || st === 'approved' ? <BOk>Paid</BOk>
  : st === 'pending' ? <BPend>Pending</BPend>
  : st === 'review' ? <BPend>Review</BPend>
  : st === 'rejected' ? <BBad>Rejected</BBad>
  : <BInfo>{st || '—'}</BInfo>;

export default function Withdrawals() {
  const { toast } = useUI();
  const [wds, setWds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await listWithdrawals();
        const list = Array.isArray(data) ? data : data?.items || [];
        if (alive) setWds(list.map((w) => ({
          id: w.id ?? w.reqId,
          pl: w.username ?? w.player ?? w.pl ?? w.playerId,
          m: w.method ?? w.m,
          amt: typeof w.amount === 'number' ? '₱' + w.amount.toLocaleString() : (w.amount ?? w.amt),
          risk: w.risk ?? 'low',
          st: w.status ?? w.st,
        })));
      } catch {
        if (alive) setWds(DEMO_WDS);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const act = async (i, ok) => {
    const w = wds[i];
    try {
      await (ok ? approveTransaction(w.id) : rejectTransaction(w.id));
    } catch {
      /* offline demo — still reflect locally */
    }
    setWds((prev) => prev.map((x, idx) => (idx === i ? { ...x, st: ok ? 'paid' : 'rejected' } : x)));
    toast(ok
      ? 'Withdrawal approved ✔ ' + w.id + ' paid ' + w.amt
      : 'Withdrawal rejected ✗ ' + w.id);
  };

  const pend = wds.filter((w) => w.st === 'pending' || w.st === 'review').length;

  const cols = ['Req ID', 'Player', 'Method', 'Amount', 'Risk', 'Status', 'Actions'];
  const rows = wds.map((w, i) => [
    w.id, w.pl, w.m, w.amt, riskBadge(w.risk), wdBadge(w.st),
    <>
      <button className="mini-btn gold" onClick={() => toast('Detail ' + w.id + ' — demo')}>📋 Detail</button>
      {(w.st === 'pending' || w.st === 'review') && (
        <>
          {' '}
          <button className="mini-btn green" onClick={() => act(i, 1)}>Approve</button>{' '}
          <button className="mini-btn red" onClick={() => act(i, 0)}>Reject</button>
        </>
      )}
    </>,
  ]);

  return (
    <>
      <h1 className="hero-h">Withdrawals</h1>
      <div className="hero-sub">{pend} request{pend === 1 ? '' : 's'} pending approval.</div>
      <div className="card">
        <Table cols={cols} rows={rows} />
        {loading && null}
      </div>
    </>
  );
}
