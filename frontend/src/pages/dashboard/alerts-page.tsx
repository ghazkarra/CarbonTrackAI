import { useEffect, useMemo, useState } from 'react'
import { Banknote, Cloud, Lightbulb, Search, Zap } from 'lucide-react'
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertRecommendationAccordion, getSeverityVisual, priorityOrder, severityOrder } from '@/features/alerts/components/alert-recommendation-accordion'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { MonthPicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { LoadingButton } from '@/components/ui/loading-button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Alert, AlertsOverview, AlertWithRecommendations, SavingsSummary } from '@/features/alerts/types'
import type { Recommendation } from '@/features/recommendations/types'
import { apiRequest, getApiErrorMessage } from '@/lib/api'
import { getStoredToken } from '@/lib/auth'

type RecommendationStatusFilter = 'all' | 'active' | 'completed' | 'not-completed' | 'dismissed'

const numberFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 })
const currencyFormatter = new Intl.NumberFormat('id-ID', { currency: 'IDR', maximumFractionDigits: 0, style: 'currency' })

const chartColors = {
  critical: '#dc2626',
  high: '#ea580c',
  warning: '#ca8a04',
  info: '#2563eb',
  active: '#16a34a',
  completed: '#0f766e',
  dismissed: '#64748b',
}

export function AlertsPage() {
  const token = getStoredToken()
  const [overview, setOverview] = useState<AlertsOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [acknowledgingId, setAcknowledgingId] = useState<number | null>(null)
  const [completingId, setCompletingId] = useState<number | null>(null)
  const [pendingAcknowledge, setPendingAcknowledge] = useState<AlertWithRecommendations | null>(null)
  const [pendingCompletion, setPendingCompletion] = useState<Recommendation | null>(null)
  const [completionNotes, setCompletionNotes] = useState<Record<number, string>>({})
  const [search, setSearch] = useState('')
  const [monthFilter, setMonthFilter] = useState('all')
  const [generateMonth, setGenerateMonth] = useState('2025-02')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [alertStatusFilter, setAlertStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [recommendationStatusFilter, setRecommendationStatusFilter] = useState<RecommendationStatusFilter>('all')

  async function loadOverview() {
    if (!token) return
    setIsLoading(true)
    const data = await apiRequest<AlertsOverview>('/api/alerts/overview', { token })
    setOverview(data)
    setIsLoading(false)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadOverview().catch((loadError) => {
        setError(getApiErrorMessage(loadError, 'Gagal memuat alerts dan recommendations'))
        setIsLoading(false)
      })
    }, 0)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function generateRecommendations() {
    if (!token) return
    setError(null)
    setMessage(null)
    setIsGenerating(true)
    try {
      const data = await apiRequest<Recommendation[]>('/api/recommendations/generate', {
        method: 'POST',
        token,
        body: JSON.stringify({ report_month: generateMonth }),
      })
      setMessage(`${data.length} rekomendasi alert berhasil disiapkan.`)
      await loadOverview()
    } catch (generateError) {
      setError(getApiErrorMessage(generateError, 'Gagal membuat rekomendasi'))
    } finally {
      setIsGenerating(false)
    }
  }

  async function acknowledge(alertId: number) {
    if (!token) return
    setAcknowledgingId(alertId)
    setError(null)
    try {
      await apiRequest<Alert>(`/api/alerts/${alertId}/acknowledge`, { method: 'PATCH', token })
      await loadOverview()
      setPendingAcknowledge(null)
    } catch (ackError) {
      setError(getApiErrorMessage(ackError, 'Gagal menindaklanjuti alert'))
    } finally {
      setAcknowledgingId(null)
    }
  }

  async function completeRecommendation(recommendation: Recommendation) {
    if (!token || recommendation.is_completed) return
    setCompletingId(recommendation.id)
    setError(null)
    try {
      await apiRequest<Recommendation>(`/api/recommendations/${recommendation.id}/complete`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ is_completed: true, completion_note: completionNotes[recommendation.id] ?? null }),
      })
      await loadOverview()
      setPendingCompletion(null)
    } catch (completeError) {
      setError(getApiErrorMessage(completeError, 'Gagal menyelesaikan rekomendasi'))
    } finally {
      setCompletingId(null)
    }
  }

  const months = useMemo(() => {
    const source = overview?.alerts ?? []
    return Array.from(new Set(source.map((alert) => alert.machine_usage?.report_month).filter(Boolean) as string[])).sort().reverse()
  }, [overview])

  function visibleRecommendations(alert: AlertWithRecommendations) {
    return alert.recommendations
      .filter((recommendation) => {
        const matchesPriority = priorityFilter === 'all' || recommendation.priority === priorityFilter
        const matchesStatus =
          recommendationStatusFilter === 'all' ||
          recommendation.status === recommendationStatusFilter ||
          (recommendationStatusFilter === 'not-completed' && !recommendation.is_completed)
        return matchesPriority && matchesStatus
      })
      .sort((first, second) => Number(first.is_completed) - Number(second.is_completed) || priorityOrder[second.priority] - priorityOrder[first.priority] || new Date(second.created_at).getTime() - new Date(first.created_at).getTime())
  }

  const filteredAlerts = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return (overview?.alerts ?? [])
      .filter((alert) => {
        const recommendations = visibleRecommendations(alert)
        const searchableValues = [
          alert.alert_type,
          alert.message,
          alert.recommended_action ?? '',
          alert.machine_usage?.machine_name ?? '',
          alert.machine_usage?.machine_location ?? '',
          ...alert.recommendations.map((recommendation) => `${recommendation.recommendation_title} ${recommendation.recommendation_description}`),
        ]
        const matchesSearch = !keyword || searchableValues.some((value) => value.toLowerCase().includes(keyword))
        const matchesMonth = monthFilter === 'all' || alert.machine_usage?.report_month === monthFilter
        const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter
        const matchesAlertStatus = alertStatusFilter === 'all' || alert.status === alertStatusFilter
        const matchesRecommendationFilter = priorityFilter === 'all' && recommendationStatusFilter === 'all' ? true : recommendations.length > 0
        return matchesSearch && matchesMonth && matchesSeverity && matchesAlertStatus && matchesRecommendationFilter
      })
      .sort((first, second) => {
        const firstCompleted = first.recommendations.length > 0 && first.recommendations.every((item) => item.is_completed)
        const secondCompleted = second.recommendations.length > 0 && second.recommendations.every((item) => item.is_completed)
        return Number(firstCompleted) - Number(secondCompleted)
          || Number(first.status === 'acknowledged') - Number(second.status === 'acknowledged')
          || severityOrder[second.severity] - severityOrder[first.severity]
          || new Date(second.created_at).getTime() - new Date(first.created_at).getTime()
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertStatusFilter, monthFilter, overview, priorityFilter, recommendationStatusFilter, search, severityFilter])

  const allRecommendations = useMemo(() => (overview?.alerts ?? []).flatMap((alert) => alert.recommendations), [overview])
  const severityChartData = useMemo(() => buildSeverityChartData(overview?.alerts ?? []), [overview])
  const recommendationStatusData = useMemo(() => buildRecommendationStatusData(allRecommendations), [allRecommendations])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/15">Alerts & Recommendations</Badge>
          <h1 className="text-4xl font-semibold tracking-tight">Alerts & Recommendations</h1>
          <p className="mt-3 text-base text-muted-foreground">Pantau alert operasional, rekomendasi per alert, dan estimasi penghematan dari seluruh rekomendasi.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <MonthPicker value={generateMonth} onChange={setGenerateMonth} className="w-40" ariaLabel="Bulan generate rekomendasi" />
          <LoadingButton onClick={generateRecommendations} isLoading={isGenerating}><Lightbulb className="size-4" /> Buat rekomendasi</LoadingButton>
        </div>
      </div>

      {message ? <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">{message}</p> : null}
      {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

      <SavingsCards summary={overview?.summary} isLoading={isLoading} />

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Komposisi alert per severity</CardTitle>
            <CardDescription className="text-base">Distribusi tingkat risiko dari alert operasional saat ini.</CardDescription>
          </CardHeader>
          <CardContent>
            <SeverityDonut data={severityChartData} isLoading={isLoading} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Status rekomendasi</CardTitle>
            <CardDescription className="text-base">Perbandingan rekomendasi aktif, selesai, dan diabaikan.</CardDescription>
          </CardHeader>
          <CardContent>
            <RecommendationStatusChart data={recommendationStatusData} isLoading={isLoading} />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="gap-4">
          <div>
            <CardTitle className="text-xl">Daftar alert</CardTitle>
            <CardDescription className="text-base">Prioritas tertinggi dan item yang belum selesai selalu berada di atas.</CardDescription>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1fr]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Cari alert, mesin, rekomendasi" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm" value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)}>
              <option value="all">Semua bulan</option>
              {months.map((month) => <option key={month} value={month}>{month}</option>)}
            </select>
            <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm" value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)}>
              <option value="all">Semua severity</option>
              <option value="critical">Kritis</option>
              <option value="high">Tinggi</option>
              <option value="warning">Peringatan</option>
              <option value="info">Info</option>
            </select>
            <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm" value={alertStatusFilter} onChange={(event) => setAlertStatusFilter(event.target.value)}>
              <option value="all">Semua alert</option>
              <option value="active">Aktif</option>
              <option value="acknowledged">Ditindaklanjuti</option>
            </select>
            <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
              <option value="all">Semua prioritas</option>
              <option value="critical">Kritis</option>
              <option value="high">Tinggi</option>
              <option value="medium">Sedang</option>
              <option value="low">Rendah</option>
            </select>
            <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm" value={recommendationStatusFilter} onChange={(event) => setRecommendationStatusFilter(event.target.value as RecommendationStatusFilter)}>
              <option value="all">Semua rekomendasi</option>
              <option value="not-completed">Belum selesai</option>
              <option value="active">Aktif</option>
              <option value="completed">Selesai</option>
              <option value="dismissed">Diabaikan</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-4">
              {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28 w-full" />)}
            </div>
          ) : (
            <AlertRecommendationAccordion
              alerts={filteredAlerts}
              getRecommendations={visibleRecommendations}
              completionNotes={completionNotes}
              completingId={completingId}
              acknowledgingId={acknowledgingId}
              onCompletionNoteChange={(recommendationId, note) => setCompletionNotes({ ...completionNotes, [recommendationId]: note })}
              onCompleteRecommendation={setPendingCompletion}
              onAcknowledgeAlert={setPendingAcknowledge}
            />
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(pendingAcknowledge)}
        title="Tindak lanjuti alert ini?"
        description="Alert akan ditandai sudah ditindaklanjuti dan dipindahkan ke urutan bawah."
        confirmLabel="Tindak lanjuti"
        isLoading={pendingAcknowledge ? acknowledgingId === pendingAcknowledge.id : false}
        onOpenChange={(open) => {
          if (!open) setPendingAcknowledge(null)
        }}
        onConfirm={() => {
          if (pendingAcknowledge) acknowledge(pendingAcknowledge.id)
        }}
      />
      <ConfirmDialog
        open={Boolean(pendingCompletion)}
        title="Tandai rekomendasi selesai?"
        description="Rekomendasi akan dipindahkan ke urutan bawah dan catatan saat ini akan disimpan."
        confirmLabel="Tandai selesai"
        isLoading={pendingCompletion ? completingId === pendingCompletion.id : false}
        onOpenChange={(open) => {
          if (!open) setPendingCompletion(null)
        }}
        onConfirm={() => {
          if (pendingCompletion) completeRecommendation(pendingCompletion)
        }}
      />
    </div>
  )
}

function SavingsCards({ summary, isLoading }: { summary: SavingsSummary | undefined; isLoading: boolean }) {
  const cards = [
    { title: 'Total potensi penghematan', value: currencyFormatter.format(Number(summary?.total_potential_saving_idr ?? 0)), note: `${summary?.tariff_code ?? 'I-4/TT'} · ${currencyFormatter.format(Number(summary?.tariff_per_kwh_idr ?? 0))}/kWh`, icon: Banknote },
    { title: 'Penghematan kWh', value: `${numberFormatter.format(Number(summary?.total_saving_kwh ?? 0))} kWh`, note: 'Akumulasi seluruh rekomendasi', icon: Zap },
    { title: 'Reduksi CO2', value: `${numberFormatter.format(Number(summary?.total_co2_reduction_kg ?? 0))} kg`, note: 'Dari potensi penghematan energi', icon: Cloud },
  ]
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="flex items-start gap-4 p-5">
            <div className="rounded-md bg-primary/10 p-2 text-primary"><card.icon className="size-5" /></div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">{card.title}</p>
              {isLoading ? <Skeleton className="mt-2 h-8 w-36" /> : <p className="mt-1 truncate text-2xl font-semibold tracking-tight">{card.value}</p>}
              <p className="mt-1 text-xs text-muted-foreground">{card.note}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function buildSeverityChartData(alerts: AlertWithRecommendations[]) {
  return (['critical', 'high', 'warning', 'info'] as const).map((severity) => {
    const visual = getSeverityVisual(severity)
    return {
      name: visual.label,
      severity,
      value: alerts.filter((alert) => alert.severity === severity).length,
      color: chartColors[severity],
    }
  })
}

function buildRecommendationStatusData(recommendations: Recommendation[]) {
  return (['active', 'completed', 'dismissed'] as const).map((status) => ({
    name: status === 'active' ? 'Aktif' : status === 'completed' ? 'Selesai' : 'Diabaikan',
    status,
    value: recommendations.filter((recommendation) => recommendation.status === status).length,
    color: chartColors[status],
  }))
}

function SeverityDonut({ data, isLoading }: { data: ReturnType<typeof buildSeverityChartData>; isLoading: boolean }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  if (isLoading) return <Skeleton className="h-[260px] w-full" />
  return (
    <div className="grid gap-4 md:grid-cols-[220px_1fr] md:items-center">
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--popover-foreground)' }} />
            <Pie data={data} dataKey="value" innerRadius={58} outerRadius={86} paddingAngle={4}>
              {data.map((entry) => <Cell key={entry.severity} fill={entry.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid gap-2">
        <p className="text-sm text-muted-foreground">Total alert</p>
        <p className="text-3xl font-semibold tracking-tight">{total}</p>
        {data.map((item) => (
          <div key={item.severity} className="flex items-center justify-between gap-3 rounded-md border p-2 text-sm">
            <span className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span>
            <span className="font-semibold">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RecommendationStatusChart({ data, isLoading }: { data: ReturnType<typeof buildRecommendationStatusData>; isLoading: boolean }) {
  if (isLoading) return <Skeleton className="h-[260px] w-full" />
  return (
    <div className="h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -22, right: 8, top: 8, bottom: 0 }}>
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
          <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
          <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--popover-foreground)' }} />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {data.map((entry) => <Cell key={entry.status} fill={entry.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
