import { useNavigate } from 'react-router-dom';
import CatLayout, { TileGrid } from '../components/common/CatLayout.jsx';

const FAST_GAMES = [
  { id: 'aviator', icon: '✈️', name: 'Aviator', meta: 'Crash · x1 – x1000' },
  { id: 'jetx', icon: '🚀', name: 'JetX', meta: 'Crash · cash out anytime' },
  { id: 'mines', icon: '💣', name: 'Mines', meta: 'Pick & win' },
  { id: 'dice', icon: '🎲', name: 'Dice', meta: 'Provably fair' },
  { id: 'plinko', icon: '🔻', name: 'Plinko', meta: 'Drop & multiply' },
  { id: 'limbo', icon: '📈', name: 'Limbo', meta: 'Set your target' },
];

export default function FastGames() {
  const navigate = useNavigate();

  return (
    <div id="view-fast-games">
      <CatLayout
        eyebrow="Fast Games"
        title="Fast Games"
        blurb="Quick-round originals — provably fair, settled in seconds, cash out any time."
        listEyebrow="Fast Games"
        listTitle="Instant games to play"
      >
        <TileGrid items={FAST_GAMES} onTile={() => navigate('/slots?cat=crash')} />
      </CatLayout>
    </div>
  );
}
