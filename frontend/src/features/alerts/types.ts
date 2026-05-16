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
