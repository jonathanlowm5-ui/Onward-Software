import useSectionNav from '../hooks/useSectionNav';
import { useUI } from '../context/UIContext';

const MISSIONS = [
  { icon: '🔥', title: 'Daily Login Streak', desc: 'Log in 7 days in a row', progress: '4 / 7', pct: '57%', reward: '🎁 ₱50', claimable: false },
  { icon: '💰', title: 'First Deposit', desc: 'Make your first deposit', progress: '1 / 1', pct: '100%', reward: '🎁 50 FS', claimable: true },
  { icon: '🎰', title: 'Weekly Wager', desc: 'Wager ₱10,000 this week', progress: '₱6,200 / ₱10,000', pct: '62%', reward: '🎁 ₱200', claimable: false },
  { icon: '🏆', title: 'Win 5 Games', desc: 'Win 5 games in any category', progress: '3 / 5', pct: '60%', reward: '🎁 ₱100', claimable: false },
  { icon: '👥', title: 'Refer a Friend', desc: 'Invite 1 friend who deposits', progress: '1 / 1', pct: '100%', reward: '🎁 ₱150', claimable: true },
  { icon: '🎡', title: 'Spin the Wheel', desc: 'Use the Fortune Wheel 3 times', progress: '0 / 3', pct: '0%', reward: '🎁 25 FS', claimable: false },
];

export default function Missions() {
  const go = useSectionNav();
  const { toast } = useUI();

  const missionClaim = () => toast('Reward claimed!', 'success');

  return (
    <div id="view-missions">
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 16px 60px' }}>
        <button onClick={() => go('lobby')} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '8px 16px', borderRadius: '9px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }} data-i18n="mission_back">← BACK</button>
        <h2 style={{ fontFamily: "'Cinzel',serif", fontSize: '26px', color: 'var(--text)', margin: '18px 0 4px' }} data-i18n="mission_title">Missions</h2>
        <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '22px' }} data-i18n="mission_subtitle">Complete tasks to earn rewards</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: '16px' }}>
          {MISSIONS.map((m, i) => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(240,192,64,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '23px', flexShrink: 0 }}>{m.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, color: 'var(--text)', fontSize: '15px' }}>{m.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.desc}</div>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '5px' }}><span data-i18n="mission_progress">Progress</span><span>{m.progress}</span></div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,.08)', borderRadius: '6px', overflow: 'hidden' }}><div style={{ width: m.pct, height: '100%', background: 'linear-gradient(90deg,#f0c040,#d4a017)' }}></div></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '13px', color: 'var(--gold)', fontWeight: 800 }}>{m.reward}</div>
                {m.claimable ? (
                  <button onClick={missionClaim} style={{ background: 'linear-gradient(135deg,#f0c040,#d4a017)', color: '#1a1206', border: 'none', padding: '9px 20px', borderRadius: '9px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }} data-i18n="mission_claim">Claim</button>
                ) : (
                  <button disabled style={{ background: 'rgba(255,255,255,.06)', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '9px 18px', borderRadius: '9px', fontSize: '13px', fontWeight: 700, cursor: 'default', fontFamily: 'inherit' }} data-i18n="mission_inprogress">In progress</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
