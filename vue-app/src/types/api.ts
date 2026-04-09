/**
 * API 类型定义 - 基于后端实际返回结构
 */

// ==================== 认证相关 ====================

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  success: boolean
  token: string
  user: {
    username: string
    role: string
  }
}

export interface RefreshTokenResponse {
  success: boolean
  token: string
}

export interface ProfileResponse {
  success: boolean
  profile: {
    id: number
    username: string
    role: string
    createdAt: string
  }
}

export interface MeResponse {
  success: boolean
  user: {
    userId: number
    username: string
    role: string
  }
}

export interface LogoutResponse {
  success: boolean
  message: string
}

// ==================== 哈希相关 ====================

export interface CalculateHashResponse {
  success: boolean
  hash: string // 带 0x 前缀的 64 位十六进制字符串
}

export interface UploadToBlockchainResponse {
  success: boolean
  imageUrl: string
  blockHeight: number | null
}

export interface VerifyHashRequest {
  hash: string
}

export interface VerifyHashResponse {
  success: boolean
  isVerified: boolean
  message: string
}

export interface CheckExistenceRequest {
  hash: string
}

export interface CheckExistenceResponse {
  exists: boolean
}

export interface DeleteHashResponse {
  success: boolean
  message: string
}

export interface HistoryRecord {
  id: number
  hash: string
  filename: string
  status: 'confirmed' | 'deleted'
  timestamp: string
  blockHeight: number | null
  imageUrl: string
}

export interface HashListResponse {
  success: boolean
  data: Array<{
    id: number
    hash: string
    timestamp: string
  }>
}

// ==================== 调试相关 ====================

export interface DebugStorageResponse {
  storagePath?: string
  storageDir?: string
  exists: boolean
  fileCount: number
  files: Array<{
    name: string
    size?: number
    url?: string
    path?: string
    created?: string
  }>
  message?: string
}

export interface DebugPathsResponse {
  storagePath: string
  baseUrl: string
  files: string[]
}

export interface ImageConsistencyResponse {
  storagePath: string
  totalRecords: number
  matchedRecords: number
  results: Array<{
    id: number
    dbHash: string
    expectedFile: string
    actualFile: string
    fileExists: boolean
    status: string
  }>
}

export interface VerifyStateResponse {
  success: boolean
  message?: string
  error?: string
  stats?: {
    chainHashes: number
    dbRecords: number
    imageFiles: number
  }
}

// ==================== 历史管理相关 ====================

export interface ClearAllHistoryResponse {
  success: boolean
  message: string
  clearedCount: number
}

export interface ResetAllHistoryResponse {
  success: boolean
  message: string
  stats: {
    deletedRecords: number
    deletedFiles: number
    deletedDirectories: number
  }
}