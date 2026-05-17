import { Bar, BarChart as RechartsBarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ReportMetric, ReportPreviewResponse } from './types'

type ReportDocumentVariant = 'screen' | 'print'

export function formatReportNumber(value: number | string) {
  return typeof value === 'number' ? value.toLocaleString('id-ID', { maximumFractionDigits: 2 }) : value
}

export function formatReportCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
}

function statusTextColor(value: string) {
  const normalized = value.toLowerCase()
  if (['critical', 'high', 'error', 'danger'].includes(normalized)) return 'text-red-600'
  if (['warning', 'medium'].includes(normalized)) return 'text-amber-600'
  if (['low', 'info'].includes(normalized)) return 'text-sky-600'
  if (['resolved', 'completed', 'done', 'valid'].includes(normalized)) return 'text-emerald-600'
  return 'text-slate-700'
}

function MetricCard({ metric, variant = 'screen' }: { metric: ReportMetric; variant?: ReportDocumentVariant }) {
  return (
    <div className={cn('rounded-xl bg-white text-slate-900 shadow-sm', variant === 'print' ? 'p-3' : 'p-4')}>
      <p className={cn('text-slate-600', variant === 'print' ? 'text-[10px]' : 'text-sm')}>{metric.label}</p>
      <p className={cn('mt-2 font-semibold text-teal-700', variant === 'print' ? 'text-lg' : 'text-2xl')}>{formatReportNumber(metric.value)} <span className="text-sm font-medium">{metric.unit}</span></p>
      <p className={cn('mt-2 text-slate-500', variant === 'print' ? 'text-[9px]' : 'text-xs')}>{metric.description}</p>
    </div>
  )
}

function StatCard({ label, value, detail, variant = 'screen' }: { label: string; value: string; detail: string; variant?: ReportDocumentVariant }) {
  return (
    <div className={cn('rounded-xl bg-white text-slate-900 shadow-sm', variant === 'print' ? 'p-3' : 'p-4')}>
      <p className={cn('text-slate-600', variant === 'print' ? 'text-[10px]' : 'text-sm')}>{label}</p>
      <p className={cn('mt-2 font-semibold text-teal-700', variant === 'print' ? 'text-lg' : 'text-2xl')}>{value}</p>
      <p className={cn('mt-1 text-slate-500', variant === 'print' ? 'text-[9px]' : 'text-xs')}>{detail}</p>
    </div>
  )
}

function ComparisonChartCard({ title, description, data, unit, variant = 'screen' }: { title: string; description: string; data: Array<{ name: string; value: number; color: string }>; unit: string; variant?: ReportDocumentVariant }) {
  const isPrint = variant === 'print'

  return (
    <Card className={cn('border-0 shadow-sm', isPrint && 'rounded-xl')}>
      <CardHeader className={isPrint ? 'p-3 pb-1' : undefined}>
        <CardTitle className={isPrint ? 'text-[13px]' : 'text-xl'}>{title}</CardTitle>
        <p className={cn('text-muted-foreground', isPrint ? 'text-[9px] leading-4' : 'text-base')}>{description}</p>
      </CardHeader>
      <CardContent className={isPrint ? 'p-3 pt-1' : undefined}>
        <div className={isPrint ? 'h-[108px]' : 'h-[260px]'}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={data} margin={isPrint ? { left: -2, right: 0, top: 2, bottom: -6 } : { left: 0, right: 0, top: 4, bottom: 0 }} barCategoryGap={isPrint ? 12 : '10%'}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: isPrint ? 9 : 12 }} height={isPrint ? 20 : 30} />
              <YAxis width={isPrint ? 38 : 36} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: isPrint ? 8 : 12 }} tickFormatter={(value) => `${formatReportNumber(Number(value))} ${unit}`} />
              <Tooltip
                formatter={(value) => [`${formatReportNumber(Number(value))} ${unit}`, 'Nilai']}
                contentStyle={{ background: '#ffffff', border: '1px solid #d9e3dc', borderRadius: 8, color: '#1b2f24' }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={isPrint ? 34 : undefined}>
                {data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Bar>
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function ReportPreviewDocument({ preview, className, variant = 'screen' }: { preview: ReportPreviewResponse; className?: string; variant?: ReportDocumentVariant }) {
  const isPrint = variant === 'print'

  return (
    <div className={cn(isPrint ? 'space-y-3 bg-white text-slate-900' : 'space-y-6 bg-background text-foreground', className)}>
      <section className={cn('rounded-2xl bg-primary text-primary-foreground shadow-sm', isPrint ? 'p-4' : 'p-6')}>
        <div className={cn('border-b border-white/30', isPrint ? 'pb-3' : 'pb-4')}>
          <h2 className={cn('font-semibold', isPrint ? 'text-xl' : 'text-2xl')}>Sustainability Performance Highlights</h2>
          <p className={cn('text-primary-foreground/85', isPrint ? 'text-[10px]' : 'text-sm')}>{preview.metadata.company_name} · {preview.metadata.report_type.toUpperCase()} · {preview.metadata.period_label}</p>
        </div>
        <div className={cn('grid', isPrint ? 'mt-3 grid-cols-4 gap-3' : 'mt-5 gap-4 md:grid-cols-2 xl:grid-cols-4')}>
          {preview.highlights.filter((metric) => ['Total Energy', 'Estimated CO2e'].includes(metric.label)).map((metric) => <MetricCard key={metric.label} metric={metric} variant={variant} />)}
          <StatCard label="Potential Saving" value={`${formatReportNumber(preview.metrics.total_estimated_saving_kwh ?? 0)} kWh`} detail={formatReportCurrency(preview.metrics.total_estimated_saving_idr ?? 0)} variant={variant} />
          <StatCard label="CO2 Reduction Potential" value={`${formatReportNumber(preview.metrics.total_estimated_co2_reduction_kg ?? 0)} kg`} detail="Estimasi reduksi dari rekomendasi" variant={variant} />
        </div>
        <div className={cn('grid', isPrint ? 'mt-3 grid-cols-2 gap-3' : 'mt-5 gap-4 lg:grid-cols-2')}>
          <ComparisonChartCard
            title="Energi vs potensi hemat"
            description="Perbandingan konsumsi kWh aktual seluruh mesin dan potensi penghematan dalam rentang laporan."
            data={[
              { name: 'Energi aktual', value: preview.metrics.total_energy_kwh ?? 0, color: '#16a34a' },
              { name: 'Potensi hemat', value: preview.metrics.total_estimated_saving_kwh ?? 0, color: '#0f766e' },
            ]}
            unit="kWh"
            variant={variant}
          />
          <ComparisonChartCard
            title="Emisi vs potensi reduksi"
            description="Perbandingan estimasi CO2e aktual seluruh mesin dan potensi reduksi dari rekomendasi."
            data={[
              { name: 'Emisi aktual', value: preview.metrics.estimated_co2e_kg ?? 0, color: '#2563eb' },
              { name: 'Potensi reduksi', value: preview.metrics.total_estimated_co2_reduction_kg ?? 0, color: '#0891b2' },
            ]}
            unit="kg"
            variant={variant}
          />
        </div>
        <div className={cn('grid rounded-xl bg-white text-slate-900', isPrint ? 'mt-3 grid-cols-[44mm_1fr] gap-3 p-3' : 'mt-5 gap-4 p-4 md:grid-cols-[260px_1fr]')}>
          <h3 className={cn('font-semibold text-teal-700', isPrint ? 'text-[13px]' : 'text-lg')}>Operational Stability Amidst Emission Fluctuation</h3>
          <p className={cn('text-slate-700', isPrint ? 'text-[10px] leading-4' : 'text-sm leading-6')}>{preview.summary.executive_summary}</p>
        </div>
      </section>

      <div className={cn('grid', isPrint ? 'grid-cols-2 gap-3' : 'gap-4 lg:grid-cols-2')}>
        <Card>
          <CardHeader className={isPrint ? 'p-3 pb-1' : undefined}><CardTitle className={isPrint ? 'text-sm' : undefined}>Key Findings</CardTitle></CardHeader>
          <CardContent className={cn('space-y-2 text-muted-foreground', isPrint ? 'p-3 pt-1 text-[10px]' : 'text-sm')}>
            {preview.summary.key_findings.map((finding) => <p key={finding}>• {finding}</p>)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className={isPrint ? 'p-3 pb-1' : undefined}><CardTitle className={isPrint ? 'text-sm' : undefined}>Management Notes</CardTitle></CardHeader>
          <CardContent className={cn('space-y-2 text-muted-foreground', isPrint ? 'p-3 pt-1 text-[10px]' : 'text-sm')}>
            {preview.summary.management_notes.map((note) => <p key={note}>• {note}</p>)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className={isPrint ? 'p-3 pb-1' : undefined}><CardTitle className={isPrint ? 'text-sm' : undefined}>Top Machine Usage</CardTitle></CardHeader>
        <CardContent className={cn('overflow-x-auto', isPrint ? 'p-3 pt-1' : undefined)}>
          <table className={cn('w-full text-left', isPrint ? 'table-fixed text-[8px]' : 'text-sm')}>
            <thead className="border-b text-muted-foreground"><tr><th className="py-2">Mesin</th><th>Lokasi</th><th>Qty</th><th>kW</th><th>Jam</th><th>Energi kWh</th><th>Status</th><th>Sumber</th></tr></thead>
            <tbody>{preview.tables.machine_usage.map((row) => <tr key={`${row.machine}-${row.location}`} className="border-b"><td className="py-2 font-medium">{row.machine}</td><td>{row.location}</td><td>{row.quantity}</td><td>{formatReportNumber(row.power_kw)}</td><td>{formatReportNumber(row.usage_hours)}</td><td>{formatReportNumber(row.energy_kwh)}</td><td>{row.validation_status}</td><td>{row.data_source === 'csv_upload' ? 'CSV' : 'Form'}</td></tr>)}</tbody>
          </table>
        </CardContent>
      </Card>

      <div className={cn('grid items-start', isPrint ? 'grid-cols-2 gap-3' : 'gap-4 lg:grid-cols-2')}>
        <Card className="h-fit self-start">
          <CardHeader className={isPrint ? 'p-3 pb-1' : undefined}><CardTitle className={isPrint ? 'text-sm' : undefined}>Active Alerts</CardTitle></CardHeader>
          <CardContent className={cn('space-y-3', isPrint ? 'p-3 pt-1' : undefined)}>
            {preview.tables.alerts.length ? preview.tables.alerts.map((alert) => <div key={`${alert.type}-${alert.message}`} className={cn('rounded-lg border', isPrint ? 'p-2 text-[9px]' : 'p-3 text-sm')}><p className="font-medium"><span className={statusTextColor(alert.severity)}>{alert.severity}</span> · {alert.type} · <span className={statusTextColor(alert.status)}>{alert.status}</span></p><p className="text-muted-foreground">{alert.message}</p>{alert.triggered_value !== null ? <p className="text-xs text-muted-foreground">Triggered: {alert.triggered_value} · Threshold: {alert.threshold_value ?? '-'}</p> : null}</div>) : <p className={cn('text-muted-foreground', isPrint ? 'text-[10px]' : 'text-sm')}>Tidak ada alert aktif.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className={isPrint ? 'p-3 pb-1' : undefined}><CardTitle className={isPrint ? 'text-sm' : undefined}>Recommendations</CardTitle></CardHeader>
          <CardContent className={cn('space-y-3', isPrint ? 'p-3 pt-1' : undefined)}>
            {preview.tables.active_recommendations.length ? preview.tables.active_recommendations.map((recommendation) => <div key={`${recommendation.priority}-${recommendation.title}`} className={cn('rounded-lg border', isPrint ? 'p-2 text-[9px]' : 'p-3 text-sm')}><p className="font-medium"><span className={statusTextColor(recommendation.priority)}>{recommendation.priority}</span> · {recommendation.category} · {recommendation.title}</p><p className={cn('mt-1 text-muted-foreground', isPrint ? 'text-[9px]' : 'text-sm')}>{recommendation.recommendation_description}</p><p className="text-muted-foreground">{recommendation.machine}</p><p className="text-xs text-muted-foreground">Saving: {formatReportNumber(recommendation.estimated_saving_kwh)} kWh · {formatReportCurrency(recommendation.estimated_saving_idr)} · CO2 Reduction: {formatReportNumber(recommendation.estimated_co2_reduction_kg)} kg</p></div>) : <p className={cn('text-muted-foreground', isPrint ? 'text-[10px]' : 'text-sm')}>Tidak ada rekomendasi aktif.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
