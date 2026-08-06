var TBC = [37.6872, -97.3301];
var currentProfile = null;
var leads = [];
var territories = [];
var directory = [];
var map, mapAdd, markersLayer, territoriesLayer, addMarker;
var drawControl = null;
var pendingShape = null;
var terrSelected = [];
var pinLat = null, pinLng = null;
var territoryFilter = 'all';

function toggleDrawer() {
  document.getElementById('drawer').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('open');
}
function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  setTimeout(function () { t.style.display = 'none'; }, 2800);
}
function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach(function (b) {
    b.classList.toggle('active', b.getAttribute('data-tab') === name);
  });
  document.querySelectorAll('.panel').forEach(function (p) {
    p.classList.toggle('active', p.id === 'panel-' + name);
  });
  if (name === 'map' && map) setTimeout(function () { map.invalidateSize(); }, 50);
  if (name === 'add' && mapAdd) setTimeout(function () { mapAdd.invalidateSize(); }, 50);
}
function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function statusBadge(status) {
  var s = (status || 'new').toLowerCase();
  return '<span class="badge ' + escapeHtml(s) + '">' + escapeHtml(status || 'new') + '</span>';
}
function canManageTerritories() {
  if (!currentProfile) return false;
  if (currentProfile.role === 'admin') return true;
  var lo = currentProfile.leaderOf || [];
  return lo.indexOf('Soul Winning') !== -1;
}

requireApprovedUser().then(function (profile) {
  if (!profile) return;
  currentProfile = profile;
  initMaps();
  loadLeads();
  loadDirectory();
  loadTerritories();
  if (canManageTerritories()) {
    var tools = document.getElementById('mapTools');
    if (tools) tools.classList.add('visible');
    setupDraw();
  }
});

function initMaps() {
  mapAdd = L.map('mapAdd').setView(TBC, 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(mapAdd);
  mapAdd.on('click', function (e) {
    pinLat = e.latlng.lat;
    pinLng = e.latlng.lng;
    if (addMarker) mapAdd.removeLayer(addMarker);
    addMarker = L.marker([pinLat, pinLng]).addTo(mapAdd);
  });

  map = L.map('map').setView(TBC, 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);
  markersLayer = L.layerGroup().addTo(map);
  territoriesLayer = L.layerGroup().addTo(map);
}

function setupDraw() {
  if (!map || drawControl) return;
  var drawnItems = new L.FeatureGroup();
  map.addLayer(drawnItems);
  drawControl = new L.Control.Draw({
    position: 'topright',
    draw: {
      polyline: false,
      circle: false,
      circlemarker: false,
      marker: false,
      polygon: {
        allowIntersection: false,
        showArea: false,
        shapeOptions: { color: '#8845a5', weight: 2, fillOpacity: 0.25 }
      },
      rectangle: {
        shapeOptions: { color: '#4cb8b9', weight: 2, fillOpacity: 0.25 }
      }
    },
    edit: false
  });
  map.addControl(drawControl);
  map.on(L.Draw.Event.CREATED, function (e) {
    var layer = e.layer;
    var latlngs = layer.getLatLngs();
    var ring = Array.isArray(latlngs[0]) ? latlngs[0] : latlngs;
    pendingShape = ring.map(function (ll) {
      return { lat: ll.lat, lng: ll.lng };
    });
    if (pendingShape.length < 3) {
      showToast('Area needs at least 3 points');
      pendingShape = null;
      return;
    }
    openTerritoryModal();
  });
}

async function geocodeAddress(address) {
  var q = encodeURIComponent(address + ', Wichita, KS');
  try {
    var r = await fetch('https://photon.komoot.io/api/?q=' + q + '&limit=1');
    var data = await r.json();
    if (data.features && data.features.length) {
      var c = data.features[0].geometry.coordinates;
      return { lat: c[1], lng: c[0] };
    }
  } catch (e) {}
  try {
    var r2 = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + q, {
      headers: { Accept: 'application/json' }
    });
    var d2 = await r2.json();
    if (d2 && d2.length) return { lat: parseFloat(d2[0].lat), lng: parseFloat(d2[0].lon) };
  } catch (e) {}
  return null;
}

async function previewAddress() {
  var address = document.getElementById('leadAddress').value.trim();
  if (!address) { showToast('Enter an address first'); return; }
  showToast('Finding address…');
  var loc = await geocodeAddress(address);
  if (!loc) { showToast('Could not find that address'); return; }
  pinLat = loc.lat;
  pinLng = loc.lng;
  if (addMarker) mapAdd.removeLayer(addMarker);
  addMarker = L.marker([pinLat, pinLng]).addTo(mapAdd);
  mapAdd.setView([pinLat, pinLng], 16);
  showToast('Pin placed — adjust by tapping the map if needed');
}

async function saveLead() {
  var name = document.getElementById('leadName').value.trim();
  if (!name) { showToast('Name is required'); return; }
  var phone = document.getElementById('leadPhone').value.trim();
  var address = document.getElementById('leadAddress').value.trim();
  var status = document.getElementById('leadStatus').value;
  var notes = document.getElementById('leadNotes').value.trim();
  var lat = pinLat, lng = pinLng;
  if ((lat == null || lng == null) && address) {
    var loc = await geocodeAddress(address);
    if (loc) { lat = loc.lat; lng = loc.lng; }
  }
  try {
    await db.collection('soulWinningLeads').add({
      name: name,
      phone: phone,
      address: address,
      status: status,
      notes: notes,
      lat: lat,
      lng: lng,
      createdByUid: auth.currentUser.uid,
      createdByName: currentProfile.name || currentProfile.email || 'Member',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    showToast('Lead saved');
    document.getElementById('leadName').value = '';
    document.getElementById('leadPhone').value = '';
    document.getElementById('leadAddress').value = '';
    document.getElementById('leadNotes').value = '';
    document.getElementById('leadStatus').value = 'new';
    pinLat = pinLng = null;
    if (addMarker) { mapAdd.removeLayer(addMarker); addMarker = null; }
    switchTab('list');
  } catch (err) {
    showToast('Error: ' + err.message);
  }
}

function loadLeads() {
  db.collection('soulWinningLeads').orderBy('createdAt', 'desc').onSnapshot(function (snap) {
    leads = [];
    snap.forEach(function (doc) { leads.push(Object.assign({ id: doc.id }, doc.data())); });
    renderList();
    renderMapMarkers();
  }, function (err) {
    document.getElementById('leadsList').innerHTML = '<div class="empty-state">Error: ' + escapeHtml(err.message) + '</div>';
  });
}

function loadDirectory() {
  db.collection('users').get().then(function (snap) {
    directory = [];
    snap.forEach(function (doc) {
      var d = doc.data() || {};
      if (d.status && d.status !== 'approved') return;
      directory.push({
        uid: doc.id,
        name: d.name || d.displayName || d.email || 'Member',
        email: d.email || ''
      });
    });
  }).catch(function () {});
}

function loadTerritories() {
  db.collection('soulWinningTerritories').orderBy('createdAt', 'desc').onSnapshot(function (snap) {
    territories = [];
    snap.forEach(function (doc) {
      territories.push(Object.assign({ id: doc.id }, doc.data()));
    });
    renderTerritoriesList();
    renderTerritoriesOnMap();
  }, function (err) {
    console.warn(err);
    document.getElementById('territoriesList').innerHTML =
      '<div class="empty-state">Could not load areas. You may need Firestore rules for soulWinningTerritories.</div>';
  });
}

function setTerritoryFilter(mode) {
  territoryFilter = mode;
  document.getElementById('filterAll').classList.toggle('active', mode === 'all');
  document.getElementById('filterMine').classList.toggle('active', mode === 'mine');
  renderTerritoriesList();
  renderTerritoriesOnMap();
}

function isAssignedToMe(t) {
  if (!auth.currentUser) return false;
  var uid = auth.currentUser.uid;
  return (t.assignedPeople || []).some(function (p) { return p.uid === uid; });
}

function filteredTerritories() {
  if (territoryFilter === 'mine') return territories.filter(isAssignedToMe);
  return territories;
}

function renderTerritoriesList() {
  var el = document.getElementById('territoriesList');
  var list = filteredTerritories();
  if (!list.length) {
    el.innerHTML = '<div class="empty-state">' +
      (territoryFilter === 'mine' ? 'No areas assigned to you yet.' : 'No areas drawn yet.') +
      '</div>';
    return;
  }
  el.innerHTML = list.map(function (t) {
    var names = (t.assignedPeople || []).map(function (p) { return p.name; }).join(', ');
    var mine = isAssignedToMe(t) ? ' <span class="badge open">Yours</span>' : '';
    var del = canManageTerritories()
      ? '<button type="button" class="btn-secondary menu-btn" style="margin-top:8px" onclick="deleteTerritory(\'' + t.id + '\')">Remove area</button>'
      : '';
    return '<div class="territory-item">' +
      '<h3>' + escapeHtml(t.name || 'Area') + mine + '</h3>' +
      '<div style="font-size:0.85rem;color:#7a8fac;margin-bottom:6px">' + statusBadge(t.status || 'open') +
      ' · Assigned: ' + escapeHtml(names || '—') + '</div>' +
      (t.notes ? '<p style="margin:0;font-size:0.9rem">' + escapeHtml(t.notes) + '</p>' : '') +
      del +
      '</div>';
  }).join('');
}

function renderTerritoriesOnMap() {
  if (!territoriesLayer) return;
  territoriesLayer.clearLayers();
  filteredTerritories().forEach(function (t) {
    if (!t.points || t.points.length < 3) return;
    var latlngs = t.points.map(function (p) { return [p.lat, p.lng]; });
    var mine = isAssignedToMe(t);
    var poly = L.polygon(latlngs, {
      color: mine ? '#8845a5' : '#4cb8b9',
      weight: 2,
      fillOpacity: mine ? 0.35 : 0.2
    });
    poly.bindPopup(
      '<strong>' + escapeHtml(t.name || 'Area') + '</strong><br>' +
      escapeHtml((t.assignedPeople || []).map(function (p) { return p.name; }).join(', ')) +
      (t.notes ? '<br><em>' + escapeHtml(t.notes) + '</em>' : '')
    );
    territoriesLayer.addLayer(poly);
  });
}

function openTerritoryModal() {
  terrSelected = [];
  document.getElementById('terrName').value = '';
  document.getElementById('terrNotes').value = '';
  document.getElementById('terrPersonSearch').value = '';
  document.getElementById('terrSelectedChips').innerHTML = '';
  document.getElementById('territoryModal').classList.add('open');
  bindTerrPersonSearch();
}
function cancelTerritoryDraw() {
  pendingShape = null;
  terrSelected = [];
  document.getElementById('territoryModal').classList.remove('open');
}
function renderTerrChips() {
  document.getElementById('terrSelectedChips').innerHTML = terrSelected.map(function (p) {
    return '<span class="person-chip">' + escapeHtml(p.name) +
      ' <button type="button" onclick="removeTerrPerson(\'' + p.uid + '\')">&times;</button></span>';
  }).join('');
}
function removeTerrPerson(uid) {
  terrSelected = terrSelected.filter(function (p) { return p.uid !== uid; });
  renderTerrChips();
}
function selectTerrPerson(uid) {
  var p = directory.find(function (x) { return x.uid === uid; });
  if (!p) return;
  if (terrSelected.some(function (x) { return x.uid === uid; })) return;
  terrSelected.push({ uid: p.uid, name: p.name });
  document.getElementById('terrPersonSearch').value = '';
  document.getElementById('terrPersonResults').classList.remove('open');
  renderTerrChips();
}
function bindTerrPersonSearch() {
  var input = document.getElementById('terrPersonSearch');
  var results = document.getElementById('terrPersonResults');
  if (!input || input.dataset.bound === '1') return;
  input.dataset.bound = '1';
  function showMatches() {
    var q = input.value.trim().toLowerCase();
    if (!q) { results.classList.remove('open'); results.innerHTML = ''; return; }
    var matches = directory.filter(function (p) {
      return (p.name.toLowerCase().indexOf(q) !== -1 || (p.email && p.email.toLowerCase().indexOf(q) !== -1)) &&
        !terrSelected.some(function (s) { return s.uid === p.uid; });
    }).slice(0, 10);
    if (!matches.length) {
      results.innerHTML = '<div class="person-result-item" style="color:#7a8fac">No matches</div>';
      results.classList.add('open');
      return;
    }
    results.innerHTML = matches.map(function (p) {
      return '<div class="person-result-item" data-uid="' + p.uid + '">' + escapeHtml(p.name) + '</div>';
    }).join('');
    results.querySelectorAll('.person-result-item[data-uid]').forEach(function (el) {
      el.addEventListener('mousedown', function (e) {
        e.preventDefault();
        selectTerrPerson(el.getAttribute('data-uid'));
      });
    });
    results.classList.add('open');
  }
  input.addEventListener('input', showMatches);
  input.addEventListener('focus', function () { if (input.value.trim()) showMatches(); });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.person-wrap')) results.classList.remove('open');
  });
}

async function saveTerritory() {
  if (!pendingShape || pendingShape.length < 3) {
    showToast('Draw an area on the map first');
    return;
  }
  var name = document.getElementById('terrName').value.trim();
  if (!name) { showToast('Give the area a name'); return; }
  if (!terrSelected.length) { showToast('Assign at least one person'); return; }
  var notes = document.getElementById('terrNotes').value.trim();
  try {
    var ref = await db.collection('soulWinningTerritories').add({
      name: name,
      notes: notes,
      points: pendingShape,
      assignedPeople: terrSelected.map(function (p) { return { uid: p.uid, name: p.name }; }),
      assignedUids: terrSelected.map(function (p) { return p.uid; }),
      status: 'open',
      createdByUid: auth.currentUser.uid,
      createdByName: currentProfile.name || currentProfile.email || 'Leader',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    for (var i = 0; i < terrSelected.length; i++) {
      var person = terrSelected[i];
      await db.collection('soulWinningAssignments').add({
        territoryId: ref.id,
        territoryName: name,
        assignedToUid: person.uid,
        assignedToName: person.name,
        status: 'pending',
        notes: notes,
        createdByUid: auth.currentUser.uid,
        createdByName: currentProfile.name || currentProfile.email || 'Leader',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    showToast('Area assigned — notifications sent');
    cancelTerritoryDraw();
    switchTab('map');
  } catch (err) {
    showToast('Error: ' + err.message);
  }
}

async function deleteTerritory(id) {
  if (!confirm('Remove this area?')) return;
  try {
    await db.collection('soulWinningTerritories').doc(id).delete();
    showToast('Area removed');
  } catch (err) {
    showToast('Error: ' + err.message);
  }
}

function renderList() {
  var el = document.getElementById('leadsList');
  if (!leads.length) {
    el.innerHTML = '<div class="empty-state">No leads yet. Add one from the Add Lead tab.</div>';
    return;
  }
  el.innerHTML = leads.map(function (l) {
    return '<div class="lead-item">' +
      '<h3>' + escapeHtml(l.name) + ' ' + statusBadge(l.status) + '</h3>' +
      (l.phone ? '<div>' + escapeHtml(l.phone) + '</div>' : '') +
      (l.address ? '<div style="color:#7a8fac;font-size:0.9rem">' + escapeHtml(l.address) + '</div>' : '') +
      (l.notes ? '<p style="margin:8px 0 0;font-size:0.9rem">' + escapeHtml(l.notes) + '</p>' : '') +
      '<button type="button" class="btn-secondary menu-btn" style="margin-top:8px" onclick="openEdit(\'' + l.id + '\')">Edit</button>' +
      '</div>';
  }).join('');
}

function openEdit(id) {
  var l = leads.find(function (x) { return x.id === id; });
  if (!l) return;
  document.getElementById('editId').value = id;
  document.getElementById('editName').value = l.name || '';
  document.getElementById('editPhone').value = l.phone || '';
  document.getElementById('editAddress').value = l.address || '';
  document.getElementById('editStatus').value = l.status || 'new';
  document.getElementById('editNotes').value = l.notes || '';
  document.getElementById('editModal').classList.add('open');
}
function closeEditModal() {
  document.getElementById('editModal').classList.remove('open');
}
async function updateLead() {
  var id = document.getElementById('editId').value;
  var name = document.getElementById('editName').value.trim();
  if (!name) { showToast('Name is required'); return; }
  try {
    await db.collection('soulWinningLeads').doc(id).update({
      name: name,
      phone: document.getElementById('editPhone').value.trim(),
      address: document.getElementById('editAddress').value.trim(),
      status: document.getElementById('editStatus').value,
      notes: document.getElementById('editNotes').value.trim()
    });
    closeEditModal();
    showToast('Lead updated');
  } catch (err) {
    showToast('Error: ' + err.message);
  }
}
async function deleteLead() {
  var id = document.getElementById('editId').value;
  if (!confirm('Delete this lead?')) return;
  try {
    await db.collection('soulWinningLeads').doc(id).delete();
    closeEditModal();
    showToast('Lead deleted');
  } catch (err) {
    showToast('Error: ' + err.message);
  }
}

function renderMapMarkers() {
  if (!markersLayer) return;
  markersLayer.clearLayers();
  leads.forEach(function (l) {
    if (l.lat == null || l.lng == null) return;
    var marker = L.marker([l.lat, l.lng]);
    marker.bindPopup(
      '<strong>' + escapeHtml(l.name) + '</strong><br>' +
      statusBadge(l.status) + '<br>' +
      (l.address ? escapeHtml(l.address) + '<br>' : '') +
      '<button onclick="openEdit(\'' + l.id + '\')" style="margin-top:6px;padding:6px 10px;">Edit</button>'
    );
    markersLayer.addLayer(marker);
  });
}

document.addEventListener('DOMContentLoaded', function () {
  var em = document.getElementById('editModal');
  if (em) em.addEventListener('click', function (e) {
    if (e.target === this) closeEditModal();
  });
  var tm = document.getElementById('territoryModal');
  if (tm) tm.addEventListener('click', function (e) {
    if (e.target === this) cancelTerritoryDraw();
  });
});
