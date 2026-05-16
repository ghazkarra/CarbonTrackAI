import { facilities } from '@/features/dashboard/data'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function FacilitiesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Facilities</CardTitle>
        <CardDescription>Tracked company locations and data completeness.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        {facilities.map((facility) => (
          <div key={facility.name} className="rounded-md border bg-card p-4">
            <p className="font-medium">{facility.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{facility.completeness}% data completeness</p>
            <p className="mt-3 text-2xl font-semibold text-primary">{facility.emissions}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
