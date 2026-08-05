async function addEvent(){
if(!currentProfile)return;
const date=document.getElementById('event-date').value;
let title=document.getElementById('event-title').value.trim();
const desc=document.getElementById('event-desc').value.trim();
const ministry=document.getElementById('event-ministry').value;
const isSchedule=SCHEDULE_MINISTRIES.includes(ministry);
const isMusic=ministry==='Music Ministry';
const song=(document.getElementById('event-song')&&document.getElementById('event-song').value||'').trim();
const groupName=(document.getElementById('event-group-name')&&document.getElementById('event-group-name').value||'').trim();
if(!date){alert('Please enter a date');return}
if(isMusic){
if(!selectedPeople.length){alert('Please assign at least one person who will sing.');return}
if(selectedPeople.length>=2&&!groupName){alert('Please enter a group name for this assignment.');return}
if(selectedPeople.length>=2){title=groupName+(song?' — '+song:'');}
else{title=selectedPeople.map(p=>p.name).join(', ')+(song?' — '+song:'');}
}else if(ministry==='Media'||ministry==='Nursery'||ministry==='Sentry'){
// Handled by calendar-media-roles.js / calendar-nursery-roles.js / calendar-sentry-roles.js
}else if(!title){alert('Please enter a date and title');return}
const isAdmin=currentProfile.role==='admin';
const leaderOf=currentProfile.leaderOf||[];
if(!isAdmin&&!leaderOf.includes(ministry)){alert('You can only create events for ministries you lead.');return}
if(isSchedule&&ministry!=='Media'&&ministry!=='Nursery'&&ministry!=='Sentry'&&!selectedPeople.length){alert('Please assign at least one person for this schedule.');return}
try{
const eventData={date,title,description:isMusic?'':desc,ministry,createdByUid:auth.currentUser.uid,createdByName:currentProfile.name||currentProfile.email||'Leader',createdAt:firebase.firestore.FieldValue.serverTimestamp()};
if(isSchedule&&selectedPeople.length){
eventData.assignedToUid=selectedPeople[0].uid;
eventData.assignedToName=selectedPeople.length>=2&&groupName?groupName:selectedPeople.map(p=>p.name).join(', ');
eventData.assignedPeople=selectedPeople.map(p=>({uid:p.uid,name:p.name}));
eventData.assignmentStatus='pending';
eventData.songLeadUid=selectedPeople[0].uid;
eventData.songLeadName=selectedPeople[0].name;
if(selectedPeople.length>=2&&groupName)eventData.groupName=groupName;
}
if(isMusic&&song)eventData.song=song;
const eventRef=await db.collection('events').add(eventData);
if(isMusic&&groupName&&selectedPeople.length>=2){
const gid=await saveOrUpdateMusicGroup(groupName,selectedPeople,selectedPeople[0],song||null);
if(gid){try{await eventRef.update({musicGroupId:gid})}catch(e){}}
}
if(isSchedule&&selectedPeople.length){
for(let pi=0;pi<selectedPeople.length;pi++){
const person=selectedPeople[pi];
const isSongLead=isMusic&&(pi===0);
await db.collection('scheduleRequests').add({eventId:eventRef.id,date,title,ministry,song:song||null,groupName:groupName||null,assignedToUid:person.uid,assignedToName:person.name,isSongLead:!!isSongLead,createdByUid:auth.currentUser.uid,createdByName:currentProfile.name||currentProfile.email||'Leader',status:'pending',createdAt:firebase.firestore.FieldValue.serverTimestamp()});
if(isMusic&&song&&isSongLead){try{await db.collection('users').doc(person.uid).update({songs:firebase.firestore.FieldValue.arrayUnion(song)})}catch(e){}}
}
}
alert(isSchedule?'Event added. Group/people saved. Song lead: '+selectedPeople[0].name:'Event added!');
document.getElementById('event-date').value='';
document.getElementById('event-title').value='';
document.getElementById('event-desc').value='';
if(document.getElementById('event-song'))document.getElementById('event-song').value='';
clearSelectedPeople();
await loadEvents();
}catch(err){alert('Error: '+err.message)}
}
function loadMyRequests(){
if(!auth.currentUser)return;
const uid=auth.currentUser.uid;
db.collection('scheduleRequests').where('assignedToUid','==',uid).where('status','==','pending').onSnapshot(function(snap){
const section=document.getElementById('my-requests-section');
const list=document.getElementById('my-requests-list');
if(snap.empty){section.style.display='none';list.innerHTML='';return}
section.style.display='block';
const items=[];snap.forEach(doc=>items.push({id:doc.id,...doc.data()}));
items.sort((a,b)=>(a.date||'').localeCompare(b.date||''));
list.innerHTML=items.map(function(r){
var isMusic=r.ministry==='Music Ministry';
var isSongLead=!!r.isSongLead||(isMusic&&!r.groupName);
var songBlock='';
if(isMusic&&isSongLead){
songBlock='<label class="form-label" for="req-song-'+r.id+'">Song for this assignment *</label><input type="text" id="req-song-'+r.id+'" class="form-input" placeholder="Enter the song" value="'+escapeHtml(r.song||'')+'"><p style="font-size:.8rem;color:#7a8fac;margin:0 0 8px">You are the song lead (not an app leader). Enter the song when you accept.</p>';
}else if(isMusic&&r.groupName){
songBlock='<p style="font-size:.85rem;color:#7a8fac;margin:0 0 8px">The song lead will choose the song. You only need to confirm availability.</p>';
}
return '<div class="req-card"><h4>'+escapeHtml(r.groupName||r.title||'Schedule')+(isSongLead&&r.groupName?' <span style="font-size:.75rem;background:#8845a5;color:#fff;border-radius:6px;padding:2px 8px">Song lead</span>':'')+(r.role?' <span style="font-size:.75rem;background:#4cb8b9;color:#fff;border-radius:6px;padding:2px 8px">'+escapeHtml(r.role)+'</span>':'')+'</h4><div style="font-size:.85rem;color:#7a8fac;margin-bottom:8px">'+escapeHtml(r.ministry||'')+' · '+escapeHtml(r.date||'')+(r.role?' · '+escapeHtml(r.role):'')+'</div>'+songBlock+'<p>Are you available?</p><div class="req-actions"><button type="button" class="btn-available" onclick="respondRequest(\''+r.id+'\',\'available\',\''+(r.eventId||'')+'\',\''+escapeHtml(r.ministry||'')+'\','+(isSongLead?'true':'false')+')">Available</button><button type="button" class="btn-unavailable" onclick="respondRequest(\''+r.id+'\',\'unavailable\',\''+(r.eventId||'')+'\',\''+escapeHtml(r.ministry||'')+'\',false)">Not available</button></div></div>';
}).join('');
},function(err){console.error(err)});
}
async function respondRequest(requestId,status,eventId,ministry,isSongLead){
try{
var song='';
if(ministry==='Music Ministry'&&status==='available'&&isSongLead){
var songInput=document.getElementById('req-song-'+requestId);
song=(songInput&&songInput.value||'').trim();
if(!song){alert('Please enter the song before accepting.');return}
}
var updates={status:status,respondedAt:firebase.firestore.FieldValue.serverTimestamp()};
if(song)updates.song=song;
await db.collection('scheduleRequests').doc(requestId).update(updates);
if(eventId){
var eventUpdates={assignmentStatus:status};
if(song){eventUpdates.song=song;var ed=(await db.collection('events').doc(eventId).get()).data()||{};eventUpdates.title=(ed.groupName||ed.assignedToName||'')+' — '+song;}
try{await db.collection('events').doc(eventId).update(eventUpdates)}catch(e){}
}
if(song&&auth.currentUser){try{await db.collection('users').doc(auth.currentUser.uid).update({songs:firebase.firestore.FieldValue.arrayUnion(song)})}catch(e){}}
if(song&&eventId){
try{
var ed2=(await db.collection('events').doc(eventId).get()).data()||{};
if(ed2.musicGroupId){await db.collection('musicGroups').doc(ed2.musicGroupId).update({songs:firebase.firestore.FieldValue.arrayUnion(song)})}
else if(ed2.groupName){
var gs=await db.collection('musicGroups').where('name','==',ed2.groupName).limit(1).get();
if(!gs.empty){await gs.docs[0].ref.update({songs:firebase.firestore.FieldValue.arrayUnion(song)})}
}
}catch(e){console.warn(e)}
}
alert(status==='available'?'Marked available. Thank you!':'Marked not available.');
}catch(err){alert('Error: '+err.message)}
}
function prevMonth(){currentDate.setMonth(currentDate.getMonth()-1);renderCalendar()}
function nextMonth(){currentDate.setMonth(currentDate.getMonth()+1);renderCalendar()}
requireApprovedUser().then(profile=>{
if(profile){
currentProfile=profile;
renderFilterBar(profile.ministries||[],profile.role==='admin');
setupAddEventForm(profile);
bindPersonSearch();
loadMyRequests();
loadEvents();
}
});
