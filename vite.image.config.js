// Vite 图片压缩优化配置
// 注意：需要先安装 vite-plugin-imagemin
// npm install --save-dev vite-plugin-imagemin

import viteImagemin from 'vite-plugin-imagemin'

export default function configImageCompression() {
  return viteImagemin({
    // 压缩 GIF
    gifsicle: {
      optimizationLevel: 7,
      interlaced: false
    },
    // 压缩 JPG
    mozjpeg: {
      quality: 65, // 质量 65%，平衡大小和质量
      progressive: true // 渐进式加载
    },
    // 压缩 PNG
    optipng: {
      optimizationLevel: 5
    },
    // 压缩 PNG
    pngquant: {
      quality: [0.65, 0.8], // 质量范围
      speed: 4 // 压缩速度
    },
    // 压缩 SVG
    svgo: {
      plugins: [
        {
          name: 'removeViewBox',
          active: false
        },
        {
          name: 'removeEmptyAttrs',
          active: true
        }
      ]
    }
  })
}
