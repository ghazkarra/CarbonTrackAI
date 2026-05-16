import { FiColumns } from 'react-icons/fi'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import type { UserRole } from '@/lib/auth'
import { AppSidebar } from './app-sidebar'
import { LiveTimestamp } from './live-timestamp'

type DashboardHeaderProps = {
  role?: UserRole
}

export function DashboardHeader({ role }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="lg:hidden" aria-label="Buka navigasi">
              <FiColumns className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <AppSidebar role={role} />
          </SheetContent>
        </Sheet>
        <div className="ml-auto flex items-center gap-2">
          <LiveTimestamp />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
