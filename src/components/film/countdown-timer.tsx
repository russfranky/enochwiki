'use client'

import { useEffect, useState } from 'react'

const TARGET = new Date('2027-05-06T00:00:00-04:00').getTime()

function parts(now: number) {
  const diff = Math.max(0, TARGET - now)
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  return { days, hours, minutes, seconds, live: diff === 0 }
}

const UNITS: { key: keyof Omit<ReturnType<typeof parts>, 'live'>; label: string }[] = [
  { key: 'days', label: 'Days' },
  { key: 'hours', label: 'Hours' },
  { key: 'minutes', label: 'Minutes' },
  { key: 'seconds', label: 'Seconds' },
]

export function CountdownTimer() {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  if (now === null) {
    return (
      <div className="flex gap-2 sm:gap-3" aria-hidden="true">
        {UNITS.map((u) => (
          <div key={u.key} className="flex-1 rounded-lg border border-border bg-card px-2 py-3 text-center sm:px-4 sm:py-4">
            <div className="font-serif text-2xl sm:text-4xl font-bold tabular-nums">--</div>
            <div className="text-xs text-muted-foreground mt-1">{u.label}</div>
          </div>
        ))}
      </div>
    )
  }

  const p = parts(now)
  if (p.live) {
    return (
      <p className="rounded-lg border border-border bg-card px-4 py-6 text-center font-serif text-xl sm:text-2xl font-semibold" role="status">
        The Resurrection of the Christ: Part One is now in theaters.
      </p>
    )
  }

  return (
    <div className="flex gap-2 sm:gap-3" role="timer" aria-label="Countdown to the release of The Resurrection of the Christ Part One">
      {UNITS.map((u) => (
        <div key={u.key} className="flex-1 rounded-lg border border-border bg-card px-2 py-3 text-center sm:px-4 sm:py-4">
          <div className="font-serif text-2xl sm:text-4xl font-bold tabular-nums overflow-hidden">
            <span key={String(p[u.key])} className="digit-in">
              {String(p[u.key]).padStart(u.key === 'days' ? 1 : 2, '0')}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">{u.label}</div>
        </div>
      ))}
    </div>
  )
}
