export const dashboardMetrics = [
  {
    title: 'Total emisi',
    value: '42.8 tCO2e',
    change: '-12,4% dari bulan lalu',
    tone: 'good',
  },
  {
    title: 'Reduksi bulanan',
    value: '5.7 tCO2e',
    change: '+18,2% progres target',
    tone: 'good',
  },
  {
    title: 'Laporan aktif',
    value: '128',
    change: '14 menunggu review',
    tone: 'neutral',
  },
  {
    title: 'Skor kepatuhan',
    value: '94%',
    change: '+6 poin kuartal ini',
    tone: 'good',
  },
] as const

export const facilities = [
  { name: 'Kantor Jakarta', completeness: 92, emissions: '12.4 tCO2e' },
  { name: 'Pabrik Bandung', completeness: 85, emissions: '18.7 tCO2e' },
  { name: 'DC Surabaya', completeness: 78, emissions: '8.1 tCO2e' },
] as const

export const reportQueue = [
  '14 laporan menunggu validasi.',
  '8 unggahan pemasok perlu pemetaan faktor emisi.',
  '3 ekspor kuartalan siap ditinjau.',
] as const
