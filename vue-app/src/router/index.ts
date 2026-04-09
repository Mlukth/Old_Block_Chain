import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/Login.vue'),
      meta: { layout: 'auth' },
    },
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/Dashboard.vue'),
      meta: { requiresAuth: true, layout: 'default' },
    },
    {
      path: '/dashboard',
      redirect: '/',
    },
    {
      path: '/upload',
      name: 'upload',
      component: () => import('@/views/Upload.vue'),
      meta: { requiresAuth: true, layout: 'default' },
    },
    {
      path: '/verify',
      name: 'verify',
      component: () => import('@/views/Verify.vue'),
      meta: { requiresAuth: true, layout: 'default' },
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('@/views/History.vue'),
      meta: { requiresAuth: true, layout: 'default' },
    },
    {
      path: '/debug',
      name: 'debug',
      component: () => import('@/views/Debug.vue'),
      meta: { requiresAuth: true, layout: 'default' },
    },
  ],
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const isAuthenticated = authStore.isAuthenticated

  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router