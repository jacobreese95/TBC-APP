function w(word, strongs, vines, webster) {
    return { word, strongs, vines, webster };
}

const verses = [
    {
        ref: "Genesis 1:1",
        text: "In the beginning God created the heaven and the earth.",
        words: [
            w("In", "H7225 - re'shiyth", "Marks the starting point of time.", "Preposition denoting inclusion or time."),
            w("the", "English article", "Points to a specific beginning.", "Definite article."),
            w("beginning", "H7225 - re'shiyth (the first, in place, time, order or rank)", "The commencement; the first in a series.", "The first part of time; the commencement."),
            w("God", "H430 - 'elohiym (plural of God, the supreme God)", "The supreme Being, Creator of all things.", "The Supreme Being; the eternal and infinite Spirit."),
            w("created", "H1254 - bara' (to create, shape, form)", "To bring into existence that which did not previously exist.", "To cause to exist; to bring into being."),
            w("the", "H853 - 'eth", "Marks the definite object.", "Definite article."),
            w("heaven", "H8064 - shamayim (the sky, the heights)", "The sky or the abode of God.", "The region of the air; the sky."),
            w("and", "Conjunction", "Connects the objects of creation.", "Connecting word."),
            w("the", "H853 - 'eth", "Marks the definite object.", "Definite article."),
            w("earth", "H776 - 'erets (earth, land, country)", "The dry land or the whole world.", "The terraqueous globe which we inhabit.")
        ]
    },
    {
        ref: "Genesis 1:2",
        text: "And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.",
        words: [
            w("And", "Conjunction", "Continues the narrative.", "Connecting word."),
            w("the", "Definite article", "Specifies the earth.", "Definite article."),
            w("earth", "H776 - 'erets", "The dry land / world.", "The terraqueous globe."),
            w("was", "H1961 - hayah (to be, become)", "Indicates state or existence.", "Existed; continued in a state."),
            w("without", "Part of H8414", "Describes lack of form.", "Not having; lacking."),
            w("form", "H8414 - tohuw (formlessness, emptiness)", "Emptiness, desolation, disorder.", "Shape; configuration."),
            w("and", "Conjunction", "Joins the descriptions.", "Connecting word."),
            w("void", "H922 - bohuw (emptiness, void)", "Empty; desolate.", "Empty; vacant."),
            w("and", "Conjunction", "Continues.", "Connecting word."),
            w("darkness", "H2822 - choshek (darkness, obscurity)", "Absence of light.", "Absence of light."),
            w("was", "H1961 - hayah", "Existed upon.", "Existed."),
            w("upon", "H5921 - 'al (upon, above)", "On the surface of.", "On; on the surface of."),
            w("the", "Definite article", "Specifies the face.", "Definite article."),
            w("face", "H6440 - paniym (face, surface)", "The surface or presence.", "The surface; the front."),
            w("of", "Preposition", "Indicates relation.", "Belonging to."),
            w("the", "Definite article", "Specifies the deep.", "Definite article."),
            w("deep", "H8415 - t@howm (deep, abyss)", "The great deep; the abyss of waters.", "The sea; the abyss."),
            w("And", "Conjunction", "Introduces the next action.", "Connecting word."),
            w("the", "Definite article", "Specifies the Spirit.", "Definite article."),
            w("Spirit", "H7307 - ruwach (wind, breath, spirit)", "The Holy Spirit; the Spirit of God.", "The intelligent, immaterial part; also the Holy Spirit."),
            w("of", "Preposition", "Indicates belonging.", "Belonging to."),
            w("God", "H430 - 'elohiym", "The supreme God.", "The Supreme Being."),
            w("moved", "H7363 - rachaph (to brood, hover)", "To hover or brood over, as a bird over its young.", "To change place or posture; to stir."),
            w("upon", "H5921 - 'al", "Over the surface.", "On; over."),
            w("the", "Definite article", "Specifies the face.", "Definite article."),
            w("face", "H6440 - paniym", "The surface.", "The surface."),
            w("of", "Preposition", "Indicates relation.", "Of."),
            w("the", "Definite article", "Specifies the waters.", "Definite article."),
            w("waters", "H4325 - mayim (waters)", "The waters.", "Water; the fluid that descends from the clouds.")
        ]
    }
    // Additional verses 3-31 will be added in the next update to complete the chapter
];

const versesDiv = document.getElementById('verses');

verses.forEach((verse, index) => {
    const verseDiv = document.createElement('div');
    verseDiv.className = 'verse';

    let wordsHTML = '';
    verse.words.forEach(item => {
        wordsHTML += `
            <div class="word-block">
                <div class="word-title">${item.word}</div>
                <span class="def-label">Strong's:</span>
                <div>${item.strongs}</div>
                <span class="def-label">Vine's:</span>
                <div>${item.vines}</div>
                <span class="def-label">Webster's 1828:</span>
                <div>${item.webster}</div>
            </div>
        `;
    });

    verseDiv.innerHTML = `
        <strong>${verse.ref}</strong>
        <div class="verse-text">${verse.text}</div>
        <div class="verse-menu" id="menu-${index}">
            ${wordsHTML}
            <p style="margin-top:18px;"><strong>My Notes:</strong></p>
            <textarea placeholder="Write your notes here..." onblur="saveNote('${verse.ref}', this.value)">${localStorage.getItem('note-' + verse.ref) || ''}</textarea>
        </div>
    `;

    verseDiv.onclick = function(e) {
        if (e.target.tagName === 'TEXTAREA') return;
        const menu = document.getElementById('menu-' + index);
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    };

    versesDiv.appendChild(verseDiv);
});

function saveNote(reference, text) {
    if (text.trim() === '') {
        localStorage.removeItem('note-' + reference);
    } else {
        localStorage.setItem('note-' + reference, text);
    }
}
