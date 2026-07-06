# Ethiopian Orthodox Tewahedo Church — sacred-texts framework

> Working notes + churn framework. The EOTC corpus is the **glue** that ties the
> Enoch / Watchers / Nephilim material to a living scriptural, liturgical, and
> historical tradition. This file is the human reference; the machine worklist that
> drives scraping is [`data/eotc-corpus.json`](../data/eotc-corpus.json), consumed by
> [`scripts/eotc-grow.mjs`](../scripts/eotc-grow.mjs).

## The canon: 81 books (46 OT + 35 NT)

The EOTC's core scriptural canon is traditionally given as **81 canonical books —
46 Old Testament + 35 New Testament**. The Church's own English canon page states
this 46 + 35 = 81 structure and notes the Ethiopic Bible differs from all other
churches, preserving **1 Enoch and Jubilees in full** in Geʿez/Ethiopic tradition.

Distinctive canonical books beyond the Western/Protestant Bible include: **1 Enoch
(Henok)**, **Jubilees (Kufale)**, the three **Meqabyan** (Ethiopian "Maccabees" —
*not* the Greek Maccabees), **Ezra Sutuel** and further Esdras material, **Josippon
(Joseph ben Gurion)**, and — on the NT / church-order side — **Sinodos**,
**Dominos / Books of Covenant**, **Ethiopic Clement (Qalementos)**, and the
**Didascalia**.

## Caveat: "sacred texts" ⊋ "Bible"

In the Ethiopian tradition *sacred texts* means far more than *Bible*. It spans:
**canonical scripture · church-order / canon-law · liturgy · hymnody · calendar /
computus · saints' lives · royal-sacred history · Marian miracle collections ·
apocryphal / visionary literature.** Some are "Bible"; others are authoritative,
liturgical, devotional, legal, or culturally sacred. When filing evidence, keep the
distinction explicit: *canonical claim* ≠ *liturgical use* ≠ *devotional authority*
≠ *historical probability* ≠ *symbolic/theological truth* ≠ *internet speculation*.

## Corpus taxonomy (categories used in the worklist)

| `cat` | Scope | Examples |
|---|---|---|
| `ot-distinctive` | Distinctive OT canon | 1 Enoch, Jubilees, 1–3 Meqabyan, Ezra Sutuel, Josippon, Tegsats, Wisdom, Sirach |
| `apocrypha` | Visionary / apocryphal, Ethiopic-preserved | Ascension of Isaiah, 4 Baruch / Paralipomena of Jeremiah, Good-Thief composition |
| `nt-church-order` | Broader NT / church-order canon | Sinodos, Didascalia, Didache, Dominos (Books of Covenant), Ethiopic Clement, Sirate Tsion, Tizaz, Gitsew, Abtilis |
| `canon-law` | Church/state legal authority | Fetha Negast (Law of the Kings), Book of Canon |
| `theology` | Patristic / dogmatic corpus | Haymanote Abew, Qerlos (Cyril), Mashafa Mestir (Abba Giyorgis), Hilawe Melekot, True Faith of Zera Yacob, Five Pillars of the Sacraments |
| `liturgy` | Eucharist, sacraments, service books | Qedase (14 Anaphora), Gebra Hemamat, lectionary (Ghitsacwa), Baptism, Ordination, Genzat, Incense |
| `hymnody` | Chant / antiphonary | Deggwa (St Yared), Tsome Deggwa, Meeraf, Zimare, Mewasit, Zik, Mezmur, Saatat |
| `calendar` | Computus / sacred time | Abushakir, Bahra Hasab, Debre Bizen calendar mathematics |
| `history-royal` | Royal-sacred history | Kebra Nagast, First Writing on Zion, Axum & Zagwe king-lists, Alexander Romance |
| `hagiography` | Saints' lives | Synaxarium (Senkessar), Gadl of Tekle Haymanot, Gadl of Lalibela, St George, Book of Monks |
| `marian` | Marian devotion | Miracles of St Mary (Taʾamra Maryam), Wuddase Maryam, Marian anaphoras |
| `philosophy` / `nature-science` / `culture` | Wisdom, cosmology, custom | Angare Felasfa, Hatata (Zera Yacob), Aximaros (Hexaemeron), Physiologus |
| `ot-canon` / `nt-canon` | The standard 66, read through an EOTC lens | Genesis 6, Leviticus 16 (Azazel), Ezekiel 1, Daniel 7, Hebrews, Jude, 2 Peter, Acts 8 (Ethiopian eunuch) |

## Research map — Enoch, Watchers, "the veil", angels, Ethiopian worldview

| Research area | Core texts | Why it matters |
|---|---|---|
| Watchers & forbidden knowledge | 1 Enoch 1–36 (esp. 6–16); Genesis 6; Jubilees 4–5; Jude; 2 Peter | Heart of the tradition: angelic descent, giants, forbidden arts, judgment, Enoch's intercession. |
| Enochic cosmology | 1 Enoch 17–36, 72–82 | Heavenly journeys, storehouses, luminaries, portals, Sheol, paradise, judgment geography. |
| Sacred time & calendar | Jubilees, 1 Enoch Astronomical Book, Abushakir, lectionary | Ethiopian Christianity is deeply calendrical; Jubilees/Enoch preserve the 364-day solar calendar. |
| Giants, demons, evil spirits | 1 Enoch 15–16; Jubilees 10; Gospel exorcisms | Enochic tradition links demons to dead giants' spirits; compare official demonology. |
| Heavenly temple & liturgy | Exodus, Ezekiel, Isaiah 6, Daniel 7, Hebrews, Revelation, Qedase, incense prayers | Ethiopian liturgy is a lived "heaven-on-earth": altar, incense, priesthood, angels, Ark/tabot. |
| Ark, Zion, covenant land | Kings, Chronicles, Psalms, Kebra Nagast, First Writing on Zion, Axum histories | Kebra Nagast frames Ethiopia as heir of Zion via the Ark brought by Menelik. |
| Solomonic kingship | Samuel/Kings/Chronicles, Kebra Nagast, Fetha Negast, chronicles | Ethiopian monarchy, law, divine kingship, national sacred history. |
| Oriental Orthodox Christology | John, Hebrews, Cyril, Haymanote Abew, Mashafa Mestir | *Tewahedo* = "being made one" — union of divinity and humanity in Christ. |
| Angels & archangels | Tobit, Daniel, Luke, Revelation, Enoch, Synaxarium | Raphael, Michael, Gabriel, Uriel; mediation, healing, judgment, worship. |
| Mary & intercession | Wuddase Maryam, Taʾamra Maryam, Marian anaphoras | Powerful Ethiopian Marian devotion: protection, mercy, miracle. |
| Saints, monks, spiritual warfare | Synaxarium, Gadl of Tekle Haymanot, Book of Monks, Deggwa | The "veil" is approached through asceticism, fasting, prayer, liturgy — not only speculation. |
| Canon law & hidden church order | Sinodos, Didascalia, Dominos, Clement, Fetha Negast | How scripture becomes church life: bishops, sacraments, discipline, heresy boundaries. |
| Comparative Second Temple Judaism | Dead Sea Scrolls, 1 Enoch, Jubilees, Daniel, 4 Ezra, Josippon | Separates ancient Jewish apocalyptic context from later Ethiopian reception. |
| Manuscript culture | Geʿez manuscripts, **Beta maṣāḥəft** DB, British Library collections | Many "obscure" texts survive in manuscripts, not printed Bibles — learn Geʿez names & variants. |

## Recommended crossover reading order

1. Genesis 1–11 + Genesis 6
2. 1 Enoch (esp. Book of the Watchers)
3. Jubilees
4. Daniel, Ezekiel, Isaiah 6, Revelation, Hebrews
5. Jude and 2 Peter
6. Tobit and angelology
7. Kebra Nagast (Ethiopian Ark / Zion identity)
8. Sinodos, Didascalia, Dominos, Clement (hidden church-order canon)
9. Qedase, Deggwa, Wuddase Maryam, Synaxarium (lived Ethiopian spirituality)
10. Fetha Negast, royal chronicles, saints' lives (church–state–sacred history)

## How this feeds the corpus

`scripts/eotc-grow.mjs` reads the worklist, runs one Coding-Plan `web_search_prime`
query per entry, reads the top result, and files a **Source** (+ a crossover
**Evidence** row when the entry carries a `ref`) with `keywords = "eotc: <cat>: <name>"`.
Runs are batched and resumable (`--offset/--limit/--only`), dedup by URL, and feed the
same classify → validate-authorities → coverage-map → export-snapshots pipeline.

```bash
# examples
node --env-file=.env scripts/eotc-grow.mjs --only ot-distinctive,apocrypha   # unique canon first
node --env-file=.env scripts/eotc-grow.mjs --offset 0 --limit 40             # batch
node --env-file=.env scripts/eotc-grow.mjs --dry                             # preview queries
```
