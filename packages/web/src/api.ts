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

export function errorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.msg || error.message
  }
  return error instanceof Error ? error.message : '请求失败'
}
