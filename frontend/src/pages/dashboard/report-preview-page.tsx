import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { LoadingButton } from '@/components/ui/loading-button'
import { Skeleton } from '@/components/ui/skeleton'
import { ReportPreviewDocument } from '@/features/reports/report-preview-document'
import type { ReportPreviewResponse } from '@/features/reports/types'
import { apiRequest, getApiErrorMessage } from '@/lib/api'
import { getStoredToken } from '@/lib/auth'

export function ReportPreviewPage() {
  const token = getStoredToken()
  const navigate = useNavigate()
  const { reportId } = useParams()
  const [preview, setPreview] = useState<ReportPreviewResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!token || !reportId) return
    const timer = window.setTimeout(() => {
      setIsLoading(true)
      apiRequest<ReportPreviewResponse>(`/api/reports/${reportId}/preview-data`, { token })
        .then(setPreview)
        .catch((previewError) => setError(getApiErrorMessage(previewError, 'Gagal memuat pratinjau laporan')))
        .finally(() => setIsLoading(false))
    }, 0)
    return () => window.clearTimeout(timer)
  }, [reportId, token])

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-72" /><Skeleton className="h-72 w-full" /><Skeleton className="h-40 w-full" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/15">Pratinjau laporan</Badge>
          <h1 className="text-4xl font-semibold tracking-tight">Preview laporan lengkap</h1>
          <p className="mt-3 text-base text-muted-foreground">Review data mesin, alert, rekomendasi, dan potensi saving sebelum mengunduh PDF.</p>
        </div>
        <div className="flex gap-2">
          <LoadingButton variant="outline" onClick={() => navigate('/dashboard/reports')}>Riwayat</LoadingButton>
          <LoadingButton onClick={() => navigate(`/dashboard/reports/${reportId}/print`)} disabled={!preview}>Lihat PDF A4</LoadingButton>
        </div>
      </div>

      {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

      {preview ? (
        <div>
          <ReportPreviewDocument preview={preview} />
        </div>
      ) : !error ? <p className="text-sm text-muted-foreground">Pratinjau laporan belum tersedia.</p> : null}
    </div>
  )
}
