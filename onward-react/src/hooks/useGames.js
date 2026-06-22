import { useEffect, useState } from 'react';
import { fetchGames } from '../services/gamesService';

/**
 * Loads the game catalogue once (live API first, bundled data as fallback) and
 * exposes loading / error state. Used by the casino lobby and slots pages.
 */
export default function useGames() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchGames()
      .then((g) => { if (alive) setGames(g); })
      .catch((e) => { if (alive) setError(e.message || 'Failed to load games'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  return { games, loading, error };
}
