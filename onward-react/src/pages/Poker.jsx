import { useUI } from '../context/UIContext';

const POKER_TABLES = [
  { sub: 'No Limit 9-max', blind: 'RM 1 / RM 2', players: 6, max: 9, status: 'live', color: '#f7c843', icon: '♠' },
  { sub: 'No Limit 6-max', blind: 'RM 5 / RM 10', players: 4, max: 6, status: 'live', color: '#22c55e', icon: '♥' },
  { sub: 'High Stakes 6-max', blind: 'RM 25 / RM 50', players: 3, max: 6, status: 'live', color: '#a855f7', icon: '♦' },
  { sub: 'VIP 6-max', blind: 'RM 100 / RM 200', players: 2, max: 6, status: 'live', color: '#ef4444', icon: '♣' },
  { sub: 'Micro Stakes 9-max', blind: 'RM 0.50 / RM 1', players: 7, max: 9, status: 'live', color: '#60a5fa', icon: '♠' },
  { sub: 'Tournament Multi-tbl', blind: 'Blinds rise every 15 min', players: 24, max: 100, status: 'tournament', color: '#fb923c', icon: '🏆' },
];

const RANKINGS = [
  { label: 'Royal Flush', i18n: 'poker_royal', style: { background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px' } },
  { label: 'Straight Flush', i18n: 'poker_str_flush', style: { background: '#1e1e3a', color: '#a855f7', fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', border: '1px solid #3a2a5a' } },
  { label: 'Four of a Kind', i18n: 'poker_four', style: { background: '#1e1e3a', color: '#f7c843', fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', border: '1px solid #3a2a1a' } },
  { label: 'Full House', i18n: 'poker_full_house', style: { background: '#1e1e3a', color: '#22c55e', fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', border: '1px solid #1a3a2a' } },
  { label: 'Flush', i18n: 'poker_flush', style: { background: '#1e1e3a', color: '#60a5fa', fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', border: '1px solid #1a2a3a' } },
  { label: 'Straight', i18n: 'poker_straight', style: { background: '#1e1e3a', color: '#fb923c', fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', border: '1px solid #3a2a1a' } },
  { label: 'Three of a Kind', i18n: 'poker_three', style: { background: '#1e1e3a', color: '#f87171', fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', border: '1px solid #3a1a1a' } },
  { label: 'Two Pair', i18n: 'poker_two_pair', style: { background: '#1e1e3a', color: '#94a3b8', fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', border: '1px solid #2a2a3a' } },
  { label: 'One Pair', i18n: 'poker_one_pair', style: { background: '#1e1e3a', color: '#64748b', fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', border: '1px solid #2a2a3a' } },
  { label: 'High Card', i18n: 'poker_high_card', style: { background: '#1e1e3a', color: '#475569', fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', border: '1px solid #2a2a3a' } },
];

const HOW_TO = [
  { num: '1️⃣', title: 'Hole Cards', i18n: 'poker_hole_cards', desc: 'Each player receives 2 private cards (hole cards) dealt face down.' },
  { num: '2️⃣', title: 'Community Cards', i18n: 'poker_community', desc: '5 community cards are dealt face-up in stages: Flop (3), Turn (1), River (1).' },
  { num: '3️⃣', title: 'Betting Rounds', i18n: 'poker_betting', desc: 'Bet, check, call, raise or fold after each stage. Strategy wins the pot.' },
  { num: '4️⃣', title: 'Showdown', i18n: 'poker_showdown', desc: 'Best 5-card hand using any combination of hole + community cards wins.' },
];

export default function Poker() {
  const { toast } = useUI();

  return (
    <div id="view-poker">
      <div className="section">
        <div className="section-header" style={{ marginBottom: '20px' }}>
          <h2 className="section-title" data-i18n="sec_poker_title">🃏 Texas Hold'em Poker</h2>
          <div className="hero-badge" style={{ fontSize: '11px' }}>♠ Live Tables</div>
        </div>

        {/* Featured game banner */}
        <div style={{ background: 'linear-gradient(135deg,#0f1a2e 0%,#1a0a2e 50%,#0a1a1a 100%)', borderRadius: '16px', padding: '28px 32px', marginBottom: '24px', border: '1px solid rgba(247,200,67,0.2)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '200px', background: 'linear-gradient(90deg,transparent,rgba(247,200,67,0.03))', pointerEvents: 'none' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '64px', flexShrink: 0 }}>🂡</div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#fff', marginBottom: '6px' }} data-i18n="poker_texas">Texas Hold'em</div>
              <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '14px', lineHeight: 1.6 }}>The world's most popular poker game. Compete against real players at the table — go all-in, bluff your way to the pot, or play it safe and grind out a win.</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(247,200,67,.15)', color: '#f7c843', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(247,200,67,.3)' }}>♠ No Limit</span>
                <span style={{ background: 'rgba(34,197,94,.12)', color: '#22c55e', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(34,197,94,.3)' }}>🟢 Live Now</span>
                <span style={{ background: 'rgba(59,130,246,.12)', color: '#60a5fa', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(59,130,246,.3)' }}>👤 Real Players</span>
              </div>
            </div>
            <button onClick={() => toast('Opening Texas Holdem table...', 'success')} style={{ padding: '14px 28px', background: 'linear-gradient(135deg,#f7c843,#e6a817)', color: '#000', fontWeight: 900, fontSize: '14px', border: 'none', borderRadius: '12px', cursor: 'pointer', letterSpacing: '.5px', whiteSpace: 'nowrap' }}>PLAY NOW →</button>
          </div>
        </div>

        {/* Table variants grid */}
        <div style={{ fontSize: '12px', color: '#888', fontWeight: 600, letterSpacing: '.5px', marginBottom: '12px' }} data-i18n="poker_choose_table">CHOOSE YOUR TABLE</div>
        <div id="poker-tables-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '14px', marginBottom: '28px' }}>
          {POKER_TABLES.map((t, i) => {
            const pct = (t.players / t.max) * 100;
            return (
              <div key={i} style={{ background: 'var(--surface)', borderRadius: '13px', padding: '16px', border: '1px solid var(--border)', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: t.color, marginBottom: '2px' }}>{t.icon} Texas Holdem</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>{t.sub}</div>
                  </div>
                  {t.status === 'tournament' ? (
                    <span style={{ background: 'rgba(251,146,60,.15)', color: '#fb923c', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '12px', border: '1px solid rgba(251,146,60,.3)' }}>🏆 TOURNAMENT</span>
                  ) : (
                    <span style={{ background: 'rgba(34,197,94,.12)', color: '#22c55e', fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '12px', border: '1px solid rgba(34,197,94,.3)' }}>🟢 LIVE</span>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div><div style={{ fontSize: '10px', color: '#555', marginBottom: '2px' }}>BLINDS</div><div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{t.blind}</div></div>
                  <div style={{ textAlign: 'right' }}><div style={{ fontSize: '10px', color: '#555', marginBottom: '2px' }}>PLAYERS</div><div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{t.players} / {t.max}</div></div>
                </div>
                <div style={{ background: '#0a0a18', borderRadius: '6px', height: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: t.color, borderRadius: '6px' }}></div>
                </div>
                <button onClick={() => toast('Opening Texas Holdem table...', 'success')} style={{ width: '100%', marginTop: '12px', padding: '9px', borderRadius: '8px', border: `1.5px solid ${t.color}`, background: 'rgba(255,255,255,0.03)', color: t.color, fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>JOIN TABLE →</button>
              </div>
            );
          })}
        </div>

        {/* How to play */}
        <div style={{ background: 'var(--surface)', borderRadius: '14px', padding: '20px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#f7c843', marginBottom: '16px' }}>📖 How to Play Texas Hold'em</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '12px' }}>
            {HOW_TO.map((h, i) => (
              <div key={i} style={{ background: '#0d0d1a', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontSize: '20px', marginBottom: '6px' }}>{h.num}</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#ddd', marginBottom: '4px' }} data-i18n={h.i18n}>{h.title}</div>
                <div style={{ fontSize: '11px', color: '#888', lineHeight: 1.6 }}>{h.desc}</div>
              </div>
            ))}
          </div>

          {/* Hand rankings */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#aaa', marginBottom: '10px', letterSpacing: '.5px' }} data-i18n="poker_rankings">HAND RANKINGS (HIGH → LOW)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {RANKINGS.map((r, i) => (
                <span key={i} style={r.style} data-i18n={r.i18n}>{r.label}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
