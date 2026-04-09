import api from '../index'
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
  ProfileResponse,
  MeResponse,
  LogoutResponse,
} from '@/types/api'

export const authApi = {
  /**
   * 用户登录
   */
  login: (credentials: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', credentials),

  /**
   * 刷新访问令牌
   */
  refreshToken: () =>
    api.post<RefreshTokenResponse>('/auth/refresh-token'),

  /**
   * 获取当前用户详细资料
   */
  getProfile: () =>
    api.get<ProfileResponse>('/auth/profile'),

  /**
   * 获取当前用户简要信息 (别名 /me)
   */
  getMe: () =>
    api.get<MeResponse>('/auth/me'),

  /**
   * 用户登出
   */
  logout: () =>
    api.post<LogoutResponse>('/auth/logout'),
}