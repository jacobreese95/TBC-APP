function formatEventTime(t){if(!t)return '';var p=String(t).split(':');var h=parseInt(p[0],10);var m=p[1]||'00';if(isNaN(h))return t;var ap=h>=12?'PM':'AM';var h12=h%12;if(h12===0)h12=12;return h12+':'+m+' '+ap;}
let currentDate=new Date();
let allEvents=[];
let selectedFilters=new Set(['Whole Church']);
let currentProfile=null;
const ministryColors={'Whole Church':'#7bafdd','Music Ministry':'#8845a5','Sentry':'#e67e22','Nursery':'#27ae60','Media':'#4cb8b9'};
const allMinistries=['Whole Church','Music Ministry','Sentry','Nursery','Media'];
const SCHEDULE_MINISTRIES=['Music Ministry','Sentry','Nursery','Media'];
let directory=[];
let selectedPeople=[];
let savedGroups=[];
let selectedGroupId=null;
let editingEventId=null;

function canEditEvent(ev){
  if(!currentProfile||!ev)return false;
  if(currentProfile.role==='admin')return true;
  var leaderOf=currentProfile.leaderOf||[];
  if(leaderOf.indexOf(ev.ministry)!==-1)return true;
  if(ev.createdByUid&&auth.currentUser&&ev.createdByUid===auth.currentUser.uid)return true;
  return false;
}
function startEditEvent(eventId){
  var ev=allEvents.find(function(e){return e.id===eventId});
  if(!ev||!canEditEvent(ev)){alert('You cannot edit this event.');return}
  editingEventId=eventId;
  closeDayModal();
  var section=document.getElementById('add-event-section');
  if(section)section.style.display='block';
  document.getElementById('event-date').value=ev.date||'';
  var timeEl=document.getElementById('event-time');
  if(timeEl)timeEl.value=ev.time||'';
  var titleEl=document.getElementById('event-title');
  if(titleEl)titleEl.value=ev.title||'';
  var descEl=document.getElementById('event-desc');
  if(descEl)descEl.value=ev.description||'';
  var minEl=document.getElementById('event-ministry');
  if(minEl){
    if(ev.ministry&&![].slice.call(minEl.options).some(function(o){return o.value===ev.ministry})){
      var opt=document.createElement('option');opt.value=ev.ministry;opt.textContent=ev.ministry;minEl.appendChild(opt);
    }
    minEl.value=ev.ministry||'Whole Church';
  }
  if(typeof onMinistryChange==='function')onMinistryChange();
  var btn=document.getElementById('saveEventBtn');
  if(btn)btn.textContent='Save Changes';
  var cancel=document.getElementById('cancelEditBtn');
  if(cancel)cancel.style.display='block';
  var heading=document.querySelector('#add-event-section h3');
  if(heading)heading.textContent='Edit Event';
  if(section)section.scrollIntoView({behavior:'smooth',block:'start'});
}
function cancelEditEvent(){
  editingEventId=null;
  document.getElementById('event-date').value='';
  if(document.getElementById('event-time'))document.getElementById('event-time').value='';
  document.getElementById('event-title').value='';
  document.getElementById('event-desc').value='';
  if(document.getElementById('event-song'))document.getElementById('event-song').value='';
  if(typeof clearSelectedPeople==='function')clearSelectedPeople();
  var btn=document.getElementById('saveEventBtn');
  if(btn)btn.textContent='Add Event';
  var cancel=document.getElementById('cancelEditBtn');
  if(cancel)cancel.style.display='none';
  var heading=document.querySelector('#add-event-section h3');
  if(heading)heading.textContent='Add Event';
  if(typeof onMinistryChange==='function')onMinistryChange();
}
async function deleteEvent(eventId){
  var ev=allEvents.find(function(e){return e.id===eventId});
  if(!ev||!canEditEvent(ev)){alert('You cannot delete this event.');return}
  if(!confirm('Delete this event?'))return;
  try{
    await db.collection('events').doc(eventId).delete();
    try{
      var rs=await db.collection('scheduleRequests').where('eventId','==',eventId).get();
      var batch=db.batch();
      rs.forEach(function(doc){batch.delete(doc.ref)});
      await batch.commit();
    }catch(e){console.warn(e)}
    closeDayModal();
    await loadEvents();
    alert('Event deleted.');
  }catch(err){alert('Error deleting: '+(err.message||err))}
}

function getMinistryColor(m){return ministryColors[m]||'#4cb8b9'}
function toggleDrawer(){document.getElementById('drawer').classList.toggle('open');document.getElementById('overlay').classList.toggle('open')}
function closeDayModal(){document.getElementById('day-modal').classList.remove('open')}
function escapeHtml(str){return String(str||'').replace(/&/g,'&').replace(/</g,'<').replace(/>/g,'>').replace(/"/g,'"')}
const ministryIcons={'Whole Church':'⛪','Music Ministry':'🎵','Sentry':'🛡️','Nursery':'👶','Media':'🎥'};
function renderFilterBar(userMinistries,isAdmin){
const container=document.getElementById('filter-bar');
container.innerHTML='';
allMinistries.forEach(ministry=>{
if(ministry!=='Whole Church'&&!(isAdmin||userMinistries.includes(ministry)))return;
const btn=document.createElement('button');
btn.type='button';
btn.className='option-tile'+(selectedFilters.has(ministry)?' active':'');
btn.innerHTML='<span class="tile-icon" aria-hidden="true">'+(ministryIcons[ministry]||'📅')+'</span><span class="tile-label">'+ministry+'</span>';
btn.onclick=()=>{if(selectedFilters.has(ministry))selectedFilters.delete(ministry);else selectedFilters.add(ministry);if(selectedFilters.size===0)selectedFilters.add('Whole Church');renderFilterBar(userMinistries,isAdmin);renderCalendar()};
container.appendChild(btn);
});
}
function renderCalendar(){
const grid=document.getElementById('calendar-grid');
const year=currentDate.getFullYear();
const month=currentDate.getMonth();
document.getElementById('cal-month').textContent=currentDate.toLocaleString('default',{month:'long'});
document.getElementById('cal-year').textContent=String(year);
grid.innerHTML='';
['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d=>{const h=document.createElement('div');h.className='day-header';h.textContent=d;grid.appendChild(h)});
const firstDay=new Date(year,month,1).getDay();
const daysInMonth=new Date(year,month+1,0).getDate();
const prevDays=new Date(year,month,0).getDate();
for(let i=0;i<firstDay;i++){const cell=document.createElement('div');cell.className='day-cell other-month';cell.innerHTML='<div class="day-number">'+(prevDays-firstDay+1+i)+'</div>';grid.appendChild(cell)}
for(let day=1;day<=daysInMonth;day++){
const cell=document.createElement('div');
cell.className='day-cell';
const dateStr=year+'-'+String(month+1).padStart(2,'0')+'-'+String(day).padStart(2,'0');
cell.innerHTML='<div class="day-number">'+day+'</div>';
const dayEvents=allEvents.filter(ev=>ev.date===dateStr&&selectedFilters.has(ev.ministry));
const maxShow=2;
dayEvents.slice(0,maxShow).forEach(ev=>{
const evEl=document.createElement('div');
evEl.className='event';
evEl.style.background=getMinistryColor(ev.ministry);
if(ev.ministry==='Music Ministry'){
var nm=ev.groupName||((ev.assignedPeople&&ev.assignedPeople.length)?ev.assignedPeople.map(function(p){return p.name}).join(', '):(ev.assignedToName||''));
var sg=ev.song||'';
if(!nm||!sg){var t=ev.title||'';var parts=t.split(' — ');if(!nm)nm=parts[0]||t;if(!sg&&parts.length>1)sg=parts.slice(1).join(' — ');}
evEl.innerHTML='<span class="ev-name">'+escapeHtml(nm)+'</span>'+(sg?'<span class="ev-song">'+escapeHtml(sg)+'</span>':'');
}else{evEl.textContent=(ev.time?formatEventTime(ev.time)+' · ':'')+(ev.title||'');}
cell.appendChild(evEl);
});
if(dayEvents.length>maxShow){const more=document.createElement('div');more.className='event-more';more.textContent='+'+(dayEvents.length-maxShow)+' more';cell.appendChild(more)}
cell.onclick=()=>showDayEvents(dateStr,dayEvents);
grid.appendChild(cell);
}
}
function showDayEvents(dateStr,events){
const modal=document.getElementById('day-modal');
const titleEl=document.getElementById('day-modal-title');
const eventsEl=document.getElementById('day-modal-events');
const parts=dateStr.split('-');
const d=new Date(parseInt(parts[0]),parseInt(parts[1])-1,parseInt(parts[2]));
titleEl.textContent=d.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});
eventsEl.innerHTML='';
if(!events||!events.length){eventsEl.innerHTML='<p style="color:#666">No events on this day.</p>'}
else{events.forEach(ev=>{
const div=document.createElement('div');
div.className='day-event';
const color=getMinistryColor(ev.ministry);
let extra='';
if(ev.ministry==='Music Ministry'){
var nm=escapeHtml(ev.groupName||'')||((ev.assignedPeople&&ev.assignedPeople.length)?ev.assignedPeople.map(function(p){return escapeHtml(p.name)}).join(', '):escapeHtml(ev.assignedToName||''));
var sg=escapeHtml(ev.song||'');
if(!nm||!sg){var t=ev.title||'';var p2=t.split(' — ');if(!nm)nm=escapeHtml(p2[0]||t);if(!sg&&p2.length>1)sg=escapeHtml(p2.slice(1).join(' — '));}
if(ev.groupName&&ev.assignedPeople&&ev.assignedPeople.length)extra+='<div style="margin-top:6px;font-size:.85rem">Members: '+ev.assignedPeople.map(function(p){return escapeHtml(p.name)}).join(', ')+'</div>';
if(ev.songLeadName)extra+='<div style="margin-top:4px;font-size:.85rem">Song lead: '+escapeHtml(ev.songLeadName)+'</div>';
if(ev.assignmentStatus)extra+='<div style="margin-top:6px;font-size:.85rem">Status: '+escapeHtml(ev.assignmentStatus)+'</div>';
div.innerHTML='<strong style="display:block">'+nm+'</strong>'+(sg?'<div style="margin-top:4px">'+sg+'</div>':'')+extra+'<div class="ministry-tag" style="background:'+color+'">'+(ev.ministry||'')+'</div>';
}else{
if(ev.assignedToName)extra+='<div style="margin-top:6px;font-size:.85rem">Assigned: '+escapeHtml(ev.assignedToName)+'</div>';
div.innerHTML='<strong>'+escapeHtml(ev.title||'')+'</strong>'+(ev.time?'<div style="margin-top:4px;color:#7a8fac;font-size:.9rem">'+escapeHtml(formatEventTime(ev.time))+'</div>':'')+(ev.description?'<div style="margin-top:6px;color:#555">'+escapeHtml(ev.description)+'</div>':'')+extra+'<div class="ministry-tag" style="background:'+color+'">'+(ev.ministry||'')+'</div>';
}
if(canEditEvent(ev)){
  var actions=document.createElement('div');
  actions.style.cssText='display:flex;gap:8px;margin-top:10px';
  actions.innerHTML='<button type="button" style="flex:1;padding:8px;border-radius:10px;border:none;background:#4cb8b9;color:#fff;font-weight:700;cursor:pointer" onclick="startEditEvent(\''+ev.id+'\')">Edit</button><button type="button" style="flex:1;padding:8px;border-radius:10px;border:none;background:#c0392b;color:#fff;font-weight:700;cursor:pointer" onclick="deleteEvent(\''+ev.id+'\')">Delete</button>';
  div.appendChild(actions);
}
eventsEl.appendChild(div);
})}
modal.classList.add('open');
}
async function loadEvents(){
try{const snapshot=await db.collection('events').get();allEvents=[];snapshot.forEach(doc=>allEvents.push({id:doc.id,...doc.data()}));renderCalendar()}
catch(err){console.error(err);renderCalendar()}
}
