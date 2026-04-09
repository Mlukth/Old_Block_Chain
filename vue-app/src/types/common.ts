/**
 * 通用 API 响应包装类型（部分端点使用）
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

/**
 * 分页参数
 */
export interface PaginationParams {
  page?: number
  limit?: number
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}