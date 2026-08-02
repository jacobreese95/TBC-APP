/* Bottom prev/next chapter buttons for Bible chapter pages */
(function () {
  // How many Genesis chapters are built so far
  var BUILT_THROUGH = 13;

  var match = (window.location.pathname || '').match(/chapter-(\d+)/i);
  if (!match) return;

  var current = parseInt(match[1], 10);
  if (isNaN(current) || current < 1) return;

  var prev = current > 1 ? current - 1 : null;
  var next = current < BUILT_THROUGH ? current + 1 : null;

  // Styles
  var style = document.createElement('style');
  style.textContent =
    '.chapter-bottom-nav{display:flex;gap:12px;margin:28px 0 16px;width:100%;}' +
    '.chapter-nav-btn{flex:1;padding:14px 12px;border:none;border-radius:14px;' +
    'font-size:1rem;font-weight:600;cursor:pointer;color:#fff;' +
    'background:linear-gradient(135deg,#4cb8b9 0%,#7bafdd 100%);' +
    'box-shadow:0 4px 14px rgba(64,64,64,0.12);}' +
    '.chapter-nav-btn:disabled{opacity:0.4;cursor:not-allowed;filter:grayscale(0.3);}' +
    '.chapter-nav-btn:not(:disabled):active{transform:translateY(1px);}';
  document.head.appendChild(style);

  var nav = document.createElement('div');
  nav.className = 'chapter-bottom-nav';

  var prevBtn = document.createElement('button');
  prevBtn.className = 'chapter-nav-btn';
  prevBtn.type = 'button';
  prevBtn.textContent = '← Previous';
  if (prev) {
    prevBtn.onclick = function () {
      window.location.href = '../chapter-' + prev + '/index.html';
    };
  } else {
    prevBtn.disabled = true;
    prevBtn.textContent = '← Previous';
  }

  var nextBtn = document.createElement('button');
  nextBtn.className = 'chapter-nav-btn';
  nextBtn.type = 'button';
  nextBtn.textContent = 'Next →';
  if (next) {
    nextBtn.onclick = function () {
      window.location.href = '../chapter-' + next + '/index.html';
    };
  } else {
    nextBtn.disabled = true;
    nextBtn.textContent = 'Next →';
  }

  nav.appendChild(prevBtn);
  nav.appendChild(nextBtn);

  function place() {
    var container = document.querySelector('.container');
    if (container) {
      container.appendChild(nav);
    } else if (document.body) {
      document.body.appendChild(nav);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', place);
  } else {
    place();
  }
})();
