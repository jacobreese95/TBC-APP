function onMinistryChange(){
const ministry=document.getElementById('event-ministry').value;
const extra=document.getElementById('schedule-extra');
const songWrap=document.getElementById('songFieldWrap');
const titleEl=document.getElementById('event-title');
const descEl=document.getElementById('event-desc');
const isMusic=ministry==='Music Ministry';
const isMedia=ministry==='Media';
const isSchedule=SCHEDULE_MINISTRIES.includes(ministry);
if(isSchedule){extra.classList.add('visible');songWrap.style.display=isMusic?'block':'none';}
else{extra.classList.remove('visible');clearSelectedPeople();document.getElementById('event-song').value='';}
// Hide title + description for Music and Media (roles/people carry the info)
if(titleEl) titleEl.style.display=(isMusic||isMedia)?'none':'block';
if(descEl) descEl.style.display=(isMusic||isMedia)?'none':'block';
if(isMusic||isMedia){
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
else if(selectedPeople.length>=2){
var uids=selectedPeople.map(function(p){return p.uid}).sort().join(',');
var matched=savedGroups.find(function(g){
var mu=(g.memberUids||[]).slice().sort().join(',');
if(mu===uids)return true;
if(g.members&&g.members.length){var mu2=g.members.map(function(m){return m.uid}).sort().join(',');return mu2===uids;}
return false;
});
var gn=document.getElementById('event-group-name');
if(matched){selectedGroupId=matched.id;if(gn&&(!gn.value.trim()||gn.value.trim()===matched.name))gn.value=matched.name||'';}
}
const ministry=document.getElementById('event-ministry').value;
if(ministry==='Music Ministry'&&selectedPeople.length===1){
const p=selectedPeople[0];
const wrap=document.getElementById('knownSongsWrap');
const chips=document.getElementById('knownSongs');
if(p.songs&&p.songs.length){
wrap.style.display='block';
chips.innerHTML=p.songs.map(s=>'<button type="button" onclick="document.getElementById(\'event-song\').value=\''+String(s).replace(/'/g,"\\'")+'\'">'+escapeHtml(s)+'</button>').join('');
}else{wrap.style.display='none';chips.innerHTML=''}
}else{document.getElementById('knownSongsWrap').style.display='none';}
}
function selectPerson(uid){
const p=directory.find(x=>x.uid===uid);
if(!p)return;
if(selectedPeople.some(x=>x.uid===uid))return;
selectedPeople.push(p);
document.getElementById('personSearch').value='';
document.getElementById('personResults').classList.remove('open');
renderSelectedPeople();
}
function bindPersonSearch(){
const input=document.getElementById('personSearch');
const results=document.getElementById('personResults');
if(!input||input.dataset.bound==='1')return;
input.dataset.bound='1';
function showMatches(){
const q=input.value.trim().toLowerCase();
if(!q){results.classList.remove('open');results.innerHTML='';return}
const peopleMatches=directory.filter(p=>(p.name.toLowerCase().indexOf(q)!==-1||(p.email&&p.email.toLowerCase().indexOf(q)!==-1))&&!selectedPeople.some(s=>s.uid===p.uid)).slice(0,10);
const groupMatches=savedGroups.filter(g=>(g.name||'').toLowerCase().indexOf(q)!==-1).slice(0,8);
let html='';
if(groupMatches.length){html+='<div style="padding:8px 14px;font-size:.75rem;font-weight:700;color:#8845a5;background:#f5eef8">Groups</div>';html+=groupMatches.map(g=>'<div class="person-result-item" data-gid="'+g.id+'"><strong>'+escapeHtml(g.name)+'</strong> <span style="color:#7a8fac;font-size:.85rem">('+(g.members||g.memberUids||[]).length+' people)</span></div>').join('');}
if(peopleMatches.length){html+='<div style="padding:8px 14px;font-size:.75rem;font-weight:700;color:#4cb8b9;background:#eef8f8">People</div>';html+=peopleMatches.map(p=>'<div class="person-result-item" data-uid="'+p.uid+'">'+escapeHtml(p.name)+'</div>').join('');}
if(!html){results.innerHTML='<div style="color:#7a8fac;padding:12px">No matches</div>';results.classList.add('open');return}
results.innerHTML=html;
results.querySelectorAll('.person-result-item[data-uid]').forEach(function(el){
el.addEventListener('touchstart',function(e){e.preventDefault();selectPerson(el.getAttribute('data-uid'));},{passive:false});
el.addEventListener('mousedown',function(e){e.preventDefault();selectPerson(el.getAttribute('data-uid'));});
});
results.querySelectorAll('.person-result-item[data-gid]').forEach(function(el){
el.addEventListener('touchstart',function(e){e.preventDefault();selectSavedGroup(el.getAttribute('data-gid'));},{passive:false});
el.addEventListener('mousedown',function(e){e.preventDefault();selectSavedGroup(el.getAttribute('data-gid'));});
});
results.classList.add('open');
}
input.addEventListener('input',showMatches);
input.addEventListener('focus',function(){if(input.value.trim())showMatches();});
document.addEventListener('click',function(e){if(!e.target.closest('.person-wrap'))results.classList.remove('open')});
}
