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
