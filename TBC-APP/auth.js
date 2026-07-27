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
    phone: phone.trim(),
    email: email.trim().toLowerCase(),
    address: address.trim(),
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
  return { uid, ...snap.data() };
}

/**
 * Call on protected pages.
 * - Not logged in → login.html
 * - Logged in but not approved → pending.html
 * - Approved → returns the profile object
 */
function requireApprovedUser() {
  return new Promise((resolve) => {
    auth.onAuthStateChanged(async (user) => {
      if (!user) {
        window.location.href = "login.html";
        resolve(null);
        return;
      }
      try {
        const profile = await getUserProfile(user.uid);
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
  return (err && err.message) || "Something went wrong. Please try again.";
}
