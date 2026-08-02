/* Shared hamburger menu for Bible chapter pages + load bible-chrome */
(function () {
  function toggleMenu() {
    var drawer = document.getElementById('navDrawer');
    var overlay = document.getElementById('navOverlay');
    if (drawer) drawer.classList.toggle('open');
    if (overlay) overlay.classList.toggle('open');
  }
  window.toggleMenu = toggleMenu;

  // Hard-coded paths for chapter depth: bible/old-testament/genesis/chapter-N/
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
      // Drawer exists but logo missing — still inject logo
      var logo =
        '<a id="home-logo-btn" class="home-logo-btn" href="../../../../index.html" title="Home" aria-label="Go to home">' +
        '<img src="../../../../tbclogo.jpeg" alt="TBC Home"></a>';
      document.body.insertAdjacentHTML('afterbegin', logo);
    }
  }

  function loadChrome() {
    // bible-chrome.js sits in /bible/ — from chapter page use ../../../bible-chrome.js
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
