import Link from 'next/link'
import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import { Breadcrumbs, breadcrumbJsonLd } from '@/components/breadcrumbs'
import { CountdownTimer } from '@/components/film/countdown-timer'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'The Resurrection of the Christ (2027): Release Date Countdown, Cast, Story',
  description:
    'Countdown to The Resurrection of the Christ release date: Part One on May 6, 2027 and Part Two on May 25, 2028. Cast, story details, trailer status, production timeline, and every source. Mel Gibson directs; Jaakko Ohtonen plays Jesus.',
  alternates: { canonical: '/resurrection-of-the-christ' },
  openGraph: {
    title: 'The Resurrection of the Christ: Release Date Countdown',
    description:
      'Part One arrives May 6, 2027. Part Two follows May 25, 2028. Cast, story, trailer status, and sources in one place.',
    url: '/resurrection-of-the-christ',
    type: 'website',
  },
}

const SITE_URL = 'https://enoch.wiki'

const movieJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Movie',
  name: 'The Resurrection of the Christ: Part One',
  datePublished: '2027-05-06',
  director: { '@type': 'Person', name: 'Mel Gibson' },
  actor: [
    { '@type': 'Person', name: 'Jaakko Ohtonen' },
    { '@type': 'Person', name: 'Mariela Garriga' },
    { '@type': 'Person', name: 'Kasia Smutniak' },
    { '@type': 'Person', name: 'Pier Luigi Pasino' },
    { '@type': 'Person', name: 'Riccardo Scamarcio' },
    { '@type': 'Person', name: 'Rupert Everett' },
  ],
  productionCompany: { '@type': 'Organization', name: 'Icon Productions' },
  distributor: { '@type': 'Organization', name: 'Lionsgate' },
  url: `${SITE_URL}/resurrection-of-the-christ`,
}

type Source = { label: string; href: string }

function SourceList({ sources }: { sources: Source[] }) {
  return (
    <ul className="space-y-2">
      {sources.map((s) => (
        <li key={s.href} className="text-sm">
          <a
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-foreground underline decoration-accent/60 underline-offset-2 hover:decoration-accent transition-colors duration-150 ease-out"
          >
            {s.label}
          </a>
        </li>
      ))}
    </ul>
  )
}

function Section({ id, title, index, children }: { id: string; title: string; index: number; children: React.ReactNode }) {
  return (
    <section
      aria-labelledby={id}
      className="mb-10 sm:mb-12 reveal"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <h2 id={id} className="font-serif text-2xl sm:text-3xl font-bold mb-4">
        {title}
      </h2>
      <div className="space-y-4 text-foreground/90 leading-relaxed max-w-3xl">{children}</div>
    </section>
  )
}

export default function ResurrectionCountdown() {
  const crumbs = [{ label: 'Home', href: '/' }, { label: 'The Resurrection of the Christ' }]

  return (
    <div className="min-h-screen flex flex-col parchment-bg">
      <SiteHeader />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-24 sm:pb-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(crumbs, SITE_URL)) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(movieJsonLd) }}
        />
        <Breadcrumbs items={crumbs} />

        <div className="reveal">
        <h1 className="font-serif text-3xl sm:text-5xl font-bold leading-tight mb-3">
          The Resurrection of the Christ: Release Date Countdown
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg mb-6 max-w-3xl">
          Mel Gibson&apos;s two-part sequel to The Passion of the Christ arrives in
          theaters on <strong className="text-foreground">May 6, 2027</strong> (Part One)
          and <strong className="text-foreground">May 25, 2028</strong> (Part Two). Cast,
          story details, trailer status, and every source, in one place.
        </p>

        <div className="mb-10 sm:mb-12">
          <CountdownTimer />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Counting down to Part One, May 6, 2027, Ascension Day.
          </p>
        </div>
        </div>

        <Section id="at-a-glance" index={1} title="At a glance">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            {[
              ['Part One release date', 'May 6, 2027 (Ascension Day)'],
              ['Part Two release date', 'May 25, 2028 (Ascension Day weekend)'],
              ['Director', 'Mel Gibson'],
              ['Writers', 'Mel Gibson and Randall Wallace'],
              ['Producers', 'Mel Gibson and Bruce Davey (Icon Productions)'],
              ['Distributor', 'Lionsgate (North America, UK, Latin America)'],
              ['Jesus', 'Jaakko Ohtonen'],
              ['Filming', '134 days across Italy, wrapped May 2026'],
            ].map(([term, def]) => (
              <div key={term} className="flex gap-2 text-sm sm:text-base">
                <dt className="shrink-0 font-semibold text-muted-foreground min-w-36">{term}</dt>
                <dd>{def}</dd>
              </div>
            ))}
          </dl>
          <SourceList
            sources={[
              {
                label: 'Christian Post: Release date announced for The Resurrection of the Christ (May 25, 2026)',
                href: 'https://www.christianpost.com/news/release-date-announced-for-the-resurrection-of-the-christ.html',
              },
              {
                label: 'Patheos: First look at The Resurrection of the Christ (May 2026)',
                href: 'https://www.patheos.com/blogs/reelfaith/2026/05/first-look-mel-gibsons-the-resurrection-of-the-christ.html',
              },
            ]}
          />
        </Section>

        <Section id="story" index={2} title="What the film is about">
          <p>
            The two-part film follows the events after the crucifixion of Jesus. Gibson
            has said the story will travel beyond the planet to different realms: the
            firmament before the creation, the Hell of the just, and the Hell of the
            damned. The film also explores fallen angels and the origin of Satan,
            subjects the Gospels do not describe in detail.
          </p>
          <p>
            Gibson told the Christian Post that the story jumps between realms rather
            than staying on Earth, and that the gaps in the Gospel accounts leave room
            to imagine what surrounded the biblical events.
          </p>
          <SourceList
            sources={[
              {
                label: 'Christian Post: Mel Gibson says Resurrection will explore different realms (Sep 3, 2026)',
                href: 'https://www.christianpost.com/news/mel-gibson-says-resurrection-will-explore-different-realms.html',
              },
              {
                label: 'ComingSoon: Mel Gibson teases the different realms (Sep 2026)',
                href: 'https://www.comingsoon.net/movies/news/2187581-mel-gibson-resurrection-of-the-christ-tease-acid-trip-hell',
              },
            ]}
          />
        </Section>

        <Section id="cast" index={3} title="The Resurrection of the Christ cast">
          <p>
            The sequel uses an all-new cast. Finnish actor <strong>Jaakko Ohtonen</strong>,
            known for Netflix&apos;s The Last Kingdom, plays Jesus, replacing Jim Caviezel.
            Cuban actress <strong>Mariela Garriga</strong> plays Mary Magdalene, replacing
            Monica Bellucci. Polish actress <strong>Kasia Smutniak</strong> plays the Virgin
            Mary, replacing Maia Morgenstern.
          </p>
          <p>
            The cast also includes <strong>Pier Luigi Pasino</strong>,{' '}
            <strong>Riccardo Scamarcio</strong>, and <strong>Rupert Everett</strong>.
          </p>
          <SourceList
            sources={[
              {
                label: 'Hollywood Catholic: first look and cast details (May 22, 2026)',
                href: 'https://hollywoodcatholic.com/2026/05/22/mel-gibson-drops-first-look-resurrection-of-the-christ-filming-wraps-italy/',
              },
              {
                label: 'Patheos: First look at The Resurrection of the Christ (May 2026)',
                href: 'https://www.patheos.com/blogs/reelfaith/2026/05/first-look-mel-gibsons-the-resurrection-of-the-christ.html',
              },
            ]}
          />
        </Section>

        <Section id="trailer" index={4} title="Trailer status">
          <p>
            <strong>No official trailer has been released yet.</strong> The first public
            images came in May 2026, when Lionsgate released first-look photos of
            Ohtonen as Jesus alongside the wrapped-filming announcement. A behind-the-scenes
            sneak peek played with the 4K re-release of The Passion of the Christ in
            theaters September 10 to 17, 2026.
          </p>
          <p>
            This page will add the trailer the day it drops. Until then, the first-look
            photos and the re-release sneak peek are the only official footage in public.
          </p>
          <SourceList
            sources={[
              {
                label: 'Christian Post: Resurrection will explore different realms; re-release details (Sep 3, 2026)',
                href: 'https://www.christianpost.com/news/mel-gibson-says-resurrection-will-explore-different-realms.html',
              },
            ]}
          />
        </Section>

        <Section id="timeline" index={5} title="Production timeline">
          <ul className="space-y-3">
            {[
              ['October 2025', 'Principal photography begins at Cinecitta Studios in Rome.'],
              ['May 2026', 'Filming wraps after 134 days across Italy, including Rome, Matera, Bari, Ginosa, Craco, and Brindisi. Lionsgate releases first-look images of Jaakko Ohtonen as Jesus. Release dates announced: Part One May 6, 2027, Part Two May 25, 2028. Both dates fall on Ascension Day.'],
              ['September 2026', 'The Passion of the Christ returns to theaters in 4K for one week (Sep 10-17) with a behind-the-scenes sneak peek of Part One.'],
              ['September 2026', 'Gibson describes the multi-realm story: the firmament before creation, the Hell of the just, and the Hell of the damned. Cardinal Gerhard Ludwig Muller visits the set and spends a day discussing Resurrection theology with Gibson; Cardinal Raymond Burke, Franklin Graham, and Samuel Rodriguez also visit.'],
              ['May 6, 2027', 'The Resurrection of the Christ: Part One arrives in theaters.'],
              ['May 25, 2028', 'The Resurrection of the Christ: Part Two arrives in theaters.'],
            ].map(([date, text]) => (
              <li key={date + text.slice(0, 20)} className="flex gap-3">
                <span className="shrink-0 font-semibold text-muted-foreground min-w-28 text-sm sm:text-base">{date}</span>
                <span className="text-sm sm:text-base">{text}</span>
              </li>
            ))}
          </ul>
          <SourceList
            sources={[
              {
                label: 'Christian Post: release dates and filming wrap (May 25, 2026)',
                href: 'https://www.christianpost.com/news/release-date-announced-for-the-resurrection-of-the-christ.html',
              },
              {
                label: 'Catholic Sun via OSV News: Cardinal Muller visits the set (Sep 15, 2026)',
                href: 'https://www.catholicsun.org/2026/09/15/cardinal-muller-spent-hours-with-mel-gibson-on-the-film-set-of-the-resurrection-of-the-christ/',
              },
            ]}
          />
        </Section>

        <Section id="faith-voices" index={6} title="What faith leaders are saying">
          <p>
            Cardinal Gerhard Ludwig Muller, former head of the Vatican&apos;s doctrine
            office, spent an entire day on the set discussing the theology of the
            Resurrection with Gibson. He said the film is not only about a historical
            event 2,000 years ago, but about the risen Christ present as head of the
            Church for all believers.
          </p>
          <p>
            He was joined on set by Cardinal Raymond Burke, evangelist Franklin Graham,
            and pastor Samuel Rodriguez. Burke called the original Passion of the Christ
            truly monumental, a story that touched the hearts of many.
          </p>
          <SourceList
            sources={[
              {
                label: 'Catholic Sun via OSV News: Cardinal Muller on the set (Sep 15, 2026)',
                href: 'https://www.catholicsun.org/2026/09/15/cardinal-muller-spent-hours-with-mel-gibson-on-the-film-set-of-the-resurrection-of-the-christ/',
              },
              {
                label: 'InfoVaticana: Cardinal Muller discusses theology with Gibson (Sep 16, 2026)',
                href: 'https://infovaticana.com/en/2026/09/16/cardinal-muller-spent-an-entire-day-with-mel-gibson-on-the-set-of-the-resurrection-of-christ-discussing-theology/',
              },
            ]}
          />
        </Section>

        <Section id="enoch-connection" index={7} title="Why this film matters to readers of 1 Enoch">
          <p>
            This site exists to make the Book of 1 Enoch readable. The film&apos;s
            announced cosmology will sound familiar to Enoch readers: a journey through
            layered realms, a Hell divided between the just and the damned, and the
            prison of the fallen angels. 1 Enoch maps exactly this kind of universe.
            Enoch travels through the heavens, sees the chambers of the winds, the
            storehouses of the luminaries, the place of the dead, and the abyss where
            the Watchers, the angels who fell, are bound.
          </p>
          <p>
            The film is not an adaptation of 1 Enoch. But its multi-realm design draws
            from the same ancient imagination. If the trailer or the film itself names
            Enochic sources, this page will say so. Until then, read the{' '}
            <Link href="/read" className="underline decoration-accent/60 underline-offset-2">
              Book of 1 Enoch
            </Link>{' '}
            and judge the overlap for yourself.
          </p>
        </Section>

        <Section id="sources" index={8} title="All sources">
          <p>
            Every fact on this page comes from one of these reports. Dates and details
            are updated as new announcements land.
          </p>
          <SourceList
            sources={[
              {
                label: 'Christian Post: Release date announced for The Resurrection of the Christ (May 25, 2026)',
                href: 'https://www.christianpost.com/news/release-date-announced-for-the-resurrection-of-the-christ.html',
              },
              {
                label: 'Patheos: First look at Mel Gibson\u2019s The Resurrection of the Christ (May 2026)',
                href: 'https://www.patheos.com/blogs/reelfaith/2026/05/first-look-mel-gibsons-the-resurrection-of-the-christ.html',
              },
              {
                label: 'Hollywood Catholic: first look, cast, and wrapped filming (May 22, 2026)',
                href: 'https://hollywoodcatholic.com/2026/05/22/mel-gibson-drops-first-look-resurrection-of-the-christ-filming-wraps-italy/',
              },
              {
                label: 'Christian Post: Mel Gibson says Resurrection will explore different realms (Sep 3, 2026)',
                href: 'https://www.christianpost.com/news/mel-gibson-says-resurrection-will-explore-different-realms.html',
              },
              {
                label: 'ComingSoon: Mel Gibson teases the different realms (Sep 2026)',
                href: 'https://www.comingsoon.net/movies/news/2187581-mel-gibson-resurrection-of-the-christ-tease-acid-trip-hell',
              },
              {
                label: 'Beliefnet: Resurrection will venture into Hell, fallen angels, different realms (Sep 2026)',
                href: 'https://www.beliefnet.com/columnists/idolchatter/2026/09/mel-gibson-reveals-resurrection-of-the-christ-will-venture-into-hell-fallen-angels-and-different-realms.html',
              },
              {
                label: 'Catholic Sun via OSV News: Cardinal Muller spent hours with Mel Gibson on set (Sep 15, 2026)',
                href: 'https://www.catholicsun.org/2026/09/15/cardinal-muller-spent-hours-with-mel-gibson-on-the-film-set-of-the-resurrection-of-the-christ/',
              },
              {
                label: 'InfoVaticana: Cardinal Muller on the set discussing theology (Sep 16, 2026)',
                href: 'https://infovaticana.com/en/2026/09/16/cardinal-muller-spent-an-entire-day-with-mel-gibson-on-the-set-of-the-resurrection-of-christ-discussing-theology/',
              },
            ]}
          />
        </Section>
      </main>
      <MobileBottomNav mobilePane={null} className="fixed bottom-0 inset-x-0 z-40" />
    </div>
  )
}
