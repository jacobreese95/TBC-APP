/* TBC – admin home button rearrange (order saved for everyone) */
(function () {
  var layoutEditMode = false;
  var layoutOrderBeforeEdit = null;

  function $(id) { return document.getElementById(id); }

  function ensureTileIds() {
    var grid = $('homeGrid');
    if (!grid) return;
    Array.prototype.forEach.call(grid.querySelectorAll('.home-tile'), function (btn) {
      if (btn.getAttribute('data-tile-id')) return;
      var id = btn.id || '';
      var label = ((btn.querySelector('.tile-label') || {}).textContent || '').trim();
      var onclick = btn.getAttribute('onclick') || '';
      if (id === 'btn-upcoming-events' || btn.classList.contains('events-tile')) btn.setAttribute('data-tile-id', 'events');
      else if (id === 'btn-upload' || btn.classList.contains('photos-tile')) btn.setAttribute('data-tile-id', 'photos');
      else if (id === 'btn-calendar') btn.setAttribute('data-tile-id', 'calendar');
      else if (id === 'btn-chats') btn.setAttribute('data-tile-id', 'chats');
      else if (id === 'btn-directory') btn.setAttribute('data-tile-id', 'directory');
      else if (id === 'btn-soulwinning') btn.setAttribute('data-tile-id', 'soulwinning');
      else if (id === 'btn-profile') btn.setAttribute('data-tile-id', 'profile');
      else if (id === 'btn-admin') btn.setAttribute('data-tile-id', 'admin');
      else if (/bible/i.test(onclick) || label === 'Bible') { btn.id = btn.id || 'btn-bible'; btn.setAttribute('data-tile-id', 'bible'); }
      else if (/sermons/i.test(onclick) || label === 'Sermons') { btn.id = btn.id || 'btn-sermons'; btn.setAttribute('data-tile-id', 'sermons'); }
      else if (/give/i.test(onclick) || label === 'Give') { btn.id = btn.id || 'btn-give'; btn.setAttribute('data-tile-id', 'give'); }
      else if (/about/i.test(onclick) || label === 'About') { btn.id = btn.id || 'btn-about'; btn.setAttribute('data-tile-id', 'about'); }
    });
  }

  function ensureControls() {
    Array.prototype.forEach.call(document.querySelectorAll('#homeGrid [data-tile-id]'), function (btn) {
      if (btn.querySelector('.tile-move-controls')) return;
      var tid = btn.getAttribute('data-tile-id');
      var span = document.createElement('span');
      span.className = 'tile-move-controls';
      span.onclick = function (e) { e.stopPropagation(); };
      var up = document.createElement('button');
      up.type = 'button';
      up.textContent = '\u2191';
      up.onclick = function (e) { e.stopPropagation(); moveTile(tid, -1); };
      var down = document.createElement('button');
      down.type = 'button';
      down.textContent = '\u2193';
      down.onclick = function (e) { e.stopPropagation(); moveTile(tid, 1); };
      span.appendChild(up);
      span.appendChild(down);
      btn.insertBefore(span, btn.firstChild);
    });
  }

  function ensureStyles() {
    if ($('home-layout-styles')) return;
    var s = document.createElement('style');
    s.id = 'home-layout-styles';
    s.textContent = [
      '.layout-toolbar{max-width:420px;margin:0 auto 10px;padding:0 4px;display:none;gap:8px;align-items:center;flex-wrap:wrap}',
      '.layout-toolbar.visible{display:flex}',
      '.layout-toolbar button{flex:1;min-width:120px;margin:0;padding:10px 12px;border-radius:12px;border:2px solid #4cb8b9;background:#fff;color:#4cb8b9;font-weight:700;cursor:pointer;font-size:.85rem}',
      '.layout-toolbar button.primary{background:linear-gradient(135deg,#4cb8b9 0%,#7bafdd 100%);color:#fff;border:none}',
      '.layout-hint{width:100%;font-size:.8rem;color:var(--muted,#7a8fac);margin:0}',
      '.home-grid.layout-edit .home-tile{position:relative;outline:2px dashed rgba(76,184,185,.55)}',
      '.tile-move-controls{display:none;position:absolute;top:6px;right:6px;z-index:5;gap:4px}',
      '.home-grid.layout-edit .tile-move-controls{display:flex}',
      '.tile-move-controls button{width:32px;height:32px;border-radius:8px;border:none;background:rgba(0,0,0,.55);color:#fff;font-weight:700;font-size:.85rem;cursor:pointer;padding:0;margin:0;line-height:32px}'
    ].join('');
    document.head.appendChild(s);
  }

  function ensureToolbar() {
    if ($('layoutToolbar')) return;
    var bar = document.createElement('div');
    bar.id = 'layoutToolbar';
    bar.className = 'layout-toolbar';
    bar.innerHTML =
      '<p class="layout-hint" id="layoutHint">Use \u2191 \u2193 on each button to rearrange. Order is saved for everyone.</p>' +
      '<button type="button" id="btnLayoutEdit">Rearrange buttons</button>' +
      '<button type="button" class="primary" id="btnLayoutSave" style="display:none">Save order</button>' +
      '<button type="button" id="btnLayoutCancel" style="display:none">Cancel</button>';
    var title = document.querySelector('.home-title');
    if (title && title.parentNode) title.parentNode.insertBefore(bar, title.nextSibling);
    else if ($('homeGrid') && $('homeGrid').parentElement) {
      var wrap = $('homeGrid').parentElement;
      wrap.parentNode.insertBefore(bar, wrap);
    }
    $('btnLayoutEdit').onclick = toggleLayoutEdit;
    $('btnLayoutSave').onclick = saveHomeLayout;
    $('btnLayoutCancel').onclick = cancelLayoutEdit;
  }

  function getTileElements() {
    var grid = $('homeGrid');
    if (!grid) return [];
    return Array.prototype.slice.call(grid.querySelectorAll('[data-tile-id]'));
  }

  function applyTileOrder(order) {
    var grid = $('homeGrid');
    if (!grid || !order || !order.length) return;
    var map = {};
    getTileElements().forEach(function (el) { map[el.getAttribute('data-tile-id')] = el; });
    order.forEach(function (id) { if (map[id]) grid.appendChild(map[id]); });
    getTileElements().forEach(function (el) {
      var id = el.getAttribute('data-tile-id');
      if (order.indexOf(id) === -1) grid.appendChild(el);
    });
  }

  function readOrderFromDom() {
    return getTileElements().map(function (el) { return el.getAttribute('data-tile-id'); });
  }

  function moveTile(id, dir) {
    if (!layoutEditMode) return;
    var order = readOrderFromDom();
    var i = order.indexOf(id);
    if (i < 0) return;
    var j = i + dir;
    if (j < 0 || j >= order.length) return;
    var tmp = order[i]; order[i] = order[j]; order[j] = tmp;
    applyTileOrder(order);
  }

  function toggleLayoutEdit() {
    if (layoutEditMode) return;
    layoutEditMode = true;
    layoutOrderBeforeEdit = readOrderFromDom();
    $('homeGrid').classList.add('layout-edit');
    $('btnLayoutEdit').style.display = 'none';
    $('btnLayoutSave').style.display = 'block';
    $('btnLayoutCancel').style.display = 'block';
    $('layoutHint').textContent = 'Editing: use \u2191 \u2193 on each button, then Save order.';
  }

  function cancelLayoutEdit() {
    layoutEditMode = false;
    if ($('homeGrid')) $('homeGrid').classList.remove('layout-edit');
    if ($('btnLayoutEdit')) $('btnLayoutEdit').style.display = 'block';
    if ($('btnLayoutSave')) $('btnLayoutSave').style.display = 'none';
    if ($('btnLayoutCancel')) $('btnLayoutCancel').style.display = 'none';
    if ($('layoutHint')) $('layoutHint').textContent = 'Use \u2191 \u2193 on each button to rearrange. Order is saved for everyone.';
    if (layoutOrderBeforeEdit) applyTileOrder(layoutOrderBeforeEdit);
  }

  async function saveHomeLayout() {
    if (!layoutEditMode) return;
    var order = readOrderFromDom();
    try {
      await db.collection('settings').doc('homeLayout').set({
        tileOrder: order,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedByUid: auth.currentUser ? auth.currentUser.uid : null
      }, { merge: true });
      layoutEditMode = false;
      layoutOrderBeforeEdit = order;
      $('homeGrid').classList.remove('layout-edit');
      $('btnLayoutEdit').style.display = 'block';
      $('btnLayoutSave').style.display = 'none';
      $('btnLayoutCancel').style.display = 'none';
      $('layoutHint').textContent = 'Saved! Everyone will see this button order.';
      setTimeout(function () {
        if ($('layoutHint')) $('layoutHint').textContent = 'Use \u2191 \u2193 on each button to rearrange. Order is saved for everyone.';
      }, 2500);
    } catch (e) {
      alert('Could not save layout. Add Firestore rules for settings (admin write).\n' + (e.message || e));
    }
  }

  async function loadHomeLayout() {
    try {
      var snap = await db.collection('settings').doc('homeLayout').get();
      if (snap.exists) {
        var d = snap.data() || {};
        if (d.tileOrder && d.tileOrder.length) applyTileOrder(d.tileOrder);
      }
    } catch (e) { console.warn('home layout', e); }
  }

  function initDomHelpers() {
    ensureStyles();
    ensureTileIds();
    ensureControls();
    ensureToolbar();
  }

  function setAdminMode(isAdmin) {
    initDomHelpers();
    var tb = $('layoutToolbar');
    if (!tb) return;
    if (isAdmin) tb.classList.add('visible');
    else {
      tb.classList.remove('visible');
      if (layoutEditMode) cancelLayoutEdit();
    }
  }

  window.tbcHomeLayout = { init: initDomHelpers, load: loadHomeLayout, setAdmin: setAdminMode };

  function boot() {
    if (!$('homeGrid')) return;
    initDomHelpers();
    if (typeof auth === 'undefined') return;
    auth.onAuthStateChanged(function (user) {
      if (!user) { setAdminMode(false); return; }
      setTimeout(async function () {
        initDomHelpers();
        try {
          var profile = null;
          if (typeof ensureUserProfile === 'function') profile = await ensureUserProfile(user);
          setAdminMode(profile && profile.role === 'admin');
          if (profile && profile.approved) await loadHomeLayout();
        } catch (e) {}
      }, 400);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
  setTimeout(boot, 300);
})();
