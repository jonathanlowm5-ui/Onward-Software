import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout.jsx';

// Code-split each view so the heavy bundled game art only loads where needed.
const Lobby = lazy(() => import('./pages/Lobby.jsx'));
const Slots = lazy(() => import('./pages/Slots.jsx'));
const Sports = lazy(() => import('./pages/Sports.jsx'));
const Lottery = lazy(() => import('./pages/Lottery.jsx'));
const LiveCasino = lazy(() => import('./pages/LiveCasino.jsx'));
const Fish = lazy(() => import('./pages/Fish.jsx'));
const Poker = lazy(() => import('./pages/Poker.jsx'));
const Promotions = lazy(() => import('./pages/Promotions.jsx'));
const Tournaments = lazy(() => import('./pages/Tournaments.jsx'));
const Jackpots = lazy(() => import('./pages/Jackpots.jsx'));
const VIP = lazy(() => import('./pages/VIP.jsx'));
const Referral = lazy(() => import('./pages/Referral.jsx'));
const Agent = lazy(() => import('./pages/Agent.jsx'));
const Follow = lazy(() => import('./pages/Follow.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const Missions = lazy(() => import('./pages/Missions.jsx'));
const Giveaways = lazy(() => import('./pages/Giveaways.jsx'));

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          path="/*"
          element={
            <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading…</div>}>
              <Routes>
                <Route index element={<Lobby />} />
                <Route path="slots" element={<Slots />} />
                <Route path="sports" element={<Sports />} />
                <Route path="lottery" element={<Lottery />} />
                <Route path="live" element={<LiveCasino />} />
                <Route path="fish" element={<Fish />} />
                <Route path="poker" element={<Poker />} />
                <Route path="promotions" element={<Promotions />} />
                <Route path="tournaments" element={<Tournaments />} />
                <Route path="jackpots" element={<Jackpots />} />
                <Route path="vip" element={<VIP />} />
                <Route path="referral" element={<Referral />} />
                <Route path="agent" element={<Agent />} />
                <Route path="follow" element={<Follow />} />
                <Route path="profile" element={<Profile />} />
                <Route path="missions" element={<Missions />} />
                <Route path="giveaways" element={<Giveaways />} />
                <Route path="*" element={<Lobby />} />
              </Routes>
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}
