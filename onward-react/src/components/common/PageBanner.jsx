import usePageBanner from '../../hooks/usePageBanner';

/*
 * Page hero banner. When the admin has uploaded an image for this page, it
 * renders that image at a single consistent size; otherwise it falls back to
 * the page's built-in hero (children).
 */
export default function PageBanner({ pageKey, children, onClick }) {
  const url = usePageBanner(pageKey);
  if (!url) return children || null;
  return (
    <img
      src={url}
      alt=""
      className="page-banner"
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    />
  );
}
