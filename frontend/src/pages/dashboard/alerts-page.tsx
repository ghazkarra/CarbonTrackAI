import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

  async function loadAlerts() {
    if (!token) return
    const data = await apiRequest<Alert[]>('/api/alerts', { token })
    setAlerts(data)
  }

  useEffect(() => {
    loadAlerts().catch(() => setError('Failed to load alerts'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function acknowledge(alertId: number) {
    if (!token) return
    await apiRequest<Alert>(`/api/alerts/${alertId}/acknowledge`, { method: 'PATCH', token })
    await loadAlerts()
  }

  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/15">Alerts</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">Operational risk alerts</h1>
        <p className="mt-2 text-sm text-muted-foreground">Automatic alerts for high energy usage, missing data, and formula mismatch.</p>
      </div>

      {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-4">
        {alerts.map((alert) => (
          <Card key={alert.id} className={alert.status === 'acknowledged' ? 'bg-muted/40' : ''}>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>{alert.alert_type}</CardTitle>
                  <CardDescription className="mt-1">{alert.message}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className={severityClass[alert.severity]}>{alert.severity}</Badge>
                  <Badge variant="outline">{alert.status}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <div className="grid gap-2 text-sm text-muted-foreground">
                <p><span className="text-foreground">Triggered:</span> {alert.triggered_value ?? '-'}</p>
                <p><span className="text-foreground">Threshold:</span> {alert.threshold_value ?? '-'}</p>
                <p><span className="text-foreground">Action:</span> {alert.recommended_action ?? '-'}</p>
              </div>
              <Button variant="outline" disabled={alert.status === 'acknowledged'} onClick={() => acknowledge(alert.id)}>
                Acknowledge
              </Button>
            </CardContent>
          </Card>
        ))}
        {!alerts.length ? <Card><CardContent className="py-8 text-sm text-muted-foreground">No alerts yet. High energy or warning records will appear here.</CardContent></Card> : null}
      </div>
    </div>
  )
}
