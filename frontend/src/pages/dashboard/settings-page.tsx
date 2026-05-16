import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function SettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>Organization profile and reporting defaults.</CardDescription>
      </CardHeader>
      <CardContent className="grid max-w-xl gap-4">
        <div className="grid gap-2">
          <Label htmlFor="company">Company name</Label>
          <Input id="company" defaultValue="CarbonTrackAI Demo Company" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="baseline">Baseline year</Label>
          <Input id="baseline" defaultValue="2024" />
        </div>
      </CardContent>
    </Card>
  )
}
