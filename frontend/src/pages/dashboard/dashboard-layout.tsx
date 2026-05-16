import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { RouteProgress } from '@/components/layout/route-progress'
import { getStoredUser } from '@/lib/auth'
import { cn } from '@/lib/utils'

export function DashboardLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const role = getStoredUser()?.role

  return (
    <div className="min-h-svh bg-background text-foreground">
      <RouteProgress />
      <div className="flex min-h-svh">
        <AppSidebar
          role={role}
          className={cn(
            'sticky top-0 hidden h-svh shrink-0 overflow-hidden transition-[width,opacity] duration-300 ease-out lg:flex',
            isSidebarCollapsed ? 'w-0 border-r-0 px-0 opacity-0' : 'w-72 opacity-100'
          )}
        />
        <div className="min-w-0 flex-1">
          <DashboardHeader
            role={role}
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={() => setIsSidebarCollapsed((current) => !current)}
          />
          <main className="flex w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
