import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'

// 启动时清理旧版本残留的 token（旧版前后台共用 token key，导致 /login 被误重定向）
// 旧版 admin 登录后 token 存在 'token' key 且 user.role === 'ADMIN'
// 新版已分离为 'token'（前台）和 'adminToken'（后台），需清除残留
;(function cleanupStaleTokens() {
  try {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      // 如果前台 user 是 ADMIN 角色，说明是旧版本残留的 admin token
      if (user?.role === 'ADMIN') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        console.info('[cleanup] 已清除旧版本残留的 admin token')
      }
    }
  } catch {
    // JSON 解析失败，清除损坏的数据
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }
})()

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
