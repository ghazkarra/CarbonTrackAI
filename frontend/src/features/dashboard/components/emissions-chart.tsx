import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const data = [
  { month: 'Jan', emissions: 58, target: 52 },
  { month: 'Feb', emissions: 54, target: 50 },
  { month: 'Mar', emissions: 49, target: 48 },
  { month: 'Apr', emissions: 47, target: 46 },
  { month: 'May', emissions: 45, target: 44 },
  { month: 'Jun', emissions: 43, target: 42 },
  { month: 'Jul', emissions: 41, target: 40 },
  { month: 'Aug', emissions: 39, target: 38 },
] as const

export function EmissionsChart() {
  return (
    <div className="flex h-full min-h-[300px] w-full flex-col">
      <div className="min-h-0 flex-1">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: -18, right: 12, top: 12, bottom: 0 }}>
          <defs>
            <linearGradient id="actualEmissions" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.04} />
            </linearGradient>
            <linearGradient id="targetEmissions" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--muted-foreground)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="var(--muted-foreground)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
          <Tooltip
            cursor={{ stroke: 'var(--primary)', strokeOpacity: 0.25 }}
            contentStyle={{
              background: 'var(--popover)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--popover-foreground)',
            }}
          />
          <Area type="monotone" dataKey="target" stroke="var(--muted-foreground)" strokeWidth={2} fill="url(#targetEmissions)" name="Target" />
          <Area type="monotone" dataKey="emissions" stroke="var(--primary)" strokeWidth={3} fill="url(#actualEmissions)" name="Aktual" />
        </AreaChart>
      </ResponsiveContainer>
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-2"><span className="size-2 rounded-md bg-primary" />Aktual</span>
        <span className="flex items-center gap-2"><span className="size-2 rounded-md bg-muted-foreground" />Target</span>
      </div>
    </div>
  )
}
