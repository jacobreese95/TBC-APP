/* Global home logo - top left on every page except the home page itself */
(function () {
  function isHomePage() {
    var path = (window.location.pathname || '').toLowerCase();
    // Home is the app root index (not bible or other folders)
    if (path.indexOf('/bible/') !== -1 || path.indexOf('/bible\\') !== -1) return false;
    if (path.endsWith('/index.html') || path.endsWith('/')) {
      // Could be nested index - only treat as home if no extra folder after TBC-APP root markers
      var parts = path.split('/').filter(function (p) { return p && p !== 'index.html'; });
      // workers.dev often ends with just / or /index.html
      if (parts.length === 0) return true;
      if (parts.length === 1 && (parts[0] === 'tbc-app' || parts[0].indexOf('workers') !== -1)) return true;
      // file:///.../TBC-APP/index.html -> last meaningful is TBC-APP
      if (parts[parts.length - 1] === 'tbc-app') return true;
      return false;
    }
    return false;
  }

  function getPrefix() {
    var path = window.location.pathname || '';
    var lower = path.toLowerCase();
    var depth = 0;

    if (lower.indexOf('/bible/') !== -1) {
      var after = lower.split('/bible/')[1] || '';
      var parts = after.split('/').filter(function (p) {
        return p && p.indexOf('.') === -1;
      });
      depth = 1 + parts.length;
    } else {
      // Root-level pages (calendar.html, chat.html, etc.)
      depth = 0;
    }

    if (depth === 0) return '';
    return '../'.repeat(depth);
  }

  function inject() {
    if (isHomePage()) return;
    if (document.getElementById('home-logo-btn')) return;

    var prefix = getPrefix();
    var a = document.createElement('a');
    a.id = 'home-logo-btn';
    a.className = 'home-logo-btn';
    a.href = prefix + 'index.html';
    a.title = 'Home';
    a.setAttribute('aria-label', 'Go to home');

    var img = document.createElement('img');
    img.src = prefix + 'tbclogo.jpeg';
    img.alt = 'TBC Home';
    a.appendChild(img);

    if (document.body) {
      document.body.appendChild(a);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
