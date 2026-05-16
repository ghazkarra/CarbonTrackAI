import { useEffect, useState } from 'react'
import { Database, Leaf, LogOut, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { apiRequest } from '@/lib/api'
import { clearAuth, getStoredToken, getStoredUser } from '@/lib/auth'

type ChromaHealth = {
  collection: string
  count: number
}

type IngestResponse = {
  status: string
  counts: Record<string, number>
}

export function SuperadminPage() {
  const navigate = useNavigate()
  const token = getStoredToken()
  const user = getStoredUser()
  const [health, setHealth] = useState<ChromaHealth | null>(null)
  const [ingestResult, setIngestResult] = useState<IngestResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function loadHealth() {
    if (!token) return
    const data = await apiRequest<ChromaHealth>('/api/superadmin/datasets/chroma-health', { token })
    setHealth(data)
  }

  useEffect(() => {
    loadHealth().catch(() => setError('Failed to load ChromaDB health'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function ingestDatasets() {
    if (!token) return
    setError(null)
    setIsLoading(true)
    try {
      const result = await apiRequest<IngestResponse>('/api/superadmin/datasets/ingest', {
        method: 'POST',
        token,
      })
      setIngestResult(result)
      await loadHealth()
    } catch (ingestError) {
      setError(ingestError instanceof Error ? ingestError.message : 'Dataset ingest failed')
    } finally {
      setIsLoading(false)
    }
  }

  function logout() {
    clearAuth()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="flex h-16 items-center justify-between border-b px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Leaf className="size-5" />
          </div>
          <div>
            <p className="font-semibold">CarbonCore AI</p>
            <p className="text-xs text-muted-foreground">Superadmin Console</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:block">{user?.email}</span>
          <Button variant="outline" size="icon" onClick={logout} aria-label="Logout">
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      <main className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/15">Superadmin</Badge>
          <h1 className="text-3xl font-semibold tracking-tight">Dataset and RAG management</h1>
          <p className="mt-2 text-sm text-muted-foreground">Ingest reference datasets into ChromaDB and monitor vector collection health.</p>
        </div>

        {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Database className="size-5 text-primary" /> ChromaDB Health</CardTitle>
              <CardDescription>Current collection status for `emission_knowledge_base`.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border p-4">
                <p className="text-sm text-muted-foreground">Collection</p>
                <p className="mt-1 font-medium">{health?.collection ?? '-'}</p>
              </div>
              <div className="rounded-md border p-4">
                <p className="text-sm text-muted-foreground">Document count</p>
                <p className="mt-1 text-2xl font-semibold text-primary">{health?.count ?? 0}</p>
              </div>
              <Button variant="outline" onClick={() => loadHealth()}>
                <RefreshCw className="size-4" /> Refresh Health
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dataset Ingestion</CardTitle>
              <CardDescription>Load the five blueprint CSV datasets into ChromaDB.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={ingestDatasets} disabled={isLoading}>
                {isLoading ? 'Ingesting...' : 'Ingest datasets'}
              </Button>
              {ingestResult ? (
                <div className="space-y-2 rounded-md border p-4 text-sm">
                  <p className="font-medium">Status: {ingestResult.status}</p>
                  {Object.entries(ingestResult.counts).map(([file, count]) => (
                    <div key={file} className="flex justify-between gap-4 text-muted-foreground">
                      <span>{file}</span>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
