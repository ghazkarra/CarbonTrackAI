import {
  FiArrowLeft as ArrowLeft,
  FiArrowRight as ArrowRight,
  FiCheckCircle as CheckCircle2,
  FiChevronRight as ChevronRight,
  FiClipboard as ClipboardCheck,
  FiCpu as Factory,
  FiGrid as Building2,
  FiHeart as Heart,
  FiMail as Mail,
  FiMapPin as MapPin,
  FiMessageCircle as MessageCircle,
  FiShield as ShieldCheck,
  FiSliders as Gauge,
  FiStar as Sparkles,
  FiTool as Calculator,
  FiUsers as Handshake,
  FiZap as PlugZap,
} from 'react-icons/fi'
import type { IconType } from 'react-icons'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent, MouseEvent, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const heroImage =
  'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1900&q=85'

const navItems = [
  { href: '#solusi', label: 'Solusi' },
  { href: '#mitra', label: 'Mitra' },
  { href: '#tools', label: 'Tools' },
  { href: '#kontak', label: 'Kontak' },
]

const stats = [
  { value: '12+', label: 'perusahaan pilot' },
  { value: '6', label: 'sektor industri' },
  { value: '24/7', label: 'monitoring emisi' },
  { value: '3x', label: 'laporan lebih cepat' },
]

const partnerCompanies = [
  'Nusantara Steel',
  'Borneo Foods',
  'Garuda Textile',
  'Java Cement',
  'Samudra Logistics',
  'Sentra Plastics',
]

const solutions = [
  {
    title: 'Tracking emisi operasional',
    description: 'Gabungkan data energi, bahan bakar, dan aktivitas produksi ke satu dashboard yang mudah dibaca.',
    icon: Gauge,
  },
  {
    title: 'Rekomendasi pengurangan',
    description: 'Prioritaskan aksi efisiensi berdasarkan potensi reduksi, biaya, dan dampak terhadap target perusahaan.',
    icon: Sparkles,
  },
  {
    title: 'Laporan siap audit',
    description: 'Susun ringkasan, tren bulanan, dan bukti aktivitas untuk kebutuhan internal.',
    icon: ClipboardCheck,
  },
]

const purposeActivities = [
  ['Input data energi dan bahan bakar', 'Cek tren emisi per fasilitas'],
  ['Lihat prioritas efisiensi', 'Estimasi dampak pengurangan', 'Pilih aksi operasional yang paling realistis'],
  ['Susun ringkasan siap audit', 'Ekspor laporan emisi berkala', 'Dokumentasikan progres reduksi'],
]

const collaborationSteps: Array<{ description: string; icon: IconType; title: string }> = [
  {
    title: 'Discovery',
    description: 'Konsultasi kebutuhan, jumlah fasilitas, dan sumber data yang sudah tersedia.',
    icon: MessageCircle,
  },
  {
    title: 'Connect',
    description: 'Integrasi data meter, produksi, bahan bakar, atau unggah dataset awal.',
    icon: PlugZap,
  },
  {
    title: 'Launch',
    description: 'Aktivasi dashboard, training operator, dan baseline emisi pertama.',
    icon: Gauge,
  },
  {
    title: 'Optimize',
    description: 'Review bulanan untuk rekomendasi efisiensi, laporan, dan target reduksi.',
    icon: Sparkles,
  },
]

type SocialLogoName = 'facebook' | 'instagram' | 'youtube' | 'whatsapp' | 'x' | 'linkedin'

const footerSocialLinks: Array<{ href: string; logo: SocialLogoName; name: string }> = [
  { logo: 'facebook', name: 'Facebook', href: 'https://www.facebook.com/' },
  { logo: 'instagram', name: 'Instagram', href: 'https://www.instagram.com/' },
  { logo: 'youtube', name: 'YouTube', href: 'https://www.youtube.com/' },
  { logo: 'whatsapp', name: 'WhatsApp', href: 'https://wa.me/6281234567890' },
  { logo: 'x', name: 'Twitter', href: 'https://twitter.com/' },
  { logo: 'linkedin', name: 'LinkedIn', href: 'https://www.linkedin.com/' },
]

const trackingAttemptsKey = 'carbontrackai:landing-tracking-attempts'
const trackingEstimateKey = 'carbontrackai:landing-tracking-estimate'

type ActiveTool = 'electricity' | 'productionTime'

const toolOptions: Array<{ icon: IconType; label: string; value: ActiveTool }> = [
  { value: 'electricity', label: 'Listrik', icon: PlugZap },
  { value: 'productionTime', label: 'Waktu produksi', icon: Factory },
]

export function LandingPage() {
  const [activeTool, setActiveTool] = useState<ActiveTool>('electricity')
  const [activeStep, setActiveStep] = useState(0)
  const [activePurposeIndex, setActivePurposeIndex] = useState(0)
  const [activePartnerIndex, setActivePartnerIndex] = useState(0)
  const [monthlyKwh, setMonthlyKwh] = useState(42000)
  const [productionHours, setProductionHours] = useState(240)
  const [trackingAttempts, setTrackingAttempts] = useState(() => {
    if (typeof window === 'undefined') return 0

    return Number(window.localStorage.getItem(trackingAttemptsKey) ?? 0)
  })
  const [submittedEstimate, setSubmittedEstimate] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null
    const savedEstimate = window.localStorage.getItem(trackingEstimateKey)

    return savedEstimate ? Number(savedEstimate) : null
  })

  const activePurpose = solutions[activePurposeIndex]
  const activePurposeActivities = purposeActivities[activePurposeIndex]
  const ActivePurposeIcon = activePurpose.icon

  const isTrackingLocked = trackingAttempts >= 3

  function handleSmoothScroll(target: string, event?: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) {
    event?.preventDefault()
    const section = document.querySelector(target)

    if (!section) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    section.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' })
  }

  function calculateEstimate() {
    const electricity = monthlyKwh * 0.78
    const production = productionHours * 42

    return Math.round((electricity + production) / 1000)
  }

  function handleTrackingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isTrackingLocked) return

    const nextEstimate = calculateEstimate()
    const nextAttempts = Math.min(3, trackingAttempts + 1)

    setSubmittedEstimate(nextEstimate)
    setTrackingAttempts(nextAttempts)
    window.localStorage.setItem(trackingEstimateKey, String(nextEstimate))
    window.localStorage.setItem(trackingAttemptsKey, String(nextAttempts))
  }

  return (
    <div className="min-h-svh bg-[#f7fbf7] text-slate-950">
      <header className="sticky top-0 z-50 border-b border-white/20 bg-white/85 backdrop-blur-xl">
        <div className="flex w-full items-center justify-between px-4 py-4 sm:px-6 lg:px-10 xl:px-14">
          <Link to="/" className="group flex items-center gap-3 font-bold">
            <span className="flex size-10 items-center justify-center rounded-[8px] bg-emerald-600 text-white transition-transform group-hover:-rotate-6 group-hover:scale-105">
              <Building2 className="size-5" />
            </span>
            <span className="text-lg font-black sm:text-xl">CarbonTrackAI</span>
          </Link>
          <nav className="hidden items-center gap-8 text-base font-bold text-slate-600 md:flex lg:text-lg">
            {navItems.map((item) => (
              <button key={item.href} type="button" className="transition hover:text-emerald-700" onClick={(event) => handleSmoothScroll(item.href, event)}>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="text-lg hidden sm:inline-flex" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button className="rounded-full bg-emerald-700 px-5 text-base text-lg text-white hover:bg-emerald-800" onClick={(event) => handleSmoothScroll('#kontak', event)}>
              Kerja sama
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative min-h-[720px] overflow-hidden">
          <img
            src={heroImage}
            alt="Panel surya dan infrastruktur energi bersih"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,35,20,0.94),rgba(8,35,20,0.68)_44%,rgba(8,35,20,0.24))]" />
          <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#f7fbf7] to-transparent" />
          <div className="relative mx-auto grid min-h-[720px] w-full max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,0.98fr)_minmax(360px,0.72fr)] lg:px-8">
            <div className="landing-rise max-w-3xl text-white">
              <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[1.02] text-white sm:text-6xl lg:text-7xl">
                <TypewriterText text="Kelola emisi, laporan, dan aksi efisiensi dalam satu sistem." />
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-emerald-50/85">
                CarbonTrackAI membantu perusahaan memantau konsumsi energi, menghitung jejak karbon, dan menemukan rekomendasi pengurangan emisi yang praktis untuk operasional harian.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" className="landing-hero-button h-12 rounded-full bg-emerald-500 px-6 text-base font-bold text-[#062515] hover:bg-emerald-400" onClick={(event) => handleSmoothScroll('#tools', event)}>
                  Coba tools emisi
                  <ArrowRight className="size-4" />
                </Button>
                <Button size="lg" variant="outline" className="landing-hero-button h-12 rounded-full border-white/30 bg-white/10 px-6 text-base font-bold text-white hover:bg-white hover:text-emerald-950" asChild>
                  <Link to="/login">Masuk dashboard</Link>
                </Button>
              </div>
            </div>

            <div className="landing-card-pop relative hidden min-h-[520px] lg:block">
              <div className="absolute left-10 top-14 size-72 rounded-full border border-white/20 bg-white/8 backdrop-blur-md landing-pulse-ring" />
              <div className="absolute right-4 top-40 size-48 rounded-full border border-emerald-300/30 bg-emerald-300/10 backdrop-blur landing-float-soft" />
              <div className="absolute bottom-12 left-20 size-40 rounded-full border border-white/20 bg-white/10 backdrop-blur landing-float-slower" />
              <div className="absolute left-1/2 top-1/2 grid size-28 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-emerald-400 text-[#062515] shadow-[0_0_70px_rgba(52,211,153,0.45)]">
                <Building2 className="size-11" />
              </div>
            </div>
          </div>
        </section>

        <Reveal as="section" className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
            {stats.map((stat, index) => (
              <div key={stat.label} className="landing-stat-card reveal-child rounded-[8px] border border-slate-100 bg-[#fbfefb] p-5" style={{ transitionDelay: `${index * 90}ms` }}>
                <p className="text-3xl font-black text-emerald-700">{stat.value}</p>
                <p className="mt-1 text-sm font-medium text-slate-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal id="solusi" as="section" className="scroll-mt-24 px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-700">Tujuan platform</p>
              <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Ukur, pahami, dan turunkan emisi tanpa membuat operasional terasa rumit.</h2>
              <p className="mt-5 text-base leading-8 text-slate-600">
                CarbonTrackAI dirancang sebagai ruang kerja minimal untuk menyatukan data emisi, membaca prioritas, lalu mengubahnya menjadi aksi yang bisa diikuti oleh tim operasional.
              </p>
            </div>

            <div className="mt-14 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
              <div className="grid gap-3">
                {solutions.map((solution, index) => (
                  <button
                    key={solution.title}
                    type="button"
                    className={cn(
                      'group reveal-child flex items-center gap-4 rounded-[8px] border p-4 text-left transition-all duration-500 hover:-translate-y-0.5',
                      activePurposeIndex === index
                        ? 'border-emerald-600 bg-white shadow-xl shadow-emerald-900/10'
                        : 'border-slate-200 bg-white/70 hover:border-emerald-200 hover:bg-white'
                    )}
                    style={{ transitionDelay: `${index * 100}ms` }}
                    onClick={() => setActivePurposeIndex(index)}
                    onMouseEnter={() => setActivePurposeIndex(index)}
                  >
                    <span className={cn('grid size-12 shrink-0 place-items-center rounded-full transition duration-500', activePurposeIndex === index ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100')}>
                      <solution.icon className="size-6" />
                    </span>
                    <span>
                      <span className="block text-base font-black text-slate-950">{solution.title}</span>
                      <span className="mt-1 block text-sm leading-6 text-slate-600">{solution.description}</span>
                    </span>
                    <ChevronRight className={cn('ml-auto hidden size-5 text-emerald-700 transition sm:block', activePurposeIndex === index && 'translate-x-1')} />
                  </button>
                ))}
              </div>

              <div className="reveal-child relative overflow-hidden rounded-[8px] border border-emerald-100 bg-white p-6 shadow-2xl shadow-slate-900/8 sm:p-8">
                <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-emerald-100 landing-orbit-wide" />
                <div className="pointer-events-none absolute bottom-6 right-8 h-24 w-24 rounded-full border border-emerald-200" />
                <div className="relative z-10 flex min-h-80 flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-4">
                      <span className="grid size-16 place-items-center rounded-full bg-[#0d351d] text-emerald-300">
                        <ActivePurposeIcon className="size-8" />
                      </span>
                      <div>
                        <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">Workspace focus</p>
                        <h3 className="mt-1 text-3xl font-black">{activePurpose.title}</h3>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3">
                      {activePurposeActivities.map((activity) => (
                        <div key={activity} className="flex items-start gap-3 rounded-[8px] border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm font-semibold text-slate-700">
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" />
                          <span>{activity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal id="mitra" as="section" className="scroll-mt-24 overflow-hidden bg-[#0d351d] py-24 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-300">Kolaborasi industri</p>
              <h2 className="mt-4 text-4xl font-black sm:text-5xl">Bersama perusahaan yang mulai mengubah data emisi menjadi keputusan nyata.</h2>
              <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-emerald-50/80">
                Area ini bisa digunakan untuk menampilkan perusahaan kerja sama, pilot project, atau klien onboarding agar calon mitra langsung menangkap kredibilitas platform.
              </p>
            </div>
            <PartnerCarousel activeIndex={activePartnerIndex} companies={partnerCompanies} onChange={setActivePartnerIndex} />
          </div>
        </Reveal>

        <Reveal as="section" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[420px_1fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-700">Panduan Kerja Sama</p>
              <h2 className="mt-4 text-4xl font-black">Mulai dari konsultasi sampai dashboard aktif.</h2>
              <p className="mt-5 text-base leading-8 text-slate-600">
                Alurnya dibuat ringan untuk tim operasional: tidak perlu menunggu sistem sempurna, perusahaan bisa mulai dari data yang sudah tersedia.
              </p>
            </div>
            <div className="relative rounded-[8px] bg-white p-4 shadow-2xl shadow-slate-900/8 sm:p-6">
              <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
                <div className="grid gap-3">
                  {collaborationSteps.map((step, index) => (
                    <button
                      key={step.title}
                      type="button"
                      className={cn(
                        'group flex items-center gap-3 rounded-[8px] border p-3 text-left transition',
                        activeStep === index ? 'border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-900/15' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-200 hover:bg-white'
                      )}
                      onClick={() => setActiveStep(index)}
                      onMouseEnter={() => setActiveStep(index)}
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-emerald-700 transition">
                        <step.icon className="size-5" />
                      </span>
                      <span>
                        <span className="block text-xs font-black uppercase tracking-[0.16em] opacity-70">Step 0{index + 1}</span>
                        <span className="block font-black">{step.title}</span>
                      </span>
                    </button>
                  ))}
                </div>
                <div className="relative min-h-80 overflow-hidden rounded-[8px] bg-[#082817] p-6 text-white">
                  <div className="absolute -right-24 -top-24 size-64 rounded-full bg-emerald-400/20 landing-pulse-ring" />
                  
                  <div className="relative z-10 max-w-md">
                    <span className="grid size-16 place-items-center rounded-full bg-emerald-400 text-[#062515]">
                      {(() => {
                        const ActiveIcon = collaborationSteps[activeStep].icon
                        return <ActiveIcon className="size-8" />
                      })()}
                    </span>
                    <h3 className="mt-8 text-4xl font-black">{collaborationSteps[activeStep].title}</h3>
                    <p className="mt-4 text-base leading-8 text-emerald-50/78">{collaborationSteps[activeStep].description}</p>
                    <div className="mt-8 flex items-center gap-2 text-sm font-bold text-emerald-200">
                      <Handshake className="size-4" />
                      Tim CarbonTrackAI mendampingi dari setup sampai review rutin.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal id="tools" as="section" className="scroll-mt-24 bg-white py-20">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-700">Tools tracking emisi</p>
              <h2 className="mt-4 text-4xl font-black sm:text-5xl">Simulasikan jejak karbon bulanan.</h2>
              <p className="mt-5 text-base leading-8 text-slate-600">
                Gunakan kalkulator ringkas ini sebagai preview cara platform membaca pemakaian listrik dan durasi proses produksi untuk menghasilkan estimasi emisi awal.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                {toolOptions.map(({ icon: Icon, label, value }) => (
                  <button
                    key={value}
                    type="button"
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition',
                      activeTool === value
                        ? 'border-emerald-700 bg-emerald-700 text-white shadow-lg shadow-emerald-900/15'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
                    )}
                    onClick={() => setActiveTool(value)}
                  >
                    <Icon className="size-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <form className="rounded-[8px] border border-slate-200 bg-[#f8fbf8] p-5 shadow-xl shadow-slate-900/6 sm:p-7" onSubmit={handleTrackingSubmit}>
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-bold text-emerald-700">Estimasi emisi</p>
                  <div className="relative mt-1">
                    <p className={cn('text-4xl font-black transition duration-500', isTrackingLocked && 'select-none blur-sm')}>{submittedEstimate === null ? '--' : submittedEstimate} tCO2e</p>
                    {isTrackingLocked ? (
                      <div className="absolute inset-0 grid place-items-center rounded-[8px] bg-white/60 text-center backdrop-blur-[1px]">
                        <span className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Hasil lengkap terkunci</span>
                      </div>
                    ) : null}
                  </div>
                </div>
                <span className="grid size-12 place-items-center rounded-[8px] bg-emerald-600 text-white">
                  <Calculator className="size-6" />
                </span>
              </div>

              <div className="grid gap-4">
                <ToolInput label="Pemakaian listrik bulanan" suffix="kWh" value={monthlyKwh} onChange={setMonthlyKwh} active={activeTool === 'electricity'} />
                <ToolInput label="Waktu proses produksi" suffix="jam" value={productionHours} onChange={setProductionHours} active={activeTool === 'productionTime'} />
              </div>

              <Button className="mt-6 h-11 w-full rounded-full bg-emerald-700 text-base font-bold text-white hover:bg-emerald-800" disabled={isTrackingLocked} type="submit">
                {isTrackingLocked ? 'Batas percobaan tercapai' : 'Submit estimasi'}
              </Button>

              <div className={cn('mt-6 rounded-[8px] border border-emerald-100 bg-white p-4 transition', isTrackingLocked && 'border-emerald-200 bg-emerald-50')}>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-5 text-emerald-700" />
                  <p className="text-sm leading-7 text-slate-600">
                    {isTrackingLocked
                      ? 'Untuk membuka hasil berupa report lengkap dan rekomendasi terbaik, lanjutkan kerja sama dengan tim CarbonTrackAI.'
                      : 'Estimasi ini bersifat demo. Di dashboard penuh, faktor emisi dan kategori aktivitas bisa disesuaikan dengan kebutuhan pelaporan perusahaan.'}
                  </p>
                </div>
                {isTrackingLocked ? (
                  <Button className="mt-4 rounded-full bg-emerald-700 text-white hover:bg-emerald-800" type="button" onClick={(event) => handleSmoothScroll('#kontak', event)}>
                    Ajukan kerja sama
                    <ArrowRight className="size-4" />
                  </Button>
                ) : null}
              </div>
            </form>
          </div>
        </Reveal>

        <Reveal id="kontak" as="section" className="scroll-mt-24 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="relative grid overflow-hidden rounded-[8px] bg-[#0c321b] text-white lg:grid-cols-[1fr_440px]">
            <div className="pointer-events-none absolute -left-24 -top-24 size-64 rounded-full border border-emerald-300/20 landing-pulse-ring" />
            <div className="pointer-events-none absolute bottom-8 right-24 size-28 rounded-full bg-emerald-300/10 landing-float-soft" />
            <div className="p-7 sm:p-10 lg:p-12">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-300">Kontak kami</p>
              <h2 className="mt-4 text-4xl font-black sm:text-5xl">Siap mulai tracking emisi perusahaan?</h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-emerald-50/78">
                Ceritakan sektor bisnis, jumlah fasilitas, dan tipe data yang sudah tersedia. Tim kami akan bantu susun langkah implementasi pertama.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button className="h-12 rounded-full bg-emerald-400 px-6 text-base font-bold text-[#062515] hover:bg-emerald-300" asChild>
                  <a href="mailto:admin@carboncore.ai">
                    <Mail className="size-4" />
                    Email kami
                  </a>
                </Button>
                <Button variant="outline" className="h-12 rounded-full border-white/25 bg-white/8 px-6 text-base font-bold text-white hover:bg-white hover:text-emerald-950" asChild>
                  <a href="https://wa.me/6281234567890" target="_blank" rel="noreferrer">
                    <MessageCircle className="size-4" />
                    WhatsApp
                  </a>
                </Button>
              </div>
            </div>
            <div className="border-t border-white/10 bg-white/8 p-7 sm:p-10 lg:border-l lg:border-t-0">
              <div className="space-y-5">
                {[
                  [ShieldCheck, 'Audit-ready', 'Ringkasan data dan jejak aktivitas lebih mudah ditinjau.'],
                  [MapPin, 'Indonesia focus', 'Disusun untuk kebutuhan operasional industri di Indonesia.'],
                  [Factory, 'Multi-fasilitas', 'Pantau pabrik, gudang, dan cabang dalam satu akun.'],
                ].map(([Icon, title, description]) => (
                  <div key={title as string} className="flex gap-4 rounded-[8px] bg-white/8 p-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-[8px] bg-emerald-400/15 text-emerald-200">
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <p className="font-bold">{title as string}</p>
                      <p className="mt-1 text-sm leading-6 text-emerald-50/70">{description as string}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </main>

      <footer className="bg-[#082817] text-white">
        <div className="grid w-full gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 xl:px-14">
          <div>
            <Link to="/" className="flex w-fit items-center gap-3 text-xl font-black">
              <span className="grid size-12 place-items-center rounded-[8px] bg-emerald-400 text-[#062515]">
                <Building2 className="size-6" />
              </span>
              CarbonTrackAI
            </Link>
            <p className="mt-5 max-w-2xl text-base leading-8 text-emerald-50/78">
              Platform tracking emisi dan rekomendasi efisiensi untuk membantu industri mengambil keputusan keberlanjutan berbasis data.
            </p>
            <p className="mt-6 flex flex-wrap items-center gap-1.5 text-base font-semibold text-emerald-100/82">
              Copyright 2026. Made with <Heart className="size-5 fill-emerald-400 text-emerald-400" /> by Sejawat.
            </p>
          </div>
          <div className="grid gap-6">
            <div>
              <p className="text-lg font-black text-emerald-200">Find us on:</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {footerSocialLinks.map(({ href, logo, name }) => (
                  <a
                    key={name}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={name}
                    className="grid size-12 place-items-center rounded-full border border-white/12 bg-white/6 transition hover:-translate-y-0.5 hover:border-emerald-300/60 hover:bg-emerald-300/10"
                  >
                    <span className="grid size-8 place-items-center rounded-full bg-white text-[#082817] shadow-lg shadow-black/15">
                      <SocialLogo logo={logo} />
                    </span>
                  </a>
                ))}
              </div>
            </div>

            <div className="grid gap-3 text-base text-emerald-50/82">
              <a href="tel:+62751777777" className="flex items-center gap-3 transition hover:text-emerald-300">
                <MessageCircle className="size-5 text-emerald-300" />
                Kantor: +62 751 777 777
              </a>
              <a href="mailto:admin@carboncore.ai" className="flex items-center gap-3 transition hover:text-emerald-300">
                <Mail className="size-5 text-emerald-300" />
                admin@carboncore.ai
              </a>
              <p className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-emerald-300" />
                Limau Manis, Padang, Sumatera Barat
              </p>
            </div>
          </div>
          <div className="overflow-hidden rounded-[8px] border border-white/12 bg-white/6 lg:col-span-2">
            <iframe
              title="Peta Admin Sejawat UNAND Limau Manis"
              src="https://www.google.com/maps?q=Universitas%20Andalas%20Limau%20Manis%20Padang&output=embed"
              className="h-64 w-full border-0 md:h-72"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </footer>
    </div>
  )
}

type PartnerCarouselProps = {
  activeIndex: number
  companies: string[]
  onChange: (index: number) => void
}

function PartnerCarousel({ activeIndex, companies, onChange }: PartnerCarouselProps) {
  const itemPitch = 152
  const itemCenter = 64

  useEffect(() => {
    const timer = window.setInterval(() => {
      onChange((activeIndex + 1) % companies.length)
    }, 2600)

    return () => window.clearInterval(timer)
  }, [activeIndex, companies.length, onChange])

  function move(direction: 'next' | 'previous') {
    const nextIndex = direction === 'next'
      ? (activeIndex + 1) % companies.length
      : (activeIndex - 1 + companies.length) % companies.length

    onChange(nextIndex)
  }

  return (
    <div className="landing-carousel group relative mx-auto mt-12 max-w-5xl overflow-hidden px-12 py-8">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-28 bg-gradient-to-r from-[#0d351d] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-28 bg-gradient-to-l from-[#0d351d] to-transparent" />
      <button
        type="button"
        className="landing-carousel-control left-3"
        aria-label="Geser mitra sebelumnya"
        onClick={() => move('previous')}
      >
        <ArrowLeft className="size-5" />
      </button>
      <button
        type="button"
        className="landing-carousel-control right-3"
        aria-label="Geser mitra berikutnya"
        onClick={() => move('next')}
      >
        <ArrowRight className="size-5" />
      </button>
      <div
        className="flex gap-6 transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
        style={{ transform: `translateX(calc(50% - ${activeIndex * itemPitch + itemCenter}px))` }}
      >
        {companies.map((company, index) => {
          const rawDistance = Math.abs(index - activeIndex)
          const distance = Math.min(rawDistance, companies.length - rawDistance)
          const isActive = index === activeIndex
          const Icon = index % 2 === 0 ? Factory : Building2

          return (
            <button
              key={company}
              type="button"
              className={cn(
                'flex w-32 shrink-0 flex-col items-center transition-all duration-700',
                isActive ? 'scale-110 opacity-100' : distance === 1 ? 'scale-100 opacity-80' : 'scale-90 opacity-45'
              )}
              onClick={() => onChange(index)}
            >
              <span className={cn('grid size-20 place-items-center rounded-full border shadow-lg shadow-emerald-950/20 backdrop-blur transition duration-700', isActive ? 'border-emerald-200 bg-emerald-400 text-[#062515]' : 'border-white/12 bg-white/10 text-emerald-200')}>
                <Icon className="size-8" />
              </span>
              <span className="mt-4 text-center text-sm font-black">{company}</span>
              <span className="mt-1 text-center text-xs text-emerald-100/60">Partner demo</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

type RevealProps = {
  as?: 'div' | 'section'
  children: ReactNode
  className?: string
  id?: string
}

function Reveal({ as = 'div', children, className, id }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = ref.current

    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.16 }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return (
    as === 'section' ? (
      <section ref={(element) => { ref.current = element }} id={id} className={cn('scroll-reveal', isVisible && 'is-visible', className)}>
        {children}
      </section>
    ) : (
      <div ref={(element) => { ref.current = element }} id={id} className={cn('scroll-reveal', isVisible && 'is-visible', className)}>
        {children}
      </div>
    )
  )
}

type TypewriterTextProps = {
  text: string
}

function TypewriterText({ text }: TypewriterTextProps) {
  const [visibleLength, setVisibleLength] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return text.length
    }

    return 0
  })

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) return

    let index = 0
    const timer = window.setInterval(() => {
      index += 1
      setVisibleLength(Math.min(index, text.length))

      if (index >= text.length) {
        window.clearInterval(timer)
      }
    }, 48)

    return () => window.clearInterval(timer)
  }, [text])

  return (
    <span className="landing-typewriter-text">
      {text.slice(0, visibleLength)}
      <span className="landing-typewriter-caret" aria-hidden="true" />
    </span>
  )
}

type SocialLogoProps = {
  logo: SocialLogoName
}

function SocialLogo({ logo }: SocialLogoProps) {
  if (logo === 'facebook') {
    return (
      <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14.2 8.6V6.8c0-.9.6-1.1 1-1.1h2.5V2.1L14.3 2c-3.7 0-4.6 2.8-4.6 4.5v2.1H6.8v3.9h2.9V22h4.1v-9.5h3.4l.5-3.9h-3.5Z" />
      </svg>
    )
  }

  if (logo === 'instagram') {
    return (
      <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="16" height="16" x="4" y="4" rx="4.5" />
        <circle cx="12" cy="12" r="3.4" />
        <circle cx="17.2" cy="6.8" r="0.7" fill="currentColor" stroke="none" />
      </svg>
    )
  }

  if (logo === 'youtube') {
    return (
      <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.4 7.1a3 3 0 0 0-2.1-2.1C17.5 4.5 12 4.5 12 4.5s-5.5 0-7.3.5a3 3 0 0 0-2.1 2.1A31 31 0 0 0 2.1 12c0 1.7.1 3.4.5 4.9a3 3 0 0 0 2.1 2.1c1.8.5 7.3.5 7.3.5s5.5 0 7.3-.5a3 3 0 0 0 2.1-2.1c.4-1.5.5-3.2.5-4.9s-.1-3.4-.5-4.9ZM10 15.4V8.6l5.8 3.4L10 15.4Z" />
      </svg>
    )
  }

  if (logo === 'whatsapp') {
    return (
      <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.2a9.7 9.7 0 0 0-8.4 14.6L2.5 21.9l5.2-1.4A9.7 9.7 0 1 0 12 2.2Zm0 17.6a7.8 7.8 0 0 1-4-1.1l-.3-.2-3.1.8.8-3-.2-.3A7.8 7.8 0 1 1 12 19.8Zm4.4-5.8c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1-.2.3-.7.8-.8 1-.2.2-.3.2-.6.1a6.4 6.4 0 0 1-3.2-2.8c-.2-.3 0-.4.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.7-1.7c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9.6.3 1.1.4 1.5.5.6.2 1.2.2 1.7.1.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1-.1-.2-.3-.2-.5-.3Z" />
      </svg>
    )
  }

  if (logo === 'x') {
    return (
      <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13.9 10.5 21.3 2h-1.8l-6.4 7.3L8 2H2l7.8 11.3L2 22h1.8l6.8-7.7L16 22h6l-8.1-11.5Zm-2.4 2.7-.8-1.1L4.5 3.3h2.6l5 7.1.8 1.1 6.6 9.3h-2.6l-5.4-7.6Z" />
      </svg>
    )
  }

  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5.3 8.7H1.8V22h3.5V8.7ZM3.6 2A2 2 0 1 0 3.5 6 2 2 0 0 0 3.6 2Zm18.6 12.3c0-4-2.1-5.9-5-5.9a4.3 4.3 0 0 0-3.9 2.1h-.1V8.7H9.9V22h3.5v-6.6c0-1.7.3-3.4 2.5-3.4 2.1 0 2.1 2 2.1 3.5V22h3.5v-7.7h.7Z" />
    </svg>
  )
}

type ToolInputProps = {
  active: boolean
  label: string
  onChange: (value: number) => void
  suffix: string
  value: number
}

function ToolInput({ active, label, onChange, suffix, value }: ToolInputProps) {
  return (
    <div className={cn('rounded-[8px] border bg-white p-4 transition', active ? 'border-emerald-300 shadow-lg shadow-emerald-900/8' : 'border-slate-200')}>
      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm font-bold text-slate-700">{label}</Label>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">{suffix}</span>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_130px]">
        <input
          type="range"
          min="0"
          max={suffix === 'kWh' ? 120000 : suffix === 'liter' ? 8000 : 3000}
          step={suffix === 'kWh' ? 1000 : suffix === 'liter' ? 100 : 50}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="accent-emerald-700"
        />
        <Input
          type="number"
          min="0"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-10 rounded-[8px] border-slate-200 bg-slate-50 text-sm font-bold"
        />
      </div>
    </div>
  )
}
