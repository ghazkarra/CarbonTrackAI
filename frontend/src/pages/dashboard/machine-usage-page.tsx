import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpDown, ChevronLeft, ChevronRight, Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { LoadingButton } from '@/components/ui/loading-button'
import { Skeleton } from '@/components/ui/skeleton'
import type { MachineUsageRecord } from '@/features/machine-usage/types'
import { apiRequest, getApiErrorMessage } from '@/lib/api'
import { getStoredToken, getStoredUser } from '@/lib/auth'

type SortKey = 'machine_name' | 'machine_location' | 'report_month' | 'machine_power_kw' | 'usage_hours' | 'energy_kwh' | 'validation_status' | 'created_at'
type SortDirection = 'asc' | 'desc'

const numberFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 })

function translateValidationStatus(status: string) {
  const normalized = status.toLowerCase()
  if (normalized === 'valid') return 'Valid'
  if (normalized === 'warning') return 'Peringatan'
  if (normalized === 'error') return 'Error'
  return status
}

function compareRecords(first: MachineUsageRecord, second: MachineUsageRecord, sortKey: SortKey, direction: SortDirection) {
  const multiplier = direction === 'asc' ? 1 : -1
  const numericKeys: SortKey[] = ['machine_power_kw', 'usage_hours', 'energy_kwh']
  if (numericKeys.includes(sortKey)) {
    return (Number(first[sortKey]) - Number(second[sortKey])) * multiplier
  }
  return String(first[sortKey] ?? '').localeCompare(String(second[sortKey] ?? '')) * multiplier
}

export function MachineUsagePage() {
  const token = getStoredToken()
  const user = getStoredUser()
  const [records, setRecords] = useState<MachineUsageRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [pendingDelete, setPendingDelete] = useState<MachineUsageRecord | null>(null)
  const [search, setSearch] = useState('')
  const [monthFilter, setMonthFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  async function loadRecords() {
    if (!token) return
    setIsLoading(true)
    const data = await apiRequest<MachineUsageRecord[]>('/api/machine-usage', { token })
    setRecords(data)
    setIsLoading(false)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadRecords().catch((loadError) => {
        setError(getApiErrorMessage(loadError, 'Gagal memuat data pemakaian mesin'))
        setIsLoading(false)
      })
    }, 0)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function deleteRecord(record: MachineUsageRecord) {
    if (!token) return
    setDeletingId(record.id)
    setError(null)
    try {
      await apiRequest<MachineUsageRecord>(`/api/machine-usage/${record.id}`, { method: 'DELETE', token })
      await loadRecords()
      setPendingDelete(null)
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, 'Gagal menghapus data pemakaian mesin'))
    } finally {
      setDeletingId(null)
    }
  }

  function toggleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
      return
    }
    setSortKey(nextKey)
    setSortDirection('asc')
  }

  const months = useMemo(() => Array.from(new Set(records.map((record) => record.report_month))).sort().reverse(), [records])

  const filteredRecords = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return records
      .filter((record) => {
        const matchesSearch = !keyword || [record.machine_name, record.machine_location, record.report_month, record.validation_message ?? ''].some((value) => value.toLowerCase().includes(keyword))
        const matchesMonth = monthFilter === 'all' || record.report_month === monthFilter
        const matchesStatus = statusFilter === 'all' || record.validation_status === statusFilter
        const matchesSource = sourceFilter === 'all' || record.data_source === sourceFilter
        return matchesSearch && matchesMonth && matchesStatus && matchesSource
      })
      .sort((first, second) => compareRecords(first, second, sortKey, sortDirection))
  }, [monthFilter, records, search, sortDirection, sortKey, sourceFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageRecords = filteredRecords.slice((safePage - 1) * pageSize, safePage * pageSize)

  useEffect(() => {
    setPage(1)
  }, [monthFilter, pageSize, search, sourceFilter, statusFilter])

  const totalEnergy = filteredRecords.reduce((total, record) => total + Number(record.energy_kwh), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/15">Pemakaian Mesin</Badge>
          <h1 className="text-4xl font-semibold tracking-tight">Data Pemakaian Mesin</h1>
          <p className="mt-3 text-base text-muted-foreground">Konteks perusahaan: {user?.company_name ?? 'Perusahaan tidak diketahui'}</p>
        </div>
        <Button asChild size="lg">
          <Link to="/dashboard/machine-usage/new"><Plus className="size-4" /> Tambah pemakaian mesin</Link>
        </Button>
      </div>

      {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

      <Card>
        <CardHeader className="gap-4">
          <div>
            <CardTitle className="text-xl">Data tabel pemakaian</CardTitle>
            <CardDescription className="text-base">{filteredRecords.length} record ditampilkan, total {numberFormatter.format(totalEnergy)} kWh.</CardDescription>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
            <Input placeholder="Cari mesin, lokasi, bulan, atau catatan" value={search} onChange={(event) => setSearch(event.target.value)} />
            <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm" value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)}>
              <option value="all">Semua bulan</option>
              {months.map((month) => <option key={month} value={month}>{month}</option>)}
            </select>
            <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">Semua status</option>
              <option value="valid">Valid</option>
              <option value="warning">Peringatan</option>
              <option value="error">Error</option>
            </select>
            <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
              <option value="all">Semua sumber</option>
              <option value="form">Form</option>
              <option value="csv_upload">CSV upload</option>
            </select>
            <select className="h-10 rounded-lg border border-input bg-background px-3 text-sm" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
              {[5, 10, 20, 50].map((size) => <option key={size} value={size}>{size} / halaman</option>)}
            </select>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="border-b text-muted-foreground">
              <tr>
                <SortableHeader label="Mesin" sortKey="machine_name" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} />
                <SortableHeader label="Lokasi" sortKey="machine_location" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} />
                <SortableHeader label="Bulan" sortKey="report_month" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} />
                <th className="py-3 pr-4">Qty</th>
                <SortableHeader label="kW" sortKey="machine_power_kw" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} />
                <SortableHeader label="Jam" sortKey="usage_hours" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} />
                <SortableHeader label="Energi kWh" sortKey="energy_kwh" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} />
                <SortableHeader label="Status" sortKey="validation_status" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} />
                <th className="py-3 pr-4">Sumber</th>
                <SortableHeader label="Dibuat" sortKey="created_at" activeKey={sortKey} direction={sortDirection} onSort={toggleSort} />
                <th className="py-3 pr-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({ length: pageSize }).map((_, index) => (
                <tr key={index} className="border-b last:border-0">
                  {Array.from({ length: 11 }).map((__, cellIndex) => (
                    <td key={cellIndex} className="py-3 pr-4"><Skeleton className="h-4 w-24" /></td>
                  ))}
                </tr>
              )) : pageRecords.map((record) => (
                <tr key={record.id} className="border-b last:border-0 hover:bg-muted/35">
                  <td className="py-3 pr-4 font-medium">{record.machine_name}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{record.machine_location}</td>
                  <td className="py-3 pr-4">{record.report_month}</td>
                  <td className="py-3 pr-4">{record.machine_quantity}</td>
                  <td className="py-3 pr-4">{numberFormatter.format(Number(record.machine_power_kw))}</td>
                  <td className="py-3 pr-4">{numberFormatter.format(Number(record.usage_hours))}</td>
                  <td className="py-3 pr-4 font-medium text-primary">{numberFormatter.format(Number(record.energy_kwh))}</td>
                  <td className="py-3 pr-4"><Badge variant="outline">{translateValidationStatus(record.validation_status)}</Badge></td>
                  <td className="py-3 pr-4 text-muted-foreground">{record.data_source === 'csv_upload' ? 'CSV' : 'Form'}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{new Date(record.created_at).toLocaleDateString('id-ID')}</td>
                  <td className="py-3 pr-4">
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="icon-sm" aria-label="Lihat detail">
                        <Link to={`/dashboard/machine-usage/${record.id}`}><Eye className="size-4" /></Link>
                      </Button>
                      <Button asChild variant="ghost" size="icon-sm" aria-label="Edit data">
                        <Link to={`/dashboard/machine-usage/${record.id}/edit`}><Pencil className="size-4" /></Link>
                      </Button>
                      <LoadingButton variant="ghost" size="icon-sm" aria-label="Hapus data" isLoading={deletingId === record.id} onClick={() => setPendingDelete(record)}>
                        <Trash2 className="size-4 text-destructive" />
                      </LoadingButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && !pageRecords.length ? <p className="py-8 text-sm text-muted-foreground">Belum ada data yang cocok dengan filter ini.</p> : null}
          <div className="mt-4 flex flex-col gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-muted-foreground">Halaman {safePage} dari {totalPages} · {filteredRecords.length} record</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}><ChevronLeft className="size-4" /> Sebelumnya</Button>
              <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>Berikutnya <ChevronRight className="size-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Hapus machine usage?"
        description="Data pemakaian ini akan dihapus bersama calculation, alerts, dan recommendations terkait."
        confirmLabel="Hapus"
        isLoading={pendingDelete ? deletingId === pendingDelete.id : false}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        onConfirm={() => {
          if (pendingDelete) deleteRecord(pendingDelete)
        }}
      />
    </div>
  )
}

type SortableHeaderProps = {
  label: string
  sortKey: SortKey
  activeKey: SortKey
  direction: SortDirection
  onSort: (key: SortKey) => void
}

function SortableHeader({ label, sortKey, activeKey, direction, onSort }: SortableHeaderProps) {
  const isActive = activeKey === sortKey
  return (
    <th className="py-3 pr-4">
      <button type="button" className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => onSort(sortKey)}>
        {label}
        <ArrowUpDown className={`size-3.5 ${isActive ? 'text-primary' : ''}`} />
        {isActive ? <span className="sr-only">{direction === 'asc' ? 'ascending' : 'descending'}</span> : null}
      </button>
    </th>
  )
}
