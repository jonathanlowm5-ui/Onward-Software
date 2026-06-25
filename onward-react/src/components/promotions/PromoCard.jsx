import { useNavigate } from 'react-router-dom';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';
import { resolvePromoBanner } from '../../utils/promoTerms';

// Mirrors renderPromoCard(). Supports both bundled promos ({tag,title,desc,amount})
// and API promos ({title,description,image,banners,buttonText,buttonLink}).
export default function PromoCard({ promo, index, onOpen }) {
  const p = promo;
  const { openModal } = useUI();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const desc = p.desc || p.description || '';
  const lines = String(desc).split('\n');
  const banner = resolvePromoBanner(p, profile?.currency);

  const handle = () => (onOpen ? onOpen(index) : openModal('promo', p));
  const claim = (e) => {
    e.stopPropagation();
    const link = String(p.buttonLink || '').trim();
    if (link.startsWith('/')) { navigate(link); return; }
    if (/^https?:\/\//i.test(link)) { window.open(link, '_blank', 'noopener'); return; }
    openModal('promo', p);
  };

  return (
    <div className={`promo-card ${p.highlighted ? 'promo-card-highlighted' : ''}`} onClick={handle}>
      {(p.amount != null) && <div className="promo-watermark">{p.amount}</div>}
      {p.tag && <span className="promo-tag">{p.tag}</span>}
      {banner && <img src={banner} alt={p.title} className="promo-card-banner" />}
      <div className="promo-title">{p.title}</div>
      <div className="promo-desc">{lines.map((l, i) => <div key={i}>{l}</div>)}</div>
      <button className="wh-tier-btn primary" style={{ marginTop: 12, width: '100%' }} onClick={claim}>{p.buttonText || 'Claim now'}</button>
    </div>
  );
}
