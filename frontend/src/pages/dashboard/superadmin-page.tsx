import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingButton } from '@/components/ui/loading-button'
import { Skeleton } from '@/components/ui/skeleton'
import type { CompanyOption, SuperadminUser } from '@/features/superadmin/types'
import { apiRequest } from '@/lib/api'
import { getStoredToken } from '@/lib/auth'

const emptyForm = {
  name: '',
  email: '',
  role: 'operator' as SuperadminUser['role'],
  company_id: '',
  password: '',
  is_active: true,
}

export function SuperadminPage() {
  const token = getStoredToken()
  const [users, setUsers] = useState<SuperadminUser[]>([])
  const [companies, setCompanies] = useState<CompanyOption[]>([])
  const [form, setForm] = useState(emptyForm)
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
        setError(loadError instanceof Error ? loadError.message : 'Failed to load superadmin users')
        setIsLoading(false)
      })
    }, 0)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sortedUsers = useMemo(() => [...users].sort((first, second) => Number(second.is_active) - Number(first.is_active)), [users])

  async function createUser() {
    if (!token) return
    setError(null)
    setMessage(null)
    setIsSaving(true)
    try {
      await apiRequest<SuperadminUser>('/api/superadmin/users', {
        method: 'POST',
        token,
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          role: form.role,
          company_id: form.company_id ? Number(form.company_id) : null,
          password: form.password,
          is_active: form.is_active,
        }),
      })
      setMessage('User created.')
      setForm(emptyForm)
      await loadUsers()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to create user')
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
      setMessage('User deactivated.')
      await loadUsers()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to deactivate user')
    } finally {
      setDeactivatingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/15">Superadmin</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">User management</h1>
        <p className="mt-2 text-sm text-muted-foreground">Create, review, update, and deactivate CarbonTrackAI user access.</p>
      </div>

      {message ? <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">{message}</p> : null}
      {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Create user</CardTitle>
          <CardDescription>Password is required only when creating a new account.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_180px_200px_1fr_auto] xl:items-end">
          <div className="grid gap-2">
            <Label htmlFor="new-user-name">Name</Label>
            <Input id="new-user-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-user-email">Email</Label>
            <Input id="new-user-email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-user-role">Role</Label>
            <select id="new-user-role" className="h-10 cursor-pointer rounded-lg border border-input bg-background px-3 text-sm" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as SuperadminUser['role'] })}>
              <option value="operator">Operator</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-user-company">Company</Label>
            <select id="new-user-company" className="h-10 cursor-pointer rounded-lg border border-input bg-background px-3 text-sm" value={form.company_id} onChange={(event) => setForm({ ...form, company_id: event.target.value })}>
              <option value="">No company</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>{company.company_name}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="new-user-password">Password</Label>
            <Input id="new-user-password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
          </div>
          <LoadingButton isLoading={isSaving} onClick={createUser}>Create</LoadingButton>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Active users appear first. Delete deactivates access without removing history.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b text-muted-foreground">
              <tr>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Company</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4 text-right">Actions</th>
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
                  <td className="py-3 pr-4"><Badge variant={user.is_active ? 'outline' : 'secondary'}>{user.is_active ? 'Active' : 'Inactive'}</Badge></td>
                  <td className="py-3 pr-4">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" asChild>
                        <Link to={`/dashboard/superadmin/users/${user.id}`}>Detail</Link>
                      </Button>
                      <LoadingButton variant="outline" disabled={!user.is_active} isLoading={deactivatingId === user.id} onClick={() => deactivateUser(user.id)}>
                        Deactivate
                      </LoadingButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && !users.length ? <p className="py-6 text-sm text-muted-foreground">No users found.</p> : null}
        </CardContent>
      </Card>
    </div>
  )
}
