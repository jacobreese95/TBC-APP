/**
 * Sentry ministry role slots: Worker One, Worker Two
 */
(function () {
  var SENTRY_ROLES = ['Worker One', 'Worker Two'];
  var sentryAssignments = {};

  function esc(str) {
    if (typeof escapeHtml === 'function') return escapeHtml(str);
    return String(str || '')
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"');
  }

  function clearSentryAssignments() {
    sentryAssignments = {};
    SENTRY_ROLES.forEach(function (role, i) {
      var chip = document.getElementById('sentryRole' + i + 'Chip');
      var search = document.getElementById('sentryRole' + i + 'Search');
      var results = document.getElementById('sentryRole' + i + 'Results');
      if (chip) chip.innerHTML = '';
      if (search) search.value = '';
      if (results) {
        results.innerHTML = '';
        results.classList.remove('open');
      }
    });
  }

  function renderSentryRoleChip(roleIndex, role) {
    var chip = document.getElementById('sentryRole' + roleIndex + 'Chip');
    if (!chip) return;
    var p = sentryAssignments[role];
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
        clearSentryRole(role, roleIndex);
      });
    }
  }

  function clearSentryRole(role, roleIndex) {
    delete sentryAssignments[role];
    var search = document.getElementById('sentryRole' + roleIndex + 'Search');
    if (search) search.value = '';
    renderSentryRoleChip(roleIndex, role);
  }

  function selectSentryPerson(role, roleIndex, uid) {
    var dir = typeof directory !== 'undefined' ? directory : [];
    var p = dir.find(function (x) {
      return x.uid === uid;
    });
    if (!p) return;
    sentryAssignments[role] = { uid: p.uid, name: p.name };
    var search = document.getElementById('sentryRole' + roleIndex + 'Search');
    var results = document.getElementById('sentryRole' + roleIndex + 'Results');
    if (search) search.value = '';
    if (results) {
      results.innerHTML = '';
      results.classList.remove('open');
    }
    renderSentryRoleChip(roleIndex, role);
  }

  function getSentryAssignmentsList() {
    var list = [];
    SENTRY_ROLES.forEach(function (role) {
      var p = sentryAssignments[role];
      if (p && p.uid) list.push({ uid: p.uid, name: p.name, role: role });
    });
    return list;
  }

  function bindSentryRoleSearch() {
    SENTRY_ROLES.forEach(function (role, i) {
      var input = document.getElementById('sentryRole' + i + 'Search');
      var results = document.getElementById('sentryRole' + i + 'Results');
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
        Object.keys(sentryAssignments).forEach(function (r) {
          if (sentryAssignments[r]) taken[sentryAssignments[r].uid] = true;
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
            selectSentryPerson(role, i, el.getAttribute('data-uid'));
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
      if (!e.target.closest('[data-sentry-role]')) {
        document.querySelectorAll('.sentry-role-results').forEach(function (r) {
          r.classList.remove('open');
        });
      }
    });
  }

  function setSentryUiVisible(isSentry) {
    var genericWrap = document.getElementById('genericScheduleWrap');
    var mediaWrap = document.getElementById('mediaRolesWrap');
    var sentryWrapEl = document.getElementById('sentryRolesWrap');
    var songWrap = document.getElementById('songFieldWrap');
    var titleEl = document.getElementById('event-title');
    var descEl = document.getElementById('event-desc');
    if (isSentry) {
      if (genericWrap) genericWrap.style.display = 'none';
      if (mediaWrap) mediaWrap.style.display = 'none';
      var nurseryWrap = document.getElementById('nurseryRolesWrap');
      if (nurseryWrap) nurseryWrap.style.display = 'none';
      if (sentryWrapEl) sentryWrapEl.style.display = 'block';
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
      if (sentryWrapEl) sentryWrapEl.style.display = 'none';
      clearSentryAssignments();
    }
  }

  function installOnMinistryChange() {
    if (typeof onMinistryChange !== 'function') return false;
    if (onMinistryChange._sentryPatched) return true;
    var orig = onMinistryChange;
    window.onMinistryChange = function () {
      orig();
      var ministry = document.getElementById('event-ministry');
      ministry = ministry ? ministry.value : '';
      setSentryUiVisible(ministry === 'Sentry');
      if (ministry === 'Media' || ministry === 'Nursery') {
        var sentryWrap = document.getElementById('sentryRolesWrap');
        if (sentryWrap) sentryWrap.style.display = 'none';
        clearSentryAssignments();
      }
    };
    window.onMinistryChange._sentryPatched = true;
    return true;
  }

  function installAddEvent() {
    if (typeof addEvent !== 'function') return false;
    if (addEvent._sentryPatched) return true;
    var orig = addEvent;
    window.addEvent = async function () {
      var ministryEl = document.getElementById('event-ministry');
      var ministry = ministryEl ? ministryEl.value : '';
      if (ministry !== 'Sentry') {
        return orig.apply(this, arguments);
      }
      if (!currentProfile) return;
      var date = document.getElementById('event-date').value;
      var sentryList = getSentryAssignmentsList();
      if (!date) {
        alert('Please enter a date');
        return;
      }
      if (!sentryList.length) {
        alert('Please assign at least one sentry worker.');
        return;
      }
      var title = 'Sentry';
      var isAdmin = currentProfile.role === 'admin';
      var leaderOf = currentProfile.leaderOf || [];
      if (!isAdmin && leaderOf.indexOf('Sentry') === -1) {
        alert('You can only create events for ministries you lead.');
        return;
      }
      try {
        var sentryRoles = {};
        sentryList.forEach(function (p) {
          sentryRoles[p.role] = { uid: p.uid, name: p.name };
        });
        var eventData = {
          date: date,
          title: title,
          description: '',
          ministry: 'Sentry',
          createdByUid: auth.currentUser.uid,
          createdByName: currentProfile.name || currentProfile.email || 'Leader',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          assignedToUid: sentryList[0].uid,
          assignedToName: sentryList
            .map(function (p) {
              return p.role + ': ' + p.name;
            })
            .join(', '),
          assignedPeople: sentryList.map(function (p) {
            return { uid: p.uid, name: p.name, role: p.role };
          }),
          sentryRoles: sentryRoles,
          assignmentStatus: 'pending'
        };
        var eventRef = await db.collection('events').add(eventData);
        for (var pi = 0; pi < sentryList.length; pi++) {
          var person = sentryList[pi];
          await db.collection('scheduleRequests').add({
            eventId: eventRef.id,
            date: date,
            title: title,
            ministry: 'Sentry',
            role: person.role,
            assignedToUid: person.uid,
            assignedToName: person.name,
            createdByUid: auth.currentUser.uid,
            createdByName: currentProfile.name || currentProfile.email || 'Leader',
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
        alert('Sentry workers assigned. Requests sent.');
        document.getElementById('event-date').value = '';
        clearSentryAssignments();
        if (typeof loadEvents === 'function') await loadEvents();
      } catch (err) {
        alert('Error: ' + err.message);
      }
    };
    window.addEvent._sentryPatched = true;
    return true;
  }

  function installRenderHooks() {
    if (typeof showDayEvents === 'function' && !showDayEvents._sentryPatched) {
      var origShow = showDayEvents;
      window.showDayEvents = function (dateStr, events) {
        origShow(dateStr, events);
        try {
          var eventsEl = document.getElementById('day-modal-events');
          if (!eventsEl || !events) return;
          var kids = eventsEl.children;
          for (var i = 0; i < events.length && i < kids.length; i++) {
            var ev = events[i];
            if (ev.ministry !== 'Sentry') continue;
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
      window.showDayEvents._sentryPatched = true;
    }
  }

  function tryInstall() {
    installOnMinistryChange();
    installAddEvent();
    installRenderHooks();
    bindSentryRoleSearch();
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
    if ((typeof addEvent === 'function' && addEvent._sentryPatched) || tries > 40) clearInterval(iv);
  }, 250);
})();
