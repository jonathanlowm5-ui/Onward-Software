/*
 * promoTerms.js — builds the numbered Terms & Conditions for a promotion.
 *
 * Lines 1–6 are auto-filled from the promotion package (min deposit, currency,
 * type, rollover) so they always match whatever the admin configured. Lines
 * 7–12 are fixed legal terms that never change.
 *
 * Used by the player Promo Detail modal and the admin Create/Edit preview so
 * both show identical wording.
 */

// Pull the first numeric value out of a free-text field (e.g. "₱500" -> "500").
import { TERMS_I18N } from './promoTermsI18n';

function digits(value, fallback) {
  const m = String(value ?? '').match(/\d[\d,]*(?:\.\d+)?/);
  return m ? m[0].replace(/,/g, '') : String(fallback);
}

// viewerCurrency = the currency of the player viewing the promo. A promo pinned
// to a specific currency uses that; otherwise the terms follow the viewer's
// own currency (defaulting to PHP).
export function buildPromoTerms(promo = {}, viewerCurrency, lang = 'en') {
  const p = promo || {};
  // Admin override: per-language custom terms, then base custom terms.
  const custom = (p.i18n && p.i18n[lang] && p.i18n[lang].customTerms) || p.customTerms;
  if (custom && String(custom).trim()) {
    return String(custom).split('\n').map((l) => l.trim()).filter(Boolean);
  }
  const minDep = digits(p.minDeposit ?? p.md, 100);
  const currency = String(p.currency || viewerCurrency || 'PHP').toUpperCase();
  const rollover = digits(p.wager ?? p.rollover, 15);
  const firstDepositOnly = /welcome|first/i.test(String(p.type || '')) || p.firstDepositOnly;
  const T = TERMS_I18N[lang] || TERMS_I18N.en;
  const fill = (s) => String(s).replace(/\{min\}/g, minDep).replace(/\{cur\}/g, currency).replace(/\{x\}/g, rollover);
  const out = T.lines.map(fill);
  if (firstDepositOnly) out[3] = fill(T.s4first);
  return out;
}

// Localize a promo's title/description for a viewer's language. Admins provide
// translations in p.i18n[lang]; otherwise the base (default) text is shown.
export function localizePromo(promo = {}, lang = 'en') {
  const p = promo || {};
  const tr = (p.i18n && p.i18n[lang]) || {};
  const pick = (a, b) => (a && String(a).trim() ? a : b);
  return {
    ...p,
    title: pick(tr.title, p.title),
    description: pick(tr.description, p.description),
  };
}

// Pick the banner image to show a viewer: the per-currency banner for their own
// currency wins, then the promo's pinned-currency banner, then the default
// image. Lets one promotion carry MYR / PHP / … artwork with localized amounts.
export function resolvePromoBanner(promo = {}, viewerCurrency) {
  const p = promo || {};
  const map = p.banners && typeof p.banners === 'object' ? p.banners : null;
  const cur = String(viewerCurrency || '').toUpperCase();
  if (map) {
    if (cur && map[cur]) return map[cur];
    if (p.currency && map[p.currency]) return map[p.currency];
  }
  return p.image || '';
}

export default buildPromoTerms;
