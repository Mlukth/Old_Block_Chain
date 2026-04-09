<template>
  <div class="min-h-screen flex flex-col bg-gradient-to-br from-primary to-secondary">
    <!-- 顶部系统标识 -->
    <div class="py-12 px-6 flex items-center justify-center">
      <div class="flex items-center">
        <i class="fa fa-link text-white text-4xl mr-3"></i>
        <span class="font-bold text-3xl text-white">哈希上链系统</span>
      </div>
    </div>

    <!-- 登录表单 -->
    <div class="flex-grow flex items-center justify-center px-4">
      <div class="w-full max-w-md">
        <div class="bg-white/10 rounded-2xl shadow-2xl p-8 border border-white/20">
          <h2 class="text-2xl font-bold text-white text-center mb-8">用户登录</h2>

          <!-- 错误提示 -->
          <div v-if="error" class="mb-6 p-3 bg-red-500/20 text-red-100 rounded-lg text-center">
            {{ error }}
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-6">
            <!-- 用户名 -->
            <div>
              <label for="username" class="block text-sm font-medium text-white mb-2">
                用户名
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i class="fa fa-user text-white/80"></i>
                </div>
                <input
                  id="username"
                  v-model="username"
                  type="text"
                  class="pl-10 w-full bg-white/20 border border-white/30 rounded-xl py-4 px-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                  placeholder="请输入用户名"
                  :disabled="isLoading"
                />
              </div>
            </div>

            <!-- 密码 -->
            <div>
              <label for="password" class="block text-sm font-medium text-white mb-2">
                密码
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i class="fa fa-lock text-white/80"></i>
                </div>
                <input
                  id="password"
                  v-model="password"
                  type="password"
                  class="pl-10 w-full bg-white/20 border border-white/30 rounded-xl py-4 px-4 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                  placeholder="请输入密码"
                  :disabled="isLoading"
                />
              </div>
            </div>

            <!-- 登录按钮 -->
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full bg-white text-primary hover:bg-gray-100 font-bold py-4 px-4 rounded-xl transition duration-300 ease-in-out transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="isLoading" class="flex items-center justify-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                登录中...
              </span>
              <span v-else class="flex items-center justify-center">
                <i class="fa fa-sign-in mr-2"></i>
                登录
              </span>
            </button>

            <!-- 开发者跳过登录 -->
            <button
              type="button"
              @click="handleDebugLogin"
              class="mt-4 text-sm text-white/80 underline w-full text-center hover:text-white"
            >
              开发者: 跳过登录
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { authApi } from '@/api/modules/auth'
import { handleApiError } from '@/utils/errorHandler'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)

const handleSubmit = async () => {
  error.value = ''
  isLoading.value = true

  try {
    const response = await authApi.login({
      username: username.value,
      password: password.value,
    })

    // 响应拦截器已返回 data，所以 response 就是后端返回的 { success, token, user }
    if (response.success) {
      // 存储 token 并更新状态
      authStore.login(response.token)

      // 验证存储
      const storedToken = localStorage.getItem('auth_token')
      if (storedToken !== response.token) {
        console.error('令牌存储失败! 预期:', response.token, '实际:', storedToken)
        error.value = '令牌存储失败，请检查浏览器设置'
        return
      }

      console.log('登录成功，存储的令牌:', storedToken)

      // 跳转到重定向地址或首页
      const redirect = route.query.redirect as string
      router.push(redirect || '/')
    } else {
      throw new Error('登录失败')
    }
  } catch (err) {
    const apiError = handleApiError(err)
    let errorMessage = apiError.message

    if (errorMessage.includes('401') || errorMessage.includes('用户名或密码')) {
      errorMessage = '用户名或密码不正确'
    } else if (errorMessage.includes('Network Error') || errorMessage.includes('fetch')) {
      errorMessage = '无法连接到服务器'
    }

    error.value = errorMessage
  } finally {
    isLoading.value = false
  }
}

const handleDebugLogin = () => {
  const debugToken = 'debug-token'
  authStore.login(debugToken)
  const redirect = route.query.redirect as string
  router.push(redirect || '/')
}
</script>