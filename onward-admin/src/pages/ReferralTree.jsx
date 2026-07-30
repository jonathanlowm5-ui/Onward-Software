import { useEffect, useMemo, useState } from 'react';
import { useUI } from '../context/UIContext';
import { getReferralTree } from '../services/configService';

// Real referral tree — agent roots → referred players → their referrals (reports/referral-tree).
const countAll = (nodes) => nodes.reduce((s, n) => s + 1 + countAll(n.children || []), 0);
const matches = (n, q) => {
  if (!q) return true;
  const label = (n.agent || n.username || '') + ' ' + (n.code || n.playerCode || '');
  if (label.toLowerCase().includes(q)) return true;
  return (n.children || []).some((c) => matches(c, q));
};

function Node({ n, depth, q, openSet, toggle }) {
  if (!matches(n, q)) return null;
  const isRoot = !!n.agent;
  const kids = n.children || [];
  const open = q ? true : openSet.has(n.id);
  return (
    <div style={{ marginLeft: depth ? 18 : 0, borderLeft: depth ? '1px solid var(--border,#243049)' : 'none', paddingLeft: depth ? 12 : 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 8, background: isRoot ? 'var(--panel-3,#1b2541)' : 'transparent', marginTop: 4 }}>
        {kids.length > 0
          ? <button className="mini-btn" style={{ padding: '2px 8px', minWidth: 28 }} onClick={() => toggle(n.id)}>{open ? '−' : '+'}</button>
          : <span style={{ width: 28, textAlign: 'center', color: 'var(--muted)' }}>·</span>}
        <span>{isRoot ? '👑' : '👤'}</span>
        <span style={{ fontWeight: isRoot ? 800 : 600 }}>{n.agent || n.username}</span>
        <span className="code-chip">{n.code || n.playerCode || '—'}</span>
        {n.registered && <span style={{ fontSize: 11, color: 'var(--muted)' }}>joined {n.registered}</span>}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)' }}>
          {kids.length > 0 ? `${countAll(kids)} downline` : 'no referrals'}
        </span>
        <span className={`aa-status2 ${n.status === 'active' ? 's-app' : 's-pend'}`} style={{ fontSize: 10 }}>{n.status || '—'}</span>
      </div>
      {open && kids.map((c) => <Node key={c.id} n={c} depth={depth + 1} q={q} openSet={openSet} toggle={toggle} />)}
    </div>
  );
}

export default function ReferralTree() {
  const { toast } = useUI();
  const [tree, setTree] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [openSet, setOpenSet] = useState(() => new Set());

  useEffect(() => {
    getReferralTree()
      .then((d) => { setTree(Array.isArray(d?.tree) ? d.tree : []); setLoaded(true); })
      .catch((e) => { setLoaded(true); toast('⚠ ' + (e.message || 'Failed to load referral tree')); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const q = search.trim().toLowerCase();
  const toggle = (id) => setOpenSet((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const totals = useMemo(() => ({
    roots: tree.length,
    players: countAll(tree.flatMap((r) => r.children || [])),
  }), [tree]);

  const visibleRoots = tree.filter((r) => matches(r, q));

  return (
    <>
      <h1 className="hero-h">🌳 Referral Tree</h1>
      <div className="hero-sub">Live downline structure — agents at the root, referred players (and their referrals) underneath.</div>

      <div className="grid kpi-grid">
        <div className="card kpi b"><div className="lbl">Root Referrers</div><div className="val">{totals.roots}</div><div className="trend" style={{ color: 'var(--muted)' }}>agents & player codes</div></div>
        <div className="card kpi g"><div className="lbl">Referred Players</div><div className="val">{totals.players}</div><div className="trend" style={{ color: 'var(--muted)' }}>all levels</div></div>
      </div>

      <div className="card" style={{ marginTop: 'var(--pad)' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
          <input className="qsearch" style={{ flex: 1 }} placeholder="Search username or referral code…" value={search} onInput={(e) => setSearch(e.target.value)} />
          {q && <button className="mini-btn" onClick={() => setSearch('')}>✕ Clear</button>}
        </div>
        {!loaded && <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 26 }}>Loading…</div>}
        {loaded && tree.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 26 }}>No referral relationships yet — links are generated per agent under Referral Links.</div>
        )}
        {loaded && tree.length > 0 && visibleRoots.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 26 }}>No branch matches “{search}”.</div>
        )}
        {visibleRoots.map((r) => <Node key={r.id} n={r} depth={0} q={q} openSet={openSet} toggle={toggle} />)}
      </div>
    </>
  );
}
