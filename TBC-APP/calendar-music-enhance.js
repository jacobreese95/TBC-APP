// Music groups enhancements for calendar
(function(){
  function enhance(){
    if(typeof bindPersonSearch!=='function')return false;
    var input=document.getElementById('personSearch');
    var results=document.getElementById('personResults');
    if(!input||!results)return false;
    input.dataset.bound='0';
    var newInput=input.cloneNode(true);
    input.parentNode.replaceChild(newInput,input);
    input=newInput;
    input.dataset.bound='1';

    var dateEl=document.getElementById('event-date');
    if(dateEl&&!document.querySelector('label[for="event-date"]')){
      var lab=document.createElement('label');
      lab.className='form-label';
      lab.htmlFor='event-date';
      lab.textContent='Date *';
      dateEl.parentNode.insertBefore(lab,dateEl);
    }
    var help=document.querySelector('label[for="personSearch"]');
    if(help){
      var p=help.nextElementSibling;
      if(p&&p.tagName==='P'){
        p.innerHTML='Type a person name <strong>or a saved group name</strong> (e.g. Reese Family). First person is song lead. With 2+ people, a group name is required.';
      }
    }
    input.placeholder='Type a name or group…';

    function showMatches(){
      var q=input.value.trim().toLowerCase();
      if(!q){results.classList.remove('open');results.innerHTML='';return}
      var peopleMatches=(directory||[]).filter(function(p){
        return (p.name.toLowerCase().indexOf(q)!==-1||(p.email&&p.email.toLowerCase().indexOf(q)!==-1))&&!selectedPeople.some(function(s){return s.uid===p.uid});
      }).slice(0,10);
      var groupMatches=(savedGroups||[]).filter(function(g){return (g.name||'').toLowerCase().indexOf(q)!==-1}).slice(0,8);
      var html='';
      if(groupMatches.length){
        html+='<div style="padding:8px 14px;font-size:.75rem;font-weight:700;color:#8845a5;background:#f5eef8">Groups</div>';
        html+=groupMatches.map(function(g){return '<div class="person-result-item" data-gid="'+g.id+'"><strong>'+escapeHtml(g.name)+'</strong> <span style="color:#7a8fac;font-size:.85rem">('+(g.members||g.memberUids||[]).length+' people)</span></div>'}).join('');
      }
      if(peopleMatches.length){
        html+='<div style="padding:8px 14px;font-size:.75rem;font-weight:700;color:#4cb8b9;background:#eef8f8">People</div>';
        html+=peopleMatches.map(function(p){return '<div class="person-result-item" data-uid="'+p.uid+'">'+escapeHtml(p.name)+'</div>'}).join('');
      }
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

    if(typeof renderSelectedPeople==='function'&&!window.__groupMatchPatched){
      window.__groupMatchPatched=true;
      var orig=renderSelectedPeople;
      window.renderSelectedPeople=function(){
        orig();
        if(selectedPeople.length>=2){
          var uids=selectedPeople.map(function(p){return p.uid}).sort().join(',');
          var matched=(savedGroups||[]).find(function(g){
            var mu=(g.memberUids||[]).slice().sort().join(',');
            if(mu===uids)return true;
            if(g.members&&g.members.length){
              var mu2=g.members.map(function(m){return m.uid}).sort().join(',');
              return mu2===uids;
            }
            return false;
          });
          var gn=document.getElementById('event-group-name');
          if(matched){
            selectedGroupId=matched.id;
            if(gn&&(!gn.value.trim()||gn.value.trim()===matched.name))gn.value=matched.name||'';
          }
        }
      };
    }
    return true;
  }
  var tries=0;
  var t=setInterval(function(){
    tries++;
    if(enhance()||tries>40)clearInterval(t);
  },250);
})();
