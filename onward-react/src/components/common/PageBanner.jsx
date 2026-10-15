import usePageBanner from '../../hooks/usePageBanner';

/*
 * Page hero banner. When the admin has uploaded an image for this page, it
 * renders that image with the page's eyebrow / title / description overlaid on
 * the left (passed in as props). Otherwise it falls back to the page's built-in
 * hero (children).
 */
export default function PageBanner({ pageKey, children, onClick, eyebrow, title, desc }) {
  const url = usePageBanner(pageKey);
  if (!url) return children || null;
  return (
    <div
      className="page-banner page-banner-box"
      onClick={onClick}
      style={{ backgroundImage: `url(${url})`, cursor: onClick ? 'pointer' : undefined }}
    >
      {(eyebrow || title || desc) && (
        <div className="page-banner-text">
          {eyebrow && <div className="page-banner-eyebrow">{eyebrow}</div>}
          {title && <div className="page-banner-title">{title}</div>}
          {desc && <div className="page-banner-desc">{desc}</div>}
        </div>
      )}
    </div>
  );
}
