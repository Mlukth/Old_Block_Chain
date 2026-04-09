import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const user = ref<{ username: string; role: string } | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  function login(newToken: string, userInfo?: { username: string; role: string }) {
    token.value = newToken
    localStorage.setItem('auth_token', newToken)
    if (userInfo) {
      user.value = userInfo
    }
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('auth_token')
    router.push('/login')
  }

  // 初始化时尝试从 token 解析用户信息（可选）
  function setUserInfo(userInfo: { username: string; role: string }) {
    user.value = userInfo
  }

  return {
    token,
    user,
    isAuthenticated,
    login,
    logout,
    setUserInfo,
  }
})