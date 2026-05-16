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
        setError('Failed to load alerts')
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
      setError(ackError instanceof Error ? ackError.message : 'Failed to acknowledge alert')
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
        <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/15">Alerts</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">Operational risk alerts</h1>
        <p className="mt-2 text-sm text-muted-foreground">Automatic alerts for high energy usage, missing data, and formula mismatch.</p>
      </div>

      {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

      <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)} className="gap-3">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unacknowledged">Unacknowledged</TabsTrigger>
          <TabsTrigger value="acknowledged">Acknowledged</TabsTrigger>
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
                    <Badge variant="outline" className={severityClass[alert.severity]}>{alert.severity}</Badge>
                    <Badge variant="outline">{alert.status}</Badge>
                  </div>
                  <p className="truncate text-base font-semibold">{alert.alert_type}</p>
                  <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{alert.message}</p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <div className="grid gap-2 text-sm text-muted-foreground">
                  <p><span className="text-foreground">Triggered:</span> {alert.triggered_value ?? '-'}</p>
                  <p><span className="text-foreground">Threshold:</span> {alert.threshold_value ?? '-'}</p>
                  <p><span className="text-foreground">Action:</span> {alert.recommended_action ?? '-'}</p>
                </div>
                <LoadingButton variant="outline" disabled={alert.status === 'acknowledged'} isLoading={acknowledgingId === alert.id} onClick={() => setPendingAcknowledge(alert)}>
                  {alert.status === 'acknowledged' ? 'Acknowledged' : 'Acknowledge'}
                </LoadingButton>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <Card><CardContent className="py-8 text-sm text-muted-foreground">No alerts match this filter.</CardContent></Card>
      )}
      <ConfirmDialog
        open={Boolean(pendingAcknowledge)}
        title="Acknowledge this alert?"
        description="This will mark the alert as acknowledged and move it below active alerts."
        confirmLabel="Acknowledge"
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
