/*
 * heibaoImport.js — imports the bundled heibaoIcons game catalogue
 * (seed-data/heibao-games.json: 4,995 games with 208×280 webp icons, all
 * ≤29KB, hosted on raw.githubusercontent.com) into the `games` collection.
 *
 * Self-healing and idempotent: games are matched by externalId ("hb:<id>"),
 * so re-running only inserts whatever is missing. `limit` caps how many are
 * inserted per call (the boot seed imports in chunks; the admin
 * POST /api/games/heibao-sync endpoint imports everything remaining).
 */
const fs = require('fs');
const path = require('path');
const store = require('./store');

let catalogue = null;
function load() {
  if (catalogue) return catalogue;
  try {
    catalogue = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed-data', 'heibao-games.json'), 'utf8'));
  } catch (e) {
    console.error('[heibao] catalogue missing:', e.message);
    catalogue = [];
  }
  return catalogue;
}

function importMissing(limit = Infinity) {
  const list = load();
  if (!list.length) return { imported: 0, remaining: 0, total: 0 };
  const existing = new Set(
    store.list('games').map((g) => g.externalId).filter((x) => typeof x === 'string' && x.startsWith('hb:'))
  );
  let order = store.list('games').length;
  let imported = 0;
  for (const g of list) {
    if (imported >= limit) break;
    const ext = 'hb:' + g.id;
    if (existing.has(ext)) continue;
    store.insert('games', {
      externalId: ext,
      name: g.name,
      provider: g.provider,
      category: g.category,
      image: g.image,
      icon: '🎰',
      color: '',
      badge: '',
      launchUrl: '',
      enabled: true,
      order: order++,
      source: 'heibao',
    });
    existing.add(ext);
    imported += 1;
  }
  const remaining = list.filter((g) => !existing.has('hb:' + g.id)).length;
  return { imported, remaining, total: list.length };
}

module.exports = { importMissing };
