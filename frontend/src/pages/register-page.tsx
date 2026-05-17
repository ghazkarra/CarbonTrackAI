import { Link } from 'react-router-dom'
import { BrandMark } from '@/components/layout/brand-mark'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function RegisterPage() {
  return (
    <div className="grid min-h-svh place-items-center bg-background px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <BrandMark className="mx-auto mb-3 size-12 rounded-[20px]" iconClassName="size-7" />
          <CardTitle>Buat ruang kerja perusahaan</CardTitle>
          <CardDescription>Mulai pantau emisi dengan dasbor CarbonTrackAI.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="company">Perusahaan</Label>
            <Input id="company" placeholder="PT Sejawat Energi" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name">Nama lengkap</Label>
            <Input id="name" placeholder="Nama pengguna" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="jane@company.com" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Kata sandi</Label>
            <Input id="password" type="password" />
          </div>
          <Button className="w-full" asChild>
            <Link to="/dashboard">Buat ruang kerja</Link>
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Sudah terdaftar? <Link to="/login" className="text-primary hover:underline">Masuk</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
