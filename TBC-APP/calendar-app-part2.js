async function addEvent(){
if(!currentProfile)return;
const date=document.getElementById('event-date').value;
const timeEl=document.getElementById('event-time');
const time=(timeEl&&timeEl.value)?timeEl.value:'';
const title=document.getElementById('event-title').value.trim();
const desc=document.getElementById('event-desc').value.trim();
const ministry=document.getElementById('event-ministry').value;
const isSchedule=SCHEDULE_MINISTRIES.includes(ministry);
const isMusic=ministry==='Music Ministry';
if(!date){alert('Please pick a date.');return}
if(!isMusic&&ministry!=='Media'&&ministry!=='Nursery'&&ministry!=='Sentry'&&!title){alert('Please enter an event title.');return}
const isAdmin=currentProfile.role==='admin';
const leaderOf=currentProfile.leaderOf||[];
if(!isAdmin&&!leaderOf.includes(ministry)){alert('You can only create events for ministries you lead.');return}
if(isSchedule&&ministry!=='Media'&&ministry!=='Nursery'&&ministry!=='Sentry'&&!selectedPeople.length){alert('Please assign at least one person for this schedule.');return}
const eventData={date,title,description:isMusic?'':desc,ministry,time:time||null,createdByUid:auth.currentUser.uid,createdByName:currentProfile.name||currentProfile.email||'Leader',createdAt:firebase.firestore.FieldValue.serverTimestamp()};
if(isMusic){
  eventData.assignedPeople=selectedPeople.map(p=>({uid:p.uid,name:p.name}));
  eventData.groupName=document.getElementById('event-group-name')?document.getElementById('event-group-name').value.trim():'';
  eventData.song=document.getElementById('event-song').value.trim()||null;
}
try{
const eventRef=await db.collection('events').add(eventData);
if(isSchedule&&selectedPeople.length){
  for(const person of selectedPeople){
    const isSongLead=isMusic&&person.uid===selectedPeople[0].uid;
    const song=document.getElementById('event-song').value.trim();
    const groupName=document.getElementById('event-group-name')?document.getElementById('event-group-name').value.trim():'';
    await db.collection('scheduleRequests').add({eventId:eventRef.id,date,title,ministry,song:song||null,groupName:groupName||null,assignedToUid:person.uid,assignedToName:person.name,isSongLead:!!isSongLead,createdByUid:auth.currentUser.uid,createdByName:currentProfile.name||currentProfile.email||'Leader',status:'pending',createdAt:firebase.firestore.FieldValue.serverTimestamp()});
  }
}
document.getElementById('event-date').value='';
if(document.getElementById('event-time'))document.getElementById('event-time').value='';
document.getElementById('event-title').value='';
document.getElementById('event-desc').value='';
if(document.getElementById('event-song'))document.getElementById('event-song').value='';
clearSelectedPeople();
await loadEvents();
alert('Event added.');
}catch(e){alert('Error: '+(e.message||e));}
}
