import axios from 'axios'

export interface ApiResponse<T> {
  code: number
  msg: string
  data: T
}

export interface PageData<T> {
  list: T[]
  page: number
  pageSize: number
  total: number
}

export const api = axios.create({ baseURL: '/api', timeout: 10000 })
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
api.interceptors.response.use(response => {
  const code = response.data?.code
  if (typeof code === 'number' && (code < 200 || code >= 300)) {
    throw new Error(response.data.msg || '请求失败')
  }
  return response
})

export function errorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.msg || error.message
  }
  return error instanceof Error ? error.message : '请求失败'
}
