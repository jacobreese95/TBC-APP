let room = new URLSearchParams(window.location.search).get('room') || 'Whole Church';
let currentUser = null;
let displayName = 'User';
let myPhotoURL = '';
let isSending = false;
let weekEvents = [];
var photoCache = {};

function toggleDrawer() {
  document.getElementById('drawer').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('open');
}

function closeDayModal() {
  document.getElementById('day-modal').classList.remove('open');
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

function getEventsForDate(dateStr) {
  return weekEvents.filter(e =>
    e.date === dateStr &&
    (e.ministry === room || e.ministry === 'Whole Church')
  );
}

function showDayPreview(date) {
  const modal = document.getElementById('day-modal');
  const titleEl = document.getElementById('day-modal-title');
  const eventsEl = document.getElementById('day-modal-events');
  const dateStr = dateKey(date);
  titleEl.textContent = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  eventsEl.innerHTML = '';
  const events = getEventsForDate(dateStr);
  if (events.length === 0) {
    eventsEl.innerHTML = '<p style="color:#666;">No events scheduled for this day.</p>';
  } else {
    events.forEach(ev => {
      const div = document.createElement('div');
      div.className = 'day-event';
      div.innerHTML =
        '<strong>' + escapeHtml(ev.title || 'Event') + '</strong>' +
        (ev.description ? '<br>' + escapeHtml(ev.description) : '') +
        '<div class="ministry-tag">' + escapeHtml(ev.ministry || '') + '</div>';
      eventsEl.appendChild(div);
    });
  }
  modal.classList.add('open');
}

function renderWeekHeader() {
  const header = document.getElementById('week-header');
  if (!header) return;
  header.innerHTML = '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = dateKey(d);
    const events = getEventsForDate(dateStr);
    const dayEl = document.createElement('div');
    dayEl.className = 'week-day' + (i === 0 ? ' today' : '');
    dayEl.onclick = () => showDayPreview(d);
    let eventsHtml = '';
    events.slice(0, 3).forEach(ev => {
      const cls = ev.ministry === 'Whole Church' ? 'week-event church' : 'week-event';
      eventsHtml += '<div class="' + cls + '">' + escapeHtml(ev.title || 'Event') + '</div>';
    });
    if (events.length > 3) {
      eventsHtml += '<div class="week-event-more">+' + (events.length - 3) + ' more</div>';
    }
    dayEl.innerHTML =
      '<div class="week-day-name">' + d.toLocaleDateString('en-US', { weekday: 'short' }) + '</div>' +
      '<div class="week-day-num">' + d.getDate() + '</div>' +
      '<div class="week-day-events">' + eventsHtml + '</div>';
    header.appendChild(dayEl);
  }
}

async function loadWeekEvents() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setDate(end.getDate() + 7);
    const startStr = dateKey(today);
    const endStr = dateKey(end);
    const snap = await db.collection('events').get();
    weekEvents = [];
    snap.forEach(doc => {
      const d = doc.data() || {};
      if (!d.date) return;
      if (d.date >= startStr && d.date < endStr) {
        weekEvents.push(Object.assign({ id: doc.id }, d));
      }
    });
    renderWeekHeader();
  } catch (e) {
    console.warn('week events', e);
    renderWeekHeader();
  }
}

async function resolvePhoto(uid) {
  if (!uid) return '';
  if (photoCache[uid] !== undefined) return photoCache[uid];
  try {
    const doc = await db.collection('users').doc(uid).get();
    const url = (doc.exists && doc.data() && doc.data().photoURL) || '';
    photoCache[uid] = url;
    return url;
  } catch (e) {
    photoCache[uid] = '';
    return '';
  }
}

function avatarHtml(photoURL, name) {
  if (photoURL) {
    return '<img class="msg-avatar" src="' + escapeHtml(photoURL) + '" alt="">';
  }
  const initial = (name || '?').charAt(0).toUpperCase();
  return '<div class="msg-avatar-ph">' + escapeHtml(initial) + '</div>';
}

async function renderMessages(docs) {
  const container = document.getElementById('chat-messages');
  if (!container) return;
  const items = [];
  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    const m = doc.data() || {};
    const uid = m.uid || '';
    const photo = await resolvePhoto(uid);
    items.push({ id: doc.id, m: m, photo: photo });
  }
  container.innerHTML = '';
  items.forEach(item => {
    const m = item.m;
    let classes = 'message ';
    if (m.isPrayer) classes += 'prayer';
    else if (currentUser && m.uid === currentUser.uid) classes += 'sent';
    else classes += 'received';
    const name = m.name || 'Member';
    let html = avatarHtml(item.photo, name);
    html += '<div class="msg-content">';
    html += '<strong>' + escapeHtml(name) + '</strong>';
    html += '<div>' + escapeHtml(m.text || '') + '</div>';
    if (m.isPrayer) html += '<div class="prayer-tag">🙏 Prayer Request</div>';
    html += '</div>';
    const div = document.createElement('div');
    div.className = classes;
    div.innerHTML = html;
    container.appendChild(div);
  });
  container.scrollTop = container.scrollHeight;
}

async function loadMessages() {
  const container = document.getElementById('chat-messages');
  try {
    const snapshot = await db.collection('chats').doc(room).collection('messages').orderBy('createdAt').get();
    await renderMessages(snapshot.docs);
  } catch (e) {
    if (container) container.innerHTML = '<p style="color:#666;text-align:center;">Could not load messages.</p>';
    console.warn(e);
  }
}

function sendMessage(isPrayer) {
  if (isSending) return;
  const input = document.getElementById('message-input');
  const text = input.value.trim();
  if (!text) return;
  if (!currentUser) return;
  isSending = true;
  input.value = '';
  input.focus();
  db.collection('chats').doc(room).collection('messages').add({
    text: text,
    name: displayName,
    uid: currentUser.uid,
    isPrayer: !!isPrayer,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(function () {
    isSending = false;
    input.focus();
  }).catch(function (e) {
    isSending = false;
    alert('Error sending: ' + e.message);
    input.value = text;
    input.focus();
  });
}

async function init() {
  document.getElementById('room-title').textContent = room;
  const profile = await requireApprovedUser();
  if (!profile) return;
  currentUser = auth.currentUser;
  displayName = profile.name || profile.email || 'Member';
  myPhotoURL = profile.photoURL || '';
  if (myPhotoURL && currentUser) photoCache[currentUser.uid] = myPhotoURL;

  document.getElementById('prayerBtn').style.display = 'inline-flex';

  const input = document.getElementById('message-input');
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(false);
    }
  });
  document.getElementById('sendBtn').addEventListener('click', function () {
    sendMessage(false);
  });
  document.getElementById('prayerBtn').addEventListener('click', function () {
    sendMessage(true);
  });

  await loadWeekEvents();
  await loadMessages();

  db.collection('chats').doc(room).collection('messages')
    .orderBy('createdAt')
    .onSnapshot(function (snap) {
      renderMessages(snap.docs);
    }, function (err) {
      console.warn(err);
    });
}

init();
