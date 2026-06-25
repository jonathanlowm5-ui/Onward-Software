import Modal from './Modal.jsx';
import { useUI } from '../../context/UIContext';

const OPTS = [
  { icon: '🍎', title: 'iOS App', desc: 'iPhone & iPad · iOS 13+', ti: 'dl_ios', td: 'dl_ios_desc' },
  { icon: '🌐', title: 'PWA', desc: 'Add to Home Screen · All devices', ti: 'dl_pwa', td: 'dl_pwa_desc' },
  { icon: '🤖', title: 'Android APK', desc: 'Android 8.0+ · Direct install', ti: 'dl_android', td: 'dl_android_desc' },
];

const card = { background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '14px', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'border-color .15s' };

export default function DownloadModal() {
  const { activeModal, closeModal } = useUI();
  return (
    <Modal id="download-modal" open={activeModal === 'download'} onClose={closeModal} maxWidth="460px" modalStyle={{ padding: 0, overflow: 'hidden' }} zIndex={1100}>
      <div style={{ padding: '20px 24px 16px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: '17px', fontWeight: 900, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            📱 <span data-i18n="dl_title">Download APP</span>
          </div>
          <button onClick={closeModal} style={{ background: 'rgba(255,255,255,.08)', border: 'none', color: 'var(--text-muted)', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }} data-i18n="dl_sub">Get the best casino experience on your device</div>
      </div>
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {OPTS.map((o) => (
          <div key={o.title} style={card}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--gold)')}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0,0,0,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>{o.icon}</div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }} data-i18n={o.ti}>{o.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }} data-i18n={o.td}>{o.desc}</div>
              </div>
            </div>
            <div style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-dark))', color: '#06091a', fontSize: '12px', fontWeight: 800, padding: '8px 18px', borderRadius: '8px', cursor: 'pointer' }} data-i18n="dl_download">Download</div>
          </div>
        ))}
        <div style={{ background: 'rgba(240,192,64,.07)', border: '1px solid rgba(240,192,64,.18)', borderRadius: '10px', padding: '12px 14px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
          <span data-i18n="dl_note_p1">📋 For APK: Enable</span> <strong style={{ color: 'var(--text)' }} data-i18n="dl_note_b">Install from Unknown Sources</strong><span data-i18n="dl_note_p2"> in Settings → Security before installing.</span>
        </div>
      </div>
    </Modal>
  );
}
