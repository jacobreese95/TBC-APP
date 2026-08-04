/* Bible chrome: theme + top-left home logo + bottom prev/next chapter buttons */
(function () {
  // Apply saved app theme (shared with main app via localStorage)
  try {
    var theme = localStorage.getItem('tbc-theme') || 'light';
    theme = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    if (document.body) document.body.setAttribute('data-theme', theme);
  } catch (e) {}

  // Ensure logo styles exist even if page CSS is missing them
  if (!document.getElementById('home-logo-style')) {
    var logoStyle = document.createElement('style');
    logoStyle.id = 'home-logo-style';
    logoStyle.textContent =
      '.home-logo-btn{position:fixed;top:10px;left:12px;z-index:3000;display:block;' +
      'width:44px;height:44px;border-radius:50%;overflow:hidden;box-shadow:0 4px 14px rgba(64,64,64,0.18);' +
      'background:var(--surface,#fff);padding:2px;text-decoration:none;}' +
      '.home-logo-btn img{width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;}' +
      '.home-logo-btn:active{transform:scale(0.92);}';
    document.head.appendChild(logoStyle);
  }

  function getRootPrefix() {
    var path = (window.location.pathname || '').replace(/\\/g, '/');
    var lower = path.toLowerCase();

    var idx = lower.indexOf('/bible/');
    if (idx !== -1) {
      var after = path.slice(idx + '/bible/'.length);
      after = after.replace(/[^/]*$/, '');
      var dirs = after.split('/').filter(function (p) { return !!p; });
      return '../'.repeat(dirs.length + 1);
    }

    if (/\/bible\/old-testament\/genesis\/chapter-/i.test(lower)) return '../../../../';
    if (/\/bible\/old-testament\/genesis/i.test(lower)) return '../../../';
    if (/\/bible\/(old|new)-testament/i.test(lower)) return '../../';
    if (/\/bible/i.test(lower)) return '../';
    return '';
  }

  function injectHomeLogo() {
    if (document.getElementById('home-logo-btn')) return;
    var prefix = getRootPrefix();
    var a = document.createElement('a');
    a.id = 'home-logo-btn';
    a.className = 'home-logo-btn';
    a.href = prefix + 'index.html';
    a.title = 'Home';
    a.setAttribute('aria-label', 'Go to home');
    var img = document.createElement('img');
    img.src = prefix + 'tbclogo.jpeg';
    img.alt = 'TBC Home';
    img.onerror = function () {
      a.textContent = 'Home';
      a.style.cssText =
        'position:fixed;top:12px;left:12px;z-index:3000;background:#4cb8b9;color:#fff;' +
        'padding:10px 12px;border-radius:20px;font-weight:700;text-decoration:none;font-size:0.85rem;';
    };
    a.appendChild(img);
    if (document.body) document.body.appendChild(a);
  }

  function injectChapterNav() {
    var match = (window.location.pathname || '').match(/chapter-(\d+)/i);
    if (!match) return;
    if (document.querySelector('.chapter-bottom-nav')) return;

    var BUILT_THROUGH = 13;
    var current = parseInt(match[1], 10);
    if (isNaN(current) || current < 1) return;

    var prev = current > 1 ? current - 1 : null;
    var next = current < BUILT_THROUGH ? current + 1 : null;

    var style = document.createElement('style');
    style.textContent =
      '.chapter-bottom-nav{display:flex;gap:12px;margin:28px 0 20px;width:100%;}' +
      '.chapter-nav-btn{flex:1;padding:14px 12px;border:none;border-radius:14px;' +
      'font-size:1rem;font-weight:600;cursor:pointer;color:#fff;' +
      'background:linear-gradient(135deg,#4cb8b9 0%,#7bafdd 100%);' +
      'box-shadow:0 4px 14px rgba(64,64,64,0.12);}' +
      '.chapter-nav-btn:disabled{opacity:0.4;cursor:not-allowed;filter:grayscale(0.3);}' +
      '.chapter-nav-btn:not(:disabled):active{transform:translateY(1px);}';
    document.head.appendChild(style);

    var nav = document.createElement('div');
    nav.className = 'chapter-bottom-nav';

    var prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'chapter-nav-btn';
    prevBtn.textContent = '← Previous';
    if (prev) {
      prevBtn.onclick = function () {
        window.location.href = '../chapter-' + prev + '/index.html';
      };
    } else {
      prevBtn.disabled = true;
    }

    var nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'chapter-nav-btn';
    nextBtn.textContent = 'Next →';
    if (next) {
      nextBtn.onclick = function () {
        window.location.href = '../chapter-' + next + '/index.html';
      };
    } else {
      nextBtn.disabled = true;
    }

    nav.appendChild(prevBtn);
    nav.appendChild(nextBtn);

    var container = document.querySelector('.container');
    if (container) container.appendChild(nav);
    else if (document.body) document.body.appendChild(nav);
  }

  function run() {
    try {
      var theme = localStorage.getItem('tbc-theme') || 'light';
      theme = theme === 'dark' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      if (document.body) document.body.setAttribute('data-theme', theme);
    } catch (e) {}
    injectHomeLogo();
    injectChapterNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
