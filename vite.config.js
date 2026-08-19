import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0', // 允许外部访问
    proxy: {
      '/check': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // 不重写路径，保持/check 前缀
        rewrite: (path) => path
      }
    }
  },
  build: {
    // 目标环境
    target: 'es2015',
    
    // 代码分割优化
    rollupOptions: {
      output: {
        // 手动分割大块依赖 - 使用函数形式
        manualChunks(id) {
          if (id.includes('node_modules/element-plus')) {
            return 'element-plus'
          }
          if (id.includes('node_modules/vue') || 
              id.includes('node_modules/vue-router') || 
              id.includes('node_modules/pinia')) {
            return 'vue-vendor'
          }
        }
      }
    },
    
    // 资源大小限制
    chunkSizeWarningLimit: 800, // 提高警告限制到 800KB
    
    // CSS 优化
    cssCodeSplit: true,
    
    // CSS 压缩选项
    cssMinify: 'lightningcss',
    
    // 生成源码映射（生产环境可关闭）
    sourcemap: false
  },
  
  // CSS 相关优化
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '' // 可以在这里添加全局 SCSS 变量
      }
    }
  },
  
  // 优化依赖预构建
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'axios',
      'element-plus',
      '@element-plus/icons-vue',
      '@stomp/stompjs',
      'sockjs-client'
    ]
  }
})