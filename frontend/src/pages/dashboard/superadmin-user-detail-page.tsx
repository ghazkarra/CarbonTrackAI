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
import { apiRequest } from '@/lib/api'
import { getStoredToken } from '@/lib/auth'

export function SuperadminUserDetailPage() {
  const token = getStoredToken()
  const navigate = useNavigate()
  const { userId } = useParams()
  const [user, setUser] = useState<SuperadminUser | null>(null)
  const [companies, setCompanies] = useState<CompanyOption[]>([])
  const [password, setPassword] = useState('')
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
        setError(loadError instanceof Error ? loadError.message : 'Failed to load user detail')
        setIsLoading(false)
      })
    }, 0)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function saveUser() {
    if (!token || !userId || !user) return
    setError(null)
    setMessage(null)
    setIsSaving(true)
    try {
      const updated = await apiRequest<SuperadminUser>(`/api/superadmin/users/${userId}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          role: user.role,
          company_id: user.company_id,
          is_active: user.is_active,
          ...(password ? { password } : {}),
        }),
      })
      setUser(updated)
      setPassword('')
      setMessage('User updated.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update user')
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
      setMessage('User deactivated.')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to deactivate user')
    } finally {
      setIsDeactivating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/15">Superadmin</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">User detail</h1>
        <p className="mt-2 text-sm text-muted-foreground">Review access details, update profile data, or deactivate this account.</p>
      </div>

      {message ? <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">{message}</p> : null}
      {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>{isLoading ? <Skeleton className="h-6 w-48" /> : user?.name ?? 'User not found'}</CardTitle>
          <CardDescription>{user ? `Created ${new Date(user.created_at).toLocaleDateString('en-US')}` : 'User detail is unavailable.'}</CardDescription>
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
                  <Label htmlFor="user-name">Name</Label>
                  <Input id="user-name" value={user.name} onChange={(event) => setUser({ ...user, name: event.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="user-email">Email</Label>
                  <Input id="user-email" type="email" value={user.email} onChange={(event) => setUser({ ...user, email: event.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="user-role">Role</Label>
                  <select id="user-role" className="h-10 cursor-pointer rounded-lg border border-input bg-background px-3 text-sm" value={user.role} onChange={(event) => setUser({ ...user, role: event.target.value as SuperadminUser['role'] })}>
                    <option value="operator">Operator</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="user-company">Company</Label>
                  <select id="user-company" className="h-10 cursor-pointer rounded-lg border border-input bg-background px-3 text-sm" value={user.company_id ?? ''} onChange={(event) => setUser({ ...user, company_id: event.target.value ? Number(event.target.value) : null })}>
                    <option value="">No company</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>{company.company_name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="user-status">Status</Label>
                  <select id="user-status" className="h-10 cursor-pointer rounded-lg border border-input bg-background px-3 text-sm" value={user.is_active ? 'active' : 'inactive'} onChange={(event) => setUser({ ...user, is_active: event.target.value === 'active' })}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="user-password">New password</Label>
                  <Input id="user-password" type="password" value={password} placeholder="Leave blank to keep current password" onChange={(event) => setPassword(event.target.value)} />
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <Button variant="outline" asChild>
                  <Link to="/dashboard/superadmin">Back to users</Link>
                </Button>
                <div className="flex gap-2">
                  <LoadingButton variant="outline" disabled={!user.is_active} isLoading={isDeactivating} onClick={deactivateUser}>
                    Deactivate
                  </LoadingButton>
                  <LoadingButton isLoading={isSaving} onClick={saveUser}>Save changes</LoadingButton>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      {!isLoading && !user ? <Button variant="outline" onClick={() => navigate('/dashboard/superadmin')}>Back to users</Button> : null}
    </div>
  )
}
