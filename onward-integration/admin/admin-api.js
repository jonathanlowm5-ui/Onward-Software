/*
 * admin-api.js  —  drop-in connector for Onward_Admin.html (admin panel)
 * ---------------------------------------------------------------------------
 * Add ONE line just before </body> in Onward_Admin.html:
 *
 *     <script>window.ONWARD_API_BASE='http://localhost:4000/api';</script>
 *     <script src="admin-api.js"></script>
 *
 * It adds an "⚙ API" button to the top bar that opens two panels:
 *   1) API Configuration  -> Settings the requirement asks for
 *        (Base URL, API Key, API Secret, Environment: development/production)
 *   2) Content Manager     -> Games / Banners / Promotions CRUD with image
 *        upload, enable/disable, sort/display order. Everything saved here is
 *        what the customer frontend (via onward-api.js) reads and displays.
 *
 * It also exposes window.OnwardAPI so your existing admin save-functions can
 * persist to the backend in 1–2 lines (see admin/INTEGRATION.md).
 */
(function () {
  'use strict';

  var API = (window.ONWARD_API_BASE || 'http://localhost:4000/api').replace(/\/$/, '');
  var TOKEN_KEY = 'onward_admin_token';
  var $ = function (s, r) { return (r || document).querySelector(s); };

  function token() { return localStorage.getItem(TOKEN_KEY) || ''; }
  function setToken(t) { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); }
  function notify(msg) { (typeof window.toast === 'function' ? window.toast : console.log)(msg); }

  // ---------------------------------------------------------------- HTTP ----
  function req(method, path, body, isForm) {
    var headers = {};
    if (token()) headers.Authorization = 'Bearer ' + token();
    var opts = { method: method, headers: headers };
    if (body !== undefined) {
      if (isForm) opts.body = body;
      else { headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    }
    return fetch(API + path, opts).then(function (r) {
      if (r.status === 401) { setToken(''); throw new Error('Please sign in to the API'); }
      return r.json().then(function (data) {
        if (!r.ok) throw new Error(data.error || 'Request failed');
        return data;
      });
    });
  }

  // ------------------------------------------------------------- CLIENT ----
  function resource(name) {
    var base = '/' + name;
    return {
      list: function (q) { return req('GET', base + (q || '')); },
      create: function (d) { return req('POST', base, d); },
      update: function (id, d) { return req('PUT', base + '/' + id, d); },
      remove: function (id) { return req('DELETE', base + '/' + id); },
      toggle: function (id) { return req('PATCH', base + '/' + id + '/toggle'); },
    };
  }

  var OnwardAPI = {
    base: API,
    auth: {
      login: function (username, password) {
        return req('POST', '/auth/login', { username: username, password: password }).then(function (d) {
          setToken(d.token); return d;
        });
      },
      logout: function () { setToken(''); },
      isAuthed: function () { return !!token(); },
    },
    games: resource('games'),
    banners: resource('banners'),
    promotions: resource('promotions'),
    players: resource('players'),
    settings: {
      get: function () { return req('GET', '/settings'); },
      save: function (d) { return req('PUT', '/settings', d); },
    },
    aggregator: {
      status: function () { return req('GET', '/aggregator/status'); },
      import: function () { return req('POST', '/aggregator/import'); },
    },
    upload: function (file) {
      var fd = new FormData(); fd.append('file', file);
      return req('POST', '/upload', fd, true);
    },
  };
  window.OnwardAPI = OnwardAPI;

  // ------------------------------------------------------------- STYLES ----
  function injectStyles() {
    if ($('#oapi-styles')) return;
    var css = document.createElement('style');
    css.id = 'oapi-styles';
    css.textContent = [
      '.oapi-ov{position:fixed;inset:0;z-index:2000;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.6);padding:18px}',
      '.oapi-ov.show{display:flex}',
      '.oapi-card{background:var(--panel,#101729);border:1px solid var(--border,#22304f);border-radius:var(--radius,13px);width:100%;max-width:860px;max-height:90vh;overflow:auto;box-shadow:var(--shadow,0 8px 24px rgba(0,0,0,.35))}',
      '.oapi-head{display:flex;align-items:center;gap:10px;padding:16px 18px;border-bottom:1px solid var(--border,#22304f)}',
      '.oapi-head .t{font-weight:700;font-size:1.05rem}',
      '.oapi-x{margin-left:auto;background:none;border:none;color:var(--muted,#8b97b1);font-size:1.1rem;cursor:pointer}',
      '.oapi-body{padding:18px}',
      '.oapi-tabs{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap}',
      '.oapi-tab{padding:8px 14px;border-radius:10px;border:1px solid var(--border,#22304f);background:var(--panel-2,#151e33);color:var(--muted,#8b97b1);cursor:pointer;font-size:.85rem}',
      '.oapi-tab.active{color:#0a0f1d;background:var(--gold,#f4b223);border-color:var(--gold,#f4b223);font-weight:700}',
      '.oapi-fld{margin-bottom:12px}',
      '.oapi-fld label{display:block;font-size:.78rem;color:var(--muted,#8b97b1);margin-bottom:5px}',
      '.oapi-fld input,.oapi-fld select,.oapi-fld textarea{width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--border,#22304f);background:var(--bg,#0a0f1d);color:var(--text,#e8edf7);font-family:inherit;font-size:.9rem}',
      '.oapi-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}',
      '.oapi-row{display:flex;gap:10px;align-items:center}',
      '.oapi-btn{padding:9px 16px;border-radius:10px;border:none;font-weight:700;cursor:pointer;font-size:.85rem}',
      '.oapi-btn.primary{background:var(--gold,#f4b223);color:#0a0f1d}',
      '.oapi-btn.ghost{background:var(--panel-2,#151e33);color:var(--text,#e8edf7);border:1px solid var(--border,#22304f)}',
      '.oapi-btn.danger{background:var(--red,#ff4d5e);color:#fff}',
      '.oapi-list{border:1px solid var(--border,#22304f);border-radius:10px;overflow:hidden}',
      '.oapi-item{display:flex;align-items:center;gap:12px;padding:10px 12px;border-bottom:1px solid var(--border,#22304f)}',
      '.oapi-item:last-child{border-bottom:none}',
      '.oapi-item img{width:46px;height:46px;border-radius:8px;object-fit:cover;background:var(--bg,#0a0f1d)}',
      '.oapi-item .meta{flex:1;min-width:0}',
      '.oapi-item .meta .nm{font-weight:600;font-size:.9rem}',
      '.oapi-item .meta .sub{font-size:.75rem;color:var(--muted,#8b97b1)}',
      '.oapi-pill{font-size:.68rem;padding:2px 8px;border-radius:20px;border:1px solid var(--border,#22304f)}',
      '.oapi-pill.on{color:var(--green,#2ecc71);border-color:var(--green,#2ecc71)}',
      '.oapi-pill.off{color:var(--muted,#8b97b1)}',
      '.oapi-launch{background:var(--panel-2,#151e33);border:1px solid var(--border,#22304f);color:var(--gold,#f4b223);border-radius:10px;padding:7px 12px;font-weight:700;cursor:pointer;font-size:.82rem}',
      '.oapi-hint{font-size:.75rem;color:var(--muted,#8b97b1);margin-top:6px}',
    ].join('\n');
    document.head.appendChild(css);
  }

  // ------------------------------------------------------------- OVERLAY ----
  function overlay(title, bodyEl) {
    var ov = document.createElement('div');
    ov.className = 'oapi-ov';
    var card = document.createElement('div');
    card.className = 'oapi-card';
    var head = document.createElement('div');
    head.className = 'oapi-head';
    head.innerHTML = '<span class="t">' + title + '</span>';
    var x = document.createElement('button');
    x.className = 'oapi-x'; x.textContent = '✕';
    x.onclick = function () { ov.remove(); };
    head.appendChild(x);
    var body = document.createElement('div');
    body.className = 'oapi-body';
    body.appendChild(bodyEl);
    card.appendChild(head); card.appendChild(body); ov.appendChild(card);
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    document.body.appendChild(ov);
    requestAnimationFrame(function () { ov.classList.add('show'); });
    return ov;
  }

  // require auth, showing an inline login form if needed
  function ensureAuth(container, onReady) {
    if (OnwardAPI.auth.isAuthed()) return onReady();
    container.innerHTML =
      '<div class="oapi-fld"><label>Username</label><input id="oapiU" value="admin"></div>' +
      '<div class="oapi-fld"><label>Password</label><input id="oapiP" type="password" value=""></div>' +
      '<button class="oapi-btn primary" id="oapiLogin">Sign in</button>' +
      '<div class="oapi-hint">Default demo login: admin / admin123</div>';
    $('#oapiLogin', container).onclick = function () {
      OnwardAPI.auth
        .login($('#oapiU', container).value, $('#oapiP', container).value)
        .then(function () { notify('Connected to API'); onReady(); })
        .catch(function (e) { notify(e.message); });
    };
  }

  // ------------------------------------------------- API CONFIGURATION ----
  function openConfig() {
    var body = document.createElement('div');
    overlay('⚙ API Configuration', body);
    ensureAuth(body, function () {
      OnwardAPI.settings.get().then(function (s) {
        body.innerHTML =
          '<div class="oapi-fld"><label>API Base URL</label><input id="cfgBase" placeholder="http://localhost:4000/api" value="' + (s.baseUrl || '') + '"></div>' +
          '<div class="oapi-fld"><label>API Key</label><input id="cfgKey" placeholder="pk_live_xxx" value="' + (s.apiKey || '') + '"></div>' +
          '<div class="oapi-fld"><label>API Secret ' + (s.apiSecretSet ? '(stored — leave blank to keep)' : '') + '</label><input id="cfgSecret" type="password" placeholder="sk_live_xxx"></div>' +
          '<div class="oapi-fld"><label>Environment</label><select id="cfgEnv">' +
            '<option value="development"' + (s.environment === 'development' ? ' selected' : '') + '>Development</option>' +
            '<option value="production"' + (s.environment === 'production' ? ' selected' : '') + '>Production</option>' +
          '</select></div>' +
          '<div class="oapi-row" style="margin-top:8px"><button class="oapi-btn primary" id="cfgSave">Save configuration</button>' +
          '<button class="oapi-btn ghost" id="cfgManage">Open Content Manager</button></div>' +
          '<div class="oapi-hint">The frontend reads from this base URL. Set the same value in onward-api.js (window.ONWARD_API_BASE).</div>';
        $('#cfgSave', body).onclick = function () {
          OnwardAPI.settings
            .save({
              baseUrl: $('#cfgBase', body).value,
              apiKey: $('#cfgKey', body).value,
              apiSecret: $('#cfgSecret', body).value,
              environment: $('#cfgEnv', body).value,
            })
            .then(function () { notify('API configuration saved'); })
            .catch(function (e) { notify(e.message); });
        };
        $('#cfgManage', body).onclick = function () { openManager(); };
      }).catch(function (e) { notify(e.message); });
    });
  }

  // -------------------------------------------------- CONTENT MANAGER ----
  var TABS = [
    { key: 'games', label: 'Games' },
    { key: 'banners', label: 'Banners' },
    { key: 'promotions', label: 'Promotions' },
    { key: 'players', label: 'Players' },
  ];

  // field definitions per resource -> drives the add/edit form
  var FIELDS = {
    games: [
      { k: 'name', l: 'Game Name', t: 'text', req: true },
      { k: 'provider', l: 'Provider Name', t: 'text' },
      { k: 'category', l: 'Category', t: 'select', opts: [['slots', 'Slots'], ['live', 'Live Casino'], ['sports', 'Sports'], ['fishing', 'Fishing'], ['crash', 'Crash']] },
      { k: 'launchUrl', l: 'Game URL / Launch URL', t: 'text' },
      { k: 'badge', l: 'Badge', t: 'select', opts: [['', 'None'], ['hot', 'Hot'], ['new', 'New'], ['jackpot', 'Jackpot']] },
      { k: 'order', l: 'Display Order', t: 'number' },
      { k: 'image', l: 'Game Image', t: 'image' },
      { k: 'enabled', l: 'Enabled', t: 'checkbox' },
    ],
    banners: [
      { k: 'title', l: 'Banner Title', t: 'text' },
      { k: 'subtitle', l: 'Banner Subtitle', t: 'text' },
      { k: 'redirectUrl', l: 'Redirect URL', t: 'text' },
      { k: 'sortOrder', l: 'Sort Order', t: 'number' },
      { k: 'image', l: 'Banner Image', t: 'image', req: true },
      { k: 'active', l: 'Active', t: 'checkbox' },
    ],
    promotions: [
      { k: 'title', l: 'Promotion Title', t: 'text', req: true },
      { k: 'description', l: 'Description', t: 'textarea' },
      { k: 'startDate', l: 'Start Date', t: 'date' },
      { k: 'endDate', l: 'End Date', t: 'date' },
      { k: 'buttonText', l: 'Button Text', t: 'text' },
      { k: 'buttonLink', l: 'Button Link', t: 'text' },
      { k: 'image', l: 'Promotion Image', t: 'image' },
      { k: 'status', l: 'Status', t: 'select', opts: [['active', 'Active'], ['inactive', 'Inactive']] },
    ],
  };

  function openManager() {
    document.querySelectorAll('.oapi-ov').forEach(function (o) { o.remove(); });
    var body = document.createElement('div');
    overlay('🎮 Content Manager', body);
    ensureAuth(body, function () {
      body.innerHTML = '<div class="oapi-tabs"></div><div class="oapi-pane"></div>';
      var tabsEl = $('.oapi-tabs', body), pane = $('.oapi-pane', body);
      TABS.forEach(function (t, i) {
        var b = document.createElement('button');
        b.className = 'oapi-tab' + (i === 0 ? ' active' : '');
        b.textContent = t.label;
        b.onclick = function () {
          tabsEl.querySelectorAll('.oapi-tab').forEach(function (x) { x.classList.remove('active'); });
          b.classList.add('active');
          renderList(t.key, pane);
        };
        tabsEl.appendChild(b);
      });
      renderList('games', pane);
    });
  }

  function subline(key, r) {
    if (key === 'games') return [r.provider, r.category, r.launchUrl].filter(Boolean).join(' · ');
    if (key === 'banners') return r.subtitle || r.redirectUrl || '';
    if (key === 'players') {
      var when = r.createdAt ? new Date(r.createdAt).toLocaleString() : '';
      return [r.email, r.phone, when].filter(Boolean).join(' · ');
    }
    return [r.status, r.startDate && r.endDate ? r.startDate + ' → ' + r.endDate : ''].filter(Boolean).join(' · ');
  }
  function isOn(key, r) {
    if (key === 'promotions') return r.status === 'active';
    if (key === 'players') return r.status !== 'suspended';
    if (key === 'banners') return r.active;
    return r.enabled;
  }
  function titleOf(r) {
    var full = [r.firstName, r.lastName].filter(Boolean).join(' ');
    return r.name || r.title || r.username || full || r.email || '(untitled)';
  }

  function renderList(key, pane) {
    var importBtn = key === 'games'
      ? '<button class="oapi-btn ghost" id="oapiImport" title="Pull catalog from the configured aggregator">⤓ Import</button>'
      : '';
    var addBtn = key === 'players' ? '' : '<button class="oapi-btn primary" id="oapiAdd">+ Add</button>';
    pane.innerHTML = '<div class="oapi-row" style="justify-content:space-between;margin-bottom:12px">' +
      '<div style="font-weight:700">' + key.charAt(0).toUpperCase() + key.slice(1) +
      (key === 'players' ? ' <span style="font-weight:400;color:var(--muted,#8b97b1);font-size:.8rem">(frontend registrations)</span>' : '') +
      '</div>' +
      '<div class="oapi-row">' + importBtn + addBtn + '</div></div>' +
      '<div class="oapi-list" id="oapiList">Loading…</div>';
    var addEl = $('#oapiAdd', pane);
    if (addEl) addEl.onclick = function () { renderForm(key, pane, null); };
    var imp = $('#oapiImport', pane);
    if (imp) imp.onclick = function () {
      imp.disabled = true; imp.textContent = 'Importing…';
      OnwardAPI.aggregator.import()
        .then(function (r) { notify('Imported ' + r.imported + ', updated ' + r.updated + ' from ' + r.provider); renderList(key, pane); })
        .catch(function (e) { notify(e.message); imp.disabled = false; imp.textContent = '⤓ Import'; });
    };
    OnwardAPI[key].list().then(function (rows) {
      var list = $('#oapiList', pane);
      if (!rows.length) {
        list.innerHTML = '<div class="oapi-item">' +
          (key === 'players' ? 'No registrations yet — sign up on the frontend to see one here.' : 'Nothing yet — click “+ Add”.') +
          '</div>';
        return;
      }
      list.innerHTML = '';
      rows.forEach(function (r) {
        var on = isOn(key, r);
        var canEdit = !!FIELDS[key];
        var pillText = key === 'players' ? (on ? 'Active' : 'Suspended') : (on ? 'On' : 'Off');
        var tglText = key === 'players' ? (on ? 'Suspend' : 'Activate') : (on ? 'Disable' : 'Enable');
        var item = document.createElement('div');
        item.className = 'oapi-item';
        item.innerHTML =
          (r.image ? '<img src="' + r.image + '">' : '<img alt="">') +
          '<div class="meta"><div class="nm">' + titleOf(r) + '</div><div class="sub">' + subline(key, r) + '</div></div>' +
          '<span class="oapi-pill ' + (on ? 'on' : 'off') + '">' + pillText + '</span>' +
          (canEdit ? '<button class="oapi-btn ghost oapi-edit">Edit</button>' : '') +
          '<button class="oapi-btn ghost oapi-tgl">' + tglText + '</button>' +
          '<button class="oapi-btn danger oapi-del">✕</button>';
        if (canEdit) $('.oapi-edit', item).onclick = function () { renderForm(key, pane, r); };
        $('.oapi-tgl', item).onclick = function () {
          OnwardAPI[key].toggle(r.id).then(function () { renderList(key, pane); }).catch(function (e) { notify(e.message); });
        };
        $('.oapi-del', item).onclick = function () {
          if (!confirm('Delete “' + titleOf(r) + '”?')) return;
          OnwardAPI[key].remove(r.id).then(function () { renderList(key, pane); }).catch(function (e) { notify(e.message); });
        };
        list.appendChild(item);
      });
    }).catch(function (e) { $('#oapiList', pane).innerHTML = '<div class="oapi-item">' + e.message + '</div>'; });
  }

  function renderForm(key, pane, record) {
    var editing = !!record;
    var data = Object.assign({}, record);
    pane.innerHTML = '<div style="font-weight:700;margin-bottom:12px">' + (editing ? 'Edit' : 'Add') + ' ' + key.slice(0, -1) + '</div><div id="oapiForm"></div>';
    var form = $('#oapiForm', pane);
    FIELDS[key].forEach(function (f) {
      var wrap = document.createElement('div');
      wrap.className = 'oapi-fld';
      var val = data[f.k];
      if (f.t === 'checkbox') {
        var checked = val === undefined ? true : !!val;
        wrap.innerHTML = '<label class="oapi-row"><input type="checkbox" id="f_' + f.k + '" ' + (checked ? 'checked' : '') + ' style="width:auto"> ' + f.l + '</label>';
      } else if (f.t === 'select') {
        wrap.innerHTML = '<label>' + f.l + '</label><select id="f_' + f.k + '">' +
          f.opts.map(function (o) { return '<option value="' + o[0] + '"' + (String(val || (f.k === 'status' ? 'active' : '')) === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>';
      } else if (f.t === 'textarea') {
        wrap.innerHTML = '<label>' + f.l + '</label><textarea id="f_' + f.k + '" rows="3">' + (val || '') + '</textarea>';
      } else if (f.t === 'image') {
        wrap.innerHTML = '<label>' + f.l + '</label>' +
          '<div class="oapi-row"><input id="f_' + f.k + '" placeholder="Image URL or upload →" value="' + (val || '') + '">' +
          '<input type="file" id="file_' + f.k + '" accept="image/*" style="width:auto"></div>' +
          (val ? '<img src="' + val + '" style="margin-top:8px;max-height:80px;border-radius:8px">' : '');
      } else {
        wrap.innerHTML = '<label>' + f.l + '</label><input type="' + f.t + '" id="f_' + f.k + '" value="' + (val == null ? '' : val) + '">';
      }
      form.appendChild(wrap);
      if (f.t === 'image') {
        $('#file_' + f.k, form).onchange = function (e) {
          var file = e.target.files[0]; if (!file) return;
          notify('Uploading image…');
          OnwardAPI.upload(file).then(function (res) { $('#f_' + f.k, form).value = res.url; notify('Image uploaded'); })
            .catch(function (err) { notify(err.message); });
        };
      }
    });
    var actions = document.createElement('div');
    actions.className = 'oapi-row';
    actions.style.marginTop = '8px';
    actions.innerHTML = '<button class="oapi-btn primary" id="oapiSave">' + (editing ? 'Save changes' : 'Create') + '</button>' +
      '<button class="oapi-btn ghost" id="oapiBack">Back to list</button>';
    form.appendChild(actions);
    $('#oapiBack', form).onclick = function () { renderList(key, pane); };
    $('#oapiSave', form).onclick = function () {
      var payload = {};
      FIELDS[key].forEach(function (f) {
        var el = $('#f_' + f.k, form);
        if (!el) return;
        payload[f.k] = f.t === 'checkbox' ? el.checked : f.t === 'number' ? Number(el.value) : el.value;
      });
      var op = editing ? OnwardAPI[key].update(record.id, payload) : OnwardAPI[key].create(payload);
      op.then(function () { notify(editing ? 'Saved' : 'Created'); renderList(key, pane); }).catch(function (e) { notify(e.message); });
    };
  }

  // ------------------------------------------------------------ LAUNCHER ----
  function injectLauncher() {
    if ($('#oapiLauncher')) return;
    var btn = document.createElement('button');
    btn.id = 'oapiLauncher';
    btn.className = 'oapi-launch';
    btn.textContent = '⚙ API';
    btn.title = 'API Configuration & Content Manager';
    btn.onclick = openConfig;
    var tbRight = document.querySelector('.tb-right') || document.querySelector('.topbar') || document.body;
    if (tbRight.classList && tbRight.classList.contains('tb-right')) tbRight.insertBefore(btn, tbRight.firstChild);
    else { btn.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:1900'; document.body.appendChild(btn); }
  }

  function boot() { injectStyles(); injectLauncher(); }
  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
