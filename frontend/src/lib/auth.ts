import { apiRequest } from './api'

const TOKEN_KEY = 'carboncore_access_token'
const USER_KEY = 'carboncore_user'

export type UserRole = 'operator' | 'superadmin'

export type UserProfile = {
  id: number
  name: string
  email: string
  role: UserRole
  company_id: number | null
  company_name: string | null
}

export type LoginResponse = {
  access_token: string
  token_type: string
  user: UserProfile
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser(): UserProfile | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as UserProfile
  } catch {
    clearAuth()
    return null
  }
}

export function setAuth(token: string, user: UserProfile) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export async function login(email: string, password: string) {
  const response = await apiRequest<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  setAuth(response.access_token, response.user)
  return response
}

export async function fetchCurrentUser(token: string) {
  return apiRequest<UserProfile>('/api/auth/me', { token })
}
