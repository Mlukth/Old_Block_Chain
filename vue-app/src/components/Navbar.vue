<template>
  <nav class="navbar py-4 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <!-- 左侧区域：系统标识 -->
        <div class="flex items-center">
          <div class="flex-shrink-0 flex items-center">
            <i class="fa fa-link text-white text-2xl mr-2"></i>
            <span class="font-bold text-lg text-white">哈希上链系统</span>
          </div>
        </div>

        <!-- 导航链接 - 仅在登录后显示 -->
        <div
          v-if="isLoggedIn && currentPage !== 'login'"
          class="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 w-full md:w-auto"
        >
          <RouterLink
            v-for="btn in navButtons"
            :key="btn.id"
            :to="btn.path"
            class="px-4 py-2 rounded-lg font-medium flex items-center justify-center transition-colors"
            :class="[
              currentPage === btn.id
                ? 'bg-white/20 text-white border-b-2 border-white'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            ]"
          >
            <i :class="`fa ${btn.icon} mr-2`"></i>
            <span>{{ btn.label }}</span>
          </RouterLink>
        </div>

        <!-- 右侧区域：用户操作 -->
        <div class="w-full md:w-auto">
          <div v-if="isLoggedIn" class="flex items-center justify-end">
            <!-- 网络状态指示器 -->
            <div class="flex items-center mr-4">
              <div
                class="w-3 h-3 rounded-full mr-2"
                :class="isOnline ? 'bg-green-500' : 'bg-red-500'"
              ></div>
              <span class="text-sm text-white/80 hidden md:block">
                {{ isOnline ? '在线' : '离线' }}
              </span>
            </div>

            <span class="text-white/80 mr-3 hidden md:block">admin</span>
            <button
              @click="$emit('signOut')"
              class="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors"
            >
              <i class="fa fa-sign-out mr-2"></i> 退出登录
            </button>
          </div>
          <RouterLink
            v-else
            to="/login"
            class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center transition-colors"
          >
            <i class="fa fa-sign-in mr-2"></i> 登录
          </RouterLink>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

defineProps<{
  isLoggedIn: boolean
}>()

defineEmits<{
  (e: 'signOut'): void
}>()

const route = useRoute()

// 确定当前页面ID
const currentPage = computed(() => {
  const path = route.path
  if (path === '/') return 'dashboard'
  if (path === '/upload') return 'upload'
  if (path === '/verify') return 'verify'
  if (path === '/history') return 'history'
  if (path === '/debug') return 'debug'
  if (path === '/login') return 'login'
  return ''
})

const navButtons = [
  { id: 'dashboard', label: '控制台', icon: 'fa-home', path: '/' },
  { id: 'upload', label: '图片上传', icon: 'fa-cloud-upload', path: '/upload' },
  { id: 'verify', label: '哈希验证', icon: 'fa-check-circle', path: '/verify' },
  { id: 'history', label: '历史记录', icon: 'fa-history', path: '/history' },
  { id: 'debug', label: '调试工具', icon: 'fa-bug', path: '/debug' },
]

// 网络状态
const isOnline = ref(navigator.onLine)

const updateOnlineStatus = () => {
  isOnline.value = navigator.onLine
}

onMounted(() => {
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
})

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
})
</script>

<style scoped>
/* 导航栏样式已在全局 index.css 的 .navbar 中定义 */
</style>