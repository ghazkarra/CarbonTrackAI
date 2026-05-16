import { FiArrowDownRight as ArrowDownRight, FiArrowUpRight as ArrowUpRight } from 'react-icons/fi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

type MetricCardProps = {
  title: string
  value: string
  change: string
  tone: 'good' | 'neutral'
  isLoading?: boolean
}

export function MetricCard({ title, value, change, tone, isLoading = false }: MetricCardProps) {
  const Icon = tone === 'good' ? ArrowDownRight : ArrowUpRight

  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="rounded-md bg-primary/10 p-2 text-primary">
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-semibold tracking-tight">{value}</div>
            <p className="mt-1 text-xs text-muted-foreground">{change}</p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
