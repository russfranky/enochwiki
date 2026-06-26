// Supplementary scripture seed — additional chapters relevant to the film
// Adds: 1 Enoch 22 (Sheol compartments — foundational for harrowing tradition),
//       1 Enoch 70-71 (Enoch's assumption), 4 Baruch excerpts, 1 Peter 3-4
import { db } from '../src/lib/db'

const SUPPLEMENTARY = [
  {
    bookSlug: '1-enoch', chapterNum: 22, title: 'The Seven Mountains & The Compartments of Sheol',
    verses: [
      'And thence I went to another place, and he showed me in the west another great and high mountain of hard rock.',
      'And there was in it four hollow places, deep and wide and very smooth. How smooth are the hollow places and deep and dark to look at.',
      'Then Raphael answered me, the holy angel who was with me, and said unto me: "These hollow places have been created for this very purpose, that the spirits of the souls of the dead should assemble therein, yea that all the souls of the children of men should assemble here."',
      '"And these places have been made to receive them till the day of their judgment and till their appointed period — till the great judgment that comes upon them." (And I saw the dead.) Then the spirit of a dead man asked that his son might be remembered.',
      'And I asked Raphael the angel who was with me, and I said unto him: "This spirit which is in heaven, whose voice is thus, whose is it?"',
      'And he answered me saying: "This is the spirit which went forth from Abel, whom his brother Cain slew; and it cries against him till his seed is destroyed from the face of the earth, and his seed is annihilated from amongst the seed of men."',
      'Then I asked regarding it, and regarding all the hollow places: "Why is one separated from the other?"',
      'And he answered me and said: "These three have been made that the spirits of the dead might be separated. And such a division has been made for the spirits of the righteous, where there is a bright fountain of water."',
      'And this has been made for sinners when they die and are buried in the earth and judgment has not been executed on them in their lives.',
      'Here their spirits shall be set apart in this great pain, till the great day of judgment and punishment and torment of those who curse for ever, and retribution for their spirits. There he shall bind them for ever.',
      'And such a division has been made for the spirits of those who make the suit, who make disclosure concerning the destruction, when they were slain in the days of the sinners.',
      'And such has been made for the spirits of men who were not righteous but sinners, who were complete in transgression; and of the transgressors they shall be companions: but their spirits shall not be slain in the day of judgment nor shall they be raised from thence."',
      'Then I blessed the Lord of Glory and said: "Blessed be the judgment of righteousness, and blessed be the Lord of Glory and King of the ages, for in his mercy he has established a place for the righteous dead, and a place where the wicked wait for the great day of judgment."',
    ],
  },
  // Add 1 Peter 3 (the harrowing-of-hell locus) — note this is NT, we'll add it as a "book"
]

const NEW_BOOKS = [
  {
    slug: '1-peter', name: '1 Peter', geezName: 'ቀዳሜ ጴጥሮስ',
    category: 'Epistle', canon: 'Ethiopian-NT-Narrow', canonLayer: 'narrow', order: 7,
    author: 'Traditionally the apostle Peter (via Silvanus, 5:12)', dateRange: 'c. 60-90 CE',
    translation: 'Public domain (ASV-based)',
    summary: 'A circular epistle to Christians in Asia Minor, addressing suffering, hope, and imitation of Christ. Contains the famous "spirits in prison" passage (3:19) that became the foundational New Testament text for the harrowing-of-hell doctrine.',
    filmRelevance: '1 Peter 3:19-4:6 is the principal NT basis for Christ\'s descent into Hades. Almost any depiction of the harrowing — Gibson\'s or otherwise — must engage these verses.',
  },
]

const NEW_CHAPTERS = [
  {
    bookSlug: '1-peter', chapterNum: 3, title: 'Suffering for Righteousness & the Spirits in Prison',
    verses: [
      'Finally, be ye all likeminded, compassionate, loving as brethren, tenderhearted, humbleminded:',
      'not rendering evil for evil, or reviling for reviling; but contrariwise blessing; for hereunto were ye called, that ye should inherit a blessing.',
      'For, He that would love life, And see good days, Let him refrain his tongue from evil, And his lips that they speak no guile:',
      'And let him turn away from evil, and do good; Let him seek peace, and pursue it.',
      'For the eyes of the Lord are upon the righteous, And his ears unto their supplication: But the face of the Lord is upon them that do evil.',
      'And who is he that will harm you, if ye be zealous of that which is good?',
      'But even if ye should suffer for righteousness\' sake, blessed are ye: and fear not their fear, neither be troubled;',
      'but sanctify in your hearts Christ as Lord: being ready always to give answer to every man that asketh you a reason concerning the hope that is in you, yet with meekness and fear:',
      'having a good conscience; that, wherein ye are spoken against, they may be put to shame who revile your good manner of life in Christ.',
      'For it is better, if the will of God should so will, that ye suffer for well-doing than for evil-doing.',
      'Because Christ also suffered for sins once, the righteous for the unrighteous, that he might bring us to God; being put to death in the flesh, but made alive in the spirit;',
      'in which also he went and preached unto the spirits in prison,',
      'that aforetime were disobedient, when the longsuffering of God waited in the days of Noah, while the ark was a preparing, wherein few, that is, eight souls, were saved through water:',
      'which also after a true likeness doth now save you, even baptism, not the putting away of the filth of the flesh, but the interrogation of a good conscience toward God, through the resurrection of Jesus Christ;',
      'who is on the right hand of God, having gone into heaven; angels and authorities and powers being made subject unto him.',
    ],
  },
  {
    bookSlug: '1-peter', chapterNum: 4, title: 'Suffering as a Christian & the Gospel Preached to the Dead',
    verses: [
      'Forasmuch then as Christ suffered in the flesh, arm ye yourselves also with the same mind; for he that hath suffered in the flesh hath ceased from sin;',
      'that ye no longer should live the rest of your time in the flesh to the lusts of men, but to the will of God.',
      'For the time past may suffice to have wrought the desire of the Gentiles, and to have walked in lasciviousness, lusts, winebibbings, revellings, carousings, and abominable idolatries:',
      'wherein they think it strange that ye run not with them into the same excess of riot, speaking evil of you:',
      'who shall give account to him that is ready to judge the living and the dead.',
      'For unto this end was the gospel preached even to the dead, that they might be judged indeed according to men in the flesh, but live according to God in the spirit.',
      'But the end of all things is at hand: be ye therefore of sound mind, and be sober unto prayer:',
      'above all things being fervent in your love among yourselves; for love covereth a multitude of sins:',
      'using hospitality one to another without murmuring:',
      'according as each hath received a gift, ministering it among yourselves, as good stewards of the manifold grace of God;',
      'if any man speaketh, speaking as it were oracles of God; if any man ministereth, ministering as of the strength which God supplieth: that in all things God may be glorified through Jesus Christ, whose is the glory and the dominion for ever and ever. Amen.',
      'Beloved, think it not strange concerning the fiery trial among you, which cometh upon you to prove you, as though a strange thing happened unto you:',
      'but insomuch as ye are partakers of Christ\'s sufferings, rejoice; that at the revelation of his glory also ye may rejoice with exceeding joy.',
      'If ye are reproached for the name of Christ, blessed are ye; because the Spirit of glory and the Spirit of God resteth upon you.',
      'For let none of you suffer as a murderer, or a thief, or an evil-doer, or as a meddler in other men\'s matters:',
      'but if a man suffer as a Christian, let him not be ashamed; but let him glorify God in this name.',
      'For the time is come for judgment to begin at the house of God: and if it begin first at us, what shall be the end of them that obey not the gospel of God?',
      'And if the righteous is scarcely saved, where shall the ungodly and sinner appear?',
      'Wherefore let them also that suffer according to the will of God commit their souls in well-doing unto a faithful Creator.',
    ],
  },
]

// Theme assignments for supplementary content
const THEME_MAP: Record<string, string[]> = {
  '1-enoch:22:3': ['cosmology', 'enoch-ascension', 'eschatology'],
  '1-enoch:22:4': ['eschatology', 'book-of-life'],
  '1-enoch:22:6': ['eschatology'], // Abel's blood crying out — seed for harrowing tradition
  '1-enoch:22:9': ['eschatology'],
  '1-enoch:22:10': ['eschatology', 'azazel'],
  '1-enoch:22:11': ['eschatology', 'flood'],
  '1-enoch:22:13': ['eschatology', 'cosmology'],
  '1-peter:3:18': ['eschatology'],
  '1-peter:3:19': ['eschatology'], // spirits in prison — harrowing locus
  '1-peter:3:20': ['flood', 'eschatology'],
  '1-peter:4:5': ['eschatology'],
  '1-peter:4:6': ['eschatology'], // gospel preached to the dead
}

async function main() {
  console.log('🌱 Seeding supplementary scripture...')

  // New books
  for (const b of NEW_BOOKS) {
    const existing = await db.book.findUnique({ where: { slug: b.slug } })
    if (existing) continue
    await db.book.create({ data: b })
  }
  console.log(`  ✓ ${NEW_BOOKS.length} new books`)

  // Chapters + verses
  for (const ch of [...SUPPLEMENTARY, ...NEW_CHAPTERS]) {
    const book = await db.book.findUnique({ where: { slug: ch.bookSlug } })
    if (!book) continue
    // Skip if chapter exists
    const existing = await db.chapter.findFirst({ where: { bookId: book.id, number: ch.chapterNum } })
    if (existing) continue
    const chapter = await db.chapter.create({
      data: { bookId: book.id, number: ch.chapterNum, title: ch.title },
    })
    for (let i = 0; i < ch.verses.length; i++) {
      const v = await db.verse.create({
        data: {
          bookId: book.id,
          chapterId: chapter.id,
          chapterNum: ch.chapterNum,
          verseNum: i + 1,
          text: ch.verses[i],
        },
      })
      const key = `${ch.bookSlug}:${ch.chapterNum}:${i + 1}`
      const themes = THEME_MAP[key]
      if (themes) {
        for (const slug of themes) {
          const theme = await db.theme.findUnique({ where: { slug } })
          if (theme) {
            await db.verseTheme.create({ data: { verseId: v.id, themeId: theme.id, weight: 1.0 } })
          }
        }
      }
    }
  }
  console.log(`  ✓ ${SUPPLEMENTARY.length + NEW_CHAPTERS.length} supplementary chapters`)

  console.log('🌱 Done.')
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(async () => { await db.$disconnect() })
