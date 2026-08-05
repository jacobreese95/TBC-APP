function setupAddEventForm(profile){
const section=document.getElementById('add-event-section');
const select=document.getElementById('event-ministry');
const hint=document.getElementById('add-event-hint');
const isAdmin=profile.role==='admin';
const isLeader=profile.role==='leader';
const leaderOf=Array.isArray(profile.leaderOf)?profile.leaderOf.slice():[];
let allowed=[];
if(isAdmin){allowed=allMinistries.slice();hint.textContent='As an admin you can create events for any ministry.'}
else if(isLeader&&leaderOf.length){allowed=leaderOf.filter(m=>allMinistries.includes(m));if(!allowed.length)allowed=leaderOf.slice();hint.textContent='You can create events for: '+allowed.join(', ')}
else{section.style.display='none';return}
if(!allowed.length){section.style.display='none';return}
select.innerHTML=allowed.map(m=>'<option value="'+m.replace(/"/g,'"')+'">'+m+'</option>').join('');
section.style.display='block';
onMinistryChange();
loadDirectory();
loadSavedGroups();
bindGroupNameSearch();
}
async function loadDirectory(){
try{
const snap=await db.collection('users').where('approved','==',true).get();
directory=[];
snap.forEach(doc=>{const d=doc.data();directory.push({uid:doc.id,name:d.name||d.email||'Member',email:d.email||'',songs:Array.isArray(d.songs)?d.songs:[]})});
directory.sort((a,b)=>a.name.localeCompare(b.name));
}catch(err){
try{
const snap=await db.collection('users').get();
directory=[];
snap.forEach(doc=>{const d=doc.data();if(d.approved===false)return;directory.push({uid:doc.id,name:d.name||d.email||'Member',email:d.email||'',songs:Array.isArray(d.songs)?d.songs:[]})});
directory.sort((a,b)=>a.name.localeCompare(b.name));
}catch(e2){console.error(e2)}
}
}
async function loadSavedGroups(){
try{
const snap=await db.collection('musicGroups').get();
savedGroups=[];
snap.forEach(doc=>{const d=doc.data();savedGroups.push({id:doc.id,name:d.name||'',memberUids:d.memberUids||[],members:d.members||[],songLeadUid:d.songLeadUid||null,songLeadName:d.songLeadName||null,songs:Array.isArray(d.songs)?d.songs:[]})});
savedGroups.sort((a,b)=>a.name.localeCompare(b.name));
}catch(e){console.warn(e);savedGroups=[]}
}
function selectSavedGroup(groupId){
const g=savedGroups.find(x=>x.id===groupId);
if(!g)return;
selectedGroupId=g.id;
document.getElementById('event-group-name').value=g.name||'';
document.getElementById('groupNameResults').classList.remove('open');
var pr=document.getElementById('personResults');if(pr)pr.classList.remove('open');
var ps=document.getElementById('personSearch');if(ps)ps.value='';
selectedPeople=[];
const members=(g.members&&g.members.length)?g.members.slice():(g.memberUids||[]).map(uid=>{const p=directory.find(d=>d.uid===uid);return p?{uid:p.uid,name:p.name}:{uid:uid,name:uid}});
if(g.songLeadUid){members.sort((a,b)=>a.uid===g.songLeadUid?-1:b.uid===g.songLeadUid?1:0);}
members.forEach(m=>{const p=directory.find(d=>d.uid===m.uid)||{uid:m.uid,name:m.name,songs:[]};if(!selectedPeople.some(x=>x.uid===p.uid))selectedPeople.push(p);});
renderSelectedPeople();
}
function bindGroupNameSearch(){
const input=document.getElementById('event-group-name');
const results=document.getElementById('groupNameResults');
if(!input||input.dataset.bound==='1')return;
input.dataset.bound='1';
function showGroupMatches(){
const q=input.value.trim().toLowerCase();
selectedGroupId=null;
if(!q){results.classList.remove('open');results.innerHTML='';return}
const matches=savedGroups.filter(g=>(g.name||'').toLowerCase().indexOf(q)!==-1).slice(0,12);
if(!matches.length){results.innerHTML='<div style="color:#7a8fac">No saved group — keep typing to create a new one</div>';results.classList.add('open');return}
results.innerHTML=matches.map(g=>'<div class="person-result-item" data-gid="'+g.id+'"><strong>'+escapeHtml(g.name)+'</strong> <span style="color:#7a8fac;font-size:.85rem">('+(g.members||g.memberUids||[]).length+' people)</span></div>').join('');
results.querySelectorAll('.person-result-item').forEach(function(el){
el.addEventListener('touchstart',function(e){e.preventDefault();selectSavedGroup(el.getAttribute('data-gid'));},{passive:false});
el.addEventListener('mousedown',function(e){e.preventDefault();selectSavedGroup(el.getAttribute('data-gid'));});
});
results.classList.add('open');
}
input.addEventListener('input',showGroupMatches);
input.addEventListener('focus',function(){if(input.value.trim())showGroupMatches();});
document.addEventListener('click',function(e){if(!e.target.closest('#groupNameInner'))results.classList.remove('open')});
}
async function saveOrUpdateMusicGroup(groupName,people,songLead,song){
if(!groupName||!people||people.length<2)return null;
const payload={name:groupName,memberUids:people.map(p=>p.uid),members:people.map(p=>({uid:p.uid,name:p.name})),songLeadUid:songLead?songLead.uid:people[0].uid,songLeadName:songLead?songLead.name:people[0].name,updatedAt:firebase.firestore.FieldValue.serverTimestamp()};
let groupId=selectedGroupId;
try{
if(groupId){
const existing=savedGroups.find(g=>g.id===groupId);
const songs=existing&&Array.isArray(existing.songs)?existing.songs.slice():[];
if(song&&!songs.includes(song))songs.push(song);
payload.songs=songs;
await db.collection('musicGroups').doc(groupId).set(payload,{merge:true});
}else{
const existingByName=savedGroups.find(g=>(g.name||'').toLowerCase()===groupName.toLowerCase());
if(existingByName){
groupId=existingByName.id;
const songs=Array.isArray(existingByName.songs)?existingByName.songs.slice():[];
if(song&&!songs.includes(song))songs.push(song);
payload.songs=songs;
await db.collection('musicGroups').doc(groupId).set(payload,{merge:true});
}else{
payload.songs=song?[song]:[];
payload.createdAt=firebase.firestore.FieldValue.serverTimestamp();
payload.createdByUid=auth.currentUser.uid;
const ref=await db.collection('musicGroups').add(payload);
groupId=ref.id;
}
}
for(const person of people){
try{await db.collection('users').doc(person.uid).set({musicGroupIds:firebase.firestore.FieldValue.arrayUnion(groupId),musicGroupNames:firebase.firestore.FieldValue.arrayUnion(groupName)},{merge:true});}catch(e){console.warn(e)}
}
await loadSavedGroups();
selectedGroupId=groupId;
return groupId;
}catch(e){console.error(e);return null}
}
