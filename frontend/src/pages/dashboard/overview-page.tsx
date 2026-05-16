import { useEffect, useState } from 'react'
import { ActivityList } from '@/features/dashboard/components/activity-list'
import { EmissionsChart } from '@/features/dashboard/components/emissions-chart'
import { MetricCard } from '@/features/dashboard/components/metric-card'
import type { DashboardSummary } from '@/features/dashboard/types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MonthPicker } from '@/components/ui/date-picker'
import { Skeleton } from '@/components/ui/skeleton'
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
  return Number(value).toLocaleString('id-ID', { maximumFractionDigits: fractionDigits })
}

export function OverviewPage() {
  const [summary, setSummary] = useState<DashboardSummary>(defaultSummary)
  const [periodMonth, setPeriodMonth] = useState('2025-02')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const token = getStoredToken()
      if (!token) return

      setIsLoading(true)
      setError(null)
      apiRequest<DashboardSummary>(`/api/dashboard/summary?period_month=${periodMonth}`, { token })
        .then(setSummary)
        .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Gagal memuat dashboard'))
        .finally(() => setIsLoading(false))
    }, 0)

    return () => window.clearTimeout(timer)
  }, [periodMonth])

  const metrics = [
    {
      title: 'Total energi',
      value: `${formatNumber(summary.total_energy_kwh)} kWh`,
      change: isLoading ? 'Memuat data terbaru' : `Periode ${periodMonth}`,
      tone: 'neutral' as const,
    },
    {
      title: 'Estimasi CO2e',
      value: `${formatNumber(summary.estimated_co2e_kg)} kg`,
      change: `${formatNumber(summary.estimated_co2e_ton, 4)} ton CO2e`,
      tone: 'neutral' as const,
    },
    {
      title: 'Peringatan aktif',
      value: String(summary.active_alerts_count),
      change: 'Menunggu tindak lanjut',
      tone: summary.active_alerts_count > 0 ? 'neutral' as const : 'good' as const,
    },
    {
      title: 'Aksi selesai',
      value: String(summary.completed_recommendations_this_month),
      change: `${summary.recommendation_progress.active} rekomendasi aktif`,
      tone: 'good' as const,
    },
  ]

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/15">Dashboard Admin</Badge>
            <Badge variant="outline" className="border-primary/30 text-primary">CarbonTrackAI</Badge>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight">Ringkasan operasional karbon</h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            Pantau emisi, target reduksi, kondisi pelaporan, dan aktivitas organisasi dari satu pusat kendali.
          </p>
        </div>
        <div className="flex gap-2">
          <MonthPicker value={periodMonth} onChange={setPeriodMonth} ariaLabel="Bulan laporan" className="w-40" />
        </div>
      </div>

      {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} isLoading={isLoading} />
        ))}
      </section>

      <section className="grid gap-4">
        <Card className="flex min-h-[420px] flex-col border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Tren emisi</CardTitle>
            <CardDescription className="text-base">Output tCO2e bulanan dibandingkan target reduksi.</CardDescription>
          </CardHeader>
          <CardContent className="min-h-0 flex-1">
            <EmissionsChart />
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Mesin teratas</CardTitle>
            <CardDescription className="text-base">Konsumsi energi tertinggi pada periode terpilih.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {isLoading ? Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between gap-3 rounded-md border p-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="ml-auto h-4 w-20" />
                  <Skeleton className="ml-auto h-3 w-24" />
                </div>
              </div>
            )) : summary.top_machines.length ? summary.top_machines.map((machine) => (
              <div key={`${machine.machine_name}-${machine.machine_location}`} className="flex items-center justify-between gap-3 rounded-md border p-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-medium">{machine.machine_name}</p>
                  <p className="text-sm text-muted-foreground">{machine.machine_location}</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-semibold text-primary">{formatNumber(machine.energy_kwh)} kWh</p>
                  <p className="text-sm text-muted-foreground">{formatNumber(machine.estimated_co2e_kg)} kg CO2e</p>
                </div>
              </div>
            )) : <p className="text-base text-muted-foreground md:col-span-2 xl:col-span-4">Belum ada data pemakaian mesin.</p>}
          </CardContent>
        </Card>
      </section>

      <ActivityList />
    </>
  )
}
