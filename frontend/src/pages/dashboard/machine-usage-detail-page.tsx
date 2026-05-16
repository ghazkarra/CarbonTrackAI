import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Banknote, Cloud, Gauge, Lightbulb, Pencil, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertRecommendationAccordion, translateStatus } from '@/features/alerts/components/alert-recommendation-accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingButton } from '@/components/ui/loading-button'
import { Skeleton } from '@/components/ui/skeleton'
import type { AlertWithRecommendations } from '@/features/alerts/types'
import type { MachineUsageDetail } from '@/features/machine-usage/types'
import type { Recommendation } from '@/features/recommendations/types'
import { apiRequest, getApiErrorMessage } from '@/lib/api'
import { getStoredToken } from '@/lib/auth'

const numberFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 })
const currencyFormatter = new Intl.NumberFormat('id-ID', { currency: 'IDR', maximumFractionDigits: 0, style: 'currency' })

export function MachineUsageDetailPage() {
  const token = getStoredToken()
  const { usageId } = useParams()
  const [detail, setDetail] = useState<MachineUsageDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  async function loadDetail() {
    if (!token || !usageId) return
    setIsLoading(true)
    const data = await apiRequest<MachineUsageDetail>(`/api/machine-usage/${usageId}`, { token })
    setDetail(data)
    setIsLoading(false)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadDetail().catch((loadError) => {
        setError(getApiErrorMessage(loadError, 'Gagal memuat detail pemakaian mesin'))
        setIsLoading(false)
      })
    }, 0)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usageId])

  async function generateRecommendations() {
    if (!token || !usageId) return
    setIsGenerating(true)
    setError(null)
    try {
      await apiRequest<Recommendation[]>('/api/recommendations/generate', {
        method: 'POST',
        token,
        body: JSON.stringify({ machine_usage_id: Number(usageId) }),
      })
      await loadDetail()
    } catch (generateError) {
      setError(getApiErrorMessage(generateError, 'Gagal membuat rekomendasi untuk mesin ini'))
    } finally {
      setIsGenerating(false)
    }
  }

  const alertItems = useMemo(() => {
    if (!detail) return []
    return detail.alerts.map((alert) => ({
      ...alert,
      machine_usage: {
        id: detail.id,
        report_month: detail.report_month,
        machine_name: detail.machine_name,
        machine_location: detail.machine_location,
        energy_kwh: detail.energy_kwh,
      },
      recommendations: detail.recommendations.filter((recommendation) => recommendation.alert_id === alert.id),
    })) satisfies AlertWithRecommendations[]
  }, [detail])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/15">Detail Mesin</Badge>
          <h1 className="text-4xl font-semibold tracking-tight">{detail?.machine_name ?? 'Machine usage detail'}</h1>
          <p className="mt-3 text-base text-muted-foreground">{detail ? `${detail.machine_location} · ${detail.report_month}` : 'Statistik penggunaan dan peluang penghematan khusus mesin ini.'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild><Link to="/dashboard/machine-usage"><ArrowLeft className="size-4" /> Kembali</Link></Button>
          {detail ? <Button asChild><Link to={`/dashboard/machine-usage/${detail.id}/edit`}><Pencil className="size-4" /> Edit</Link></Button> : null}
        </div>
      </div>

      {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

      {isLoading && !detail ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-32 w-full" />)}
        </div>
      ) : detail ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Energi mesin" value={`${numberFormatter.format(Number(detail.statistics.total_energy_kwh))} kWh`} note={`${detail.machine_quantity} unit · ${numberFormatter.format(Number(detail.usage_hours))} jam`} icon={Zap} />
            <StatCard title="Emisi CO2e" value={`${numberFormatter.format(Number(detail.statistics.estimated_co2e_kg))} kg`} note={`${numberFormatter.format(Number(detail.statistics.estimated_co2e_ton))} ton CO2e`} icon={Cloud} />
            <StatCard title="Total potensi penghematan" value={currencyFormatter.format(Number(detail.statistics.total_potential_saving_idr))} note={`${detail.statistics.tariff_code} · ${currencyFormatter.format(Number(detail.statistics.tariff_per_kwh_idr))}/kWh`} icon={Banknote} />
            <StatCard title="Reduksi CO2" value={`${numberFormatter.format(Number(detail.statistics.total_co2_reduction_kg))} kg`} note={`${numberFormatter.format(Number(detail.statistics.total_saving_kwh))} kWh dapat dihemat`} icon={Gauge} />
          </div>

          <section className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Energi vs potensi hemat</CardTitle>
                <CardDescription className="text-base">Perbandingan konsumsi kWh aktual dan potensi penghematan mesin.</CardDescription>
              </CardHeader>
              <CardContent>
                <ComparisonBarChart
                  data={[
                    { name: 'Energi aktual', value: Number(detail.statistics.total_energy_kwh), color: '#16a34a' },
                    { name: 'Potensi hemat', value: Number(detail.statistics.total_saving_kwh), color: '#0f766e' },
                  ]}
                  unit="kWh"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Emisi vs potensi reduksi</CardTitle>
                <CardDescription className="text-base">Perbandingan estimasi CO2e aktual dan potensi reduksi dari rekomendasi.</CardDescription>
              </CardHeader>
              <CardContent>
                <ComparisonBarChart
                  data={[
                    { name: 'Emisi aktual', value: Number(detail.statistics.estimated_co2e_kg), color: '#2563eb' },
                    { name: 'Potensi reduksi', value: Number(detail.statistics.total_co2_reduction_kg), color: '#0891b2' },
                  ]}
                  unit="kg"
                />
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Informasi pemakaian</CardTitle>
              <CardDescription className="text-base">Nilai input dan hasil validasi untuk record ini.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-2">
              <InfoRow label="Daya watt" value={`${numberFormatter.format(Number(detail.machine_power_watt))} W`} />
              <InfoRow label="Daya kW" value={`${numberFormatter.format(Number(detail.machine_power_kw))} kW`} />
              <InfoRow label="Energi" value={`${numberFormatter.format(Number(detail.energy_kwh))} kWh`} />
              <InfoRow label="Sumber data" value={detail.data_source === 'csv_upload' ? 'CSV upload' : 'Form input'} />
              <InfoRow label="Status validasi" value={translateStatus(detail.validation_status)} />
              <InfoRow label="Tanggal input" value={new Date(detail.created_at).toLocaleDateString('id-ID')} />
              {detail.validation_message ? <p className="rounded-md bg-muted p-3 text-muted-foreground md:col-span-2">{detail.validation_message}</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle className="text-xl">Alerts & recommendations mesin</CardTitle>
                <CardDescription className="text-base">Daftar alert dan rekomendasi yang hanya terkait mesin ini.</CardDescription>
              </div>
              <LoadingButton variant="outline" isLoading={isGenerating} onClick={generateRecommendations}>
                <Lightbulb className="size-4" /> Buat rekomendasi
              </LoadingButton>
            </CardHeader>
            <CardContent>
              <AlertRecommendationAccordion
                alerts={alertItems}
                getRecommendations={(alert) => alert.recommendations}
                emptyMessage="Belum ada alert untuk mesin ini."
              />
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}

type StatCardProps = {
  title: string
  value: string
  note: string
  icon: LucideIcon
}

function StatCard({ title, value, note, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-5">
        <div className="rounded-md bg-primary/10 p-2 text-primary"><Icon className="size-5" /></div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 truncate text-2xl font-semibold tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{note}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function ComparisonBarChart({ data, unit }: { data: Array<{ name: string; value: number; color: string }>; unit: string }) {
  return (
    <div className="h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -14, right: 8, top: 8, bottom: 0 }}>
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
          <Tooltip
            formatter={(value) => [`${numberFormatter.format(Number(value))} ${unit}`, 'Nilai']}
            contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--popover-foreground)' }}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
