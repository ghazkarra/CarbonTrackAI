import { useEffect, useMemo, useState } from 'react'
import { FiClock as Clock } from 'react-icons/fi'

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'medium',
  timeZone: 'Asia/Jakarta',
})

export function LiveTimestamp() {
  const [now, setNow] = useState(() => new Date())
  const formattedTime = useMemo(() => dateTimeFormatter.format(now), [now])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="dashboard-timestamp hidden items-center gap-2 rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm font-semibold text-muted-foreground shadow-sm backdrop-blur sm:flex">
      <Clock className="size-4 text-primary" />
      <time dateTime={now.toISOString()}>{formattedTime} WIB</time>
    </div>
  )
}
