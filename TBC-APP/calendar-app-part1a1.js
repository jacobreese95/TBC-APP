function formatEventTime(t){if(!t)return '';var p=String(t).split(':');var h=parseInt(p[0],10);var m=p[1]||'00';if(isNaN(h))return t;var ap=h>=12?'PM':'AM';var h12=h%12;if(h12===0)h12=12;return h12+':'+m+' '+ap;}
function escapeHtml(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function closeDayModal(){document.getElementById('day-modal').classList.remove('open')}
function getMinistryColor(m){return ministryColors[m]||'#4cb8b9'}
function renderCalendar(){
const year=currentDate.getFullYear();
const month=currentDate.getMonth();
document.getElementById('cal-month').textContent=currentDate.toLocaleString('default',{month:'long'});
document.getElementById('cal-year').textContent=String(year);
const grid=document.getElementById('calendar-grid');
grid.innerHTML='';
['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d=>{const h=document.createElement('div');h.className='day-header';h.textContent=d;grid.appendChild(h)});
const firstDay=new Date(year,month,1).getDay();
const daysInMonth=new Date(year,month+1,0).getDate();
for(let i=0;i<firstDay;i++){const empty=document.createElement('div');empty.className='day empty';grid.appendChild(empty)}
for(let day=1;day<=daysInMonth;day++){
const cell=document.createElement('div');
cell.className='day';
const dateStr=year+'-'+String(month+1).padStart(2,'0')+'-'+String(day).padStart(2,'0');
const num=document.createElement('div');num.className='day-number';num.textContent=day;cell.appendChild(num);
const dayEvents=allEvents.filter(ev=>ev.date===dateStr&&selectedFilters.has(ev.ministry));
const maxShow=3;
dayEvents.slice(0,maxShow).forEach(ev=>{
const evEl=document.createElement('div');
evEl.className='event';
evEl.style.background=getMinistryColor(ev.ministry);
if(ev.ministry==='Music Ministry'){
var nm=ev.groupName||(ev.assignedPeople&&ev.assignedPeople.map(p=>p.name).join(', '))||ev.assignedToName||'';
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
const d=new Date(parseInt(parts[0],10),parseInt(parts[1],10)-1,parseInt(parts[2],10));
titleEl.textContent=d.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'});
eventsEl.innerHTML='';
if(!events||!events.length){eventsEl.innerHTML='<p style="color:#666">No events on this day.</p>'}
else{events.forEach(ev=>{
const div=document.createElement('div');
div.className='day-event';
const color=getMinistryColor(ev.ministry);
var extra='';
if(ev.ministry==='Music Ministry'){
var nm=escapeHtml(ev.groupName||ev.assignedToName||'');
var sg=escapeHtml(ev.song||'');
if(!nm||!sg){var t=ev.title||'';var p2=t.split(' — ');if(!nm)nm=escapeHtml(p2[0]||t);if(!sg&&p2.length>1)sg=escapeHtml(p2.slice(1).join(' — '));}
extra=(nm?'<div style="margin-top:4px">'+nm+'</div>':'')+(sg?'<div style="color:#8845a5">'+sg+'</div>':'');
div.innerHTML='<strong>'+escapeHtml(ev.title||'')+'</strong>'+extra+'<div class="ministry-tag" style="background:'+color+'">'+(ev.ministry||'')+'</div>';
}else{
div.innerHTML='<strong>'+escapeHtml(ev.title||'')+'</strong>'+(ev.time?'<div style="margin-top:4px;color:#7a8fac;font-size:.9rem">'+escapeHtml(formatEventTime(ev.time))+'</div>':'')+(ev.description?'<div style="margin-top:6px;color:#555">'+escapeHtml(ev.description)+'</div>':'')+extra+'<div class="ministry-tag" style="background:'+color+'">'+(ev.ministry||'')+'</div>';
}
eventsEl.appendChild(div);
});}
modal.classList.add('open');
}
async function loadEvents(){
try{
const snap=await db.collection('events').get();
allEvents=[];
snap.forEach(doc=>{allEvents.push(Object.assign({id:doc.id},doc.data()))});
renderCalendar();
}catch(e){console.error(e);}
}
