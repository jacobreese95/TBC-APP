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
savedGroups=[];
try{
  const snap=await db.collection('musicGroups').get();
  snap.forEach(function(doc){
    const d=doc.data()||{};
    savedGroups.push({
      id:doc.id,
      name:d.name||'',
      memberUids:d.memberUids||[],
      members:d.members||[],
      songLeadUid:d.songLeadUid||null,
      songLeadName:d.songLeadName||null,
      songs:Array.isArray(d.songs)?d.songs:[]
    });
  });
}catch(e){console.warn('musicGroups load failed',e)}
try{
  if(auth.currentUser){
    const snap2=await db.collection('users').doc(auth.currentUser.uid).collection('savedMusicGroups').get();
    snap2.forEach(function(doc){
      const d=doc.data()||{};
      if(savedGroups.some(function(g){return g.id===doc.id||(g.name||'').toLowerCase()===(d.name||'').toLowerCase()}))return;
      savedGroups.push({
        id:doc.id,
        name:d.name||'',
        memberUids:d.memberUids||[],
        members:d.members||[],
        songLeadUid:d.songLeadUid||null,
        songLeadName:d.songLeadName||null,
        songs:Array.isArray(d.songs)?d.songs:[],
        _local:true
      });
    });
  }
}catch(e2){console.warn('user savedMusicGroups load failed',e2)}
savedGroups.sort(function(a,b){return (a.name||'').localeCompare(b.name||'')});
}
function selectSavedGroup(groupId){
const g=savedGroups.find(x=>x.id===groupId);
if(!g)return;
selectedGroupId=g.id;
var gn=document.getElementById('event-group-name');
if(gn)gn.value=g.name||'';
var gr=document.getElementById('groupNameResults');
if(gr)gr.classList.remove('open');
var pr=document.getElementById('personResults');if(pr)pr.classList.remove('open');
var ps=document.getElementById('personSearch');if(ps)ps.value='';
selectedPeople=[];
const members=(g.members&&g.members.length)?g.members.slice():(g.memberUids||[]).map(uid=>{const p=directory.find(d=>d.uid===uid);return p?{uid:p.uid,name:p.name}:{uid:uid,name:uid}});
if(g.songLeadUid){members.sort((a,b)=>a.uid===g.songLeadUid?-1:b.uid===g.songLeadUid?1:0);}
members.forEach(m=>{const p=directory.find(d=>d.uid===m.uid)||{uid:m.uid,name:m.name,songs:[]};if(!selectedPeople.some(x=>x.uid===p.uid))selectedPeople.push(p);});
renderSelectedPeople();
var wrap=document.getElementById('knownSongsWrap');
var chips=document.getElementById('knownSongs');
if(wrap&&chips){
  if(g.songs&&g.songs.length){
    wrap.style.display='block';
    chips.innerHTML=g.songs.map(function(s){
      return '<button type="button" onclick="document.getElementById(\'event-song\').value=\''+String(s).replace(/'/g,"\\'")+'\'">'+escapeHtml(s)+'</button>';
    }).join('');
  }else{
    wrap.style.display='none';
    chips.innerHTML='';
  }
}
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
groupName=(groupName||'').trim();
if(!groupName) throw new Error('Group name is empty');
if(!people||people.length<2) throw new Error('Need at least 2 people to save a group');
const payload={
  name:groupName,
  memberUids:people.map(function(p){return p.uid}),
  members:people.map(function(p){return {uid:p.uid,name:p.name}}),
  songLeadUid:songLead?songLead.uid:people[0].uid,
  songLeadName:songLead?songLead.name:people[0].name,
  updatedAt:firebase.firestore.FieldValue.serverTimestamp()
};
let groupId=selectedGroupId||null;
let existing=null;
if(groupId){
  existing=savedGroups.find(function(g){return g.id===groupId})||null;
}
if(!existing){
  existing=savedGroups.find(function(g){return (g.name||'').toLowerCase()===groupName.toLowerCase()})||null;
  if(existing) groupId=existing.id;
}
const songs=(existing&&Array.isArray(existing.songs))?existing.songs.slice():[];
if(song&&songs.indexOf(song)===-1) songs.push(song);
payload.songs=songs;

var savedOk=false;
var lastErr=null;

try{
  if(groupId&&!(existing && existing._local)){
    await db.collection('musicGroups').doc(groupId).set(payload,{merge:true});
    savedOk=true;
  }else{
    try{
      const qs=await db.collection('musicGroups').where('name','==',groupName).limit(1).get();
      if(!qs.empty){
        groupId=qs.docs[0].id;
        const d=qs.docs[0].data()||{};
        const songs2=Array.isArray(d.songs)?d.songs.slice():songs.slice();
        if(song&&songs2.indexOf(song)===-1) songs2.push(song);
        payload.songs=songs2;
        await db.collection('musicGroups').doc(groupId).set(payload,{merge:true});
        savedOk=true;
      }
    }catch(qe){console.warn(qe)}
    if(!savedOk){
      payload.createdAt=firebase.firestore.FieldValue.serverTimestamp();
      payload.createdByUid=auth.currentUser?auth.currentUser.uid:null;
      const ref=await db.collection('musicGroups').add(payload);
      groupId=ref.id;
      savedOk=true;
    }
  }
}catch(e){
  lastErr=e;
  console.error('top-level musicGroups write failed',e);
}

try{
  if(auth.currentUser){
    var localId=groupId||('g_'+groupName.toLowerCase().replace(/[^a-z0-9]+/g,'_').slice(0,40));
    await db.collection('users').doc(auth.currentUser.uid).collection('savedMusicGroups').doc(localId).set(payload,{merge:true});
    if(!groupId) groupId=localId;
    savedOk=true;
  }
}catch(e2){
  lastErr=e2;
  console.error('user savedMusicGroups write failed',e2);
}

if(groupId){
  for(var i=0;i<people.length;i++){
    try{
      await db.collection('users').doc(people[i].uid).set({
        musicGroupIds:firebase.firestore.FieldValue.arrayUnion(groupId),
        musicGroupNames:firebase.firestore.FieldValue.arrayUnion(groupName)
      },{merge:true});
    }catch(e3){console.warn(e3)}
  }
}

await loadSavedGroups();
selectedGroupId=groupId;
if(!savedOk){
  throw lastErr||new Error('Could not save group (check Firestore rules for musicGroups)');
}
return groupId;
}
