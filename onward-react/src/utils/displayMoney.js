/*
 * Player-side money display in the chosen DISPLAY currency.
 *
 * All the bundled showcase amounts (Big Wins, Jackpots, live tickers, etc.) are
 * authored in the platform base currency (PHP). When a player views the site in
 * another currency, these should convert too — this helper wraps the UI
 * fxConvert so every component formats amounts the same way.
 */
export const parseAmount = (v) => {
  if (typeof v === 'number') return v;
  const m = String(v ?? '').replace(/[^0-9.]/g, '');
  return m ? parseFloat(m) : 0;
};

const CUR_SYMBOL = { PHP: '₱', USD: '$', EUR: '€', INR: '₹', THB: '฿', VND: '₫', IDR: 'Rp', MYR: 'RM', CNY: '¥', JPY: '¥' };

// Convert currency amounts embedded in free text (e.g. a promo banner
// "100% UP TO ₱1,980") from `from` currency to `to`, leaving plain numbers
// (percentages, spin counts) untouched — only amounts with a currency symbol
// are converted.
export function convertMoneyInText(text, from, to, fxConvert) {
  if (!text || !fxConvert || !to || from === to) return text;
  const symTo = CUR_SYMBOL[String(to).toUpperCase()] || '';
  return String(text).replace(/([₱$€₹฿₫¥]|RM|Rp)\s?(\d[\d,]*(?:\.\d+)?)/g, (m, sym, num) => {
    const n = Number(num.replace(/,/g, ''));
    if (!Number.isFinite(n)) return m;
    const v = Math.round(fxConvert(n, from, to));
    return `${symTo}${v.toLocaleString()}`;
  });
}

// makeDisplayMoney(currency, fxConvert) -> fn(amountInBase, { base, decimals })
export function makeDisplayMoney(currency, fxConvert, defaultBase = 'PHP') {
  const code = currency?.code || 'PHP';
  const sym = currency?.symbol || '₱';
  return (amount, opts = {}) => {
    const base = opts.base || defaultBase;
    const n = parseAmount(amount);
    const v = fxConvert ? fxConvert(n, base, code) : n;
    const decimals = opts.decimals != null ? opts.decimals : 2;
    return `${sym}${v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  };
}
