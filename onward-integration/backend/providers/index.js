/*
 * providers/index.js — game-aggregator provider selector.
 *
 * A "provider" is any upstream game aggregator (e.g. a casino content
 * aggregator). Every provider implements exactly two async functions:
 *
 *   listGames(config)                  -> [{ externalId, name, provider,
 *                                            category, image, badge }]
 *   getLaunchUrl(config, ctx)          -> "https://...real launch url..."
 *        ctx = { game, playerId, mode } ; mode = 'real' | 'demo'
 *
 * `config` is the admin's API Configuration (baseUrl, apiKey, apiSecret,
 * environment) from the settings store, so the "Settings -> API Configuration"
 * page is what actually drives the upstream connection.
 *
 *   AGGREGATOR=mock     (default) -> providers/mock.js     (works offline)
 *   AGGREGATOR=generic            -> providers/generic.js  (your real provider)
 */
const which = (process.env.AGGREGATOR || 'mock').toLowerCase();
module.exports = which === 'generic' ? require('./generic') : require('./mock');
module.exports.name = which;
