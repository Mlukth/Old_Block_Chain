<template>
  <div class="min-h-screen flex flex-col">
    <Navbar :isLoggedIn="authStore.isAuthenticated" @signOut="handleSignOut" />
    <main class="flex-grow">
      <router-view />
    </main>
    <footer class="bg-dark text-white/70 py-8">
      <div class="container mx-auto px-4">
        <div class="text-center">
          <div class="mb-4">
            <h4 class="text-white font-medium">区块链哈希工具</h4>
            <p class="text-sm">为图片提供安全的哈希计算与区块链存证服务</p>
          </div>
          <div class="text-sm">
            <p>联系我们: support@blockhash.io</p>
          </div>
          <div class="mt-6 pt-4 border-t border-white/10 text-center text-sm">
            © 2025 区块链哈希存证系统 · 版权所有
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import Navbar from '@/components/Navbar.vue'

const authStore = useAuthStore()

const handleSignOut = () => {
  authStore.logout()
}
</script>