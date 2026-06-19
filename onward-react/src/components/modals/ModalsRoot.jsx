import AuthModal from './AuthModal.jsx';
import WithdrawModal from './WithdrawModal.jsx';
import GameModal from './GameModal.jsx';
import BankSetupModal from './BankSetupModal.jsx';
import DownloadModal from './DownloadModal.jsx';

// Single mount point for all global modals. Each reads the active modal
// from UIContext and renders only when it should be visible.
export default function ModalsRoot() {
  return (
    <>
      <AuthModal />
      <WithdrawModal />
      <GameModal />
      <BankSetupModal />
      <DownloadModal />
    </>
  );
}
