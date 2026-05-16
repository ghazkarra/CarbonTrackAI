import { ActivityList } from '@/features/dashboard/components/activity-list'
import { EmissionsChart } from '@/features/dashboard/components/emissions-chart'
import { MetricCard } from '@/features/dashboard/components/metric-card'
import { dashboardMetrics } from '@/features/dashboard/data'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function OverviewPage() {
  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/15">Admin Dashboard</Badge>
            <Badge variant="outline" className="border-primary/30 text-primary">CarbonTrackAI</Badge>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Carbon operations overview</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Monitor emissions, reduction targets, reporting health, and organization activity from one control center.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Export CSV</Button>
          <Button>New report</Button>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Emission trend</CardTitle>
            <CardDescription>Monthly tCO2e output versus reduction target.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmissionsChart />
          </CardContent>
        </Card>
        <ActivityList />
      </section>
    </>
  )
}
