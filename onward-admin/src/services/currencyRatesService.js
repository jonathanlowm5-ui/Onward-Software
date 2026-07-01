/*
 * currencyRatesService — read/write the multi-currency conversion rates that
 * power the player-site "view in another currency" converter indicator.
 * rate[X] = how many units of X equal 1 unit of the base currency.
 */
import api from './api';

export async function getCurrencyRates() {
  const { data } = await api.get('/currency-rates');
  return data || { base: 'PHP', rates: {} };
}

export async function saveCurrencyRates(base, rates, enabled) {
  const body = { base, rates };
  if (Array.isArray(enabled)) body.enabled = enabled;
  const { data } = await api.put('/currency-rates', body);
  return data;
}
