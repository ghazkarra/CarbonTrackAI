import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { LoadingButton } from '@/components/ui/loading-button'
import { Skeleton } from '@/components/ui/skeleton'
import type { ReportFile } from '@/features/reports/types'
import { apiRequest } from '@/lib/api'
import { getStoredToken } from '@/lib/auth'
import { getCurrentReportMonth } from '@/lib/utils'

const reportTypeLabels: Record<ReportFile['report_type'], string> = {
  daily: 'Harian',
  weekly: 'Mingguan',
  monthly: 'Bulanan',
  annual: 'Tahunan',
}

function getCurrentMonthRange() {
  const [year, month] = getCurrentReportMonth().split('-').map(Number)
  const lastDay = new Date(year, month, 0).getDate()
  return {
    start: `${year}-${String(month).padStart(2, '0')}-01`,
    end: `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
  }
}

export function ReportsPage() {
  const token = getStoredToken()
  const currentMonthRange = getCurrentMonthRange()
  const [reports, setReports] = useState<ReportFile[]>([])
  const [reportType, setReportType] = useState<ReportFile['report_type']>('monthly')
  const [periodStart, setPeriodStart] = useState(currentMonthRange.start)
  const [periodEnd, setPeriodEnd] = useState(currentMonthRange.end)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [openingReport, setOpeningReport] = useState<{ id: number; mode: 'preview' | 'download' } | null>(null)

  async function loadReports() {
    if (!token) return
    setIsLoading(true)
    const data = await apiRequest<ReportFile[]>('/api/reports', { token })
    setReports(data)
    setIsLoading(false)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadReports().catch(() => {
        setError('Gagal memuat laporan')
        setIsLoading(false)
      })
    }, 0)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function generateReport() {
    if (!token) return
    setError(null)
    setMessage(null)
    setIsGenerating(true)
    try {
      const report = await apiRequest<ReportFile>('/api/reports/generate', {
        method: 'POST',
        token,
        body: JSON.stringify({ report_type: reportType, period_start: periodStart, period_end: periodEnd }),
      })
      setMessage(`PDF laporan ${reportTypeLabels[report.report_type].toLowerCase()} berhasil dibuat.`)
      await loadReports()
    } catch (reportError) {
      setError(reportError instanceof Error ? reportError.message : 'Gagal membuat laporan')
    } finally {
      setIsGenerating(false)
    }
  }

  async function openReport(report: ReportFile, mode: 'preview' | 'download') {
    if (!token) return
    setOpeningReport({ id: report.id, mode })
    setError(null)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'}/api/reports/${report.id}/${mode}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        setError('Gagal membuka laporan')
        return
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } finally {
      setOpeningReport(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/15">Laporan</Badge>
        <h1 className="text-4xl font-semibold tracking-tight">Pelaporan PDF</h1>
        <p className="mt-3 text-base text-muted-foreground">Buat laporan PDF harian, mingguan, bulanan, dan tahunan.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Buat laporan</CardTitle>
          <CardDescription className="text-base">Laporan bulanan dan tahunan menyertakan rekomendasi yang sudah selesai.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[160px_1fr_1fr_auto]">
          <select className="h-11 cursor-pointer rounded-lg border border-input bg-background px-3 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" value={reportType} onChange={(event) => setReportType(event.target.value as ReportFile['report_type'])}>
            <option value="daily">Harian</option>
            <option value="weekly">Mingguan</option>
            <option value="monthly">Bulanan</option>
            <option value="annual">Tahunan</option>
          </select>
          <DatePicker value={periodStart} onChange={setPeriodStart} ariaLabel="Awal periode" className="w-full" />
          <DatePicker value={periodEnd} onChange={setPeriodEnd} ariaLabel="Akhir periode" className="w-full" />
          <LoadingButton onClick={generateReport} isLoading={isGenerating}>Buat PDF</LoadingButton>
        </CardContent>
      </Card>

      {message ? <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">{message}</p> : null}
      {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Riwayat laporan</CardTitle>
          <CardDescription className="text-base">File PDF yang sudah dibuat dapat dipratinjau atau diunduh.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-3 rounded-md border p-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-56" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          )) : reports.map((report) => (
            <div key={report.id} className="flex flex-col gap-3 rounded-md border p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-lg font-medium">Laporan {reportTypeLabels[report.report_type].toLowerCase()}</p>
                <p className="text-base text-muted-foreground">{report.period_start} sampai {report.period_end}</p>
                <p className="text-sm text-muted-foreground">Rekomendasi selesai: {report.include_completed_recommendations ? 'disertakan' : 'tidak disertakan'}</p>
              </div>
              <div className="flex gap-2">
                <LoadingButton variant="outline" isLoading={openingReport?.id === report.id && openingReport.mode === 'preview'} onClick={() => openReport(report, 'preview')}>
                  Pratinjau
                </LoadingButton>
                <LoadingButton isLoading={openingReport?.id === report.id && openingReport.mode === 'download'} onClick={() => openReport(report, 'download')}>
                  Unduh
                </LoadingButton>
              </div>
            </div>
          ))}
          {!isLoading && !reports.length ? <p className="text-base text-muted-foreground">Belum ada laporan yang dibuat.</p> : null}
        </CardContent>
      </Card>
    </div>
  )
}
