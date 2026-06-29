import api from './api';

/**
 * Content service for the v16.2 category pages (Sponsors, Rewards, Leaderboard).
 *
 * Mirrors gamesService: try the live API first (so admin edits show up); if it
 * is unreachable, fall back to the bundled data extracted from onward_16_2.html
 * so the pages always render — exactly like the rest of the app.
 */

const FALLBACK_SPONSORS = [
  { id: 's1', icon: '🏍', name: 'Racing Team', tier: 'Title sponsor' },
  { id: 's2', icon: '🏸', name: 'Badminton Cup', tier: 'Presenting partner' },
  { id: 's3', icon: '⚽', name: 'Football Club', tier: 'Official partner' },
];

const FALLBACK_REWARDS = [
  { id: 'r1', icon: '🎟', name: 'Bonus cash', cost: 500 },
  { id: 'r2', icon: '🎰', name: 'Free spins', cost: 300 },
  { id: 'r3', icon: '👕', name: 'Merch', cost: 1200 },
  { id: 'r4', icon: '⏫', name: 'Tier boost', cost: 2000 },
];

const FALLBACK_LEADERBOARD = [
  { id: 'l1', name: 'Player_88', points: 12400 },
  { id: 'l2', name: 'LuckyTan', points: 11050 },
  { id: 'l3', name: 'AceWong', points: 9820 },
  { id: 'l4', name: 'MsLim', points: 8300 },
  { id: 'l5', name: 'RajaR', points: 7640 },
].map((r, i) => ({ ...r, rank: i + 1 }));

export async function fetchSponsors() {
  try {
    const { data } = await api.get('/sponsors?active=1');
    if (Array.isArray(data) && data.length) return data;
  } catch {
    /* fall through */
  }
  return FALLBACK_SPONSORS;
}

export async function fetchRewards() {
  try {
    const { data } = await api.get('/rewards?active=1');
    if (Array.isArray(data) && data.length) return data;
  } catch {
    /* fall through */
  }
  return FALLBACK_REWARDS;
}

export async function fetchLeaderboard() {
  try {
    const { data } = await api.get('/leaderboard');
    if (Array.isArray(data) && data.length) return data;
  } catch {
    /* fall through */
  }
  return FALLBACK_LEADERBOARD;
}
