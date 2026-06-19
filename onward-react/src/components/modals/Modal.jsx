import { useEffect, useState } from 'react';

/**
 * Generic modal backdrop wrapper matching the original .modal-backdrop / .modal
 * markup so the styling and open/close animations are identical.
 */
export default function Modal({ id, open, onClose, children, modalStyle, maxWidth, zIndex }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!open) { setShown(false); return; }
    // Toggle the `open` class on the next frame so the CSS transition plays.
    const r = requestAnimationFrame(() => setShown(true));
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    return () => { cancelAnimationFrame(r); document.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  if (!open) return null;

  const style = zIndex ? { zIndex } : undefined;
  const inner = { ...(maxWidth ? { maxWidth } : {}), ...(modalStyle || {}) };

  return (
    <div
      className={`modal-backdrop${shown ? ' open' : ''}`}
      id={id}
      style={style}
      onClick={(e) => {
        if (e.target.id === id) onClose?.();
      }}
    >
      <div className="modal" style={inner}>
        {children}
      </div>
    </div>
  );
}
