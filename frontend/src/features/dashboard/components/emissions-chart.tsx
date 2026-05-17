import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

type EmissionsChartProps = {
  data: Array<{
    month: string
    actual_co2e_kg: string
    completed_reduction_kg: string
    net_co2e_kg: string
  }>
}

function formatMonth(value: string) {
  const [year, month] = value.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
}

function formatNumber(value: number) {
  return value.toLocaleString('id-ID', { maximumFractionDigits: 2 })
}

export function EmissionsChart({ data }: EmissionsChartProps) {
  const chartData = data.map((item) => ({
    month: formatMonth(item.month),
    actual: Number(item.actual_co2e_kg),
    net: Number(item.net_co2e_kg),
    reduction: Number(item.completed_reduction_kg),
  }))

  return (
    <div className="flex w-full flex-col">
      <div className="h-[320px] w-full">
        {chartData.length ? (
          <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ left: -18, right: 12, top: 12, bottom: 0 }}>
            <defs>
              <linearGradient id="actualEmissions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.04} />
              </linearGradient>
              <linearGradient id="netEmissions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0f766e" stopOpacity={0.24} />
                <stop offset="95%" stopColor="#0f766e" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} tickFormatter={(value) => formatNumber(Number(value))} />
            <Tooltip
              cursor={{ stroke: 'var(--primary)', strokeOpacity: 0.25 }}
              formatter={(value, name) => {
                const labels: Record<string, string> = {
                  actual: 'Emisi aktual',
                  net: 'Setelah rekomendasi selesai',
                  reduction: 'Reduksi selesai',
                }
                return [`${formatNumber(Number(value))} kg CO2e`, labels[String(name)] ?? String(name)]
              }}
              contentStyle={{
                background: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--popover-foreground)',
              }}
            />
            <Area type="monotone" dataKey="actual" stroke="var(--primary)" strokeWidth={3} fill="url(#actualEmissions)" name="actual" />
            <Area type="monotone" dataKey="net" stroke="#0f766e" strokeWidth={3} fill="url(#netEmissions)" name="net" />
          </AreaChart>
        </ResponsiveContainer>
        ) : (
          <div className="grid h-full place-items-center rounded-md border border-dashed bg-muted/30 text-sm text-muted-foreground">
            Belum ada data emisi untuk ditampilkan.
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-2"><span className="size-2 rounded-md bg-primary" />Emisi aktual</span>
        <span className="flex items-center gap-2"><span className="size-2 rounded-md bg-teal-700" />Setelah rekomendasi selesai</span>
      </div>
    </div>
  )
}
