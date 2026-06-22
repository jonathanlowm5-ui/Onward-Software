/*
 * Admin i18n engine — translates by matching visible English text.
 *
 * The admin markup has no data-i18n markers, so we walk text nodes and replace
 * those whose trimmed text matches a dictionary key, caching the original
 * English (per node) so switching back restores it. A debounced MutationObserver
 * keeps newly rendered views translated; it's paused during our own writes to
 * avoid feedback loops.
 */
import { DICT, SUPPORTED_LANGS } from './dict';

const STORAGE_KEY = 'onward_admin_lang';
let observer = null;
let debounceTimer = null;
let currentLang = 'en';
const origText = new WeakMap(); // text node -> original English value

export function getStoredLang() {
  try {
    const l = localStorage.getItem(STORAGE_KEY);
    return SUPPORTED_LANGS.includes(l) ? l : 'en';
  } catch { return 'en'; }
}
export function storeLang(lang) {
  try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* ignore */ }
}

function translateTree(lang) {
  const dict = DICT[lang] || null;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      const p = node.parentNode;
      if (!p) return NodeFilter.FILTER_REJECT;
      const tag = p.nodeName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'INPUT') return NodeFilter.FILTER_REJECT;
      if (p.isContentEditable) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach((node) => {
    const cached = origText.get(node);
    const base = cached !== undefined ? cached : node.nodeValue;
    const key = base.trim();
    const translated = dict && dict[key];
    if (translated) {
      if (cached === undefined) origText.set(node, base);
      const lead = (base.match(/^\s*/) || [''])[0];
      const trail = (base.match(/\s*$/) || [''])[0];
      const target = lead + translated + trail;
      if (node.nodeValue !== target) node.nodeValue = target;
    } else if (cached !== undefined) {
      // No translation for this language -> restore the original English.
      if (node.nodeValue !== cached) node.nodeValue = cached;
    }
  });
}

export function applyTranslations(lang) {
  currentLang = lang;
  if (observer) observer.disconnect();
  translateTree(lang);
  document.documentElement.setAttribute('lang', lang);
  if (observer) observer.observe(document.body, OBSERVE_OPTS);
}

const OBSERVE_OPTS = { childList: true, subtree: true, characterData: true };

export function startI18nObserver(getLang) {
  stopI18nObserver();
  observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const lang = getLang();
      if (lang && lang !== 'en') applyTranslations(lang);
    }, 90);
  });
  observer.observe(document.body, OBSERVE_OPTS);
  return stopI18nObserver;
}

export function stopI18nObserver() {
  if (observer) { observer.disconnect(); observer = null; }
  clearTimeout(debounceTimer);
}
