import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingButton } from '@/components/ui/loading-button'
import { Skeleton } from '@/components/ui/skeleton'
import type { ReportFile } from '@/features/reports/types'
import { apiRequest, getApiErrorMessage } from '@/lib/api'
import { getStoredToken } from '@/lib/auth'

const reportTypeLabels: Record<ReportFile['report_type'], string> = {
  daily: 'Harian',
  weekly: 'Mingguan',
  monthly: 'Bulanan',
  annual: 'Tahunan',
}

export function ReportsPage() {
  const token = getStoredToken()
  const navigate = useNavigate()
  const [reports, setReports] = useState<ReportFile[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function loadReports() {
    if (!token) return
    setIsLoading(true)
    const data = await apiRequest<ReportFile[]>('/api/reports', { token })
    setReports(data)
    setIsLoading(false)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadReports().catch((loadError) => {
        setError(getApiErrorMessage(loadError, 'Gagal memuat laporan'))
        setIsLoading(false)
      })
    }, 0)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/15">Laporan</Badge>
          <h1 className="text-4xl font-semibold tracking-tight">Riwayat laporan</h1>
          <p className="mt-3 text-base text-muted-foreground">Lihat pratinjau laporan yang sudah dibuat atau unduh PDF final.</p>
        </div>
        <LoadingButton onClick={() => navigate('/dashboard/reports/create')}>Buat laporan</LoadingButton>
      </div>

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
              <LoadingButton onClick={() => navigate(`/dashboard/reports/${report.id}/preview`)}>
                Pratinjau & Unduh PDF
              </LoadingButton>
            </div>
          ))}
          {!isLoading && !reports.length ? <p className="text-base text-muted-foreground">Belum ada laporan yang dibuat.</p> : null}
        </CardContent>
      </Card>
    </div>
  )
}
