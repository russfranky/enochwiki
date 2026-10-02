import Link from 'next/link'
import { Fragment } from 'react'

export interface Crumb {
  label: string
  href?: string
}

// Visible breadcrumb trail, matching the JSON-LD BreadcrumbList on the page.
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        {items.map((c, i) => (
          <Fragment key={c.label}>
            {i > 0 && (
              <li aria-hidden="true" className="select-none">
                /
              </li>
            )}
            <li>
              {c.href && i < items.length - 1 ? (
                <Link href={c.href} className="hover:text-foreground hover:underline">
                  {c.label}
                </Link>
              ) : (
                <span aria-current="page" className="text-foreground font-medium">
                  {c.label}
                </span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  )
}

export function breadcrumbJsonLd(items: Crumb[], siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: `${siteUrl}${c.href}` } : {}),
    })),
  }
}
