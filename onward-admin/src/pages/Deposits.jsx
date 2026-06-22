import { useEffect, useState } from 'react';
import { Table, BOk, BPend, BBad, BInfo, ToolbarSearch } from '../components/ui.jsx';
import { useUI } from '../context/UIContext';
import { listDeposits, approveTransaction, manualDeposit } from '../services/walletService';
import { listPlayers } from '../services/playerService';
import { listBankChannels } from '../services/bankService';

// Original static demo rows (DEPQ) — used as offline fallback.
const DEMO_DEPS = [
  { id: 'DP-99810', pl: 'LGX09112VND', m: 'Bank Transfer', amt: '₫2.0M', t: '26m ago', st: 'manual' },
  { id: 'DP-99809', pl: 'LGX08841CNY', m: 'Alipay', amt: '¥1,200', t: '40m ago', st: 'failed' },
];
const TYPE_GROUP = { ewallet: '── E-Wallets ──', bank: '── Banks ──', crypto: '── Crypto ──', gateway: '── Gateways ──' };

const depBadge = (st) =>
  st === 'approved' || st === 'success' ? <BOk>Approved</BOk>
  : st === 'pending' || st === 'manual' ? <BPend>Pending</BPend>
  : st === 'admin' || st === 'manual-deposit' ? <BInfo>Admin Manual</BInfo>
  : st === 'rejected' || st === 'failed' ? <BBad>Rejected</BBad>
  : <BInfo>{st || '—'}</BInfo>;

function ManualDepositModal({ onClose, onDone }) {
  const { toast } = useUI();
  const [players, setPlayers] = useState([]);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(null);
  const [bank, setBank] = useState('');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [channels, setChannels] = useState([]);

  useEffect(() => {
    let alive = true;
    listPlayers().then((d) => { if (alive) setPlayers(Array.isArray(d) ? d : (d?.items || [])); }).catch(() => {});
    listBankChannels().then((d) => { if (alive) setChannels((Array.isArray(d) ? d : []).filter((c) => c.dep && c.on)); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  // Group deposit-enabled channels by type for the dropdown.
  const grouped = channels.reduce((acc, c) => { (acc[c.type] = acc[c.type] || []).push(c); return acc; }, {});

  const matches = !q.trim() ? [] : players.filter((p) => {
    const s = `${p.username || ''} ${p.playerCode || ''} ${p.fullName || ''}`.toLowerCase();
    return s.includes(q.trim().toLowerCase());
  }).slice(0, 8);

  const submit = async () => {
    if (!sel) { toast('Choose a player', 'error'); return; }
    if (!bank) { toast('Choose the bank of deposit', 'error'); return; }
    const amt = Number(String(amount).replace(/[^0-9.]/g, ''));
    if (!(amt > 0)) { toast('Enter a valid amount', 'error'); return; }
    setBusy(true);
    try {
      await manualDeposit(sel.id, { amount: amt, bank, reference, note });
      toast(`Deposit credited ✔ ${sel.currency || '₱'}${amt.toLocaleString()} to ${sel.username} via ${bank}`);
      onDone();
      onClose();
    } catch (e) {
      toast('⚠ ' + (e.message || 'Deposit failed'));
    } finally { setBusy(false); }
  };

  return (
    <div className="modal-ov show" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', zIndex: 4000, overflowY: 'auto' }}>
      <div style={{ width: 'min(480px,100%)', background: 'var(--card,#131a2c)', border: '1px solid var(--border,#243049)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '15px 18px', borderBottom: '1px solid var(--border,#243049)' }}>
          <span style={{ fontSize: '1.2rem' }}>💳</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, color: 'var(--text,#fff)' }}>Manual Deposit</div>
            <div style={{ fontSize: 12, color: 'var(--muted,#8898b8)' }}>Credit a player and record the bank it was received into</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,.08)', border: 'none', color: '#fff', width: 30, height: 30, borderRadius: 8, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Player */}
          <div>
            <label className="fld-lbl">Player</label>
            {sel ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9, background: 'var(--panel-2,#151e33)', border: '1px solid var(--border,#243049)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, color: 'var(--text,#fff)' }}>{sel.username}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted,#8898b8)' }}>{sel.playerCode} · {sel.currency} · bal {Number(sel.balance || 0).toLocaleString()}</div>
                </div>
                <button className="mini-btn" onClick={() => setSel(null)}>Change</button>
              </div>
            ) : (
              <>
                <input className="dep-in" placeholder="Search username / Player ID…" value={q} onChange={(e) => setQ(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 9, background: 'var(--panel-3,#1b2541)', color: 'var(--text,#fff)', border: '1px solid var(--border,#243049)' }} />
                {matches.length > 0 && (
                  <div style={{ marginTop: 6, border: '1px solid var(--border,#243049)', borderRadius: 9, overflow: 'hidden' }}>
                    {matches.map((p) => (
                      <button key={p.id} onClick={() => { setSel(p); setQ(''); }}
                        style={{ display: 'flex', width: '100%', textAlign: 'left', gap: 10, padding: '9px 12px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border,#243049)', color: 'var(--text,#fff)', cursor: 'pointer' }}>
                        <span style={{ fontWeight: 700 }}>{p.username}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted,#8898b8)' }}>{p.playerCode} · {p.currency}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          {/* Bank of deposit */}
          <div>
            <label className="fld-lbl">Bank of Deposit <span style={{ color: 'var(--red,#ff4d5e)' }}>*</span></label>
            <select value={bank} onChange={(e) => setBank(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 9, background: 'var(--panel-3,#1b2541)', color: 'var(--text,#fff)', border: '1px solid var(--border,#243049)' }}>
              <option value="">{channels.length ? 'Select bank / e-wallet…' : 'No banks configured — add them on the Bank page'}</option>
              {Object.keys(grouped).map((type) => (
                <optgroup label={TYPE_GROUP[type] || type} key={type}>
                  {grouped[type].map((c) => <option key={c.id} value={c.n}>{c.n}{c.acct ? ` · ${c.acct}` : ''}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          {/* Amount + reference */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="fld-lbl">Amount <span style={{ color: 'var(--red,#ff4d5e)' }}>*</span></label>
              <input className="dep-in" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 9, background: 'var(--panel-3,#1b2541)', color: 'var(--text,#fff)', border: '1px solid var(--border,#243049)' }} />
            </div>
            <div>
              <label className="fld-lbl">Reference / Receipt</label>
              <input className="dep-in" placeholder="optional" value={reference} onChange={(e) => setReference(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 9, background: 'var(--panel-3,#1b2541)', color: 'var(--text,#fff)', border: '1px solid var(--border,#243049)' }} />
            </div>
          </div>
          <div>
            <label className="fld-lbl">Remark</label>
            <input className="dep-in" placeholder="optional note" value={note} onChange={(e) => setNote(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 9, background: 'var(--panel-3,#1b2541)', color: 'var(--text,#fff)', border: '1px solid var(--border,#243049)' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', padding: '14px 18px', borderTop: '1px solid var(--border,#243049)' }}>
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-search" onClick={submit} disabled={busy}>{busy ? 'Processing…' : '💳 Credit Deposit'}</button>
        </div>
      </div>
    </div>
  );
}

export default function Deposits() {
  const { toast } = useUI();
  const [deps, setDeps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showManual, setShowManual] = useState(false);

  const load = async () => {
    try {
      const data = await listDeposits();
      const rows = Array.isArray(data) ? data : data?.items || [];
      setDeps(rows.map((d) => ({
        id: d.id ?? d.txnId,
        pl: d.username ?? d.player ?? d.pl ?? d.playerId,
        m: d.method ?? d.bank ?? d.m,
        amt: typeof d.amount === 'number' ? '₱' + d.amount.toLocaleString() : (d.amount ?? d.amt),
        t: d.time ?? d.t ?? d.createdAt,
        st: d.status ?? d.st,
      })));
    } catch {
      setDeps(DEMO_DEPS);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const approve = async (i) => {
    const d = deps[i];
    try { await approveTransaction(d.id); } catch { /* offline demo */ }
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
          <button className="btn-search" onClick={() => setShowManual(true)}>💳 Manual Deposit</button>
        </span>
      </div>
      <div className="card">
        <ToolbarSearch placeholder="Search transaction ID, player…" />
        <Table cols={cols} rows={rows} />
        {loading && null}
      </div>
      {showManual && <ManualDepositModal onClose={() => setShowManual(false)} onDone={load} />}
    </>
  );
}
