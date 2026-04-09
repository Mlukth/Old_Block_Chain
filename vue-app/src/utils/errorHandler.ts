/**
 * 统一错误处理工具
 */
import type { AxiosError } from 'axios'

export interface ApiError {
  message: string
  code?: string
  status?: number
  originalError?: any
}

export function handleApiError(error: unknown): ApiError {
  const axiosError = error as AxiosError<{ error?: string; message?: string }>
  
  if (axiosError.response) {
    // 服务器返回了错误响应
    const data = axiosError.response.data
    return {
      message: data?.error || data?.message || '请求失败',
      status: axiosError.response.status,
      originalError: error,
    }
  } else if (axiosError.request) {
    // 请求已发出但无响应
    return {
      message: '网络错误，请检查连接',
      code: 'NETWORK_ERROR',
      originalError: error,
    }
  } else {
    // 请求配置出错
    return {
      message: axiosError.message || '未知错误',
      originalError: error,
    }
  }
}