import { useEffect, useState } from 'react'
import { FiDatabase as Database, FiRefreshCw as RefreshCw } from 'react-icons/fi'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingButton } from '@/components/ui/loading-button'
import { Skeleton } from '@/components/ui/skeleton'
import { apiRequest } from '@/lib/api'
import { getStoredToken } from '@/lib/auth'

type ChromaHealth = {
  collection: string
  count: number
}

type IngestResponse = {
  status: string
  counts: Record<string, number>
}

export function SuperadminDatasetsPage() {
  const token = getStoredToken()
  const [health, setHealth] = useState<ChromaHealth | null>(null)
  const [ingestResult, setIngestResult] = useState<IngestResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isHealthLoading, setIsHealthLoading] = useState(false)

  async function loadHealth() {
    if (!token) return
    setIsHealthLoading(true)
    const data = await apiRequest<ChromaHealth>('/api/superadmin/datasets/chroma-health', { token })
    setHealth(data)
    setIsHealthLoading(false)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadHealth().catch(() => {
        setError('Gagal memuat status ChromaDB')
        setIsHealthLoading(false)
      })
    }, 0)
    return () => window.clearTimeout(timer)
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
      setError(ingestError instanceof Error ? ingestError.message : 'Gagal melakukan ingest dataset')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/15">Superadmin</Badge>
        <h1 className="text-4xl font-semibold tracking-tight">Manajemen dataset dan RAG</h1>
        <p className="mt-3 text-base text-muted-foreground">Masukkan dataset referensi ke ChromaDB dan pantau kesehatan koleksi vektor.</p>
      </div>

      {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl"><Database className="size-6 text-primary" /> Kesehatan ChromaDB</CardTitle>
            <CardDescription className="text-base">Status koleksi saat ini untuk `emission_knowledge_base`.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border p-4">
              <p className="text-base text-muted-foreground">Koleksi</p>
              {isHealthLoading ? <Skeleton className="mt-2 h-5 w-48" /> : <p className="mt-1 text-base font-medium">{health?.collection ?? '-'}</p>}
            </div>
            <div className="rounded-md border p-4">
              <p className="text-base text-muted-foreground">Jumlah dokumen</p>
              {isHealthLoading ? <Skeleton className="mt-2 h-8 w-20" /> : <p className="mt-1 text-3xl font-semibold text-primary">{health?.count ?? 0}</p>}
            </div>
            <LoadingButton variant="outline" className="min-w-52 px-6" isLoading={isHealthLoading} onClick={() => loadHealth()}>
              <RefreshCw className="size-4" /> Perbarui status
            </LoadingButton>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Ingest dataset</CardTitle>
            <CardDescription className="text-base">Muat lima dataset CSV blueprint ke ChromaDB.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <LoadingButton onClick={ingestDatasets} isLoading={isLoading}>Ingest dataset</LoadingButton>
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
    </div>
  )
}
