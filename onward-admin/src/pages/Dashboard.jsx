import { useCallback, useEffect, useRef, useState } from 'react';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import { listPlayers } from '../services/playerService';
import { listTransactions } from '../services/walletService';
import useCurrencyRates from '../hooks/useCurrencyRates';
import { symbolFor, amountNum, convert } from '../services/currencyService';
import api from '../services/api';

const POLL_MS = 20000; // live dashboard: refresh every 20s

// Compact money label (₱8.4M / RM340K) in the reporting currency.
function compact(n, sym) {
  const v = Math.abs(Number(n) || 0);
  if (v >= 1e6) return `${sym}${(n / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${sym}${Math.round(n / 1e3)}K`;
  return `${sym}${Math.round(n).toLocaleString()}`;
}

function timeAgo(iso) {
  const ms = Date.now() - (Date.parse(iso) || Date.now());
  if (ms < 60000) return 'just now';
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
  return `${Math.floor(ms / 86400000)}d ago`;
}

const isApproved = (t) => ['approved', 'completed', 'success'].includes(String(t.status || '').toLowerCase());
const dayKey = (iso) => String(iso || '').slice(0, 10);

export default function Dashboard() {
  const { currency: reportCur, toast } = useUI();
  const { admin } = useAuth();
  const { rates } = useCurrencyRates();
  const [players, setPlayers] = useState([]);
  const [txns, setTxns] = useState([]);
  const [bets, setBets] = useState(null); // { totalWagered, totalWon, ggr, count }
  const [flash, setFlash] = useState(false);
  const knownDeposits = useRef(null); // ids seen on the previous poll

  const load = useCallback(async () => {
    const [p, t, b] = await Promise.all([
      listPlayers().catch(() => null),
      listTransactions().catch(() => null),
      api.get('/bets/summary').then((r) => r.data).catch(() => null),
    ]);
    if (p) setPlayers(Array.isArray(p) ? p : (p?.items || p?.data || []));
    if (b) setBets(b);
    if (t && Array.isArray(t)) {
      setTxns(t);
      // New-deposit detection: toast + flash when a deposit appears mid-session.
      const depositIds = new Set(t.filter((x) => x.type === 'deposit').map((x) => x.id));
      if (knownDeposits.current) {
        const fresh = t.filter((x) => x.type === 'deposit' && !knownDeposits.current.has(x.id));
        if (fresh.length) {
          const f = fresh[0];
          toast(`💰 New deposit: ${amountNum(f.amount).toLocaleString()} ${f.currency || 'PHP'}${f.username ? ` from ${f.username}` : ''}${fresh.length > 1 ? ` (+${fresh.length - 1} more)` : ''}`);
          setFlash(true);
          setTimeout(() => setFlash(false), 2500);
        }
      }
      knownDeposits.current = depositIds;
    }
  }, [toast]);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const sym = symbolFor(reportCur) || '₱';
  const toRep = (amt, cur) => convert(amountNum(amt), cur || 'PHP', reportCur, rates);
  const isCredit = (t) => t.type === 'deposit' && isApproved(t);
  const deposits = txns.filter(isCredit).reduce((s, t) => s + toRep(t.amount, t.currency), 0);
  const pendingWd = txns.filter((t) => t.type === 'withdrawal' && String(t.status).toLowerCase() === 'pending');
  const pendingWdSum = pendingWd.reduce((s, t) => s + toRep(t.amount, t.currency), 0);
  // Real GGR once the bets ledger has data; estimate from deposits until then.
  const ggr = bets && bets.count > 0 ? toRep(bets.ggr, 'PHP') : deposits * 0.143;
  const ggrReal = !!(bets && bets.count > 0);
  const hasData = players.length > 0 || txns.length > 0;

  /* ---- Today Records (all real) ---- */
  const today = dayKey(new Date().toISOString());
  const todayTx = txns.filter((t) => dayKey(t.createdAt) === today);
  const newMembersToday = players.filter((p) => dayKey(p.createdAt || p.registrationDate) === today).length;
  const depsToday = todayTx.filter((t) => t.type === 'deposit' && isApproved(t));
  const firstDepositors = new Set(txns.filter(isCredit).map((t) => String(t.playerId)));
  const firstDepsToday = new Set(depsToday.map((t) => String(t.playerId))).size
    ? [...new Set(depsToday.map((t) => String(t.playerId)))].filter((pid) =>
      !txns.some((t) => t.type === 'deposit' && isApproved(t) && String(t.playerId) === pid && dayKey(t.createdAt) < today)).length
    : 0;
  const depTodaySum = depsToday.reduce((s, t) => s + toRep(t.amount, t.currency), 0);
  const wdTodaySum = todayTx.filter((t) => t.type === 'withdrawal' && isApproved(t)).reduce((s, t) => s + toRep(t.amount, t.currency), 0);
  const bonusTodaySum = todayTx.filter((t) => t.type === 'bonus').reduce((s, t) => s + toRep(t.amount, t.currency), 0);
  const records = [
    ['Today New Member', String(newMembersToday)],
    ['Today First Deposit', String(firstDepsToday)],
    ['Today Deposit', compact(depTodaySum, sym)],
    ['Today Withdrawal', compact(wdTodaySum, sym)],
    ['Today Promotion / Bonus', compact(bonusTodaySum, sym)],
    ['Today Profit', compact(depTodaySum - wdTodaySum - bonusTodaySum, sym)],
  ];

  /* ---- Live activity feed (latest real transactions) ---- */
  const feed = [...txns]
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, 8)
    .map((t) => {
      const amt = `${amountNum(t.amount).toLocaleString()} ${t.currency || 'PHP'}`;
      const who = t.username ? ` — ${t.username}` : '';
      if (t.type === 'deposit') return ['#3aa0ff', `Deposit ${amt}${who} (${t.status})`, timeAgo(t.createdAt)];
      if (t.type === 'withdrawal') return ['#ff8c42', `Withdrawal ${amt}${who} (${t.status})`, timeAgo(t.createdAt)];
      if (t.type === 'bonus') return ['#2ecc71', `${t.note || `Bonus ${amt}`}${who}`, timeAgo(t.createdAt)];
      return ['#9b6dff', `${t.type} ${amt}${who}`, timeAgo(t.createdAt)];
    });

  /* ---- Deposits — last 7 days (real) ---- */
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    return { key: dayKey(d.toISOString()), label: d.toLocaleDateString('en', { weekday: 'short' }) };
  });
  const daySums = days.map((d) =>
    txns.filter((t) => isCredit(t) && dayKey(t.createdAt) === d.key).reduce((s, t) => s + toRep(t.amount, t.currency), 0));
  const maxDay = Math.max(1, ...daySums);

  return (
    <>
      <h1 className="hero-h">Dashboard</h1>
      <div className="hero-sub">Welcome back, Super Admin — live overview, refreshes every {POLL_MS / 1000}s. <span style={{ color: 'var(--muted,#8898b8)' }}>Amounts in {reportCur}.</span></div>

      {admin?.usingDefaultPassword && (
        <div className="card" style={{ borderLeft: '4px solid var(--red,#ff4d5e)', padding: '12px 16px', marginBottom: 'var(--pad)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🔐</span>
          <div style={{ flex: 1 }}>
            <b>You are still using the default admin password.</b>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Change it now via the profile menu (bottom-left → Change Password) before going live.</div>
          </div>
        </div>
      )}

      <div className="grid kpi-grid">
        <div className="card kpi"><div className="lbl">Total Players</div><div className="val">{players.length.toLocaleString()}</div><div className="trend" style={{ color: 'var(--muted)' }}>{newMembersToday} joined today</div></div>
        <div className="card kpi g" style={flash ? { boxShadow: '0 0 0 2px var(--green,#2ecc71)' } : undefined}><div className="lbl">Total Deposits</div><div className="val">{compact(deposits, sym)}</div><div className="trend" style={{ color: 'var(--muted)' }}>{compact(depTodaySum, sym)} today</div></div>
        <div className="card kpi b"><div className="lbl">GGR</div><div className="val">{compact(ggr, sym)}</div><div className="trend" style={{ color: 'var(--muted)' }}>{ggrReal ? `from ${bets.count.toLocaleString()} bets` : 'estimate — awaiting bet data'}</div></div>
        <div className="card kpi r"><div className="lbl">Pending Withdrawals</div><div className="val">{compact(pendingWdSum, sym)}</div><div className="trend"><span className="warn">{pendingWd.length} pending</span> approval</div></div>
      </div>

      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="card-title">Today Records</div>
        <div className="rowlist">
          {records.map((r, i) => (
            <div className="rowline" key={i}><span className="k">{r[0]}</span><span className="v">{r[1]}</span></div>
          ))}
        </div>
      </div>

      <div className="grid two-col" style={{ marginTop: 'var(--pad)' }}>
        <div className="card">
          <div className="card-title">🛰️ Live Activity Feed <span className="live-pill">Live</span></div>
          <div className="rowlist">
            {feed.length === 0
              ? <div className="rowline"><span className="k" style={{ color: 'var(--muted)' }}>No activity yet — deposits, withdrawals and rewards appear here in real time.</span></div>
              : feed.map((r, i) => (
                <div className="rowline" key={i}><span className="k" style={{ display: 'flex', alignItems: 'center', gap: '9px' }}><span className="feed-dot" style={{ background: r[0] }}></span>{r[1]}</span><span className="feed-time">{r[2]}</span></div>
              ))}
          </div>
        </div>
        <div className="card">
          <div className="card-title">📈 Deposits — Last 7 Days {hasData ? '' : '(no data yet)'}</div>
          <div className="bars-wrap"><div className="bars">
            {daySums.map((v, i) => (
              <div className="bar" style={{ height: `${Math.max(4, Math.round((v / maxDay) * 100))}%` }} key={i} title={compact(v, sym)}><span>{days[i].label}</span></div>
            ))}
          </div></div>
          {bets && bets.count > 0 && (
            <div className="rowlist" style={{ marginTop: 14 }}>
              <div className="rowline"><span className="k">Total Wagered</span><span className="v">{compact(toRep(bets.totalWagered, 'PHP'), sym)}</span></div>
              <div className="rowline"><span className="k">Total Won by Players</span><span className="v">{compact(toRep(bets.totalWon, 'PHP'), sym)}</span></div>
              <div className="rowline"><span className="k">GGR</span><span className="v" style={{ color: 'var(--green)' }}>{compact(toRep(bets.ggr, 'PHP'), sym)}</span></div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
