import { useAuth } from '../../context/AuthContext';

/*
 * Single source of truth for the logged-in player's avatar. Renders the
 * uploaded photo when present, otherwise the 🎮 fallback — so changing the
 * avatar in the profile updates it everywhere it's used (header chip, account
 * menus, etc.).
 */
export default function PlayerAvatar({ size = 42, fontSize, className, style }) {
  const { profile } = useAuth();
  const url = profile?.avatar;
  const base = {
    width: size,
    height: size,
    borderRadius: '50%',
    background: 'var(--bg3,#0c1322)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: fontSize || Math.round(size * 0.52),
    flex: '0 0 auto',
    overflow: 'hidden',
    ...(url ? { backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : null),
    ...style,
  };
  return <div className={className} style={base}>{url ? '' : '🎮'}</div>;
}
