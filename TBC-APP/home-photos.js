var homePhotoUrls = [];
var homePhotoIdx = 0;
var homePhotoUsingA = true;
var homePhotoTimer = null;
var HOME_PHOTO_MS = 9000;

function shuffleInPlace(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr;
}

function showHomePhoto(url) {
  var a = document.getElementById('homePhotoA');
  var b = document.getElementById('homePhotoB');
  if (!a || !b || !url) return;
  var next = homePhotoUsingA ? b : a;
  var prev = homePhotoUsingA ? a : b;
  next.style.backgroundImage = 'url("' + String(url).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '")';
  next.classList.add('show');
  prev.classList.remove('show');
  homePhotoUsingA = !homePhotoUsingA;
}

function nextHomePhoto(fromTap) {
  if (!homePhotoUrls.length) return;
  homePhotoIdx = (homePhotoIdx + 1) % homePhotoUrls.length;
  if (homePhotoIdx === 0) shuffleInPlace(homePhotoUrls);
  showHomePhoto(homePhotoUrls[homePhotoIdx]);
  if (fromTap) resetHomePhotoTimer();
}

function resetHomePhotoTimer() {
  if (homePhotoTimer) clearInterval(homePhotoTimer);
  if (homePhotoUrls.length < 2) return;
  homePhotoTimer = setInterval(function () { nextHomePhoto(false); }, HOME_PHOTO_MS);
}

async function loadHomePhotos() {
  var hint = document.getElementById('homePhotoHint');
  try {
    var urls = [];
    try {
      var snap = await db.collection('photos').orderBy('createdAt', 'desc').limit(60).get();
      snap.forEach(function (doc) {
        var d = doc.data() || {};
        if (d.url) urls.push(d.url);
      });
    } catch (e1) {
      var snap2 = await db.collection('photos').limit(60).get();
      snap2.forEach(function (doc) {
        var d = doc.data() || {};
        if (d.url) urls.push(d.url);
      });
    }
    if (!urls.length) {
      if (hint) hint.style.display = 'none';
      return;
    }
    homePhotoUrls = shuffleInPlace(urls);
    homePhotoIdx = 0;
    showHomePhoto(homePhotoUrls[0]);
    if (hint) hint.style.display = homePhotoUrls.length > 1 ? 'block' : 'none';
    resetHomePhotoTimer();
  } catch (e) {
    console.warn('home photos', e);
  }
}

(function bindHomePhotoTap() {
  function bind() {
    var stage = document.getElementById('homePhotoStage');
    if (!stage || stage.dataset.bound === '1') return;
    stage.dataset.bound = '1';
    stage.addEventListener('click', function (e) {
      if (e.target.closest('.home-tile')) return;
      nextHomePhoto(true);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
