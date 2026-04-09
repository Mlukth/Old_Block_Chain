import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

export function useAuth() {
  const authStore = useAuthStore()
  const router = useRouter()

  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const user = computed(() => authStore.user)

  const login = (token: string, userInfo?: { username: string; role: string }) => {
    authStore.login(token, userInfo)
  }

  const logout = () => {
    authStore.logout()
  }

  const requireAuth = (redirectPath = '/login') => {
    if (!authStore.isAuthenticated) {
      router.push(redirectPath)
      return false
    }
    return true
  }

  return {
    isAuthenticated,
    user,
    login,
    logout,
    requireAuth,
  }
}