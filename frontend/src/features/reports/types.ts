export type ReportFile = {
  id: number
  company_id: number
  report_type: 'daily' | 'weekly' | 'monthly' | 'annual'
  period_start: string
  period_end: string
  file_path: string | null
  generated_by: number | null
  generated_at: string
  include_completed_recommendations: boolean
  status: string
  error_message: string | null
}
