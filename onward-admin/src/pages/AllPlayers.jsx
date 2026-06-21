import { useState, useEffect } from 'react';
import { useUI } from '../context/UIContext';
import { listPlayers, blockPlayer, updatePlayer, deletePlayer, resetPlayerPassword } from '../services/playerService';
import { credit as creditWallet, debit as debitWallet } from '../services/walletService';

/* ---- Players dataset (demo fallback) ----
   [username, realName, rank, id, cur, email, phone, bal, dep, vip, vipColor, active, ip, joined, hl] */
const DEMO_PLAYERS = [
  ['juan_dc88', 'Juan dela Cruz', 1, 'LGX4820017PHP', 'PHP', 'juan@email.com', '+63 912 345 6789', '₱12,400', '₱85,000', 'Gold', 'g', 1, '192.168.1.10', '2024-01-15', 'ip'],
  ['mariasantos', 'Maria Santos', 2, 'LGX7193482PHP', 'PHP', 'maria@email.com', '+63 917 888 0011', '₱5,200', '₱32,000', 'Silver', 's', 1, '192.168.1.10', '2024-02-20', 'ip'],
  ['pedroR777', 'Pedro Reyes', 3, 'LGX2056741CNY', 'CNY', 'pedro@email.com', '+63 918 123 4567', '₱128,000', '₱420,000', 'Diamond', 'd', 1, '10.0.0.5', '2023-08-05', 'ipname'],
  ['ana_g21', 'Ana Garcia', 4, 'LGX8830192VND', 'VND', 'ana@email.com', '+63 919 222 3344', '₱800', '₱8,500', 'Bronze', 'b', 1, '10.0.0.5', '2024-05-01', 'ipname'],
  ['carloslim', 'Carlos Lim', 5, 'LGX1147802CNY', 'CNY', 'carlos@email.com', '+63 920 555 6677', '₱0', '₱15,000', 'Silver', 's', 0, '172.16.0.3', '2024-03-10', 'full'],
  ['rosacruz_', 'Rosa Cruz', 6, 'LGX6620913THB', 'THB', 'rosa@email.com', '+63 921 777 8899', '₱44,000', '₱210,000', 'Platinum', 'p', 1, '172.16.0.3', '2023-11-22', 'ip'],
  ['junmen07', 'Jun Mendoza', 7, 'LGX3309821VND', 'VND', 'jun@email.com', '+63 922 999 0011', '₱2,100', '₱18,000', 'Silver', 's', 1, '192.168.1.10', '2024-04-08', 'ip'],
  ['lea_v88', 'Lea Villanueva', 8, 'LGX9044215PHP', 'PHP', 'lea@email.com', '+63 923 444 5566', '₱67,000', '₱350,000', 'Platinum', 'p', 1, '10.0.0.99', '2023-06-14', ''],
  ['carloslim2', 'Carlos Lim', 9, 'LGX5512378IDR', 'IDR', 'carlos2@email.com', '+63 920 111 2222', '₱300', '₱3,000', 'Bronze', 'b', 1, '172.16.0.3', '2024-06-01', 'full'],
  ['bongs10', 'Bong Santos', 10, 'LGX7783455MYR', 'MYR', 'bong@email.com', '+63 915 333 4455', '₱9,800', '₱55,000', 'Gold', 'g', 1, '192.168.2.50', '2024-01-30', ''],
];

const initials = (n) => n.replace(/[^a-zA-Z ]/g, '').split(/[\s_]+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || n.slice(0, 2).toUpperCase();
const moneyNum = (v) => parseInt(String(v).replace(/[^0-9]/g, '')) || 0;
const moneyFmt = (n) => '₱' + n.toLocaleString();

// Map an API player record into the demo array shape so rendering is identical.
const toRow = (p, i) => [
  p.username || p.user || p.name || `player${i}`,
  p.realName || p.real_name || p.name || p.username || '—',
  p.rank ?? i + 1,
  p.playerCode || p.playerId || p.player_id || p.id || `LGX${i}`,
  p.currency || p.cur || 'PHP',
  p.email || `${p.username || 'player'}@email.com`,
  p.phone || p.contact || '—',
  typeof p.balance === 'number' ? moneyFmt(p.balance) : p.balance || '₱0',
  typeof p.totalDeposit === 'number' ? moneyFmt(p.totalDeposit) : p.totalDeposit || p.deposit || '₱0',
  p.vip || p.vipLevel || 'Bronze',
  p.vipColor || ({ Gold: 'g', Silver: 's', Diamond: 'd', Bronze: 'b', Platinum: 'p' }[p.vip] || 'b'),
  p.active != null ? (p.active ? 1 : 0) : (p.blocked ? 0 : 1),
  p.ip || p.registerIp || p.register_ip || '0.0.0.0',
  p.joined || p.createdAt || p.created_at || '—',
  p.hl || '',
  p.id || p.playerId || p.player_id || null, // [15] backend record id for API calls
  p.referralCode || p.referral_code || '',   // [16] referral code (for filtering)
];

const selF = (l, opts, req) => (
  <div className="fld"><label className={req ? 'req' : ''}>{l}</label><select>{opts.map((o, i) => <option key={i}>{o}</option>)}</select></div>
);
const inF = (l, p, req) => (
  <div className="fld"><label className={req ? 'req' : ''}>{l}</label><input placeholder={p} /></div>
);

function AdvCard({ t, a, b, type }) {
  const [on, setOn] = useState(false);
  return (
    <div className={`adv-card ${on ? '' : 'off'}`}>
      <label className="switch"><input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} /><span className="slider"></span></label>
      <div className="ttl">{t}</div>
      <div className="pair"><input type={type || 'text'} placeholder={a} /><input type={type || 'text'} placeholder={b} /></div>
    </div>
  );
}

const dupLabel = {
  ip: ['ip', 'ℹ️ Same IP detected'],
  ipname: ['ipname', 'ℹ️ Same IP + Name detected'],
  namepass: ['full', '⚠️ Same Name + Password detected'],
  full: ['full', '🚨 Same Name + IP + Device + Password'],
};

export default function AllPlayers() {
  const { toast } = useUI();
  const [players, setPlayers] = useState([]);
  const [, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('filter');
  const [filterMin, setFilterMin] = useState(false);
  const [advOpen, setAdvOpen] = useState(false);
  const [quick, setQuick] = useState('');
  const [filters, setFilters] = useState({}); // detailed filter form values
  const [adj, setAdj] = useState({}); // adjustment history per index

  // Add Player modal
  const [addOpen, setAddOpen] = useState(false);
  const [apForm, setApForm] = useState({ user: '', name: '', email: '', phone: '', cur: 'PHP', vip: 'Bronze' });

  // Profile modal
  const [pmIdx, setPmIdx] = useState(-1);
  const [pmTab, setPmTab] = useState('info');
  const [pmForm, setPmForm] = useState(null);
  const [adjForm, setAdjForm] = useState({ type: '＋ Add Balance', amt: '', remark: '' });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await listPlayers();
        const list = Array.isArray(data) ? data : data?.items || data?.data || [];
        if (active) setPlayers(list.map(toRow)); // real data only (may be empty)
      } catch {
        if (active) setPlayers(DEMO_PLAYERS); // offline-only fallback
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const ql = quick.toLowerCase();
  const matchesQuick = (p) => !ql || p.join(' ').toLowerCase().includes(ql);

  // Detailed filter (the form fields). Each field narrows the list by what's typed.
  const inc = (val, q) => !q || String(val ?? '').toLowerCase().includes(String(q).toLowerCase());
  const statusMatch = (act, s) => {
    if (!s) return true;
    if (s === 'Active') return !!act;
    if (s === 'Inactive' || s === 'Blocked') return !act;
    return true; // others have no row data — don't exclude
  };
  const matchesFilters = (p) =>
    inc(p[0], filters.username) &&
    inc(p[3], filters.playerId) &&
    inc(p[1], filters.name) &&
    inc(p[6], filters.contact) &&
    inc(p[5], filters.email) &&
    inc(p[12], filters.registerIp) &&
    inc(p[16], filters.referral) &&
    statusMatch(p[11], filters.status);

  const visible = players.map((p, i) => ({ p, i })).filter(({ p }) => matchesQuick(p) && matchesFilters(p));
  const resCount = visible.length;

  // Controlled filter-field helpers (kept as functions so inputs don't remount).
  const setF = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const txtF = (k, label, ph, req) => (
    <div className="fld"><label className={req ? 'req' : ''}>{label}</label>
      <input placeholder={ph} value={filters[k] || ''} onChange={setF(k)} /></div>
  );
  const selFC = (k, label, opts, req) => (
    <div className="fld"><label className={req ? 'req' : ''}>{label}</label>
      <select value={filters[k] || ''} onChange={setF(k)}>
        {opts.map((o, i) => <option key={i} value={/please select|select all|select range/i.test(o) ? '' : o}>{o}</option>)}
      </select></div>
  );
  const resetFilters = () => { setFilters({}); setQuick(''); toast('Filters reset'); };

  const togglePlayer = async (i) => {
    const wasActive = players[i][11];
    setPlayers((prev) => prev.map((p, j) => (j === i ? Object.assign([...p], { 11: p[11] ? 0 : 1 }) : p)));
    try { await blockPlayer(players[i][15], wasActive ? true : false); } catch { /* offline demo */ }
    toast(wasActive ? players[i][0] + ' suspended ⛔ — Player suspended' : players[i][0] + ' activated ✔');
  };

  // Delete a player (use to clean out dummy / test accounts).
  const delPlayer = async (i) => {
    const p = players[i];
    if (!window.confirm(`Delete ${p[0]} (${p[3]})? This permanently removes the account.`)) return;
    const id = p[15];
    if (!id) { setPlayers((prev) => prev.filter((_, j) => j !== i)); toast('Demo row removed'); return; }
    try {
      await deletePlayer(id);
      setPlayers((prev) => prev.filter((_, j) => j !== i));
      toast('Player deleted ✔ ' + p[0]);
    } catch (e) {
      toast('Could not delete: ' + (e.message || 'API error'));
    }
  };

  const exportCSV = () => {
    const head = ['Username', 'Real Name', 'Player ID', 'Currency', 'Email', 'Phone', 'Balance', 'Total Deposit', 'VIP', 'Status', 'Register IP', 'Joined'];
    const rows = players.map((p) => [p[0], p[1], p[3], p[4], p[5], p[6], p[7], p[8], p[9], p[11] ? 'Active' : 'Suspended', p[12], p[13]]);
    const csv = [head, ...rows].map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'onward-players.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('CSV exported ⬇ onward-players.csv');
  };

  const saveNewPlayer = () => {
    const u = apForm.user.trim(), n = apForm.name.trim();
    if (!u || !n) { toast('⚠ Username and Full Name are required'); return; }
    const vc = { Gold: 'g', Silver: 's', Diamond: 'd', Bronze: 'b', Platinum: 'p' }[apForm.vip];
    const rank = players.length + 1;
    const pid = 'LGX' + String(Math.floor(1000000 + Math.random() * 9000000)) + apForm.cur;
    const row = [u, n, rank, pid, apForm.cur, apForm.email.trim() || u + '@email.com', apForm.phone.trim() || '—', '₱0', '₱0', apForm.vip, vc, 1, '0.0.0.0', new Date().toISOString().slice(0, 10), ''];
    setPlayers((prev) => [...prev, row]);
    setAddOpen(false);
    setApForm({ user: '', name: '', email: '', phone: '', cur: 'PHP', vip: 'Bronze' });
    toast('Player created! ✔ ' + u + ' · ' + pid);
  };

  const openPlayer = (i) => {
    const p = players[i];
    setPmIdx(i);
    setPmTab('info');
    setPmForm({ name: p[1], user: p[0], email: p[5], phone: p[6], status: p[11] ? 'active' : 'suspended', vip: p[9].toLowerCase() });
    setAdjForm({ type: '＋ Add Balance', amt: '', remark: '' });
  };
  const closePlayer = () => setPmIdx(-1);

  const VIP_LEVEL = { bronze: 0, silver: 1, gold: 2, platinum: 3, diamond: 4 };
  const STATUS_MAP = { active: 'active', suspended: 'suspended', blocked: 'blocked', 'kyc pending': 'active' };

  const pmSaveChanges = async () => {
    if (pmTab === 'info' && pmForm) {
      const id = players[pmIdx][15];
      // Persist to the backend FIRST so we can surface conflicts (username/email taken).
      if (id) {
        try {
          await updatePlayer(id, {
            username: pmForm.user.trim(),
            fullName: pmForm.name.trim(),
            email: pmForm.email.trim(),
            phone: pmForm.phone.trim(),
            status: STATUS_MAP[pmForm.status] || 'active',
            vipLevel: VIP_LEVEL[pmForm.vip] ?? 0,
          });
        } catch (e) {
          toast('Could not save: ' + (e?.response?.data?.error || e.message || 'error'));
          return; // keep the modal open so the admin can fix it
        }
      }
      const v = pmForm.vip;
      setPlayers((prev) => prev.map((p, j) => {
        if (j !== pmIdx) return p;
        const np = [...p];
        np[1] = pmForm.name.trim() || np[1];
        np[0] = pmForm.user.trim() || np[0];
        np[5] = pmForm.email.trim() || np[5];
        np[6] = pmForm.phone.trim() || np[6];
        np[11] = (pmForm.status === 'active' || pmForm.status === 'kyc pending') ? 1 : 0;
        np[9] = v[0].toUpperCase() + v.slice(1);
        np[10] = { gold: 'g', silver: 's', diamond: 'd', bronze: 'b', platinum: 'p' }[v] || np[10];
        return np;
      }));
    }
    closePlayer();
    toast('Player saved! ✔');
  };

  const pmSuspend = () => {
    setPlayers((prev) => prev.map((p, j) => (j === pmIdx ? Object.assign([...p], { 11: 0 }) : p)));
    setPmForm((f) => ({ ...f, status: 'suspended' }));
    toast('Player suspended ⛔');
  };

  const applyAdjustment = async () => {
    const { type } = adjForm;
    const amt = moneyNum(adjForm.amt);
    const rem = adjForm.remark.trim();
    const p = players[pmIdx];
    const playerId = p[15]; // backend record id
    let bal = moneyNum(p[7]); let neg = false;
    let apiCall = null; // what to persist to the backend
    if (type.includes('Deduct')) { neg = true; apiCall = () => debitWallet(playerId, amt, rem || 'Admin deduct'); bal = Math.max(0, bal - amt); }
    else if (type.includes('Reset Balance')) { neg = true; apiCall = () => debitWallet(playerId, bal, rem || 'Reset balance'); bal = 0; }
    else if (type.includes('Add Balance') || type.includes('Bonus')) { apiCall = () => creditWallet(playerId, amt, rem || 'Admin credit'); bal += amt; }
    else { toast('Applied: ' + type + ' ✔'); return; }
    if (!amt && !type.includes('Reset')) { toast('⚠ Enter an amount'); return; }

    // Persist to the backend so the player's wallet actually changes.
    if (playerId && apiCall) {
      try {
        const res = await apiCall();
        if (res && typeof res.balance === 'number') bal = res.balance; // trust server
      } catch (e) {
        toast('⚠ Could not save to server: ' + (e.message || 'API error'));
        return;
      }
    } else if (!playerId) {
      toast('⚠ This is demo data — connect a real player to adjust balance');
    }

    const newBal = moneyFmt(bal);
    setPlayers((prev) => prev.map((x, j) => (j === pmIdx ? Object.assign([...x], { 7: newBal }) : x)));
    setAdj((prev) => {
      const entry = { date: new Date().toISOString().slice(0, 16).replace('T', ' '), type: type.replace(/^[^A-Za-z]+/, ''), amount: (neg ? '-' : '+') + moneyFmt(amt || 0), after: newBal, by: 'superadmin', remark: rem, neg };
      return { ...prev, [pmIdx]: [entry, ...(prev[pmIdx] || [])] };
    });
    setPmTab('fin');
    toast('Adjustment applied ✔ New balance: ' + newBal);
  };

  const PM = pmIdx >= 0 ? players[pmIdx] : null;

  const renderRow = (p, i) => {
    const [user, name, , pid, cur, email, phone, bal, dep, vip, vc, act, ip, joined, hl] = p;
    return (
      <tr className={hl ? 'hl-' + hl : ''} data-i={i} key={i}>
        <td><input type="checkbox" className="pchk" data-i={i} /></td>
        <td><span className="pname"><a onClick={() => openPlayer(i)}>{user}</a><span className="rank"><span className="realname">{name}</span></span></span></td>
        <td><span className="idchip">{pid}</span><span className="curchip">{cur}</span></td>
        <td>{email}</td><td>{phone}</td>
        <td className="bal">{bal}</td><td>{dep}</td>
        <td><span className={`vipchip vip-${vc}`}>{vip}</span></td>
        <td><span className={act ? 'st-on' : 'st-off'}>{act ? 'Active' : 'Suspended'}</span></td>
        <td className="ipmono">{ip}</td><td>{joined}</td>
        <td><button className="mini-btn" onClick={() => openPlayer(i)}>View</button> {act
          ? <button className="act-suspend" onClick={() => togglePlayer(i)}>Suspend</button>
          : <button className="act-activate" onClick={() => togglePlayer(i)}>Activate</button>} <button className="act-suspend" onClick={() => delPlayer(i)}>Delete</button></td>
      </tr>
    );
  };

  const renderCard = (p, i) => {
    const [user, name, , pid, cur, email, phone, , dep, vip, vc, act, ip, joined, hl] = p;
    const bal = p[7];
    const row = (k, v, mono) => <div className="pcard-row"><span className="k">{k}</span><span className={`v${mono ? ' mono' : ''}`}>{v}</span></div>;
    return (
      <div className={`pcard${hl ? ' hl-' + hl : ''}`} data-i={i} key={i}>
        <div className="pcard-head" onClick={() => openPlayer(i)}>
          <div className="pcard-id"><span className="u">{user}</span><span className="n">{name}</span></div>
          <div className="pcard-bal"><span className="amt">{bal}</span><span className="chev">›</span></div>
        </div>
        <div className="pcard-body">
          {row('Player ID', <><span className="idchip">{pid}</span> <span className="curchip">{cur}</span></>)}
          {row('Email', email)}
          {row('Contact', phone)}
          {row('Total Deposit', dep)}
          {row('VIP Level', <span className={`vipchip vip-${vc}`}>{vip}</span>)}
          {row('Status', <span className={act ? 'st-on' : 'st-off'}>{act ? 'Active' : 'Suspended'}</span>)}
          {row('Register IP', ip, 1)}
          {row('Joined', joined, 1)}
        </div>
        <div className="pcard-foot">
          <button className="pc-view" onClick={(e) => { e.stopPropagation(); openPlayer(i); }}>View</button>
          {act
            ? <button className="act-suspend" onClick={(e) => { e.stopPropagation(); togglePlayer(i); }}>Suspend</button>
            : <button className="act-activate" onClick={(e) => { e.stopPropagation(); togglePlayer(i); }}>Activate</button>}
          <button className="act-suspend" onClick={(e) => { e.stopPropagation(); delPlayer(i); }}>Delete</button>
        </div>
      </div>
    );
  };

  // ---- Profile modal tab bodies ----
  const renderPmBody = () => {
    const [user, name, rank, , , email, phone, bal, dep, vip, , act, ip, joined, hl] = PM;
    const ro = (l, v) => <div className="pm-fld"><label>{l}</label><div className="ro">{v}</div></div>;
    if (pmTab === 'info') {
      return (
        <>
          {hl && <span className={`dup-chip ${dupLabel[hl][0]}`}>{dupLabel[hl][1]}</span>}
          <div className="pm-sect">Personal Information</div>
          <div className="pm-grid">
            <div className="pm-fld"><label>Full Name</label><input id="pmF_name" value={pmForm.name} onChange={(e) => setPmForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div className="pm-fld"><label>Username / ID</label><input id="pmF_user" value={pmForm.user} onChange={(e) => setPmForm((f) => ({ ...f, user: e.target.value }))} /></div>
            <div className="pm-fld"><label>Email</label><input id="pmF_email" value={pmForm.email} onChange={(e) => setPmForm((f) => ({ ...f, email: e.target.value }))} /></div>
            <div className="pm-fld"><label>Phone</label><input id="pmF_phone" value={pmForm.phone} onChange={(e) => setPmForm((f) => ({ ...f, phone: e.target.value }))} /></div>
            {ro('Date Joined', joined)}
            {ro('Player ID', '#' + String(rank).padStart(7, '0'))}
            <div className="pm-fld"><label>Status</label><select id="pmF_status" value={pmForm.status} onChange={(e) => setPmForm((f) => ({ ...f, status: e.target.value }))}><option>active</option><option>suspended</option><option>kyc pending</option><option>blocked</option></select></div>
            <div className="pm-fld"><label>VIP Tier</label><select id="pmF_vip" value={pmForm.vip} onChange={(e) => setPmForm((f) => ({ ...f, vip: e.target.value }))}><option>bronze</option><option>silver</option><option>gold</option><option>platinum</option><option>diamond</option></select></div>
          </div>
          <div className="pm-sect">Device &amp; Network</div>
          <div className="pm-grid">
            {ro('Register IP', <span className="ipmono">{ip}</span>)}
            {ro('Device / Browser', 'Chrome/Windows')}
          </div>
        </>
      );
    }
    if (pmTab === 'fin') {
      const wd = '₱' + Math.round(parseInt(dep.replace(/[^0-9]/g, '')) * 0.72).toLocaleString();
      const wager = '₱' + Math.round(parseInt(dep.replace(/[^0-9]/g, '')) * 2.4).toLocaleString();
      const hist = adj[pmIdx];
      return (
        <>
          <div className="pm-stats">
            <div className="pm-stat"><div className="v">{bal}</div><div className="l">Main Balance</div></div>
            <div className="pm-stat"><div className="v">{dep}</div><div className="l">Total Deposited</div></div>
            <div className="pm-stat"><div className="v">{wd}</div><div className="l">Total Withdrawn</div></div>
            <div className="pm-stat"><div className="v">{wager}</div><div className="l">Total Wager</div></div>
          </div>
          <div className="pm-card">
            <div className="ct">👑 Adjust Balance</div>
            <div className="pm-grid">
              <div className="pm-fld"><label>Type</label><select id="adjType" value={adjForm.type} onChange={(e) => setAdjForm((f) => ({ ...f, type: e.target.value }))}>
                <option>＋ Add Balance</option><option>－ Deduct Balance</option><option>🎁 Add Bonus</option>
                <option>🔄 Reset Balance to 0</option><option>📈 Adjust Turnover +</option><option>📉 Adjust Turnover −</option>
                <option>🎰 Adjust Free Spins +</option><option>🎰 Adjust Free Spins −</option></select></div>
              <div className="pm-fld"><label>Amount (₱)</label><input id="adjAmt" placeholder="₱ 0.00" inputMode="decimal" value={adjForm.amt} onChange={(e) => setAdjForm((f) => ({ ...f, amt: e.target.value }))} /></div>
            </div>
            <div className="pm-fld" style={{ marginTop: '12px' }}><label>Remark</label><textarea id="adjRemark" placeholder="Reason for adjustment…" value={adjForm.remark} onChange={(e) => setAdjForm((f) => ({ ...f, remark: e.target.value }))}></textarea></div>
            <button className="btn-adj" onClick={applyAdjustment}>👑 Apply Adjustment</button>
          </div>
          <div className="pm-card">
            <div className="ct">🔄 Reset Turnover</div>
            <div className="desc">Clear the player's current turnover/rollover progress to 0. Use this when manually overriding a wager requirement.</div>
            <div className="to-grid">
              <div className="to-box"><div className="l">Current Turnover</div><div className="v to-gold">0.00</div></div>
              <div className="to-box"><div className="l">T/O Requirement</div><div className="v to-red">0.00</div></div>
              <div className="to-box"><div className="l">After Reset</div><div className="v to-green">0.00</div></div>
            </div>
            <div className="pm-fld"><label>Remark</label><input placeholder="Reason for turnover reset…" /></div>
            <button className="btn-reset-to" onClick={() => toast('Turnover reset to 0 🔄')}>🔄 Reset Turnover to 0</button>
          </div>
          <div className="pm-sect">📋 Adjustment History</div>
          <table className="actv-tbl">
            <thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>After</th><th>By</th><th>Remark</th></tr></thead>
            <tbody>{(hist && hist.length) ? hist.map((a, i) => (
              <tr key={i}><td>{a.date}</td><td>{a.type}</td><td className={a.neg ? 'orange' : 'gold'}>{a.amount}</td><td>{a.after}</td><td>{a.by}</td><td>{a.remark || '—'}</td></tr>
            )) : <tr><td colSpan="6"><div className="hist-empty">No adjustments yet for this player.</div></td></tr>}</tbody>
          </table>
        </>
      );
    }
    if (pmTab === 'sec') {
      return (
        <>
          <div className="pm-sect">Security Info</div>
          <div className="pm-grid">
            {ro('Register IP', <span className="ipmono">{ip}</span>)}
            {ro('Last Login IP', <span className="ipmono">{ip}</span>)}
            {ro('Device', 'Chrome/Windows')}
            {ro('2FA Enabled', 'No')}
            {ro('Email Verified', <span style={{ color: 'var(--green)', fontWeight: 800 }}>✓ Verified</span>)}
            {ro('KYC Status', <span style={{ color: '#ff8c42', fontWeight: 800 }}>Pending</span>)}
          </div>
          {hl && <><div className="pm-sect red">⚠ Risk Flags</div>
            <div className="risk-box">
              <span className={`dup-chip ${dupLabel[hl][0]}`}>{dupLabel[hl][1]}</span><br />
              This player shares identifying information with other accounts. Please review carefully.
            </div></>}
          <div className="pm-sect">Actions</div>
          <div className="sec-acts">
            <button className="mini-btn" onClick={async () => {
              const id = players[pmIdx] && players[pmIdx][15];
              if (!id) { toast('No backend account for this row'); return; }
              const pw = window.prompt('Set a new password for ' + players[pmIdx][0] + ' (min 6 chars):');
              if (!pw) return;
              if (pw.length < 6) { toast('Password must be at least 6 characters'); return; }
              try { await resetPlayerPassword(id, pw); toast('Password reset ✔ for ' + players[pmIdx][0]); }
              catch (e) { toast('Could not reset: ' + (e?.response?.data?.error || e.message || 'error')); }
            }}>🔑 Reset Password</button>
            <button className="mini-btn" onClick={() => toast('2FA disabled 🔓')}>🔓 Disable 2FA</button>
            <button className="act-suspend" onClick={() => toast('Player suspended ⛔')}>⛔ Suspend</button>
            <button className="mini-btn red" onClick={() => toast('Account banned 🚫')}>🚫 Ban Account</button>
          </div>
        </>
      );
    }
    // activity
    return (
      <>
        <div className="pm-stats">
          <div className="pm-stat"><div className="v">50</div><div className="l">Total Bets</div></div>
          <div className="pm-stat"><div className="v">2</div><div className="l">Days Active</div></div>
          <div className="pm-stat"><div className="v">3</div><div className="l">Deposits</div></div>
          <div className="pm-stat"><div className="v">1</div><div className="l">Withdrawals</div></div>
        </div>
        <div className="pm-sect">Recent Activity</div>
        <table className="actv-tbl">
          <thead><tr><th>Time</th><th>Action</th><th>Details</th></tr></thead>
          <tbody>
            <tr><td>Today 14:22</td><td>Login</td><td className="mono">{ip}</td></tr>
            <tr><td>Today 14:25</td><td>Deposit</td><td className="gold">₱5,000 via GCash</td></tr>
            <tr><td>Today 14:30</td><td>Bet</td><td>Wolf Gold — ₱200</td></tr>
            <tr><td>Yesterday</td><td>Login</td><td className="mono">{ip}</td></tr>
            <tr><td>Yesterday</td><td>Withdrawal Request</td><td className="orange">₱3,000 — Pending</td></tr>
          </tbody>
        </table>
      </>
    );
  };

  return (
    <>
      <h1 className="hero-h">All Players</h1><div className="hero-sub">{players.length.toLocaleString()} registered player{players.length === 1 ? '' : 's'}.</div>
      <div className="card">
        <div className="filter-collapse">
          <span className="ttl">🔍 Filter Players</span><span className="cnt">11 fields</span>
          <button className="tgl" onClick={() => setFilterMin((m) => !m)}>{filterMin ? '▼ Expand' : '▲ Minimize'}</button>
        </div>
        <div id="filterBody" className={filterMin ? 'hide' : ''}>
          <div className="ptabs">
            <button className={`ptab ${activeTab === 'filter' ? 'active' : ''}`} onClick={() => setActiveTab('filter')}>Filter</button>
            <button className={`ptab ${activeTab === 'prod' ? 'active' : ''}`} onClick={() => setActiveTab('prod')}>Search By Prod. Username</button>
            <button className={`ptab ${activeTab === 'bulk' ? 'active' : ''}`} onClick={() => setActiveTab('bulk')}>Bulk Update</button>
          </div>

          <div id="ppFilter" style={{ display: activeTab === 'filter' ? '' : 'none' }}>
            <div className="filter-grid">
              {selF('Date Range', ['Select Range', 'Today', 'Yesterday', 'Last 7 Days', 'This Month', 'Custom…'])}
              {selF('Agent', ['Please Select', 'AG-Manila01', 'AG-Cebu88', 'AG-Hanoi12', 'AG-GZ-Wang'], 1)}
              {txtF('username', 'Username', 'Username')}
              {selF('Player Group', ['Select All', 'Normal', 'VIP', 'Risk Watch', 'Blocked'])}
              {txtF('name', 'Name', 'Full name')}
              {txtF('contact', 'Contact', 'Phone number')}
              {txtF('email', 'Email', 'Email address')}
              {selFC('status', 'Status', ['Please Select', 'Active', 'Inactive', 'Blocked'], 1)}
              {txtF('registerIp', 'Register IP', 'IP address')}
              {txtF('referral', 'Player Referral', 'Referral code')}
              {txtF('playerId', 'Player ID', 'ONW…')}
            </div>

            <div className={`adv-head ${advOpen ? '' : 'closed'}`} onClick={() => setAdvOpen((o) => !o)}>Advanced Search<span className="caret">▲</span></div>
            <div className={`adv-body ${advOpen ? '' : 'hide'}`} id="advBody">
              <AdvCard t="Internal Balance" a="Min ₱" b="Max ₱" />
              <AdvCard t="Player Referral" a="Min" b="Max" />
              <AdvCard t="Total Deposit" a="Min ₱" b="Max ₱" />
              <AdvCard t="Total Withdrawal" a="Min ₱" b="Max ₱" />
              <AdvCard t="Total Wager" a="Min ₱" b="Max ₱" />
              <AdvCard t="Last Login" a="mm/dd/yyyy" b="mm/dd/yyyy" type="date" />
            </div>

            <div className="filter-foot">
              <button className="btn-search" onClick={() => toast(`Found ${resCount} player${resCount !== 1 ? 's' : ''}`)}>🔍 Search</button>
              <button className="btn-ghost" onClick={resetFilters}>↺ Reset</button>
              <span className="right"><button className="btn-ghost" onClick={exportCSV}>⬇ Export CSV</button></span>
            </div>
          </div>

          <div id="ppProd" style={{ display: activeTab === 'prod' ? '' : 'none' }}>
            <div className="toolbar"><input placeholder="Provider username e.g. PP_lgx10422" /><select><option>All Providers</option><option>Pragmatic</option><option>Evolution</option><option>PG Soft</option><option>Spribe</option></select><button className="mini-btn gold" onClick={() => toast('Searching provider accounts…')}>🔍 Search</button></div>
            <div className="hero-sub">Find a player by their game-provider account username.</div>
          </div>

          <div id="ppBulk" style={{ display: activeTab === 'bulk' ? '' : 'none' }}>
            <div className="form-grid">
              <div className="fld"><label>Target Group</label><select><option>Selected players</option><option>Filtered results</option><option>Upload CSV list</option></select></div>
              <div className="fld"><label>Action</label><select id="bulkAction"><option>Change status</option><option>Change player group</option><option>Assign agent</option><option>Send notification</option></select></div>
              <div className="fld"><label>New Value</label><input id="bulkValue" placeholder="e.g. Blocked or Active" /></div>
              <div className="fld"><label>Remark</label><input placeholder="Reason / note" /></div>
            </div>
            <div style={{ marginTop: '14px' }}><button className="btn-search" onClick={() => toast('⚡ Bulk update applied')}>⚡ Apply Bulk Update</button></div>
          </div>
        </div>{/* /filterBody */}
      </div>

      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div className="ptable-head">
          <h3>Players</h3><span className="res-chip" id="resCount">{resCount} result{resCount === 1 ? '' : 's'}</span>
          <span className="sp"><input className="qsearch" placeholder="Quick search…" value={quick} onChange={(e) => setQuick(e.target.value)} /><button className="btn-add" onClick={() => setAddOpen(true)}>＋ Add Player</button></span>
        </div>
        <div className="hl-legend"><b>Highlights:</b>
          <span className="li"><span className="hl-sw sw-ip"></span>Same IP</span>
          <span className="li"><span className="hl-sw sw-ipname"></span>Same IP + Same Name</span>
          <span className="li"><span className="hl-sw sw-namepass"></span>Same Name + Same Password</span>
          <span className="li"><span className="hl-sw sw-full"></span>Same Name + IP + Device + Password</span>
        </div>
        <div className="table-wrap players" style={{ border: 'none', borderRadius: 0 }}>
          <table id="playersTbl">
            <thead><tr>
              <th><input type="checkbox" className="pchk" /></th>
              <th>Player</th><th>Player ID</th><th>Email</th><th>Contact</th><th>Balance</th><th>Total Deposit</th><th>VIP Level</th><th>Status</th><th>Register IP</th><th>Joined</th><th>Actions</th>
            </tr></thead>
            <tbody>{visible.map(({ p, i }) => renderRow(p, i))}</tbody>
          </table>
        </div>
        <div className="players-cards" id="playersCards">{visible.map(({ p, i }) => renderCard(p, i))}</div>
      </div>

      {/* Add Player Modal */}
      {addOpen && (
        <div className="modal-ov show" id="apModal" onClick={(e) => { if (e.target === e.currentTarget) setAddOpen(false); }}>
          <div className="pm-modal" style={{ maxWidth: '440px' }}>
            <div className="pm-head">
              <span style={{ fontSize: '1.3rem' }}>👤</span>
              <span><div className="nm">Add Player</div><div className="meta">Create a new player account</div></span>
              <button className="kyc-x" style={{ marginLeft: 'auto' }} onClick={() => setAddOpen(false)} aria-label="Close">✕</button>
            </div>
            <div className="pm-body">
              <div className="pm-grid">
                <div className="pm-fld"><label>Username *</label><input id="apUser" placeholder="e.g. newplayer01" value={apForm.user} onChange={(e) => setApForm((f) => ({ ...f, user: e.target.value }))} /></div>
                <div className="pm-fld"><label>Full Name *</label><input id="apName" placeholder="e.g. Juan Reyes" value={apForm.name} onChange={(e) => setApForm((f) => ({ ...f, name: e.target.value }))} /></div>
                <div className="pm-fld"><label>Email</label><input id="apEmail" placeholder="email@example.com" value={apForm.email} onChange={(e) => setApForm((f) => ({ ...f, email: e.target.value }))} /></div>
                <div className="pm-fld"><label>Phone</label><input id="apPhone" placeholder="+63 9XX XXX XXXX" value={apForm.phone} onChange={(e) => setApForm((f) => ({ ...f, phone: e.target.value }))} /></div>
                <div className="pm-fld"><label>Currency</label><select id="apCur" value={apForm.cur} onChange={(e) => setApForm((f) => ({ ...f, cur: e.target.value }))}><option>PHP</option><option>CNY</option><option>VND</option><option>THB</option><option>IDR</option><option>MYR</option></select></div>
                <div className="pm-fld"><label>VIP Tier</label><select id="apVip" value={apForm.vip} onChange={(e) => setApForm((f) => ({ ...f, vip: e.target.value }))}><option>Bronze</option><option>Silver</option><option>Gold</option><option>Platinum</option><option>Diamond</option></select></div>
              </div>
            </div>
            <div className="pm-foot">
              <button className="btn-cancel" onClick={() => setAddOpen(false)}>Cancel</button>
              <button className="btn-pm-save" onClick={saveNewPlayer}>💾 Create Player</button>
            </div>
          </div>
        </div>
      )}

      {/* Player Profile Modal */}
      {PM && pmForm && (
        <div className="modal-ov show" id="pmModal" onClick={(e) => { if (e.target === e.currentTarget) closePlayer(); }}>
          <div className="pm-modal">
            <div className="pm-head">
              <span className="pavatar" id="pmAvatar">{initials(PM[1])}</span>
              <span><div className="nm" id="pmName">{PM[1]}</div><div className="meta" id="pmMeta">ID #{String(PM[2]).padStart(7, '0')} · {PM[5]} · {PM[11] ? 'active' : 'suspended'}</div></span>
              <button className="kyc-x" style={{ marginLeft: 'auto' }} onClick={closePlayer} aria-label="Close">✕</button>
            </div>
            <div className="pm-tabs">
              <button className={`pm-tab ${pmTab === 'info' ? 'active' : ''}`} onClick={() => setPmTab('info')}>👤 Info</button>
              <button className={`pm-tab ${pmTab === 'fin' ? 'active' : ''}`} onClick={() => setPmTab('fin')}>💰 Financial</button>
              <button className={`pm-tab ${pmTab === 'sec' ? 'active' : ''}`} onClick={() => setPmTab('sec')}>🔒 Security</button>
              <button className={`pm-tab ${pmTab === 'act' ? 'active' : ''}`} onClick={() => setPmTab('act')}>📋 Activity</button>
            </div>
            <div className="pm-body" id="pmBody">{renderPmBody()}</div>
            <div className="pm-foot">
              <button className="btn-cancel" onClick={closePlayer}>Close</button>
              {PM[11] ? <button className="btn-pm-suspend" id="pmSuspend" onClick={pmSuspend}>⛔ Suspend</button> : null}
              <button className="btn-pm-save" onClick={pmSaveChanges}>💾 Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
