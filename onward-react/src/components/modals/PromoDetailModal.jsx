import Modal from './Modal.jsx';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';
import { buildPromoTerms, resolvePromoBanner, localizePromo } from '../../utils/promoTerms';

/*
 * Promotion detail modal (#promo). Opened from any promo card on the
 * Promotions page (admin-created promos and the built-in showcase) via
 * openModal('promo', promo). Renders the full, customised detail for that one
 * promotion: banner, bonus, the wager/turnover/limits grid, validity window,
 * description and a call-to-action.
 */

function fmtDate(d) {
  if (!d) return null;
  // Accept YYYY-MM-DD or full ISO; show a friendly date.
  const t = Date.parse(d);
  if (Number.isNaN(t)) return String(d);
  return new Date(t).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function PromoDetailModal() {
  const { activeModal, modalData, closeModal, openModal, lang } = useUI();
  const { profile } = useAuth();
  const open = activeModal === 'promo';
  if (!open) return null;

  const p = localizePromo(modalData || {}, lang);
  const title = p.title || p.name || 'Promotion';
  const desc = p.description || p.desc || '';
  const lines = String(desc).split('\n').filter(Boolean);
  const extras = Array.isArray(p.lines) ? p.lines : [];

  // The detail rows — only the ones that carry a value are shown. Falls back to
  // the structured Promotion Rules fields when the legacy display strings are
  // empty (those editor inputs were removed in favour of the rules section).
  const pct = p.percentage ? `${p.percentage}%` : '';
  const mult = Number(p.multiply) > 0 ? `${p.multiply}x` : '';
  const rows = [
    ['Bonus', p.bonus || pct],
    ['Max Bonus', p.maxBonus || p.max || (p.maxClaimAmount ? p.maxClaimAmount : '')],
    ['Min Deposit', p.minDeposit || p.md || (p.minDepositAmt ? p.minDepositAmt : '')],
    ['Wager Requirement', p.wager || (p.requirement && p.requirement.includes('T/O') ? mult : '')],
    ['Winover', p.requirement && p.requirement.includes('Winover') ? mult : ''],
    ['Refresh', p.refreshCycle && p.refreshCycle !== 'Once' ? p.refreshCycle : ''],
    ['Type', p.bonusType || p.type],
  ].filter(([, v]) => v != null && String(v).trim() !== '');

  const starts = fmtDate(p.startDate);
  const ends = fmtDate(p.endDate);

  const terms = buildPromoTerms(p, profile?.currency, lang);
  const banner = resolvePromoBanner(p, profile?.currency);
  const ctaLabel = p.buttonText || 'Deposit Now';
  const onCta = () => {
    closeModal();
    const link = String(p.buttonLink || '');
    if (link && /^https?:\/\//i.test(link)) { window.open(link, '_blank', 'noopener'); return; }
    // Internal links (e.g. /deposit) and the default both open the deposit flow.
    openModal('deposit');
  };

  return (
    <Modal id="promo-modal" open={open} onClose={closeModal} maxWidth="560px">
      <div className="modal-header">
        <span className="modal-title">🎁 {title}</span>
        <button className="modal-close" onClick={closeModal}>✕</button>
      </div>
      <div className="modal-body" style={{ paddingTop: 14 }}>
        {/* Banner — image with the title + description overlaid, or a gradient header */}
        {banner ? (
          <div className="promo-detail-banner promo-detail-banner-box" style={{ backgroundImage: `url(${banner})` }}>
            <div className="promo-detail-banner-text">
              <span className="promo-detail-banner-title">{title}</span>
              {(extras.length > 0 || lines.length > 0) && (
                <div className="promo-detail-banner-desc">
                  {(extras.length ? extras : lines).map((l, i) => <div key={i}>{l}</div>)}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="promo-detail-banner promo-detail-banner--gradient">
            {(p.deco || p.bonus || pct) && <span className="promo-detail-deco">{p.deco || p.bonus || pct}</span>}
            <span className="promo-detail-banner-title">{title}</span>
          </div>
        )}

        {/* Bonus headline */}
        {(p.bonus || pct) && (
          <div style={{ display: 'flex', justifyContent: 'center', margin: '14px 0 6px' }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: 'var(--gold,#f0c040)', letterSpacing: '.02em' }}>{p.bonus || pct}</span>
          </div>
        )}

        {/* Headline lines / extras (e.g. "+100 FREE SPINS") — only when there is
            no banner, since the banner already shows the description. */}
        {!banner && (extras.length > 0 || lines.length > 0) && (
          <div style={{ textAlign: 'center', color: 'var(--text,#fff)', fontWeight: 700, lineHeight: 1.5, marginBottom: 6 }}>
            {(extras.length ? extras : lines).map((l, i) => <div key={i}>{l}</div>)}
          </div>
        )}

        {/* Detail grid */}
        {rows.length > 0 && (
          <div className="promo-detail-grid">
            {rows.map(([k, v]) => (
              <div className="promo-detail-cell" key={k}>
                <div className="promo-detail-k">{k}</div>
                <div className="promo-detail-v">{String(v)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Validity */}
        {(starts || ends) && (
          <div className="promo-detail-validity">
            🗓️ {starts ? `From ${starts}` : 'Available now'}{ends ? ` · valid until ${ends}` : ' · no expiry'}
          </div>
        )}

        {/* Full description (when it has real sentences, not just the headline) */}
        {lines.length > 0 && extras.length > 0 && (
          <p className="promo-detail-desc">{lines.join(' ')}</p>
        )}

        {/* Terms & Conditions — 1–6 auto-filled from the package, 7–12 fixed */}
        <div className="promo-detail-terms">
          <div className="promo-terms-head">TERMS &amp; CONDITIONS:</div>
          <ol className="promo-terms-list">
            {terms.map((t, i) => <li key={i}>{t}</li>)}
          </ol>
        </div>
      </div>

      {/* Sticky footer — Back + the call-to-action stay reachable without
          scrolling through the whole T&C (mobile-friendly). */}
      <div className="promo-detail-footer">
        <button className="promo-detail-back" onClick={closeModal}>← Back</button>
        <button className="promo-detail-cta" onClick={onCta}>{ctaLabel}</button>
      </div>
    </Modal>
  );
}
