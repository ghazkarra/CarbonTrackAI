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
  const max = 60

  return (
    <div className="h-[320px] w-full">
      <div className="flex h-full items-end gap-3 sm:gap-5">
        {data.map((item) => (
          <div key={item.month} className="flex min-w-0 flex-1 flex-col items-center gap-3">
            <div className="flex h-64 w-full items-end justify-center gap-1.5 rounded-md bg-muted/40 px-2 py-3">
              <div
                className="w-3 rounded-t-full bg-primary shadow-sm shadow-primary/30 sm:w-4"
                style={{ height: `${(item.emissions / max) * 100}%` }}
                title={`${item.emissions} tCO2e`}
              />
              <div
                className="w-3 rounded-t-full bg-primary/25 sm:w-4"
                style={{ height: `${(item.target / max) * 100}%` }}
                title={`${item.target} tCO2e target`}
              />
            </div>
            <span className="text-xs text-muted-foreground">{item.month}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-2"><span className="size-2 rounded-md bg-primary" />Actual</span>
        <span className="flex items-center gap-2"><span className="size-2 rounded-md bg-primary/25" />Target</span>
      </div>
    </div>
  )
}
