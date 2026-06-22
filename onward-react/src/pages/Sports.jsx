import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useUI } from '../context/UIContext';
import BannerCarousel from '../components/promotions/BannerCarousel.jsx';

/* ──────────────────────────────────────────────────────────
   Local data (mirrors the original inline sportsbook data).
   The original used data-URI flag images via cfFlag()/nbaLogo();
   here we substitute emoji flags so output stays self-contained.
   ────────────────────────────────────────────────────────── */

const ISO_EMOJI = {
  br: '🇧🇷', ar: '🇦🇷', fr: '🇫🇷', gb: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', de: '🇩🇪', es: '🇪🇸',
  pt: '🇵🇹', nl: '🇳🇱', us: '🇺🇸', mx: '🇲🇽', jp: '🇯🇵', kr: '🇰🇷',
  ma: '🇲🇦', sn: '🇸🇳', au: '🇦🇺', ph: '🇵🇭', ca: '🇨🇦', ec: '🇪🇨',
  co: '🇨🇴', hr: '🇭🇷', rs: '🇷🇸', ch: '🇨🇭', pl: '🇵🇱', ua: '🇺🇦',
  ci: '🇨🇮', ng: '🇳🇬', eg: '🇪🇬', sa: '🇸🇦', hk: '🇭🇰', it: '🇮🇹',
  dk: '🇩🇰', cn: '🇨🇳', cl: '🇨🇱',
};
const flag = (iso) => ISO_EMOJI[iso] || '🏳️';
const nbaIcon = '🏀';

const SP_PROMOS = [
  { tag: 'New Feature', title: 'Stake Shield', sub: 'Add 3+ legs to enable Stake Shield', img: '🛡️', color: '#1a3a1a', btn: 'View More Info' },
  { tag: 'Promotion', title: 'World Cup 2026', sub: 'Live Outright & Match Winner Markets', img: '🏆', color: '#1a1a3a', btn: 'Bet & Watch' },
  { tag: 'Promotion', title: 'NBA Refund', sub: 'Start Of 4th Quarter Comeback Refund', img: '🏀', color: '#2a1a1a', btn: 'Bet Now' },
];

const SP_TOP_MATCHES_DATA = [
  { home: { name: 'Brazil', flag: flag('br') }, away: { name: 'Argentina', flag: flag('ar') }, league: '⚽ World Cup 2026', leagueName: 'FIFA World Cup 2026', minute: '43', hotPct: 86, hotTeam: 'Argentina', odds: { h: '2.10', d: '3.40', a: '1.80' } },
  { home: { name: 'France', flag: flag('fr') }, away: { name: 'England', flag: flag('gb') }, league: '⚽ World Cup 2026', leagueName: 'FIFA World Cup 2026', minute: '67', hotPct: 74, hotTeam: 'France', odds: { h: '1.90', d: '3.60', a: '2.20' } },
  { home: { name: 'Lakers', flag: nbaIcon }, away: { name: 'Warriors', flag: nbaIcon }, league: '🏀 NBA', leagueName: 'NBA 2025-26', quarter: 'Q3', hotPct: 81, hotTeam: 'Warriors', odds: { h: '1.75', d: null, a: '2.05' } },
  { home: { name: 'Spain', flag: flag('es') }, away: { name: 'Germany', flag: flag('de') }, league: '⚽ World Cup 2026', leagueName: 'FIFA World Cup 2026', minute: '12', hotPct: 65, hotTeam: 'Spain', odds: { h: '2.80', d: '3.10', a: '2.50' } },
  { home: { name: 'Celtics', flag: nbaIcon }, away: { name: 'Heat', flag: nbaIcon }, league: '🏀 NBA', leagueName: 'NBA 2025-26', quarter: 'Q2', hotPct: 77, hotTeam: 'Celtics', odds: { h: '1.55', d: null, a: '2.45' } },
  { home: { name: 'Portugal', flag: flag('pt') }, away: { name: 'Netherlands', flag: flag('nl') }, league: '⚽ World Cup 2026', leagueName: 'FIFA World Cup 2026', minute: '31', hotPct: 71, hotTeam: 'Portugal', odds: { h: '1.60', d: '3.80', a: '3.10' } },
  { home: { name: 'Japan', flag: flag('jp') }, away: { name: 'Croatia', flag: flag('hr') }, league: '⚽ World Cup 2026', leagueName: 'FIFA World Cup 2026', minute: '55', hotPct: 68, hotTeam: 'Japan', odds: { h: '2.40', d: '3.20', a: '2.60' } },
  { home: { name: 'Morocco', flag: flag('ma') }, away: { name: 'Senegal', flag: flag('sn') }, league: '⚽ World Cup 2026', leagueName: 'FIFA World Cup 2026', minute: '78', hotPct: 59, hotTeam: 'Morocco', odds: { h: '2.10', d: '3.30', a: '2.80' } },
];

const SP_WC_OUTRIGHT = [
  { team: 'Spain', flag: flag('es'), odds: '5.75' },
  { team: 'France', flag: flag('fr'), odds: '5.75' },
  { team: 'England', flag: flag('gb'), odds: '7.50' },
  { team: 'Brazil', flag: flag('br'), odds: '9.00' },
  { team: 'Argentina', flag: flag('ar'), odds: '10.00' },
  { team: 'Portugal', flag: flag('pt'), odds: '10.00' },
  { team: 'Germany', flag: flag('de'), odds: '14.00' },
  { team: 'Netherlands', flag: flag('nl'), odds: '21.00' },
  { team: 'Netherlands', flag: flag('nl'), odds: '21.00' },
  { team: 'Croatia', flag: flag('hr'), odds: '25.00' },
  { team: 'Morocco', flag: flag('ma'), odds: '28.00' },
  { team: 'Japan', flag: flag('jp'), odds: '31.00' },
  { team: 'USA', flag: flag('us'), odds: '33.00' },
  { team: 'Mexico', flag: flag('mx'), odds: '41.00' },
  { team: 'Colombia', flag: flag('co'), odds: '51.00' },
  { team: 'Senegal', flag: flag('sn'), odds: '81.00' },
  { team: 'Ecuador', flag: flag('ec'), odds: '101.00' },
  { team: 'Canada', flag: flag('ca'), odds: '126.00' },
];

const SP_TOP_SPORTS = [
  { name: 'Soccer', icon: '⚽', grad: 'linear-gradient(135deg,#1565c0,#0d47a1)' },
  { name: 'Tennis', icon: '🎾', grad: 'linear-gradient(135deg,#c62828,#b71c1c)' },
  { name: 'Basketball', icon: '🏀', grad: 'linear-gradient(135deg,#e65100,#bf360c)' },
  { name: 'Baseball', icon: '⚾', grad: 'linear-gradient(135deg,#283593,#1a237e)' },
  { name: 'CS2', icon: '🎮', grad: 'linear-gradient(135deg,#4a148c,#311b92)' },
  { name: 'Ice Hockey', icon: '🏒', grad: 'linear-gradient(135deg,#006064,#004d40)' },
  { name: 'Cricket', icon: '🏏', grad: 'linear-gradient(135deg,#1b5e20,#33691e)' },
  { name: 'Dota 2', icon: '🗡️', grad: 'linear-gradient(135deg,#880e4f,#ad1457)' },
];

const LE_SPORTS = [
  { id: 'all', icon: '🌐', label: 'All', count: 0 },
  { id: 'wc', icon: '⚽', label: 'Soccer', count: 0 },
  { id: 'nba', icon: '🏀', label: 'Basketball', count: 0 },
  { id: 'tennis', icon: '🎾', label: 'Tennis', count: 8 },
  { id: 'cricket', icon: '🏏', label: 'Cricket', count: 3 },
  { id: 'baseball', icon: '⚾', label: 'Baseball', count: 2 },
  { id: 'tabletennis', icon: '🏓', label: 'Table Tennis', count: 5 },
  { id: 'handball', icon: '🤾', label: 'Handball', count: 4 },
  { id: 'esports', icon: '🎮', label: 'CS2', count: 2 },
  { id: 'dota', icon: '🗡️', label: 'Dota 2', count: 1 },
];

const LE_EVENTS = {
  wc: [
    { league: '⚽ FIFA World Cup 2026 · Group A', matches: [
      { home: { name: 'Brazil', flag: flag('br') }, away: { name: 'Argentina', flag: flag('ar') }, status: "2nd Half 67'", sets: null, score: { h: 1, a: 1 }, odds: { h: '2.10', d: '3.40', a: '1.80' }, extra: 5, suspended: false },
      { home: { name: 'France', flag: flag('fr') }, away: { name: 'England', flag: flag('gb') }, status: "1st Half 34'", sets: null, score: { h: 0, a: 0 }, odds: { h: '1.90', d: '3.60', a: '2.20' }, extra: 3, suspended: false },
      { home: { name: 'Spain', flag: flag('es') }, away: { name: 'Germany', flag: flag('de') }, status: 'HT', sets: null, score: { h: 1, a: 0 }, odds: { h: '1.75', d: '3.20', a: '2.80' }, extra: 6, suspended: false },
      { home: { name: 'Portugal', flag: flag('pt') }, away: { name: 'USA', flag: flag('us') }, status: "2nd Half 58'", sets: null, score: { h: 2, a: 0 }, odds: { h: '1.50', d: '3.80', a: '3.50' }, extra: 4, suspended: false },
    ] },
    { league: '⚽ FIFA World Cup 2026 · Group B', matches: [
      { home: { name: 'Netherlands', flag: flag('nl') }, away: { name: 'Mexico', flag: flag('mx') }, status: "2nd Half 72'", sets: null, score: { h: 1, a: 2 }, odds: { h: '2.20', d: '3.10', a: '2.00' }, extra: 4, suspended: false },
      { home: { name: 'Morocco', flag: flag('ma') }, away: { name: 'Colombia', flag: flag('co') }, status: "1st Half 22'", sets: null, score: { h: 0, a: 0 }, odds: { h: '2.80', d: '2.90', a: '2.50' }, extra: 3, suspended: false },
      { home: { name: 'South Korea', flag: flag('kr') }, away: { name: 'Canada', flag: flag('ca') }, status: "2nd Half 81'", sets: null, score: { h: 1, a: 1 }, odds: { h: '2.60', d: '3.00', a: '2.40' }, extra: 5, suspended: false },
    ] },
    { league: '⚽ FIFA World Cup 2026 · Round of 16', matches: [
      { home: { name: 'Japan', flag: flag('jp') }, away: { name: 'Croatia', flag: flag('hr') }, status: "2nd Half 78'", sets: null, score: { h: 2, a: 1 }, odds: { h: '1.45', d: '4.10', a: '3.20' }, extra: 4, suspended: false },
      { home: { name: 'Ecuador', flag: flag('ec') }, away: { name: 'Senegal', flag: flag('sn') }, status: "1st Half 18'", sets: null, score: { h: 0, a: 0 }, odds: { h: '2.30', d: '3.10', a: '2.70' }, extra: 3, suspended: false },
    ] },
    { league: '⚽ FIFA World Cup 2026 · Quarter-Final', matches: [
      { home: { name: 'Brazil', flag: flag('br') }, away: { name: 'France', flag: flag('fr') }, status: 'Starting Soon', sets: null, score: { h: null, a: null }, odds: { h: '2.00', d: '3.50', a: '2.10' }, extra: 8, suspended: false },
    ] },
  ],
  nba: [
    { league: '🏀 NBA 2025-26 · Playoffs', matches: [
      { home: { name: 'Lakers', flag: nbaIcon }, away: { name: 'Warriors', flag: nbaIcon }, status: 'Q3', sets: '8:42', score: { h: 87, a: 92 }, odds: { h: '1.90', d: null, a: '1.95' }, extra: 8, suspended: false },
      { home: { name: 'Celtics', flag: nbaIcon }, away: { name: 'Heat', flag: nbaIcon }, status: 'Q2', sets: '3:15', score: { h: 54, a: 48 }, odds: { h: '1.55', d: null, a: '2.45' }, extra: 5, suspended: false },
      { home: { name: 'Bucks', flag: nbaIcon }, away: { name: 'Suns', flag: nbaIcon }, status: 'Q4', sets: '1:20', score: { h: 108, a: 105 }, odds: { h: '1.80', d: null, a: '2.05' }, extra: 6, suspended: true },
      { home: { name: 'Nuggets', flag: nbaIcon }, away: { name: 'Knicks', flag: nbaIcon }, status: 'Q1', sets: '11:03', score: { h: 18, a: 22 }, odds: { h: '1.65', d: null, a: '2.20' }, extra: 7, suspended: false },
    ] },
  ],
  tennis: [
    { league: '🎾 ATP Challenger · Birmingham, Great Britain Men Singles', matches: [
      { home: { name: 'Coleman Wong', flag: flag('hk') }, away: { name: 'Oliver Tarvet', flag: flag('gb') }, status: '2nd Set', sets: '1 4 15\n0 5 0', score: null, odds: { h: '1.25', d: null, a: '3.65' }, extra: 8, suspended: false },
      { home: { name: 'Clement Chidekh', flag: flag('fr') }, away: { name: 'Filippo Romano', flag: flag('it') }, status: '2nd Set', sets: '1 4 0\n0 5 0', score: null, odds: { h: '1.40', d: null, a: '2.70' }, extra: 7, suspended: false },
      { home: { name: 'Mackenzie McDonald', flag: flag('us') }, away: { name: 'Nicolai Kjaer', flag: flag('dk') }, status: '2nd Set', sets: '1 2 15\n0 3 30', score: null, odds: { h: '1.55', d: null, a: '2.25' }, extra: 8, suspended: false },
    ] },
    { league: '🎾 WTA 125K · Foggia, Italy Women Singles', matches: [
      { home: { name: 'Leyre Gormaz', flag: flag('es') }, away: { name: 'Xiaodi You', flag: flag('cn') }, status: '3rd Set', sets: '1 5 40\n1 0 40', score: null, odds: { h: null, d: null, a: null }, extra: 2, suspended: true },
      { home: { name: 'Laura Mair', flag: flag('it') }, away: { name: 'Yiming Dang', flag: flag('cn') }, status: '3rd Set', sets: '1 0 0\n1 0 0', score: null, odds: { h: '1.50', d: null, a: '2.45' }, extra: 6, suspended: false },
    ] },
  ],
};

const OT_INTCLUBS = ['UEFA Champions League 2025-26', 'UEFA Europa League 2025-26', 'FIFA Club World Cup 2025'];

/* ── Live-match generation (simplified, faithful card markup) ── */
const LS_WC_TEAMS = [
  { name: 'Brazil', flag: flag('br') }, { name: 'Argentina', flag: flag('ar') },
  { name: 'France', flag: flag('fr') }, { name: 'England', flag: flag('gb') },
  { name: 'Germany', flag: flag('de') }, { name: 'Spain', flag: flag('es') },
  { name: 'Portugal', flag: flag('pt') }, { name: 'Netherlands', flag: flag('nl') },
];
const LS_NBA_TEAMS = [
  { name: 'Lakers', flag: nbaIcon }, { name: 'Warriors', flag: nbaIcon },
  { name: 'Celtics', flag: nbaIcon }, { name: 'Heat', flag: nbaIcon },
  { name: 'Bucks', flag: nbaIcon }, { name: 'Suns', flag: nbaIcon },
  { name: 'Nuggets', flag: nbaIcon }, { name: 'Knicks', flag: nbaIcon },
];
const LS_WC_STAGES = ['Group Stage', 'Round of 16', 'Quarter-Final', 'Semi-Final', 'Final'];
const LS_NBA_QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4', 'OT'];
const lsRandInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const lsRandItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

function generateMatchEvents(home, away, hs, as) {
  const events = [];
  for (let g = 0; g < hs; g++) events.push({ type: 'goal', team: home, minute: lsRandInt(1, 90) });
  for (let g = 0; g < as; g++) events.push({ type: 'goal', team: away, minute: lsRandInt(1, 90) });
  const cards = lsRandInt(0, 3);
  for (let c = 0; c < cards; c++) events.push({ type: Math.random() > 0.7 ? 'red' : 'yellow', team: Math.random() > 0.5 ? home : away, minute: lsRandInt(1, 90) });
  return events.sort((a, b) => a.minute - b.minute);
}

function generateLiveMatches() {
  const matches = [];
  let id = 1;
  const pairs = [[0, 1], [2, 3], [4, 5], [6, 7]];
  pairs.forEach(([a, b]) => {
    const status = lsRandItem(['LIVE', 'LIVE', 'LIVE', 'HT', 'FT', 'NS']);
    const isLive = status === 'LIVE' || status === 'HT';
    const isFT = status === 'FT';
    const isNS = status === 'NS';
    const homeScore = isNS ? null : lsRandInt(0, 3);
    const awayScore = isNS ? null : lsRandInt(0, 3);
    const minute = isLive ? lsRandInt(1, 90) : (isFT ? 90 : null);
    const events = isLive || isFT ? generateMatchEvents(LS_WC_TEAMS[a].name, LS_WC_TEAMS[b].name, homeScore, awayScore) : [];
    matches.push({
      id: id++, league: 'wc', leagueName: 'FIFA World Cup 2026', leagueFlag: '🏆',
      stage: lsRandItem(LS_WC_STAGES),
      home: LS_WC_TEAMS[a], away: LS_WC_TEAMS[b],
      homeScore, awayScore, status, minute, events,
      odds: { home: (1.5 + Math.random() * 3).toFixed(2), draw: (2.8 + Math.random() * 1.5).toFixed(2), away: (1.5 + Math.random() * 3).toFixed(2) },
      viewers: lsRandInt(8000, 120000),
    });
  });
  pairs.forEach(([a, b]) => {
    const status = lsRandItem(['LIVE', 'LIVE', 'LIVE', 'HT', 'FT', 'NS']);
    const isLive = status === 'LIVE' || status === 'HT';
    const isFT = status === 'FT';
    const isNS = status === 'NS';
    const homeScore = isNS ? null : lsRandInt(68, 132);
    const awayScore = isNS ? null : lsRandInt(68, 132);
    const quarter = isLive ? lsRandItem(LS_NBA_QUARTERS) : (isFT ? 'Final' : null);
    const timeLeft = isLive && quarter !== 'OT' ? lsRandInt(0, 11) + ':' + String(lsRandInt(0, 59)).padStart(2, '0') : null;
    matches.push({
      id: id++, league: 'nba', leagueName: 'NBA 2025-26', leagueFlag: '🏀',
      stage: 'Regular Season',
      home: LS_NBA_TEAMS[a], away: LS_NBA_TEAMS[b],
      homeScore, awayScore, status,
      quarter, timeLeft, events: [],
      odds: { home: (1.5 + Math.random() * 2).toFixed(2), away: (1.5 + Math.random() * 2).toFixed(2) },
      viewers: lsRandInt(5000, 80000),
    });
  });
  return matches;
}

export default function Sports() {
  const { openModal } = useUI();
  const reg = () => openModal('register');

  const [navTab, setNavTab] = useState('home');
  const [search, setSearch] = useState('');
  const [tmOffset, setTmOffset] = useState(0);
  const [wcShowAll, setWcShowAll] = useState(false);
  const [leSport, setLeSport] = useState('all');
  const [liveMatches, setLiveMatches] = useState(() => generateLiveMatches());
  const [openOutrights, setOpenOutrights] = useState({
    'ot-international': true, 'ot-wc-sub': true, 'ot-wc-2026': false,
    'ot-wc-winner': true, 'ot-wc-boot': true, 'ot-brazil': false, 'ot-intclubs': false,
  });

  const tmTrackRef = useRef(null);
  const tmWrapRef = useRef(null);

  // Auto-refresh live scores every 30s (original startLsAutoRefresh interval).
  useEffect(() => {
    const t = setInterval(() => setLiveMatches(generateLiveMatches()), 30000);
    return () => clearInterval(t);
  }, []);

  const toggleOutright = useCallback((id) => {
    setOpenOutrights((s) => ({ ...s, [id]: !s[id] }));
  }, []);

  // Top-matches carousel
  const _spTmCardW = 312;
  const tmScroll = (dir) => {
    const track = tmTrackRef.current;
    const wrap = tmWrapRef.current;
    if (!track || !wrap) return;
    const maxScroll = track.scrollWidth - wrap.offsetWidth;
    setTmOffset((o) => Math.max(0, Math.min(o + dir * _spTmCardW, maxScroll)));
  };

  // Search filter for top matches.
  const tmFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return SP_TOP_MATCHES_DATA.filter((m) =>
      m.home.name.toLowerCase().includes(q) ||
      m.away.name.toLowerCase().includes(q) ||
      m.league.toLowerCase().includes(q)
    );
  }, [search]);

  // WC outright columns
  const wcRows = wcShowAll ? SP_WC_OUTRIGHT : SP_WC_OUTRIGHT.slice(0, 6);
  const wcCols = [
    wcRows.slice(0, Math.ceil(wcRows.length / 3)),
    wcRows.slice(Math.ceil(wcRows.length / 3), Math.ceil((wcRows.length * 2) / 3)),
    wcRows.slice(Math.ceil((wcRows.length * 2) / 3)),
  ];

  // Live events groups (mirror renderLiveEvents)
  const leGroups = useMemo(() => {
    const groups = [];
    if (leSport === 'all' || leSport === 'wc') LE_EVENTS.wc.forEach((g) => groups.push({ ...g, sport: 'wc' }));
    if (leSport === 'all' || leSport === 'nba') LE_EVENTS.nba.forEach((g) => groups.push({ ...g, sport: 'nba' }));
    if (leSport === 'all' || leSport === 'tennis') LE_EVENTS.tennis.forEach((g) => groups.push({ ...g, sport: 'tennis' }));
    const liveM = liveMatches.filter((m) => m.status === 'LIVE' || m.status === 'HT');
    const filtered = leSport === 'all' ? liveM : liveM.filter((m) => m.league === leSport);
    if (filtered.length) {
      groups.push({
        league: '📡 Live Scores', sport: 'mixed',
        matches: filtered.map((m) => ({
          home: { name: m.home.name, flag: m.home.flag }, away: { name: m.away.name, flag: m.away.flag },
          status: m.status === 'HT' ? 'HT' : m.minute ? m.minute + "'" : m.quarter || 'LIVE',
          sets: null, score: { h: m.homeScore, a: m.awayScore },
          odds: { h: m.odds.home, d: m.odds.draw || null, a: m.odds.away }, extra: 3, suspended: false,
        })),
      });
    }
    return groups;
  }, [leSport, liveMatches]);

  const leCount = leGroups.reduce((s, g) => s + g.matches.length, 0);

  // Sport-strip counts (mirror original count update)
  const leSportsWithCounts = useMemo(() => {
    const wcCount = liveMatches.filter((m) => m.league === 'wc' && m.status === 'LIVE').length;
    const nbaCount = liveMatches.filter((m) => m.league === 'nba' && m.status === 'LIVE').length;
    const wcStatic = LE_EVENTS.wc.reduce((a, g) => a + g.matches.length, 0);
    const nbaStatic = LE_EVENTS.nba.reduce((a, g) => a + g.matches.length, 0);
    const list = LE_SPORTS.map((s) => {
      if (s.id === 'wc') return { ...s, count: wcCount + wcStatic };
      if (s.id === 'nba') return { ...s, count: nbaCount + nbaStatic };
      return { ...s };
    });
    const all = list.filter((s) => s.id !== 'all').reduce((a, s) => a + s.count, 0);
    return list.map((s) => (s.id === 'all' ? { ...s, count: all } : s));
  }, [liveMatches]);

  const soonMatches = liveMatches.filter((m) => m.status === 'NS');

  // ── shared inline styles ──
  const navTabBase = {
    padding: '9px 18px', borderRadius: '24px', border: 'none', fontSize: '13px',
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
    whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px',
  };
  const navTabStyle = (id) => navTab === id
    ? { ...navTabBase, background: 'rgba(255,255,255,.12)', color: '#fff', fontWeight: 700 }
    : { ...navTabBase, background: 'transparent', color: 'rgba(255,255,255,.5)', fontWeight: 600 };

  return (
    <div id="view-sports" style={{ padding: '0 0 40px' }}>

      {/* Unified promo hero banner (admin-uploaded, one size everywhere) */}
      <div style={{ padding: '16px 20px 0' }}>
        <BannerCarousel />
      </div>

      {/* Promo Banner Carousel */}
      <div style={{ padding: '16px 20px 0', position: 'relative' }}>
        <div id="sp-promo-track" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', overflow: 'hidden' }}>
          {SP_PROMOS.map((p, i) => (
            <div key={i} style={{ background: p.color, border: '1px solid rgba(255,255,255,.08)', borderRadius: '14px', padding: '18px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', minHeight: '120px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ background: 'rgba(255,255,255,.15)', borderRadius: '4px', padding: '2px 8px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,.8)', letterSpacing: '.05em' }}>{p.tag}</span>
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#fff', margin: '6px 0 4px', lineHeight: 1.2 }}>{p.title}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.5)', marginBottom: '12px', lineHeight: 1.4 }}>{p.sub}</div>
                <button onClick={reg} style={{ padding: '8px 16px', background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{p.btn}</button>
              </div>
              <div style={{ fontSize: '52px', flexShrink: 0, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,.4))' }}>{p.img}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '12px', padding: '12px 16px' }}>
          <span style={{ fontSize: '16px', color: 'rgba(255,255,255,.35)' }}>🔍</span>
          <input id="sp-search-input" type="text" placeholder="Search your event" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: '14px', fontFamily: 'inherit' }} />
        </div>
      </div>

      {/* Nav tabs: Sports Home | Live Betting | My Bets | Starting Soon */}
      <div style={{ padding: '0 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,.05)', borderRadius: '30px', padding: '4px', width: 'fit-content' }}>
          <button className={'sp-nav-tab' + (navTab === 'home' ? ' active' : '')} id="sp-nav-home" onClick={() => setNavTab('home')} style={navTabStyle('home')}>🏠 Sports Home</button>
          <button className={'sp-nav-tab' + (navTab === 'live' ? ' active' : '')} id="sp-nav-live" onClick={() => setNavTab('live')} style={navTabStyle('live')}>📡 Live Betting</button>
          <button className={'sp-nav-tab' + (navTab === 'bets' ? ' active' : '')} id="sp-nav-bets" onClick={() => setNavTab('bets')} style={navTabStyle('bets')}>🎫 My Bets</button>
          <button className={'sp-nav-tab' + (navTab === 'soon' ? ' active' : '')} id="sp-nav-soon" onClick={() => setNavTab('soon')} style={navTabStyle('soon')}>⏰ Starting Soon</button>
        </div>
      </div>

      {/* ── SPORTS HOME PANEL ── */}
      <div id="sp-panel-home" style={{ display: navTab === 'home' ? '' : 'none' }}>

        {/* TOP MATCHES */}
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>🏆</span>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }} data-i18n="sec_top_matches">Top Matches</span>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => tmScroll(-1)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', color: '#fff', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
              <button onClick={() => tmScroll(1)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', color: '#fff', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
            </div>
          </div>
          <div style={{ overflow: 'hidden' }} id="sp-tm-wrap" ref={tmWrapRef}>
            <div id="sp-tm-track" ref={tmTrackRef} style={{ display: 'flex', gap: '12px', transition: 'transform .3s ease', width: 'max-content', transform: `translateX(-${tmOffset}px)` }}>
              {tmFiltered
                ? (tmFiltered.length
                  ? tmFiltered.map((m, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.09)', borderRadius: '14px', padding: '14px', width: '300px', flexShrink: 0, cursor: 'pointer' }} onClick={reg}>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.4)', marginBottom: '8px' }}>{m.leagueName || m.league}</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>{m.home.flag} {m.home.name} vs {m.away.flag} {m.away.name}</div>
                    </div>
                  ))
                  : <div style={{ padding: '20px', color: 'rgba(255,255,255,.35)', fontSize: '13px' }}>No results found</div>)
                : SP_TOP_MATCHES_DATA.map((m, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.09)', borderRadius: '14px', padding: '14px', width: '300px', flexShrink: 0, cursor: 'pointer', transition: 'border-color .15s' }} onClick={reg}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ background: 'rgba(232,41,58,.2)', color: '#e8293a', fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px' }}>{m.minute ? m.minute + "'" : '' + m.quarter}</span>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,.35)' }}>{m.league}</span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,.25)' }}>👥 {(6000 + ((i * 1777) % 14000)).toLocaleString()}</span>
                    </div>
                    {/* Teams */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <div>
                        <div style={{ fontSize: '22px', marginBottom: '3px' }}>{m.home.flag}</div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{m.home.name}</div>
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.3)', textAlign: 'center' }}>VS</div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '22px', marginBottom: '3px' }}>{m.away.flag}</div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{m.away.name}</div>
                      </div>
                    </div>
                    {/* Hot tip */}
                    <div style={{ fontSize: '11px', color: 'rgba(255,140,0,.8)', marginBottom: '10px' }}>🔥 {m.hotPct}% bets on {m.hotTeam}</div>
                    {/* Odds */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={(e) => { e.stopPropagation(); reg(); }} style={{ flex: 1, padding: '8px 0', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'background .12s' }}>{m.home.name}<br /><span style={{ color: '#f0c040' }}>{m.odds.h}</span></button>
                      {m.odds.d && <button onClick={(e) => { e.stopPropagation(); reg(); }} style={{ flex: 1, padding: '8px 0', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Draw<br /><span style={{ color: '#f0c040' }}>{m.odds.d}</span></button>}
                      <button onClick={(e) => { e.stopPropagation(); reg(); }} style={{ flex: 1, padding: '8px 0', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{m.away.name}<br /><span style={{ color: '#f0c040' }}>{m.odds.a}</span></button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* WORLD CUP 2026 */}
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>🏆</span>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>World Cup 2026</span>
            </div>
            <button onClick={() => setNavTab('live')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.45)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>View All</button>
          </div>
          <div id="sp-wc-market" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>World Cup Winner – 2026</span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,.3)' }}>👥 6,420</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
              {wcCols.map((col, ci) => (
                <div key={ci}>
                  {col.map((t, ti) => (
                    <div key={ti} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,.05)', cursor: 'pointer', transition: 'background .1s' }} onClick={reg}>
                      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,.8)' }}>{t.flag} {t.team}</span>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8' }}>{t.odds}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => setWcShowAll((v) => !v)} style={{ width: '100%', marginTop: '10px', padding: '10px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '8px', color: 'rgba(255,255,255,.5)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }} data-i18n="ui_load_more">Load More</button>
        </div>

        {/* TOP SPORTS */}
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>🎯</span>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }} data-i18n="sec_top_sports">Top Sports</span>
            </div>
            <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.45)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>View All</button>
          </div>
          <div id="sp-top-sports-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))', gap: '10px' }}>
            {SP_TOP_SPORTS.map((s, i) => (
              <div key={i} onClick={reg} style={{ background: s.grad, borderRadius: '12px', aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: '12px 8px', cursor: 'pointer', transition: 'transform .15s', position: 'relative', overflow: 'hidden' }}>
                <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-60%)', fontSize: '32px' }}>{s.icon}</span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '.06em', textShadow: '0 1px 4px rgba(0,0,0,.6)' }}>{s.name}</span>
              </div>
            ))}
          </div>
          <button style={{ width: '100%', marginTop: '10px', padding: '10px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '8px', color: 'rgba(255,255,255,.5)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Load More</button>
        </div>

      </div>{/* /sp-panel-home */}

      {/* ── LIVE BETTING PANEL ── */}
      <div id="sp-panel-live" style={{ display: navTab === 'live' ? '' : 'none', padding: 0 }}>

        {/* Top bar: Display + Market selectors */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 10px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#e8293a', animation: 'pulse 1.2s infinite', display: 'inline-block' }}></span>
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>Live Events</span>
            <span id="le-count-badge" style={{ background: 'rgba(232,41,58,.2)', color: '#e8293a', fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '10px' }}>{leCount}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', color: 'rgba(255,255,255,.7)' }}>
              🖥 Display <span style={{ color: '#fff', fontWeight: 700 }} data-i18n="sport_standard">Standard</span> <span style={{ color: 'rgba(255,255,255,.3)' }}>▾</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', color: 'rgba(255,255,255,.7)' }}>
              ▼ Market <span style={{ color: '#fff', fontWeight: 700 }} data-i18n="sport_winner">Winner</span> <span style={{ color: 'rgba(255,255,255,.3)' }}>▾</span>
            </div>
            <button onClick={() => setLiveMatches(generateLiveMatches())} style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '8px', color: 'rgba(255,255,255,.6)', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⟳</button>
          </div>
        </div>

        {/* Sport icon strip */}
        <div style={{ overflowX: 'auto', scrollbarWidth: 'none', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <div id="le-sport-strip" style={{ display: 'flex', gap: 0, padding: '10px 16px', width: 'max-content' }}>
            {leSportsWithCounts.map((s) => (
              <button key={s.id} onClick={() => setLeSport(s.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '6px 14px', border: 'none', background: 'none', cursor: 'pointer', borderBottom: s.id === leSport ? '2px solid #f0c040' : '2px solid transparent', transition: 'all .15s', flexShrink: 0 }}>
                <div style={{ position: 'relative', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                  {s.icon}
                  {s.count > 0 && <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#e8293a', color: '#fff', fontSize: '9px', fontWeight: 800, borderRadius: '10px', padding: '1px 5px', minWidth: '14px', textAlign: 'center' }}>{s.count}</span>}
                </div>
                <span style={{ fontSize: '11px', color: s.id === leSport ? '#fff' : 'rgba(255,255,255,.45)', fontWeight: s.id === leSport ? 700 : 400, whiteSpace: 'nowrap' }}>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Events list */}
        <div id="le-events-list" style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {leGroups.map((group, gi) => (
            <div key={gi} style={{ marginTop: '12px' }}>
              {/* League header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0 8px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,.8)' }}>{group.league}</span>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,.3)' }}>∧</span>
              </div>
              {/* Matches */}
              {group.matches.map((m, mi) => (
                <div key={mi} style={{ borderBottom: '1px solid rgba(255,255,255,.05)', padding: '10px 0', cursor: 'pointer' }} onClick={reg}>
                  <div style={{ display: 'flex', alignItems: 'stretch', gap: '12px' }}>
                    {/* Status + score col */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', minWidth: '80px', gap: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ background: '#e8293a', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '3px', letterSpacing: '.03em' }}>Live</span>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,.4)' }}>{m.status}</span>
                      </div>
                      {m.score
                        ? <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.3)', marginTop: '2px' }}>Score</div>
                        : <div style={{ fontSize: '10px', color: 'rgba(255,255,255,.25)', fontFamily: 'monospace', lineHeight: 1.5, marginTop: '2px', whiteSpace: 'pre-line' }}>{m.sets || ''}</div>}
                    </div>
                    {/* Teams col */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px' }}>{m.home.flag}</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: m.suspended ? 'rgba(255,255,255,.35)' : '#fff' }}>{m.home.name}</span>
                        {m.score != null && <span style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: m.score.h > m.score.a ? '#fff' : 'rgba(255,255,255,.45)' }}>{m.score.h != null ? m.score.h : ''}</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px' }}>{m.away.flag}</span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: m.suspended ? 'rgba(255,255,255,.35)' : '#fff' }}>{m.away.name}</span>
                        {m.score != null && <span style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: m.score.a > m.score.h ? '#fff' : 'rgba(255,255,255,.45)' }}>{m.score.a != null ? m.score.a : ''}</span>}
                      </div>
                    </div>
                    {/* Odds col */}
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                      {m.suspended ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <div style={{ padding: '8px 16px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '8px', textAlign: 'center', minWidth: '70px' }}>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.3)' }}>{m.home.name.split(' ')[0]}</div>
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.25)', marginTop: '2px' }}>Suspended</div>
                          </div>
                          <div style={{ padding: '8px 16px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '8px', textAlign: 'center', minWidth: '70px' }}>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.3)' }}>{m.away.name.split(' ')[0]}</div>
                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.25)', marginTop: '2px' }}>Suspended</div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {m.odds.h && <button onClick={(e) => { e.stopPropagation(); reg(); }} style={{ padding: '8px 14px', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '8px', minWidth: '70px', textAlign: 'center', cursor: 'pointer', transition: 'background .12s' }}>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.5)', marginBottom: '2px' }}>{m.home.name.split(' ').pop()}</div>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#f0c040' }}>{m.odds.h}</div>
                          </button>}
                          {m.odds.d && <button onClick={(e) => { e.stopPropagation(); reg(); }} style={{ padding: '8px 14px', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '8px', minWidth: '60px', textAlign: 'center', cursor: 'pointer', transition: 'background .12s' }}>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.5)', marginBottom: '2px' }}>Draw</div>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#f0c040' }}>{m.odds.d}</div>
                          </button>}
                          {m.odds.a && <button onClick={(e) => { e.stopPropagation(); reg(); }} style={{ padding: '8px 14px', background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '8px', minWidth: '70px', textAlign: 'center', cursor: 'pointer', transition: 'background .12s' }}>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.5)', marginBottom: '2px' }}>{m.away.name.split(' ').pop()}</div>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#f0c040' }}>{m.odds.a}</div>
                          </button>}
                          {m.extra && <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.09)', borderRadius: '8px', display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,.5)', cursor: 'pointer', whiteSpace: 'nowrap' }}>+{m.extra}</div>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div id="le-events-empty" style={{ display: leGroups.length ? 'none' : 'block', padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,.35)' }} data-i18n="misc_no_live">No live events right now.</div>
      </div>

      {/* ── MY BETS PANEL ── */}
      <div id="sp-panel-bets" style={{ display: navTab === 'bets' ? '' : 'none', padding: '0 20px' }}>
        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '14px', padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎫</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '6px' }} data-i18n="misc_no_bets">No Bets Yet</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.4)', marginBottom: '20px' }} data-i18n="misc_bets_appear">Your placed bets will appear here</div>
          <button onClick={() => setNavTab('home')} style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#f0c040,#b8860b)', color: '#06091a', fontWeight: 800, fontSize: '13px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit' }} data-i18n="misc_browse">Browse Matches</button>
        </div>
      </div>

      {/* ── STARTING SOON PANEL ── */}
      <div id="sp-panel-soon" style={{ display: navTab === 'soon' ? '' : 'none', padding: '0 20px' }}>
        <div id="sp-soon-grid" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {soonMatches.length === 0
            ? <div style={{ textAlign: 'center', padding: '32px', color: 'rgba(255,255,255,.35)' }}>No matches starting soon.</div>
            : soonMatches.map((m) => (
              <div key={m.id} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={reg}>
                <div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.4)', marginBottom: '4px' }}>{m.leagueFlag} {m.leagueName} · {m.stage}</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{m.home.flag} {m.home.name} vs {m.away.flag} {m.away.name}</div>
                </div>
                <span style={{ background: 'rgba(56,189,248,.15)', color: '#38bdf8', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>Starting Soon</span>
              </div>
            ))}
        </div>
      </div>

      {/* ── OUTRIGHTS PANEL ── */}
      <div id="sp-panel-outrights" style={{ display: navTab === 'outrights' ? '' : 'none', padding: '0 20px 24px' }}>

        {/* Top Soccer Outrights */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '16px 0 12px' }}>
          <span style={{ fontSize: '15px' }}>⚙️</span>
          <span style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }} data-i18n="sport_soccer_outrights">Top Soccer Outrights</span>
        </div>

        {/* International > World Cup (expanded) */}
        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '12px', overflow: 'hidden', marginBottom: '8px' }}>
          <button onClick={() => toggleOutright('ot-international')} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>🌐</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }} data-i18n="sport_international">International</span>
            </div>
            <span id="ot-international-chev" style={{ color: 'rgba(255,255,255,.4)', fontSize: '14px', transition: 'transform .2s' }}>{openOutrights['ot-international'] ? '∧' : '∨'}</span>
          </button>
          <div id="ot-international-body" style={{ display: openOutrights['ot-international'] ? '' : 'none', borderTop: '1px solid rgba(255,255,255,.06)' }}>
            {/* World Cup sub-group (expanded) */}
            <div style={{ background: 'rgba(255,255,255,.03)' }}>
              <button onClick={() => toggleOutright('ot-wc-sub')} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,.8)' }}>World Cup</span>
                <span id="ot-wc-sub-chev" style={{ color: 'rgba(255,255,255,.4)', fontSize: '13px', transition: 'transform .2s' }}>{openOutrights['ot-wc-sub'] ? '∧' : '∨'}</span>
              </button>
              <div id="ot-wc-sub-body" style={{ display: openOutrights['ot-wc-sub'] ? '' : 'none' }}>
                {/* World Cup 2026 — clickable row */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,.05)' }}>
                  <button onClick={() => toggleOutright('ot-wc-2026')} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'background .12s' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>World Cup 2026</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.35)', marginTop: '3px' }}>Soccer › International › World Cup › <span style={{ color: 'rgba(56,189,248,.8)' }}>Outrights</span></div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ background: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.6)', fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '6px' }}>+478</span>
                      <span id="ot-wc-2026-chev" style={{ color: 'rgba(255,255,255,.4)', fontSize: '13px' }}>{openOutrights['ot-wc-2026'] ? '∧' : '∨'}</span>
                    </div>
                  </button>
                  {/* Full outright markets — expanded on click */}
                  <div id="ot-wc-2026-body" style={{ display: openOutrights['ot-wc-2026'] ? '' : 'none', borderTop: '1px solid rgba(255,255,255,.05)' }}>

                    {/* World Cup Winner 2026 */}
                    <div id="ot-wc-winner-section">
                      <button onClick={() => toggleOutright('ot-wc-winner')} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: 'rgba(255,255,255,.02)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,.85)' }}>World Cup Winner – 2026</span>
                        <span id="ot-wc-winner-chev" style={{ color: 'rgba(255,255,255,.4)', fontSize: '13px' }}>{openOutrights['ot-wc-winner'] ? '∧' : '∨'}</span>
                      </button>
                      <div id="ot-wc-winner-body" style={{ display: openOutrights['ot-wc-winner'] ? '' : 'none' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }} id="ot-wc-winner-grid">
                          {SP_WC_OUTRIGHT.slice(0, 9).map((t, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,.05)', cursor: 'pointer' }} onClick={reg}>
                              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,.8)' }}>{t.flag} {t.team}</span>
                              <span style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8' }}>{t.odds}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Golden Boot */}
                    <div id="ot-wc-boot-section" style={{ borderTop: '1px solid rgba(255,255,255,.06)' }}>
                      <button onClick={() => toggleOutright('ot-wc-boot')} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: 'rgba(255,255,255,.02)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,.85)' }}>World Cup 2026 – Awards – Top Goalscorer (Golden Boot)</span>
                        <span id="ot-wc-boot-chev" style={{ color: 'rgba(255,255,255,.4)', fontSize: '13px' }}>{openOutrights['ot-wc-boot'] ? '∧' : '∨'}</span>
                      </button>
                      <div id="ot-wc-boot-body" style={{ display: openOutrights['ot-wc-boot'] ? '' : 'none' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }} id="ot-wc-boot-grid">
                          {SP_WC_OUTRIGHT.slice(0, 9).map((t, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,.05)', cursor: 'pointer' }} onClick={reg}>
                              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,.8)' }}>{t.flag} {t.team}</span>
                              <span style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8' }}>{t.odds}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Brazil */}
        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '12px', overflow: 'hidden', marginBottom: '8px' }}>
          <button onClick={() => toggleOutright('ot-brazil')} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ fontSize: '16px', verticalAlign: 'middle', lineHeight: 1 }}>🇧🇷</span><span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>Brazil</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.5)', fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '10px' }}>1</span>
              <span id="ot-brazil-chev" style={{ color: 'rgba(255,255,255,.4)', fontSize: '14px', transition: 'transform .2s' }}>{openOutrights['ot-brazil'] ? '∧' : '∨'}</span>
            </div>
          </button>
          <div id="ot-brazil-body" style={{ display: openOutrights['ot-brazil'] ? '' : 'none', borderTop: '1px solid rgba(255,255,255,.06)' }}>
            <div onClick={reg} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', cursor: 'pointer', transition: 'background .12s' }}>
              <div><div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Copa do Brasil 2026</div><div style={{ fontSize: '11px', color: 'rgba(255,255,255,.35)', marginTop: '2px' }}>Soccer › Brazil › <span style={{ color: 'rgba(56,189,248,.8)' }}>Outrights</span></div></div>
              <span style={{ background: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.6)', fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '6px' }}>+42</span>
            </div>
          </div>
        </div>

        {/* International Clubs */}
        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
          <button onClick={() => toggleOutright('ot-intclubs')} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ fontSize: '18px' }}>🌐</span><span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>International Clubs</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.5)', fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '10px' }}>3</span>
              <span id="ot-intclubs-chev" style={{ color: 'rgba(255,255,255,.4)', fontSize: '14px', transition: 'transform .2s' }}>{openOutrights['ot-intclubs'] ? '∧' : '∨'}</span>
            </div>
          </button>
          <div id="ot-intclubs-body" style={{ display: openOutrights['ot-intclubs'] ? '' : 'none', borderTop: '1px solid rgba(255,255,255,.06)' }}>
            {OT_INTCLUBS.map((t, i) => (
              <div key={i} onClick={reg} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,.04)', transition: 'background .12s' }}>
                <div><div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{t}</div><div style={{ fontSize: '11px', color: 'rgba(255,255,255,.35)', marginTop: '2px' }}>Soccer › International Clubs › <span style={{ color: 'rgba(56,189,248,.8)' }}>Outrights</span></div></div>
                <span style={{ background: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.6)', fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '6px' }}>+{40 + i * 8}</span>
              </div>
            ))}
          </div>
        </div>

        {/* All Soccer Outrights */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '15px' }}>↕️</span>
          <span style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }} data-i18n="sport_all_outrights">All Soccer Outrights</span>
        </div>
        <div id="ot-all-list" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}></div>
      </div>

    </div>
  );
}
