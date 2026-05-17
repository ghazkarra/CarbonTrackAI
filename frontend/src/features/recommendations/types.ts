export type Recommendation = {
  id: number
  company_id: number
  alert_id: number | null
  machine_usage_id: number | null
  recommendation_title: string
  recommendation_description: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  estimated_impact: 'low' | 'medium' | 'high'
  related_machine_name: string | null
  status: 'active' | 'completed' | 'dismissed'
  is_completed: boolean
  estimated_saving_kwh: string
  estimated_saving_idr: string
  estimated_co2_reduction_kg: string
  completed_at: string | null
  completion_note: string | null
  created_at: string
}
