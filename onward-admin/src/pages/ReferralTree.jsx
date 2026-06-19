import { useMemo, useState } from 'react';
import { useUI } from '../context/UIContext';

// Ported from V["referral-tree"] (REFTREE + rtBuildChildren engine).
const RT_NAMES = [['Anh Nguyen', 'anhng'], ['Pedro Reyes', 'pedror'], ['Ana Garcia', 'anag'], ['Jun Mendoza', 'junm'], ['Lea Villanueva', 'leav'], ['Rosa Cruz', 'rosac'], ['Bong Santos', 'bongs'], ['Mei Lin', 'meilin'], ['Somchai P.', 'somchai'], ['Budi Hartono', 'budih'], ['Tran Van', 'tranv'], ['Kim Soo', 'kimsoo'], ['Lila Wong', 'lilaw'], ['Diego Cruz', 'diegoc']];
const RT_BADGE_POOL = [['Senior', 'senior'], ['Member', 'member'], ['Gold', 'vip'], ['Member', 'member'], ['Senior', 'senior']];
const RT_COMM = { 1: '5%', 2: '3%', 3: '1%' };

const rtEarn = (n) => '₱' + (n >= 1000 ? Math.round(n / 1000) + 'K' : n);

function buildTree() {
  let uid = 0;
  let nodeId = 0;
  const buildChildren = (childLevel, totalDown) => {
    if (childLevel > 3 || totalDown <= 0) return [];
    const cap = childLevel === 1 ? 6 : childLevel === 2 ? 4 : 0;
    const show = Math.min(totalDown, cap);
    const arr = [];
    for (let i = 0; i < show; i++) {
      const nm = RT_NAMES[uid % RT_NAMES.length];
      const bd = RT_BADGE_POOL[uid % RT_BADGE_POOL.length];
      uid++;
      const myDown = childLevel === 1 ? Math.floor(Math.random() * 90) : childLevel === 2 ? Math.floor(Math.random() * 9) : 0;
      arr.push({
        id: 'rtc' + nodeId++, name: nm[0], user: nm[1], badge: bd[0], badgeCls: bd[1],
        down: myDown, earned: rtEarn(3000 + Math.floor(Math.random() * 60000)), level: childLevel,
        kids: buildChildren(childLevel + 1, myDown),
      });
    }
    return arr;
  };
  const root = {
    name: 'Juan dela Cruz', user: 'juan88', code: 'JUAN88', rank: 'Master Affiliate', joined: 'Jan 2024', earned: '₱284K', down: 42,
    kids: [
      { id: 'rtc' + nodeId++, name: 'Maria Santos', user: 'marias', badge: 'Senior', badgeCls: 'senior', down: 104, earned: '₱142K', level: 1, kids: buildChildren(2, 104) },
      { id: 'rtc' + nodeId++, name: 'Carlo Reyes', user: 'carlor', badge: 'Member', badgeCls: 'member', down: 0, earned: '₱38K', level: 1, kids: [] },
      ...buildChildren(1, 40).slice(0, 4),
    ],
  };
  return root;
}

// Does a node (or any descendant) match the search query?
function nodeMatches(node, q) {
  if (!q) return true;
  if ((node.name + ' ' + node.user).toLowerCase().includes(q)) return true;
  return (node.kids || []).some((k) => nodeMatches(k, q));
}

function RtNode({ node, showLevels, q, openSet, toggle }) {
  if (node.level > showLevels) return null;
  if (!nodeMatches(node, q)) return null;

  const childLvl = node.level + 1;
  const canExpand = node.down > 0 && node.kids && node.kids.length;
  // Auto-open when searching and a descendant matches; otherwise honor manual toggle.
  const searching = !!q;
  const open = searching ? true : openSet.has(node.id);
  const moreN = node.kids ? node.down - node.kids.length : 0;

  return (
    <div className={`rt-node lvl${node.level}`}>
      <div className="rt-row">
        <div className="rt-main">
          <span className="rt-av">👤</span>
          <span className="rt-nm">{node.name}</span>
          <span className="rt-user">({node.user})</span>
          {node.badge && <span className={`rt-badge ${node.badgeCls}`}>{node.badge}</span>}
        </div>
        <div className="rt-stats">
          {node.down > 0 && <span className="rt-down">L{childLvl} Downline: <b>{node.down}</b></span>}
          <span className="rt-earn">Earned: <b>{node.earned}</b></span>
          {canExpand && (
            <button className="rt-exp" onClick={() => toggle(node.id)}>{open ? '− Collapse' : '+ Expand'}</button>
          )}
        </div>
      </div>
      {node.kids && node.kids.length > 0 && (
        <div className={`rt-children${open ? ' open' : ''}`}>
          {node.kids.map((k) => (
            <RtNode key={k.id} node={k} showLevels={showLevels} q={q} openSet={openSet} toggle={toggle} />
          ))}
          {!searching && moreN > 0 && (
            <div className="rt-more">…and {moreN} more Level {childLvl} player{moreN === 1 ? '' : 's'}</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReferralTree() {
  const { toast } = useUI();
  const tree = useMemo(buildTree, []);
  const [search, setSearch] = useState('');
  const [showLevels, setShowLevels] = useState(3);
  const [openSet, setOpenSet] = useState(() => new Set());

  const q = search.toLowerCase().trim();
  const lvl1 = tree.kids;
  const moreN = tree.down - lvl1.length;

  const toggle = (id) => {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <>
      <h1 className="hero-h">🌳 Referral Tree</h1>
      <div className="hero-sub">View the full MLM downline structure for any player.</div>
      <div className="card">
        <div className="rt-search">
          <div className="rt-fld"><label>Search Player</label><input placeholder="Username or referral code…" value={search} onInput={(e) => setSearch(e.target.value)} /></div>
          <div className="rt-fld rt-fld-sm"><label>Show Levels</label>
            <select value={showLevels} onChange={(e) => setShowLevels(+e.target.value)}>
              <option value={3}>All 3 Levels</option>
              <option value={1}>Level 1 only</option>
              <option value={2}>Levels 1–2</option>
            </select>
          </div>
          <button className="btn-search gold rt-go" onClick={() => toast('🔍 Search — demo')}>🔍 Search</button>
        </div>
      </div>
      <div className="card">
        <div className="rt-root">
          <div className="rt-root-l">
            <span className="rt-crown">👑</span>
            <div>
              <div className="rt-root-nm">{tree.name} <span className="rt-user">({tree.user})</span></div>
              <div className="rt-root-meta">Ref Code: <b>{tree.code}</b> · {tree.rank} · Joined {tree.joined}</div>
            </div>
          </div>
          <div className="rt-root-earn">Total Earned: <b>{tree.earned}</b></div>
        </div>
        <div className="rt-level-label">Level 1 — Direct Referrals ({tree.down} players · {RT_COMM[1]} commission)</div>
        <div className="rt-l1">
          {lvl1.map((k) => (
            <RtNode key={k.id} node={k} showLevels={showLevels} q={q} openSet={openSet} toggle={toggle} />
          ))}
          {!q && moreN > 0 && <div className="rt-more">…and {moreN} more Level 1 players</div>}
        </div>
      </div>
    </>
  );
}
