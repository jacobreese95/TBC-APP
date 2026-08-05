/**
 * Media ministry role slots for calendar assignments.
 * Roles: ATEM, In House Sound, Live stream Sound, Camera 1, Camera 2, Slides
 */
(function () {
  var MEDIA_ROLES = ['ATEM', 'In House Sound', 'Live stream Sound', 'Camera 1', 'Camera 2', 'Slides'];
  var mediaAssignments = {};

  function esc(str) {
    if (typeof escapeHtml === 'function') return escapeHtml(str);
    return String(str || '')
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"');
  }

  function clearMediaAssignments() {
    mediaAssignments = {};
    MEDIA_ROLES.forEach(function (role, i) {
      var chip = document.getElementById('mediaRole' + i + 'Chip');
      var search = document.getElementById('mediaRole' + i + 'Search');
      var results = document.getElementById('mediaRole' + i + 'Results');
      if (chip) chip.innerHTML = '';
      if (search) search.value = '';
      if (results) {
        results.innerHTML = '';
        results.classList.remove('open');
      }
    });
  }

  function renderMediaRoleChip(roleIndex, role) {
    var chip = document.getElementById('mediaRole' + roleIndex + 'Chip');
    if (!chip) return;
    var p = mediaAssignments[role];
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
        clearMediaRole(role, roleIndex);
      });
    }
  }

  function clearMediaRole(role, roleIndex) {
    delete mediaAssignments[role];
    var search = document.getElementById('mediaRole' + roleIndex + 'Search');
    if (search) search.value = '';
    renderMediaRoleChip(roleIndex, role);
  }

  function selectMediaPerson(role, roleIndex, uid) {
    var dir = typeof directory !== 'undefined' ? directory : [];
    var p = dir.find(function (x) {
      return x.uid === uid;
    });
    if (!p) return;
    mediaAssignments[role] = { uid: p.uid, name: p.name };
    var search = document.getElementById('mediaRole' + roleIndex + 'Search');
    var results = document.getElementById('mediaRole' + roleIndex + 'Results');
    if (search) search.value = '';
    if (results) {
      results.innerHTML = '';
      results.classList.remove('open');
    }
    renderMediaRoleChip(roleIndex, role);
  }

  function getMediaAssignmentsList() {
    var list = [];
    MEDIA_ROLES.forEach(function (role) {
      var p = mediaAssignments[role];
      if (p && p.uid) list.push({ uid: p.uid, name: p.name, role: role });
    });
    return list;
  }

  function bindMediaRoleSearch() {
    MEDIA_ROLES.forEach(function (role, i) {
      var input = document.getElementById('mediaRole' + i + 'Search');
      var results = document.getElementById('mediaRole' + i + 'Results');
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
        Object.keys(mediaAssignments).forEach(function (r) {
          if (mediaAssignments[r]) taken[mediaAssignments[r].uid] = true;
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
            selectMediaPerson(role, i, el.getAttribute('data-uid'));
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
      if (!e.target.closest('[data-media-role]')) {
        document.querySelectorAll('.media-role-results').forEach(function (r) {
          r.classList.remove('open');
        });
      }
    });
  }

  function setMediaUiVisible(isMedia) {
    var genericWrap = document.getElementById('genericScheduleWrap');
    var mediaWrap = document.getElementById('mediaRolesWrap');
    var songWrap = document.getElementById('songFieldWrap');
    if (isMedia) {
      if (genericWrap) genericWrap.style.display = 'none';
      if (mediaWrap) mediaWrap.style.display = 'block';
      if (songWrap) songWrap.style.display = 'none';
      if (typeof clearSelectedPeople === 'function') clearSelectedPeople();
    } else {
      if (genericWrap) genericWrap.style.display = 'block';
      if (mediaWrap) mediaWrap.style.display = 'none';
      clearMediaAssignments();
    }
  }

  function installOnMinistryChange() {
    if (typeof onMinistryChange !== 'function') return false;
    if (onMinistryChange._mediaPatched) return true;
    var origOnMinistryChange = onMinistryChange;
    window.onMinistryChange = function () {
      origOnMinistryChange();
      var ministry = document.getElementById('event-ministry');
      ministry = ministry ? ministry.value : '';
      setMediaUiVisible(ministry === 'Media');
    };
    window.onMinistryChange._mediaPatched = true;
    return true;
  }

  function installAddEvent() {
    if (typeof addEvent !== 'function') return false;
    if (addEvent._mediaPatched) return true;
    var orig = addEvent;
    window.addEvent = async function () {
      var ministryEl = document.getElementById('event-ministry');
      var ministry = ministryEl ? ministryEl.value : '';
      if (ministry !== 'Media') {
        return orig.apply(this, arguments);
      }
      if (!currentProfile) return;
      var date = document.getElementById('event-date').value;
      var title = (document.getElementById('event-title').value || '').trim();
      var desc = (document.getElementById('event-desc').value || '').trim();
      var mediaList = getMediaAssignmentsList();
      if (!date) {
        alert('Please enter a date');
        return;
      }
      if (!mediaList.length) {
        alert('Please assign at least one media position.');
        return;
      }
      if (!title) title = 'Media Team';
      var isAdmin = currentProfile.role === 'admin';
      var leaderOf = currentProfile.leaderOf || [];
      if (!isAdmin && leaderOf.indexOf('Media') === -1) {
        alert('You can only create events for ministries you lead.');
        return;
      }
      try {
        var mediaRoles = {};
        mediaList.forEach(function (p) {
          mediaRoles[p.role] = { uid: p.uid, name: p.name };
        });
        var eventData = {
          date: date,
          title: title,
          description: desc,
          ministry: 'Media',
          createdByUid: auth.currentUser.uid,
          createdByName: currentProfile.name || currentProfile.email || 'Leader',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          assignedToUid: mediaList[0].uid,
          assignedToName: mediaList
            .map(function (p) {
              return p.role + ': ' + p.name;
            })
            .join(', '),
          assignedPeople: mediaList.map(function (p) {
            return { uid: p.uid, name: p.name, role: p.role };
          }),
          mediaRoles: mediaRoles,
          assignmentStatus: 'pending'
        };
        var eventRef = await db.collection('events').add(eventData);
        for (var pi = 0; pi < mediaList.length; pi++) {
          var person = mediaList[pi];
          await db.collection('scheduleRequests').add({
            eventId: eventRef.id,
            date: date,
            title: title,
            ministry: 'Media',
            role: person.role,
            assignedToUid: person.uid,
            assignedToName: person.name,
            createdByUid: auth.currentUser.uid,
            createdByName: currentProfile.name || currentProfile.email || 'Leader',
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
        alert('Media positions assigned. Requests sent.');
        document.getElementById('event-date').value = '';
        document.getElementById('event-title').value = '';
        document.getElementById('event-desc').value = '';
        clearMediaAssignments();
        if (typeof loadEvents === 'function') await loadEvents();
      } catch (err) {
        alert('Error: ' + err.message);
      }
    };
    window.addEvent._mediaPatched = true;
    return true;
  }

  function installRenderHooks() {
    if (typeof showDayEvents === 'function' && !showDayEvents._mediaPatched) {
      var origShow = showDayEvents;
      window.showDayEvents = function (dateStr, events) {
        origShow(dateStr, events);
        try {
          var eventsEl = document.getElementById('day-modal-events');
          if (!eventsEl || !events) return;
          var kids = eventsEl.children;
          for (var i = 0; i < events.length && i < kids.length; i++) {
            var ev = events[i];
            if (ev.ministry !== 'Media') continue;
            var rolesHtml = '';
            if (ev.assignedPeople && ev.assignedPeople.length) {
              rolesHtml = ev.assignedPeople
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
            }
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
      window.showDayEvents._mediaPatched = true;
    }
  }

  function tryInstall() {
    installOnMinistryChange();
    installAddEvent();
    installRenderHooks();
    bindMediaRoleSearch();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(tryInstall, 50);
      setTimeout(tryInstall, 500);
    });
  } else {
    setTimeout(tryInstall, 50);
    setTimeout(tryInstall, 500);
  }

  var tries = 0;
  var iv = setInterval(function () {
    tries++;
    tryInstall();
    if ((typeof addEvent === 'function' && addEvent._mediaPatched) || tries > 40) clearInterval(iv);
  }, 250);
})();
