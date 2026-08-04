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

/**
 * Create account + user profile document.
 * New users are approved: false until an admin sets them true.
 */
async function signUpUser({ name, birthday, phone, email, address, password }) {
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  const uid = cred.user.uid;

  await db.collection("users").doc(uid).set({
    name: name.trim(),
    birthday: birthday || "",
    phone: (phone || "").trim(),
    email: email.trim().toLowerCase(),
    address: (address || "").trim(),
    approved: false,
    role: "member",
    ministries: ["Whole Church"],
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  return cred.user;
}

/** Email/password login */
async function signInUser(email, password) {
  const cred = await auth.signInWithEmailAndPassword(email, password);
  return cred.user;
}

/** Sign out */
function signOutUser() {
  return auth.signOut();
}

/** Load the Firestore profile for the current user */
async function getUserProfile(uid) {
  const snap = await db.collection("users").doc(uid).get();
  if (!snap.exists) return null;
  return { uid: uid, ...snap.data() };
}

/**
 * If Auth user exists but Firestore profile is missing, create a basic one.
 * First-time admin can be approved in console; this stops the "profile missing" dead-end.
 */
async function ensureUserProfile(user) {
  let profile = await getUserProfile(user.uid);
  if (profile) return profile;

  const basic = {
    name: user.email || "Member",
    birthday: "",
    phone: "",
    email: (user.email || "").toLowerCase(),
    address: "",
    approved: false,
    role: "member",
    ministries: ["Whole Church"],
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  await db.collection("users").doc(user.uid).set(basic);
  profile = await getUserProfile(user.uid);
  return profile;
}

/**
 * Call on protected pages.
 * - Not logged in → login.html
 * - Logged in but not approved → pending.html
 * - Approved → returns the profile object
 */
function requireApprovedUser() {
  return new Promise(function (resolve) {
    auth.onAuthStateChanged(async function (user) {
      if (!user) {
        window.location.href = "login.html";
        resolve(null);
        return;
      }
      try {
        const profile = await ensureUserProfile(user);
        if (!profile) {
          window.location.href = "login.html";
          resolve(null);
          return;
        }
        if (!profile.approved) {
          window.location.href = "pending.html";
          resolve(null);
          return;
        }
        resolve(profile);
      } catch (err) {
        console.error(err);
        window.location.href = "login.html";
        resolve(null);
      }
    });
  });
}

/** Check if current user is admin */
async function isCurrentUserAdmin() {
  const user = auth.currentUser;
  if (!user) return false;
  const profile = await getUserProfile(user.uid);
  return profile && profile.role === 'admin';
}

/** Friendly Firebase error messages */
function authErrorMessage(err) {
  const code = err && err.code;
  if (code === "auth/email-already-in-use") return "That email already has an account. Try logging in.";
  if (code === "auth/invalid-email") return "Please enter a valid email address.";
  if (code === "auth/weak-password") return "Password must be at least 6 characters.";
  if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
    return "Email or password is incorrect.";
  }
  if (code === "auth/too-many-requests") return "Too many attempts. Wait a minute and try again.";
  if (code === "permission-denied") {
    return "Database permission error. In Firebase → Firestore → Rules, allow read/write for now (test mode).";
  }
  return (err && err.message) || "Something went wrong. Please try again.";
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

/* Home logo button (top-left) on every page except the main home page */
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

/* Show Admin in any hamburger drawer when the user is an admin */
(function injectAdminMenuLink() {
  function showAdminLink() {
    var prefix = getAssetPrefixForPage();
    var adminHref = prefix + 'admin.html';

    // Show any existing admin links
    document.querySelectorAll('#drawer-admin, a[href="admin.html"], a[href$="/admin.html"]').forEach(function (el) {
      el.style.display = 'block';
      if (!el.getAttribute('href') || el.getAttribute('href') === '#') {
        el.setAttribute('href', adminHref);
      }
    });

    // Inject into drawers that don't already have Admin
    var drawers = document.querySelectorAll('.nav-drawer, #drawer, #navDrawer');
    drawers.forEach(function (drawer) {
      if (!drawer) return;
      if (drawer.querySelector('a[href*="admin.html"], #drawer-admin')) {
        var existing = drawer.querySelector('a[href*="admin.html"], #drawer-admin');
        if (existing) existing.style.display = 'block';
        return;
      }
      var a = document.createElement('a');
      a.id = 'drawer-admin';
      a.href = adminHref;
      a.textContent = 'Admin';
      // Insert before Logout if possible
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

  function hideAdminLink() {
    document.querySelectorAll('#drawer-admin').forEach(function (el) {
      el.style.display = 'none';
    });
  }

  auth.onAuthStateChanged(async function (user) {
    if (!user) {
      hideAdminLink();
      return;
    }
    try {
      var profile = await ensureUserProfile(user);
      if (profile && profile.role === 'admin') {
        showAdminLink();
        // Retry in case drawer rendered late
        setTimeout(showAdminLink, 200);
        setTimeout(showAdminLink, 800);
      } else {
        hideAdminLink();
      }
    } catch (e) {
      console.warn(e);
    }
  });
})();
