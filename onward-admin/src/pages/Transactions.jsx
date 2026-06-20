import { useEffect, useMemo, useState } from 'react';
import { Table, BOk, BPend, BBad, BInfo } from '../components/ui.jsx';
import { useUI } from '../context/UIContext';
import { listTransactions } from '../services/walletService';

/*
 * Transactions — a single ledger of every wallet movement the backend records
 * for players: deposits, withdrawals, manual balance adjustments and
 * bonuses/promotions. Reads GET /api/transactions (admin).
 */

const TYPE_TABS = [
  ['all', 'All'],
  ['deposit', 'Deposits'],
  ['withdrawal', 'Withdrawals'],
  ['adjustment', 'Adjustments'],
  ['bonus', 'Bonuses / Promo'],
];

const typeBadge = (t) =>
  t === 'deposit' ? <BInfo>Deposit</BInfo>
  : t === 'withdrawal' ? <BPend>Withdrawal</BPend>
  : t === 'adjustment' ? <BInfo>Adjustment</BInfo>
  : t === 'bonus' ? <BOk>Bonus</BOk>
  : <BInfo>{t || '—'}</BInfo>;

const statusBadge = (s) =>
  s === 'approved' || s === 'success' ? <BOk>Approved</BOk>
  : s === 'pending' || s === 'manual' ? <BPend>Pending</BPend>
  : s === 'rejected' || s === 'failed' ? <BBad>Rejected</BBad>
  : <BInfo>{s || '—'}</BInfo>;

const SYM = { PHP: '₱', USD: '$', EUR: '€', INR: '₹', THB: '฿', VND: '₫', IDR: 'Rp', MYR: 'RM', CNY: '¥', JPY: '¥' };

// Signed amount: withdrawals are debits; adjustments keep their stored sign.
function fmtAmount(tx) {
  const sym = SYM[tx.currency] || '₱';
  let n = Number(tx.amount || 0);
  if (tx.type === 'withdrawal') n = -Math.abs(n);
  const sign = n < 0 ? '-' : '+';
  const val = Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <span style={{ color: n < 0 ? 'var(--red,#e8293a)' : 'var(--green,#22c55e)', fontWeight: 700 }}>
      {sign}{sym}{val}
    </span>
  );
}

const fmtTime = (t) => {
  if (!t) return '—';
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? String(t) : d.toLocaleString();
};

export default function Transactions() {
  const { toast } = useUI();
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await listTransactions();
      const rows = Array.isArray(data) ? data : data?.items || [];
      setAll(rows);
    } catch (e) {
      toast('Could not load transactions: ' + (e.message || 'API error'));
      setAll([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const filtered = useMemo(() => {
    let list = tab === 'all' ? all : all.filter((t) => t.type === tab);
    const term = q.trim().toLowerCase();
    if (term) {
      list = list.filter((t) =>
        [t.id, t.username, t.playerId, t.method, t.note, t.source]
          .some((v) => String(v || '').toLowerCase().includes(term))
      );
    }
    return [...list].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  }, [all, tab, q]);

  const cols = ['TXN ID', 'Player', 'Type', 'Amount', 'Source / Method', 'Status', 'Note', 'Time'];
  const rows = filtered.map((t) => [
    <span className="idchip">{String(t.id || '').slice(0, 10) || '—'}</span>,
    t.username || t.playerId || '—',
    typeBadge(t.type),
    fmtAmount(t),
    t.source || t.method || '—',
    statusBadge(t.status),
    <span style={{ color: 'var(--muted,#8898b8)' }}>{t.note || '—'}</span>,
    fmtTime(t.createdAt),
  ]);

  const totalIn = filtered.filter((t) => (t.type !== 'withdrawal') && Number(t.amount) > 0).reduce((s, t) => s + Number(t.amount || 0), 0);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="hero-h">Transactions</h1>
          <div className="hero-sub" style={{ marginBottom: 0 }}>
            Full ledger of player wallet movements — deposits, withdrawals, manual adjustments and bonuses/promotions.
          </div>
        </div>
        <span className="pr">
          <button className="btn-search" onClick={load}>🔄 Refresh</button>
        </span>
      </div>

      <div className="card">
        <div className="toolbar" style={{ flexWrap: 'wrap', gap: 8 }}>
          {TYPE_TABS.map(([k, label]) => (
            <button
              key={k}
              className={'mini-btn' + (tab === k ? ' gold' : '')}
              onClick={() => setTab(k)}
            >
              {label}
            </button>
          ))}
          <input
            placeholder="Search TXN ID, player, note…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ flex: 1, minWidth: 180 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 16, padding: '6px 2px 14px', color: 'var(--muted,#8898b8)', fontSize: 13 }}>
          <span>Showing <b style={{ color: 'var(--text,#fff)' }}>{filtered.length}</b> records</span>
          <span>Total credited (filtered): <b style={{ color: 'var(--green,#22c55e)' }}>₱{totalIn.toLocaleString()}</b></span>
        </div>

        {loading ? (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--muted,#8898b8)' }}>Loading transactions…</div>
        ) : rows.length ? (
          <Table cols={cols} rows={rows} />
        ) : (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--muted,#8898b8)' }}>No transactions found.</div>
        )}
      </div>
    </>
  );
}
