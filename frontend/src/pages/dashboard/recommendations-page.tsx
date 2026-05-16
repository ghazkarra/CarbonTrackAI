import { useEffect, useMemo, useState } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { MonthPicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { LoadingButton } from '@/components/ui/loading-button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Recommendation } from '@/features/recommendations/types'
import { apiRequest } from '@/lib/api'
import { getStoredToken } from '@/lib/auth'

function translateRecommendationStatus(status: string) {
  const normalized = status.toLowerCase()
  if (normalized === 'completed') return 'Selesai'
  if (normalized === 'active') return 'Aktif'
  if (normalized === 'dismissed') return 'Diabaikan'

  return status
}

function translatePriority(priority: string) {
  const normalized = priority.toLowerCase()
  if (normalized === 'high') return 'Tinggi'
  if (normalized === 'medium') return 'Sedang'
  if (normalized === 'low') return 'Rendah'

  return priority
}

export function RecommendationsPage() {
  const token = getStoredToken()
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [reportMonth, setReportMonth] = useState('2025-02')
  const [completionNotes, setCompletionNotes] = useState<Record<number, string>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [completingId, setCompletingId] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'not-completed'>('all')
  const [pendingCompletion, setPendingCompletion] = useState<Recommendation | null>(null)

  async function loadRecommendations() {
    if (!token) return
    setIsLoading(true)
    const data = await apiRequest<Recommendation[]>('/api/recommendations', { token })
    setRecommendations(data)
    setIsLoading(false)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadRecommendations().catch(() => {
        setError('Gagal memuat rekomendasi')
        setIsLoading(false)
      })
    }, 0)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function generateRecommendations() {
    if (!token) return
    setError(null)
    setMessage(null)
    setIsGenerating(true)
    try {
      const data = await apiRequest<Recommendation[]>('/api/recommendations/generate', {
        method: 'POST',
        token,
        body: JSON.stringify({ report_month: reportMonth }),
      })
      setMessage(`${data.length} rekomendasi berhasil dibuat.`)
      await loadRecommendations()
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : 'Gagal membuat rekomendasi')
    } finally {
      setIsGenerating(false)
    }
  }

  async function completeRecommendation(recommendation: Recommendation) {
    if (!token || recommendation.is_completed) return
    setCompletingId(recommendation.id)
    setError(null)
    try {
      await apiRequest<Recommendation>(`/api/recommendations/${recommendation.id}/complete`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ is_completed: true, completion_note: completionNotes[recommendation.id] ?? null }),
      })
      await loadRecommendations()
      setPendingCompletion(null)
    } catch (completeError) {
      setError(completeError instanceof Error ? completeError.message : 'Gagal menyelesaikan rekomendasi')
    } finally {
      setCompletingId(null)
    }
  }

  const filteredRecommendations = useMemo(() => {
    return recommendations
      .filter((recommendation) => {
        if (statusFilter === 'completed') return recommendation.is_completed
        if (statusFilter === 'not-completed') return !recommendation.is_completed
        return true
      })
      .sort((first, second) => Number(first.is_completed) - Number(second.is_completed))
  }, [recommendations, statusFilter])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/15">Rekomendasi</Badge>
          <h1 className="text-4xl font-semibold tracking-tight">Aksi pengurangan emisi</h1>
          <p className="mt-3 text-base text-muted-foreground">Buat rekomendasi berbasis aturan dan tandai aksi yang sudah selesai.</p>
        </div>
        <div className="flex gap-2">
          <MonthPicker value={reportMonth} onChange={setReportMonth} className="w-40" ariaLabel="Bulan laporan" />
          <LoadingButton onClick={generateRecommendations} isLoading={isGenerating}>Buat</LoadingButton>
        </div>
      </div>

      {message ? <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">{message}</p> : null}
      {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

      <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)} className="gap-3">
        <TabsList>
          <TabsTrigger value="all">Semua</TabsTrigger>
          <TabsTrigger value="not-completed">Belum selesai</TabsTrigger>
          <TabsTrigger value="completed">Selesai</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}><CardContent className="space-y-3 py-4"><Skeleton className="h-5 w-24" /><Skeleton className="h-5 w-72" /><Skeleton className="h-4 w-44" /></CardContent></Card>
          ))}
        </div>
      ) : filteredRecommendations.length ? (
        <Accordion type="single" collapsible className="gap-3">
          {filteredRecommendations.map((recommendation) => (
            <AccordionItem key={recommendation.id} value={String(recommendation.id)} className={`rounded-xl border bg-card px-4 ${recommendation.is_completed ? 'bg-muted/40' : ''}`}>
              <AccordionTrigger className="hover:no-underline">
                <div className="min-w-0 pr-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{translatePriority(recommendation.priority)}</Badge>
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/15">{translateRecommendationStatus(recommendation.status)}</Badge>
                  </div>
                  <p className="truncate text-lg font-semibold">{recommendation.recommendation_title}</p>
                  <p className="mt-1 truncate text-base text-muted-foreground">{recommendation.related_machine_name ?? 'Rekomendasi umum'}</p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <p className="text-base text-muted-foreground">{recommendation.recommendation_description}</p>
                <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                  <Input
                    placeholder="Catatan penyelesaian opsional"
                    value={completionNotes[recommendation.id] ?? recommendation.completion_note ?? ''}
                    disabled={recommendation.is_completed || completingId === recommendation.id}
                    onChange={(event) => setCompletionNotes({ ...completionNotes, [recommendation.id]: event.target.value })}
                  />
                  <LoadingButton
                    variant={recommendation.is_completed ? 'outline' : 'default'}
                    disabled={recommendation.is_completed}
                    isLoading={completingId === recommendation.id}
                    onClick={() => setPendingCompletion(recommendation)}
                  >
                    {recommendation.is_completed ? 'Selesai' : 'Tandai selesai'}
                  </LoadingButton>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <Card><CardContent className="py-8 text-base text-muted-foreground">Tidak ada rekomendasi untuk filter ini.</CardContent></Card>
      )}
      <ConfirmDialog
        open={Boolean(pendingCompletion)}
        title="Tandai rekomendasi selesai?"
        description="Rekomendasi akan dipindahkan ke status selesai dan catatan saat ini akan disimpan."
        confirmLabel="Tandai selesai"
        isLoading={pendingCompletion ? completingId === pendingCompletion.id : false}
        onOpenChange={(open) => {
          if (!open) setPendingCompletion(null)
        }}
        onConfirm={() => {
          if (pendingCompletion) completeRecommendation(pendingCompletion)
        }}
      />
    </div>
  )
}
