import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingButton } from '@/components/ui/loading-button'
import { Skeleton } from '@/components/ui/skeleton'
import type { CompanyOption, SuperadminUser } from '@/features/superadmin/types'
import { apiRequest, getApiErrorMessage } from '@/lib/api'
import { getStoredToken } from '@/lib/auth'

type UserDetailFormErrors = Partial<Record<'email' | 'name' | 'password', string>>

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateUserDetailForm(user: SuperadminUser, password: string) {
  const errors: UserDetailFormErrors = {}

  if (!user.name.trim()) {
    errors.name = 'Isi nama pengguna terlebih dahulu.'
  }

  if (!user.email.trim()) {
    errors.email = 'Isi email pengguna terlebih dahulu.'
  } else if (!emailPattern.test(user.email.trim())) {
    errors.email = 'Gunakan format email yang valid, contoh: admin@perusahaan.com.'
  }

  if (password && password.length < 6) {
    errors.password = 'Kata sandi baru minimal 6 karakter.'
  }

  return errors
}

export function SuperadminUserDetailPage() {
  const token = getStoredToken()
  const navigate = useNavigate()
  const { userId } = useParams()
  const [user, setUser] = useState<SuperadminUser | null>(null)
  const [companies, setCompanies] = useState<CompanyOption[]>([])
  const [password, setPassword] = useState('')
  const [formErrors, setFormErrors] = useState<UserDetailFormErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeactivating, setIsDeactivating] = useState(false)

  async function loadDetail() {
    if (!token || !userId) return
    setIsLoading(true)
    const [userData, companyData] = await Promise.all([
      apiRequest<SuperadminUser>(`/api/superadmin/users/${userId}`, { token }),
      apiRequest<CompanyOption[]>('/api/superadmin/companies', { token }),
    ])
    setUser(userData)
    setCompanies(companyData)
    setIsLoading(false)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadDetail().catch((loadError) => {
        setError(getApiErrorMessage(loadError, 'Gagal memuat detail pengguna. Muat ulang halaman atau kembali ke daftar pengguna.'))
        setIsLoading(false)
      })
    }, 0)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  function clearFormError(field: keyof UserDetailFormErrors) {
    setFormErrors((current) => {
      if (!current[field]) return current
      const nextErrors = { ...current }
      delete nextErrors[field]
      return nextErrors
    })
  }

  function updateUserField<K extends keyof SuperadminUser>(field: K, value: SuperadminUser[K]) {
    if (!user) return

    setUser({ ...user, [field]: value })
    if (field === 'name') clearFormError('name')
    if (field === 'email') clearFormError('email')
  }

  function updatePassword(value: string) {
    setPassword(value)
    clearFormError('password')
  }

  async function saveUser() {
    if (!token || !userId || !user) return
    setError(null)
    setMessage(null)
    const nextErrors = validateUserDetailForm(user, password)

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors)
      return
    }

    setIsSaving(true)
    try {
      const updated = await apiRequest<SuperadminUser>(`/api/superadmin/users/${userId}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({
          name: user.name.trim(),
          email: user.email.trim().toLowerCase(),
          role: user.role,
          company_id: user.company_id,
          is_active: user.is_active,
          ...(password ? { password } : {}),
        }),
      })
      setUser(updated)
      setPassword('')
      setFormErrors({})
      setMessage('Data pengguna berhasil diperbarui.')
    } catch (saveError) {
      setError(getApiErrorMessage(saveError, 'Gagal menyimpan perubahan. Periksa kembali data pengguna lalu coba lagi.'))
    } finally {
      setIsSaving(false)
    }
  }

  async function deactivateUser() {
    if (!token || !userId) return
    setError(null)
    setMessage(null)
    setIsDeactivating(true)
    try {
      const updated = await apiRequest<SuperadminUser>(`/api/superadmin/users/${userId}`, { method: 'DELETE', token })
      setUser(updated)
      setMessage('Pengguna berhasil dinonaktifkan.')
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, 'Gagal menonaktifkan pengguna. Coba lagi beberapa saat.'))
    } finally {
      setIsDeactivating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/15">Superadmin</Badge>
        <h1 className="text-4xl font-semibold tracking-tight">Detail pengguna</h1>
        <p className="mt-3 text-base text-muted-foreground">Tinjau akses, perbarui data profil, atau nonaktifkan akun ini.</p>
      </div>

      {message ? <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">{message}</p> : null}
      {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{isLoading ? <Skeleton className="h-6 w-48" /> : user?.name ?? 'Pengguna tidak ditemukan'}</CardTitle>
          <CardDescription className="text-base">{user ? `Dibuat ${new Date(user.created_at).toLocaleDateString('id-ID')}` : 'Detail pengguna tidak tersedia.'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {isLoading || !user ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-10 w-full" />)}
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="user-name" className="text-base">Nama</Label>
                  <Input
                    id="user-name"
                    className="h-11 text-base md:text-base"
                    value={user.name}
                    aria-invalid={Boolean(formErrors.name)}
                    aria-describedby={formErrors.name ? 'user-name-error' : undefined}
                    onChange={(event) => updateUserField('name', event.target.value)}
                  />
                  {formErrors.name ? <p id="user-name-error" className="text-xs font-medium text-destructive">{formErrors.name}</p> : null}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="user-email" className="text-base">Email</Label>
                  <Input
                    id="user-email"
                    className="h-11 text-base md:text-base"
                    type="email"
                    value={user.email}
                    aria-invalid={Boolean(formErrors.email)}
                    aria-describedby={formErrors.email ? 'user-email-error' : undefined}
                    onChange={(event) => updateUserField('email', event.target.value)}
                  />
                  {formErrors.email ? <p id="user-email-error" className="text-xs font-medium text-destructive">{formErrors.email}</p> : null}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="user-role" className="text-base">Peran</Label>
                  <select id="user-role" className="h-11 cursor-pointer rounded-lg border border-input bg-background px-3 text-base" value={user.role} onChange={(event) => updateUserField('role', event.target.value as SuperadminUser['role'])}>
                    <option value="operator">Operator</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="user-company" className="text-base">Perusahaan</Label>
                  <select id="user-company" className="h-11 cursor-pointer rounded-lg border border-input bg-background px-3 text-base" value={user.company_id ?? ''} onChange={(event) => updateUserField('company_id', event.target.value ? Number(event.target.value) : null)}>
                    <option value="">Tanpa perusahaan</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>{company.company_name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="user-status" className="text-base">Status</Label>
                  <select id="user-status" className="h-11 cursor-pointer rounded-lg border border-input bg-background px-3 text-base" value={user.is_active ? 'active' : 'inactive'} onChange={(event) => updateUserField('is_active', event.target.value === 'active')}>
                    <option value="active">Aktif</option>
                    <option value="inactive">Nonaktif</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="user-password" className="text-base">Kata sandi baru</Label>
                  <Input
                    id="user-password"
                    className="h-11 text-base md:text-base"
                    type="password"
                    value={password}
                    placeholder="Kosongkan jika tidak ingin mengubah kata sandi"
                    aria-invalid={Boolean(formErrors.password)}
                    aria-describedby={formErrors.password ? 'user-password-error' : undefined}
                    onChange={(event) => updatePassword(event.target.value)}
                  />
                  {formErrors.password ? <p id="user-password-error" className="text-xs font-medium text-destructive">{formErrors.password}</p> : null}
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <Button variant="outline" asChild>
                  <Link to="/dashboard/superadmin">Kembali ke pengguna</Link>
                </Button>
                <div className="flex gap-2">
                  <LoadingButton variant="outline" disabled={!user.is_active} isLoading={isDeactivating} onClick={deactivateUser}>
                    Nonaktifkan
                  </LoadingButton>
                  <LoadingButton isLoading={isSaving} onClick={saveUser}>Simpan perubahan</LoadingButton>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      {!isLoading && !user ? <Button variant="outline" onClick={() => navigate('/dashboard/superadmin')}>Kembali ke pengguna</Button> : null}
    </div>
  )
}
