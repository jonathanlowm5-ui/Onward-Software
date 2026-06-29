import useSectionNav from '../../hooks/useSectionNav';

/**
 * Shared scaffold for the v16.2 category pages (Sponsors, Rewards, Mobile,
 * Lucky Wheel, Fast Games, Leaderboard). Renders the hero + a back button and a
 * section header, then whatever children the page supplies.
 */
export default function CatLayout({ eyebrow, title, blurb, listEyebrow, listTitle, cta, children }) {
  const go = useSectionNav();
  return (
    <div className="catpage">
      <button className="cat-back-btn" onClick={() => go('lobby')} data-i18n="gw_back">← BACK</button>

      <header className="catpage-hero">
        {eyebrow && <span className="catpage-eyebrow">›› {eyebrow}</span>}
        <h1>{title}</h1>
        {blurb && <p>{blurb}</p>}
        {cta && <div className="catpage-cta">{cta}</div>}
      </header>

      <div className="catpage-section-head">
        <span className="eyebrow">{listEyebrow}</span>
        <h2>{listTitle}</h2>
      </div>

      {children}
    </div>
  );
}

export function TileGrid({ items, onTile }) {
  return (
    <div className="cat-tiles">
      {items.map((it, i) => (
        <button
          key={it.id || i}
          type="button"
          className="cat-tile"
          aria-label={`Open ${it.name}`}
          onClick={() => onTile && onTile(it)}
        >
          <span className="cat-tile__ico" aria-hidden="true">{it.ico || it.icon}</span>
          <span className="cat-tile__name">{it.name}</span>
          {it.meta != null && (
            <span className="cat-tile__meta" dangerouslySetInnerHTML={{ __html: it.meta }} />
          )}
        </button>
      ))}
    </div>
  );
}
