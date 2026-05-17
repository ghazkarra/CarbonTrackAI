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
    <div className="dashboard-shell min-h-svh bg-background text-foreground">
      <RouteProgress />
      <div className="flex min-h-svh">
        <AppSidebar
          role={role}
          isCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed((current) => !current)}
          className={cn(
            'sticky top-0 hidden h-svh shrink-0 overflow-hidden transition-[width] duration-300 ease-out lg:flex',
            isSidebarCollapsed ? 'w-20' : 'w-72'
          )}
        />
        <div className="min-w-0 flex-1">
          <DashboardHeader
            role={role}
          />
          <main className="dashboard-content flex w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
