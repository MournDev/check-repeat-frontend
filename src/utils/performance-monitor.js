/**
 * 前端性能监控配置
 * 
 * 使用方法：
 * 1. 在 main.js 中导入并初始化
 * 2. 查看浏览器控制台 Performance 标签
 * 3. 生产环境可连接到监控服务
 */

// 性能监控指标
const performanceMetrics = {
  // 页面加载时间
  loadTime: 0,
  // 首次内容绘制 (FCP)
  fcp: 0,
  // 最大内容绘制 (LCP)
  lcp: 0,
  // 首次输入延迟 (FID)
  fid: 0,
  // 累积布局偏移 (CLS)
  cls: 0
}

// 监听页面加载完成
window.addEventListener('load', () => {
  const timing = performance.timing
  
  // 计算页面加载时间
  performanceMetrics.loadTime = timing.loadEventEnd - timing.navigationStart
  
  console.log('📊 页面加载时间:', `${performanceMetrics.loadTime}ms`)
  
  // 获取 FCP (如果浏览器支持)
  if ('PerformanceObserver' in window) {
    const fcpObserver = new PerformanceObserver((entries) => {
      const fcpEntry = entries.getEntriesByName('first-contentful-paint')[0]
      if (fcpEntry) {
        performanceMetrics.fcp = fcpEntry.startTime
        console.log('🎨 首次内容绘制 (FCP):', `${Math.round(performanceMetrics.fcp)}ms`)
      }
    })
    
    try {
      fcpObserver.observe({ entryTypes: ['paint'] })
    } catch (e) {
      console.warn('FCP 观察失败:', e)
    }
  }
})

// 监听 LCP
if ('PerformanceObserver' in window) {
  const lcpObserver = new PerformanceObserver((entries) => {
    const lcpEntry = entries.getEntries().pop()
    if (lcpEntry) {
      performanceMetrics.lcp = lcpEntry.startTime
      console.log('🖼️ 最大内容绘制 (LCP):', `${Math.round(performanceMetrics.lcp)}ms`)
    }
  })
  
  try {
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
  } catch (e) {
    console.warn('LCP 观察失败:', e)
  }
}

// 监听 CLS
if ('PerformanceObserver' in window) {
  let clsValue = 0
  const clsObserver = new PerformanceObserver((entries) => {
    for (const entry of entries.getEntries()) {
      if (!entry.hadRecentInput) {
        clsValue += entry.value
      }
    }
    performanceMetrics.cls = clsValue
    console.log('📐 累积布局偏移 (CLS):', clsValue.toFixed(3))
  })
  
  try {
    clsObserver.observe({ entryTypes: ['layout-shift'] })
  } catch (e) {
    console.warn('CLS 观察失败:', e)
  }
}

// 资源加载监控
window.addEventListener('DOMContentLoaded', () => {
  const resources = performance.getEntriesByType('resource')
  
  console.log('\n📦 资源加载统计:')
  console.table(
    resources.map(r => ({
      名称: r.name.split('/').pop(),
      类型: r.initiatorType,
      大小: formatBytes(r.transferSize),
      时间: `${Math.round(r.duration)}ms`,
      持续时间: `${Math.round(r.startTime)}-${Math.round(r.responseEnd)}ms`
    }))
  )
  
  // 计算总大小
  const totalSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0)
  console.log('\n💾 总加载大小:', formatBytes(totalSize))
  console.log('⏱️ 总加载时间:', `${Math.round(resources.reduce((sum, r) => sum + r.duration, 0))}ms`)
})

// 辅助函数：格式化字节
function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// 导出性能数据（可用于发送到分析服务器）
export const getPerformanceData = () => ({ ...performanceMetrics })

// 性能警告阈值
const thresholds = {
  fcp: { good: 1000, poor: 3000 },
  lcp: { good: 2500, poor: 4000 },
  cls: { good: 0.1, poor: 0.25 },
  loadTime: { good: 3000, poor: 8000 }
}

// 检查性能是否达标
setTimeout(() => {
  console.log('\n🎯 性能评估:')
  
  if (performanceMetrics.fcp > 0) {
    const status = performanceMetrics.fcp < thresholds.fcp.good ? '✅' : 
                   performanceMetrics.fcp < thresholds.fcp.poor ? '⚠️' : '❌'
    console.log(`${status} FCP: ${Math.round(performanceMetrics.fcp)}ms`)
  }
  
  if (performanceMetrics.lcp > 0) {
    const status = performanceMetrics.lcp < thresholds.lcp.good ? '✅' : 
                   performanceMetrics.lcp < thresholds.lcp.poor ? '⚠️' : '❌'
    console.log(`${status} LCP: ${Math.round(performanceMetrics.lcp)}ms`)
  }
  
  if (performanceMetrics.cls > 0) {
    const status = performanceMetrics.cls < thresholds.cls.good ? '✅' : 
                   performanceMetrics.cls < thresholds.cls.poor ? '⚠️' : '❌'
    console.log(`${status} CLS: ${performanceMetrics.cls.toFixed(3)}`)
  }
}, 5000)
