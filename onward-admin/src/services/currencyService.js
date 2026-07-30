import api from './api';

/*
 * Multi-currency helpers for the admin.
 *
 * The platform is multi-currency: every player has an ACCOUNT currency and all
 * of their money (balance, deposits, withdrawals, transactions) is stored in
 * that currency. The admin therefore shows each amount in the player's own
 * currency, and can optionally convert to a single REPORTING currency (the
 * top-bar selector) using the admin-managed FX rates from /api/currency-rates.
 *
 * rate[X] = how many units of X equal 1 unit of the base currency.
 */

export const getCurrencyRates = () => api.get('/currency-rates').then((r) => r.data);

export const CURRENCY_SYMBOL = {
  PHP: '₱', USD: '$', EUR: '€', INR: '₹', THB: '฿',
  VND: '₫', IDR: 'Rp', MYR: 'RM', CNY: '¥', JPY: '¥',
};

export const symbolFor = (code) => CURRENCY_SYMBOL[String(code || '').toUpperCase()] || '';

// Pull the numeric value out of a stored amount (number or a string like "₱12,400").
export const amountNum = (v) => {
  if (typeof v === 'number') return v;
  const m = String(v ?? '').replace(/[^0-9.-]/g, '');
  return m ? parseFloat(m) : 0;
};

export const fmtMoney = (amount, code) =>
  `${symbolFor(code)}${amountNum(amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

// Convert an amount from one currency to another via the base:
//   base units = amount / rate[from];  target = base units * rate[to]
export function convert(amount, from, to, rates) {
  const a = amountNum(amount);
  if (!from || !to || from === to) return a;
  const rf = Number(rates?.[from]) > 0 ? Number(rates[from]) : 1;
  const rt = Number(rates?.[to]) > 0 ? Number(rates[to]) : 1;
  return (a / rf) * rt;
}
