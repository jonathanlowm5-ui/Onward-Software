import CatLayout, { TileGrid } from '../components/common/CatLayout.jsx';
import { useUI } from '../context/UIContext';

const APP_TILES = [
  { id: 'ios', icon: '🍏', name: 'iOS', meta: 'iPhone &amp; iPad' },
  { id: 'android', icon: '🤖', name: 'Android', meta: 'APK · v4.2' },
  { id: 'web', icon: '🌐', name: 'Mobile web', meta: 'No install needed' },
];

export default function Mobile() {
  const { openModal } = useUI();

  return (
    <div id="view-mobile">
      <CatLayout
        eyebrow="Mobile"
        title="onward Mobile"
        blurb="Play anywhere. Install the app for faster loads and instant alerts."
        listEyebrow="Get the app"
        listTitle="Download"
        cta={
          <button className="btn btn--primary" style={{ padding: '10px 20px', borderRadius: 'var(--radius)', background: 'linear-gradient(135deg,var(--gold),var(--gold-dark))', color: '#06091a', fontWeight: 700, border: 0, cursor: 'pointer' }} onClick={() => openModal('download')}>
            Download the app
          </button>
        }
      >
        <TileGrid items={APP_TILES} onTile={() => openModal('download')} />
      </CatLayout>
    </div>
  );
}
