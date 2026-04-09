import api from '../index'
import type {
  ClearAllHistoryResponse,
  ResetAllHistoryResponse,
} from '@/types/api'

export const historyApi = {
  /**
   * 获取所有历史记录（已通过 /hash/history 提供，此处保留以兼容）
   */
  getAll: () =>
    api.get('/history'),

  /**
   * 清空已标记删除的历史记录
   */
  clearAll: () =>
    api.delete<ClearAllHistoryResponse>('/history/clear-all'),

  /**
   * 完全重置环境（删除所有记录和文件）
   */
  resetAll: () =>
    api.post<ResetAllHistoryResponse>('/history/reset-all'),
}