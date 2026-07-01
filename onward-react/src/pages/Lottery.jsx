import { useState, useMemo, useRef, useEffect } from 'react';
import { useUI } from '../context/UIContext';
import useSectionNav from '../hooks/useSectionNav';
import api from '../services/api';
import { LOTTERY_LOGOS } from '../data/lotteryLogos';

// ===== Latest results data (from initLotteryPage) =====
const LOTTERY_RESULTS = [
  {
    id: 'magnum', label: 'MAGNUM 4D', color: '#f7c843', bg: '#c8960a', textColor: '#000',
    date: 'Wed 03-06-2026', drawNo: 'No.376/26',
    prizes: [{ label: '1st Prize', num: '2469' }, { label: '2nd Prize', num: '6830' }, { label: '3rd Prize', num: '6747' }],
    special: ['3779', '5646', '2625', '3321', '0489', '----', '----', '3849', '7616', '0523', '0335', '----', '3495'],
    consolation: ['5040', '1304', '0194', '4638', '9937', '3724', '2433', '7723', '9162', '9827'],
    jp1: 'RM 21,630,000.00', jp2: 'RM 247,000.00',
  },
  {
    id: 'damacai', label: 'DAMACAI 4D', color: '#4a7aff', bg: '#0d2060', textColor: '#fff',
    date: 'Wed 03-06-2026', drawNo: 'No.6086/26',
    prizes: [{ label: '1st Prize', num: '2308' }, { label: '2nd Prize', num: '2660' }, { label: '3rd Prize', num: '0185' }],
    special: ['7121', '5641', '1568', '2943', '7037', '2462', '5751', '2304', '2979', '6129'],
    consolation: ['8267', '3458', '4283', '5374', '0042', '3725', '7483', '9594', '2139', '8298'],
    jp1: 'RM 10,013,593.70', jp2: 'RM 254,516.80',
  },
  {
    id: 'toto', label: 'TOTO 4D', color: '#ff4a4a', bg: '#8a0000', textColor: '#fff',
    date: 'Wed 03-06-2026', drawNo: 'No.6139/26',
    prizes: [{ label: '1st Prize', num: '6697' }, { label: '2nd Prize', num: '2969' }, { label: '3rd Prize', num: '1040' }],
    special: ['9698', '4693', '5478', '9612', '3744', '----', '----', '1601', '7323', '9962', '1780', '----', '9816'],
    consolation: ['5072', '3672', '5420', '3828', '7663', '9903', '1225', '8267', '6677', '1909'],
    jp1: 'RM —', jp2: 'RM —',
  },
];

// ===== Buy panel constants (from JS) =====
const MAX_LROWS = 5;
const OP_COLORS = { magnum: '#f7c843', damacai: '#4a7aff', toto: '#ff4a4a' };
const OP_LABELS = { magnum: 'MAGNUM', damacai: 'DAMACAI', toto: 'TOTO' };

const LOTTERY_PAYOUTS = {
  big: { p1: 2500, p2: 1000, p3: 500, sp: 180, con: 60 },
  small: { p1: 3500, p2: 2000, p3: 1000, sp: 0, con: 0 },
  iboxbig: { p1: 105, p2: 42, p3: 21, sp: 8, con: 3 },
  iboxsmall: { p1: 147, p2: 84, p3: 42, sp: 0, con: 0 },
};

const STAKE_TYPES = ['big', 'small', 'iboxbig', 'iboxsmall'];
const TYPE_COLORS = { big: '#22c55e', small: '#3b82f6', iboxbig: '#a855f7', iboxsmall: '#c084fc' };
const STAKE_LABELS = { big: 'BIG', small: 'SMALL', iboxbig: 'i-BOX B', iboxsmall: 'i-BOX S' };
const PAYOUT_LABELS = { big: 'BIG', small: 'SMALL', iboxbig: 'i-BOX BIG', iboxsmall: 'i-BOX SMALL' };
const SLIP_TYPE_NAMES = { big: 'BIG', small: 'SMALL', iboxbig: 'i-BOX BIG', iboxsmall: 'i-BOX SMALL' };

const DIGIT_STYLE = {
  width: '38px', height: '44px', borderRadius: '8px', border: '2px solid var(--border)',
  background: '#0d0d1a', color: '#fff', fontSize: '21px', fontWeight: 800, textAlign: 'center',
  fontFamily: "'Courier New',monospace", outline: 'none', caretColor: 'var(--gold)',
  transition: 'border-color .2s',
};

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  const n = parseInt(hex, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const makeRow = () => ({ digits: ['', '', '', ''], stakes: { big: 1, small: 0, iboxbig: 0, iboxsmall: 0 } });

// ===== Result card =====
function LotteryCard({ r }) {
  const numCell = (n, i) => (
    <div className="lottery-num" key={i} style={n === '----' ? { opacity: 0.2 } : undefined}>{n}</div>
  );
  const gridRow = (row, i) => (
    <div className="lottery-numbers-grid" key={i}>{row.map(numCell)}</div>
  );
  const logo = LOTTERY_LOGOS[r.id];
  return (
    <div className="lottery-card">
      <div
        className="lottery-card-header"
        style={{ background: `linear-gradient(90deg,${r.bg},${r.color}20)`, color: r.textColor === '#000' ? '#1a1a1a' : '#fff' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {logo && (
            <img
              src={logo}
              alt={r.label}
              style={{ height: '38px', width: 'auto', objectFit: 'contain', borderRadius: '6px', background: r.textColor === '#000' ? 'transparent' : 'rgba(255,255,255,0.08)', padding: '4px' }}
            />
          )}
          <div>
            <div style={{ color: r.color, fontSize: '16px', fontWeight: 900, letterSpacing: '.5px' }}>{r.label}</div>
            <div className="draw-info" style={{ color: r.textColor === '#000' ? '#555' : '#bbb' }}>{r.date} &nbsp; {r.drawNo}</div>
          </div>
        </div>
      </div>
      {r.prizes.map((p, i) => (
        <div className="lottery-prize-row" key={i}>
          <div className="lottery-prize-label">{p.label}</div>
          <div className="lottery-prize-num" style={{ color: r.color }}>{p.num}</div>
        </div>
      ))}
      <div className="lottery-section-label">Special</div>
      {chunk(r.special, 5).map(gridRow)}
      <div className="lottery-section-label">Consolation</div>
      {chunk(r.consolation, 5).map(gridRow)}
      <div className="lottery-jackpot-row">
        <div className="lottery-jp-box"><div className="lottery-jp-label">4D Jackpot 1</div><div className="lottery-jp-val">{r.jp1}</div></div>
        <div className="lottery-jp-box"><div className="lottery-jp-label">4D Jackpot 2</div><div className="lottery-jp-val">{r.jp2}</div></div>
      </div>
    </div>
  );
}

export default function Lottery() {
  const { toast } = useUI();
  // eslint-disable-next-line no-unused-vars
  const go = useSectionNav();

  // Live 4D results captured server-side (falls back to the bundled sample when
  // the feed is unavailable). Merged onto the styled cards by pool id.
  const [results, setResults] = useState(LOTTERY_RESULTS);
  const [liveAt, setLiveAt] = useState(null);
  useEffect(() => {
    let alive = true;
    api.get('/lottery/results').then((r) => {
      const pools = r.data?.pools;
      if (!alive || !Array.isArray(pools) || !pools.length) return;
      const byKey = {}; pools.forEach((p) => { byKey[p.key] = p; });
      setResults(LOTTERY_RESULTS.map((card) => {
        const live = byKey[card.id];
        if (!live || !live.first) return card;
        return {
          ...card,
          date: live.date || card.date,
          drawNo: live.drawNo || card.drawNo,
          prizes: [
            { label: '1st Prize', num: live.first || '----' },
            { label: '2nd Prize', num: live.second || '----' },
            { label: '3rd Prize', num: live.third || '----' },
          ],
          special: (live.special && live.special.length) ? live.special : card.special,
          consolation: (live.consolation && live.consolation.length) ? live.consolation : card.consolation,
        };
      }));
      if (r.data?.fetchedAt) setLiveAt(r.data.fetchedAt);
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const [tab, setTab] = useState('results');
  const [op, setOp] = useState('magnum');
  const [rows, setRows] = useState([makeRow()]);
  const [slip, setSlip] = useState([]);

  // refs for digit auto-advance / backspace navigation
  const digitRefs = useRef({});
  const setDigitRef = (rowIdx, pos) => (el) => { digitRefs.current[`${rowIdx}-${pos}`] = el; };
  const focusDigit = (rowIdx, pos) => {
    const el = digitRefs.current[`${rowIdx}-${pos}`];
    if (el) el.focus();
  };

  // ----- row helpers -----
  function updateDigit(rowIdx, pos, raw) {
    const v = raw.replace(/[^0-9]/g, '').slice(-1);
    setRows((rs) => rs.map((r, i) => (i === rowIdx ? { ...r, digits: r.digits.map((d, p) => (p === pos ? v : d)) } : r)));
    if (v.length === 1) focusDigit(rowIdx, pos + 1);
  }

  function digitKeyDown(e, rowIdx, pos) {
    if (e.key === 'Backspace' && !rows[rowIdx].digits[pos] && pos > 0) {
      setRows((rs) => rs.map((r, i) => (i === rowIdx ? { ...r, digits: r.digits.map((d, p) => (p === pos - 1 ? '' : d)) } : r)));
      focusDigit(rowIdx, pos - 1);
    }
  }

  function updateStake(rowIdx, type, raw) {
    setRows((rs) => rs.map((r, i) => (i === rowIdx ? { ...r, stakes: { ...r.stakes, [type]: raw } } : r)));
  }

  function addRow() {
    if (rows.length >= MAX_LROWS) { toast('Maximum 5 numbers allowed', 'error'); return; }
    const newIdx = rows.length;
    setRows((rs) => [...rs, makeRow()]);
    setTimeout(() => focusDigit(newIdx, 0), 0);
  }

  function removeRow(rowIdx) {
    if (rows.length <= 1) return;
    setRows((rs) => rs.filter((_, i) => i !== rowIdx));
  }

  function randomAll() {
    setRows((rs) => rs.map((r) => ({ ...r, digits: r.digits.map(() => String(Math.floor(Math.random() * 10))) })));
  }

  function clearAll() {
    setRows((rs) => rs.map((r) => ({ ...r, digits: ['', '', '', ''] })));
    focusDigit(0, 0);
  }

  // ----- derived numbers / totals -----
  const rowNumbers = useMemo(
    () => rows.map((r) => r.digits.map((d) => d || '_').join('')),
    [rows]
  );

  const stakeNum = (v) => parseFloat(v) || 0;

  const { typeTotals, grandTotal } = useMemo(() => {
    const totals = { big: 0, small: 0, iboxbig: 0, iboxsmall: 0 };
    let grand = 0;
    rows.forEach((r) => {
      STAKE_TYPES.forEach((t) => {
        const s = stakeNum(r.stakes[t]);
        totals[t] += s;
        grand += s;
      });
    });
    return { typeTotals: totals, grandTotal: grand };
  }, [rows]);

  // ----- bet slip -----
  function submitBet() {
    const invalid = rowNumbers.filter((n) => n.includes('_'));
    if (invalid.length) { toast('Please fill all digits in every row', 'error'); return; }
    if (grandTotal <= 0) { toast('Please enter a stake in at least one bet type', 'error'); return; }
    const opLabel = OP_LABELS[op];
    const additions = [];
    rowNumbers.forEach((num, r) => {
      let rowTotal = 0;
      const parts = [];
      STAKE_TYPES.forEach((t) => {
        const s = stakeNum(rows[r].stakes[t]);
        if (s > 0) { parts.push(`${SLIP_TYPE_NAMES[t]} RM${s}`); rowTotal += s; }
      });
      if (rowTotal === 0) return;
      additions.push({ num, op: opLabel, type: parts.join(' + '), stake: rowTotal });
    });
    setSlip((s) => [...s, ...additions]);
    setRows([makeRow()]);
    toast(rowNumbers.length > 1 ? `${rowNumbers.length} tickets added! ✅` : 'Ticket added! ✅', 'success');
  }

  const removeSlip = (i) => setSlip((s) => s.filter((_, idx) => idx !== i));
  const clearSlip = () => setSlip([]);
  const slipTotal = useMemo(() => slip.reduce((s, e) => s + e.stake, 0), [slip]);

  // ----- tab button styles -----
  const tabBtnStyle = (active) => ({
    flex: 1, padding: '10px', borderRadius: '10px',
    border: `1.5px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
    background: active ? 'var(--gold)' : 'var(--surface)',
    color: active ? '#000' : '#aaa', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
  });

  // ----- operator button styles -----
  const opBtnStyle = (id) => {
    const active = op === id;
    const c = OP_COLORS[id] || '#f7c843';
    return {
      flex: 1, minWidth: '90px', padding: '8px 8px', borderRadius: '10px',
      border: `1.5px solid ${active ? c : 'var(--border)'}`,
      background: active ? `rgba(${hexToRgb(c)},.15)` : 'var(--surface)',
      color: active ? c : '#aaa', fontWeight: 800, fontSize: '11px', cursor: 'pointer',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
    };
  };

  return (
    <div id="view-lottery">
      <div className="section">

        {/* Header */}
        <div className="section-header" style={{ marginBottom: '20px' }}>
          <h2 className="section-title" data-i18n="sec_lottery_title">🎱 4D Lottery</h2>
          <div className="hero-badge" style={{ fontSize: '11px' }} id="lottery-date-badge" data-i18n="misc_loading">📅 Wed 03-06-2026</div>
        </div>

        {/* Tab switcher: Results | Buy */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button id="ltab-results" onClick={() => setTab('results')} style={tabBtnStyle(tab === 'results')}>📋 Latest Results</button>
          <button id="ltab-buy" onClick={() => setTab('buy')} style={tabBtnStyle(tab === 'buy')}>🎟️ Buy Ticket</button>
        </div>

        {/* RESULTS PANEL */}
        <div id="lottery-panel-results" style={tab === 'results' ? undefined : { display: 'none' }}>
          <div id="lottery-results-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(310px,1fr))', gap: '16px' }}>
            {results.map((r) => <LotteryCard key={r.id} r={r} />)}
          </div>
          <div style={{ textAlign: 'center', marginTop: '20px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', color: '#555', fontSize: '11px' }}>
            ⚠️ Results for reference only. Please verify with official sources.
          </div>
        </div>

        {/* BUY PANEL */}
        <div id="lottery-panel-buy" style={tab === 'buy' ? undefined : { display: 'none' }}>

          {/* Operator selector */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px', fontWeight: 600, letterSpacing: '.5px' }} data-i18n="lottery_select">SELECT OPERATOR</div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {['magnum', 'damacai', 'toto'].map((id) => (
                <button
                  key={id}
                  onClick={() => setOp(id)}
                  className={op === id ? 'lop-btn lop-active' : 'lop-btn'}
                  data-op={id}
                  style={opBtnStyle(id)}
                >
                  <img src={LOTTERY_LOGOS[id]} alt={OP_LABELS[id]} style={{ height: '28px', width: 'auto', objectFit: 'contain' }} />
                  <span>{OP_LABELS[id]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Two-column layout: left=form, right=rules */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

            {/* LEFT: Bet form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Number rows — each has its own bet type + stake */}
              <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '14px 16px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#888', fontWeight: 600, letterSpacing: '.5px' }} data-i18n="lottery_numbers">YOUR 4D NUMBERS</div>
                  <div style={{ fontSize: '11px', color: '#555' }} id="lrow-counter">{rows.length} / {MAX_LROWS}</div>
                </div>

                {/* Dynamic merged rows */}
                <div id="lottery-number-rows" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                  {/* Column header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 10px', marginBottom: '4px' }}>
                    <span style={{ width: '12px', flexShrink: 0 }} />
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <span style={{ width: '38px', textAlign: 'center', fontSize: '9px', color: '#444', fontWeight: 600, letterSpacing: '.3px' }}>NUM</span>
                      <span style={{ width: '38px' }} /><span style={{ width: '38px' }} /><span style={{ width: '38px' }} />
                    </div>
                    <div style={{ width: '1px', flexShrink: 0 }} />
                    <div style={{ display: 'flex', gap: '6px', flex: 1, justifyContent: 'space-around', padding: '0 4px' }}>
                      <span style={{ minWidth: '62px', textAlign: 'center', fontSize: '9px', color: '#22c55e', fontWeight: 700, letterSpacing: '.3px' }}>BIG</span>
                      <span style={{ minWidth: '62px', textAlign: 'center', fontSize: '9px', color: '#3b82f6', fontWeight: 700, letterSpacing: '.3px' }}>SMALL</span>
                      <span style={{ minWidth: '62px', textAlign: 'center', fontSize: '9px', color: '#a855f7', fontWeight: 700, letterSpacing: '.3px' }}>i-BOX B</span>
                      <span style={{ minWidth: '62px', textAlign: 'center', fontSize: '9px', color: '#c084fc', fontWeight: 700, letterSpacing: '.3px' }}>i-BOX S</span>
                    </div>
                    <span style={{ width: '17px', flexShrink: 0 }} />
                  </div>

                  {/* Bet rows */}
                  {rows.map((row, rowIdx) => (
                    <div key={rowIdx} id={`lnrow-${rowIdx}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: '#111827', borderRadius: '10px', border: '1px solid #1e2030' }}>
                      {/* row number */}
                      <span style={{ fontSize: '10px', color: '#383848', fontWeight: 700, width: '12px', flexShrink: 0, textAlign: 'center' }}>{rowIdx + 1}</span>
                      {/* 4 digit inputs */}
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        {[0, 1, 2, 3].map((pos) => (
                          <input
                            key={pos}
                            type="text"
                            maxLength={1}
                            className="ldigit"
                            data-row={rowIdx}
                            data-pos={pos}
                            value={row.digits[pos]}
                            ref={setDigitRef(rowIdx, pos)}
                            onChange={(e) => updateDigit(rowIdx, pos, e.target.value)}
                            onKeyDown={(e) => digitKeyDown(e, rowIdx, pos)}
                            onFocus={(e) => { e.target.style.borderColor = 'var(--gold)'; }}
                            onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
                            style={DIGIT_STYLE}
                          />
                        ))}
                      </div>
                      {/* divider */}
                      <div style={{ width: '1px', height: '36px', background: '#1e2030', flexShrink: 0 }} />
                      {/* stake columns */}
                      <div style={{ display: 'flex', gap: '6px', flex: 1, justifyContent: 'space-around' }}>
                        {STAKE_TYPES.map((type) => (
                          <div key={type} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', minWidth: '62px' }}>
                            <span style={{ fontSize: '9px', fontWeight: 800, color: TYPE_COLORS[type], letterSpacing: '.3px' }}>{STAKE_LABELS[type]}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: '#0a0a18', borderRadius: '6px', padding: '3px 6px', border: '1px solid #252535' }}>
                              <span style={{ color: '#555', fontSize: '10px' }}>RM</span>
                              <input
                                type="number"
                                min="0"
                                value={row.stakes[type]}
                                data-row={rowIdx}
                                data-type={type}
                                onChange={(e) => updateStake(rowIdx, type, e.target.value)}
                                style={{ width: '30px', background: 'none', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 700, outline: 'none', textAlign: 'center' }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* remove button */}
                      {rowIdx > 0 ? (
                        <button
                          onClick={() => removeRow(rowIdx)}
                          style={{ background: 'none', border: 'none', color: '#383848', cursor: 'pointer', fontSize: '13px', padding: '0 2px', flexShrink: 0, transition: 'color .15s' }}
                          onMouseOver={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                          onMouseOut={(e) => { e.currentTarget.style.color = '#383848'; }}
                        >✕</button>
                      ) : (
                        <span style={{ width: '17px', flexShrink: 0 }} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={addRow}
                    id="lbtn-add"
                    style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px dashed #444', background: '#1a1a2e', color: '#888', fontSize: '12px', cursor: rows.length >= MAX_LROWS ? 'not-allowed' : 'pointer', minWidth: '80px', opacity: rows.length >= MAX_LROWS ? 0.35 : 1 }}
                  >＋ Add Number</button>
                  <button onClick={randomAll} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #444', background: '#222', color: '#ccc', fontSize: '12px', cursor: 'pointer', minWidth: '80px' }}>🎲 Random All</button>
                  <button onClick={clearAll} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #444', background: '#222', color: '#ccc', fontSize: '12px', cursor: 'pointer', minWidth: '80px' }}>✕ Clear All</button>
                </div>
              </div>

              {/* Payout preview */}
              <div style={{ background: 'rgba(247,200,67,0.06)', borderRadius: '12px', padding: '14px 16px', border: '1px solid rgba(247,200,67,0.2)' }} id="lottery-payout-preview">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#f7c843', fontWeight: 700, letterSpacing: '.5px' }}>💰 POSSIBLE WINNINGS</div>
                  <div id="lottery-total-stake" style={{ fontSize: '12px', color: '#888' }}>Total: <span style={{ color: 'var(--gold)', fontWeight: 700 }}>RM {grandTotal.toFixed(2)}</span></div>
                </div>
                <div id="lottery-payout-rows" style={{ fontSize: '12px', color: '#ccc', lineHeight: 2 }}>
                  {grandTotal === 0 ? (
                    <div style={{ color: '#555', fontSize: '11px', textAlign: 'center', padding: '4px' }}>Enter stakes per number row to see winnings</div>
                  ) : (
                    STAKE_TYPES.map((type) => {
                      const s = typeTotals[type];
                      if (!s) return null;
                      const p = LOTTERY_PAYOUTS[type] || LOTTERY_PAYOUTS.big;
                      return (
                        <div key={type}>
                          <div style={{ fontSize: '10px', fontWeight: 700, color: TYPE_COLORS[type], letterSpacing: '.5px', marginTop: '6px', marginBottom: '2px' }}>{PAYOUT_LABELS[type]} (RM{s} total)</div>
                          {p.p1 ? <div><span style={{ color: '#aaa' }}>1st Prize</span><span style={{ float: 'right', color: '#f7c843', fontWeight: 700 }}>RM {(p.p1 * s).toLocaleString()}</span></div> : null}
                          {p.p2 ? <div><span style={{ color: '#aaa' }}>2nd Prize</span><span style={{ float: 'right', color: '#fff' }}>RM {(p.p2 * s).toLocaleString()}</span></div> : null}
                          {p.p3 ? <div><span style={{ color: '#aaa' }}>3rd Prize</span><span style={{ float: 'right', color: '#fff' }}>RM {(p.p3 * s).toLocaleString()}</span></div> : null}
                          {p.sp ? <div><span style={{ color: '#aaa' }}>Special</span><span style={{ float: 'right', color: '#ccc' }}>RM {(p.sp * s).toLocaleString()}</span></div> : null}
                          {p.con ? <div><span style={{ color: '#aaa' }}>Consolation</span><span style={{ float: 'right', color: '#ccc' }}>RM {(p.con * s).toLocaleString()}</span></div> : null}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Buy button */}
              <button
                onClick={submitBet}
                style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#f7c843,#e6a817)', color: '#000', fontWeight: 900, fontSize: '15px', cursor: 'pointer', letterSpacing: '.5px', boxShadow: '0 4px 16px rgba(247,200,67,.3)' }}
              >
                🎟️ BUY TICKET
              </button>

            </div>{/* end left col */}

            {/* RIGHT: Rules */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* Classic 4D rules */}
              <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#f7c843', marginBottom: '10px' }}>📖 Classic 4D Rules</div>
                <div style={{ fontSize: '12px', color: '#aaa', lineHeight: 1.7 }}>
                  Select any 4-digit number from <strong style={{ color: '#ddd' }}>0000–9999</strong>. Each draw produces 1st, 2nd and 3rd prizes, plus 10 Special and 10 Consolation prizes.
                </div>
              </div>

              {/* Big vs Small */}
              <div style={{ background: 'var(--surface)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                  <div style={{ padding: '12px', borderRight: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#22c55e', marginBottom: '8px' }} data-i18n="lottery_big">BIG (Per RM1)</div>
                    <div style={{ fontSize: '11px', color: '#aaa', lineHeight: 1.9 }}>
                      1st Prize<span style={{ float: 'right', color: '#fff' }}>RM 2,500</span><br />
                      2nd Prize<span style={{ float: 'right', color: '#fff' }}>RM 1,000</span><br />
                      3rd Prize<span style={{ float: 'right', color: '#fff' }}>RM 500</span><br />
                      Special<span style={{ float: 'right', color: '#fff' }}>RM 180</span><br />
                      Consolation<span style={{ float: 'right', color: '#fff' }}>RM 60</span>
                    </div>
                  </div>
                  <div style={{ padding: '12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#3b82f6', marginBottom: '8px' }} data-i18n="lottery_small">SMALL (Per RM1)</div>
                    <div style={{ fontSize: '11px', color: '#aaa', lineHeight: 1.9 }}>
                      1st Prize<span style={{ float: 'right', color: '#fff' }}>RM 3,500</span><br />
                      2nd Prize<span style={{ float: 'right', color: '#fff' }}>RM 2,000</span><br />
                      3rd Prize<span style={{ float: 'right', color: '#fff' }}>RM 1,000</span><br />
                      Special<span style={{ float: 'right', color: '#aaa' }}>—</span><br />
                      Consolation<span style={{ float: 'right', color: '#aaa' }}>—</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* i-Box */}
              <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#a855f7', marginBottom: '8px' }}>🔀 i-BOX / Permutation</div>
                <div style={{ fontSize: '11px', color: '#aaa', lineHeight: 1.7, marginBottom: '10px' }}>
                  Covers <strong style={{ color: '#ddd' }}>all possible rearrangements</strong> of your digits. Pay RM1 for the full set — prize is divided by number of permutations.
                </div>
                <div style={{ background: '#111', borderRadius: '8px', padding: '10px', fontSize: '11px', color: '#aaa', lineHeight: 2 }}>
                  <div style={{ fontWeight: 700, color: '#ccc', marginBottom: '4px' }} data-i18n="lottery_example">Example payouts (BIG, RM1):</div>
                  24 perms (all unique)<span style={{ float: 'right', color: '#f7c843' }}>≈ RM 105</span><br />
                  12 perms (one pair)<span style={{ float: 'right', color: '#f7c843' }}>≈ RM 209</span><br />
                  6 perms (two pairs / 3-same)<span style={{ float: 'right', color: '#f7c843' }}>≈ RM 417</span><br />
                  4 perms (3-same + 1 diff)<span style={{ float: 'right', color: '#f7c843' }}>≈ RM 625</span>
                </div>
              </div>

              {/* Bet slip */}
              <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '14px 16px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#ccc' }}>🧾 BET SLIP</div>
                  <button onClick={clearSlip} style={{ fontSize: '11px', color: '#666', background: 'none', border: 'none', cursor: 'pointer' }} data-i18n="ui_clear_all">Clear all</button>
                </div>
                <div id="lottery-slip-list" style={{ fontSize: '12px', color: '#888', minHeight: '40px' }}>
                  {slip.length === 0 ? (
                    <div style={{ color: '#555', fontSize: '11px', textAlign: 'center', padding: '8px' }}>No bets yet</div>
                  ) : (
                    slip.map((e, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                        <span style={{ color: '#ddd', fontFamily: 'Courier New,monospace', fontWeight: 700, fontSize: '14px' }}>{e.num}</span>
                        <span style={{ color: '#888', fontSize: '11px' }}>{e.op} · {e.type}</span>
                        <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '12px' }}>RM {e.stake.toFixed(2)}</span>
                        <button onClick={() => removeSlip(i)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '13px', padding: '0 2px' }}>✕</button>
                      </div>
                    ))
                  )}
                </div>
                <div id="lottery-slip-total" style={{ display: slip.length ? 'flex' : 'none', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700 }}>
                  <span style={{ color: '#aaa' }} data-i18n="misc_total">Total</span>
                  <span id="lottery-slip-total-val" style={{ color: 'var(--gold)' }}>RM {slipTotal.toFixed(2)}</span>
                </div>
              </div>

            </div>{/* end right col */}
          </div>{/* end grid */}
        </div>{/* end buy panel */}

      </div>
    </div>
  );
}
