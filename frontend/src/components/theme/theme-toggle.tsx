import { Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useTheme } from './theme-provider'

type Phase = 'expand' | 'contract' | null

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [phase, setPhase] = useState<Phase>(null)
  const nextTheme = theme === 'dark' ? 'light' : 'dark'
  const Icon = theme === 'dark' ? Sun : Moon
  const OverlayIcon = nextTheme === 'dark' ? Moon : Sun
  const expandingColor = nextTheme === 'dark' ? 'bg-zinc-950' : 'bg-white'

  function toggleTheme() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      setTheme(nextTheme)
      return
    }

    setPhase('expand')
    window.setTimeout(() => {
      setTheme(nextTheme)
      setPhase('contract')
    }, 520)
    window.setTimeout(() => setPhase(null), 1120)
  }

  return (
    <>
      <Button variant="outline" size="icon" onClick={toggleTheme} aria-label={`Switch to ${nextTheme} mode`}>
        <Icon className="size-4" />
      </Button>
      {phase ? (
        <div className="pointer-events-none fixed inset-0 z-[100] grid place-items-center overflow-hidden">
          <div
            className={
              phase === 'expand'
                ? `absolute size-[220vmax] animate-[theme-expand_620ms_cubic-bezier(.2,.85,.2,1)_forwards] rounded-full ${expandingColor}`
                : 'absolute size-[180vmax] animate-[theme-contract_560ms_cubic-bezier(.2,.85,.2,1)_forwards] rounded-full bg-background'
            }
          />
          <div className="relative z-10 grid size-16 place-items-center rounded-full bg-background/95 text-foreground shadow-2xl ring-1 ring-border">
            <OverlayIcon className="size-8" />
          </div>
        </div>
      ) : null}
    </>
  )
}
