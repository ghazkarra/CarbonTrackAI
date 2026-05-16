import { FiMoon as Moon, FiSun as Sun } from 'react-icons/fi'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTheme } from './theme-provider'

type Phase = 'expand' | 'contract' | 'icon-out' | null

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [phase, setPhase] = useState<Phase>(null)
  const [transitionTheme, setTransitionTheme] = useState<'light' | 'dark' | null>(null)
  const nextTheme = theme === 'dark' ? 'light' : 'dark'
  const Icon = theme === 'dark' ? Sun : Moon
  const activeTransitionTheme = transitionTheme ?? nextTheme
  const OverlayIcon = activeTransitionTheme === 'dark' ? Moon : Sun
  const expandingColor = activeTransitionTheme === 'dark' ? 'bg-zinc-950' : 'bg-white'
  const iconBubbleClass = activeTransitionTheme === 'dark'
    ? 'bg-zinc-950 text-white ring-white/15'
    : 'bg-white text-zinc-950 ring-zinc-950/10'

  function toggleTheme() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      setTheme(nextTheme)
      return
    }

    setTransitionTheme(nextTheme)
    setPhase('expand')
    window.setTimeout(() => {
      setTheme(nextTheme)
      setPhase('contract')
    }, 1000)
    window.setTimeout(() => {
      setPhase('icon-out')
    }, 1700)
    window.setTimeout(() => {
      setPhase(null)
      setTransitionTheme(null)
    }, 2000)
  }

  return (
    <>
      <Button variant="outline" size="icon" onClick={toggleTheme} aria-label={nextTheme === 'dark' ? 'Ubah ke mode gelap' : 'Ubah ke mode terang'} className={cn('dashboard-theme-toggle', phase && 'opacity-0')}>
        <Icon className="size-4" />
      </Button>
      {phase ? createPortal(
        <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden" aria-hidden="true">
          {phase !== 'icon-out' ? (
            <div
              className={
                phase === 'expand'
                  ? `theme-transition-disc theme-transition-disc-expand ${expandingColor}`
                  : `theme-transition-disc theme-transition-disc-contract ${expandingColor}`
              }
            />
          ) : null}
          <div className={cn('theme-transition-icon z-10 grid size-16 place-items-center rounded-full shadow-2xl ring-1', phase === 'icon-out' && 'theme-transition-icon-out', iconBubbleClass)}>
            <OverlayIcon className="size-8" />
          </div>
        </div>,
        document.body
      ) : null}
    </>
  )
}
