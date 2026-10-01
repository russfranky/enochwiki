import s from './landing.module.css'
import { ReturningReaderBanner } from './returning-reader-banner'

// Marketing landing page for /. Server-rendered, no client JS: the FAQ uses
// native <details>. Brand and sections replicate the approved artifact export
// (workspace/your_files/enoch-wiki-landing-page/enoch-wiki-landing-page.html).
// Copy rule: zero emdashes, brief wording, claims match the real app only.

function BrandMark({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 240 240" role="img" aria-label={label}>
      <circle cx="120" cy="120" r="100" fill="none" stroke="#C8A035" strokeWidth="5" />
      <path
        d="M 120 20 L 129.9 96 L 163.8 76.2 L 144 110.1 L 220 120 L 144 129.9 L 163.8 163.8 L 129.9 144 L 120 220 L 110.1 144 L 76.2 163.8 L 96 129.9 L 20 120 L 96 110.1 L 76.2 76.2 L 110.1 96 Z"
        fill="#C8A035"
      />
      <ellipse cx="120" cy="120" rx="112" ry="42" fill="none" stroke="#C8A035" strokeWidth="6" transform="rotate(-22 120 120)" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className={s.ck} viewBox="0 0 22 22" aria-hidden="true">
      <circle cx="11" cy="11" r="10" fill="none" stroke="#C8A035" strokeWidth="2" />
      <path d="M7 11.5l3 3 5.5-6" fill="none" stroke="#1B2B5A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function LandingHeader() {
  return (
    <header className={s.top}>
      <div className={s.topbar}>
        <a className={s.brand} href="#top" aria-label="enoch.wiki, back to top">
          <BrandMark label="enoch.wiki mark: an eight-point compass star within an orbital ring" />
          enoch.wiki
        </a>
        <nav className={s.menu} aria-label="Page sections">
          <a className={s.navlink} href="/read">The app</a>
          <a className={s.navlink} href="/how-we-vet">How we vet</a>
          <a className={s.navlink} href="#vision">Vision</a>
          <a className={s.navlink} href="#faq">FAQ</a>
          <a className={`${s.btn} ${s['btn-primary']} ${s['btn-sm']}`} href="/read">
            Open app <span className={s.arr} aria-hidden="true">→</span>
          </a>
        </nav>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className={s.hero} id="top" aria-labelledby="hero-h">
      <div className={`${s.wrap} ${s['hero-grid']}`}>
        <div>
          <p className={s.pill}>
            <span className={s.dot} aria-hidden="true"></span> The Ethiopian Bible, corroborated
          </p>
          <h1 id="hero-h">
            What the text says.
            <br />
            <span className={s.it}>And how we know.</span>
          </h1>
          <p className={s.lede}>
            1&nbsp;Enoch is not in most Bibles, but the Ethiopian Orthodox canon preserved it.
            enoch.wiki pairs that scripture with the sources that corroborate it: every claim
            labeled, every source tiered, anything still in review marked as such.
          </p>
          <div className={s['cta-row']}>
            <a className={`${s.btn} ${s['btn-gold']}`} href="/read">
              Start reading <span className={s.arr} aria-hidden="true">→</span>
            </a>
            <a className={`${s.btn} ${s['btn-ghost']}`} href="#vet">See how we vet</a>
          </div>
          <p className={s['hero-note']}>
            A scholarly-neutral study resource for the Book of Enoch, Jubilees, Meqabyan,
            and the wider Ethiopian Tewahedo canon.
          </p>
          <div className={s['rule-gold']} aria-hidden="true"></div>
        </div>
        <div
          className={s.mock}
          role="img"
          aria-label="Illustration of the enoch.wiki reader: a selected verse on the left, paired with its corroborating evidence, source tier, and corroboration score on the right."
        >
          <div className={s['mock-bar']} aria-hidden="true">
            <span className={`${s['mock-tab']} ${s.on}`}>Read</span>
            <span className={s['mock-tab']}>Explore</span>
            <span className={s['mock-tab']}>Timeline</span>
            <span className={s['mock-tab']}>Study</span>
            <span className={s['mock-search']}>⌕ Search verses, sources…</span>
          </div>
          <div className={s['mock-body']} aria-hidden="true">
            <div className={s['mock-read']}>
              <p className={s['mock-bc']}>1 Enoch · ch. 1</p>
              <p className={`${s.verse} ${s.sel}`}>
                <span className={s.vnum}>1</span>The words of the blessing of Enoch, wherewith he blessed the elect and righteous…
              </p>
              <p className={s.verse}>
                <span className={s.vnum}>2</span>And Enoch took up his parable and said…
              </p>
              <p className={s.verse}>
                <span className={s.vnum}>3</span>A holy vision from the heavens…
              </p>
            </div>
            <div className={s['mock-ev']}>
              <div className={s['ev-head']}>
                <span className={s.t}>Evidence</span>
                <span className={`${s.tag} ${s['t-cons']}`}>Scholarly consensus</span>
              </div>
              <p className={s['ev-claim']}>
                “The Book of the Watchers (1&nbsp;Enoch 1–36) describes the descent of the
                angelic ‘Watchers’ and parallels fragments found among the Dead Sea Scrolls.”
              </p>
              <div className={s['ev-meta']}>
                <span>
                  VanderKam, <em>The Book of Enoch</em> · <span style={{ fontWeight: 600, color: 'var(--head)' }}>peer-reviewed</span>
                </span>
                <span className={s.meter}>
                  Corroboration <span className={s.d}></span><span className={s.d}></span>
                  <span className={s.d}></span><span className={s.d}></span>
                  <span className={`${s.d} ${s.off}`}></span>
                </span>
              </div>
            </div>
          </div>
          <div className={s['mock-cap']} aria-hidden="true">
            <b>Scripture + evidence, side by side.</b> Select any verse to see what backs it up.
          </div>
        </div>
      </div>
    </section>
  )
}

function CertaintyStrip() {
  return (
    <div className={s.strip} aria-label="Claim-type labels used across enoch.wiki">
      <div className={s.wrap}>
        <span className={s.lab}>Every claim carries its certainty:</span>
        <div className={s.tags}>
          <span className={`${s.tag} ${s['t-text']}`}>Textually attested</span>
          <span className={`${s.tag} ${s['t-corr']}`}>Historically corroborated</span>
          <span className={`${s.tag} ${s['t-cons']}`}>Scholarly consensus</span>
          <span className={`${s.tag} ${s['t-cont']}`}>Contested / minority</span>
          <span className={`${s.tag} ${s['t-trad']}`}>Tradition / devotional</span>
          <span className={`${s.tag} ${s['t-spec']}`}>Speculative</span>
        </div>
      </div>
    </div>
  )
}

function AppSection() {
  return (
    <section id="app" aria-labelledby="app-h">
      <div className={s.wrap}>
        <div className={s['sec-head']}>
          <p className={s.kicker}>01 · The App</p>
          <h2 id="app-h">One place to read, trace, and question the canon</h2>
          <p>The text is the hero; everything else serves it. Read verse by verse, then follow the evidence.</p>
        </div>

        <article className={s['feat-wide']}>
          <div className={s.copy}>
            <div className={s['feat-ic']} aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M5 3.5h11a2.5 2.5 0 012.5 2.5v14.5H7.5A2.5 2.5 0 015 18z" />
                <path d="M5 18h13.5M9.5 8h5.5M9.5 11.5h5.5" />
              </svg>
            </div>
            <h3>The reader: scripture, paired with its evidence</h3>
            <p>
              The full text of the Ethiopian Tewahedo canon (1&nbsp;Enoch, Jubilees, Meqabyan,
              and more). Each verse sits one tap from the sources that contextualize, support,
              or challenge it. Credibility tiers and scores stay visible, never buried.
            </p>
            <ul className={s['inc-list']}>
              <li>Verse-by-verse reading</li>
              <li>Scripture beside its evidence</li>
              <li>Tiers and scores always visible</li>
            </ul>
          </div>
          <div className={s['feat-visual']} aria-hidden="true">
            <div className={s['verse-card']}>
              <p className={s.ref}>Selected: 1 Enoch 20:2</p>
              <p>“Uriel, one of the seven archangels, prince set over thunder and earthquake…”</p>
              <div className={s.row}>
                <span className={`${s.tag} ${s['t-corr']}`}>Corroborated</span>
                <span className={s.meter}>
                  58% <span className={s.d}></span><span className={s.d}></span>
                  <span className={s.d}></span><span className={`${s.d} ${s.off}`}></span>
                  <span className={`${s.d} ${s.off}`}></span>
                </span>
              </div>
            </div>
          </div>
        </article>

        <div className={s['feat-grid']}>
          <article className={s.feat}>
            <div className={s['feat-ic']} aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" />
                <path d="M16.5 16.5L21 21" />
              </svg>
            </div>
            <h3>Search across everything</h3>
            <p>
              One search over verses, sources, and evidence: cross-references, themes, and
              glossary included. Type a name, an idea, or a passage and jump to the
              scholarship around it.
            </p>
            <ul className={s['inc-list']}>
              <li>Verses, sources, and evidence</li>
              <li>Themes, cross-references, glossary</li>
              <li>Names, ideas, and passages</li>
            </ul>
            <div className={s.mini} aria-hidden="true">
              <div className={s['mini-search']}>
                <svg viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M16.5 16.5L21 21" />
                </svg>
                <span className={s.q}>watchers</span>
              </div>
              <p className={s['mini-counts']}>Results across verses, sources, and evidence</p>
            </div>
          </article>

          <article className={s.feat}>
            <div className={s['feat-ic']} aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="6" cy="6" r="2.6" />
                <circle cx="18" cy="8" r="2.6" />
                <circle cx="10" cy="18" r="2.6" />
                <path d="M8.4 7l7 1M7 8.4l2 7M16.4 10l-4.8 6" />
              </svg>
            </div>
            <h3>Knowledge graph</h3>
            <p>
              Angels, kings, cities, feasts, calendars. Every figure, place, and event is a
              node to explore, with the passages and evidence that connect them.
            </p>
            <ul className={s['inc-list']}>
              <li>Figures, places, and events as nodes</li>
              <li>The passages that connect them</li>
              <li>Evidence behind every link</li>
            </ul>
            <div className={s.mini} aria-hidden="true">
              <svg className={s.graph} viewBox="0 0 300 120">
                <g stroke="#B6BBCA" strokeWidth="1.5">
                  <path d="M70 45 L150 60 M150 60 L228 40 M150 60 L120 100 M228 40 L238 92 M150 60 L238 92" fill="none" />
                </g>
                <g fontFamily="Inter,sans-serif" fontSize="10.5" fontWeight="600" textAnchor="middle">
                  <circle cx="70" cy="45" r="26" fill="#1B2B5A" />
                  <text x="70" y="49" fill="#fff">Enoch</text>
                  <circle cx="150" cy="60" r="30" fill="#C8A035" />
                  <text x="150" y="64" fill="#0A0F20">Watchers</text>
                  <circle cx="228" cy="40" r="24" fill="#1B2B5A" />
                  <text x="228" y="44" fill="#fff">Nephilim</text>
                  <circle cx="120" cy="100" r="22" fill="#5B6688" />
                  <text x="120" y="104" fill="#fff">Qumran</text>
                  <circle cx="238" cy="92" r="22" fill="#5B6688" />
                  <text x="238" y="96" fill="#fff">Flood</text>
                </g>
              </svg>
            </div>
          </article>

          <article className={s.feat}>
            <div className={s['feat-ic']} aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M3 12h18" />
                <circle cx="7" cy="12" r="2.2" />
                <circle cx="13" cy="12" r="2.2" />
                <circle cx="19" cy="12" r="2.2" />
                <path d="M7 9.8V5.5M13 14.2v4.3M19 9.8V5.5" />
              </svg>
            </div>
            <h3>Timeline &amp; themes</h3>
            <p>
              Walk the text chronologically, from the Enochic writings to their Ge&apos;ez
              translation. Or follow a theme (the calendar, the heavens, the Son of Man)
              across the books.
            </p>
            <ul className={s['inc-list']}>
              <li>From composition to the Ge&apos;ez translation</li>
              <li>Theme threads across the books</li>
              <li>Calendar, heavens, Son of Man</li>
            </ul>
            <div className={s.mini} aria-hidden="true">
              <div className={s.tline}>
                <div className={s.rail}>
                  <div className={s.fill}></div>
                  <span className={s.tick} style={{ left: '6%' }}></span>
                  <span className={s.tick} style={{ left: '44%' }}></span>
                  <span className={s.tick} style={{ left: '70%' }}></span>
                </div>
                <div className={s.ticks}>
                  <span>3rd c. BCE</span>
                  <span>1st c. CE</span>
                  <span>Ge&apos;ez canon</span>
                </div>
              </div>
            </div>
          </article>

          <article className={s.feat}>
            <div className={s['feat-ic']} aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 3a5 5 0 015 5c0 2-1 3.1-2.2 4.2-.8.8-1.3 1.4-1.3 2.3h-3c0-.9-.5-1.5-1.3-2.3C8 11.1 7 10 7 8a5 5 0 015-5z" />
                <path d="M10 19h4M10.5 21.2h3" />
              </svg>
            </div>
            <h3>Study tools &amp; a study companion</h3>
            <p>
              Flashcards with spaced repetition, guided study plans, and a daily insight
              from the canon. Plus an AI companion that answers questions, summarizes
              passages, and cites its sources.
            </p>
            <ul className={s['inc-list']}>
              <li>Flashcards with spaced repetition</li>
              <li>Guided study plans</li>
              <li>Answers that cite their sources</li>
            </ul>
            <div className={s.mini} aria-hidden="true">
              <div className={`${s.msg} ${s.u}`}>What do scholars dispute about the Parables?</div>
              <div className={`${s.msg} ${s.a}`}>
                The date: absence from Qumran suggests post-70 CE…
                <span className={s.cite}>↑ Sources cited</span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

const RUBRIC = [
  'Sources cited and retrievable',
  'Minimum credibility tier met for authoritative claims',
  'Claim type labeled, every time',
  'Perspectives represented: no unflagged single-source claims',
  'No fabricated citations',
  'Contested or sensitive claims flagged and contextualized',
  'Authority never overstated',
]

const TIERS = [
  { n: '1', name: 'Peer-reviewed / academic', desc: 'Peer-reviewed journals, university presses, scholarly monographs.' },
  { n: '2', name: 'Reputable reference', desc: 'Established encyclopedias and museum collections: Brill, Oxford, Cambridge.' },
  { n: '3', name: 'Popular / journalistic', desc: 'Reputable journalism and popular reference: the Biblical Archaeology Society, Smithsonian.' },
  { n: '4', name: 'Self-published / forum', desc: 'Blogs, forums, video, self-published books. Surfaced only with explicit flagging, never as authority.' },
]

function VetSection() {
  return (
    <section className={s.vet} id="vet" aria-labelledby="vet-h">
      <div className={s.wrap}>
        <div className={s['sec-head']}>
          <p className={s.kicker}>02 · How We Vet</p>
          <h2 id="vet-h">Trust is the product</h2>
          <p>
            Anyone can publish claims about ancient texts. enoch.wiki holds a higher bar:
            a three-stage editorial pipeline stands between raw research and anything the
            public reads.
          </p>
        </div>

        <div className={s.pipe}>
          <div className={s.step}>
            <div className={s.n}>01</div>
            <h3>Research &amp; ingestion</h3>
            <p>
              Scripture, themes, cross-references, and external sources are gathered with
              credibility tiers, perspective tags, and claim-type labels from the start.
            </p>
          </div>
          <div className={s.step}>
            <div className={s.n}>02</div>
            <h3>The editorial gate</h3>
            <p>
              Every item moves draft → auto-corroborated → in editorial review against a
              written rubric. Anything rejected, unrevisable, or unverified stays out.
            </p>
          </div>
          <div className={s.step}>
            <div className={s.n}>03</div>
            <h3>Public, on approval only</h3>
            <p>
              Only approved topics and articles are served. Each carries its sources, claim
              label, and corroboration score, right next to the claim.
            </p>
          </div>
        </div>

        <div className={s['vet-cols']}>
          <div>
            <h3>The review rubric</h3>
            <p className={s['vet-sub']}>Nothing ships until a reviewer confirms every line of it:</p>
            <ul className={s.rubric}>
              {RUBRIC.map((r) => (
                <li key={r}>
                  <CheckIcon />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Source credibility tiers</h3>
            <p className={s['vet-sub']}>Every source is graded, and the grade travels with every claim it backs:</p>
            <div className={s.tiers}>
              {TIERS.map((t) => (
                <div className={s.tier} key={t.n}>
                  <span className={s.rank} aria-hidden="true">{t.n}</span>
                  <div>
                    <p className={s.rn}>{t.name}</p>
                    <p className={s.rd}>{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function VisionSection() {
  return (
    <section id="vision" aria-labelledby="vision-h">
      <div className={`${s.wrap} ${s['vision-grid']}`}>
        <figure className={s.manuscript}>
          <img
            src="/images/garima-gospels.jpg"
            alt="Illuminated canon table with Ge'ez script from the Garima Gospels, among the oldest preserved manuscripts of the Ethiopian tradition"
            width={960}
            height={1239}
            loading="lazy"
          />
          <figcaption>
            <b>The Garima Gospels.</b> An illuminated canon table in Ge&apos;ez, the classical
            language of the Ethiopian church. The same tradition preserved the Book of Enoch
            after the West set it aside. Photograph via Wikimedia Commons.
          </figcaption>
        </figure>
        <div className={s['vision-prose']}>
          <p className={s.kicker}>03 · Vision</p>
          <h2 id="vision-h">
            A preserved book deserves a <em>careful</em> reader
          </h2>
          <p>
            The Book of Enoch moves through angels and heavens, calendars and judgment, in a
            voice that shaped Jewish and Christian thought for centuries. It survived only
            because the Ethiopian Orthodox Tewahedo Church kept it in its canon. Today it
            lives mostly in two places: the library of scholars, and the feeds of the
            “forbidden knowledge” internet. The first is hard to reach; the second is built
            to mislead.
          </p>
          <p className={s.pull}>Credible, not cryptic. Luminous, not sensational.</p>
          <p>
            enoch.wiki is the third place: a corroborated knowledge base for the Book of
            Enoch and the wider scriptural canon, held to an editorial standard. What the
            text says, what scholars corroborate, where traditions disagree, what is plain
            speculation. Each labeled in plain words, each backed by sources you can check.
            Scholarly-neutral, reverent toward the material, neutral toward belief.
          </p>
          <p>
            The vision is simple: anyone curious about these texts should find the truth
            about them. Stated carefully, sourced openly, kept honest by a gate that never
            sleeps.
          </p>
          <div className={s.purpose} role="list" aria-label="The enoch.wiki purpose triad">
            <div className={s['purpose-item']} role="listitem">
              <span className={s.pn}>01</span>
              <span className={s.pt}>Preserve the Ethiopian context</span>
            </div>
            <div className={s['purpose-item']} role="listitem">
              <span className={s.pn}>02</span>
              <span className={s.pt}>Label every claim type</span>
            </div>
            <div className={s['purpose-item']} role="listitem">
              <span className={s.pn}>03</span>
              <span className={s.pt}>Show the sources</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const FAQS = [
  {
    q: 'What does “scholarly-neutral” mean here?',
    a: 'We report what the texts say, what evidence supports, and where scholars and traditions disagree. No preaching, no debunking, no pulpit or conspiracy tone. Multiple perspectives are represented; overconfident claims get flagged.',
  },
  {
    q: 'Which books does enoch.wiki cover?',
    a: 'The Ethiopian Tewahedo canon, with 1 Enoch, Jubilees, and Meqabyan at the center, plus the cross-references that connect them to the wider scriptural canon. Public pages appear only after passing the editorial gate, so coverage grows as review completes.',
  },
  {
    q: 'How do I know which claims are solid?',
    a: 'Every published claim carries a claim-type label (textually attested, scholarly consensus, contested, speculative, and more), the source and its credibility tier, and a corroboration score. Research still in the pipeline appears only where it is explicitly marked unverified: flagged, not authoritative. The full label system is on the site’s “How we vet” page.',
  },
  {
    q: 'Is the study companion’s AI reliable?',
    a: 'It answers from the site’s own vetted corpus and cites its sources. But it is a study aid, not an authority. The reader, the evidence panels, and the sources themselves are always the final word.',
  },
  {
    q: 'Who is building this?',
    a: 'An independent effort, built in the open with care for the material. If you work in scholarship, manuscripts, or the Ethiopian tradition and want to help the evidence get better, start by reading the site. The gaps will be obvious, and the gate is honest about them.',
  },
]

function FaqSection() {
  return (
    <section className={s.faq} id="faq" aria-labelledby="faq-h">
      <div className={s.wrap}>
        <div className={s['sec-head']}>
          <h2 id="faq-h">Questions, answered plainly</h2>
          <p>The honest version, up front: including what this site is not.</p>
        </div>
        <div className={s['faq-list']}>
          {FAQS.map((f, i) => (
            <details className={s.fq} key={f.q} open={i === 0}>
              <summary>
                {f.q}
                <span className={s.pm} aria-hidden="true">+</span>
              </summary>
              <div className={s.ans}>
                <p>{f.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className={s.final} aria-labelledby="final-h">
      <div className={s.wrap}>
        <svg className={s.mark} viewBox="0 0 240 240" role="img" aria-label="enoch.wiki mark">
          <circle cx="120" cy="120" r="100" fill="none" stroke="#C8A035" strokeWidth="5" />
          <path
            d="M 120 20 L 129.9 96 L 163.8 76.2 L 144 110.1 L 220 120 L 144 129.9 L 163.8 163.8 L 129.9 144 L 120 220 L 110.1 144 L 76.2 163.8 L 96 129.9 L 20 120 L 96 110.1 L 76.2 76.2 L 110.1 96 Z"
            fill="#C8A035"
          />
          <ellipse cx="120" cy="120" rx="112" ry="42" fill="none" stroke="#C8A035" strokeWidth="6" transform="rotate(-22 120 120)" />
        </svg>
        <h2 id="final-h">Begin with the Book of the Watchers</h2>
        <p>
          Read 1&nbsp;Enoch beside its evidence. Every verse is one tap from the sources
          that corroborate it.
        </p>
        <a className={`${s.btn} ${s['btn-gold']}`} href="/read">
          Open app <span className={s.arr} aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  )
}

function LandingFooter() {
  return (
    <footer>
      <div className={s.wrap}>
        <div className={s.foot}>
          <div>
            <a className={s.brand} href="#top" aria-label="enoch.wiki, back to top">
              <BrandMark label="enoch.wiki mark" />
              enoch.wiki
            </a>
            <p className={s['foot-note']}>
              A corroborated knowledge base for the Book of Enoch and the wider scriptural
              canon. Clear, warm, and trustworthy.
            </p>
          </div>
          <nav className={s['foot-links']} aria-label="Footer">
            <a href="/read">The app</a>
            <a href="/how-we-vet">How we vet</a>
            <a href="#vision">Vision</a>
            <a href="#faq">FAQ</a>
            <a href="/topics">Topics</a>
          </nav>
        </div>
        <div className={s['foot-base']}>
          <span>The Ethiopian Bible, corroborated.</span>
          <span>Manuscript image: Garima Gospels, via Wikimedia Commons.</span>
        </div>
      </div>
    </footer>
  )
}

export function LandingPage() {
  return (
    <div className={s.landing}>
      <a className={s.skip} href="#main">Skip to content</a>
      <ReturningReaderBanner />
      <LandingHeader />
      <main id="main">
        <Hero />
        <CertaintyStrip />
        <AppSection />
        <VetSection />
        <VisionSection />
        <FaqSection />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  )
}
