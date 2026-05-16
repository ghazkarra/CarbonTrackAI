import { z } from 'zod'

export const machineUsageSchema = z.object({
  report_month: z.string().regex(/^\d{4}-\d{2}$/, 'Bulan laporan harus memakai format YYYY-MM'),
  row_no: z.coerce.number().int().positive().optional(),
  machine_name: z.string().min(1, 'Nama mesin wajib diisi'),
  machine_location: z.string().min(1, 'Lokasi mesin wajib diisi'),
  machine_quantity: z.coerce.number().int().positive(),
  machine_power_watt: z.coerce.number().nonnegative(),
  machine_power_kw: z.coerce.number().nonnegative().optional(),
  usage_hours: z.coerce.number().nonnegative(),
  energy_kwh: z.coerce.number().nonnegative().optional(),
})

export type MachineUsageFormValues = z.infer<typeof machineUsageSchema>
