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
}else{evEl.textContent=ev.title||'';}
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
div.innerHTML='<strong>'+escapeHtml(ev.title||'')+'</strong>'+(ev.description?'<div style="margin-top:6px;color:#555">'+escapeHtml(ev.description)+'</div>':'')+extra+'<div class="ministry-tag" style="background:'+color+'">'+(ev.ministry||'')+'</div>';
}
eventsEl.appendChild(div);
})}
modal.classList.add('open');
}
async function loadEvents(){
try{const snapshot=await db.collection('events').get();allEvents=[];snapshot.forEach(doc=>allEvents.push({id:doc.id,...doc.data()}));renderCalendar()}
catch(err){console.error(err);renderCalendar()}
}
