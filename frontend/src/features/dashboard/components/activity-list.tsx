import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const activities = [
  { name: 'Kantor Jakarta', detail: 'Laporan Scope 2 disetujui', status: 'Terverifikasi', initials: 'KJ' },
  { name: 'Batch pemasok 42', detail: 'Pemetaan faktor emisi perlu ditinjau', status: 'Tinjau', initials: 'BP' },
  { name: 'Pabrik Bandung', detail: 'Pemakaian energi turun 9,1%', status: 'Membaik', initials: 'PB' },
  { name: 'Tim audit', detail: 'Bukti kuartalan sudah diunggah', status: 'Baru', initials: 'TA' },
] as const

export function ActivityList() {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle>Aktivitas terbaru</CardTitle>
        <CardDescription>Peristiwa admin terbaru di alur pelaporan.</CardDescription>
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
