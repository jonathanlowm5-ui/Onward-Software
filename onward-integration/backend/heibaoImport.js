/*
 * heibaoImport.js — imports the bundled heibaoIcons game catalogue
 * (seed-data/heibao-games.json: 4,995 games; icons are self-hosted on the
 * player site under /gicons/g/<id>.webp — 208×280, max 29KB each).
 *
 * Self-healing and idempotent:
 *  - a catalogue entry already imported (externalId "hb:<id>") is skipped,
 *    but its image is migrated if the catalogue URL changed
 *  - a LEGACY game with the same provider+name is claimed and updated in
 *    place (correct high-res art, category, externalId) instead of creating
 *    a duplicate tile
 *  - anything else is inserted, up to `limit` per call
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

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function importMissing(limit = Infinity) {
  const list = load();
  if (!list.length) return { imported: 0, updated: 0, remaining: 0, total: 0 };

  const games = store.list('games');
  const byExt = new Map();
  const byName = new Map(); // "provider|name" -> game (legacy matcher)
  for (const g of games) {
    if (typeof g.externalId === 'string' && g.externalId.startsWith('hb:')) byExt.set(g.externalId, g);
    byName.set(norm(g.provider) + '|' + norm(g.name), g);
  }

  let order = games.length;
  let imported = 0;
  let updated = 0;
  for (const c of list) {
    const ext = 'hb:' + c.id;
    const existing = byExt.get(ext);
    if (existing) {
      // migrate the icon if the catalogue moved (e.g. github → self-hosted)
      if (existing.image !== c.image) { store.update('games', existing.id, { image: c.image }); updated += 1; }
      continue;
    }
    const legacy = byName.get(norm(c.provider) + '|' + norm(c.name));
    if (legacy) {
      // claim the legacy record: correct art + category, no duplicate tile
      store.update('games', legacy.id, {
        externalId: ext,
        image: c.image,
        category: legacy.category || c.category,
        provider: legacy.provider || c.provider,
      });
      byExt.set(ext, legacy);
      updated += 1;
      continue;
    }
    if (imported >= limit) continue;
    const rec = store.insert('games', {
      externalId: ext,
      name: c.name,
      provider: c.provider,
      category: c.category,
      image: c.image,
      icon: '🎰',
      color: '',
      badge: '',
      launchUrl: '',
      enabled: true,
      order: order++,
      source: 'heibao',
    });
    byExt.set(ext, rec);
    byName.set(norm(c.provider) + '|' + norm(c.name), rec);
    imported += 1;
  }
  // Dedupe sweep: legacy records (old low-res showcase art) that duplicate an
  // imported heibao game are disabled so only the high-res tile shows.
  let deduped = 0;
  const hbKeys = new Map(); // normKey -> hb game id
  for (const g of store.list('games')) {
    if (typeof g.externalId === 'string' && g.externalId.startsWith('hb:')) {
      hbKeys.set(norm(g.provider) + '|' + norm(g.name), g.id);
    }
  }
  for (const g of store.list('games')) {
    if (typeof g.externalId === 'string' && g.externalId.startsWith('hb:')) continue;
    const key = norm(g.provider) + '|' + norm(g.name);
    if (hbKeys.has(key) && g.enabled !== false) {
      store.update('games', g.id, { enabled: false, note: 'duplicate of heibao catalogue entry' });
      deduped += 1;
    }
  }

  const remaining = list.filter((c) => !byExt.has('hb:' + c.id)).length;
  return { imported, updated, deduped, remaining, total: list.length };
}

module.exports = { importMissing };
