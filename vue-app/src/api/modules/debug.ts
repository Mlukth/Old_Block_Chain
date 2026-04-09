import api from '../index'
import type {
  DebugStorageResponse,
  ImageConsistencyResponse,
  VerifyStateResponse,
} from '@/types/api'

export const debugApi = {
  /**
   * 获取存储目录信息
   */
  getStorage: () =>
    api.get<DebugStorageResponse>('/debug/storage'),

  /**
   * 检查图片与数据库一致性
   */
  getImageConsistency: () =>
    api.get<ImageConsistencyResponse>('/debug/image-consistency'),

  /**
   * 验证区块链、数据库、文件系统状态一致性
   */
  verifyState: () =>
    api.post<VerifyStateResponse>('/debug/verify-state'),
}