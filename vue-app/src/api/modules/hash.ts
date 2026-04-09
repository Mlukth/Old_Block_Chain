import api from '../index'
import type {
  CalculateHashResponse,
  UploadToBlockchainResponse,
  VerifyHashRequest,
  VerifyHashResponse,
  CheckExistenceRequest,
  CheckExistenceResponse,
  DeleteHashResponse,
  HistoryRecord,
  HashListResponse,
  DebugStorageResponse,
  DebugPathsResponse,
} from '@/types/api'

export const hashApi = {
  /**
   * 计算图片哈希值
   * @param file 图片文件
   */
  calculateHash: (file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    return api.post<CalculateHashResponse>('/hash/calculate-hash', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  /**
   * 上传图片并上链
   * @param file 图片文件
   * @param hash 预计算的哈希值
   */
  uploadToBlockchain: (file: File, hash: string) => {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('hash', hash)
    return api.post<UploadToBlockchainResponse>('/hash/upload-to-blockchain', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  /**
   * 仅上传哈希值上链（不传图片）
   * @param hash 哈希值
   */
  uploadHashOnly: (hash: string) =>
    api.post<UploadToBlockchainResponse>('/hash/upload-to-blockchain', { hash }),

  /**
   * 验证哈希是否在链上
   */
  verifyHash: (data: VerifyHashRequest) =>
    api.post<VerifyHashResponse>('/hash/verify-hash', data),

  /**
   * 检查哈希是否存在于链上（轻量级）
   */
  checkExistence: (data: CheckExistenceRequest) =>
    api.post<CheckExistenceResponse>('/hash/check-existence', data),

  /**
   * 删除哈希记录（软删除）
   */
  deleteHash: (hash: string) =>
    api.delete<DeleteHashResponse>(`/hash/delete-hash/${hash}`),

  /**
   * 获取上传历史记录
   */
  getHistory: () =>
    api.get<HistoryRecord[]>('/hash/history'),

  /**
   * 获取哈希列表（受保护）
   */
  getHashList: () =>
    api.get<HashListResponse>('/hash/list'),

  /**
   * 获取图片存储调试信息
   */
  getDebugImageStorage: () =>
    api.get<DebugStorageResponse>('/hash/debug/image-storage'),

  /**
   * 获取存储信息详情
   */
  getStorageInfo: () =>
    api.get<DebugStorageResponse>('/hash/debug/storage-info'),

  /**
   * 获取路径调试信息
   */
  getDebugPaths: () =>
    api.get<DebugPathsResponse>('/hash/debug/paths'),
}