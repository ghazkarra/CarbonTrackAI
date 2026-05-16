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
