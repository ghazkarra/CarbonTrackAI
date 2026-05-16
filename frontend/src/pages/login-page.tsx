import { FiArrowRight as ArrowRight, FiEye as Eye, FiEyeOff as EyeOff, FiLoader as LoaderCircle, FiLock as LockKeyhole, FiMail as Mail, FiShield as ShieldCheck } from 'react-icons/fi'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BrandMark } from '@/components/layout/brand-mark'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login } from '@/lib/auth'
import { cn } from '@/lib/utils'

const rememberedEmailKey = 'carbontrackai:remembered-email'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState(() => window.localStorage.getItem(rememberedEmailKey) ?? 'operator@carboncore.ai')
  const [password, setPassword] = useState('password')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await login(email, password)
      const from = (location.state as { from?: string } | null)?.from

      if (remember) {
        window.localStorage.setItem(rememberedEmailKey, email)
      } else {
        window.localStorage.removeItem(rememberedEmailKey)
      }

      navigate(response.user.role === 'operator' ? from ?? '/dashboard' : '/dashboard/superadmin', { replace: true })
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Masuk gagal. Coba periksa email dan kata sandi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-shell min-h-svh overflow-hidden bg-[#f8faf8] text-slate-950">
      <div className="grid min-h-svh lg:grid-cols-[minmax(420px,0.9fr)_minmax(520px,1.1fr)]">
        <section className="login-brand-panel relative flex min-h-[430px] overflow-hidden bg-[#0f3a1d] px-6 py-7 text-white sm:px-10 lg:min-h-svh lg:px-12">
          <div className="pointer-events-none absolute -bottom-28 -left-24 size-64 rounded-full bg-white/8 login-orbit-slow" />
          <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-white/8 login-orbit" />
          <div className="pointer-events-none absolute right-[9%] top-[51%] size-36 rounded-full bg-emerald-400/8 login-float" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_30%,rgba(34,197,94,0.18),transparent_28%),linear-gradient(140deg,rgba(13,79,35,0.96),rgba(7,35,18,0.98))]" />

          <div className="relative z-10 flex w-full flex-col">
            <Link to="/" className="login-rise group inline-flex w-fit items-center gap-3 rounded-[8px] text-white outline-none transition focus-visible:ring-3 focus-visible:ring-emerald-300/50">
              <BrandMark className="shadow-lg shadow-emerald-950/25 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105" />
              <span className="text-xl font-bold">CarbonTrackAI</span>
            </Link>

            <div className="my-auto max-w-[560px] py-16 lg:py-0">
              <h1 className="login-rise mt-8 max-w-xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-[3.25rem]">
                Pantau emisi industri, <span className="text-yellow-400">jaga bumi tetap lestari.</span> 
              </h1>
              <p className="login-rise mt-4 max-w-md text-base leading-7 text-emerald-100/85">
                Platform tracking dan rekomendasi emisi untuk industri besar dan menengah di Indonesia.
              </p>
            </div>

            <dl className="login-rise grid max-w-md grid-cols-[1fr_auto_1fr] items-end gap-8 pb-2">
              <div>
                <dt className="text-3xl font-black">12+</dt>
                <dd className="mt-1 text-xs text-emerald-200/80">Sektor industri</dd>
              </div>
              <div className="h-14 w-px bg-emerald-300/35" />
              <div>
                <dt className="text-3xl font-black">Real-time</dt>
                <dd className="mt-1 text-xs text-emerald-200/80">Monitoring emisi</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="relative grid min-h-[620px] place-items-center px-5 py-10 sm:px-8 lg:min-h-svh">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_18%,rgba(16,185,129,0.09),transparent_24%),radial-gradient(circle_at_20%_84%,rgba(20,184,166,0.08),transparent_24%)]" />
          <div className="login-card-pop relative w-full max-w-[440px] rounded-[8px] border border-slate-200/90 bg-white/90 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur sm:p-8">
            <div className="mb-8">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-[8px] bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                  <ShieldCheck className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-emerald-700">Akses aman.</p>
                  <p className="text-xs text-slate-500">Masuk CarbonTrackAI</p>
                </div>
              </div>
              <h2 className="text-2xl font-black text-center text-slate-950">Selamat datang kembali!</h2>
              <p className="mt-3 text-sm leading-6 text-center text-slate-500">Masuk ke akun industri Anda untuk melanjutkan.</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                  Email perusahaan
                </Label>
                <div className="group relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-600" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="nama@perusahaan.com"
                    className="h-12 rounded-full border-slate-200 bg-slate-50 pl-11 pr-4 text-sm transition-all placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-emerald-100"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                    Kata sandi
                  </Label>
                  <a href="mailto:admin@carboncore.ai" className="text-xs font-semibold text-emerald-700 transition hover:text-emerald-600 focus-visible:rounded focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-100">
                    Lupa kata sandi?
                  </a>
                </div>
                <div className="group relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-600" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="h-12 rounded-full border-slate-200 bg-slate-50 pl-11 pr-12 text-sm transition-all placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-emerald-100"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition hover:bg-white hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-100"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <label className="group flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                  <Checkbox
                    checked={remember}
                    onCheckedChange={(checked) => setRemember(checked === true)}
                    className="size-4 rounded-[5px] border-slate-300 data-checked:border-emerald-700 data-checked:bg-emerald-700"
                  />
                  <span className="select-none transition group-hover:text-slate-900">Ingat email saya</span>
                </label>
                </div>

              {error ? (
                <p className="login-error rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                  {error}
                </p>
              ) : null}

              <Button
                className={cn(
                  'h-12 w-full overflow-hidden rounded-full bg-[#08763a] text-base font-bold text-white shadow-lg shadow-emerald-900/15 transition-all hover:-translate-y-0.5 hover:bg-[#066b35] hover:shadow-xl hover:shadow-emerald-900/20 focus-visible:ring-4 focus-visible:ring-emerald-200',
                  isSubmitting && 'cursor-wait'
                )}
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Memproses
                  </>
                ) : (
                  <>
                    Masuk
                    <ArrowRight className="size-4 transition-transform group-hover/button:translate-x-0.5" />
                  </>
                )}
              </Button>
            </form>

            <div className="my-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-xs text-slate-300">
              <span className="h-px bg-slate-200" />
              <span>Atau</span>
              <span className="h-px bg-slate-200" />
            </div>

            <p className="text-center text-sm leading-6 text-slate-500">
              Belum punya akun?{' '}
              <span className="font-semibold text-emerald-700">
                Hubungi admin
              </span>{" "}
              untuk pendaftaran.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
