import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { z } from 'zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MonthPicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingButton } from '@/components/ui/loading-button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { machineUsageSchema } from '@/features/machine-usage/schemas'
import type { ImportCsvResponse, MachineUsageRecord } from '@/features/machine-usage/types'
import { apiRequest } from '@/lib/api'
import { getStoredToken, getStoredUser } from '@/lib/auth'

const initialForm = {
  report_month: '2025-02',
  row_no: '1',
  machine_name: 'Mesin Shrink Tunnel',
  machine_location: 'Production',
  machine_quantity: '1',
  machine_power_watt: '20000',
  machine_power_kw: '20',
  usage_hours: '14',
  energy_kwh: '280',
}

export function MachineUsagePage() {
  const token = getStoredToken()
  const user = getStoredUser()
  const [form, setForm] = useState(initialForm)
  const [records, setRecords] = useState<MachineUsageRecord[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRecordsLoading, setIsRecordsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [importResult, setImportResult] = useState<ImportCsvResponse | null>(null)

  async function loadRecords(reportMonth = form.report_month) {
    if (!token) return
    setIsRecordsLoading(true)
    const data = await apiRequest<MachineUsageRecord[]>(`/api/machine-usage?report_month=${reportMonth}`, { token })
    setRecords(data)
    setIsRecordsLoading(false)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadRecords().catch(() => {
        setError('Failed to load machine usage records')
        setIsRecordsLoading(false)
      })
    }, 0)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      await apiRequest<MachineUsageRecord>('/api/machine-usage', {
        method: 'POST',
        token,
        body: JSON.stringify(parsed),
      })
      setMessage('Machine usage saved and calculated.')
      await loadRecords(parsed.report_month)
    } catch (submitError) {
      if (submitError instanceof z.ZodError) {
        setError(submitError.issues[0]?.message ?? 'Invalid form input')
      } else {
        setError(submitError instanceof Error ? submitError.message : 'Failed to save machine usage')
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCsvUpload(file: File | null) {
    if (!file || !token) return
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
      setMessage(`CSV imported: ${result.valid_rows} valid, ${result.warning_rows} warning, ${result.error_rows} error.`)
      await loadRecords(form.report_month)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'CSV upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/15">Machine Usage</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">Input usage data</h1>
        <p className="mt-2 text-sm text-muted-foreground">Company context: {user?.company_name ?? 'Unknown company'}</p>
      </div>

      <Tabs defaultValue="form" className="w-full gap-4">
        <Card className="w-full">
          <CardHeader className="gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>Machine usage input</CardTitle>
              <CardDescription>Submit one machine usage row or upload the prepared CSV template.</CardDescription>
            </div>
            <TabsList className="w-full shrink-0 md:w-fit">
              <TabsTrigger value="form">Input Form</TabsTrigger>
              <TabsTrigger value="csv">CSV Upload</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent>
            <TabsContent value="form" className="mt-0">
              <form className="grid gap-4 lg:grid-cols-2" onSubmit={handleSubmit}>
                <div className="grid gap-2">
                  <Label htmlFor="report_month">Report Month</Label>
                  <MonthPicker value={form.report_month} onChange={(value) => setForm({ ...form, report_month: value })} ariaLabel="Report month" className="w-full" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="row_no">Row No</Label>
                  <Input id="row_no" value={form.row_no} onChange={(event) => setForm({ ...form, row_no: event.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="machine_name">Machine Name</Label>
                  <Input id="machine_name" value={form.machine_name} onChange={(event) => setForm({ ...form, machine_name: event.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="machine_location">Machine Location</Label>
                  <Input id="machine_location" value={form.machine_location} onChange={(event) => setForm({ ...form, machine_location: event.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="machine_quantity">Quantity</Label>
                  <Input id="machine_quantity" value={form.machine_quantity} onChange={(event) => setForm({ ...form, machine_quantity: event.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="machine_power_watt">Power Watt</Label>
                  <Input id="machine_power_watt" value={form.machine_power_watt} onChange={(event) => setForm({ ...form, machine_power_watt: event.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="machine_power_kw">Power KW</Label>
                  <Input id="machine_power_kw" value={form.machine_power_kw} onChange={(event) => setForm({ ...form, machine_power_kw: event.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="usage_hours">Usage Hours</Label>
                  <Input id="usage_hours" value={form.usage_hours} onChange={(event) => setForm({ ...form, usage_hours: event.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="energy_kwh">Energy KWH</Label>
                  <Input id="energy_kwh" value={form.energy_kwh} onChange={(event) => setForm({ ...form, energy_kwh: event.target.value })} />
                </div>
                <div className="lg:col-span-2">
                  {error ? <p className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
                  {message ? <p className="mb-3 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">{message}</p> : null}
                  <LoadingButton type="submit" isLoading={isLoading}>Save usage</LoadingButton>
                </div>
              </form>
            </TabsContent>
            <TabsContent value="csv" className="mt-0 space-y-4">
              <Button variant="outline" asChild>
                <a href="/sample_machine_usage_2025_02.csv" download>Download sample CSV</a>
              </Button>
              <div className="grid gap-2">
                <Input type="file" accept=".csv" disabled={isUploading} onChange={(event) => handleCsvUpload(event.target.files?.[0] ?? null)} />
                {isUploading ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />Importing CSV</p> : null}
              </div>
              <code className="block rounded-md bg-muted p-3 text-xs text-muted-foreground">report_month,row_no,machine_name,machine_location,machine_quantity,machine_power_watt,machine_power_kw,usage_hours,energy_kwh</code>
              {importResult ? (
                <div className="rounded-md border p-4 text-sm">
                  <p className="font-medium">Import result</p>
                  <p className="mt-1 text-muted-foreground">Total {importResult.total_rows}, valid {importResult.valid_rows}, warning {importResult.warning_rows}, error {importResult.error_rows}</p>
                </div>
              ) : null}
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Usage records</CardTitle>
          <CardDescription>Latest records for selected month.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b text-muted-foreground">
              <tr>
                <th className="py-2 pr-4">Machine</th>
                <th className="py-2 pr-4">Location</th>
                <th className="py-2 pr-4">Qty</th>
                <th className="py-2 pr-4">KW</th>
                <th className="py-2 pr-4">Hours</th>
                <th className="py-2 pr-4">Energy KWH</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {isRecordsLoading ? Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="border-b last:border-0">
                  {Array.from({ length: 7 }).map((__, cellIndex) => (
                    <td key={cellIndex} className="py-3 pr-4"><Skeleton className="h-4 w-24" /></td>
                  ))}
                </tr>
              )) : records.map((record) => (
                <tr key={record.id} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-medium">{record.machine_name}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{record.machine_location}</td>
                  <td className="py-3 pr-4">{record.machine_quantity}</td>
                  <td className="py-3 pr-4">{record.machine_power_kw}</td>
                  <td className="py-3 pr-4">{record.usage_hours}</td>
                  <td className="py-3 pr-4 text-primary">{record.energy_kwh}</td>
                  <td className="py-3 pr-4"><Badge variant="outline">{record.validation_status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isRecordsLoading && !records.length ? <p className="py-6 text-sm text-muted-foreground">No machine usage records yet.</p> : null}
        </CardContent>
      </Card>
    </div>
  )
}
