export const dashboardMetrics = [
  {
    title: 'Total Emissions',
    value: '42.8 tCO2e',
    change: '-12.4% from last month',
    tone: 'good',
  },
  {
    title: 'Monthly Reduction',
    value: '5.7 tCO2e',
    change: '+18.2% target progress',
    tone: 'good',
  },
  {
    title: 'Active Reports',
    value: '128',
    change: '14 awaiting review',
    tone: 'neutral',
  },
  {
    title: 'Compliance Score',
    value: '94%',
    change: '+6 points this quarter',
    tone: 'good',
  },
] as const

export const facilities = [
  { name: 'Jakarta HQ', completeness: 92, emissions: '12.4 tCO2e' },
  { name: 'Bandung Plant', completeness: 85, emissions: '18.7 tCO2e' },
  { name: 'Surabaya DC', completeness: 78, emissions: '8.1 tCO2e' },
] as const

export const reportQueue = [
  '14 reports pending validation.',
  '8 supplier uploads need emission factor mapping.',
  '3 quarterly exports ready for review.',
] as const
