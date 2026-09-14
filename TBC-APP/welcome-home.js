(function () {
  var frame = document.getElementById('homeWelcomeFrame');
  var video = document.getElementById('homeWelcomeVideo');
  var unmute = document.getElementById('homeWelcomeUnmute');
  if (!frame || !video) return;
  video.addEventListener('loadeddata', function () {
    frame.classList.add('show');
    video.play().catch(function () {});
  });
  video.addEventListener('error', function () {
    frame.classList.remove('show');
  });
  if (unmute) {
    unmute.addEventListener('click', function () {
      video.muted = !video.muted;
      unmute.textContent = video.muted ? 'Tap for sound' : 'Sound on';
      video.play().catch(function () {});
    });
  }
})();
