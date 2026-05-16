import { FiAlertTriangle, FiClipboard, FiColumns, FiDatabase, FiFileText, FiGrid, FiLogOut, FiUsers } from 'react-icons/fi'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BrandMark } from '@/components/layout/brand-mark'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { clearAuth, getStoredUser, type UserRole } from '@/lib/auth'

type NavItem = {
  label: string
  href: string
  icon: typeof FiGrid
  end?: boolean
  activePaths?: string[]
}

const operatorNavItems: NavItem[] = [
  { label: 'Ringkasan', href: '/dashboard', icon: FiGrid, end: true },
  { label: 'Pemakaian Mesin', href: '/dashboard/machine-usage', icon: FiClipboard },
  { label: 'Alerts & Recommendations', href: '/dashboard/alerts', icon: FiAlertTriangle, activePaths: ['/dashboard/recommendations'] },
  { label: 'Laporan', href: '/dashboard/reports', icon: FiFileText },
]

const superadminNavItems: NavItem[] = [
  { label: 'Pengguna', href: '/dashboard/superadmin', icon: FiUsers, end: true, activePaths: ['/dashboard/superadmin/users'] },
  { label: 'Dataset', href: '/dashboard/superadmin/datasets', icon: FiDatabase },
]

type AppSidebarProps = {
  className?: string
  role?: UserRole
  onToggleSidebar?: () => void
  isCollapsed?: boolean
}

export function AppSidebar({ className, role, onToggleSidebar, isCollapsed = false }: AppSidebarProps) {
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
    <aside className={cn('flex h-full flex-col border-r bg-sidebar py-5', isCollapsed ? 'px-3' : 'px-4', className)}>
      <div className={cn('flex items-center gap-3', isCollapsed ? 'justify-center px-0' : 'px-2')}>
        <BrandMark className={cn('shrink-0 shadow-sm shadow-primary/30', isCollapsed && 'hidden')} />
        <div className={cn('min-w-0 flex-1', isCollapsed && 'hidden')}>
          <p className="font-semibold tracking-tight">CarbonTrackAI</p>
          <p className="text-xs text-muted-foreground">{effectiveRole === 'superadmin' ? 'Konsol Superadmin' : 'Konsol Admin'}</p>
        </div>
        {onToggleSidebar ? (
          <button
            type="button"
            className="hidden size-10 shrink-0 place-items-center rounded-md text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:grid"
            onClick={onToggleSidebar}
            aria-label={isCollapsed ? 'Buka sidebar' : 'Tutup sidebar'}
          >
            <FiColumns className="size-5" />
          </button>
        ) : null}
      </div>

      <nav className="mt-8 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || (!item.end && location.pathname.startsWith(`${item.href}/`)) || item.activePaths?.some((path) => location.pathname.startsWith(path))
          return (
          <Link
            key={item.label}
            to={item.href}
            title={isCollapsed ? item.label : undefined}
            className={cn(
              'dashboard-nav-item flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              isCollapsed && 'justify-center px-0',
              isActive && 'bg-primary/10 text-primary shadow-inner shadow-primary/5'
            )}
          >
            <item.icon className={cn('shrink-0', isCollapsed ? 'size-5' : 'size-4')} />
            <span className={cn(isCollapsed && 'sr-only')}>{item.label}</span>
          </Link>
          )
        })}
      </nav>

      <div className="mt-auto border-t pt-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                'w-full rounded-md bg-sidebar-accent/60 p-3 text-left transition hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isCollapsed ? 'grid place-items-center' : 'flex items-center gap-3'
              )}
              aria-label="Open account menu"
            >
              <Avatar className="size-9 rounded-md">
                <AvatarFallback className="rounded-md bg-primary/10 text-xs text-primary">{initials}</AvatarFallback>
              </Avatar>
              <div className={cn('min-w-0 flex-1', isCollapsed && 'sr-only')}>
                <p className="truncate text-sm font-medium">{user?.company_name ?? 'CarbonTrackAI'}</p>
                <p className="truncate text-xs text-muted-foreground">{effectiveRole === 'superadmin' ? 'Superadmin' : 'Operator'}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="w-48">
            <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
              <FiLogOut className="size-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
