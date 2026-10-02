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
]

export function getBook(slug: string): Book | undefined {
  return BOOKS.find((b) => b.slug === slug)
}

export function getBookSlugs(): string[] {
  return BOOKS.map((b) => b.slug)
}
