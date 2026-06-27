import facebook from '../assets/social/facebook.svg';
import telegram from '../assets/social/telegram.svg';
import whatsapp from '../assets/social/whatsapp.svg';
import instagram from '../assets/social/instagram.svg';
import twitter from '../assets/social/twitter.svg';
import kwai from '../assets/social/kwai.svg';

// The social platforms we support, in display order. `icon` is the uploaded SVG;
// `share(url, text)` builds a web share-intent link (null = no web share, so the
// referral page falls back to copying the link).
export const SOCIALS = [
  { key: 'facebook', name: 'Facebook', icon: facebook, share: (u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}` },
  { key: 'telegram', name: 'Telegram', icon: telegram, share: (u, t) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t || '')}` },
  { key: 'whatsapp', name: 'WhatsApp', icon: whatsapp, share: (u, t) => `https://wa.me/?text=${encodeURIComponent((t ? t + ' ' : '') + u)}` },
  { key: 'twitter', name: 'Twitter / X', icon: twitter, share: (u, t) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t || '')}` },
  { key: 'instagram', name: 'Instagram', icon: instagram, share: null },
  { key: 'kwai', name: 'Kwai', icon: kwai, share: null },
];

export const SOCIAL_BY_KEY = SOCIALS.reduce((m, s) => { m[s.key] = s; return m; }, {});
