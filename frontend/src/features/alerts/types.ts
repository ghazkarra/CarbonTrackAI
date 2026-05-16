import type { Recommendation } from '@/features/recommendations/types'

export type Alert = {
  id: number
  company_id: number
  machine_usage_id: number | null
  alert_type: string
  severity: 'info' | 'warning' | 'high' | 'critical'
  message: string
  triggered_value: string | null
  threshold_value: string | null
  recommended_action: string | null
  status: 'active' | 'acknowledged'
  acknowledged_at: string | null
  created_at: string
}

export type SavingsSummary = {
  total_potential_saving_idr: string
  total_saving_kwh: string
  total_co2_reduction_kg: string
  tariff_code: string
  tariff_per_kwh_idr: string
}

export type AlertMachineUsage = {
  id: number
  report_month: string
  machine_name: string
  machine_location: string
  energy_kwh: string
}

export type AlertWithRecommendations = Alert & {
  machine_usage: AlertMachineUsage | null
  recommendations: Recommendation[]
}

export type AlertsOverview = {
  summary: SavingsSummary
  alerts: AlertWithRecommendations[]
}
