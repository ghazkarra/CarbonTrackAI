import { Leaf } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingButton } from '@/components/ui/loading-button'
import { login } from '@/lib/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('operator@carboncore.ai')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await login(email, password)
      const from = (location.state as { from?: string } | null)?.from
      navigate(response.user.role === 'operator' ? from ?? '/dashboard' : '/dashboard/superadmin', { replace: true })
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-svh place-items-center bg-background px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Leaf className="size-6" />
          </div>
          <CardTitle>Login to CarbonTrackAI</CardTitle>
          <CardDescription>Access your company carbon dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="admin@company.com" className="rounded-md" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" className="rounded-md" value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="remember" />
            <Label htmlFor="remember" className="text-sm font-normal">Remember me</Label>
          </div>
          {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
          <LoadingButton className="w-full" isLoading={isSubmitting} type="submit">
            Login
          </LoadingButton>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            No account? <Link to="/register" className="text-primary hover:underline">Create one</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
