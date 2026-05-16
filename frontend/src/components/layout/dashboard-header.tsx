import { Bell, Menu, Search } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { AppSidebar } from './app-sidebar'

export function DashboardHeader() {
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
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Notifications">
            <Bell className="size-4" />
          </Button>
          <Avatar className="rounded-md after:rounded-md">
            <AvatarFallback className="rounded-md bg-primary/10 text-primary">CA</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
