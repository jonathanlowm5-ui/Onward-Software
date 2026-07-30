import { useEffect, useRef } from 'react';
import AuthModal from './AuthModal.jsx';
import DepositModal from './DepositModal.jsx';
import WithdrawModal from './WithdrawModal.jsx';
import GameModal from './GameModal.jsx';
import BankSetupModal from './BankSetupModal.jsx';
import DownloadModal from './DownloadModal.jsx';
import MiniGamesModal from './MiniGamesModal.jsx';
import PromoDetailModal from './PromoDetailModal.jsx';
import UseCodeModal from './UseCodeModal.jsx';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';

// Forces the "Bind Bank Account" step for logged-in players who haven't bound
// one yet (first-time login flow). Opens once per session so it isn't nagging.
function BankGate() {
  const { isLoggedIn, needsBankBinding, profile } = useAuth();
  const { activeModal, openModal } = useUI();
  const prompted = useRef(false);

  useEffect(() => {
    if (isLoggedIn && needsBankBinding && !prompted.current && activeModal === null) {
      prompted.current = true;
      openModal('bank', { name: profile?.fullName || '' });
    }
    if (!isLoggedIn) prompted.current = false; // reset on logout
  }, [isLoggedIn, needsBankBinding, activeModal, profile, openModal]);

  return null;
}

// Single mount point for all global modals. Each reads the active modal
// from UIContext and renders only when it should be visible.
export default function ModalsRoot() {
  return (
    <>
      <BankGate />
      <AuthModal />
      <DepositModal />
      <WithdrawModal />
      <GameModal />
      <BankSetupModal />
      <DownloadModal />
      <MiniGamesModal />
      <PromoDetailModal />
      <UseCodeModal />
    </>
  );
}
