export type SuperadminUser = {
  id: number
  name: string
  email: string
  role: 'operator' | 'superadmin'
  company_id: number | null
  company_name: string | null
  is_active: boolean
  created_at: string
}

export type CompanyOption = {
  id: number
  company_name: string
}
