import { ArrowRight, BarChart3, FileCheck2, Leaf } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  { title: 'Track emissions', description: 'Monitor operational carbon data across facilities and suppliers.', icon: BarChart3 },
  { title: 'Automate reports', description: 'Prepare auditable reports for internal and compliance workflows.', icon: FileCheck2 },
  { title: 'Reduce footprint', description: 'Measure progress against reduction targets and net-zero milestones.', icon: Leaf },
]

export function LandingPage() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 font-semibold">
          <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Leaf className="size-5" />
          </span>
          CarbonTrackAI
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <Link to="/login" className="hover:text-foreground">Login</Link>
        </nav>
        <Button asChild>
          <Link to="/register">Get started</Link>
        </Button>
      </header>

      <main>
        <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_460px] lg:px-8 lg:py-24">
          <div className="flex flex-col justify-center">
            <p className="mb-4 text-sm font-medium text-primary">Carbon monitoring for modern companies</p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
              Turn emissions data into decisions.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
              Dashboard boilerplate for tracking company emissions, reporting progress, and preparing verified sustainability workflows.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link to="/dashboard">Open dashboard <ArrowRight className="size-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/login">Login</Link>
              </Button>
            </div>
          </div>
          <Card className="overflow-hidden border-primary/20 bg-primary/5 shadow-xl shadow-primary/10">
            <CardHeader>
              <CardTitle>Company emission snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {['Scope 1', 'Scope 2', 'Supplier data'].map((label, index) => (
                <div key={label} className="rounded-md border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-sm text-primary">{82 - index * 12}% complete</span>
                  </div>
                  <div className="mt-3 h-2 rounded-md bg-muted">
                    <div className="h-2 rounded-md bg-primary" style={{ width: `${82 - index * 12}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section id="features" className="mx-auto grid w-full max-w-7xl gap-4 px-4 pb-16 sm:px-6 md:grid-cols-3 lg:px-8">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <feature.icon className="mb-3 size-6 text-primary" />
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{feature.description}</CardContent>
            </Card>
          ))}
        </section>
      </main>
    </div>
  )
}
