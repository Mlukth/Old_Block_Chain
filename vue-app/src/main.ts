import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './index.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// 初始认证检查
const token = localStorage.getItem('auth_token')
const currentPath = window.location.pathname
if (!token && !currentPath.includes('/login')) {
  const redirect = encodeURIComponent(currentPath + window.location.search)
  window.location.href = `/login?redirect=${redirect}`
}

app.mount('#app')