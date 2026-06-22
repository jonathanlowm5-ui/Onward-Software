import { useUI } from '../../context/UIContext';

// Mirrors renderPromoCard(). Supports both bundled promos ({tag,title,desc,amount})
// and API promos ({title,description,image,buttonText,buttonLink}).
export default function PromoCard({ promo, index, onOpen }) {
  const p = promo;
  const { openModal } = useUI();
  const desc = p.desc || p.description || '';
  const lines = String(desc).split('\n');

  const handle = () => (onOpen ? onOpen(index) : openModal('promo', p));

  return (
    <div className={`promo-card ${p.highlighted ? 'promo-card-highlighted' : ''}`} onClick={handle}>
      {(p.amount != null) && <div className="promo-watermark">{p.amount}</div>}
      {p.tag && <span className="promo-tag">{p.tag}</span>}
      {p.image && <img src={p.image} alt={p.title} className="promo-card-banner" />}
      <div className="promo-title">{p.title}</div>
      <div className="promo-desc">{lines.map((l, i) => <div key={i}>{l}</div>)}</div>
      {p.buttonText && (
        <a href={p.buttonLink || '#'} className="btn btn-primary btn-sm" style={{ marginTop: '10px', display: 'inline-block', padding: '8px 16px' }}>{p.buttonText}</a>
      )}
    </div>
  );
}
