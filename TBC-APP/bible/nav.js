/* Shared hamburger + home logo for Bible chapter pages */
(function () {
  function toggleMenu() {
    var drawer = document.getElementById('navDrawer');
    var overlay = document.getElementById('navOverlay');
    if (drawer) drawer.classList.toggle('open');
    if (overlay) overlay.classList.toggle('open');
  }
  window.toggleMenu = toggleMenu;

  if (!document.getElementById('home-logo-style')) {
    var logoStyle = document.createElement('style');
    logoStyle.id = 'home-logo-style';
    logoStyle.textContent =
      '.home-logo-btn{position:fixed;top:10px;left:12px;z-index:3000;display:block;' +
      'width:44px;height:44px;border-radius:50%;overflow:hidden;box-shadow:0 4px 14px rgba(64,64,64,0.18);' +
      'background:#fff;padding:2px;text-decoration:none;}' +
      '.home-logo-btn img{width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;}';
    (document.head || document.documentElement).appendChild(logoStyle);
  }

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
    } else if (!document.getElementById('home-logo-btn')) {
      var logo =
        '<a id="home-logo-btn" class="home-logo-btn" href="../../../../index.html" title="Home" aria-label="Go to home">' +
        '<img src="../../../../tbclogo.jpeg" alt="TBC Home"></a>';
      document.body.insertAdjacentHTML('afterbegin', logo);
    }
  }

  function loadChrome() {
    if (document.querySelector('script[src*="bible-chrome.js"]')) return;
    var s = document.createElement('script');
    s.src = '../../../bible-chrome.js';
    document.body.appendChild(s);
  }

  function run() {
    injectNavChrome();
    loadChrome();
  }

  if (document.body) {
    run();
  } else {
    document.addEventListener('DOMContentLoaded', run);
  }

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
