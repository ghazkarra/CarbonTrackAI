export type ReportType = 'daily' | 'weekly' | 'monthly' | 'annual'

export type ReportFile = {
  id: number
  company_id: number
  report_type: ReportType
  period_start: string
  period_end: string
  file_path: string | null
  generated_by: number | null
  generated_at: string
  include_completed_recommendations: boolean
  status: string
  error_message: string | null
  preview_data_json?: ReportPreviewResponse | null
}

export type ReportMetric = {
  label: string
  value: number | string
  unit: string | null
  description: string | null
}

export type ReportChartPoint = {
  label: string
  value: number
  secondary_value: number | null
}

type CountMap = Record<string, number>

export type ReportRecommendationRow = {
  priority: string
  category: string
  title: string
  recommendation_description: string
  machine: string
  status: string
  completion_note: string
  estimated_saving_kwh: number
  estimated_saving_idr: number
  estimated_co2_reduction_kg: number
}

export type ReportPreviewResponse = {
  metadata: {
    id: number | null
    company_name: string
    report_type: ReportType
    period_start: string
    period_end: string
    period_label: string
    include_completed_recommendations: boolean
  }
  metrics: {
    total_energy_kwh: number
    estimated_co2e_kg: number
    estimated_co2e_ton: number
    records_count: number
    active_alerts_count: number
    active_recommendations_count: number
    completed_recommendations_count: number
    total_usage_hours: number
    total_power_kw: number
    validation_status_counts: CountMap
    data_source_counts: CountMap
    alert_severity_counts: CountMap
    alert_type_counts: CountMap
    alert_status_counts: CountMap
    recommendation_priority_counts: CountMap
    recommendation_category_counts: CountMap
    recommendation_status_counts: CountMap
    total_estimated_saving_kwh: number
    total_estimated_saving_idr: number
    total_estimated_co2_reduction_kg: number
    source_context_ids: string[]
  }
  highlights: ReportMetric[]
  charts: {
    emission_trend: ReportChartPoint[]
    top_machines: ReportChartPoint[]
    machine_energy_by_source: ReportChartPoint[]
    machine_validation_status: ReportChartPoint[]
    alert_severity_breakdown: ReportChartPoint[]
    alert_type_breakdown: ReportChartPoint[]
    recommendation_status_breakdown: ReportChartPoint[]
    recommendation_savings_by_priority: ReportChartPoint[]
  }
  summary: {
    executive_summary: string
    key_findings: string[]
    management_notes: string[]
  }
  tables: {
    machine_usage: Array<{
      machine: string
      location: string
      quantity: number
      power_kw: number
      usage_hours: number
      energy_kwh: number
      estimated_co2e_kg: number
      validation_status: string
      data_source: string
    }>
    alerts: Array<{
      severity: string
      type: string
      message: string
      recommended_action: string
      status: string
      triggered_value: string | null
      threshold_value: string | null
    }>
    active_recommendations: ReportRecommendationRow[]
    completed_recommendations: ReportRecommendationRow[]
    source_context_ids: string[]
  }
}
