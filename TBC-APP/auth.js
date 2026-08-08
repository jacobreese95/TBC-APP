// TBC Church App – Firebase Auth + Firestore
// Uses Firebase compat SDK (works with plain HTML, no build step)

const firebaseConfig = {
  apiKey: "AIzaSyChN8xvRz0R2Zo6NUEeHRBHib2XoxVb4nE",
  authDomain: "tbc-app-60125.firebaseapp.com",
  projectId: "tbc-app-60125",
  storageBucket: "tbc-app-60125.firebasestorage.app",
  messagingSenderId: "813699285807",
  appId: "1:813699285807:web:50216bcc58355a49ca97da",
  measurementId: "G-YZH2SKFPVZ"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
window.auth = auth;
window.db = db;

async function signUpUser({ name, birthday, phone, email, address, password }) {
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  const user = cred.user;
  await user.updateProfile({ displayName: name });
  await db.collection('users').doc(user.uid).set({
    name: name || '',
    email: email || '',
    phone: phone || '',
    address: address || '',
    birthday: birthday || '',
    approved: false,
    role: 'member',
    ministries: [],
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  return user;
}

async function signInUser(email, password) {
  const cred = await auth.signInWithEmailAndPassword(email, password);
  return cred.user;
}

function signOutUser() {
  return auth.signOut();
}

async function getUserProfile(uid) {
  const snap = await db.collection('users').doc(uid).get();
  if (!snap.exists) return null;
  return Object.assign({ uid: snap.id }, snap.data());
}

async function ensureUserProfile(user) {
  if (!user) return null;
  let profile = await getUserProfile(user.uid);
  if (!profile) {
    await db.collection('users').doc(user.uid).set({
      name: user.displayName || '',
      email: user.email || '',
      approved: false,
      role: 'member',
      ministries: [],
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    profile = await getUserProfile(user.uid);
  }
  return profile;
}

function requireApprovedUser() {
  return new Promise(function (resolve) {
    auth.onAuthStateChanged(async function (user) {
      if (!user) {
        window.location.href = (typeof getAssetPrefixForPage === 'function' ? getAssetPrefixForPage() : '') + 'login.html';
        resolve(null);
        return;
      }
      try {
        const profile = await ensureUserProfile(user);
        if (!profile || profile.approved === false) {
          window.location.href = (typeof getAssetPrefixForPage === 'function' ? getAssetPrefixForPage() : '') + 'pending.html';
          resolve(null);
          return;
        }
        resolve(Object.assign({ uid: user.uid }, profile));
      } catch (e) {
        console.error(e);
        resolve(null);
      }
    });
  });
}

async function isCurrentUserAdmin() {
  const user = auth.currentUser;
  if (!user) return false;
  const profile = await getUserProfile(user.uid);
  return !!(profile && String(profile.role || '').toLowerCase() === 'admin');
}

function authErrorMessage(err) {
  if (!err) return 'Something went wrong';
  var code = err.code || '';
  if (code.indexOf('email-already-in-use') !== -1) return 'That email is already registered.';
  if (code.indexOf('wrong-password') !== -1 || code.indexOf('invalid-credential') !== -1) return 'Wrong email or password.';
  if (code.indexOf('user-not-found') !== -1) return 'No account found with that email.';
  if (code.indexOf('weak-password') !== -1) return 'Password should be at least 6 characters.';
  if (code.indexOf('invalid-email') !== -1) return 'Please enter a valid email.';
  return err.message || 'Something went wrong';
}

function getAssetPrefixForPage() {
  var path = (window.location.pathname || '').toLowerCase();
  if (path.indexOf('/bible/') === -1) return '';
  var after = path.split('/bible/')[1] || '';
  var parts = after.split('/').filter(function (p) {
    return p && p.indexOf('.') === -1;
  });
  return '../'.repeat(1 + parts.length);
}

(function injectHomeLogoButton() {
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

  function inject() {
    if (isMainHomePage()) return;
    if (document.getElementById('home-logo-btn')) return;
    if (!document.body) return;

    var prefix = getAssetPrefixForPage();
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

(function injectAdminMenuLink() {
  function isAdminRole(profile) {
    return !!(profile && String(profile.role || '').toLowerCase() === 'admin');
  }

  function hideAdminLink() {
    document.querySelectorAll('#drawer-admin, #btn-admin, a[href="admin.html"], a[href$="/admin.html"], a[href*="admin.html"]').forEach(function (el) {
      el.classList.remove('is-admin-visible');
      el.style.setProperty('display', 'none', 'important');
      el.setAttribute('data-admin-only', '1');
      el.hidden = true;
    });
  }

  function showAdminLink() {
    var prefix = getAssetPrefixForPage();
    var adminHref = prefix + 'admin.html';

    var btnAdmin = document.getElementById('btn-admin');
    if (btnAdmin) {
      btnAdmin.hidden = false;
      btnAdmin.classList.add('is-admin-visible');
      btnAdmin.style.setProperty('display', 'flex', 'important');
    }

    document.querySelectorAll('#drawer-admin, a[href="admin.html"], a[href$="/admin.html"]').forEach(function (el) {
      el.hidden = false;
      el.classList.add('is-admin-visible');
      el.style.setProperty('display', 'block', 'important');
      if (!el.getAttribute('href') || el.getAttribute('href') === '#') {
        el.setAttribute('href', adminHref);
      }
    });

    var drawers = document.querySelectorAll('.nav-drawer, #drawer, #navDrawer');
    drawers.forEach(function (drawer) {
      if (!drawer) return;
      var existing = drawer.querySelector('#drawer-admin, a[href*="admin.html"]');
      if (existing) {
        existing.hidden = false;
        existing.classList.add('is-admin-visible');
        existing.style.setProperty('display', 'block', 'important');
        return;
      }
      var a = document.createElement('a');
      a.id = 'drawer-admin';
      a.href = adminHref;
      a.textContent = 'Admin';
      a.setAttribute('data-admin-only', '1');
      a.classList.add('is-admin-visible');
      var logout = null;
      drawer.querySelectorAll('a').forEach(function (link) {
        var t = (link.textContent || '').toLowerCase();
        if (t.indexOf('logout') !== -1 || t.indexOf('log out') !== -1) logout = link;
      });
      if (logout && logout.parentNode === drawer) {
        drawer.insertBefore(a, logout);
      } else {
        drawer.appendChild(a);
      }
    });
  }

  hideAdminLink();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hideAdminLink);
  }
  setTimeout(hideAdminLink, 50);
  setTimeout(hideAdminLink, 400);

  auth.onAuthStateChanged(async function (user) {
    hideAdminLink();
    if (!user) return;
    try {
      var profile = await ensureUserProfile(user);
      if (isAdminRole(profile)) {
        showAdminLink();
        setTimeout(showAdminLink, 200);
        setTimeout(showAdminLink, 800);
      } else {
        hideAdminLink();
        setTimeout(hideAdminLink, 200);
        setTimeout(hideAdminLink, 900);
      }
    } catch (e) {
      console.warn(e);
      hideAdminLink();
    }
  });
})();

/* Load global notifications bell on every page that uses auth.js */
(function loadNotificationsScript() {
  if (document.querySelector('script[data-tbc-notif]')) return;
  function inject() {
    if (document.querySelector('script[data-tbc-notif]')) return;
    var prefix = (typeof getAssetPrefixForPage === 'function') ? getAssetPrefixForPage() : '';
    var s = document.createElement('script');
    s.src = prefix + 'notifications.js';
    s.setAttribute('data-tbc-notif', '1');
    s.async = true;
    (document.head || document.body || document.documentElement).appendChild(s);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
