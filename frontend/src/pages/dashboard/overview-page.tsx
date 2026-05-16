import { useEffect, useState } from 'react'
import { ActivityList } from '@/features/dashboard/components/activity-list'
import { EmissionsChart } from '@/features/dashboard/components/emissions-chart'
import { MetricCard } from '@/features/dashboard/components/metric-card'
import type { DashboardSummary } from '@/features/dashboard/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { apiRequest } from '@/lib/api'
import { getStoredToken } from '@/lib/auth'

const defaultSummary: DashboardSummary = {
  total_energy_kwh: '0',
  estimated_co2e_kg: '0',
  estimated_co2e_ton: '0',
  active_alerts_count: 0,
  completed_recommendations_this_month: 0,
  top_machines: [],
  recommendation_progress: { active: 0, completed: 0, dismissed: 0 },
}

function formatNumber(value: string | number, fractionDigits = 2) {
  return Number(value).toLocaleString('en-US', { maximumFractionDigits: fractionDigits })
}

export function OverviewPage() {
  const [summary, setSummary] = useState<DashboardSummary>(defaultSummary)
  const [periodMonth, setPeriodMonth] = useState('2025-02')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const token = getStoredToken()
    if (!token) return

    setIsLoading(true)
    setError(null)
    apiRequest<DashboardSummary>(`/api/dashboard/summary?period_month=${periodMonth}`, { token })
      .then(setSummary)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Failed to load dashboard'))
      .finally(() => setIsLoading(false))
  }, [periodMonth])

  const metrics = [
    {
      title: 'Total Energy',
      value: `${formatNumber(summary.total_energy_kwh)} kWh`,
      change: isLoading ? 'Loading latest records' : `Period ${periodMonth}`,
      tone: 'neutral' as const,
    },
    {
      title: 'Estimated CO2e',
      value: `${formatNumber(summary.estimated_co2e_kg)} kg`,
      change: `${formatNumber(summary.estimated_co2e_ton, 4)} ton CO2e`,
      tone: 'neutral' as const,
    },
    {
      title: 'Active Alerts',
      value: String(summary.active_alerts_count),
      change: 'Awaiting acknowledgement',
      tone: summary.active_alerts_count > 0 ? 'neutral' as const : 'good' as const,
    },
    {
      title: 'Completed Actions',
      value: String(summary.completed_recommendations_this_month),
      change: `${summary.recommendation_progress.active} active recommendations`,
      tone: 'good' as const,
    },
  ]

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
          <input
            className="h-9 rounded-md border bg-background px-3 text-sm"
            value={periodMonth}
            onChange={(event) => setPeriodMonth(event.target.value)}
            aria-label="Report month"
          />
          <Button variant="outline">Export CSV</Button>
          <Button>New report</Button>
        </div>
      </div>

      {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
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
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Top machines</CardTitle>
            <CardDescription>Highest energy consumption for selected period.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.top_machines.length ? summary.top_machines.map((machine) => (
              <div key={`${machine.machine_name}-${machine.machine_location}`} className="flex items-center justify-between gap-3 rounded-md border p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{machine.machine_name}</p>
                  <p className="text-xs text-muted-foreground">{machine.machine_location}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-primary">{formatNumber(machine.energy_kwh)} kWh</p>
                  <p className="text-xs text-muted-foreground">{formatNumber(machine.estimated_co2e_kg)} kg CO2e</p>
                </div>
              </div>
            )) : <p className="text-sm text-muted-foreground">No machine usage records yet.</p>}
          </CardContent>
        </Card>
      </section>

      <ActivityList />
    </>
  )
}
