import { AlertTriangle, BarChart3, Building2, CheckSquare, ClipboardList, FileCheck2, Gauge, Leaf, Settings } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: Gauge, end: true },
  { label: 'Machine Usage', href: '/dashboard/machine-usage', icon: ClipboardList },
  { label: 'Recommendations', href: '/dashboard/recommendations', icon: CheckSquare },
  { label: 'Alerts', href: '/dashboard/alerts', icon: AlertTriangle },
  { label: 'Emissions', href: '/dashboard/emissions', icon: BarChart3 },
  { label: 'Reports', href: '/dashboard/reports', icon: FileCheck2 },
  { label: 'Facilities', href: '/dashboard/facilities', icon: Building2 },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

type AppSidebarProps = {
  className?: string
}

export function AppSidebar({ className }: AppSidebarProps) {
  return (
    <aside className={cn('flex h-full flex-col border-r bg-sidebar px-4 py-5', className)}>
      <div className="flex items-center gap-3 px-2">
        <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm shadow-primary/30">
          <Leaf className="size-5" />
        </div>
        <div>
          <p className="font-semibold tracking-tight">CarbonTrackAI</p>
          <p className="text-xs text-muted-foreground">Admin Console</p>
        </div>
      </div>

      <nav className="mt-8 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.href}
            end={item.end}
            className={({ isActive }) => cn(
              'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              isActive && 'bg-primary/10 text-primary shadow-inner shadow-primary/5'
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto rounded-md border bg-card p-4 shadow-sm">
        <p className="text-sm font-medium">2030 net-zero path</p>
        <p className="mt-1 text-xs text-muted-foreground">Current trajectory is 7% ahead of reduction plan.</p>
        <div className="mt-3 h-2 rounded-md bg-muted">
          <div className="h-2 w-[68%] rounded-md bg-primary" />
        </div>
      </div>
    </aside>
  )
}
