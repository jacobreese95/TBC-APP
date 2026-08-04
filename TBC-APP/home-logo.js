/* Apply saved theme early + home logo button */
(function applySavedTheme() {
  try {
    var t = localStorage.getItem('tbc-theme') || 'light';
    t = t === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
    if (document.body) document.body.setAttribute('data-theme', t);
  } catch (e) {}
})();

/* Global home logo - top left on every page except the main home page */
(function () {
  function isMainHomePage() {
    var path = (window.location.pathname || '').toLowerCase();
    var file = path.split('/').pop() || '';
    if (path.indexOf('/bible/') !== -1) return false;
    if (file === '' || file === 'index.html') {
      var parts = path.split('/').filter(function (p) { return p && p !== 'index.html'; });
      return parts.length <= 1;
    }
    return false;
  }

  function getPrefix() {
    var path = (window.location.pathname || '').toLowerCase();
    if (path.indexOf('/bible/') === -1) return '';
    var after = path.split('/bible/')[1] || '';
    var parts = after.split('/').filter(function (p) {
      return p && p.indexOf('.') === -1;
    });
    return '../'.repeat(1 + parts.length);
  }

  function inject() {
    if (isMainHomePage()) return;
    if (document.getElementById('home-logo-btn')) return;
    if (!document.body) return;

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

    document.body.appendChild(a);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
  setTimeout(inject, 50);
  setTimeout(inject, 300);
})();
