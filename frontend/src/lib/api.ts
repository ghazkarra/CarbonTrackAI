const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'

export class ApiError extends Error {
  status: number
  detail: unknown

  constructor(status: number, detail: unknown) {
    super(typeof detail === 'string' ? detail : 'Request failed')
    this.status = status
    this.detail = detail
  }
}

function formatValidationField(loc: unknown) {
  const field = Array.isArray(loc) ? String(loc.at(-1) ?? '') : String(loc ?? '')
  const labels: Record<string, string> = {
    company_id: 'perusahaan',
    email: 'email',
    is_active: 'status',
    name: 'nama',
    password: 'kata sandi',
    role: 'peran',
  }

  return labels[field] ?? field
}

function formatValidationMessage(item: unknown) {
  if (!item || typeof item !== 'object') return null

  const detail = item as { loc?: unknown; msg?: unknown; type?: unknown }
  const field = formatValidationField(detail.loc)
  const message = typeof detail.msg === 'string' ? detail.msg.toLowerCase() : ''
  const type = typeof detail.type === 'string' ? detail.type : ''

  if (field === 'email') return 'Gunakan format email yang valid, contoh: admin@perusahaan.com.'
  if (field === 'kata sandi' && (message.includes('at least 6') || type.includes('too_short'))) return 'Kata sandi minimal 6 karakter.'
  if (message.includes('field required') || type.includes('missing')) return `Isi ${field} terlebih dahulu.`
  if (message.includes('string should have at least') || type.includes('too_short')) return `${field[0]?.toUpperCase() ?? ''}${field.slice(1)} terlalu pendek.`
  if (message.includes('input should be a valid integer')) return `Pilih ${field} yang valid.`

  return `Periksa kembali ${field}.`
}

export function getApiErrorMessage(error: unknown, fallback = 'Terjadi kendala. Coba lagi beberapa saat.'): string {
  if (error instanceof ApiError) {
    if (typeof error.detail === 'string') {
      if (error.detail === 'Email is already used') return 'Email ini sudah dipakai. Gunakan email lain.'
      if (error.detail === 'Company not found') return 'Perusahaan tidak ditemukan. Pilih perusahaan yang tersedia.'
      if (error.detail === 'User not found') return 'Pengguna tidak ditemukan. Kembali ke daftar pengguna lalu pilih data yang tersedia.'
      if (error.detail.trim()) return error.detail
    }

    if (Array.isArray(error.detail)) {
      const validationMessages = error.detail.map(formatValidationMessage).filter(Boolean)
      if (validationMessages.length > 0) return validationMessages.join(' ')
    }

    if (error.status === 401) return 'Sesi Anda sudah berakhir. Silakan login ulang.'
    if (error.status === 403) return 'Anda tidak memiliki akses untuk melakukan aksi ini.'
    if (error.status === 404) return 'Data tidak ditemukan. Muat ulang halaman atau kembali ke daftar data.'
    if (error.status === 409) return 'Data bentrok dengan data yang sudah ada. Periksa kembali email atau identitas pengguna.'
    if (error.status === 422) return 'Periksa kembali isian form. Ada data yang belum sesuai format.'
    if (error.status >= 500) return 'Server sedang mengalami kendala. Coba lagi beberapa saat.'

    return fallback
  }

  if (error instanceof TypeError) {
    return 'Tidak bisa terhubung ke server. Pastikan backend sedang berjalan, lalu coba lagi.'
  }

  if (error instanceof Error && error.message && error.message !== 'Request failed') {
    return error.message
  }

  return fallback
}

type ApiOptions = RequestInit & {
  token?: string | null
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers)

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  const contentType = response.headers.get('Content-Type') ?? ''
  const data = contentType.includes('application/json') ? await response.json() : await response.text()

  if (!response.ok) {
    throw new ApiError(response.status, data?.detail ?? data)
  }

  return data as T
}
