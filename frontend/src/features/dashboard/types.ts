export type DashboardSummary = {
  total_energy_kwh: string
  estimated_co2e_kg: string
  estimated_co2e_ton: string
  active_alerts_count: number
  completed_recommendations_this_month: number
  top_machines: Array<{
    machine_name: string
    machine_location: string
    energy_kwh: string
    estimated_co2e_kg: string
  }>
  recommendation_progress: {
    active: number
    completed: number
    dismissed: number
  }
}
