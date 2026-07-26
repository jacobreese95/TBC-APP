// TBC Church App - Scrollable Pages
let currentUser = null;
let currentPage = 'calendar';
let currentChatRoom = null;
let events = [];
let currentMonth = 7;
let currentYear = 2026;
let selectedMinistries = [];

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const ministries = ["Nursery", "Music - Singing", "Music - Piano", "Sentry", "Media"];

function render() {
  const root = document.getElementById('root');
  
  if (!currentUser) {
    root.innerHTML = `
      <header><h1>Temple Baptist Church</h1></header>
      <div class="container">
        <h2>Login</h2>
        <input type="email" id="email" placeholder="Email"><br><br>
        <input type="password" id="password" placeholder="Password" value="password"><br><br>
        <button onclick="login()">Login</button>
      </div>
    `;
    return;
  }

  let content = '';

  if (currentPage === 'calendar') {
    content = `
      <button onclick="showAddEventForm()" style="width:100%; padding:12px; margin-bottom:15px;">+ Add New Event</button>
      
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <button onclick="prevMonth()">← Prev</button>
        <h2>${monthNames[currentMonth-1]} ${currentYear}</h2>
        <button onclick="nextMonth()">Next →</button>
      </div>
      <div id="ministry-filters" style="margin-bottom:15px;"></div>
      <div id="calendar-container" style="max-height:65vh; overflow-y:auto; border:1px solid #ddd; padding:10px;">
        <div id="calendar-grid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px;"></div>
      </div>
    `;
  } else if (currentPage === 'chat') {
    if (currentChatRoom) {
      content = `
        <div style="padding:10px; background:#003087; color:white;">
          <button onclick="backToChatList()" style="color:white;">← Back</button>
          <h2>${currentChatRoom}</h2>
        </div>
        <div style="padding:15px; background:#f0f8ff;">
          <h3>This Week in ${currentChatRoom}</h3>
          <div id="week-calendar" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; text-align:center;"></div>
        </div>
        <div id="chat-messages" style="height:40vh; overflow-y:scroll; padding:15px;"></div>
        <div style="position:fixed; bottom:60px; left:0; right:0; background:white; padding:10px; border-top:1px solid #ddd;">
          <input type="text" id="chat-input" placeholder="Type message..." style="width:75%; padding:12px;" onkeypress="if(event.key==='Enter') sendMessage()">
          <button onclick="sendMessage()">Send</button>
        </div>
      `;
    } else {
      content = `
        <h2>Ministry Chats</h2>
        ${ministries.map(m => `<button onclick="openChat('${m}')" style="width:100%; padding:18px; margin:6px 0;">💬 ${m}</button>`).join('')}
      `;
    }
  } else if (currentPage === 'give') {
    content = `<h2>Give</h2><button onclick="window.open('https://tithe.ly','_blank')">Tithe.ly</button>`;
  }

  root.innerHTML = `
    <header><h1>TBC App</h1></header>
    <div class="container">${content}</div>
    <div style="position:fixed; bottom:0; left:0; right:0; background:white; border-top:1px solid #ddd; display:flex; justify-content:space-around; padding:12px;">
      <button onclick="switchPage('calendar')">📅 Calendar</button>
      <button onclick="switchPage('chat')">💬 Chat</button>
      <button onclick="switchPage('give')">💰 Give</button>
    </div>
  `;

  if (currentPage === 'calendar') {
    renderFilters();
    renderCalendarGrid();
  }
  if (currentPage === 'chat' && currentChatRoom) {
    renderWeekCalendar();
    renderChatMessages();
  }
}

function login() {
  currentUser = "Member";
  render();
}

function switchPage(page) {
  currentPage = page;
  if (page === 'chat') currentChatRoom = null;
  render();
}

function openChat(room) {
  currentChatRoom = room;
  render();
}

function backToChatList() {
  currentChatRoom = null;
  render();
}

// Calendar functions
function prevMonth() { currentMonth--; if (currentMonth < 1) { currentMonth = 12; currentYear--; } render(); }
function nextMonth() { currentMonth++; if (currentMonth > 12) { currentMonth = 1; currentYear++; } render(); }

function renderFilters() {
  const container = document.getElementById('ministry-filters');
  let html = '';
  ministries.forEach(m => {
    const active = selectedMinistries.includes(m) ? 'background:#003087;color:white;' : 'background:#e0e0e0;';
    html += `<button onclick="toggleFilter('${m}')" style="${active} padding:8px; margin:3px;">${m}</button>`;
  });
  container.innerHTML = html;
}

function toggleFilter(min) {
  if (selectedMinistries.includes(min)) {
    selectedMinistries = selectedMinistries.filter(m => m !== min);
  } else {
    selectedMinistries.push(min);
  }
  render();
}

function showAddEventForm() {
  let dayOptions = '';
  for (let i = 1; i <= 31; i++) {
    dayOptions += `<option value="${i}">Day ${i}</option>`;
  }

  const formHTML = `
    <h2>Add New Event</h2>
    <input type="text" id="event-title" placeholder="Event Title" style="width:100%; padding:10px; margin:10px 0;"><br>
    <select id="event-day" style="width:100%; padding:10px; margin:10px 0;">
      ${dayOptions}
    </select><br>
    <input type="text" id="event-time" placeholder="Time (e.g. 9:00 AM)" style="width:100%; padding:10px; margin:10px 0;" value="9:00 AM"><br>
    <select id="event-ministry" style="width:100%; padding:10px; margin:10px 0;">
      ${ministries.map(m => `<option value="${m}">${m}</option>`).join('')}
    </select><br><br>
    <button onclick="saveEvent()">Save Event</button>
    <button onclick="render()">Cancel</button>
  `;

  document.getElementById('root').innerHTML = formHTML;
}

function saveEvent() {
  const title = document.getElementById('event-title').value || "New Event";
  const day = parseInt(document.getElementById('event-day').value);
  const time = document.getElementById('event-time').value;
  const ministry = document.getElementById('event-ministry').value;

  events.push({title, day, time, ministry, month: currentMonth, year: currentYear});
  alert("Event Saved!");
  render();
}

function renderCalendarGrid() {
  const grid = document.getElementById('calendar-grid');
  let html = '';

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  days.forEach(d => html += `<div style="text-align:center; font-weight:bold; background:#f0f0f0;">${d}</div>`);

  for (let i = 1; i <= 31; i++) {
    let dayEvents = events.filter(e => e.day === i && e.month === currentMonth && e.year === currentYear);
    if (selectedMinistries.length > 0) {
      dayEvents = dayEvents.filter(e => selectedMinistries.includes(e.ministry));
    }
    const hasEvent = dayEvents.length > 0 ? ' •' : '';
    html += `<div style="border:1px solid #ddd; padding:8px; min-height:60px;" onclick="alert('Day ${i}')"><strong>${i}</strong>${hasEvent}</div>`;
  }
  grid.innerHTML = html;
}

// Chat
function renderWeekCalendar() {
  const container = document.getElementById('week-calendar');
  if (!container) return;
  container.innerHTML = `
    <div>Sun 20</div><div>Mon 21</div><div>Tue 22</div><div>Wed 23</div>
    <div>Thu 24</div><div>Fri 25</div><div>Sat 26</div>
  `;
}

function renderChatMessages() {
  const container = document.getElementById('chat-messages');
  if (container) container.innerHTML = `<p>Chat for ${currentChatRoom} is open.</p>`;
}

function sendMessage() {
  const input = document.getElementById('chat-input');
  if (input && input.value) {
    alert(`Message sent in ${currentChatRoom}`);
    input.value = '';
  }
}

// Start
render();