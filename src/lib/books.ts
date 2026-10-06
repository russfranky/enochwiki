// books.ts: the book index catalog for /books.
// Russ curates this list. affiliateUrl stays empty until he adds his
// affiliate links; the detail page only renders a buy button when one exists.
// Bibliographic facts only: no invented endorsements, no invented metrics.
export interface Book {
  slug: string
  title: string
  /** Short display title for the small index cover placeholder. */
  shortTitle: string
  author: string
  publisher: string
  year: number
  isbn: string
  tagline: string
  description: string[]
  topics: string[]
  affiliateUrl?: string
  featured?: boolean
}

export const BOOKS: Book[] = [
  {
    slug: '1-enoch-a-new-translation',
    title: '1 Enoch: A New Translation',
    shortTitle: '1 Enoch',
    author: 'George W. E. Nickelsburg and James C. VanderKam',
    publisher: 'Fortress Press',
    year: 2004,
    isbn: '978-0800636944',
    tagline: 'The standard scholarly English translation of 1 Enoch.',
    description: [
      'A translation of 1 Enoch from the Ethiopic text, with an introduction and commentary by George W. E. Nickelsburg and James C. VanderKam. It draws on the Aramaic fragments from Qumran alongside the complete Ge\u2019ez version preserved in the Ethiopian canon.',
      'Includes the full text with extensive annotation. This is the edition cited in this site\u2019s vetting notes.',
    ],
    topics: ['1 Enoch', 'Translation', 'Commentary'],
    featured: true,
    affiliateUrl: 'https://www.amazon.com/dp/9780800636944?tag=enochwiki-20',

  },
  {
    slug: 'old-testament-pseudepigrapha-vol-1',
    title: 'The Old Testament Pseudepigrapha, Volume 1: Apocalyptic Literature and Testaments',
    shortTitle: 'Pseudepigrapha, Vol. 1',
    author: 'James H. Charlesworth (editor)',
    publisher: 'Doubleday',
    year: 1983,
    isbn: '978-0385096216',
    tagline: 'The standard collection of Second Temple Jewish writings in English.',
    description: [
      'The English collection of the Old Testament Pseudepigrapha, edited by James H. Charlesworth, including 1 Enoch, Jubilees, the Testaments of the Twelve Patriarchs, and dozens more texts from the Second Temple period.',
      'Volume 1 covers the apocalyptic literature and testaments: the context 1 Enoch belongs to. A standard reference for the study of Enochic literature.',
    ],
    topics: ['Pseudepigrapha', 'Second Temple', 'Reference'],
    affiliateUrl: 'https://www.amazon.com/dp/9780385096216?tag=enochwiki-20',

  },
  {
    slug: 'book-of-enoch-charles',
    title: 'The Book of Enoch',
    shortTitle: 'Book of Enoch',
    author: 'R. H. Charles (translator)',
    publisher: 'Oxford: Clarendon Press (public domain)',
    year: 1917,
    isbn: '',
    tagline: 'The public-domain translation, free to read.',
    description: [
      'R. H. Charles\u2019s 1917 translation, widely reprinted. The language is dated, but the text is complete and free of copyright restriction.',
      'Often used as an entry point before moving to a modern critical translation. Multiple free editions exist online and in print.',
    ],
    topics: ['1 Enoch', 'Translation', 'Public domain'],
  },
  {
    slug: 'enoch-a-commentary-on-the-book-of-1-enoch',
    title: '1 Enoch 1: A Commentary on the Book of 1 Enoch, Chapters 1-36; 81-108',
    shortTitle: '1 Enoch 1 (Hermeneia)',
    author: 'George W. E. Nickelsburg',
    publisher: 'Fortress Press',
    year: 2001,
    isbn: '9780800660748',
    tagline: 'Scholarly commentary on chapters 1-36 and 81-108 of 1 Enoch.',
    description: [
      'This volume is a verse-by-verse commentary on the Book of Watchers, the Astronomical Book portions, the Epistle of Enoch, and related sections of 1 Enoch, based on Ethiopic, Aramaic, and Greek textual evidence.',
      'It includes discussion of the manuscript history, including the Aramaic Enoch fragments from Qumran, and situates the text in its Second Temple Jewish context. It is part of the Hermeneia commentary series.',
    ],
    topics: ['1 Enoch', 'commentary', 'Book of Watchers', 'Second Temple Judaism'],
    affiliateUrl: 'https://www.amazon.com/dp/9780800660748?tag=enochwiki-20',

  },
  {
    slug: 'the-aramaic-enoch-from-qumran-cave-4',
    title: 'The Books of Enoch: Aramaic Fragments of Qumran Cave 4',
    shortTitle: 'The Books of Enoch (Milik)',
    author: 'J. T. Milik',
    publisher: 'Oxford University Press',
    year: 1976,
    isbn: '9780198261612',
    tagline: 'Edition of the Aramaic Enoch fragments discovered at Qumran Cave 4.',
    description: [
      'This volume presents the Aramaic fragments of Enochic works found in Qumran Cave 4, with transcription, translation, and commentary by J. T. Milik.',
      'It includes a contribution by Matthew Black and documents the Aramaic textual basis of Enochic literature predating the Ethiopic tradition.',
    ],
    topics: ['Dead Sea Scrolls', 'Aramaic fragments', '1 Enoch', 'Qumran'],
    affiliateUrl: 'https://www.amazon.com/dp/9780198261612?tag=enochwiki-20',

  },
  {
    slug: 'the-book-of-jubilees-vanderkam',
    title: 'The Book of Jubilees: A Critical Text',
    shortTitle: 'The Book of Jubilees',
    author: 'James C. VanderKam',
    publisher: 'Peeters',
    year: 1989,
    isbn: '9789042905511',
    tagline: 'Critical edition of the Ethiopic text of Jubilees.',
    description: [
      'This two-volume work provides a critical edition of the Ethiopic text of Jubilees, the Second Temple retelling of Genesis and Exodus structured around jubilee cycles.',
      'Jubilees shares Enochic traditions, including material about the watchers, and is preserved among the Dead Sea Scrolls in Hebrew fragments.',
    ],
    topics: ['Jubilees', 'critical edition', 'Second Temple Judaism', 'Dead Sea Scrolls'],
    affiliateUrl: 'https://www.amazon.com/dp/9789042905511?tag=enochwiki-20',

  },
  {
    slug: 'apocalypticism-in-the-dead-sea-scrolls',
    title: 'Apocalypticism in the Dead Sea Scrolls',
    shortTitle: 'Apocalypticism in the Dead Sea Scrolls',
    author: 'John J. Collins',
    publisher: 'Routledge',
    year: 1997,
    isbn: '9780415146343',
    tagline: 'Study of apocalyptic literature and thought in the Qumran library.',
    description: [
      'This book examines apocalyptic works found among the Dead Sea Scrolls, including Enochic writings, and discusses their relationship to broader Second Temple apocalypticism.',
      'It addresses the definition of apocalyptic literature, the social setting of apocalyptic movements, and the place of Qumran texts within that tradition.',
    ],
    topics: ['apocalyptic literature', 'Dead Sea Scrolls', 'Qumran', 'Second Temple Judaism'],
    affiliateUrl: 'https://www.amazon.com/dp/9780415146343?tag=enochwiki-20',

  },
  {
    slug: 'the-encyclopedia-of-apocalypticism-volume-1',
    title: 'The Encyclopedia of Apocalypticism, Volume 1: The Origins of Apocalypticism in Judaism and Christianity',
    shortTitle: 'Encyclopedia of Apocalypticism, Vol. 1',
    author: 'John J. Collins (volume editor)',
    publisher: 'Continuum',
    year: 1998,
    isbn: '9780826410719',
    tagline: 'Reference volume on the origins of apocalypticism in ancient Judaism and Christianity.',
    description: [
      'This reference volume covers the origins and development of apocalypticism from its roots in ancient Near Eastern and Jewish traditions through early Christianity.',
      'It includes essays treating Enochic literature, Daniel, and other Second Temple apocalyptic works, with contributions from multiple scholars.',
    ],
    topics: ['apocalyptic literature', 'reference work', 'Second Temple Judaism', '1 Enoch'],
    affiliateUrl: 'https://www.amazon.com/dp/9780826410719?tag=enochwiki-20',

  },
  {
    slug: '1-enoch-2-commentary',
    title: '1 Enoch 2: A Commentary on the Book of 1 Enoch, Chapters 37-82',
    shortTitle: '1 Enoch 2',
    author: 'George W. E. Nickelsburg and James C. VanderKam',
    publisher: 'Fortress Press',
    year: 2012,
    isbn: '9780800699645',
    tagline: 'Hermeneia commentary covering the Parables (Similitudes) and Astronomical Book of 1 Enoch.',
    description: [
      'This volume completes the Hermeneia commentary on 1 Enoch begun by George W. E. Nickelsburg, covering chapters 37 through 82, comprising the Book of Parables and the Astronomical Book (Book of the Heavenly Luminaries).',
      'The commentary presents translation, textual notes, and discussion of composition, dating, and historical context for the Enochic material, with contributions drawing on the Aramaic fragments and Ethiopic textual tradition.',
    ],
    topics: ['1 Enoch', 'Book of Parables', 'commentary', 'Enochic literature'],
    affiliateUrl: 'https://www.amazon.com/dp/9780800699645?tag=enochwiki-20',

  },
  {
    slug: 'jubilees-translation-commentary',
    title: 'The Book of Jubilees: A Translation and Commentary',
    shortTitle: 'The Book of Jubilees',
    author: 'James C. VanderKam',
    publisher: 'Peeters',
    year: 2018,
    isbn: '',
    tagline: 'English translation and commentary on the Second Temple rewrite of Genesis and Exodus.',
    description: [
      'This two-volume work provides an English translation of the Book of Jubilees together with a running commentary, based on the Ethiopic text and the Latin and Syriac witnesses.',
      'It follows VanderKam\'s earlier critical edition of the Ethiopic text and addresses the composition\'s date, provenance, and relationship to other Second Temple literature, including the Enochic writings and the Dead Sea Scrolls.',
    ],
    topics: ['Jubilees', 'commentary', 'Second Temple Judaism'],
  },
  {
    slug: 'the-dead-sea-scrolls-translated',
    title: 'The Dead Sea Scrolls Translated: The Qumran Texts in English',
    shortTitle: 'The Dead Sea Scrolls Translated',
    author: 'Florentino García Martínez',
    publisher: 'Brill',
    year: 1994,
    isbn: '9789004099213',
    tagline: 'English translation of the Qumran scroll corpus, including Enochic and Jubilees-related fragments.',
    description: [
      'This volume presents English translations of the non-biblical texts found at Qumran, translated from the Spanish edition by Wilfred G. E. Watson.',
      'It includes translations of Enochic fragments, copies related to Jubilees, and other Second Temple period compositions represented in the Dead Sea Scrolls, arranged by manuscript and cave.',
    ],
    topics: ['Dead Sea Scrolls', 'Qumran', 'translation'],
    affiliateUrl: 'https://www.amazon.com/dp/9789004099213?tag=enochwiki-20',

  },
  {
    slug: 'the-apocalyptic-imagination',
    title: 'The Apocalyptic Imagination: An Introduction to Jewish Apocalyptic Literature',
    shortTitle: 'The Apocalyptic Imagination',
    author: 'John J. Collins',
    publisher: 'Eerdmans',
    year: 1998,
    isbn: '9780802843718',
    tagline: 'Survey of Jewish apocalyptic literature from Daniel to the Dead Sea Scrolls.',
    description: [
      'This book introduces the genre of Jewish apocalyptic literature, examining works from the Second Temple period including Daniel, 1 Enoch, 4 Ezra, and 2 Baruch.',
      'The second edition, published in the Biblical Resource Series, revises the 1984 original and incorporates material from the Dead Sea Scrolls, with discussion of genre definitions and social settings of apocalypticism.',
    ],
    topics: ['apocalyptic literature', '1 Enoch', 'Second Temple Judaism'],
    affiliateUrl: 'https://www.amazon.com/dp/9780802843718?tag=enochwiki-20',

  },
]

export function getBook(slug: string): Book | undefined {
  return BOOKS.find((b) => b.slug === slug)
}

export function getBookSlugs(): string[] {
  return BOOKS.map((b) => b.slug)
}
