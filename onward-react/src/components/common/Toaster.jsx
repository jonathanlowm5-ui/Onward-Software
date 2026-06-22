import { useUI } from '../../context/UIContext';

// Replaces the original global toast() helper.
export default function Toaster() {
  const { toasts } = useUI();
  return (
    <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 4000, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            background: t.type === 'error' ? 'var(--red)' : 'var(--surface2)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: 600,
            boxShadow: '0 8px 30px rgba(0,0,0,.5)',
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
