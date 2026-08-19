import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import '@/assets/scss/index.scss' // 全局样式
//导入Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css' // Element Plus样式
// // 导入 Element Plus 图标
import * as ElementPlusIcons from '@element-plus/icons-vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

const app = createApp(App)
// 全局注册所有 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIcons)) {
  app.component(key, component)
}
app.use(createPinia())
app.use(router)
app.use(ElementPlus,{
  locale: zhCn,
})
app.mount('#app')
