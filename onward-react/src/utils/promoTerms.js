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
import { autoTranslatePromo } from './promoAutoTranslate';

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

// Convert a promo's money amounts (min deposit / max bonus) from the currency
// they were defined in (p.currency, else PHP) into the viewer's currency using
// the app FX rates, so every player sees the terms in their own currency.
// `convert(amount, from, to)` is the fxConvert helper from the UI context.
export function localizePromoMoney(promo = {}, viewerCurrency, convert) {
  const p = promo || {};
  const from = String(p.currency || 'PHP').toUpperCase();
  const to = String(viewerCurrency || from).toUpperCase();
  if (!convert || from === to) return p;
  const num = (v) => { const m = String(v ?? '').match(/\d[\d,]*(?:\.\d+)?/); return m ? Number(m[0].replace(/,/g, '')) : null; };
  const conv = (v) => { const n = num(v); return n == null ? v : Math.round(convert(n, from, to)); };
  return {
    ...p,
    currency: to,
    minDeposit: p.minDeposit != null && p.minDeposit !== '' ? conv(p.minDeposit) : p.minDeposit,
    minDepositAmt: Number(p.minDepositAmt) > 0 ? Math.round(convert(Number(p.minDepositAmt), from, to)) : p.minDepositAmt,
    maxBonus: p.maxBonus != null && p.maxBonus !== '' ? conv(p.maxBonus) : p.maxBonus,
    maxClaimAmount: Number(p.maxClaimAmount) > 0 ? Math.round(convert(Number(p.maxClaimAmount), from, to)) : p.maxClaimAmount,
  };
}

// Localize a promo's title/description for a viewer's language. An admin-provided
// translation (p.i18n[lang]) always wins; otherwise the common promo wording is
// auto-translated so banners/cards localise themselves without manual entry.
export function localizePromo(promo = {}, lang = 'en') {
  const p = promo || {};
  const tr = (p.i18n && p.i18n[lang]) || {};
  const has = (v) => v && String(v).trim();
  return {
    ...p,
    title: has(tr.title) ? tr.title : autoTranslatePromo(p.title, lang),
    description: has(tr.description) ? tr.description : autoTranslatePromo(p.description, lang),
  };
}

// Pick the banner image to show a viewer: the per-currency banner for their own
// currency wins, then the promo's pinned-currency banner, then the default
// image. Lets one promotion carry MYR / PHP / … artwork with localized amounts.
// Inline style overrides for a promo banner's title / description, set by the
// admin (font colour + size in px). Returns {} when nothing is customised so
// the site's default banner typography is kept.
const isHex = (v) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(v || '').trim());
export function promoTitleStyle(promo = {}) {
  const s = {};
  if (isHex(promo.titleColor)) s.color = promo.titleColor;
  if (Number(promo.titleSize) > 0) s.fontSize = `${Number(promo.titleSize)}px`;
  return s;
}
export function promoDescStyle(promo = {}) {
  const s = {};
  if (isHex(promo.descColor)) s.color = promo.descColor;
  if (Number(promo.descSize) > 0) s.fontSize = `${Number(promo.descSize)}px`;
  return s;
}

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
