import { ref } from 'vue'
import { api, type ApiResponse } from './api'

export interface CurrentUser {
  id: number
  username: string
  role: string
  status: number
  profile: unknown
  created_at: string
  updated_at: string
}
export const currentUser = ref<CurrentUser | null>(null)
export function clearSession() {
  currentUser.value = null
  for (const key of ['token', 'role', 'username']) localStorage.removeItem(key)
}
export async function loadCurrentUser() {
  const { data } = await api.get<ApiResponse<CurrentUser>>('/user/me')
  currentUser.value = data.data
  localStorage.setItem('username', data.data.username)
  localStorage.setItem('role', data.data.role)
  return data.data
}
