/*
 * i18n engine — applies the dictionary to the live DOM.
 *
 * The markup carries `data-i18n="key"` attributes with English text as the
 * default child. This engine swaps that text for the active language, caching
 * the original English in `data-i18n-orig` so switching back restores it. It
 * only touches leaf elements (no child elements) so nested markup is never
 * clobbered, and it sets the document `lang`/`dir` (RTL for Arabic).
 *
 * A debounced MutationObserver re-applies translations as new pages mount
 * (React renders English first, then we translate), with the observer paused
 * during our own writes to avoid feedback loops.
 */
import { DICT, SUPPORTED_LANGS, RTL_LANGS } from './dict';

const STORAGE_KEY = 'onward_lang';
const OBSERVE_OPTS = { childList: true, subtree: true, characterData: true };
let observer = null;
let debounceTimer = null;

export function getStoredLang() {
  try {
    const l = localStorage.getItem(STORAGE_KEY);
    return SUPPORTED_LANGS.includes(l) ? l : 'en';
  } catch { return 'en'; }
}

export function storeLang(lang) {
  try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* storage unavailable */ }
}

function translateNodes(lang) {
  const dict = DICT[lang] || null;
  const nodes = document.querySelectorAll('[data-i18n]');
  nodes.forEach((el) => {
    if (el.children.length > 0) return; // never destroy nested markup
    const key = el.getAttribute('data-i18n');
    if (!key) return;
    if (el.dataset.i18nOrig === undefined) el.dataset.i18nOrig = el.textContent;
    const target = (dict && dict[key]) || el.dataset.i18nOrig;
    if (el.textContent !== target) el.textContent = target;
  });
}

export function applyTranslations(lang) {
  // Pause the observer so our own text writes don't retrigger it.
  if (observer) observer.disconnect();
  translateNodes(lang);
  const html = document.documentElement;
  html.setAttribute('lang', lang);
  html.setAttribute('dir', RTL_LANGS.has(lang) ? 'rtl' : 'ltr');
  if (observer) observer.observe(document.body, OBSERVE_OPTS);
}

// Start watching for newly mounted content (route changes etc.) and for React
// reverting translated text on re-render, then translate it to the current
// language. Returns a cleanup function.
export function startI18nObserver(getLang) {
  stopI18nObserver();
  observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const lang = getLang();
      if (lang && lang !== 'en') applyTranslations(lang);
    }, 80);
  });
  observer.observe(document.body, OBSERVE_OPTS);
  return stopI18nObserver;
}

export function stopI18nObserver() {
  if (observer) { observer.disconnect(); observer = null; }
  clearTimeout(debounceTimer);
}
