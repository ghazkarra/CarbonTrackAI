import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { LoadingButton } from '@/components/ui/loading-button'
import type { ReportFile, ReportType } from '@/features/reports/types'
import { apiRequest, getApiErrorMessage } from '@/lib/api'
import { getStoredToken } from '@/lib/auth'

const reportTypeLabels: Record<ReportType, string> = {
  daily: 'Harian',
  weekly: 'Mingguan',
  monthly: 'Bulanan',
  annual: 'Tahunan',
}

export function ReportCreatePage() {
  const token = getStoredToken()
  const navigate = useNavigate()
  const [reportType, setReportType] = useState<ReportType>('monthly')
  const [periodStart, setPeriodStart] = useState('2025-02-01')
  const [periodEnd, setPeriodEnd] = useState('2025-02-28')
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  async function generateReport() {
    if (!token) return
    setError(null)
    setIsGenerating(true)
    try {
      const report = await apiRequest<ReportFile>('/api/reports/generate', {
        method: 'POST',
        token,
        body: JSON.stringify({ report_type: reportType, period_start: periodStart, period_end: periodEnd }),
      })
      navigate(`/dashboard/reports/${report.id}/preview`)
    } catch (reportError) {
      setError(getApiErrorMessage(reportError, 'Gagal membuat laporan'))
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/15">Buat laporan</Badge>
        <h1 className="text-4xl font-semibold tracking-tight">Buat laporan baru</h1>
        <p className="mt-3 text-base text-muted-foreground">Pilih jenis dan periode laporan, lalu lihat pratinjau lengkap sebelum mengunduh PDF.</p>
      </div>

      {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Form laporan</CardTitle>
          <CardDescription className="text-base">Laporan bulanan dan tahunan menyertakan rekomendasi yang sudah selesai.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[180px_1fr_1fr]">
            <select className="h-11 cursor-pointer rounded-lg border border-input bg-background px-3 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50" value={reportType} onChange={(event) => setReportType(event.target.value as ReportType)}>
              <option value="daily">Harian</option>
              <option value="weekly">Mingguan</option>
              <option value="monthly">Bulanan</option>
              <option value="annual">Tahunan</option>
            </select>
            <DatePicker value={periodStart} onChange={setPeriodStart} ariaLabel="Awal periode" className="w-full" />
            <DatePicker value={periodEnd} onChange={setPeriodEnd} ariaLabel="Akhir periode" className="w-full" />
          </div>
          <div className="flex flex-col gap-3 rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <span>Laporan {reportTypeLabels[reportType].toLowerCase()} akan dibuat untuk periode {periodStart} sampai {periodEnd}.</span>
            <div className="flex gap-2">
              <LoadingButton variant="outline" onClick={() => navigate('/dashboard/reports')}>Batal</LoadingButton>
              <LoadingButton onClick={generateReport} isLoading={isGenerating}>Buat & pratinjau</LoadingButton>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
