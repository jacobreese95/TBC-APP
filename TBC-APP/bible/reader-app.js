function toggleMenu() {
  document.getElementById('navDrawer').classList.toggle('open');
  document.getElementById('navOverlay').classList.toggle('open');
}

var bookCache = {};
var strongsChapterCache = {};
var currentBook = null;
var currentChapter = 1;
var activeRef = null;
var activeVerseId = null;
var expandedVerseNum = null;
var dictLoaded = { greek: false, hebrew: false, loading: null };
var websterDictCache = null;
var websterDictLoading = null;

function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}
function setUrl(book, chapter, verse) {
  var u = new URL(window.location.href);
  u.searchParams.set('book', book.name);
  u.searchParams.set('chapter', String(chapter));
  if (verse) u.searchParams.set('verse', String(verse));
  else u.searchParams.delete('verse');
  history.replaceState(null, '', u.pathname + u.search);
}
function fillBookSelect() {
  var sel = document.getElementById('bookSelect');
  sel.innerHTML = KJV_BOOKS.map(function (b) {
    return '<option value="' + b.name + '">' + b.name + '</option>';
  }).join('');
}
function fillChapterSelect(book) {
  var sel = document.getElementById('chapterSelect');
  var html = '';
  for (var i = 1; i <= book.chapters; i++) html += '<option value="' + i + '">' + i + '</option>';
  sel.innerHTML = html;
}
function bookNumber(book) {
  for (var i = 0; i < KJV_BOOKS.length; i++) {
    if (KJV_BOOKS[i].name === book.name) return i + 1;
  }
  return 1;
}
async function loadBookData(book) {
  if (bookCache[book.file]) return bookCache[book.file];
  var res = await fetch(KJV_CDN + book.file + '.json');
  if (!res.ok) throw new Error('Could not load ' + book.name);
  var data = await res.json();
  bookCache[book.file] = data;
  return data;
}
async function loadStrongsChapter(book, chapter) {
  var key = bookNumber(book) + ':' + chapter;
  if (strongsChapterCache[key]) return strongsChapterCache[key];
  var res = await fetch('https://bolls.life/get-text/KJV/' + bookNumber(book) + '/' + chapter + '/');
  if (!res.ok) throw new Error('Strong’s data unavailable');
  var data = await res.json();
  var map = {};
  (data || []).forEach(function (v) {
    map[parseInt(v.verse, 10)] = v.text || '';
  });
  strongsChapterCache[key] = map;
  return map;
}
function parseStrongsTagged(text) {
  var tokens = [];
  var re = /([^<]+)|<S>(\d+)<\/S>/g;
  var m;
  var current = null;
  while ((m = re.exec(text))) {
    if (m[1] !== undefined) {
      var piece = m[1];
      if (/^\s*$/.test(piece)) {
        if (current) {
          tokens.push(current);
          current = null;
        }
        continue;
      }
      var rest = piece.replace(/^\s+/, '').replace(/\s+$/, '');
      if (current) tokens.push(current);
      if (!rest) {
        current = null;
        continue;
      }
      current = { word: rest, nums: [] };
    } else {
      if (!current) current = { word: '', nums: [] };
      current.nums.push(m[2]);
    }
  }
  if (current) tokens.push(current);
  return tokens.filter(function (t) { return t.word || (t.nums && t.nums.length); });
}
function prefixForBook(book) {
  return book.testament === 'OT' ? 'H' : 'G';
}
function loadDictionary(kind) {
  if (dictLoaded.greek && dictLoaded.hebrew) return Promise.resolve();
  if (dictLoaded.loading) return dictLoaded.loading;
  dictLoaded.loading = new Promise(function (resolve, reject) {
    var urls = {
      greek: 'https://cdn.jsdelivr.net/gh/openscriptures/strongs@master/greek/strongs-greek-dictionary.js',
      hebrew: 'https://cdn.jsdelivr.net/gh/openscriptures/strongs@master/hebrew/strongs-hebrew-dictionary.js'
    };
    var left = 2;
    function doneOne(err) {
      if (err) {
        dictLoaded.loading = null;
        reject(err);
        return;
      }
      left--;
      if (left <= 0) {
        dictLoaded.greek = true;
        dictLoaded.hebrew = true;
        dictLoaded.loading = null;
        resolve();
      }
    }
    ['greek', 'hebrew'].forEach(function (k) {
      if (window[k === 'greek' ? 'strongsGreekDictionary' : 'strongsHebrewDictionary']) {
        doneOne();
        return;
      }
      var s = document.createElement('script');
      s.src = urls[k];
      s.onload = function () { doneOne(); };
      s.onerror = function () { doneOne(new Error('Could not load Strong’s dictionary')); };
      document.head.appendChild(s);
    });
  });
  return dictLoaded.loading;
}
function lookupStrongs(code) {
  if (/^\d+$/.test(code)) {
    var g = window.strongsGreekDictionary && window.strongsGreekDictionary['G' + code];
    var h = window.strongsHebrewDictionary && window.strongsHebrewDictionary['H' + code];
    return g ? { code: 'G' + code, entry: g } : h ? { code: 'H' + code, entry: h } : null;
  }
  if (code.charAt(0) === 'G' && window.strongsGreekDictionary) {
    return window.strongsGreekDictionary[code] ? { code: code, entry: window.strongsGreekDictionary[code] } : null;
  }
  if (code.charAt(0) === 'H' && window.strongsHebrewDictionary) {
    return window.strongsHebrewDictionary[code] ? { code: code, entry: window.strongsHebrewDictionary[code] } : null;
  }
  return null;
}
function normalizeWebsterWord(w) {
  return String(w || '')
    .toLowerCase()
    .replace(/^[^\w']+|[^\w']+$/g, '')
    .replace(/'s$/i, '')
    .trim();
}
function loadWebsterDictionary() {
  if (websterDictCache) return Promise.resolve(websterDictCache);
  if (websterDictLoading) return websterDictLoading;
  websterDictLoading = fetch(
    'https://cdn.jsdelivr.net/gh/adambom/dictionary@master/dictionary.json'
  )
    .then(function (r) {
      if (!r.ok) throw new Error('Could not load Webster dictionary');
      return r.json();
    })
    .then(function (data) {
      websterDictCache = data || {};
      websterDictLoading = null;
      return websterDictCache;
    })
    .catch(function (err) {
      websterDictLoading = null;
      throw err;
    });
  return websterDictLoading;
}
function lookupWebster(englishWord) {
  var key = normalizeWebsterWord(englishWord);
  if (!key || !websterDictCache) return null;
  var upper = key.toUpperCase();
  if (websterDictCache[upper]) return { word: upper, text: websterDictCache[upper] };
  if (upper.endsWith('S') && websterDictCache[upper.slice(0, -1)]) {
    return { word: upper.slice(0, -1), text: websterDictCache[upper.slice(0, -1)] };
  }
  if (upper.endsWith('ES') && websterDictCache[upper.slice(0, -2)]) {
    return { word: upper.slice(0, -2), text: websterDictCache[upper.slice(0, -2)] };
  }
  if (upper.endsWith('ED') && websterDictCache[upper.slice(0, -2)]) {
    return { word: upper.slice(0, -2), text: websterDictCache[upper.slice(0, -2)] };
  }
  if (upper.endsWith('ING') && websterDictCache[upper.slice(0, -3)]) {
    return { word: upper.slice(0, -3), text: websterDictCache[upper.slice(0, -3)] };
  }
  return null;
}
function loadWebster1828(englishWord) {
  var box = document.getElementById('lexWebster');
  if (!box) return;
  var key = normalizeWebsterWord(englishWord);
  if (!key) {
    box.innerHTML = '';
    return;
  }
  box.innerHTML =
    '<h4>Webster’s Dictionary</h4>' +
    '<p class="lex-w-word">Looking up “' + escapeHtml(key) + '”…</p>' +
    '<div class="lex-w-body muted">Loading…</div>';
  loadWebsterDictionary()
    .then(function () {
      var found = lookupWebster(key);
      if (!found || !found.text) {
        box.innerHTML =
          '<h4>Webster’s Dictionary</h4>' +
          '<p class="lex-w-word">' + escapeHtml(key) + '</p>' +
          '<div class="lex-w-body muted">No entry found for this English word.</div>';
        return;
      }
      var text = String(found.text || '');
      if (text.length > 2500) {
        text = text.slice(0, 2500).replace(/\s+\S*$/, '') + '…';
      }
      box.innerHTML =
        '<h4>Webster’s Dictionary</h4>' +
        '<p class="lex-w-word">' + escapeHtml(found.word) + '</p>' +
        '<div class="lex-w-body">' + escapeHtml(text) + '</div>';
    })
    .catch(function (err) {
      box.innerHTML =
        '<h4>Webster’s Dictionary</h4>' +
        '<p class="lex-w-word">' + escapeHtml(key) + '</p>' +
        '<div class="lex-w-body muted">' +
        escapeHtml((err && err.message) || 'Could not load Webster dictionary.') +
        '</div>';
    });
}
function openLexicon(rawNum, book, englishWord) {
  var prefix = prefixForBook(book);
  var code = prefix + String(rawNum).replace(/^[HG]/i, '');
  document.getElementById('lexTitle').textContent = 'Strong’s ' + code;
  document.getElementById('lexLemma').textContent = 'Loading…';
  document.getElementById('lexMeta').textContent = '';
  document.getElementById('lexBody').innerHTML = '';
  var websterBox = document.getElementById('lexWebster');
  if (websterBox) websterBox.innerHTML = '';
  document.getElementById('lexBg').classList.add('open');
  document.getElementById('lexSheet').classList.add('open');
  loadDictionary(book.testament === 'OT' ? 'hebrew' : 'greek').then(function () {
    var found = lookupStrongs(code) || lookupStrongs(String(rawNum));
    if (!found || !found.entry) {
      document.getElementById('lexLemma').textContent = code;
      document.getElementById('lexBody').innerHTML = '<p>No lexicon entry found for this number.</p>';
    } else {
      var e = found.entry;
      document.getElementById('lexTitle').textContent = 'Strong’s ' + found.code;
      document.getElementById('lexLemma').textContent = e.lemma || e.translit || found.code;
      var meta = [];
      if (e.translit) meta.push(e.translit);
      if (e.kjv_def) meta.push('KJV: ' + e.kjv_def);
      document.getElementById('lexMeta').textContent = meta.join(' · ');
      var html = '';
      if (e.strongs_def) html += '<p><strong>Definition:</strong> ' + escapeHtml(e.strongs_def) + '</p>';
      if (e.derivation) html += '<p><strong>Derivation:</strong> ' + escapeHtml(e.derivation) + '</p>';
      document.getElementById('lexBody').innerHTML = html || '<p>No further detail.</p>';
    }
    loadWebster1828(englishWord);
  }).catch(function (err) {
    document.getElementById('lexLemma').textContent = code;
    document.getElementById('lexBody').innerHTML = '<p>' + escapeHtml(err.message || 'Lookup failed') + '</p>';
    loadWebster1828(englishWord);
  });
}
function closeLexicon() {
  document.getElementById('lexBg').classList.remove('open');
  document.getElementById('lexSheet').classList.remove('open');
}
function hasNote(ref) {
  try {
    var t = localStorage.getItem(noteKey(ref));
    return !!(t && t.trim());
  } catch (e) { return false; }
}
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');
}
function renderStrongsTokens(tokens, book, panel) {
  var words = document.createElement('div');
  words.className = 'strongs-words';
  tokens.forEach(function (t) {
    var sw = document.createElement('span');
    sw.className = 'sw';
    var nums = (t.nums || []).map(function (n) { return prefixForBook(book) + n; });
    sw.innerHTML =
      '<span class="sw-word">' + escapeHtml(t.word || '—') + '</span>' +
      '<span class="sw-num' + (nums.length ? '' : ' empty') + '">' +
      escapeHtml(nums.length ? nums.join(' ') : '·') + '</span>';
    if (t.nums && t.nums.length) {
      sw.addEventListener('click', function (e) {
        e.stopPropagation();
        openLexicon(t.nums[0], book, t.word || '');
      });
    }
    words.appendChild(sw);
  });
  panel.innerHTML = '';
  panel.appendChild(words);
  var actions = document.createElement('div');
  actions.className = 'strongs-actions';
  var noteBtn = document.createElement('button');
  noteBtn.type = 'button';
  noteBtn.className = 'btn-note';
  noteBtn.textContent = 'Note';
  noteBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    var li = panel.closest('.verse-item');
    if (!li) return;
    openNote(li.getAttribute('data-ref'), li.getAttribute('data-vid'), li.getAttribute('data-text'));
  });
  var collapseBtn = document.createElement('button');
  collapseBtn.type = 'button';
  collapseBtn.className = 'btn-collapse';
  collapseBtn.textContent = 'Close Strong’s';
  collapseBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    collapseAll();
  });
  actions.appendChild(noteBtn);
  actions.appendChild(collapseBtn);
  panel.appendChild(actions);
}
function collapseAll() {
  expandedVerseNum = null;
  document.querySelectorAll('.verse-item.expanded').forEach(function (el) {
    el.classList.remove('expanded');
    var panel = el.querySelector('.strongs-panel');
    if (panel) panel.innerHTML = '';
  });
}
async function expandVerse(li, book, chapter, verseNum, plainText) {
  if (expandedVerseNum === verseNum && li.classList.contains('expanded')) {
    collapseAll();
    return;
  }
  collapseAll();
  expandedVerseNum = verseNum;
  li.classList.add('expanded');
  var panel = li.querySelector('.strongs-panel');
  panel.innerHTML = '<p class="strongs-loading">Loading Strong’s…</p>';
  try {
    var map = await loadStrongsChapter(book, chapter);
    var tagged = map[verseNum];
    if (!tagged) {
      panel.innerHTML = '<p class="strongs-loading">No Strong’s tags for this verse.</p>';
      var actions = document.createElement('div');
      actions.className = 'strongs-actions';
      var noteBtn = document.createElement('button');
      noteBtn.type = 'button';
      noteBtn.className = 'btn-note';
      noteBtn.textContent = 'Note';
      noteBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        openNote(li.getAttribute('data-ref'), li.getAttribute('data-vid'), plainText);
      });
      var collapseBtn = document.createElement('button');
      collapseBtn.type = 'button';
      collapseBtn.className = 'btn-collapse';
      collapseBtn.textContent = 'Close';
      collapseBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        collapseAll();
      });
      actions.appendChild(noteBtn);
      actions.appendChild(collapseBtn);
      panel.appendChild(actions);
      return;
    }
    var tokens = parseStrongsTagged(tagged);
    renderStrongsTokens(tokens, book, panel);
    loadDictionary(book.testament === 'OT' ? 'hebrew' : 'greek').catch(function () {});
  } catch (err) {
    panel.innerHTML = '<p class="strongs-loading">' + escapeHtml(err.message || 'Could not load Strong’s') + '</p>';
  }
}
function renderVerses(book, chapter, verses, highlightVerse) {
  var list = document.createElement('ul');
  list.className = 'verse-list';
  verses.forEach(function (v) {
    var num = parseInt(v.verse, 10);
    var ref = verseRef(book, chapter, num);
    var vid = verseId(book, chapter, num);
    var li = document.createElement('li');
    li.className = 'verse-item' + (hasNote(ref) ? ' has-note' : '') + (highlightVerse && num === highlightVerse ? ' highlight' : '');
    li.id = 'v-' + num;
    li.setAttribute('data-ref', ref);
    li.setAttribute('data-vid', vid);
    li.setAttribute('data-text', v.text || '');
    li.setAttribute('data-num', String(num));
    li.innerHTML =
      '<span class="verse-num">' + num + '</span>' +
      '<div class="verse-body">' +
        '<span class="verse-text verse-plain">' + escapeHtml(v.text) + '</span>' +
        '<div class="strongs-panel"></div>' +
      '</div>' +
      (hasNote(ref) ? '<span class="verse-note-dot" title="Has note"></span>' : '');
    li.addEventListener('click', function (e) {
      if (e.target.closest('.strongs-panel')) return;
      expandVerse(li, book, chapter, num, v.text || '');
    });
    list.appendChild(li);
  });
  var content = document.getElementById('content');
  content.innerHTML = '';
  content.appendChild(list);
  if (highlightVerse) {
    setTimeout(function () {
      var el = document.getElementById('v-' + highlightVerse);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  }
}
async function showChapter(book, chapter, highlightVerse) {
  currentBook = book;
  currentChapter = chapter;
  expandedVerseNum = null;
  document.getElementById('bookSelect').value = book.name;
  fillChapterSelect(book);
  document.getElementById('chapterSelect').value = String(chapter);
  document.getElementById('pageTitle').textContent = book.name;
  document.getElementById('chapterTitle').textContent = book.name + ' ' + chapter;
  document.getElementById('content').innerHTML = '<p class="status-msg">Loading…</p>';
  document.getElementById('prevBtn').disabled = (chapter <= 1);
  document.getElementById('nextBtn').disabled = (chapter >= book.chapters);
  document.getElementById('backBtn').textContent = book.testament === 'OT' ? '← Old Testament' : '← New Testament';
  document.getElementById('backBtn').onclick = function () {
    window.location.href = book.testament === 'OT' ? 'old-testament/index.html' : 'new-testament/index.html';
  };
  try {
    var data = await loadBookData(book);
    var ch = (data.chapters || []).find(function (c) { return String(c.chapter) === String(chapter); });
    if (!ch || !ch.verses || !ch.verses.length) {
      document.getElementById('content').innerHTML = '<p class="status-msg error">Chapter not found.</p>';
      return;
    }
    setUrl(book, chapter, highlightVerse || null);
    renderVerses(book, chapter, ch.verses, highlightVerse || null);
  } catch (e) {
    console.error(e);
    document.getElementById('content').innerHTML = '<p class="status-msg error">Could not load this book. Check your connection and try again.</p>';
  }
}
function openNote(ref, vid, text) {
  activeRef = ref;
  activeVerseId = vid;
  document.getElementById('noteRef').textContent = ref;
  document.getElementById('noteVerseText').textContent = text || '';
  var existing = '';
  try { existing = localStorage.getItem(noteKey(ref)) || ''; } catch (e) {}
  document.getElementById('noteText').value = existing;
  document.getElementById('noteBg').classList.add('open');
  document.getElementById('noteSheet').classList.add('open');
  setTimeout(function () { document.getElementById('noteText').focus(); }, 200);
}
function closeNote() {
  document.getElementById('noteBg').classList.remove('open');
  document.getElementById('noteSheet').classList.remove('open');
  activeRef = null;
  activeVerseId = null;
}
function saveNote() {
  if (!activeRef) return;
  var text = document.getElementById('noteText').value || '';
  try {
    if (text.trim() === '') localStorage.removeItem(noteKey(activeRef));
    else localStorage.setItem(noteKey(activeRef), text);
    if (activeVerseId) {
      if (text.trim() === '') localStorage.removeItem('noteid-' + activeVerseId);
      else localStorage.setItem('noteid-' + activeVerseId, text);
    }
  } catch (e) {
    alert('Could not save note on this device.');
    return;
  }
  closeNote();
  if (currentBook) showChapter(currentBook, currentChapter, null);
}
function goRelative(delta) {
  if (!currentBook) return;
  var next = currentChapter + delta;
  if (next < 1 || next > currentBook.chapters) return;
  showChapter(currentBook, next, null);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function init() {
  fillBookSelect();
  document.getElementById('bookSelect').addEventListener('change', function () {
    var b = findKjvBook(this.value);
    if (b) showChapter(b, 1, null);
  });
  document.getElementById('chapterSelect').addEventListener('change', function () {
    if (!currentBook) return;
    showChapter(currentBook, parseInt(this.value, 10) || 1, null);
  });
  document.getElementById('prevBtn').addEventListener('click', function () { goRelative(-1); });
  document.getElementById('nextBtn').addEventListener('click', function () { goRelative(1); });
  document.getElementById('noteCancel').addEventListener('click', closeNote);
  document.getElementById('noteBg').addEventListener('click', closeNote);
  document.getElementById('noteSave').addEventListener('click', saveNote);
  document.getElementById('lexClose').addEventListener('click', closeLexicon);
  document.getElementById('lexBg').addEventListener('click', closeLexicon);
  var bookName = qs('book') || 'Genesis';
  var chapter = parseInt(qs('chapter') || '1', 10) || 1;
  var verse = qs('verse') ? parseInt(qs('verse'), 10) : null;
  var book = findKjvBook(bookName) || KJV_BOOKS[0];
  if (chapter < 1) chapter = 1;
  if (chapter > book.chapters) chapter = book.chapters;
  showChapter(book, chapter, verse);
}
init();
