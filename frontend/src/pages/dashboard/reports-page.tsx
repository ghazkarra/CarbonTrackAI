import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { ReportFile } from '@/features/reports/types'
import { apiRequest } from '@/lib/api'
import { getStoredToken } from '@/lib/auth'

export function ReportsPage() {
  const token = getStoredToken()
  const [reports, setReports] = useState<ReportFile[]>([])
  const [reportType, setReportType] = useState<ReportFile['report_type']>('monthly')
  const [periodStart, setPeriodStart] = useState('2025-02-01')
  const [periodEnd, setPeriodEnd] = useState('2025-02-28')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function loadReports() {
    if (!token) return
    const data = await apiRequest<ReportFile[]>('/api/reports', { token })
    setReports(data)
  }

  useEffect(() => {
    loadReports().catch(() => setError('Failed to load reports'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function generateReport() {
    if (!token) return
    setError(null)
    setMessage(null)
    try {
      const report = await apiRequest<ReportFile>('/api/reports/generate', {
        method: 'POST',
        token,
        body: JSON.stringify({ report_type: reportType, period_start: periodStart, period_end: periodEnd }),
      })
      setMessage(`${report.report_type} PDF generated.`)
      await loadReports()
    } catch (reportError) {
      setError(reportError instanceof Error ? reportError.message : 'Failed to generate report')
    }
  }

  async function openReport(report: ReportFile, mode: 'preview' | 'download') {
    if (!token) return
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'}/api/reports/${report.id}/${mode}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) {
      setError('Failed to open report')
      return
    }
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/15">Reports</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">PDF reporting</h1>
        <p className="mt-2 text-sm text-muted-foreground">Generate daily, weekly, monthly, and annual PDF reports.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate report</CardTitle>
          <CardDescription>Monthly and annual reports include completed recommendations.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[160px_1fr_1fr_auto]">
          <select className="h-9 rounded-md border bg-background px-3 text-sm" value={reportType} onChange={(event) => setReportType(event.target.value as ReportFile['report_type'])}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
          </select>
          <Input value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} aria-label="Period start" />
          <Input value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} aria-label="Period end" />
          <Button onClick={generateReport}>Generate PDF</Button>
        </CardContent>
      </Card>

      {message ? <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">{message}</p> : null}
      {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Report history</CardTitle>
          <CardDescription>Generated PDF files available for preview or download.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {reports.map((report) => (
            <div key={report.id} className="flex flex-col gap-3 rounded-md border p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium capitalize">{report.report_type} report</p>
                <p className="text-sm text-muted-foreground">{report.period_start} to {report.period_end}</p>
                <p className="text-xs text-muted-foreground">Completed recommendations: {report.include_completed_recommendations ? 'included' : 'excluded'}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => openReport(report, 'preview')}>
                  Preview
                </Button>
                <Button onClick={() => openReport(report, 'download')}>
                  Download
                </Button>
              </div>
            </div>
          ))}
          {!reports.length ? <p className="text-sm text-muted-foreground">No reports generated yet.</p> : null}
        </CardContent>
      </Card>
    </div>
  )
}
