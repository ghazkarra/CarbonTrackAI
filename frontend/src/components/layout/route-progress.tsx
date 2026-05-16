import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

export function RouteProgress() {
  const location = useLocation()
  const [visible, setVisible] = useState(false)
  const [finishing, setFinishing] = useState(false)

  useEffect(() => {
    const startTimer = window.setTimeout(() => {
      setVisible(true)
      setFinishing(false)
    }, 0)

    const finishTimer = window.setTimeout(() => setFinishing(true), 180)
    const hideTimer = window.setTimeout(() => setVisible(false), 520)

    return () => {
      window.clearTimeout(startTimer)
      window.clearTimeout(finishTimer)
      window.clearTimeout(hideTimer)
    }
  }, [location.pathname])

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-1 bg-transparent">
      <div className={`h-full bg-primary shadow-lg shadow-primary/40 transition-all duration-300 ${finishing ? 'w-full opacity-0' : 'w-2/3 opacity-100'}`} />
    </div>
  )
}
