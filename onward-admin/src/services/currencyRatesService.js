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

export async function saveCurrencyRates(base, rates) {
  const { data } = await api.put('/currency-rates', { base, rates });
  return data;
}
