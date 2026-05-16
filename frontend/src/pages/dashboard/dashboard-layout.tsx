import { Outlet } from 'react-router-dom'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { DashboardHeader } from '@/components/layout/dashboard-header'

export function DashboardLayout() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="flex min-h-svh">
        <AppSidebar className="sticky top-0 hidden h-svh w-72 shrink-0 lg:flex" />
        <div className="min-w-0 flex-1">
          <DashboardHeader />
          <main className="flex w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
