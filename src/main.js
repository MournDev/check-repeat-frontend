import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import '@/assets/scss/index.scss' // 全局样式入口 (design tokens, Element Plus theme, typography)
import '@/styles/global-styles.scss' // Apple design utility styles
import './style.css' // Apple base overrides
//导入Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css' // Element Plus样式
// // 导入 Element Plus 图标
import * as ElementPlusIcons from '@element-plus/icons-vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
// 导入权限指令
import { registerPermissionDirective } from '@/directives/permission'

const app = createApp(App)

// 全局错误处理：防止组件渲染异常导致白屏
app.config.errorHandler = (err, instance, info) => {
  console.error('[Vue Global Error]', err, info)
  // 可以在此上报错误到监控平台
}

// 全局注册所有 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIcons)) {
  app.component(key, component)
}
// 注册权限指令
registerPermissionDirective(app)
app.use(createPinia())
app.use(router)
app.use(ElementPlus,{
  locale: zhCn,
})
// 恢复用户状态
import { useUserStore } from './stores/user'
const userStore = useUserStore()
userStore.restoreFromStorage()
app.mount('#app')
