import { useEffect, useState } from 'react';
import { getCurrencyRates } from '../services/currencyService';

// Loads the admin FX rates once (module-cached). Returns { base, rates }.
let cache = null;
let inflight = null;

export default function useCurrencyRates() {
  const [data, setData] = useState(cache || { base: 'PHP', rates: {} });
  useEffect(() => {
    if (cache) { setData(cache); return undefined; }
    if (!inflight) {
      inflight = getCurrencyRates()
        .then((d) => { cache = d || { base: 'PHP', rates: {} }; return cache; })
        .catch(() => ({ base: 'PHP', rates: {} }));
    }
    let alive = true;
    inflight.then((d) => { if (alive) setData(d); });
    return () => { alive = false; };
  }, []);
  return data;
}
