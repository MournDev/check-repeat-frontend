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
import * as echarts from 'echarts'

// ECharts 原先由 index.html 从 cdn.jsdelivr.net 加载，因国内网络访问不稳定改为随包构建。
// 各图表页面沿用历史上的全局变量写法（window.echarts），故在此挂载，
// 使 6 个图表页面无需任何改动即可继续工作。
window.echarts = echarts

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
