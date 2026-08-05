/**
 * Nursery ministry role slots: Worker One, Worker Two
 */
(function () {
  var NURSERY_ROLES = ['Worker One', 'Worker Two'];
  var nurseryAssignments = {};

  function esc(str) {
    if (typeof escapeHtml === 'function') return escapeHtml(str);
    return String(str || '')
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"');
  }

  function clearNurseryAssignments() {
    nurseryAssignments = {};
    NURSERY_ROLES.forEach(function (role, i) {
      var chip = document.getElementById('nurseryRole' + i + 'Chip');
      var search = document.getElementById('nurseryRole' + i + 'Search');
      var results = document.getElementById('nurseryRole' + i + 'Results');
      if (chip) chip.innerHTML = '';
      if (search) search.value = '';
      if (results) {
        results.innerHTML = '';
        results.classList.remove('open');
      }
    });
  }

  function renderNurseryRoleChip(roleIndex, role) {
    var chip = document.getElementById('nurseryRole' + roleIndex + 'Chip');
    if (!chip) return;
    var p = nurseryAssignments[role];
    if (!p) {
      chip.innerHTML = '';
      return;
    }
    chip.innerHTML =
      '<div class="media-role-chip">' +
      esc(p.name) +
      ' <button type="button" aria-label="Remove">&times;</button></div>';
    var btn = chip.querySelector('button');
    if (btn) {
      btn.addEventListener('click', function () {
        clearNurseryRole(role, roleIndex);
      });
    }
  }

  function clearNurseryRole(role, roleIndex) {
    delete nurseryAssignments[role];
    var search = document.getElementById('nurseryRole' + roleIndex + 'Search');
    if (search) search.value = '';
    renderNurseryRoleChip(roleIndex, role);
  }

  function selectNurseryPerson(role, roleIndex, uid) {
    var dir = typeof directory !== 'undefined' ? directory : [];
    var p = dir.find(function (x) {
      return x.uid === uid;
    });
    if (!p) return;
    nurseryAssignments[role] = { uid: p.uid, name: p.name };
    var search = document.getElementById('nurseryRole' + roleIndex + 'Search');
    var results = document.getElementById('nurseryRole' + roleIndex + 'Results');
    if (search) search.value = '';
    if (results) {
      results.innerHTML = '';
      results.classList.remove('open');
    }
    renderNurseryRoleChip(roleIndex, role);
  }

  function getNurseryAssignmentsList() {
    var list = [];
    NURSERY_ROLES.forEach(function (role) {
      var p = nurseryAssignments[role];
      if (p && p.uid) list.push({ uid: p.uid, name: p.name, role: role });
    });
    return list;
  }

  function bindNurseryRoleSearch() {
    NURSERY_ROLES.forEach(function (role, i) {
      var input = document.getElementById('nurseryRole' + i + 'Search');
      var results = document.getElementById('nurseryRole' + i + 'Results');
      if (!input || input.dataset.bound === '1') return;
      input.dataset.bound = '1';
      function showMatches() {
        var q = input.value.trim().toLowerCase();
        if (!q) {
          results.classList.remove('open');
          results.innerHTML = '';
          return;
        }
        var taken = {};
        Object.keys(nurseryAssignments).forEach(function (r) {
          if (nurseryAssignments[r]) taken[nurseryAssignments[r].uid] = true;
        });
        var dir = typeof directory !== 'undefined' ? directory : [];
        var matches = dir
          .filter(function (p) {
            return (
              (p.name.toLowerCase().indexOf(q) !== -1 ||
                (p.email && p.email.toLowerCase().indexOf(q) !== -1)) &&
              !taken[p.uid]
            );
          })
          .slice(0, 10);
        if (!matches.length) {
          results.innerHTML = '<div style="color:#7a8fac;padding:12px">No matches</div>';
          results.classList.add('open');
          return;
        }
        results.innerHTML = matches
          .map(function (p) {
            return (
              '<div class="person-result-item" data-uid="' +
              p.uid +
              '">' +
              esc(p.name) +
              '</div>'
            );
          })
          .join('');
        results.querySelectorAll('.person-result-item').forEach(function (el) {
          function pick(e) {
            e.preventDefault();
            selectNurseryPerson(role, i, el.getAttribute('data-uid'));
          }
          el.addEventListener('touchstart', pick, { passive: false });
          el.addEventListener('mousedown', pick);
        });
        results.classList.add('open');
      }
      input.addEventListener('input', showMatches);
      input.addEventListener('focus', function () {
        if (input.value.trim()) showMatches();
      });
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('[data-nursery-role]')) {
        document.querySelectorAll('.nursery-role-results').forEach(function (r) {
          r.classList.remove('open');
        });
      }
    });
  }

  function setNurseryUiVisible(isNursery) {
    var genericWrap = document.getElementById('genericScheduleWrap');
    var mediaWrap = document.getElementById('mediaRolesWrap');
    var nurseryWrap = document.getElementById('nurseryRolesWrap');
    var songWrap = document.getElementById('songFieldWrap');
    var titleEl = document.getElementById('event-title');
    var descEl = document.getElementById('event-desc');
    if (isNursery) {
      if (genericWrap) genericWrap.style.display = 'none';
      if (mediaWrap) mediaWrap.style.display = 'none';
      if (nurseryWrap) nurseryWrap.style.display = 'block';
      if (songWrap) songWrap.style.display = 'none';
      if (titleEl) {
        titleEl.style.display = 'none';
        titleEl.value = '';
      }
      if (descEl) {
        descEl.style.display = 'none';
        descEl.value = '';
      }
      if (typeof clearSelectedPeople === 'function') clearSelectedPeople();
    } else {
      if (nurseryWrap) nurseryWrap.style.display = 'none';
      clearNurseryAssignments();
    }
  }

  function installOnMinistryChange() {
    if (typeof onMinistryChange !== 'function') return false;
    if (onMinistryChange._nurseryPatched) return true;
    var orig = onMinistryChange;
    window.onMinistryChange = function () {
      orig();
      var ministry = document.getElementById('event-ministry');
      ministry = ministry ? ministry.value : '';
      setNurseryUiVisible(ministry === 'Nursery');
      if (ministry === 'Media') {
        var nurseryWrap = document.getElementById('nurseryRolesWrap');
        if (nurseryWrap) nurseryWrap.style.display = 'none';
        clearNurseryAssignments();
      }
    };
    window.onMinistryChange._nurseryPatched = true;
    return true;
  }

  function installAddEvent() {
    if (typeof addEvent !== 'function') return false;
    if (addEvent._nurseryPatched) return true;
    var orig = addEvent;
    window.addEvent = async function () {
      var ministryEl = document.getElementById('event-ministry');
      var ministry = ministryEl ? ministryEl.value : '';
      if (ministry !== 'Nursery') {
        return orig.apply(this, arguments);
      }
      if (!currentProfile) return;
      var date = document.getElementById('event-date').value;
      var nurseryList = getNurseryAssignmentsList();
      if (!date) {
        alert('Please enter a date');
        return;
      }
      if (!nurseryList.length) {
        alert('Please assign at least one nursery worker.');
        return;
      }
      var title = 'Nursery';
      var isAdmin = currentProfile.role === 'admin';
      var leaderOf = currentProfile.leaderOf || [];
      if (!isAdmin && leaderOf.indexOf('Nursery') === -1) {
        alert('You can only create events for ministries you lead.');
        return;
      }
      try {
        var nurseryRoles = {};
        nurseryList.forEach(function (p) {
          nurseryRoles[p.role] = { uid: p.uid, name: p.name };
        });
        var eventData = {
          date: date,
          title: title,
          description: '',
          ministry: 'Nursery',
          createdByUid: auth.currentUser.uid,
          createdByName: currentProfile.name || currentProfile.email || 'Leader',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          assignedToUid: nurseryList[0].uid,
          assignedToName: nurseryList
            .map(function (p) {
              return p.role + ': ' + p.name;
            })
            .join(', '),
          assignedPeople: nurseryList.map(function (p) {
            return { uid: p.uid, name: p.name, role: p.role };
          }),
          nurseryRoles: nurseryRoles,
          assignmentStatus: 'pending'
        };
        var eventRef = await db.collection('events').add(eventData);
        for (var pi = 0; pi < nurseryList.length; pi++) {
          var person = nurseryList[pi];
          await db.collection('scheduleRequests').add({
            eventId: eventRef.id,
            date: date,
            title: title,
            ministry: 'Nursery',
            role: person.role,
            assignedToUid: person.uid,
            assignedToName: person.name,
            createdByUid: auth.currentUser.uid,
            createdByName: currentProfile.name || currentProfile.email || 'Leader',
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
        alert('Nursery workers assigned. Requests sent.');
        document.getElementById('event-date').value = '';
        clearNurseryAssignments();
        if (typeof loadEvents === 'function') await loadEvents();
      } catch (err) {
        alert('Error: ' + err.message);
      }
    };
    window.addEvent._nurseryPatched = true;
    return true;
  }

  function installRenderHooks() {
    if (typeof showDayEvents === 'function' && !showDayEvents._nurseryPatched) {
      var origShow = showDayEvents;
      window.showDayEvents = function (dateStr, events) {
        origShow(dateStr, events);
        try {
          var eventsEl = document.getElementById('day-modal-events');
          if (!eventsEl || !events) return;
          var kids = eventsEl.children;
          for (var i = 0; i < events.length && i < kids.length; i++) {
            var ev = events[i];
            if (ev.ministry !== 'Nursery') continue;
            if (!(ev.assignedPeople && ev.assignedPeople.length)) continue;
            var rolesHtml = ev.assignedPeople
              .map(function (p) {
                return (
                  '<div style="margin-top:4px;font-size:.9rem"><strong>' +
                  esc(p.role || '') +
                  ':</strong> ' +
                  esc(p.name || '') +
                  '</div>'
                );
              })
              .join('');
            if (rolesHtml) {
              var tag = kids[i].querySelector('.ministry-tag');
              var wrap = document.createElement('div');
              wrap.innerHTML = rolesHtml;
              if (tag) kids[i].insertBefore(wrap, tag);
              else kids[i].appendChild(wrap);
            }
          }
        } catch (e) {}
      };
      window.showDayEvents._nurseryPatched = true;
    }
  }

  function tryInstall() {
    installOnMinistryChange();
    installAddEvent();
    installRenderHooks();
    bindNurseryRoleSearch();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(tryInstall, 50);
      setTimeout(tryInstall, 600);
    });
  } else {
    setTimeout(tryInstall, 50);
    setTimeout(tryInstall, 600);
  }

  var tries = 0;
  var iv = setInterval(function () {
    tries++;
    tryInstall();
    if ((typeof addEvent === 'function' && addEvent._nurseryPatched) || tries > 40) clearInterval(iv);
  }, 250);
})();
