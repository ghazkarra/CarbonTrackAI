import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const activities = [
  { name: 'Jakarta HQ', detail: 'Scope 2 report approved', status: 'Verified', initials: 'JH' },
  { name: 'Supplier batch 42', detail: 'Emission factor mapping needed', status: 'Review', initials: 'S4' },
  { name: 'Bandung Plant', detail: 'Energy usage down 9.1%', status: 'Improved', initials: 'BP' },
  { name: 'Audit team', detail: 'Quarterly evidence uploaded', status: 'New', initials: 'AT' },
] as const

export function ActivityList() {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>Latest admin events across reporting workflow.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.name} className="flex items-start gap-3">
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary/10 text-xs text-primary">{activity.initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-medium">{activity.name}</p>
                <Badge variant="outline" className="border-primary/25 text-primary">{activity.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{activity.detail}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
