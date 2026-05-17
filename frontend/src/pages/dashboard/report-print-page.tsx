import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { LoadingButton } from '@/components/ui/loading-button'
import { Skeleton } from '@/components/ui/skeleton'
import { printReportPdf } from '@/features/reports/report-pdf'
import { ReportPreviewDocument } from '@/features/reports/report-preview-document'
import type { ReportPreviewResponse } from '@/features/reports/types'
import { apiRequest, getApiErrorMessage } from '@/lib/api'
import { getStoredToken } from '@/lib/auth'

export function ReportPrintPage() {
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
        .catch((previewError) => setError(getApiErrorMessage(previewError, 'Gagal memuat PDF laporan')))
        .finally(() => setIsLoading(false))
    }, 0)
    return () => window.clearTimeout(timer)
  }, [reportId, token])

  async function printReport() {
    await document.fonts.ready
    printReportPdf()
  }

  return (
    <main className="min-h-screen bg-slate-100 py-6 text-slate-900 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex w-[210mm] max-w-[calc(100vw-2rem)] items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl font-semibold">Preview PDF A4</h1>
          <p className="text-sm text-slate-500">Gunakan Save as PDF pada dialog print.</p>
        </div>
        <div className="flex gap-2">
          <LoadingButton variant="outline" onClick={() => navigate(`/dashboard/reports/${reportId}/preview`)}>Kembali</LoadingButton>
          <LoadingButton onClick={printReport} disabled={!preview}>Cetak / Simpan PDF</LoadingButton>
        </div>
      </div>

      {error ? <p className="mx-auto mb-4 w-[210mm] max-w-[calc(100vw-2rem)] rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive print:hidden">{error}</p> : null}

      {isLoading ? (
        <div className="mx-auto w-[210mm] max-w-[calc(100vw-2rem)] space-y-4 rounded-xl bg-white p-6 shadow-sm">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : preview ? (
        <div className="report-a4-page mx-auto bg-white shadow-xl print:shadow-none" data-report-print-root>
          <ReportPreviewDocument preview={preview} variant="print" />
        </div>
      ) : !error ? <p className="mx-auto w-[210mm] max-w-[calc(100vw-2rem)] text-sm text-slate-500">PDF laporan belum tersedia.</p> : null}
    </main>
  )
}
