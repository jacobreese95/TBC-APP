function onMinistryChange(){
const ministry=document.getElementById('event-ministry').value;
const extra=document.getElementById('schedule-extra');
const songWrap=document.getElementById('songFieldWrap');
const titleEl=document.getElementById('event-title');
const descEl=document.getElementById('event-desc');
const isMusic=ministry==='Music Ministry';
const isMedia=ministry==='Media';
const isNursery=ministry==='Nursery';
const isSentry=ministry==='Sentry';
const isSchedule=SCHEDULE_MINISTRIES.includes(ministry);
if(isSchedule){extra.classList.add('visible');songWrap.style.display=isMusic?'block':'none';}
else{extra.classList.remove('visible');clearSelectedPeople();document.getElementById('event-song').value='';}
if(titleEl) titleEl.style.display=(isMusic||isMedia||isNursery||isSentry)?'none':'block';
var timeWrap=document.getElementById('eventTimeWrap');
var timeEl=document.getElementById('event-time');
if(timeWrap){
  var showTime=ministry==='Whole Church';
  timeWrap.style.display=showTime?'block':'none';
  if(!showTime&&timeEl) timeEl.value='';
}
if(descEl) descEl.style.display=(isMusic||isMedia||isNursery||isSentry)?'none':'block';
if(isMusic||isMedia||isNursery||isSentry){
  if(titleEl) titleEl.value='';
  if(descEl) descEl.value='';
}else if(titleEl){
  titleEl.placeholder='Event Title';
}
}
function clearSelectedPeople(){
selectedPeople=[];
selectedGroupId=null;
document.getElementById('selectedPersonChip').innerHTML='';
document.getElementById('personSearch').value='';
document.getElementById('knownSongsWrap').style.display='none';
document.getElementById('knownSongs').innerHTML='';
var ce=document.getElementById('peopleCount');if(ce)ce.textContent='';
var gw=document.getElementById('groupNameWrap');if(gw)gw.style.display='none';
var gn=document.getElementById('event-group-name');if(gn)gn.value='';
}
function removeSelectedPerson(uid){
selectedPeople=selectedPeople.filter(p=>p.uid!==uid);
renderSelectedPeople();
}
function renderSelectedPeople(){
const box=document.getElementById('selectedPersonChip');
box.innerHTML=selectedPeople.map(function(p,i){return '<div class="person-chip">'+(i===0&&selectedPeople.length>=2?'<span style="font-size:.7rem;background:#8845a5;color:#fff;border-radius:6px;padding:1px 6px;margin-right:4px">Song lead</span>':'')+escapeHtml(p.name)+' <button type="button" onclick="removeSelectedPerson(\''+p.uid+'\')">&times;</button></div>'}).join('');
var countEl=document.getElementById('peopleCount');
if(countEl)countEl.textContent=selectedPeople.length?(selectedPeople.length===1?'1 person selected — type another name to add more':selectedPeople.length+' people selected (first is song lead)'):'';
const gWrap=document.getElementById('groupNameWrap');
if(gWrap)gWrap.style.display=selectedPeople.length>=2?'block':'none';
if(selectedPeople.length<2){var gn=document.getElementById('event-group-name');if(gn)gn.value='';selectedGroupId=null;}
}
function selectPerson(uid){
if(selectedPeople.some(p=>p.uid===uid))return;
var person=directoryUsers.find(u=>u.uid===uid);
if(!person)return;
selectedPeople.push({uid:person.uid,name:person.name||person.email||'Member'});
renderSelectedPeople();
document.getElementById('personSearch').value='';
document.getElementById('personResults').classList.remove('open');
}
function bindPersonSearch(){
var input=document.getElementById('personSearch');
var results=document.getElementById('personResults');
if(!input||!results)return;
function showMatches(){
var q=input.value.trim().toLowerCase();
if(!q){results.classList.remove('open');results.innerHTML='';return}
var matches=(directoryUsers||[]).filter(u=>{
var n=(u.name||'').toLowerCase();
var e=(u.email||'').toLowerCase();
return n.indexOf(q)!==-1||e.indexOf(q)!==-1;
}).slice(0,8);
if(!matches.length){results.innerHTML='<div style="padding:10px;color:#888">No matches</div>';results.classList.add('open');return}
results.innerHTML=matches.map(u=>'<div data-uid="'+u.uid+'">'+escapeHtml(u.name||u.email||'Member')+'</div>').join('');
results.querySelectorAll('[data-uid]').forEach(function(el){
el.addEventListener('mousedown',function(e){e.preventDefault();selectPerson(el.getAttribute('data-uid'));});
});
results.classList.add('open');
}
input.addEventListener('input',showMatches);
input.addEventListener('focus',function(){if(input.value.trim())showMatches();});
document.addEventListener('click',function(e){if(!e.target.closest('.person-wrap'))results.classList.remove('open')});
}
function showMatches(){}
