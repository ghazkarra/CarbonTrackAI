import { Banknote, CheckCircle2, Cloud, Flame, Info, OctagonAlert, TriangleAlert, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { LoadingButton } from '@/components/ui/loading-button'
import type { AlertWithRecommendations } from '@/features/alerts/types'
import type { Recommendation } from '@/features/recommendations/types'
import { cn } from '@/lib/utils'

export const priorityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }
export const severityOrder: Record<string, number> = { critical: 4, high: 3, warning: 2, info: 1 }

const numberFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 })
const currencyFormatter = new Intl.NumberFormat('id-ID', { currency: 'IDR', maximumFractionDigits: 0, style: 'currency' })

type SeverityVisual = {
  icon: LucideIcon
  label: string
  badgeClass: string
  iconClass: string
  softClass: string
}

export function getSeverityVisual(severity: string): SeverityVisual {
  if (severity === 'critical') {
    return {
      icon: OctagonAlert,
      label: 'Kritis',
      badgeClass: 'border-red-300 text-red-700',
      iconClass: 'text-red-600',
      softClass: 'bg-red-50 text-red-700 ring-red-200',
    }
  }
  if (severity === 'high') {
    return {
      icon: Flame,
      label: 'Tinggi',
      badgeClass: 'border-orange-300 text-orange-700',
      iconClass: 'text-orange-600',
      softClass: 'bg-orange-50 text-orange-700 ring-orange-200',
    }
  }
  if (severity === 'warning') {
    return {
      icon: TriangleAlert,
      label: 'Peringatan',
      badgeClass: 'border-yellow-300 text-yellow-700',
      iconClass: 'text-yellow-700',
      softClass: 'bg-yellow-50 text-yellow-800 ring-yellow-200',
    }
  }
  return {
    icon: Info,
    label: 'Info',
    badgeClass: 'border-blue-300 text-blue-700',
    iconClass: 'text-blue-600',
    softClass: 'bg-blue-50 text-blue-700 ring-blue-200',
  }
}

export function translateStatus(status: string) {
  if (status === 'acknowledged') return 'Ditindaklanjuti'
  if (status === 'completed') return 'Selesai'
  if (status === 'dismissed') return 'Diabaikan'
  if (status === 'active') return 'Aktif'
  if (status === 'valid') return 'Valid'
  if (status === 'warning') return 'Peringatan'
  if (status === 'error') return 'Galat'
  return status
}

export function translatePriority(priority: string) {
  if (priority === 'critical') return 'Kritis'
  if (priority === 'high') return 'Tinggi'
  if (priority === 'medium') return 'Sedang'
  if (priority === 'low') return 'Rendah'
  return priority
}

export function translateCategory(category: string) {
  if (category === 'energy_efficiency') return 'Efisiensi energi'
  if (category === 'maintenance') return 'Perawatan'
  if (category === 'operation') return 'Operasi'
  if (category === 'equipment_upgrade') return 'Peningkatan peralatan'
  if (category === 'safety') return 'Keselamatan'
  if (category === 'reporting') return 'Pelaporan'
  return category
}

export function translateAlertType(alertType: string) {
  if (alertType === 'High Energy Usage') return 'Pemakaian Energi Tinggi'
  if (alertType === 'Missing Data') return 'Data Pemakaian Tidak Lengkap'
  if (alertType === 'Power Mismatch') return 'Ketidaksesuaian Daya/Energi'
  return alertType
}

type AlertRecommendationAccordionProps = {
  alerts: AlertWithRecommendations[]
  getRecommendations: (alert: AlertWithRecommendations) => Recommendation[]
  completionNotes?: Record<number, string>
  completingId?: number | null
  acknowledgingId?: number | null
  onCompletionNoteChange?: (recommendationId: number, note: string) => void
  onCompleteRecommendation?: (recommendation: Recommendation) => void
  onAcknowledgeAlert?: (alert: AlertWithRecommendations) => void
  emptyMessage?: string
}

export function AlertRecommendationAccordion({
  alerts,
  getRecommendations,
  completionNotes = {},
  completingId = null,
  acknowledgingId = null,
  onCompletionNoteChange,
  onCompleteRecommendation,
  onAcknowledgeAlert,
  emptyMessage = 'Tidak ada peringatan untuk filter ini.',
}: AlertRecommendationAccordionProps) {
  if (!alerts.length) {
    return <p className="rounded-md bg-muted p-6 text-sm text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <Accordion type="single" collapsible className="gap-3">
      {alerts.map((alert) => {
        const recommendations = getRecommendations(alert)
        const allCompleted = alert.recommendations.length > 0 && alert.recommendations.every((item) => item.is_completed)
        const visual = getSeverityVisual(alert.severity)
        const SeverityIcon = visual.icon

        return (
          <AccordionItem key={alert.id} value={String(alert.id)} className={cn('rounded-xl border bg-card px-4', (alert.status === 'acknowledged' || allCompleted) && 'bg-muted/40')}>
            <AccordionTrigger className="hover:no-underline">
              <div className="grid min-w-0 flex-1 gap-3 text-left lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={cn('grid size-8 place-items-center rounded-md ring-1', visual.softClass)}>
                      <SeverityIcon className="size-4" />
                    </span>
                    <Badge variant="outline" className={visual.badgeClass}>{visual.label}</Badge>
                    <Badge variant="outline">{translateStatus(alert.status)}</Badge>
                    {allCompleted ? <Badge className="bg-primary/10 text-primary hover:bg-primary/15"><CheckCircle2 className="size-3" /> Selesai</Badge> : null}
                  </div>
                  <p className="truncate text-lg font-semibold">{translateAlertType(alert.alert_type)}</p>
                  <p className="mt-1 line-clamp-1 text-base text-muted-foreground">{alert.message}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span>{alert.machine_usage?.machine_name ?? 'Rekomendasi umum'}</span>
                  <span>{recommendations.length} rekomendasi</span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div className="grid gap-3 rounded-md bg-muted/45 p-4 text-sm md:grid-cols-3">
                <InfoBlock label="Nilai terpicu" value={alert.triggered_value ?? '-'} />
                <InfoBlock label="Ambang batas" value={alert.threshold_value ?? '-'} />
                <InfoBlock label="Aksi awal" value={alert.recommended_action ?? '-'} />
              </div>

              <div className="grid gap-3">
                {recommendations.length ? recommendations.map((recommendation) => (
                  <RecommendationCard
                    key={recommendation.id}
                    recommendation={recommendation}
                    note={completionNotes[recommendation.id] ?? recommendation.completion_note ?? ''}
                    completingId={completingId}
                    onNoteChange={onCompletionNoteChange}
                    onComplete={onCompleteRecommendation}
                  />
                )) : <p className="rounded-md bg-muted p-4 text-sm text-muted-foreground">Belum ada rekomendasi yang cocok untuk alert ini.</p>}
              </div>

              {onAcknowledgeAlert ? (
                <div className="flex justify-end">
                  <LoadingButton variant="outline" disabled={alert.status === 'acknowledged'} isLoading={acknowledgingId === alert.id} onClick={() => onAcknowledgeAlert(alert)}>
                    {alert.status === 'acknowledged' ? 'Ditindaklanjuti' : 'Tindak lanjuti peringatan'}
                  </LoadingButton>
                </div>
              ) : null}
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}

type RecommendationCardProps = {
  recommendation: Recommendation
  note?: string
  completingId?: number | null
  onNoteChange?: (recommendationId: number, note: string) => void
  onComplete?: (recommendation: Recommendation) => void
}

function RecommendationCard({ recommendation, note = '', completingId = null, onNoteChange, onComplete }: RecommendationCardProps) {
  return (
    <div className={cn('rounded-lg border p-4', recommendation.is_completed ? 'bg-muted/45' : 'bg-background')}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline">{translatePriority(recommendation.priority)}</Badge>
            <Badge className="bg-primary/10 text-primary hover:bg-primary/15">{translateStatus(recommendation.status)}</Badge>
            <Badge variant="outline">{translateCategory(recommendation.category)}</Badge>
          </div>
          <p className="text-base font-semibold">{recommendation.recommendation_title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{recommendation.recommendation_description}</p>
          <RecommendationImpactChips recommendation={recommendation} className="mt-3" />
        </div>
        {onComplete ? (
          <div className="grid min-w-64 gap-2">
            <Input
              placeholder="Catatan penyelesaian"
              value={note}
              disabled={recommendation.is_completed || completingId === recommendation.id}
              onChange={(event) => onNoteChange?.(recommendation.id, event.target.value)}
            />
            <LoadingButton
              variant={recommendation.is_completed ? 'outline' : 'default'}
              disabled={recommendation.is_completed}
              isLoading={completingId === recommendation.id}
              onClick={() => onComplete(recommendation)}
            >
              {recommendation.is_completed ? 'Selesai' : 'Tandai selesai'}
            </LoadingButton>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function RecommendationImpactChips({ recommendation, className }: { recommendation: Recommendation; className?: string }) {
  const items = [
    { label: 'Penghematan energi', value: `${numberFormatter.format(Number(recommendation.estimated_saving_kwh))} kWh`, icon: Zap },
    { label: 'Potensi hemat biaya', value: currencyFormatter.format(Number(recommendation.estimated_saving_idr)), icon: Banknote },
    { label: 'Reduksi CO2', value: `${numberFormatter.format(Number(recommendation.estimated_co2_reduction_kg))} kg CO2`, icon: Cloud },
  ]

  return (
    <div className={cn('grid gap-2 sm:grid-cols-3', className)}>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2 rounded-md border bg-muted/25 px-3 py-2 text-xs">
          <span className="grid size-7 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
            <item.icon className="size-3.5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-muted-foreground">{item.label}</span>
            <span className="block truncate font-semibold text-foreground">{item.value}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium text-foreground">{value}</p>
    </div>
  )
}
