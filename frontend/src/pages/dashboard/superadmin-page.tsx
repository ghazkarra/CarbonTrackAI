import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Dialog } from 'radix-ui'
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

const emptyForm = {
  name: '',
  email: '',
  role: 'operator' as SuperadminUser['role'],
  company_id: '',
  password: '',
  is_active: true,
}

type CreateUserFormErrors = Partial<Record<'email' | 'name' | 'password', string>>

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateCreateUserForm(form: typeof emptyForm) {
  const errors: CreateUserFormErrors = {}

  if (!form.name.trim()) {
    errors.name = 'Isi nama pengguna terlebih dahulu.'
  }

  if (!form.email.trim()) {
    errors.email = 'Isi email perusahaan terlebih dahulu.'
  } else if (!emailPattern.test(form.email.trim())) {
    errors.email = 'Gunakan format email yang valid, contoh: admin@perusahaan.com.'
  }

  if (!form.password) {
    errors.password = 'Isi kata sandi untuk akun baru.'
  } else if (form.password.length < 6) {
    errors.password = 'Kata sandi minimal 6 karakter.'
  }

  return errors
}

export function SuperadminPage() {
  const token = getStoredToken()
  const [users, setUsers] = useState<SuperadminUser[]>([])
  const [companies, setCompanies] = useState<CompanyOption[]>([])
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState<CreateUserFormErrors>({})
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null)

  async function loadUsers() {
    if (!token) return
    setIsLoading(true)
    const data = await apiRequest<SuperadminUser[]>('/api/superadmin/users', { token })
    setUsers(data)
    setIsLoading(false)
  }

  async function loadCompanies() {
    if (!token) return
    const data = await apiRequest<CompanyOption[]>('/api/superadmin/companies', { token })
    setCompanies(data)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      Promise.all([loadUsers(), loadCompanies()]).catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : 'Gagal memuat data pengguna superadmin')
        setIsLoading(false)
      })
    }, 0)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sortedUsers = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase()

    return [...users]
      .filter((user) => {
        if (!normalizedSearch) return true

        const searchableText = [
          user.name,
          user.email,
          user.role,
          user.company_name ?? '-',
          user.is_active ? 'aktif' : 'nonaktif',
        ].join(' ').toLowerCase()

        return searchableText.includes(normalizedSearch)
      })
      .sort((first, second) => first.name.localeCompare(second.name, 'id', { sensitivity: 'base' }))
  }, [searchQuery, users])

  function clearFormError(field: keyof CreateUserFormErrors) {
    setFormErrors((current) => {
      if (!current[field]) return current
      const nextErrors = { ...current }
      delete nextErrors[field]
      return nextErrors
    })
  }

  function updateForm<K extends keyof typeof emptyForm>(field: K, value: (typeof emptyForm)[K]) {
    setForm((current) => ({ ...current, [field]: value }))

    if (field === 'name') clearFormError('name')
    if (field === 'email') clearFormError('email')
    if (field === 'password') clearFormError('password')
  }

  function handleCreateDialogOpenChange(open: boolean) {
    if (isSaving) return

    setCreateDialogOpen(open)

    if (!open) {
      setForm(emptyForm)
      setFormErrors({})
      setCreateError(null)
    }
  }

  async function createUser() {
    if (!token) return
    setCreateError(null)
    setMessage(null)
    const nextErrors = validateCreateUserForm(form)

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors)
      return
    }

    setIsSaving(true)
    try {
      await apiRequest<SuperadminUser>('/api/superadmin/users', {
        method: 'POST',
        token,
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          role: form.role,
          company_id: form.company_id ? Number(form.company_id) : null,
          password: form.password,
          is_active: form.is_active,
        }),
      })
      setMessage('Pengguna berhasil dibuat.')
      setForm(emptyForm)
      setFormErrors({})
      setCreateDialogOpen(false)
      await loadUsers()
    } catch (saveError) {
      setCreateError(getApiErrorMessage(saveError, 'Gagal membuat pengguna. Periksa kembali isian akun operator.'))
    } finally {
      setIsSaving(false)
    }
  }

  async function deactivateUser(userId: number) {
    if (!token) return
    setError(null)
    setMessage(null)
    setDeactivatingId(userId)
    try {
      await apiRequest<SuperadminUser>(`/api/superadmin/users/${userId}`, { method: 'DELETE', token })
      setMessage('Pengguna berhasil dinonaktifkan.')
      await loadUsers()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Gagal menonaktifkan pengguna')
    } finally {
      setDeactivatingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/15">Superadmin</Badge>
        <h1 className="text-4xl font-semibold tracking-tight">Manajemen Pengguna</h1>
        <p className="mt-3 text-base text-muted-foreground">Buat, tinjau, ubah, dan nonaktifkan akses operator CarbonTrackAI.</p>
        <Button className="mt-5 h-11 rounded-lg px-5 text-base" onClick={() => setCreateDialogOpen(true)}>
          Input Akun Operator Baru
        </Button>
      </div>

      {message ? <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">{message}</p> : null}
      {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

      <Dialog.Root open={createDialogOpen} onOpenChange={handleCreateDialogOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm data-closed:animate-out data-closed:fade-out-0 data-open:animate-in data-open:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-popover p-6 text-popover-foreground shadow-2xl data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95">
            <Dialog.Title className="text-2xl font-semibold">Input Akun Operator Baru</Dialog.Title>
            <Dialog.Description className="mt-2 text-base text-muted-foreground">
              Lengkapi data akun operator. Kata sandi wajib diisi minimal 6 karakter.
            </Dialog.Description>

            {createError ? <p className="mt-5 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{createError}</p> : null}

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="grid min-w-0 gap-2">
                <Label htmlFor="new-user-name" className="text-base">Nama</Label>
                <Input
                  id="new-user-name"
                  className="h-11 text-base md:text-base"
                  value={form.name}
                  aria-invalid={Boolean(formErrors.name)}
                  aria-describedby={formErrors.name ? 'new-user-name-error' : undefined}
                  placeholder="Masukkan nama pengguna"
                  onChange={(event) => updateForm('name', event.target.value)}
                />
                {formErrors.name ? <p id="new-user-name-error" className="text-xs font-medium text-destructive">{formErrors.name}</p> : null}
              </div>
              <div className="grid min-w-0 gap-2">
                <Label htmlFor="new-user-email" className="text-base">Email</Label>
                <Input
                  id="new-user-email"
                  type="email"
                  className="h-11 text-base md:text-base"
                  value={form.email}
                  aria-invalid={Boolean(formErrors.email)}
                  aria-describedby={formErrors.email ? 'new-user-email-error' : undefined}
                  placeholder="contoh@perusahaan.com"
                  onChange={(event) => updateForm('email', event.target.value)}
                />
                {formErrors.email ? <p id="new-user-email-error" className="text-xs font-medium text-destructive">{formErrors.email}</p> : null}
              </div>
              <div className="grid min-w-0 gap-2">
                <Label htmlFor="new-user-role" className="text-base">Peran</Label>
                <select id="new-user-role" className="h-11 w-full min-w-0 cursor-pointer rounded-lg border border-input bg-background px-3 text-base" value={form.role} onChange={(event) => updateForm('role', event.target.value as SuperadminUser['role'])}>
                  <option value="operator">Operator</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>
              <div className="grid min-w-0 gap-2">
                <Label htmlFor="new-user-company" className="text-base">Perusahaan</Label>
                <select id="new-user-company" className="h-11 w-full min-w-0 cursor-pointer rounded-lg border border-input bg-background px-3 text-base" value={form.company_id} onChange={(event) => updateForm('company_id', event.target.value)}>
                  <option value="">Tanpa perusahaan</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>{company.company_name}</option>
                  ))}
                </select>
              </div>
              <div className="grid min-w-0 gap-2 md:col-span-2">
                <Label htmlFor="new-user-password" className="text-base">Kata sandi</Label>
                <Input
                  id="new-user-password"
                  type="password"
                  className="h-11 text-base md:text-base"
                  value={form.password}
                  aria-invalid={Boolean(formErrors.password)}
                  aria-describedby={formErrors.password ? 'new-user-password-error' : undefined}
                  placeholder="Minimal 6 karakter"
                  onChange={(event) => updateForm('password', event.target.value)}
                />
                {formErrors.password ? <p id="new-user-password-error" className="text-xs font-medium text-destructive">{formErrors.password}</p> : null}
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Dialog.Close asChild>
                <Button variant="outline" disabled={isSaving}>Batal</Button>
              </Dialog.Close>
              <LoadingButton className="h-11 text-base" isLoading={isSaving} onClick={createUser}>Submit Akun</LoadingButton>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Card>
        <CardHeader className="gap-4 lg:grid-cols-[1fr_minmax(280px,420px)] lg:items-start">
          <div>
            <CardTitle className="text-2xl">Pengguna</CardTitle>
            <CardDescription className="text-base">Daftar diurutkan berdasarkan nama. Nonaktifkan akses tanpa menghapus riwayat.</CardDescription>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="user-search" className="text-base">Cari pengguna</Label>
            <Input
              id="user-search"
              className="h-11 text-base md:text-base"
              value={searchQuery}
              placeholder="Cari nama, email, perusahaan, status..."
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-base">
            <thead className="border-b text-muted-foreground">
              <tr>
                <th className="py-2 pr-4">Nama</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Peran</th>
                <th className="py-2 pr-4">Perusahaan</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? Array.from({ length: 5 }).map((_, rowIndex) => (
                <tr key={rowIndex} className="border-b last:border-0">
                  {Array.from({ length: 6 }).map((__, cellIndex) => (
                    <td key={cellIndex} className="py-3 pr-4"><Skeleton className="h-4 w-28" /></td>
                  ))}
                </tr>
              )) : sortedUsers.map((user) => (
                <tr key={user.id} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-medium">{user.name}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{user.email}</td>
                  <td className="py-3 pr-4 capitalize">{user.role}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{user.company_name ?? '-'}</td>
                  <td className="py-3 pr-4">
                    <Badge className={user.is_active ? 'bg-emerald-600 text-white hover:bg-emerald-600' : 'bg-red-600 text-white hover:bg-red-600'}>
                      {user.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" asChild>
                        <Link to={`/dashboard/superadmin/users/${user.id}`}>Detail</Link>
                      </Button>
                      <LoadingButton variant="outline" disabled={!user.is_active} isLoading={deactivatingId === user.id} onClick={() => deactivateUser(user.id)}>
                        Nonaktifkan
                      </LoadingButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && !users.length ? <p className="py-6 text-base text-muted-foreground">Belum ada pengguna.</p> : null}
          {!isLoading && users.length > 0 && !sortedUsers.length ? <p className="py-6 text-base text-muted-foreground">Tidak ada pengguna yang cocok dengan pencarian.</p> : null}
        </CardContent>
      </Card>
    </div>
  )
}
