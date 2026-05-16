export type Recommendation = {
  id: number
  company_id: number
  machine_usage_id: number | null
  recommendation_title: string
  recommendation_description: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  estimated_impact: 'low' | 'medium' | 'high'
  related_machine_name: string | null
  status: 'active' | 'completed' | 'dismissed'
  is_completed: boolean
  completed_at: string | null
  completion_note: string | null
  created_at: string
}
