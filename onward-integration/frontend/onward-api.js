/*
 * onward-api.js  —  drop-in connector for onward_com.html (customer frontend)
 * ---------------------------------------------------------------------------
 * Add ONE line just before </body> in onward_com.html, AFTER the main script:
 *
 *     <script>window.ONWARD_API_BASE='http://localhost:4000/api';</script>
 *     <script src="onward-api.js"></script>
 *
 * What it does, on page load:
 *   - GET /api/games?enabled=1      -> rebuilds the Popular, Slots and Fish grids
 *   - GET /api/banners?active=1     -> rebuilds the promo banner carousel
 *   - GET /api/promotions?active=1  -> rebuilds the home promotions section
 * Changes saved in the admin appear here on the next refresh — no HTML edits.
 *
 * Safety: if the API is unreachable, it leaves the page's existing (hardcoded)
 * content untouched, so the site still works offline. A grid is only replaced
 * when the API returns at least one item for it.
 */
(function () {
  'use strict';

  var API = (window.ONWARD_API_BASE || 'http://localhost:4000/api').replace(/\/$/, '');

  // category coming from the API -> the `cat` value the frontend cards expect
  var CAT_MAP = { slots: 'slots', live: 'live', sports: 'sports', fishing: 'fish', crash: 'crash' };

  // Remembers each game's launch URL so we can open it on click.
  var LAUNCH = {};

  function get(path) {
    return fetch(API + path, { headers: { Accept: 'application/json' } }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  // Map an API game record to the shape renderGameCard() already understands.
  function toCard(g) {
    LAUNCH[g.id] = g.launchUrl || '';
    return {
      id: g.id,
      name: g.name,
      provider: g.provider,
      icon: g.icon || '🎰',
      cat: CAT_MAP[g.category] || g.category,
      badge: g.badge || '',
      color: g.color || '',
      img: g.image || '',
    };
  }

  // Reuse the page's own card template when present, else a minimal fallback.
  function gameCardHtml(card) {
    if (typeof window.renderGameCard === 'function') return window.renderGameCard(card);
    var thumb = card.img
      ? '<img src="' + card.img + '" alt="' + card.name + '" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0">'
      : '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:52px">' + card.icon + '</div>';
    return (
      '<div class="game-card" onclick="onwardLaunch(\'' + card.id + '\')">' + thumb +
      '<div class="game-overlay"><div class="game-provider">' + card.provider +
      '</div><div class="game-name">' + card.name + '</div></div></div>'
    );
  }

  function fillGrid(id, cards) {
    var grid = document.getElementById(id);
    if (!grid || !cards.length) return false;
    grid.innerHTML = cards.map(gameCardHtml).join('');
    return true;
  }

  // ---- launch a game: ask the API for a fresh URL, then fall back ----
  var originalLaunch = window.launchGame;
  window.onwardLaunch = function (id) {
    // 1) try a live launch URL from the aggregator/launch endpoint
    get('/aggregator/launch/' + id + '?player=guest')
      .then(function (r) {
        if (r && r.url) window.open(r.url, '_blank', 'noopener');
        else throw new Error('no url');
      })
      .catch(function () {
        // 2) fall back to the URL stored on the game
        if (LAUNCH[id]) window.open(LAUNCH[id], '_blank', 'noopener');
        // 3) last resort: the page's original demo modal
        else if (typeof originalLaunch === 'function') originalLaunch(id);
      });
  };
  // The page's cards call launchGame(id,...). Route those through us too.
  window.launchGame = function (id) {
    if (LAUNCH[id] !== undefined) return window.onwardLaunch(id);
    if (typeof originalLaunch === 'function') return originalLaunch.apply(this, arguments);
  };

  // ---- registration: submit the frontend register form to the API ----
  // The register panel inputs have no ids, so read them positionally.
  // Order in #panel-register: First, Last, Username, Email, Phone, Password, Referral.
  function readRegister() {
    var panel = document.getElementById('panel-register');
    if (!panel) return null;
    var ins = panel.querySelectorAll('.form-group input');
    if (ins.length < 6) return null;
    return {
      firstName: (ins[0] && ins[0].value || '').trim(),
      lastName: (ins[1] && ins[1].value || '').trim(),
      username: (ins[2] && ins[2].value || '').trim(),
      email: (ins[3] && ins[3].value || '').trim(),
      phone: (ins[4] && ins[4].value || '').trim(),
      password: ins[5] && ins[5].value || '',
      referralCode: (ins[6] && ins[6].value || '').trim(),
    };
  }

  function setupRegister() {
    var originalRegister = window.doRegister;
    window.doRegister = function () {
      var data = readRegister();
      var proceed = function () { if (typeof originalRegister === 'function') originalRegister(); };
      if (!data) return proceed(); // form not found — keep original behavior
      if (!data.username || !data.email || data.password.length < 6) {
        alert('Please enter a username, a valid email, and a password of at least 6 characters.');
        return;
      }
      fetch(API + '/players/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
        .then(function (r) {
          return r.json().then(function (body) {
            if (!r.ok) throw new Error(body.error || 'Registration failed');
            return body;
          });
        })
        .then(function () {
          console.log('[onward-api] registration saved for', data.username);
          proceed(); // keep the page's existing post-register UI
        })
        .catch(function (e) {
          // API down or rejected (e.g. duplicate). Tell the user; don't fake success.
          alert(e.message || 'Registration failed');
          console.warn('[onward-api] registration error:', e.message);
        });
    };
  }

  function loadGames() {
    return get('/games?enabled=1').then(function (games) {
      var cards = games.map(toCard);
      var hot = cards.filter(function (c) { return c.badge === 'hot' || c.badge === 'jackpot'; });
      fillGrid('game-grid', hot.length ? hot : cards.slice(0, 21)); // Popular
      var slots = cards.filter(function (c) { return c.cat === 'slots'; });
      if (fillGrid('slots-grid', slots)) {
        var sc = document.getElementById('slot-count');
        if (sc) sc.textContent = slots.length + ' Games';
        var more = document.getElementById('slots-load-more-wrap');
        if (more) more.style.display = 'none'; // all rendered at once
      }
      fillGrid('fish-grid', cards.filter(function (c) { return c.cat === 'fish'; }));
    });
  }

  function loadBanners() {
    return get('/banners?active=1').then(function (banners) {
      var el = document.getElementById('legox-banner-autoscroll-1010') ||
               document.querySelector('[id*="banner-autoscroll"]');
      if (!el || !banners.length) return;
      el.innerHTML = banners
        .map(function (b) {
          var inner =
            '<img src="' + b.image + '" alt="' + (b.title || '') +
            '" style="width:100%;height:100%;object-fit:cover;display:block">' +
            (b.title
              ? '<div style="position:absolute;left:18px;bottom:16px;text-shadow:0 2px 8px #000">' +
                '<div style="font-size:20px;font-weight:700">' + b.title + '</div>' +
                (b.subtitle ? '<div style="font-size:13px;opacity:.85">' + b.subtitle + '</div>' : '') +
                '</div>'
              : '');
          var card =
            '<div style="position:relative;min-width:100%;height:180px;border-radius:14px;overflow:hidden;flex:0 0 100%">' +
            inner + '</div>';
          return b.redirectUrl
            ? '<a href="' + b.redirectUrl + '" style="display:block;text-decoration:none;color:#fff">' + card + '</a>'
            : card;
        })
        .join('');
    });
  }

  function promoCardHtml(p) {
    var btn = p.buttonText
      ? '<a href="' + (p.buttonLink || '#') + '" class="btn btn-primary btn-sm" ' +
        'style="margin-top:10px;display:inline-block;padding:8px 16px">' + p.buttonText + '</a>'
      : '';
    var img = p.image
      ? '<img src="' + p.image + '" alt="' + p.title + '" style="width:100%;border-radius:10px;margin-bottom:10px">'
      : '';
    return (
      '<div class="promo-card">' + img +
      '<div class="promo-title">' + p.title + '</div>' +
      '<div class="promo-desc">' + (p.description || '') + '</div>' + btn + '</div>'
    );
  }

  function loadPromotions() {
    return get('/promotions?active=1').then(function (promos) {
      if (!promos.length) return;
      ['promo-grid-home', 'promo-bonus-grid'].forEach(function (id) {
        var grid = document.getElementById(id);
        if (grid) grid.innerHTML = promos.map(promoCardHtml).join('');
      });
    });
  }

  function run() {
    setupRegister();
    // Run after the page's own init() has populated the grids, then override.
    Promise.allSettled([loadGames(), loadBanners(), loadPromotions()]).then(function (res) {
      var failed = res.filter(function (r) { return r.status === 'rejected'; });
      if (failed.length === res.length) {
        console.warn('[onward-api] API unreachable — keeping built-in content.');
      } else {
        console.log('[onward-api] Live content loaded from', API);
      }
    });
  }

  if (document.readyState === 'complete') setTimeout(run, 300);
  else window.addEventListener('load', function () { setTimeout(run, 300); });
})();
