import type { Metadata } from "next";
import { Spectral, Source_Serif_4, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const sourceSerif4 = Source_Serif_4({
  variable: "--font-source-serif-4",
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const SITE_URL = "https://enoch.wiki";
const SITE_NAME = "Enoch.Wiki";
const SITE_TAGLINE = "The Ethiopian Bible, corroborated. A scholarly-neutral study and reference resource.";
const SITE_DESCRIPTION =
  "Enoch.Wiki is a rigorously corroborated knowledge resource for the Ethiopian Orthodox Bible — 1 Enoch, Jubilees, Meqabyan, 4 Baruch, and the canonical gospels. Every claim is sourced, perspective-tagged, and credibility-scored. Designed for the audience of The Resurrection of the Christ (May 2027).";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  generator: "Enoch.Wiki Study Engine",
  keywords: [
    "Enoch.Wiki",
    "Book of Enoch",
    "1 Enoch",
    "Ethiopian Bible",
    "Ethiopian Orthodox Tewahedo",
    "Jubilees",
    "Meqabyan",
    "4 Baruch",
    "Harrowing of Hell",
    "Resurrection of Christ",
    "Apocrypha",
    "Biblical canon",
    "Anne Catherine Emmerich",
    "Dead Sea Scrolls",
    "Ge'ez",
    "Mel Gibson Resurrection",
  ],
  authors: [{ name: "Enoch.Wiki Editorial Team" }],
  creator: "Enoch.Wiki",
  publisher: "Enoch.Wiki",
  category: "Religion & Spirituality",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Enoch.Wiki — The Ethiopian Bible, corroborated",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    creator: "@enochwiki",
    site: "@enochwiki",
    images: ["/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.json",
  other: {
    "theme-color": "#1B2B5A",
    "msapplication-TileColor": "#1B2B5A",
  },
};

// JSON-LD structured data for SEO
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      sameAs: [],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      publisher: { "@id": `${SITE_URL}/#organization` },
      description: SITE_TAGLINE,
      inLanguage: "en-US",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${spectral.variable} ${sourceSerif4.variable} ${inter.variable}`}>
      <head>
        <style>{`
          :root {
            --font-display-stack: var(--font-spectral), Georgia, 'Times New Roman', serif;
            --font-read-stack: var(--font-source-serif-4), Georgia, serif;
            --font-ui-stack: var(--font-inter), system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
            --font-mono-stack: var(--font-inter), ui-monospace, 'SF Mono', monospace;
          }
        `}</style>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className="antialiased bg-background text-foreground"
        style={{ fontFamily: 'var(--font-ui-stack)' }}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
