/* Shared hamburger menu + home logo + chapter prev/next for Bible chapter pages */
(function () {
  function toggleMenu() {
    var drawer = document.getElementById('navDrawer');
    var overlay = document.getElementById('navOverlay');
    if (drawer) drawer.classList.toggle('open');
    if (overlay) overlay.classList.toggle('open');
  }
  window.toggleMenu = toggleMenu;

  var html =
    '<button class="hamburger" onclick="toggleMenu()" aria-label="Open menu">' +
    '<span></span><span></span><span></span></button>' +
    '<div class="nav-overlay" id="navOverlay" onclick="toggleMenu()"></div>' +
    '<div class="nav-drawer" id="navDrawer">' +
    '<a href="../../../../index.html">Home</a>' +
    '<a href="../../../../about.html">About Us</a>' +
    '<a href="../../../../calendar.html">Calendar</a>' +
    '<a href="../../../../chat.html">Ministry Chats</a>' +
    '<a href="../../../index.html">Bible</a>' +
    '<a href="../../../../give.html">Give on Tithe.ly</a>' +
    '<a href="../../../../sermons.html">Sermons & Live Streams</a>' +
    '<a href="../../../../soul-winning.html">Soul Winning</a>' +
    '<a href="../../../../profile.html">Profile</a>' +
    '<a href="../../../../admin.html" id="drawer-admin" style="display:none;">Admin</a>' +
    '<a href="#" onclick="signOutUser().then(() => window.location.href=\'../../../../index.html\')">Logout</a>' +
    '</div>' +
    '<a id="home-logo-btn" class="home-logo-btn" href="../../../../index.html" title="Home" aria-label="Go to home">' +
    '<img src="../../../../tbclogo.jpeg" alt="TBC Home">' +
    '</a>';

  function injectNavChrome() {
    if (!document.getElementById('navDrawer')) {
      document.body.insertAdjacentHTML('afterbegin', html);
    }
  }

  function injectChapterButtons() {
    var match = (window.location.pathname || '').match(/chapter-(\d+)/i);
    if (!match) return;

    var BUILT_THROUGH = 13;
    var current = parseInt(match[1], 10);
    if (isNaN(current) || current < 1) return;
    if (document.querySelector('.chapter-bottom-nav')) return;

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
    else document.body.appendChild(nav);
  }

  function run() {
    injectNavChrome();
    injectChapterButtons();
  }

  if (document.body) {
    run();
  } else {
    document.addEventListener('DOMContentLoaded', run);
  }

  // Show Admin link only to admins
  setTimeout(async function () {
    if (typeof firebase === 'undefined') return;
    try {
      var user = firebase.auth().currentUser;
      if (user) {
        var snap = await firebase.firestore().collection('users').doc(user.uid).get();
        if (snap.exists && snap.data().role === 'admin') {
          var adminLink = document.getElementById('drawer-admin');
          if (adminLink) adminLink.style.display = 'block';
        }
      }
    } catch (e) {}
  }, 800);
})();
