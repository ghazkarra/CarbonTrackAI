import { Bell, LogOut, Menu, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { clearAuth, getStoredUser } from '@/lib/auth'
import { AppSidebar } from './app-sidebar'

export function DashboardHeader() {
  const navigate = useNavigate()
  const user = getStoredUser()
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
    <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open navigation">
              <Menu className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <AppSidebar />
          </SheetContent>
        </Sheet>
        <div className="relative hidden w-full max-w-md sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search reports, facilities, or suppliers" />
        </div>
        <div className="ml-auto hidden min-w-0 flex-col text-right sm:flex">
          <span className="truncate text-sm font-medium">{user?.company_name ?? 'CarbonCore AI'}</span>
          <span className="truncate text-xs text-muted-foreground">{user?.name ?? 'Operator'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Notifications">
            <Bell className="size-4" />
          </Button>
          <Avatar className="rounded-md after:rounded-md">
            <AvatarFallback className="rounded-md bg-primary/10 text-primary">{initials}</AvatarFallback>
          </Avatar>
          <Button variant="outline" size="icon" aria-label="Logout" onClick={handleLogout}>
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
