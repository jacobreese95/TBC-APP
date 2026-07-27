/* Shared hamburger menu for Bible chapter pages (4 levels deep) */
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
    '<a href="#" onclick="window.open(\'https://www.google.com/maps/place/11801+E+Lincoln+St,+Wichita,+KS+67207\', \'_blank\'); toggleMenu(); return false;">View Location on Google Maps</a>' +
    '<a href="../../../../soul-winning.html">Soul Winning</a>' +
    '<a href="../../../../profile.html">Profile</a>' +
    '<a href="../../../../admin.html" id="drawer-admin" style="display:none;">Admin</a>' +
    '<a href="#" onclick="signOutUser().then(() => window.location.href=\'../../../../index.html\')">Logout</a>' +
    '</div>';

  if (document.body) {
    document.body.insertAdjacentHTML('afterbegin', html);
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      document.body.insertAdjacentHTML('afterbegin', html);
    });
  }

  // Show Admin link only to admins
  setTimeout(async function() {
    const user = firebase.auth().currentUser;
    if (user) {
      const snap = await firebase.firestore().collection('users').doc(user.uid).get();
      if (snap.exists && snap.data().role === 'admin') {
        const adminLink = document.getElementById('drawer-admin');
        if (adminLink) adminLink.style.display = 'block';
      }
    }
  }, 800);
})();