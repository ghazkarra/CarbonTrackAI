import { useEffect, useState } from 'react'
import { FiDatabase as Database, FiRefreshCw as RefreshCw, FiUpload as Upload } from 'react-icons/fi'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { LoadingButton } from '@/components/ui/loading-button'
import { Skeleton } from '@/components/ui/skeleton'
import { apiRequest, getApiErrorMessage } from '@/lib/api'
import { getStoredToken } from '@/lib/auth'

type ChromaHealth = {
  collection: string
  count: number
}

type IngestResponse = {
  status: string
  counts: Record<string, number>
}

type DatasetFile = {
  file_name: string
  size_bytes: number
  updated_at: number
}

type UploadResponse = {
  status: string
  file_name: string
  size_bytes: number
}

export function SuperadminDatasetsPage() {
  const token = getStoredToken()
  const [health, setHealth] = useState<ChromaHealth | null>(null)
  const [datasets, setDatasets] = useState<DatasetFile[]>([])
  const [ingestResult, setIngestResult] = useState<IngestResponse | null>(null)
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isHealthLoading, setIsHealthLoading] = useState(false)
  const [isDatasetLoading, setIsDatasetLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  async function loadHealth() {
    if (!token) return
    setIsHealthLoading(true)
    const data = await apiRequest<ChromaHealth>('/api/superadmin/datasets/chroma-health', { token })
    setHealth(data)
    setIsHealthLoading(false)
  }

  async function loadDatasets() {
    if (!token) return
    setIsDatasetLoading(true)
    const data = await apiRequest<DatasetFile[]>('/api/superadmin/datasets', { token })
    setDatasets(data)
    setIsDatasetLoading(false)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadHealth().catch(() => {
        setError('Gagal memuat status ChromaDB')
        setIsHealthLoading(false)
      })
      loadDatasets().catch((datasetError) => {
        setError(getApiErrorMessage(datasetError, 'Gagal memuat daftar dataset'))
        setIsDatasetLoading(false)
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
      setError(getApiErrorMessage(ingestError, 'Gagal melakukan ingest dataset'))
    } finally {
      setIsLoading(false)
    }
  }

  async function uploadDataset(file: File | null) {
    if (!file || !token) return
    setError(null)
    setUploadResult(null)
    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const result = await apiRequest<UploadResponse>('/api/superadmin/datasets/upload', {
        method: 'POST',
        token,
        body: formData,
      })
      setUploadResult(result)
      await loadDatasets()
    } catch (uploadError) {
      setError(getApiErrorMessage(uploadError, 'Gagal mengunggah dataset'))
    } finally {
      setIsUploading(false)
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl"><Upload className="size-6 text-primary" /> Upload dataset lokal</CardTitle>
            <CardDescription className="text-base">CSV yang diunggah akan disimpan ke folder dataset backend lokal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input type="file" accept=".csv" disabled={isUploading} onChange={(event) => uploadDataset(event.target.files?.[0] ?? null)} />
            {isUploading ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />Mengunggah dataset</p> : null}
            {uploadResult ? (
              <div className="rounded-md border p-4 text-sm">
                <p className="font-medium">Dataset tersimpan: {uploadResult.file_name}</p>
                <p className="mt-1 text-muted-foreground">{uploadResult.size_bytes.toLocaleString('id-ID')} bytes</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">File dataset</CardTitle>
            <CardDescription className="text-base">Daftar CSV yang tersedia di backend/app/datasets.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {isDatasetLoading ? Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-10 w-full" />) : datasets.map((dataset) => (
              <div key={dataset.file_name} className="flex items-center justify-between gap-4 rounded-md border p-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{dataset.file_name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(dataset.updated_at * 1000).toLocaleString('id-ID')}</p>
                </div>
                <span className="shrink-0 text-muted-foreground">{dataset.size_bytes.toLocaleString('id-ID')} bytes</span>
              </div>
            ))}
            {!isDatasetLoading && !datasets.length ? <p className="text-sm text-muted-foreground">Belum ada file dataset.</p> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
