import { useEffect, useMemo, useState } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { LoadingButton } from '@/components/ui/loading-button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Alert } from '@/features/alerts/types'
import { apiRequest } from '@/lib/api'
import { getStoredToken } from '@/lib/auth'

const severityClass: Record<Alert['severity'], string> = {
  info: 'border-blue-300 text-blue-700',
  warning: 'border-yellow-300 text-yellow-700',
  high: 'border-orange-300 text-orange-700',
  critical: 'border-red-300 text-red-700',
}

function translateSeverity(severity: Alert['severity']) {
  if (severity === 'info') return 'Info'
  if (severity === 'warning') return 'Peringatan'
  if (severity === 'high') return 'Tinggi'
  if (severity === 'critical') return 'Kritis'

  return severity
}

function translateAlertStatus(status: string) {
  return status === 'acknowledged' ? 'Ditindaklanjuti' : 'Belum ditindaklanjuti'
}

export function AlertsPage() {
  const token = getStoredToken()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [acknowledgingId, setAcknowledgingId] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'acknowledged' | 'unacknowledged'>('all')
  const [pendingAcknowledge, setPendingAcknowledge] = useState<Alert | null>(null)

  async function loadAlerts() {
    if (!token) return
    setIsLoading(true)
    const data = await apiRequest<Alert[]>('/api/alerts', { token })
    setAlerts(data)
    setIsLoading(false)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadAlerts().catch(() => {
        setError('Gagal memuat peringatan')
        setIsLoading(false)
      })
    }, 0)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function acknowledge(alertId: number) {
    if (!token) return
    setAcknowledgingId(alertId)
    setError(null)
    try {
      await apiRequest<Alert>(`/api/alerts/${alertId}/acknowledge`, { method: 'PATCH', token })
      await loadAlerts()
      setPendingAcknowledge(null)
    } catch (ackError) {
      setError(ackError instanceof Error ? ackError.message : 'Gagal menindaklanjuti peringatan')
    } finally {
      setAcknowledgingId(null)
    }
  }

  const filteredAlerts = useMemo(() => {
    return alerts
      .filter((alert) => {
        if (statusFilter === 'acknowledged') return alert.status === 'acknowledged'
        if (statusFilter === 'unacknowledged') return alert.status !== 'acknowledged'
        return true
      })
      .sort((first, second) => Number(first.status === 'acknowledged') - Number(second.status === 'acknowledged'))
  }, [alerts, statusFilter])

  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/15">Peringatan</Badge>
        <h1 className="text-4xl font-semibold tracking-tight">Peringatan risiko operasional</h1>
        <p className="mt-3 text-base text-muted-foreground">Peringatan otomatis untuk pemakaian energi tinggi, data kosong, dan ketidaksesuaian rumus.</p>
      </div>

      {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

      <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)} className="gap-3">
        <TabsList>
          <TabsTrigger value="all">Semua</TabsTrigger>
          <TabsTrigger value="unacknowledged">Belum ditindaklanjuti</TabsTrigger>
          <TabsTrigger value="acknowledged">Ditindaklanjuti</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}><CardContent className="space-y-3 py-4"><Skeleton className="h-5 w-32" /><Skeleton className="h-5 w-64" /><Skeleton className="h-4 w-full max-w-lg" /></CardContent></Card>
          ))}
        </div>
      ) : filteredAlerts.length ? (
        <Accordion type="single" collapsible className="gap-3">
          {filteredAlerts.map((alert) => (
            <AccordionItem key={alert.id} value={String(alert.id)} className={`rounded-xl border bg-card px-4 ${alert.status === 'acknowledged' ? 'bg-muted/40' : ''}`}>
              <AccordionTrigger className="hover:no-underline">
                <div className="min-w-0 pr-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={severityClass[alert.severity]}>{translateSeverity(alert.severity)}</Badge>
                    <Badge variant="outline">{translateAlertStatus(alert.status)}</Badge>
                  </div>
                  <p className="truncate text-lg font-semibold">{alert.alert_type}</p>
                  <p className="mt-1 line-clamp-1 text-base text-muted-foreground">{alert.message}</p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <div className="grid gap-2 text-base text-muted-foreground">
                  <p><span className="text-foreground">Nilai terpicu:</span> {alert.triggered_value ?? '-'}</p>
                  <p><span className="text-foreground">Ambang batas:</span> {alert.threshold_value ?? '-'}</p>
                  <p><span className="text-foreground">Aksi:</span> {alert.recommended_action ?? '-'}</p>
                </div>
                <LoadingButton variant="outline" disabled={alert.status === 'acknowledged'} isLoading={acknowledgingId === alert.id} onClick={() => setPendingAcknowledge(alert)}>
                  {alert.status === 'acknowledged' ? 'Ditindaklanjuti' : 'Tindak lanjuti'}
                </LoadingButton>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <Card><CardContent className="py-8 text-base text-muted-foreground">Tidak ada peringatan untuk filter ini.</CardContent></Card>
      )}
      <ConfirmDialog
        open={Boolean(pendingAcknowledge)}
        title="Tindak lanjuti peringatan ini?"
        description="Peringatan akan ditandai selesai ditindaklanjuti dan dipindahkan dari daftar aktif."
        confirmLabel="Tindak lanjuti"
        isLoading={pendingAcknowledge ? acknowledgingId === pendingAcknowledge.id : false}
        onOpenChange={(open) => {
          if (!open) setPendingAcknowledge(null)
        }}
        onConfirm={() => {
          if (pendingAcknowledge) acknowledge(pendingAcknowledge.id)
        }}
      />
    </div>
  )
}
