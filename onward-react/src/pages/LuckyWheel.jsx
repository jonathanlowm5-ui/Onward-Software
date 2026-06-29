import CatLayout, { TileGrid } from '../components/common/CatLayout.jsx';
import { useUI } from '../context/UIContext';

const WHEELS = [
  { id: 'daily', icon: '🎡', name: 'Daily Spin', meta: '1 free spin / day' },
  { id: 'bonus', icon: '⭐', name: 'Bonus Spin', meta: 'Earn with play' },
  { id: 'mega', icon: '💰', name: 'Mega Spin', meta: 'VIP members' },
];

export default function LuckyWheel() {
  const { openModal } = useUI();

  return (
    <div id="view-lucky-wheel">
      <CatLayout
        eyebrow="Lucky Wheel"
        title="Lucky Wheel"
        blurb="Spin daily for bonuses, free spins and cash prizes."
        listEyebrow="Spins"
        listTitle="Available wheels"
        cta={
          <button className="btn btn--primary" style={{ padding: '10px 20px', borderRadius: 'var(--radius)', background: 'linear-gradient(135deg,var(--gold),var(--gold-dark))', color: '#06091a', fontWeight: 700, border: 0, cursor: 'pointer' }} onClick={() => openModal('fortune')}>
            Spin now
          </button>
        }
      >
        <TileGrid items={WHEELS} onTile={() => openModal('fortune')} />
      </CatLayout>
    </div>
  );
}
