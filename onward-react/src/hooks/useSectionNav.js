import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { useUI } from '../context/UIContext';

// Maps the original showSection('id') names to React Router routes.
export const SECTION_ROUTES = {
  lobby: '/',
  slots: '/slots',
  live: '/live',
  sports: '/sports',
  fish: '/fish',
  promos: '/promotions',
  giveaways: '/giveaways',
  poker: '/poker',
  lottery: '/lottery',
  tournaments: '/tournaments',
  jackpots: '/jackpots',
  vip: '/vip',
  referral: '/referral',
  agent: '/agent',
  follow: '/follow',
  profile: '/profile',
  missions: '/missions',
};

/** Drop-in replacement for the original global showSection(id). */
export default function useSectionNav() {
  const navigate = useNavigate();
  const { closeSidebar } = useUI();
  return useCallback(
    (section) => {
      const path = SECTION_ROUTES[section] || '/';
      navigate(path);
      closeSidebar();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [navigate, closeSidebar]
  );
}
