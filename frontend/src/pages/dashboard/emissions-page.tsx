import { EmissionsChart } from '@/features/dashboard/components/emissions-chart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function EmissionsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Emissions</CardTitle>
        <CardDescription>Scope 1, Scope 2, and supplier emissions overview.</CardDescription>
      </CardHeader>
      <CardContent>
        <EmissionsChart />
      </CardContent>
    </Card>
  )
}
