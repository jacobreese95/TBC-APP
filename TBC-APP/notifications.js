/* TBC App – global notification bell (prayer, schedule, leader responses) */
(function () {
  if (window.__tbcNotifInit) return;
  window.__tbcNotifInit = true;

  var ALL_ROOMS = ['Whole Church', 'Music Ministry', 'Sentry', 'Nursery', 'Media'];
  var SEEN_KEY = 'tbc-notif-seen';
  var pollTimer = null;

  function getPrefix() {
    var path = (window.location.pathname || '').toLowerCase();
    if (path.indexOf('/bible/') === -1) return '';
    var after = path.split('/bible/')[1] || '';
    var parts = after.split('/').filter(function (p) {
      return p && p.indexOf('.') === -1;
    });
    return '../'.repeat(1 + parts.length);
  }

  function loadSeen() {
    try {
      return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}') || {};
    } catch (e) {
      return {};
    }
  }

  function saveSeen(seen) {
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
    } catch (e) {}
  }

  function markSeen(id) {
    var seen = loadSeen();
    seen[id] = Date.now();
    var keys = Object.keys(seen);
    if (keys.length > 200) {
      keys.sort(function (a, b) { return seen[a] - seen[b]; });
      keys.slice(0, keys.length - 200).forEach(function (k) { delete seen[k]; });
    }
    saveSeen(seen);
  }

  function isSeen(id) {
    return !!loadSeen()[id];
  }

  function injectUI() {
    if (document.getElementById('notif-bell')) return;
    if (!document.body) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'notif-bell';
    btn.className = 'notif-bell';
    btn.setAttribute('aria-label', 'Notifications');
    btn.title = 'Notifications';
    btn.innerHTML = '<span class="notif-bell-icon" aria-hidden="true">🔔</span><span class="notif-badge" id="notif-badge" style="display:none">0</span>';
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      togglePanel();
    });
    document.body.appendChild(btn);

    var panel = document.createElement('div');
    panel.id = 'notif-panel';
    panel.className = 'notif-panel';
    panel.innerHTML =
      '<div class="notif-panel-header">' +
      '<strong>Alerts</strong>' +
      '<button type="button" class="notif-mark-all" id="notif-mark-all">Mark all read</button>' +
      '</div>' +
      '<div class="notif-panel-list" id="notif-list"><div class="notif-empty">Loading…</div></div>';
    document.body.appendChild(panel);

    document.getElementById('notif-mark-all').addEventListener('click', function (e) {
      e.stopPropagation();
      markAllRead();
    });

    document.addEventListener('click', function (e) {
      var p = document.getElementById('notif-panel');
      var b = document.getElementById('notif-bell');
      if (!p || !p.classList.contains('open')) return;
      if (p.contains(e.target) || (b && b.contains(e.target))) return;
      p.classList.remove('open');
    });
  }

  function togglePanel() {
    var p = document.getElementById('notif-panel');
    if (!p) return;
    p.classList.toggle('open');
    if (p.classList.contains('open')) {
      refreshNotifications(true);
    }
  }

  function setBadge(n) {
    var badge = document.getElementById('notif-badge');
    if (!badge) return;
    if (n > 0) {
      badge.style.display = 'flex';
      badge.textContent = n > 99 ? '99+' : String(n);
    } else {
      badge.style.display = 'none';
    }
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatWhen(ts) {
    if (!ts) return '';
    var d = ts.toDate ? ts.toDate() : new Date(ts);
    if (isNaN(d.getTime())) return '';
    var now = new Date();
    var diff = (now - d) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  async function collectNotifications(user, profile) {
    if (!window.db || !user) return [];
    var items = [];
    var uid = user.uid;
    var ministries = (profile && profile.ministries) || [];
    var isAdmin = profile && profile.role === 'admin';
    var isLeader = profile && (profile.role === 'leader' || profile.role === 'admin');
    var rooms = ALL_ROOMS.filter(function (r) {
      return r === 'Whole Church' || isAdmin || ministries.indexOf(r) !== -1;
    });

    try {
      var pend = await db.collection('scheduleRequests')
        .where('assignedToUid', '==', uid)
        .where('status', '==', 'pending')
        .get();
      pend.forEach(function (doc) {
        var d = doc.data() || {};
        var id = 'sched-pend-' + doc.id;
        items.push({
          id: id,
          type: 'schedule_pending',
          title: 'You are scheduled',
          body: (d.ministry || 'Ministry') + (d.date ? ' · ' + d.date : '') + (d.groupName || d.title ? ' — ' + (d.groupName || d.title) : ''),
          when: d.createdAt,
          link: getPrefix() + 'calendar.html',
          rawId: doc.id
        });
      });
    } catch (e) {
      console.warn('notif pending', e);
    }

    if (isLeader) {
      try {
        var respSnap = await db.collection('scheduleRequests')
          .where('createdByUid', '==', uid)
          .get();
        respSnap.forEach(function (doc) {
          var d = doc.data() || {};
          if (d.status !== 'available' && d.status !== 'unavailable') return;
          var id = 'sched-resp-' + doc.id + '-' + d.status;
          if (isSeen(id)) return;
          var yes = d.status === 'available';
          items.push({
            id: id,
            type: 'schedule_response',
            title: yes ? 'Accepted assignment' : 'Declined assignment',
            body: (d.assignedToName || 'Someone') + (yes ? ' is available' : ' is not available') +
              (d.ministry ? ' for ' + d.ministry : '') + (d.date ? ' on ' + d.date : '') +
              (d.song ? ' · Song: ' + d.song : ''),
            when: d.respondedAt || d.createdAt,
            link: getPrefix() + 'calendar.html',
            rawId: doc.id
          });
        });
      } catch (e) {
        console.warn('notif responses', e);
      }
    }

    for (var i = 0; i < rooms.length; i++) {
      var room = rooms[i];
      try {
        var msgSnap = await db.collection('chats').doc(room).collection('messages')
          .orderBy('createdAt', 'desc')
          .limit(25)
          .get();
        msgSnap.forEach(function (doc) {
          var d = doc.data() || {};
          if (!d.isPrayer) return;
          if (d.uid === uid) return;
          var id = 'prayer-' + room + '-' + doc.id;
          if (isSeen(id)) return;
          var created = d.createdAt && d.createdAt.toDate ? d.createdAt.toDate() : null;
          if (created && (Date.now() - created.getTime()) > 7 * 24 * 3600 * 1000) return;
          items.push({
            id: id,
            type: 'prayer',
            title: 'Prayer request',
            body: (d.name || 'Someone') + ' in ' + room + ': ' + (d.text || '').slice(0, 80),
            when: d.createdAt,
            link: getPrefix() + 'chat-room.html?room=' + encodeURIComponent(room),
            rawId: doc.id
          });
        });
      } catch (e) {
        console.warn('notif prayer', room, e);
      }
    }

    items.sort(function (a, b) {
      var ta = a.when && a.when.toMillis ? a.when.toMillis() : (a.when ? new Date(a.when).getTime() : 0);
      var tb = b.when && b.when.toMillis ? b.when.toMillis() : (b.when ? new Date(b.when).getTime() : 0);
      return tb - ta;
    });
    return items;
  }

  var lastItems = [];

  function renderList(items) {
    lastItems = items || [];
    var list = document.getElementById('notif-list');
    if (!list) return;
    if (!lastItems.length) {
      list.innerHTML = '<div class="notif-empty">No new alerts</div>';
      return;
    }
    list.innerHTML = lastItems.map(function (n) {
      var icon = n.type === 'prayer' ? '🙏' : (n.type === 'schedule_response' ? (n.title.indexOf('Accepted') === 0 ? '✅' : '❌') : '📅');
      return (
        '<a class="notif-item" href="' + escapeHtml(n.link) + '" data-id="' + escapeHtml(n.id) + '">' +
        '<span class="notif-item-icon">' + icon + '</span>' +
        '<span class="notif-item-body">' +
        '<span class="notif-item-title">' + escapeHtml(n.title) + '</span>' +
        '<span class="notif-item-text">' + escapeHtml(n.body) + '</span>' +
        '<span class="notif-item-time">' + escapeHtml(formatWhen(n.when)) + '</span>' +
        '</span></a>'
      );
    }).join('');

    list.querySelectorAll('.notif-item').forEach(function (el) {
      el.addEventListener('click', function () {
        var id = el.getAttribute('data-id');
        if (id) markSeen(id);
      });
    });
  }

  function markAllRead() {
    lastItems.forEach(function (n) {
      if (n.type !== 'schedule_pending') markSeen(n.id);
    });
    refreshNotifications(true);
  }

  async function refreshNotifications(renderPanel) {
    if (typeof auth === 'undefined' || !auth.currentUser) {
      setBadge(0);
      if (renderPanel) renderList([]);
      return;
    }
    try {
      var profile = null;
      if (typeof ensureUserProfile === 'function') {
        profile = await ensureUserProfile(auth.currentUser);
      } else if (typeof getUserProfile === 'function') {
        profile = await getUserProfile(auth.currentUser.uid);
      }
      var items = await collectNotifications(auth.currentUser, profile);
      setBadge(items.length);
      if (renderPanel || (document.getElementById('notif-panel') && document.getElementById('notif-panel').classList.contains('open'))) {
        renderList(items);
      }
    } catch (e) {
      console.warn('notif refresh', e);
    }
  }

  function start() {
    injectUI();
    if (typeof auth === 'undefined') {
      setTimeout(start, 200);
      return;
    }
    auth.onAuthStateChanged(function (user) {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
      if (!user) {
        setBadge(0);
        renderList([]);
        return;
      }
      refreshNotifications(false);
      pollTimer = setInterval(function () {
        refreshNotifications(false);
      }, 60000);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
  setTimeout(start, 100);
  setTimeout(start, 500);
})();
