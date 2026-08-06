/** KJV book list — Phase 1. Word-study (Strong's etc.) can attach later by verseId. */
window.KJV_BOOKS = [
  { name: "Genesis", file: "Genesis", testament: "OT", abbr: "Gen", chapters: 50 },
  { name: "Exodus", file: "Exodus", testament: "OT", abbr: "Exo", chapters: 40 },
  { name: "Leviticus", file: "Leviticus", testament: "OT", abbr: "Lev", chapters: 27 },
  { name: "Numbers", file: "Numbers", testament: "OT", abbr: "Num", chapters: 36 },
  { name: "Deuteronomy", file: "Deuteronomy", testament: "OT", abbr: "Deu", chapters: 34 },
  { name: "Joshua", file: "Joshua", testament: "OT", abbr: "Jos", chapters: 24 },
  { name: "Judges", file: "Judges", testament: "OT", abbr: "Jdg", chapters: 21 },
  { name: "Ruth", file: "Ruth", testament: "OT", abbr: "Rut", chapters: 4 },
  { name: "1 Samuel", file: "1Samuel", testament: "OT", abbr: "1Sa", chapters: 31 },
  { name: "2 Samuel", file: "2Samuel", testament: "OT", abbr: "2Sa", chapters: 24 },
  { name: "1 Kings", file: "1Kings", testament: "OT", abbr: "1Ki", chapters: 22 },
  { name: "2 Kings", file: "2Kings", testament: "OT", abbr: "2Ki", chapters: 25 },
  { name: "1 Chronicles", file: "1Chronicles", testament: "OT", abbr: "1Ch", chapters: 29 },
  { name: "2 Chronicles", file: "2Chronicles", testament: "OT", abbr: "2Ch", chapters: 36 },
  { name: "Ezra", file: "Ezra", testament: "OT", abbr: "Ezr", chapters: 10 },
  { name: "Nehemiah", file: "Nehemiah", testament: "OT", abbr: "Neh", chapters: 13 },
  { name: "Esther", file: "Esther", testament: "OT", abbr: "Est", chapters: 10 },
  { name: "Job", file: "Job", testament: "OT", abbr: "Job", chapters: 42 },
  { name: "Psalms", file: "Psalms", testament: "OT", abbr: "Psa", chapters: 150 },
  { name: "Proverbs", file: "Proverbs", testament: "OT", abbr: "Pro", chapters: 31 },
  { name: "Ecclesiastes", file: "Ecclesiastes", testament: "OT", abbr: "Ecc", chapters: 12 },
  { name: "Song of Solomon", file: "SongofSolomon", testament: "OT", abbr: "Sng", chapters: 8 },
  { name: "Isaiah", file: "Isaiah", testament: "OT", abbr: "Isa", chapters: 66 },
  { name: "Jeremiah", file: "Jeremiah", testament: "OT", abbr: "Jer", chapters: 52 },
  { name: "Lamentations", file: "Lamentations", testament: "OT", abbr: "Lam", chapters: 5 },
  { name: "Ezekiel", file: "Ezekiel", testament: "OT", abbr: "Ezk", chapters: 48 },
  { name: "Daniel", file: "Daniel", testament: "OT", abbr: "Dan", chapters: 12 },
  { name: "Hosea", file: "Hosea", testament: "OT", abbr: "Hos", chapters: 14 },
  { name: "Joel", file: "Joel", testament: "OT", abbr: "Jol", chapters: 3 },
  { name: "Amos", file: "Amos", testament: "OT", abbr: "Amo", chapters: 9 },
  { name: "Obadiah", file: "Obadiah", testament: "OT", abbr: "Oba", chapters: 1 },
  { name: "Jonah", file: "Jonah", testament: "OT", abbr: "Jon", chapters: 4 },
  { name: "Micah", file: "Micah", testament: "OT", abbr: "Mic", chapters: 7 },
  { name: "Nahum", file: "Nahum", testament: "OT", abbr: "Nah", chapters: 3 },
  { name: "Habakkuk", file: "Habakkuk", testament: "OT", abbr: "Hab", chapters: 3 },
  { name: "Zephaniah", file: "Zephaniah", testament: "OT", abbr: "Zep", chapters: 3 },
  { name: "Haggai", file: "Haggai", testament: "OT", abbr: "Hag", chapters: 2 },
  { name: "Zechariah", file: "Zechariah", testament: "OT", abbr: "Zec", chapters: 14 },
  { name: "Malachi", file: "Malachi", testament: "OT", abbr: "Mal", chapters: 4 },
  { name: "Matthew", file: "Matthew", testament: "NT", abbr: "Mat", chapters: 28 },
  { name: "Mark", file: "Mark", testament: "NT", abbr: "Mrk", chapters: 16 },
  { name: "Luke", file: "Luke", testament: "OT", abbr: "Luk", chapters: 24 },
  { name: "John", file: "John", testament: "NT", abbr: "Jhn", chapters: 21 },
  { name: "Acts", file: "Acts", testament: "NT", abbr: "Act", chapters: 28 },
  { name: "Romans", file: "Romans", testament: "NT", abbr: "Rom", chapters: 16 },
  { name: "1 Corinthians", file: "1Corinthians", testament: "NT", abbr: "1Co", chapters: 16 },
  { name: "2 Corinthians", file: "2Corinthians", testament: "NT", abbr: "2Co", chapters: 13 },
  { name: "Galatians", file: "Galatians", testament: "NT", abbr: "Gal", chapters: 6 },
  { name: "Ephesians", file: "Ephesians", testament: "NT", abbr: "Eph", chapters: 6 },
  { name: "Philippians", file: "Philippians", testament: "NT", abbr: "Php", chapters: 4 },
  { name: "Colossians", file: "Colossians", testament: "NT", abbr: "Col", chapters: 4 },
  { name: "1 Thessalonians", file: "1Thessalonians", testament: "NT", abbr: "1Th", chapters: 5 },
  { name: "2 Thessalonians", file: "2Thessalonians", testament: "NT", abbr: "2Th", chapters: 3 },
  { name: "1 Timothy", file: "1Timothy", testament: "NT", abbr: "1Ti", chapters: 6 },
  { name: "2 Timothy", file: "2Timothy", testament: "NT", abbr: "2Ti", chapters: 4 },
  { name: "Titus", file: "Titus", testament: "NT", abbr: "Tit", chapters: 3 },
  { name: "Philemon", file: "Philemon", testament: "NT", abbr: "Phm", chapters: 1 },
  { name: "Hebrews", file: "Hebrews", testament: "NT", abbr: "Heb", chapters: 13 },
  { name: "James", file: "James", testament: "NT", abbr: "Jas", chapters: 5 },
  { name: "1 Peter", file: "1Peter", testament: "NT", abbr: "1Pe", chapters: 5 },
  { name: "2 Peter", file: "2Peter", testament: "NT", abbr: "2Pe", chapters: 3 },
  { name: "1 John", file: "1John", testament: "NT", abbr: "1Jn", chapters: 5 },
  { name: "2 John", file: "2John", testament: "NT", abbr: "2Jn", chapters: 1 },
  { name: "3 John", file: "3John", testament: "NT", abbr: "3Jn", chapters: 1 },
  { name: "Jude", file: "Jude", testament: "NT", abbr: "Jud", chapters: 1 },
  { name: "Revelation", file: "Revelation", testament: "NT", abbr: "Rev", chapters: 22 }
];

window.KJV_CDN = "https://cdn.jsdelivr.net/gh/aruljohn/Bible-kjv@master/";

window.findKjvBook = function (query) {
  if (!query) return null;
  var q = String(query).trim().toLowerCase();
  var list = window.KJV_BOOKS || [];
  for (var i = 0; i < list.length; i++) {
    var b = list[i];
    if (b.name.toLowerCase() === q || b.file.toLowerCase() === q || b.abbr.toLowerCase() === q) return b;
  }
  for (var j = 0; j < list.length; j++) {
    var b2 = list[j];
    if (b2.name.toLowerCase().indexOf(q) === 0 || b2.file.toLowerCase().indexOf(q.replace(/\s+/g, "")) === 0) return b2;
  }
  return null;
};

window.parseBibleRef = function (input) {
  var s = String(input || "").trim();
  if (!s) return null;
  var m = s.match(/^(\d?\s*[A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(\d+)(?::(\d+))?$/);
  if (!m) return null;
  var book = window.findKjvBook(m[1].replace(/\s+/g, " ").trim());
  if (!book) return null;
  var chapter = parseInt(m[2], 10);
  var verse = m[3] ? parseInt(m[3], 10) : null;
  if (!chapter || chapter < 1 || chapter > book.chapters) return null;
  return { book: book, chapter: chapter, verse: verse };
};

window.verseId = function (book, chapter, verse) {
  return book.abbr + "." + chapter + "." + verse;
};

window.verseRef = function (book, chapter, verse) {
  return book.name + " " + chapter + ":" + verse;
};

window.noteKey = function (ref) {
  return "note-" + ref;
};
