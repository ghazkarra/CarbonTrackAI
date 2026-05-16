import { AlertTriangle, CheckSquare, ClipboardList, Database, FileCheck2, Gauge, Leaf, LogOut, Users } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { clearAuth, getStoredUser, type UserRole } from '@/lib/auth'

type NavItem = {
  label: string
  href: string
  icon: typeof Gauge
  end?: boolean
  activePaths?: string[]
}

const operatorNavItems: NavItem[] = [
  { label: 'Overview', href: '/dashboard', icon: Gauge, end: true },
  { label: 'Machine Usage', href: '/dashboard/machine-usage', icon: ClipboardList },
  { label: 'Recommendations', href: '/dashboard/recommendations', icon: CheckSquare },
  { label: 'Alerts', href: '/dashboard/alerts', icon: AlertTriangle },
  { label: 'Reports', href: '/dashboard/reports', icon: FileCheck2 },
]

const superadminNavItems: NavItem[] = [
  { label: 'Users', href: '/dashboard/superadmin', icon: Users, end: true, activePaths: ['/dashboard/superadmin/users'] },
  { label: 'Datasets', href: '/dashboard/superadmin/datasets', icon: Database },
]

type AppSidebarProps = {
  className?: string
  role?: UserRole
}

export function AppSidebar({ className, role }: AppSidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getStoredUser()
  const effectiveRole = role ?? user?.role ?? 'operator'
  const navItems = effectiveRole === 'superadmin' ? superadminNavItems : operatorNavItems
  const initials = user?.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? 'CA'

  function handleLogout() {
    clearAuth()
    navigate('/login', { replace: true })
  }

  return (
    <aside className={cn('flex h-full flex-col border-r bg-sidebar px-4 py-5', className)}>
      <div className="flex items-center gap-3 px-2">
        <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm shadow-primary/30">
          <Leaf className="size-5" />
        </div>
        <div>
          <p className="font-semibold tracking-tight">CarbonTrackAI</p>
          <p className="text-xs text-muted-foreground">{effectiveRole === 'superadmin' ? 'Superadmin Console' : 'Admin Console'}</p>
        </div>
      </div>

      <nav className="mt-8 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || (!item.end && location.pathname.startsWith(`${item.href}/`)) || item.activePaths?.some((path) => location.pathname.startsWith(path))
          return (
          <Link
            key={item.label}
            to={item.href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              isActive && 'bg-primary/10 text-primary shadow-inner shadow-primary/5'
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
          )
        })}
      </nav>

      <div className="mt-auto space-y-3 border-t pt-4">
        <div className="flex items-center gap-3 rounded-md bg-sidebar-accent/60 p-3">
          <Avatar className="size-9 rounded-md">
            <AvatarFallback className="rounded-md bg-primary/10 text-xs text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user?.company_name ?? 'CarbonTrackAI'}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.name ?? (effectiveRole === 'superadmin' ? 'Superadmin' : 'Operator')}</p>
          </div>
        </div>
        <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
          <LogOut className="size-4" />
          Logout
        </Button>
      </div>
    </aside>
  )
}
