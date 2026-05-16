import { reportQueue } from '@/features/dashboard/data'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function ReportsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports</CardTitle>
        <CardDescription>Submission queue and compliance exports.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {reportQueue.map((item) => (
          <div key={item} className="flex items-center justify-between rounded-md border p-4">
            <p className="text-sm text-muted-foreground">{item}</p>
            <Badge variant="outline" className="border-primary/25 text-primary">Open</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
