import { useCallback, useEffect, useState } from 'react';
import { useUI } from '../context/UIContext';
import { listTransactions } from '../services/walletService';
import api from '../services/api';

/*
 * Bonuses — the reward ledger. Every mission / voucher / bonus credit lands
 * here (bonus transactions). Non-cash rewards (free spins etc., amount 0)
 * queue up for the operator to fulfil manually with the game provider.
 */
export default function Bonuses() {
  const { toast } = useUI();
  const [txns, setTxns] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState('queue'); // queue | all

  const load = useCallback(() => {
    listTransactions({ type: 'bonus' })
      .then((d) => setTxns((Array.isArray(d) ? d : d?.items || []).filter((t) => t.type === 'bonus')))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);
  useEffect(() => {
    load();
    const id = setInterval(load, 20000); // fulfilment queue stays live
    return () => clearInterval(id);
  }, [load]);

  const fulfill = async (t) => {
    try {
      await api.patch(`/transactions/${t.id}/fulfill`);
      setTxns((prev) => prev.map((x) => (x.id === t.id ? { ...x, fulfilled: true } : x)));
      toast('Marked fulfilled ✔');
    } catch (e) { toast('⚠ ' + (e.message || 'Failed')); }
  };

  const queue = txns.filter((t) => Number(t.amount || 0) === 0 && !t.fulfilled);
  const shown = (tab === 'queue' ? queue : txns)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, 200);

  return (
    <>
      <h1 className="hero-h">Bonuses</h1>
      <div className="hero-sub">Every mission, voucher and bonus credit — with a fulfilment queue for non-cash rewards (free spins) your team grants manually.</div>

      <div className="grid kpi-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="card kpi b"><div className="lbl">Bonus Credits (all time)</div><div className="val">{txns.length}</div></div>
        <div className="card kpi" style={{ borderTopColor: '#ff8c42' }}><div className="lbl">Awaiting Fulfilment</div><div className="val">{queue.length}</div><div className="trend" style={{ color: 'var(--muted)' }}>free spins & manual rewards</div></div>
        <div className="card kpi g"><div className="lbl">Cash Credited</div><div className="val">{txns.filter((t) => Number(t.amount) > 0).length}</div><div className="trend" style={{ color: 'var(--muted)' }}>auto-credited to balances</div></div>
      </div>

      <div className="pilltabs" style={{ marginTop: 'var(--pad)' }}>
        <button className={`pill ${tab === 'queue' ? 'active' : ''}`} onClick={() => setTab('queue')}>⏳ Fulfilment queue ({queue.length})</button>
        <button className={`pill ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>📒 All bonus credits</button>
      </div>

      <div className="card">
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}><table style={{ minWidth: 900 }}>
          <thead><tr><th>When</th><th>Player</th><th>Source</th><th>Reward</th><th>Amount</th><th>Status</th>{tab === 'queue' && <th>Action</th>}</tr></thead>
          <tbody>
            {shown.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>
                {loaded ? (tab === 'queue' ? 'Nothing awaiting fulfilment 🎉' : 'No bonus credits yet.') : 'Loading…'}
              </td></tr>
            ) : shown.map((t) => (
              <tr key={t.id}>
                <td style={{ whiteSpace: 'nowrap', color: 'var(--muted)', fontSize: '.72rem' }}>{String(t.createdAt || '').replace('T', ' ').slice(0, 16)}</td>
                <td>{t.username || t.playerName || t.playerId}</td>
                <td><span className="cms-chip">{t.method || 'bonus'}</span></td>
                <td style={{ maxWidth: 340, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.note}>{t.note || '—'}</td>
                <td style={{ color: 'var(--gold)', fontWeight: 800 }}>{Number(t.amount) > 0 ? `${Number(t.amount).toLocaleString()} ${t.currency || ''}` : '— (manual)'}</td>
                <td>{Number(t.amount) > 0 || t.fulfilled ? <span className="badge ok">{t.fulfilled && Number(t.amount) === 0 ? 'Fulfilled' : 'Credited'}</span> : <span className="badge pend">Awaiting</span>}</td>
                {tab === 'queue' && <td><button className="mini-btn gold" onClick={() => fulfill(t)}>✔ Mark fulfilled</button></td>}
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </>
  );
}
