import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Lightbulb } from 'lucide-react'
import { EmissionsChart } from '@/features/dashboard/components/emissions-chart'
import { MetricCard } from '@/features/dashboard/components/metric-card'
import type { DashboardSummary } from '@/features/dashboard/types'
import type { AlertsOverview, AlertWithRecommendations } from '@/features/alerts/types'
import { getSeverityVisual, severityOrder, translateStatus } from '@/features/alerts/components/alert-recommendation-accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

function getMachineProgressColor(value: number, maxValue: number) {
  const ratio = maxValue > 0 ? value / maxValue : 0
  if (ratio >= 0.75) return 'bg-red-500'
  if (ratio >= 0.35) return 'bg-yellow-400'
  return 'bg-emerald-500'
}

export function OverviewPage() {
  const [summary, setSummary] = useState<DashboardSummary>(defaultSummary)
  const [alertsOverview, setAlertsOverview] = useState<AlertsOverview | null>(null)
  const [periodMonth, setPeriodMonth] = useState('2025-02')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const token = getStoredToken()
      if (!token) return

      setIsLoading(true)
      setError(null)
      Promise.all([
        apiRequest<DashboardSummary>(`/api/dashboard/summary?period_month=${periodMonth}`, { token }),
        apiRequest<AlertsOverview>(`/api/alerts/overview?report_month=${periodMonth}`, { token }),
      ])
        .then(([summaryData, alertsData]) => {
          setSummary(summaryData)
          setAlertsOverview(alertsData)
        })
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

  const topAlert = useMemo(() => pickTopAlert(alertsOverview?.alerts ?? []), [alertsOverview])
  const topMachines = summary.top_machines.slice(0, 5)
  const maxTopMachineEnergy = Math.max(0, ...topMachines.map((machine) => Number(machine.energy_kwh)))
  const recommendationTotal = summary.recommendation_progress.active + summary.recommendation_progress.completed + summary.recommendation_progress.dismissed
  const completionRate = recommendationTotal ? Math.round((summary.recommendation_progress.completed / recommendationTotal) * 100) : 0

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

      <section className="grid gap-4 xl:grid-cols-4">
        <Card className="flex min-h-[420px] flex-col border-border/70 shadow-sm xl:col-span-3">
          <CardHeader>
            <CardTitle className="text-xl">Tren emisi</CardTitle>
            <CardDescription className="text-base">Output tCO2e bulanan dibandingkan target reduksi.</CardDescription>
          </CardHeader>
          <CardContent className="min-h-0 flex-1">
            <EmissionsChart />
          </CardContent>
        </Card>
        <TopAlertCard alert={topAlert} isLoading={isLoading} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Mesin teratas</CardTitle>
            <CardDescription className="text-base">Konsumsi energi tertinggi pada periode terpilih.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {isLoading ? Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="space-y-3 rounded-md border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="ml-auto h-4 w-20" />
                    <Skeleton className="ml-auto h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            )) : topMachines.length ? topMachines.map((machine, index) => {
              const energyKwh = Number(machine.energy_kwh)
              const progressRatio = maxTopMachineEnergy > 0 ? energyKwh / maxTopMachineEnergy : 0
              const progressWidth = progressRatio > 0 ? Math.max(5, Math.round(progressRatio * 100)) : 0

              return (
                <div key={`${machine.machine_name}-${machine.machine_location}`} className="space-y-3 rounded-md border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary/10 text-sm font-semibold text-primary">{index + 1}</span>
                      <div className="min-w-0">
                        <p className="truncate text-base font-medium">{machine.machine_name}</p>
                        <p className="text-sm text-muted-foreground">{machine.machine_location}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-base font-semibold text-primary">{formatNumber(machine.energy_kwh)} kWh</p>
                      <p className="text-sm text-muted-foreground">{formatNumber(machine.estimated_co2e_kg)} kg CO2e</p>
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full ${getMachineProgressColor(energyKwh, maxTopMachineEnergy)}`} style={{ width: `${progressWidth}%` }} />
                  </div>
                </div>
              )
            }) : <p className="text-base text-muted-foreground">Belum ada data pemakaian mesin.</p>}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Progress rekomendasi</CardTitle>
            <CardDescription className="text-base">Ringkasan tindak lanjut rekomendasi untuk periode ini.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <>
                <div className="rounded-md border bg-primary/5 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Completion rate</p>
                      <p className="mt-1 text-3xl font-semibold tracking-tight">{completionRate}%</p>
                    </div>
                    <CheckCircle2 className="size-8 text-primary" />
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${completionRate}%` }} />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <ProgressPill label="Aktif" value={summary.recommendation_progress.active} />
                  <ProgressPill label="Selesai" value={summary.recommendation_progress.completed} />
                  <ProgressPill label="Diabaikan" value={summary.recommendation_progress.dismissed} />
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/dashboard/alerts"><Lightbulb className="size-4" /> Kelola rekomendasi <ArrowRight className="size-4" /></Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  )
}

function pickTopAlert(alerts: AlertWithRecommendations[]) {
  return [...alerts].sort((first, second) => {
    return Number(first.status === 'acknowledged') - Number(second.status === 'acknowledged')
      || severityOrder[second.severity] - severityOrder[first.severity]
      || new Date(second.created_at).getTime() - new Date(first.created_at).getTime()
  })[0] ?? null
}

function TopAlertCard({ alert, isLoading }: { alert: AlertWithRecommendations | null; isLoading: boolean }) {
  if (isLoading) {
    return (
      <Card className="border-border/70 shadow-sm">
        <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!alert) {
    return (
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Alert teratas</CardTitle>
          <CardDescription className="text-base">Tidak ada alert pada periode ini.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="rounded-md bg-muted p-4 text-sm text-muted-foreground">Semua terlihat tenang untuk bulan terpilih.</p>
        </CardContent>
      </Card>
    )
  }

  const visual = getSeverityVisual(alert.severity)
  const SeverityIcon = visual.icon

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Alert teratas</CardTitle>
        <CardDescription className="text-base">Prioritas tertinggi untuk ditinjau.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <span className={`grid size-10 place-items-center rounded-md ring-1 ${visual.softClass}`}><SeverityIcon className="size-5" /></span>
          <div>
            <Badge variant="outline" className={visual.badgeClass}>{visual.label}</Badge>
            <p className="mt-1 text-xs text-muted-foreground">{translateStatus(alert.status)}</p>
          </div>
        </div>
        <div>
          <p className="font-semibold leading-snug">{alert.alert_type}</p>
          <p className="mt-2 line-clamp-4 text-sm text-muted-foreground">{alert.message}</p>
        </div>
        <div className="rounded-md bg-muted/55 p-3 text-sm">
          <p className="text-muted-foreground">Mesin</p>
          <p className="mt-1 font-medium">{alert.machine_usage?.machine_name ?? 'Rekomendasi umum'}</p>
        </div>
        <Button asChild className="w-full">
          <Link to="/dashboard/alerts">Lihat detail <ArrowRight className="size-4" /></Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function ProgressPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border p-3 text-center">
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
