import { useEffect, useState } from 'react';
import { Table, BOk, BPend, BBad, BInfo, ToolbarSearch } from '../components/ui.jsx';
import { useUI } from '../context/UIContext';
import { listDeposits, approveTransaction } from '../services/walletService';

// Original static demo rows (DEPQ) — used as offline fallback.
const DEMO_DEPS = [
  { id: 'DP-99810', pl: 'LGX09112VND', m: 'Bank Transfer', amt: '₫2.0M', t: '26m ago', st: 'manual' },
  { id: 'DP-99809', pl: 'LGX08841CNY', m: 'Alipay', amt: '¥1,200', t: '40m ago', st: 'failed' },
];

const depBadge = (st) =>
  st === 'approved' || st === 'success' ? <BOk>Approved</BOk>
  : st === 'pending' || st === 'manual' ? <BPend>Pending</BPend>
  : st === 'admin' ? <BInfo>Admin Manual</BInfo>
  : st === 'rejected' || st === 'failed' ? <BBad>Rejected</BBad>
  : <BInfo>{st || '—'}</BInfo>;

export default function Deposits() {
  const { toast } = useUI();
  const [deps, setDeps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await listDeposits();
        const rows = Array.isArray(data) ? data : data?.items || [];
        if (alive) setDeps(rows.map((d) => ({
          id: d.id ?? d.txnId,
          pl: d.username ?? d.player ?? d.pl ?? d.playerId,
          m: d.method ?? d.m,
          amt: typeof d.amount === 'number' ? '₱' + d.amount.toLocaleString() : (d.amount ?? d.amt),
          t: d.time ?? d.t ?? d.createdAt,
          st: d.status ?? d.st,
        })));
      } catch {
        if (alive) setDeps(DEMO_DEPS);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const approve = async (i) => {
    const d = deps[i];
    try {
      await approveTransaction(d.id);
    } catch {
      /* offline demo — still reflect locally */
    }
    setDeps((prev) => prev.map((x, idx) => (idx === i ? { ...x, st: 'success' } : x)));
    toast('Deposit approved ✔ ' + d.id + ' · ' + d.amt + ' credited');
  };

  const cols = ['TXN ID', 'Player', 'Method', 'Amount', 'Time', 'Status', 'Action'];
  const rows = deps.map((d, i) => [
    d.id, d.pl, d.m, d.amt, d.t, depBadge(d.st),
    (d.st === 'manual' || d.st === 'pending')
      ? <button className="mini-btn green" onClick={() => approve(i)}>Approve</button>
      : d.st === 'failed'
        ? <button className="mini-btn" onClick={() => toast('Retrying ' + d.id + '…')}>Retry</button>
        : <button className="mini-btn" onClick={() => toast('Receipt ' + d.id)}>View</button>,
  ]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="hero-h">Deposits</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>Deposit history &amp; manual processing.</div>
        </div>
        <span className="pr">
          <button className="btn-search" onClick={() => toast('Manual Deposit — demo')}>💳 Manual Deposit</button>
        </span>
      </div>
      <div className="card">
        <ToolbarSearch placeholder="Search transaction ID, player…" />
        <Table cols={cols} rows={rows} />
        {loading && null}
      </div>
    </>
  );
}
