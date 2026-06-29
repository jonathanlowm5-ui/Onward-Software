import { useState, useEffect } from 'react';
import CatLayout, { TileGrid } from '../components/common/CatLayout.jsx';
import { fetchSponsors } from '../services/contentService';

export default function Sponsors() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let alive = true;
    fetchSponsors().then((rows) => { if (alive) setItems(rows); });
    return () => { alive = false; };
  }, []);

  const tiles = items.map((s) => ({ id: s.id, icon: s.icon, name: s.name, meta: s.tier }));

  return (
    <div id="view-sponsors">
      <CatLayout
        eyebrow="Sponsors"
        title="Sponsorships"
        blurb="The teams and events onward proudly backs this season."
        listEyebrow="Partners"
        listTitle="Official partnerships"
      >
        {tiles.length ? (
          <TileGrid items={tiles} onTile={(t) => t.link && window.open(t.link, '_blank')} />
        ) : (
          <div className="cat-empty">No sponsors to show right now.</div>
        )}
      </CatLayout>
    </div>
  );
}
