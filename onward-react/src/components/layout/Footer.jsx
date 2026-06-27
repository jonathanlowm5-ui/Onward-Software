import { useNavigate } from 'react-router-dom';
import { useUI } from '../../context/UIContext';
import useSectionNav from '../../hooks/useSectionNav';
import useSocialLinks from '../../hooks/useSocialLinks';
import { SOCIALS } from '../../services/social';
import { IMG0 as LOGO } from '../../assets/images';

export default function Footer() {
  const go = useSectionNav();
  const navigate = useNavigate();
  const { openModal } = useUI();
  const social = useSocialLinks();
  const activeSocials = SOCIALS.filter((s) => social[s.key]);

  const footerGoTable = () => navigate('/slots?cat=table');
  const footerGoCrash = () => navigate('/slots?cat=crash');

  return (
    <footer>
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="logo">
            <img src={LOGO} alt="Onward" style={{ height: '36px', width: 'auto', objectFit: 'contain', display: 'block' }} />
          </div>
          <p data-i18n="ftr_brand_desc">
            Philippines' premier online casino platform. Licensed by PAGCOR. Play responsibly and enjoy the thrill of world-class gaming from the comfort of your home.
          </p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <div className="age-badge">18+</div>
            <div style={{ padding: '6px 12px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }} data-i18n="ftr_licensed">PAGCOR Licensed</div>
            <div style={{ padding: '6px 12px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)', fontSize: '12px', fontWeight: 700, color: 'var(--green)' }} data-i18n="ftr_ssl">SSL Secure</div>
          </div>
          {activeSocials.length > 0 && (
            <div className="ftr-social">
              <div className="ftr-social-title" data-i18n="ftr_follow_us">Follow Us</div>
              <div className="ftr-social-row">
                {activeSocials.map((s) => (
                  <a key={s.key} href={social[s.key]} target="_blank" rel="noopener noreferrer" className="ftr-social-link" title={s.name} aria-label={s.name}>
                    <img src={s.icon} alt={s.name} />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="footer-col">
          <h4 data-i18n="ftr_casino">Casino</h4>
          <ul>
            <li><a href="#" onClick={(e) => { e.preventDefault(); go('slots'); }} data-i18n="nav_slots">Slots</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); go('live'); }} data-i18n="nav_live">Live Casino</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); footerGoTable(); }} data-i18n="ftr_table_games">Table Games</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); go('fish'); }} data-i18n="nav_fish">Fish Games</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); footerGoCrash(); }} data-i18n="ftr_crash">Crash Games</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); go('sports'); }} data-i18n="ftr_sports">Sports Betting</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4 data-i18n="prof_account">Account</h4>
          <ul>
            <li><a href="#" onClick={(e) => { e.preventDefault(); openModal('register'); }} data-i18n="ui_register">Register</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); openModal('login'); }} data-i18n="ui_login">Login</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); openModal('deposit'); }} data-i18n="ui_deposit">Deposit</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); openModal('withdraw'); }} data-i18n="ui_withdraw">Withdraw</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); go('vip'); }} data-i18n="ftr_vip_prog">VIP Program</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); go('referral'); }} data-i18n="nav_referral">Referral</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h4 data-i18n="ftr_support">Support</h4>
          <ul>
            <li><a href="#" data-i18n="ftr_help">Help Center</a></li>
            <li><a href="#" data-i18n="ftr_live_chat">Live Chat</a></li>
            <li><a href="#" data-i18n="ftr_terms">Terms of Service</a></li>
            <li><a href="#" data-i18n="ftr_privacy">Privacy Policy</a></li>
            <li><a href="#" data-i18n="prof_responsible">Responsible Gaming</a></li>
            <li><a href="#" data-i18n="ftr_contact">Contact Us</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p data-i18n="ftr_copyright">© 2024 Onward. All rights reserved. Must be 18+ to play. Gambling can be addictive. Play responsibly.</p>
        <div className="payment-icons">
          <span className="pay-icon">GCash</span>
          <span className="pay-icon">Maya</span>
          <span className="pay-icon">UnionBank</span>
          <span className="pay-icon">BDO</span>
          <span className="pay-icon">BPI</span>
          <span className="pay-icon">₿ Crypto</span>
        </div>
      </div>
      <div className="responsible-gaming">
        <div className="age-badge" style={{ flexShrink: 0 }}>18+</div>
        <p className="rg-text" data-i18n="ftr_rg_text">
          Onward promotes responsible gambling. If you feel you may have a gambling problem, please contact PAGCOR's Responsible Gambling Hotline or seek help from a qualified professional. This site is strictly for players aged 18 and above.
        </p>
      </div>
    </footer>
  );
}
