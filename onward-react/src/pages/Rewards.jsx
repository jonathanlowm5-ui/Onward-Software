import { useState, useEffect } from 'react';
import CatLayout, { TileGrid } from '../components/common/CatLayout.jsx';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import { fetchRewards } from '../services/contentService';

export default function Rewards() {
  const [items, setItems] = useState([]);
  const { openModal, toast } = useUI();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    let alive = true;
    fetchRewards().then((rows) => { if (alive) setItems(rows); });
    return () => { alive = false; };
  }, []);

  const tiles = items.map((r) => ({
    id: r.id, icon: r.icon, name: r.name,
    meta: `<b>${Number(r.cost).toLocaleString()}</b> pts`,
  }));

  const redeem = (t) => {
    if (!isLoggedIn) { openModal('register'); return; }
    if (toast) toast(`You need more points to redeem ${t.name}.`);
  };

  return (
    <div id="view-rewards">
      <CatLayout
        eyebrow="Rewards Club"
        title="Rewards Club"
        blurb="Turn points into bonuses, free spins and merch. You have 0 points."
        listEyebrow="Redeem"
        listTitle="Rewards store"
      >
        {tiles.length ? (
          <TileGrid items={tiles} onTile={redeem} />
        ) : (
          <div className="cat-empty">The rewards store is empty right now.</div>
        )}
      </CatLayout>
    </div>
  );
}
