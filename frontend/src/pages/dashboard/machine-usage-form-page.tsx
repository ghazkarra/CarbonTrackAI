import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download, FileUp, Upload } from 'lucide-react'
import { z } from 'zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { MonthPicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingButton } from '@/components/ui/loading-button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { machineUsageSchema } from '@/features/machine-usage/schemas'
import type { ImportCsvResponse, MachineUsageDetail, MachineUsageRecord } from '@/features/machine-usage/types'
import { apiRequest, getApiErrorMessage } from '@/lib/api'
import { getStoredToken } from '@/lib/auth'

const initialForm = {
  report_month: '2025-02',
  row_no: '1',
  machine_name: 'Mesin Coding',
  machine_location: 'Production',
  machine_quantity: '1',
  machine_power_watt: '1000',
  machine_power_kw: '1',
  usage_hours: '14',
  energy_kwh: '14',
}

type MachineUsageFormPageProps = {
  mode?: 'create' | 'edit'
}

export function MachineUsageFormPage({ mode = 'create' }: MachineUsageFormPageProps) {
  const token = getStoredToken()
  const navigate = useNavigate()
  const { usageId } = useParams()
  const isEdit = mode === 'edit'
  const [form, setForm] = useState(initialForm)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDetailLoading, setIsDetailLoading] = useState(isEdit)
  const [isUploading, setIsUploading] = useState(false)
  const [importResult, setImportResult] = useState<ImportCsvResponse | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)

  useEffect(() => {
    if (!isEdit || !token || !usageId) return
    const timer = window.setTimeout(() => {
      setIsDetailLoading(true)
      apiRequest<MachineUsageDetail>(`/api/machine-usage/${usageId}`, { token })
        .then((record) => {
          setForm({
            report_month: record.report_month,
            row_no: record.row_no ? String(record.row_no) : '',
            machine_name: record.machine_name,
            machine_location: record.machine_location,
            machine_quantity: String(record.machine_quantity),
            machine_power_watt: record.machine_power_watt,
            machine_power_kw: record.machine_power_kw,
            usage_hours: record.usage_hours,
            energy_kwh: record.energy_kwh,
          })
        })
        .catch((loadError) => setError(getApiErrorMessage(loadError, 'Gagal memuat data pemakaian mesin')))
        .finally(() => setIsDetailLoading(false))
    }, 0)
    return () => window.clearTimeout(timer)
  }, [isEdit, token, usageId])

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) return
    setError(null)
    setMessage(null)
    setIsLoading(true)

    try {
      const parsed = machineUsageSchema.parse({
        report_month: form.report_month,
        row_no: form.row_no ? form.row_no : undefined,
        machine_name: form.machine_name,
        machine_location: form.machine_location,
        machine_quantity: form.machine_quantity,
        machine_power_watt: form.machine_power_watt,
        machine_power_kw: form.machine_power_kw ? form.machine_power_kw : undefined,
        usage_hours: form.usage_hours,
        energy_kwh: form.energy_kwh ? form.energy_kwh : undefined,
      })
      const record = await apiRequest<MachineUsageRecord>(isEdit ? `/api/machine-usage/${usageId}` : '/api/machine-usage', {
        method: isEdit ? 'PATCH' : 'POST',
        token,
        body: JSON.stringify(parsed),
      })
      setMessage(isEdit ? 'Data pemakaian mesin berhasil diperbarui.' : 'Data pemakaian mesin berhasil disimpan dan dihitung.')
      navigate(`/dashboard/machine-usage/${record.id}`)
    } catch (submitError) {
      if (submitError instanceof z.ZodError) {
        setError(submitError.issues[0]?.message ?? 'Input formulir tidak valid')
      } else {
        setError(getApiErrorMessage(submitError, isEdit ? 'Gagal memperbarui data pemakaian mesin' : 'Gagal menyimpan data pemakaian mesin'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCsvUpload(file: File | null) {
    if (!file || !token) return
    setSelectedFileName(file.name)
    setError(null)
    setMessage(null)
    setImportResult(null)
    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const result = await apiRequest<ImportCsvResponse>('/api/machine-usage/import-csv', {
        method: 'POST',
        token,
        body: formData,
      })
      setImportResult(result)
      setMessage(`CSV berhasil diimpor: ${result.valid_rows} valid, ${result.warning_rows} peringatan, ${result.error_rows} error.`)
    } catch (uploadError) {
      setError(getApiErrorMessage(uploadError, 'Gagal mengunggah CSV'))
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/15">Pemakaian Mesin</Badge>
          <h1 className="text-4xl font-semibold tracking-tight">{isEdit ? 'Edit machine usage' : 'Input machine usage'}</h1>
          <p className="mt-3 text-base text-muted-foreground">Isi detail pemakaian mesin, lalu sistem akan menghitung kWh, emisi, alerts, dan rekomendasi terkait.</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/dashboard/machine-usage"><ArrowLeft className="size-4" /> Kembali</Link>
        </Button>
      </div>

      {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
      {message ? <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">{message}</p> : null}

      <Card>
        <Tabs defaultValue="form" className="flex flex-col gap-0">
          <div className="flex flex-col gap-4 border-b px-5 pb-5 pt-1 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <CardTitle className="text-xl">{isEdit ? 'Form pemakaian mesin' : 'Input pemakaian mesin'}</CardTitle>
              <CardDescription className="mt-1 text-base">
                {isEdit ? 'Perbarui data pemakaian mesin ini.' : 'Pilih input manual atau unggah CSV sesuai template.'}
              </CardDescription>
            </div>
            {!isEdit ? (
              <TabsList className="w-full shrink-0 md:w-fit">
                <TabsTrigger value="form">Form input</TabsTrigger>
                <TabsTrigger value="csv">Unggah CSV</TabsTrigger>
              </TabsList>
            ) : null}
          </div>
          <CardContent className="px-5 pt-5">
            <TabsContent value="form" className="mt-0">
              {isDetailLoading ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {Array.from({ length: 9 }).map((_, index) => <Skeleton key={index} className="h-11 w-full" />)}
                </div>
              ) : (
                <form className="grid gap-4 lg:grid-cols-2" onSubmit={handleSubmit}>
                  <div className="grid gap-2">
                    <Label htmlFor="report_month" className="text-base">Bulan laporan</Label>
                    <MonthPicker value={form.report_month} onChange={(value) => updateField('report_month', value)} ariaLabel="Bulan laporan" className="w-full" />
                  </div>
                  <InputField id="row_no" label="Nomor baris" value={form.row_no} onChange={(value) => updateField('row_no', value)} />
                  <InputField id="machine_name" label="Nama mesin" value={form.machine_name} onChange={(value) => updateField('machine_name', value)} />
                  <InputField id="machine_location" label="Lokasi mesin" value={form.machine_location} onChange={(value) => updateField('machine_location', value)} />
                  <InputField id="machine_quantity" label="Jumlah" value={form.machine_quantity} onChange={(value) => updateField('machine_quantity', value)} />
                  <InputField id="machine_power_watt" label="Daya watt" value={form.machine_power_watt} onChange={(value) => updateField('machine_power_watt', value)} />
                  <InputField id="machine_power_kw" label="Daya kW" value={form.machine_power_kw} onChange={(value) => updateField('machine_power_kw', value)} />
                  <InputField id="usage_hours" label="Jam pemakaian" value={form.usage_hours} onChange={(value) => updateField('usage_hours', value)} />
                  <InputField id="energy_kwh" label="Energi kWh" value={form.energy_kwh} onChange={(value) => updateField('energy_kwh', value)} />
                  <div className="lg:col-span-2">
                    <LoadingButton type="submit" isLoading={isLoading}>{isEdit ? 'Simpan perubahan' : 'Simpan pemakaian'}</LoadingButton>
                  </div>
                </form>
              )}
            </TabsContent>

            {!isEdit ? (
              <TabsContent value="csv" className="mt-0 space-y-5">
                <div className="flex flex-col gap-3 rounded-lg border bg-muted/35 p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">Template CSV</p>
                    <p className="mt-1 text-sm text-muted-foreground">Gunakan struktur kolom yang sama agar proses impor bisa divalidasi otomatis.</p>
                  </div>
                  <Button variant="outline" asChild>
                    <a href="/sample_machine_usage_2025_02.csv" download><Download className="size-4" /> Unduh contoh CSV</a>
                  </Button>
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="machine-usage-csv" className="text-base">File CSV</Label>
                  <label
                    htmlFor="machine-usage-csv"
                    className="group flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-primary/35 bg-primary/5 px-6 py-8 text-center transition hover:border-primary/60 hover:bg-primary/10"
                  >
                    <span className="rounded-md bg-background p-3 text-primary shadow-sm">
                      <FileUp className="size-7" />
                    </span>
                    <span className="mt-4 text-base font-medium">{selectedFileName ?? 'Pilih file CSV untuk diunggah'}</span>
                    <span className="mt-1 text-sm text-muted-foreground">Klik area ini, lalu pilih file .csv dari komputer Anda.</span>
                    <Input id="machine-usage-csv" className="sr-only" type="file" accept=".csv" disabled={isUploading} onChange={(event) => handleCsvUpload(event.target.files?.[0] ?? null)} />
                  </label>
                  {isUploading ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><Upload className="size-4 animate-pulse" /> Mengimpor CSV</p> : null}
                </div>

                <code className="block overflow-x-auto rounded-md bg-muted p-3 text-xs text-muted-foreground">report_month,row_no,machine_name,machine_location,machine_quantity,machine_power_watt,machine_power_kw,usage_hours,energy_kwh</code>
                {importResult ? (
                  <div className="rounded-md border p-4 text-sm">
                    <p className="font-medium">Hasil impor</p>
                    <p className="mt-1 text-muted-foreground">Total {importResult.total_rows}, valid {importResult.valid_rows}, peringatan {importResult.warning_rows}, error {importResult.error_rows}</p>
                  </div>
                ) : null}
              </TabsContent>
            ) : null}
          </CardContent>
        </Tabs>
      </Card>
    </div>
  )
}

type InputFieldProps = {
  id: keyof typeof initialForm
  label: string
  value: string
  onChange: (value: string) => void
}

function InputField({ id, label, value, onChange }: InputFieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-base">{label}</Label>
      <Input id={id} className="h-11 text-base md:text-base" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}
