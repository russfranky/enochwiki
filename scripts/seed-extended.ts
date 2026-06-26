// Phase 1 expanded seed — Ethiopian Bible Study Database
// Public-domain content: R.H. Charles translations of 1 Enoch, Jubilees, 4 Baruch
// Plus structured metadata for Meqabyan and Emmerich visions

import { db } from '../src/lib/db'

// ════════════════════════════════════════════════════════════════════════════
// PERSPECTIVE TAGS (Section 4 of spec)
// ════════════════════════════════════════════════════════════════════════════

const PERSPECTIVES = [
  { slug: 'secular-academic', name: 'Secular Academic / Critical Scholarship', description: 'Peer-reviewed historical-critical method; secular universities; skeptical of supernatural claims by method.', color: '#4a5568' },
  { slug: 'mainstream-christian', name: 'Mainstream Christian Scholarship', description: 'Christian academic theology across denominations; affirms faith commitments while using critical method.', color: '#2d3748' },
  { slug: 'catholic', name: 'Catholic Tradition', description: 'Roman Catholic magisterium, Fathers, Doctors of the Church; Deuterocanonical canon.', color: '#7b341e' },
  { slug: 'eastern-orthodox', name: 'Eastern Orthodox Tradition', description: 'Greek/Russian/Slavic Orthodox patristic tradition; Septuagint-based canon.', color: '#2b6cb0' },
  { slug: 'ethiopian-tewahedo', name: 'Ethiopian Orthodox Tewahedo', description: 'The 81-book canon; preserves 1 Enoch, Jubilees, Meqabyan, 4 Baruch as scripture. Ge\'ez liturgical tradition.', color: '#6b1f2a' },
  { slug: 'protestant', name: 'Protestant Tradition', description: 'Reformation traditions; 66-book canon; generally reject Apocrypha as deutero-canonical.', color: '#553c9a' },
  { slug: 'jewish', name: 'Jewish Sources', description: 'Hebrew Bible (Tanakh), Talmud, Midrash, rabbinic tradition. Second Temple period sources including DSS.', color: '#1a4d2e' },
  { slug: 'apocryphal', name: 'Apocryphal / Non-Canonical Text', description: 'Texts outside any mainstream canon (e.g. Gospel of Thomas, Apocalypse of Peter). Treated as historical witnesses, not scripture.', color: '#975a16' },
  { slug: 'mystical-visionary', name: 'Mystical / Visionary / Devotional', description: 'Private revelation and mystical theology: Anne Catherine Emmerich, Hildegard of Bingen, Julian of Norwich. Treated as devotional, not doctrinal.', color: '#b8893a' },
  { slug: 'fringe-speculative', name: 'Fringe / Speculative', description: 'Non-peer-reviewed theories: ancient aliens, Nephilim-as-ET, Christian Identity, occult interpretations. Surfaced only to flag and contextualize.', color: '#9b2c2c' },
]

// ════════════════════════════════════════════════════════════════════════════
// CLAIM TYPES (Section 4)
// ════════════════════════════════════════════════════════════════════════════

const CLAIM_TYPES = [
  { slug: 'textually-attested', name: 'Textually Attested', description: 'The claim appears in a named text. Says nothing about historical truth — only that the text says it.', color: '#2d3748' },
  { slug: 'historically-corroborated', name: 'Historically / Archaeologically Corroborated', description: 'Supported by external historical or archaeological evidence (e.g. Qumran fragments confirming 1 Enoch\'s antiquity).', color: '#1a4d2e' },
  { slug: 'scholarly-consensus', name: 'Scholarly Consensus', description: 'Majority view in peer-reviewed academic literature (e.g. 1 Enoch composed 300-100 BCE).', color: '#2b6cb0' },
  { slug: 'contested-minority', name: 'Contested / Minority View', description: 'A real scholarly position but held by a minority; competing majority view exists.', color: '#975a16' },
  { slug: 'tradition-devotional', name: 'Tradition / Devotional', description: 'A claim held within a faith tradition without external corroboration (e.g. Enoch\'s assumption into Eden).', color: '#7b341e' },
  { slug: 'visionary-private-revelation', name: 'Visionary / Private Revelation', description: 'A claim originating in a private mystical vision (e.g. Emmerich\'s descriptions of Christ\'s descent into Hades). Treated as devotional, not factual.', color: '#b8893a' },
  { slug: 'speculative', name: 'Speculative', description: 'Extrapolation beyond what text or evidence supports; or fringe theory. Surfaced only with explicit flagging.', color: '#9b2c2c' },
]

// ════════════════════════════════════════════════════════════════════════════
// BOOKS — expanded canon metadata
// ════════════════════════════════════════════════════════════════════════════

const BOOKS = [
  {
    slug: '1-enoch', name: '1 Enoch (Ethiopic)', geezName: 'መጽሐፈ ሄኖክ',
    category: 'Apocalyptic', canon: 'Unique-Ethiopian', canonLayer: 'broad', order: 1,
    author: 'Traditionally Enoch son of Jared; modern scholarship attributes to multiple authors',
    dateRange: '300 BCE - 100 BCE (composite)',
    translation: 'R.H. Charles (1917) — public domain',
    sourceUrl: 'https://sacred-texts.com/bib/boe/',
    license: 'Public Domain',
    summary: 'A composite apocalyptic work preserved complete only in Ge\'ez. Five sections: (1) Book of Watchers ch.1-36, (2) Book of Parables ch.37-71, (3) Astronomical Book ch.72-82, (4) Book of Dream Visions ch.83-90, (5) Epistle of Enoch ch.91-108. Quoted in the New Testament (Jude 14-15) and treated as scripture in the Ethiopian Orthodox Tewahedo Church.',
    filmRelevance: 'Central to the surrounding discussion of the Gibson film. The Book of Watchers (1-36) describes the descent of fallen angels, the Nephilim, and the corruption that triggered the flood — material the film is likely to engage visually. The Book of Parables (37-71) introduces the "Son of Man" judge figure that influences the harrowing-of-hell tradition.',
  },
  {
    slug: 'jubilees', name: 'Book of Jubilees', geezName: 'መጽሐፈ ኩፋሌ',
    category: 'Historical', canon: 'Unique-Ethiopian', canonLayer: 'broad', order: 2,
    author: 'Anonymous (likely a 2nd-c. BCE Hasidean or Hasmonaean-era priest)',
    dateRange: '160 BCE - 150 BCE',
    translation: 'R.H. Charles (1917) — public domain',
    sourceUrl: 'https://sacred-texts.com/bib/jub/',
    license: 'Public Domain',
    summary: 'A retelling of Genesis 1 through Exodus 12 framed as a revelation to Moses on Sinai by the Angel of the Presence. Establishes a 364-day solar calendar, the Noahide covenant, and Levitical priesthood on a Jubilee (49-year) cycle. Found among the Dead Sea Scrolls in multiple Hebrew copies — important witness to Second Temple Judaism.',
    filmRelevance: 'Provides the calendar framework that places Passion-week events in the priestly cycle. The film\'s emphasis on Ascension Day timing (May 6, 2027) intersects with the solar-calendar tradition Jubilees mandates.',
  },
  {
    slug: 'genesis', name: 'Genesis', geezName: 'መጽሐፈ በርእስት',
    category: 'Pentateuch', canon: 'Ethiopian-OT-Narrow', canonLayer: 'narrow', order: 3,
    author: 'Traditionally Moses', dateRange: 'c. 950 - 540 BCE (compiled)',
    translation: 'Public domain (ASV-based)',
    summary: 'The first book of the Torah: creation, primeval history (Gen 1-11), the patriarchs Abraham/Isaac/Jacob/Joseph (Gen 12-50). The Ethiopian canon reads Genesis alongside Jubilees and 1 Enoch as a single integrated primeval narrative.',
    filmRelevance: 'Genesis 6:1-4 (sons of God / Nephilim) is the locus classicus for the Watchers tradition that 1 Enoch expands. The film audience will encounter this in searches about "who were the Nephilim".',
  },
  {
    slug: '4-baruch', name: '4 Baruch (Paralipomena of Jeremiah)', geezName: 'መጽሐፈ ባሩክ',
    category: 'Apocalyptic', canon: 'Unique-Ethiopian', canonLayer: 'broad', order: 4,
    author: 'Anonymous Jewish Christian (likely 1st-2nd c. CE)',
    dateRange: '1st c. CE - 2nd c. CE',
    translation: 'R.H. Charles (1896) — public domain abridgment',
    sourceUrl: 'https://sacred-texts.com/chr/apo/baruch.htm',
    license: 'Public Domain',
    summary: 'An apocryphal work preserved in the Ethiopian canon recounting the aftermath of Jerusalem\'s fall (586 BCE). Crucially includes a tradition (ch. 9-14) that Jeremiah sent a letter to the exiles being led captive to Babylon; the letter recounts how God, after the fall of Jerusalem, comforted them by promising that no enemy would have power over them — and includes the famous episode of Abel\'s blood crying out, which early Christians read as testimony to Christ\'s descent into Hades to preach to the dead (cf. 1 Peter 3:19-4:6, Ephesians 4:7-10).',
    filmRelevance: 'DIRECTLY relevant to the harrowing-of-hell tradition. The Resurrection of the Christ is expected to depict Christ\'s descent into Hades between crucifixion and resurrection (Saturday of Holy Week). 4 Baruch is one of the Jewish-apocryphal sources that shaped early Christian understanding of this event. The "Abel\'s blood" episode connects to Matthew 23:35.',
  },
  {
    slug: '1-meqabyan', name: '1 Meqabyan (Ethiopic Maccabees)', geezName: 'መቃበያነ 1',
    category: 'Historical', canon: 'Unique-Ethiopian', canonLayer: 'broad', order: 5,
    author: 'Anonymous Ethiopian',
    dateRange: ' uncertain — likely early centuries CE',
    translation: 'Not widely translated; Ge\'ez text primary',
    sourceUrl: 'https://www.academia.edu/ (search: Meqabyan translation)',
    license: 'Ge\'ez text — public domain; English translations vary',
    summary: 'NOT the same as 1-2 Maccabees in Catholic/Orthodox Bibles. Three books (1-3 Meqabyan) unique to the Ethiopian canon. 1 Meqabyan is a brief apocalyptic-historical work centered on a figure named "Meqabyan" (a different person from the Maccabean Judas). Contains a vision of judgment and the abyss.',
    filmRelevance: 'Important to clarify for the post-release audience: "Ethiopian Maccabees" ≠ the Maccabees of Catholic/Orthodox Bibles. Common confusion in popular search.',
  },
  {
    slug: 'emmerich-visions', name: 'Visions of Anne Catherine Emmerich (Index)', geezName: '',
    category: 'Mystical', canon: 'apocryphal', canonLayer: 'apocryphal', order: 6,
    author: 'Anne Catherine Emmerich (1774-1824, Augustinian nun) — recorded by Clemens Brentano',
    dateRange: '1818-1824 (visions); published 1833 (German)',
    translation: 'English translation anonymous, 19th c. — public domain',
    sourceUrl: 'https://www.emmerich1.com/',
    license: 'Public Domain (19th-c. English translation)',
    summary: 'NOT scripture and never claimed to be. Private mystical visions of the Augustinian nun Anne Catherine Emmerich, recorded by the poet Clemens Brentano. Documented influence on Mel Gibson\'s The Passion of the Christ (2004). Includes extensive visionary material on Christ\'s descent into Hades (harrowing of hell) that may appear in The Resurrection of the Christ. Treated here as a primary source for the film\'s likely non-canonical content, NOT as authoritative religious text.',
    filmRelevance: 'CRITICAL for understanding the film. The Passion of the Christ drew directly from Emmerich (e.g. the veiled Veronica, the demonic child, Mary\'s underground route). The Resurrection of the Christ is expected to draw from her visions of Christ\'s descent into Hades — material not in the canonical gospels. Every claim from Emmerich must be labeled "visionary / private revelation" per Section 4.',
  },
]

// ════════════════════════════════════════════════════════════════════════════
// GLOSSARY ENTRIES
// ════════════════════════════════════════════════════════════════════════════

const GLOSSARY = [
  {
    term: 'Watchers', geezTerm: 'እግርግሮስ (ʼegrigōros)', pronunciation: 'egrēgoroi',
    category: 'Angel',
    definition: 'A class of angels whose name derives from Aramaic ʿirin ("wakeful ones"), translated in Greek as egrēgoroi. In 1 Enoch 6-16, 200 Watchers descend from heaven to Mount Hermon, take human wives, and father the Nephilim. They teach forbidden arts (metallurgy, sorcery, astrology, herbology) and are bound in the valleys of the earth until judgment.',
    perspectiveNotes: JSON.stringify({
      'ethiopian-tewahedo': 'Treated as historical narrative within 1 Enoch, which is canonical scripture.',
      'mainstream-christian': 'Generally read as theological myth encoding real spiritual rebellion; literal angel-human hybridity debated.',
      'secular-academic': 'Read as Second Temple Jewish mythology drawing on Mesopotamian apkallu traditions; the "descent" motif encodes anxieties about priestly intermarriage (Genesis 6:1-4 interpreted in light of Ezra 9-10).',
      'jewish': 'Echoed in rabbinic traditions about Shemhazai and Aza(z)el; not part of normative rabbinic theology but present in midrashic literature.',
    }),
    relatedTerms: 'Nephilim|Azazel|Mount Hermon|Book of Watchers',
    scriptureRefs: '1-enoch 6:2|1-enoch 6:6|1-enoch 7:1|1-enoch 9:1|1-enoch 10:7|1-enoch 12:2|genesis 6:2|genesis 6:4',
  },
  {
    term: 'Nephilim', geezTerm: 'ነፌል (nefel)', pronunciation: 'nəfīlīm',
    category: 'People-group',
    definition: 'From Hebrew nāpal ("to fall"); "the fallen ones" or "those who cause to fall." In Genesis 6:4 and 1 Enoch 7, the offspring of the Watchers and human women — giants whose violence and consumption devastate the earth and trigger the flood. After the flood, tradition varies on whether Nephilim survived (Numbers 13:33 mentions them in Canaan) or whether their disembodied spirits became demons (1 Enoch 15:8-12).',
    perspectiveNotes: JSON.stringify({
      'ethiopian-tewahedo': 'Literal giant offspring of angel-human union; their spirits survive as demons.',
      'mainstream-christian': 'Three main views: (1) literal angel-human hybridity (ancient, patristic, held by Augustine\'s predecessor), (2) Sethite view — "sons of God" = godly line of Seth intermarrying Cain\'s line (Augustine, Calvin, mainstream Protestant), (3) royal/tyrant view — "sons of God" = kings or judges taking women by force.',
      'secular-academic': 'Mythological motif paralleled in Ugaritic, Hittite, and Mesopotamian apkallu-ummân traditions. The Numbers 13:33 use is likely polemical (scouts intimidating Israel).',
      'fringe-speculative': 'Ancient-astronaut theories identify Nephilim as extraterrestrial-human hybrids — explicitly REJECTED by mainstream scholarship and treated here only as a flagged blindspot.',
    }),
    relatedTerms: 'Watchers|Mount Hermon|Flood|Rephaim',
    scriptureRefs: 'genesis 6:4|numbers 13:33|1-enoch 7:2|1-enoch 7:4|1-enoch 15:8|jubilees 5:1',
  },
  {
    term: 'Azazel', geezTerm: 'አዛዜል (ʼāzāzēl)', pronunciation: 'ə-ˈzā-zəl',
    category: 'Angel',
    definition: 'A leader of the fallen Watchers (1 Enoch 8:1, 9:6, 10:4-8). Teaches men metallurgy (swords, ornaments) and women cosmetics — leading to "much godlessness." Bound by Raphael in the desert of Dudael, covered with jagged rocks, until the day of judgment when he is cast into fire. Also named in Leviticus 16:8-10, 21-22 as the recipient of the Yom Kippur scapegoat — though rabbinic tradition reads "for Azazel" variously as "to a place called Azazel," "to dismissal," or "to a wilderness demon."',
    perspectiveNotes: JSON.stringify({
      'secular-academic': 'Milgrom (1990) demonstrates "Azazel" is a personal name in Leviticus 16, not a place. The 1 Enoch tradition develops this wilderness-demon figure into a fallen-Watcher chief. Parallel to the Ugaritic demon-pattern of Asael/Azael.',
      'ethiopian-tewahedo': 'Azazel is a real fallen angel, bound in Dudael, awaiting judgment. Conflated in later Ethiopian demonology with various named demons.',
      'jewish': 'In the Mishnah (Yoma 6:2) the scapegoat was pushed backward off a cliff — ensuring the rite was completed and not merely "sent away." The Talmud (Yoma 67b) reads Azazel as a personal name.',
      'mainstream-christian': 'Hebrews 9-10 reinterprets the Yom Kippur typology: Christ is both goat — slaughtered for the sanctuary and sent "outside the camp" (Heb 13:12).',
    }),
    relatedTerms: 'Watchers|Yom Kippur|Scapegoat|Dudael',
    scriptureRefs: 'leviticus 16:8|leviticus 16:10|1-enoch 8:1|1-enoch 9:6|1-enoch 10:4|1-enoch 13:1|1-enoch 54:4',
  },
  {
    term: 'Mount Hermon', geezTerm: 'ጸዓር (ṣəʿār)', pronunciation: 'her-mən',
    category: 'Place',
    definition: 'The highest mountain in the Levant (9,232 ft / 2,814 m), at the northern edge of the Golan Heights. In 1 Enoch 6:6, the 200 Watchers descend on its summit and swear their mutual-imprecation covenant there — the name "Hermon" itself derived from ḥerem (curse/devotion). At its foot lies Banias / Caesarea Philippi, site of Peter\'s confession (Matthew 16:13-20).',
    perspectiveNotes: JSON.stringify({
      'ethiopian-tewahedo': 'The literal location of the Watchers\' descent and oath — a cursed/devoted place.',
      'secular-academic': 'Archaeological excavation at Banias confirms continuous cultic activity from the Iron Age through Roman period (Pan worship in the Hellenistic era). The choice of "Hermon" in 1 Enoch likely reflects the mountain\'s long sacral reputation in the region.',
      'mainstream-christian': 'Jesus\'s "on this rock" declaration at Caesarea Philippi (Matt 16:18) may be a deliberate counter-declaration at the site of the Watchers\' covenant — "the gates of Hades shall not prevail" reads differently at the foot of Hermon.',
    }),
    relatedTerms: 'Watchers|Banias|Caesarea Philippi|Hermon Covenant',
    scriptureRefs: '1-enoch 6:6|deuteronomy 3:8|deuteronomy 3:9|joshua 11:3|matthew 16:13|matthew 16:18',
  },
  {
    term: 'Son of Man', geezTerm: 'ወልደ ሰብእ (walda sabʼ)', pronunciation: 'bar-ʾěnāš',
    category: 'Concept',
    definition: 'An eschatological figure in 1 Enoch 46, 48, 62, 71 — "one like a son of man" presented before the Ancient of Days, granted authority to judge. Derives from Daniel 7:13. In the Synoptic Gospels, Jesus applies the title to himself (especially Mark 14:62, combining Daniel 7:13 with Psalm 110:1) — a claim the high priest reads as blasphemy.',
    perspectiveNotes: JSON.stringify({
      'secular-academic': 'In Daniel 7, "one like a son of man" likely symbolizes "the holy ones of the Most High" (v. 18, 22) — i.e. the persecuted saints collectively. In 1 Enoch 46-71 the figure is individualized as a heavenly judge. The Synoptic usage is contested: did Jesus use it as a self-reference, an eschatological title, or in a more modest Aramaic idiom?',
      'ethiopian-tewahedo': 'The Son of Man of 1 Enoch is the pre-incarnate Christ — the same figure who appears in Daniel 7 and to whom Jesus refers.',
      'mainstream-christian': 'Generally affirmed as a Christological title, but its precise content in Jesus\'s usage is debated. The 1 Enoch Parables (37-71) complicate things because they post-date Daniel and may themselves be influenced by early Christian Christology (debated; most scholars now date Parables pre-Christian).',
    }),
    relatedTerms: 'Ancient of Days|Eschatology|Book of Parables',
    scriptureRefs: 'daniel 7:13|1-enoch 46:1|1-enoch 46:3|1-enoch 48:2|1-enoch 62:5|1-enoch 71:14|mark 14:62|matthew 25:31',
  },
  {
    term: 'Harrowing of Hell', geezTerm: 'ወርደቶ (wärdatō)', pronunciation: 'har-ō-ing',
    category: 'Concept',
    definition: 'The traditional Christian doctrine (drawn from 1 Peter 3:19-4:6, Ephesians 4:7-10, and the Apostles\' Creed line "descendit ad inferos") that between his burial and resurrection, Christ descended into Hades / Sheol to proclaim victory over the powers and to liberate the righteous dead of the Old Covenant. The imagery of "leading captivity captive" (Eph 4:8, quoting Psalm 68:18) shaped the iconography of Christ pulling Adam and Eve from their tombs.',
    perspectiveNotes: JSON.stringify({
      'catholic': 'Affirmed in the Catechism (§632-635): "The gospel was preached even to the dead." Treated as the culmination of the kenosis.',
      'eastern-orthodox': 'Central to Paschal theology — the icons of the Anastasis depict Christ pulling Adam and Eve from Hades. Read typologically, not as a literal geographic descent.',
      'ethiopian-tewahedo': 'Affirmed; intersected with native traditions of Enochic ascents and angelic intermediary figures. The 4 Baruch "letter to the exiles" is read as anticipating this.',
      'protestant': 'Reformation traditions vary. Lutherans retain it (Formula of Concord, Art. IX). Reformed tradition tends to read 1 Peter 3:19 as Christ preaching through Noah, not a literal descent. Most evangelicals treat the descent clause as the most obscure line of the Apostles\' Creed.',
      'secular-academic': 'The doctrine develops from interweaving of 1 Enoch\'s ascension tradition, 4 Baruch\'s "letter to the exiles," the descensus motif in apocryphal gospels (Gospel of Nicodemus / Acts of Pilate ch. 17-27), and the "spirits in prison" passage of 1 Peter. The 4 Baruch "Abel\'s blood cries out" episode becomes the seed for Christ preaching to the dead.',
      'mystical-visionary': 'Anne Catherine Emmerich\'s visions include extensive descriptions of Christ\'s descent into Hades (Life of Jesus Christ, ch. 60-62 of vol. on the Passion). These are documented influences on The Passion of the Christ (2004) and likely on The Resurrection of the Christ.',
    }),
    relatedTerms: 'Christ\'s Descent|Sheol|Hades|4 Baruch|Emmerich',
    scriptureRefs: '1-peter 3:19|1-peter 4:6|ephesians 4:8|ephesians 4:9|matthew 27:52|acts 2:27|psalm 68:18|4-baruch 9|4-baruch 14',
  },
  {
    term: '364-Day Calendar', geezTerm: 'ሰንበት (sanbat)', pronunciation: '',
    category: 'Concept',
    definition: 'The priestly solar calendar mandated by Jubilees 6:32 and the Astronomical Book of 1 Enoch (ch. 72-82). 364 days = exactly 52 weeks, divided into four 91-day quarters each beginning on the same day of the week. Contrasts with the lunar calendar of post-exilic Jerusalem (which became normative in rabbinic Judaism). The DSS community appears to have followed this 364-day calendar in opposition to the Hasmonean Temple establishment.',
    perspectiveNotes: JSON.stringify({
      'secular-academic': 'Well-attested in Qumran calendar texts (4QCalendrical Document, Songs of the Sabbath Sacrifice). The 364-day year is astronomically imperfect (true solar year ≈ 365.24 days), but its mathematical regularity served liturgical purposes. VanderKam (1979) and Beckwith (1981) are foundational studies.',
      'ethiopian-tewahedo': 'The Ethiopian calendar retains 13 months (12 × 30 + 1 × 5 or 6), a different system but one historically influenced by the Alexandrian-Coptic tradition which itself drew on the Enochic solar calendar.',
      'mainstream-christian': 'Historical curiosity; not observed. The Christian liturgical calendar derives from the Jewish lunar-solar cycle for Easter (Nicaea, 325 CE).',
    }),
    relatedTerms: 'Astronomical Book|Sabbath|Jubilee',
    scriptureRefs: '1-enoch 72|1-enoch 73|1-enoch 74|1-enoch 75|1-enoch 82|jubilees 6:32|jubilees 6:36',
  },
  {
    term: 'Sheol / Hades', geezTerm: 'ሲኦል (siʼōl)', pronunciation: 'shee-ˈōl',
    category: 'Place',
    definition: 'The Hebrew/Abyss realm of the dead — not "hell" in the later Christian sense of Gehenna (place of punishment) but the common abode of all the dead, righteous and wicked alike. In the Septuagint, Sheol is rendered Hades (ᾅδης). In 1 Enoch 22, Sheol is partitioned into compartments: a separated bright spring for the righteous, murky pits for different classes of sinners, and a place of torment for the wicked awaiting judgment.',
    perspectiveNotes: JSON.stringify({
      'secular-academic': 'Conceptually continuous with Mesopotamian kur-nu-gi-a ("land of no return") and Greek Hades. The compartmentalization in 1 Enoch 22 reflects a developing theology of post-mortem judgment in late Second Temple Judaism.',
      'mainstream-christian': 'In the New Testament, Hades is temporary (the dead are raised at the last day for final judgment) and distinct from the Lake of Fire (Revelation 20:13-14, where "Death and Hades" are themselves cast into the lake).',
      'catholic': 'Distinction between the "limbo of the fathers" (the abode of the righteous dead before Christ, which Christ entered at the harrowing) and purgatory (post-Paschal purification). The Catechism §633 identifies the harrowing with the limbo of the fathers.',
    }),
    relatedTerms: 'Harrowing of Hell|Gehenna|Lake of Fire|Abraham\'s Bosom',
    scriptureRefs: 'genesis 37:35|psalm 16:10|isaiah 38:18|1-enoch 22|luke 16:23|acts 2:27|revelation 20:13',
  },
  {
    term: 'Emmerich, Anne Catherine', geezTerm: '', pronunciation: 'ˈem-ə-rik',
    category: 'Person',
    definition: 'Augustinian Canoness Regular (1774-1824, Augustenburg/Dülmen, Westphalia). Reported extensive visions of the life of Christ and the Virgin Mary from 1818 until her death. The poet Clemens Brentano served as her amanuensis from 1818, recording her visions daily until her death in 1824. The posthumous publications — The Dolorous Passion of Our Lord Jesus Christ (1833), The Life of the Blessed Virgin Mary (1852), and the three-volume Life of Jesus Christ (1854-1881) — became influential devotional literature. Beatified by Pope John Paul II in 2004.',
    perspectiveNotes: JSON.stringify({
      'catholic': 'A "Blessed" — beatified but not canonized. Her visions are classified as "private revelation," which Catholic theology holds is not required for salvation and does not add to the deposit of faith. The faithful are free to devotionally engage but not obligated to believe.',
      'secular-academic': 'Significant scholarly debate over the authenticity of the Brentano records. Jan-Heiner Tück (2014) and others have argued Brentano significantly edited, expanded, and at points fabricated Emmerich\'s reported visions. The historical-critical consensus treats the published texts as a 19th-century devotional composite, not a faithful transcript.',
      'mystical-visionary': 'Devotional communities treat Emmerich\'s visions as inspired private revelation. Her descriptions of Christ\'s Passion and the harrowing of hell are widely cited in popular Catholic piety.',
      'mainstream-christian': 'Protestant and Eastern Orthodox theologians generally do not engage Emmerich\'s visions as authoritative; many are unaware of them. The Passion of the Christ (2004) brought her to wider attention.',
    }),
    relatedTerms: 'Harrowing of Hell|The Passion of the Christ|Private Revelation',
    scriptureRefs: '',
  },
  {
    term: 'Dead Sea Scrolls', geezTerm: '', pronunciation: '',
    category: 'Object',
    definition: 'A corpus of ~930 manuscripts discovered 1947-1956 in eleven caves near Qumran, on the northwestern shore of the Dead Sea. Includes the oldest surviving copies of the Hebrew Bible (c. 250 BCE - 68 CE) and a large library of sectarian and apocalyptic works. Among the finds: multiple Aramaic copies of 1 Enoch (4Q201-212), Hebrew copies of Jubilees (4Q216-228, 1Q17-18, 2Q19-20, 3Q5, 4Q176), and the Genesis Apocryphon (1Q20) — confirming that works the Ethiopian Church counts as scripture were widely read in late Second Temple Judaism.',
    perspectiveNotes: JSON.stringify({
      'secular-academic': 'Foundational for Second Temple studies. The DSS demonstrated that 1 Enoch and Jubilees were Jewish compositions (not later Christian forgeries), composed in Aramaic/Hebrew, and circulated among multiple Jewish groups — not just the Qumran community.',
      'ethiopian-tewahedo': 'Confirms the antiquity and Jewish origin of works the Ethiopian Church has always received as scripture. Vindication of the canon against Western skepticism.',
      'mainstream-christian': 'No doctrinal impact; the DSS do not contain the New Testament and shed light mainly on the Jewish background of early Christianity.',
    }),
    relatedTerms: 'Qumran|1 Enoch|Jubilees|Hasmonean',
    scriptureRefs: '',
  },
]

// ════════════════════════════════════════════════════════════════════════════
// TOPIC PAGES (public-facing landing pages)
// ════════════════════════════════════════════════════════════════════════════

const TOPIC_PAGES = [
  {
    slug: 'resurrection',
    title: 'The Resurrection of Jesus Christ',
    subtitle: 'Canonical accounts, historical claims, and contested traditions',
    seoDescription: 'What the canonical gospels, Paul, and early Christian tradition actually say about Christ\'s resurrection — and where traditions diverge.',
    seoKeywords: 'resurrection of jesus|easter|empty tomb|post-resurrection appearances|1 corinthians 15',
    filmRelevance: 'The central subject of Mel Gibson\'s The Resurrection of the Christ (Part One, May 6, 2027; Part Two, May 25, 2028).',
    canonicalRefs: 'matthew 28|mark 16|luke 24|john 20|1-corinthians 15',
    bodyMarkdown: `# The Resurrection of Jesus Christ

The resurrection of Jesus Christ is the central claim of mainstream Christianity. The four canonical gospels, the Pauline epistles, and the rest of the New Testament treat it as the founding event of the Christian faith.

## What the Canonical Texts Say

- **Matthew 28**: An angel rolls back the stone; women encounter the risen Christ; the guard is bribed to claim the body was stolen.
- **Mark 16**: The shorter ending (v. 1-8) stops at the empty tomb with women fleeing in fear. The longer ending (v. 9-20) appears in later manuscripts and includes post-resurrection appearances.
- **Luke 24**: The road to Emmaus; Christ appears to the disciples and eats fish; the Ascension.
- **John 20-21**: Christ appears to Mary Magdalene, the disciples (doubting Thomas), and a lakeside restoration of Peter.
- **1 Corinthians 15:3-8**: The earliest written creed — Christ died, was buried, rose on the third day, appeared to Cephas, the Twelve, 500 brethren, James, all the apostles, and lastly to Paul.

## Historical Questions

- The **empty tomb tradition** is attested in all four gospels but is not mentioned in 1 Corinthians 15. Most scholars consider the empty tomb a genuine early tradition.
- The **appearances** are described variously — individuals and groups, in Galilee and Jerusalem.
- The **post-resurrection body** is portrayed as both physical (Thomas touching wounds, Christ eating) and glorified (passing through locked doors).

## Traditions Beyond the Canon

These are NOT in the canonical gospels but appear in apocryphal, patristic, or mystical sources:

- **The Harrowing of Hell** (between crucifixion and resurrection): drawn from 1 Peter 3:19-4:6, Ephesians 4:8-10, and elaborated in the Gospel of Nicodemus, 4 Baruch, and the visions of Anne Catherine Emmerich.
- **Christ\'s descent into Hades**: a central theme in Eastern Orthodox iconography (the Anastasis).
- **The 40 days of appearances** (Acts 1:3) between resurrection and ascension.

These traditions are expected to appear in Gibson\'s film. They should not be conflated with the canonical accounts.`,
    reviewState: 'draft',
  },
  {
    slug: 'harrowing-of-hell',
    title: 'The Harrowing of Hell (Christ\'s Descent into Hades)',
    subtitle: 'Between crucifixion and resurrection — what the texts actually say',
    seoDescription: 'The doctrine of Christ\'s descent into Hades: biblical basis, apocryphal development, and the traditions likely depicted in The Resurrection of the Christ.',
    seoKeywords: 'harrowing of hell|christ descent into hades|1 peter 3:19|descendit ad inferos|gospel of nicodemus|emmerich harrowing',
    filmRelevance: 'The Resurrection of the Christ (May 2027) is expected to depict the hours between Christ\'s burial and resurrection — including the harrowing. This is material outside the four gospels.',
    canonicalRefs: '1-peter 3:19|1-peter 4:6|ephesians 4:8|ephesians 4:9|matthew 27:52|acts 2:27',
    bodyMarkdown: `# The Harrowing of Hell

The "harrowing of hell" (Latin: *descensus Christi ad inferos*) is the traditional Christian doctrine that between his burial and resurrection, Christ descended into Hades / Sheol to proclaim victory and liberate the righteous dead of the Old Covenant.

## Canonical Sources

The doctrine is drawn from a small set of contested New Testament passages:

- **1 Peter 3:19** — Christ "went and preached to the spirits in prison"
- **1 Peter 4:6** — "the gospel was preached also to them that are dead"
- **Ephesians 4:8-10** — quoting Psalm 68:18, "when he ascended on high he led captivity captive"; the text adds "now this, he ascended, what is it but that he also descended first into the lower parts of the earth?"
- **Matthew 27:52** — at the moment of Christ\'s death, "the tombs were opened; and many bodies of the saints that had fallen asleep were raised"
- **Acts 2:27** (quoting Psalm 16:10) — "thou wilt not leave my soul unto Hades"

These passages are read differently across traditions.

## Apocryphal Development

- **4 Baruch (Paralipomena of Jeremiah)** — canonical in the Ethiopian Orthodox Tewahedo Church. Contains the "letter to the exiles" episode in which Abel\'s blood cries out from the earth — a passage early Christians read as anticipating Christ\'s preaching to the dead.
- **Gospel of Nicodemus / Acts of Pilate** (ch. 17-27, 4th-5th c. CE) — non-canonical; contains the most detailed narrative of Christ\'s descent, including dialogues with Hades and Satan, and the raising of Adam, Eve, and the patriarchs.
- **1 Enoch 22** — partitions Sheol into compartments for the righteous and wicked dead, providing the cosmological framework later Christian writers used for the harrowing.

## The Emmerich Visions

Anne Catherine Emmerich (1774-1824) reported extensive visions of Christ\'s descent into Hades, recorded in *The Life of Jesus Christ* (Brentano edition). These visions are documented influences on Mel Gibson\'s *The Passion of the Christ* (2004) and are widely expected to shape the harrowing sequences in *The Resurrection of the Christ*.

**Important**: Emmerich\'s visions are classified as **private revelation** in Catholic theology and as **visionary / devotional material** in our taxonomy. They are not scripture and not historically verifiable. They are included here because of their documented influence on the film.

## The Eastern Orthodox Anastasis

The Eastern Orthodox iconographic tradition of the **Anastasis** (Resurrection icon) depicts Christ pulling Adam and Eve from their tombs, standing on the broken gates of Hades, beneath which Satan is bound. This is read typologically rather than as a literal geographic descent.

## How to Read Responsibly

When encountering harrowing-of-hell material in the film:

1. Distinguish what is **in the canonical gospels** (almost nothing — the gospels skip from burial to resurrection)
2. From what is **in the rest of the New Testament** (1 Peter, Ephesians — brief and contested)
3. From what is **in the apocrypha** (4 Baruch, Gospel of Nicodemus — narrative development)
4. From what is **in mystical-visionary tradition** (Emmerich — private devotion, not doctrine)`,
    reviewState: 'draft',
  },
  {
    slug: 'book-of-enoch',
    title: 'The Book of Enoch (1 Enoch)',
    subtitle: 'Why the Ethiopian Bible contains a book most Christians have never read',
    seoDescription: 'The Book of 1 Enoch — content, origins, the Dead Sea Scrolls evidence, why it is scripture in Ethiopia and apocryphal elsewhere.',
    seoKeywords: 'book of enoch|1 enoch|ethiopic enoch|watchers|nephilim|dead sea scrolls|enochic literature',
    filmRelevance: 'Likely to be referenced (directly or thematically) in The Resurrection of the Christ due to its influence on early Christian apocalyptic and the harrowing tradition.',
    canonicalRefs: '1-enoch 1|1-enoch 6|1-enoch 7|1-enoch 10|1-enoch 22|1-enoch 46|1-enoch 71',
    bodyMarkdown: `# The Book of Enoch (1 Enoch)

The Book of Enoch (or 1 Enoch, to distinguish it from 2 Enoch and 3 Enoch) is an apocalyptic work preserved in its entirety only in the Ge\'ez language of Ethiopia. It is part of the canon of the Ethiopian Orthodox Tewahedo Church. Most other Christian traditions and all of rabbinic Judaism treat it as apocryphal.

## Structure

1 Enoch is a composite work of five sections, likely composed at different times between the 3rd century BCE and the 1st century CE:

- **Book of Watchers** (ch. 1-36) — the descent of fallen angels to Mount Hermon, the Nephilim, Enoch\'s heavenly journeys
- **Book of Parables / Similitudes** (ch. 37-71) — the Son of Man figure, judgment of kings and mighty
- **Astronomical Book / Book of Luminaries** (ch. 72-82) — the 364-day solar calendar, courses of sun and moon
- **Book of Dream Visions / Animal Apocalypse** (ch. 83-90) — history from Adam to the messianic kingdom rendered as a vision of animals
- **Epistle of Enoch** (ch. 91-108) — exhortation to the righteous, woe-oracles against the wicked

## Why It Matters for Early Christianity

- **Quoted in the New Testament**: Jude 14-15 quotes 1 Enoch 1:9 verbatim, attributing it to "Enoch, the seventh from Adam" prophesying.
- **Numerous allusions**: 2 Peter 2:4 (chained angels), the "Son of Man" sayings in the Synoptics, Revelation\'s imagery.
- **Treated as scripture** by many early Christian writers (Tertullian, Irenaeus, Clement of Alexandria, Origen — at points).
- **Rejected by Jerome and Augustine** (4th-5th c.) — and thus dropped from the Western canon.

## The Dead Sea Scrolls Evidence

At Qumran (1947-1956), Aramaic fragments of 1 Enoch were found in Cave 4 (4Q201-212), confirming:

- The work was composed in Aramaic (the Ge\'ez Ethiopic is a translation, not an original)
- It predates Christianity (c. 200 BCE for the Book of Watchers)
- It circulated among multiple Jewish groups, not just one sect

This settled the long debate over whether 1 Enoch was a Jewish composition or a later Christian forgery.

## Why It Is Scripture in Ethiopia

The Ethiopian Orthodox Tewahedo Church received 1 Enoch as part of its Old Testament canon from the earliest centuries of Ethiopian Christianity (4th c. CE onward). The Ge\'ez translation was made from Greek, which was itself translated from Aramaic. The book has been continuously used in Ethiopian liturgy and theology ever since.

## Why It Is Not Scripture Elsewhere

- **In rabbinic Judaism**: never part of the Tanakh. The Council of Yavneh (c. 90 CE, though the historicity of a formal council is debated) is traditionally associated with the closing of the canon, and apocalyptic works like Enoch were excluded.
- **In Catholicism**: not in the Vulgate (Jerome declined to translate it). The Council of Trent (1546) defined the Old Testament canon without Enoch.
- **In Protestantism**: follows the Hebrew canon, which excludes Enoch.
- **In Eastern Orthodoxy**: generally not canonical, though some Fathers cited it respectfully.`,
    reviewState: 'draft',
  },
  {
    slug: 'apocrypha-and-deuterocanon',
    title: 'Apocrypha, Deuterocanonical Books, and Canon Differences',
    subtitle: 'Why Bibles have different tables of contents',
    seoDescription: 'A clear explanation of which books are in which Christian canon — Protestant 66, Catholic 73, Orthodox 76-79, Ethiopian 81.',
    seoKeywords: 'apocrypha|deuterocanonical|biblical canon|ethiopian canon|catholic vs protestant bible|orthodox canon',
    filmRelevance: 'Film audiences searching for "what is the Book of Enoch" or "why is the Ethiopian Bible different" will land here.',
    canonicalRefs: '',
    bodyMarkdown: `# Apocrypha, Deuterocanonical Books, and Canon Differences

Christian Bibles have **different tables of contents**. This is one of the most common points of confusion for general readers — and one of the most important to get right.

## The Major Canons at a Glance

| Tradition | Old Testament | New Testament | Total |
|---|---:|---:|---:|
| Protestant | 39 | 27 | 66 |
| Catholic | 46 | 27 | 73 |
| Eastern Orthodox | 49-51 | 27 | 76-78 |
| Ethiopian Orthodox Tewahedo | 46-54 | 35 | 81 |

## The Old Testament Differences

The Protestant Old Testament (39 books) follows the **Hebrew Tanakh** (the Jewish canon). The Catholic Old Testament (46 books) follows the **Septuagint** (the Greek translation used by early Christians), which includes seven additional books: Tobit, Judith, Wisdom, Sirach, Baruch, 1 Maccabees, 2 Maccabees, plus additions to Esther and Daniel.

Catholics call these books **deuterocanonical** ("second canon"). Protestants call them the **Apocrypha** and generally exclude them from the Bible (though Luther included them in a separate section between the Testaments).

The Eastern Orthodox canon adds further books (3 Maccabees, 2 Esdras, Prayer of Manasseh, etc.) depending on jurisdiction.

## The Ethiopian Orthodox Tewahedo Canon — 81 Books

The Ethiopian canon is the largest in traditional Christianity. It includes:

- All the books of the Septuagint/Catholic Old Testament
- Plus **1 Enoch** and **Jubilees** (not in any other major canon)
- Plus **1-3 Meqabyan** (NOT the same as the Maccabees — different books entirely)
- Plus **4 Baruch** (Paralipomena of Jeremiah)
- Plus additional books in the "broader" canon (Josippon, Sinodos, etc.)

The Ethiopian New Testament (35 books) is also larger — including the Sinodos (Clementine-era church order), the Book of the Covenant, and the Ascension of Isaiah.

## Narrower vs. Broader Canon

Scholars distinguish a **narrower canon** (the books used liturgically and read in church) from a **broader canon** (books that enjoy quasi-canonical status in monastic and theological contexts). The boundaries of the broader canon are not always sharply defined.

## A Note on Meqabyan

This is a frequent point of confusion. **1-3 Meqabyan** (Ethiopian Maccabees) are not the same as **1-2 Maccabees** in the Catholic/Orthodox Bibles. They are different books, in different languages (Ge\'ez vs. Greek), about different figures. The name "Meqabyan" is etymologically related to "Maccabees" but the works are independent.

When film audiences search "Ethiopian Maccabees," they often mean either (a) 1-2 Maccabees (the wider Christian deuterocanonical books) or (b) the uniquely Ethiopian Meqabyan. This page exists in part to prevent that conflation.`,
    reviewState: 'draft',
  },
  {
    slug: 'canon-differences',
    title: 'Why Different Bibles Have Different Books',
    subtitle: 'A short reader\'s guide to canonicity',
    seoDescription: 'How the biblical canon was formed — and why the Ethiopian, Catholic, Orthodox, and Protestant Bibles differ in length and content.',
    seoKeywords: 'biblical canon formation|council of jamnia|septuagint|vulgate|council of trent|ethiopian canon',
    filmRelevance: 'Foundational for any reader encountering the Book of Enoch or Meqabyan for the first time.',
    canonicalRefs: '',
    bodyMarkdown: `# Why Different Bibles Have Different Books

The biblical canon — the official list of books recognized as scripture — was not delivered from heaven as a single closed list. It developed over centuries, and different communities arrived at different conclusions.

## Old Testament Canon Formation

### The Hebrew Tanakh (Jewish canon)
By the late Second Temple period (1st c. CE), the Hebrew canon of 24 books (equivalent to the Protestant 39) was largely settled in Palestine. The traditional division is Torah (Law), Nevi\'im (Prophets), and Ketuvim (Writings) — hence TaNaKh.

The story of a Council of Jamnia (Yavneh) c. 90 CE that formally closed the canon is now largely doubted by scholars, but the canon was indeed effectively closed by this period.

### The Septuagint (Greek Old Testament)
Jews in Alexandria (and throughout the diaspora) used a Greek translation begun c. 250 BCE. The Septuagint included the books now called "deuterocanonical" by Catholics and "Apocrypha" by Protestants. The early Christian church inherited this Greek Bible.

### The Vulgate (Jerome, c. 400 CE)
Jerome translated the Old Testament into Latin from Hebrew (not Greek) — and distinguished the books present in Hebrew from those present only in Greek. The latter he termed "apocryphal." This distinction influenced the later Protestant/Catholic split.

## New Testament Canon Formation

The 27-book New Testament was effectively settled by the end of the 4th century through a process of liturgical use and episcopal recognition:

- **Marcion** (c. 140 CE) published a truncated canon (Luke + edited Paul) — provoking the wider church to define its canon more carefully.
- **Muratorian Canon** (c. 170 CE) — the earliest known list, includes most of the 27.
- **Eusebius** (c. 325 CE) — categorized books as acknowledged, disputed, or spurious.
- **Athanasius\'s Easter Letter (367 CE)** — first known list of exactly the 27 New Testament books.
- **Councils of Hippo (393) and Carthage (397)** — regional councils ratifying the 27-book canon.

The Ethiopian Church added several books to its New Testament (35 total), reflecting its unique reception history.

## The Reformation Split (16th c.)

Luther rediscovered Jerome\'s distinction and moved the deuterocanonical books into a separate section between the Testaments. The Council of Trent (1546) reaffirmed their canonicity as defined at Florence (1441) and earlier.

This produced the lasting split: **Catholic 73 / Protestant 66**.

## The Ethiopian Exception

The Ethiopian Orthodox Tewahedo Church — Christian since the 4th century — received its canon through different channels (Alexandrian patriarchate, Ge\'ez translation, native monastic tradition). It preserved books (1 Enoch, Jubilees, Meqabyan, 4 Baruch) that had fallen out of use elsewhere. Whether these were ever "in" the broader Mediterranean canon is debated — they were certainly known to early Fathers (Tertullian, Irenaeus) but gradually fell out of favor in Greek and Latin Christianity.

## Implications for Film Audiences

When *The Resurrection of the Christ* engages material from 1 Enoch, 4 Baruch, or the Emmerich visions, the question is not "is this in the Bible?" but **"in which Bible?"** — and on what authority.

This site treats every text by its actual canonical status: scripture in some traditions, devotional in others, apocryphal or mystical elsewhere.`,
    reviewState: 'draft',
  },
  {
    slug: 'emmerich-visions',
    title: 'The Visions of Anne Catherine Emmerich',
    subtitle: 'Documented influence on Mel Gibson\'s Passion films — and what they are (and are not)',
    seoDescription: 'Who Anne Catherine Emmerich was, what her visions claim, and how Catholic theology classifies private revelation — and the documented influence on Gibson\'s films.',
    seoKeywords: 'anne catherine emmerich|emmerich visions|private revelation|brentano|passion of the christ|gibson emmerich',
    filmRelevance: 'Documented influence on The Passion of the Christ (2004) and expected influence on The Resurrection of the Christ (2027).',
    canonicalRefs: '',
    bodyMarkdown: `# The Visions of Anne Catherine Emmerich

Anne Catherine Emmerich (1774-1824) was an Augustinian Canoness Regular in Dülmen, Westphalia (then part of the Kingdom of Prussia). From 1818 until her death in 1824, she reported daily visions of the life of Christ, the Virgin Mary, and the early Church.

The poet **Clemens Brentano** (1778-1842) became her amanuensis in 1818 and recorded her visions daily until her death. After her death, Brentano published three volumes based on his notes:

- *The Dolorous Passion of Our Lord Jesus Christ* (1833, German)
- *The Life of the Blessed Virgin Mary* (1852, posthumous)
- *The Life of Our Lord* (1854-1881, three volumes, posthumous)

Emmerich was beatified by Pope John Paul II on October 3, 2004 — three weeks before the release of *The Passion of the Christ*.

## Influence on Gibson\'s Films

Mel Gibson has openly acknowledged that *The Dolorous Passion* was a major source for *The Passion of the Christ* (2004). Specific scenes drawn from Emmerich include:

- The veiled Veronica wiping Christ\'s face
- The demonic androgynous child appearing to Judas
- Mary\'s underground route to meet Christ on the Via Dolorosa
- Pontius Pilate\'s wife Claudia offering Mary linens
- The construction of the cross in the Temple courtyard

*The Resurrection of the Christ* (Part One, May 6, 2027) is widely expected to draw on Emmerich\'s extensive visions of Christ\'s descent into Hades (harrowing of hell), which occupy chapters 60-62 of the *Life of Jesus Christ* (Passion volume).

## What Catholic Theology Says About Private Revelation

The Catholic Church distinguishes:

- **Public Revelation**: the deposit of faith given in Christ and the apostles, contained in Scripture and Tradition. This is **complete** — nothing can be added to it.
- **Private Revelation**: visionary experiences granted to individuals after the apostolic age. These are **not required for salvation** and do not add to the deposit of faith.

The Catechism of the Catholic Church §67 states:

> "Throughout the ages, there have been so-called 'private' revelations, some of which have been recognized by the authority of the Church. They do not belong, however, to the deposit of faith. It is not their role to improve or complete Christ's definitive Revelation, but to help live more fully by it in a certain period of history."

Therefore: a faithful Catholic is **free** to engage Emmerich\'s visions devotionally, but is **not obligated** to believe them, and **must not** treat them as equivalent to Scripture.

## Scholarly Concerns About Authenticity

Several scholars — most notably Jan-Heiner Tück (2014) — have raised serious questions about the reliability of Brentano\'s editorial work:

- The published texts are written in a polished literary German inconsistent with Emmerich\'s reported spoken Low German
- Brentano kept no original notes; the published texts were reconstructed from his diaries, which are not extant
- Several historical anachronisms appear in the visions (e.g. references to "Gethsemane" as a known place name before it was so called)
- The descriptions of 1st-century Jewish practices often reflect 19th-century Catholic devotional assumptions

The academic consensus is that the published Emmerich texts are best understood as a **19th-century devotional composite** — Brentano\'s editorial work on Emmerich\'s reported visions. This does not make them worthless, but it does mean they cannot be treated as direct windows into 1st-century events.

## How This Site Treats Emmerich

Every claim drawn from Emmerich is labeled:

- **Perspective tag**: mystical-visionary
- **Claim type**: visionary-private-revelation
- **Credibility tier**: popular-journalistic (the Brentano publications are 19th-century devotional literature, not peer-reviewed scholarship)

These labels are visible on every public article. The reader is never asked to take Emmerich at face value as history.

## Further Reading

- Emmerich, A. C. (1833). *The Dolorous Passion of Our Lord Jesus Christ*. (Public domain English translations available.)
- Tück, J.-H. (2014). "Anne Catherine Emmerich — Vision und Vermarktung." *Herder Korrespondenz*.
- Catechism of the Catholic Church, §§65-67 (on public vs. private revelation).`,
    reviewState: 'draft',
  },
]

// ════════════════════════════════════════════════════════════════════════════
// Run the seed
// ════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('🌱 Seeding credibility model, books, glossary, and topic pages...')

  // Wipe (development only)
  await db.publicArticlePerspective.deleteMany()
  await db.evidencePerspective.deleteMany()
  await db.sourcePerspective.deleteMany()
  await db.studyPlanItem.deleteMany()
  await db.studyPlan.deleteMany()
  await db.flashcard.deleteMany()
  await db.dailyInsight.deleteMany()
  await db.publicArticle.deleteMany()
  await db.topicPage.deleteMany()
  await db.auditLog.deleteMany()
  await db.reviewRecord.deleteMany()
  await db.glossaryEntry.deleteMany()
  await db.claimType.deleteMany()
  await db.perspectiveTag.deleteMany()

  // Perspective tags
  for (const p of PERSPECTIVES) {
    await db.perspectiveTag.create({ data: p })
  }
  console.log(`  ✓ ${PERSPECTIVES.length} perspective tags`)

  // Claim types
  for (const c of CLAIM_TYPES) {
    await db.claimType.create({ data: c })
  }
  console.log(`  ✓ ${CLAIM_TYPES.length} claim types`)

  // Glossary
  for (const g of GLOSSARY) {
    await db.glossaryEntry.create({ data: g })
  }
  console.log(`  ✓ ${GLOSSARY.length} glossary entries`)

  // Topic pages
  for (const t of TOPIC_PAGES) {
    await db.topicPage.create({ data: t })
  }
  console.log(`  ✓ ${TOPIC_PAGES.length} topic pages`)

  console.log('🌱 Seed complete.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
