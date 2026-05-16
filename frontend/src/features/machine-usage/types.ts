import type { Alert } from '@/features/alerts/types'
import type { Recommendation } from '@/features/recommendations/types'

export type MachineUsageRecord = {
  id: number
  batch_id: number | null
  company_id: number
  report_month: string
  row_no: number | null
  machine_name: string
  machine_location: string
  machine_quantity: number
  machine_power_watt: string
  machine_power_kw: string
  usage_hours: string
  energy_kwh: string
  data_source: 'form' | 'csv_upload'
  validation_status: 'valid' | 'warning' | 'error'
  validation_message: string | null
  created_at: string
}

export type EmissionCalculation = {
  id: number
  calculation_method: string
  emission_factor_value: string
  emission_factor_unit: string
  estimated_co2e_kg: string
  estimated_co2e_ton: string
  confidence_label: string
}

export type MachineUsageStatistics = {
  total_energy_kwh: string
  estimated_co2e_kg: string
  estimated_co2e_ton: string
  total_potential_saving_idr: string
  total_saving_kwh: string
  total_co2_reduction_kg: string
  tariff_code: string
  tariff_per_kwh_idr: string
}

export type MachineUsageDetail = MachineUsageRecord & {
  calculation: EmissionCalculation | null
  statistics: MachineUsageStatistics
  alerts: Alert[]
  recommendations: Recommendation[]
}

export type ImportCsvResponse = {
  batch_id: number | null
  total_rows: number
  valid_rows: number
  warning_rows: number
  error_rows: number
  rows: Array<{
    row_no: number | null
    machine_name: string | null
    status: string
    validation_message: string | null
    energy_kwh: string | null
  }>
}
