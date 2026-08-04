/* TBC app light / dark theme */
(function () {
  var KEY = 'tbc-theme';

  function normalize(t) {
    return t === 'dark' ? 'dark' : 'light';
  }

  function apply(t) {
    t = normalize(t);
    try {
      document.documentElement.setAttribute('data-theme', t);
      if (document.body) document.body.setAttribute('data-theme', t);
    } catch (e) {}
    return t;
  }

  function getTheme() {
    try {
      return normalize(localStorage.getItem(KEY) || 'light');
    } catch (e) {
      return 'light';
    }
  }

  function setTheme(t) {
    t = apply(t);
    try {
      localStorage.setItem(KEY, t);
    } catch (e) {}
    return t;
  }

  // Apply as early as possible
  apply(getTheme());

  window.getAppTheme = getTheme;
  window.setAppTheme = setTheme;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      apply(getTheme());
    });
  } else {
    apply(getTheme());
  }
})();
