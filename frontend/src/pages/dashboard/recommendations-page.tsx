import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import type { Recommendation } from '@/features/recommendations/types'
import { apiRequest } from '@/lib/api'
import { getStoredToken } from '@/lib/auth'

export function RecommendationsPage() {
  const token = getStoredToken()
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [reportMonth, setReportMonth] = useState('2025-02')
  const [completionNotes, setCompletionNotes] = useState<Record<number, string>>({})
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function loadRecommendations() {
    if (!token) return
    const data = await apiRequest<Recommendation[]>('/api/recommendations', { token })
    setRecommendations(data)
  }

  useEffect(() => {
    loadRecommendations().catch(() => setError('Failed to load recommendations'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function generateRecommendations() {
    if (!token) return
    setError(null)
    setMessage(null)
    try {
      const data = await apiRequest<Recommendation[]>('/api/recommendations/generate', {
        method: 'POST',
        token,
        body: JSON.stringify({ report_month: reportMonth }),
      })
      setMessage(`Generated ${data.length} recommendations.`)
      await loadRecommendations()
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : 'Failed to generate recommendations')
    }
  }

  async function completeRecommendation(recommendation: Recommendation) {
    if (!token || recommendation.is_completed) return
    await apiRequest<Recommendation>(`/api/recommendations/${recommendation.id}/complete`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ is_completed: true, completion_note: completionNotes[recommendation.id] ?? null }),
    })
    await loadRecommendations()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/15">Recommendations</Badge>
          <h1 className="text-3xl font-semibold tracking-tight">Emission reduction actions</h1>
          <p className="mt-2 text-sm text-muted-foreground">Generate rule-based recommendations and mark actions as completed.</p>
        </div>
        <div className="flex gap-2">
          <Input value={reportMonth} onChange={(event) => setReportMonth(event.target.value)} className="w-32" aria-label="Report month" />
          <Button onClick={generateRecommendations}>Generate</Button>
        </div>
      </div>

      {message ? <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">{message}</p> : null}
      {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-4">
        {recommendations.map((recommendation) => (
          <Card key={recommendation.id} className={recommendation.is_completed ? 'bg-muted/40' : ''}>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>{recommendation.recommendation_title}</CardTitle>
                  <CardDescription className="mt-1">{recommendation.related_machine_name ?? 'General recommendation'}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">{recommendation.priority}</Badge>
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/15">{recommendation.status}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{recommendation.recommendation_description}</p>
              <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                <Input
                  placeholder="Optional completion note"
                  value={completionNotes[recommendation.id] ?? recommendation.completion_note ?? ''}
                  disabled={recommendation.is_completed}
                  onChange={(event) => setCompletionNotes({ ...completionNotes, [recommendation.id]: event.target.value })}
                />
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={recommendation.is_completed} disabled={recommendation.is_completed} onCheckedChange={() => completeRecommendation(recommendation)} />
                  Completed
                </label>
              </div>
            </CardContent>
          </Card>
        ))}
        {!recommendations.length ? <Card><CardContent className="py-8 text-sm text-muted-foreground">No recommendations yet. Import usage data, then generate recommendations.</CardContent></Card> : null}
      </div>
    </div>
  )
}
