import { ref, shallowRef, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'

// 全站共享一个 window resize 监听：每个 useChart 实例把 resize 函数注册进集合，
// 避免 N 张图挂 N 个 window listener（此前各页面自行 add/removeEventListener）
const resizers = new Set()
let resizeListenerBound = false

function ensureGlobalResizeListener() {
  if (resizeListenerBound) return
  resizeListenerBound = true
  window.addEventListener('resize', () => {
    resizers.forEach((fn) => fn())
  })
}

/**
 * echarts 图表生命周期 composable。
 *
 * 收敛全站图表的重复样板：容器 ref、实例 dispose、resize、空态切换。
 *
 * 模板用法：
 *   <el-empty v-if="chart.empty" description="暂无数据" />
 *   <div v-else :ref="chart.chartRef" class="chart-container"></div>
 *
 * 脚本用法：
 *   const chart = useChart()
 *   await chart.run(() => getXxxApi(), (res) => {
 *     const data = normalize(res)                     // 数据清洗留在页面
 *     return data.length ? buildOption(data) : null   // 返回 null → 显空态
 *   })
 *
 * 约定：
 * - option 为 falsy 时自动切空态并释放实例；el-empty ↔ 容器的 v-if 切换
 *   由内部 nextTick 兜底，页面无需关心容器挂载时机
 * - 接口失败只记 console.error，不重复弹 toast（axios 拦截器已统一提示）
 * - 组件卸载自动 dispose 并注销 resize
 */
export function useChart() {
  const chartRef = shallowRef(null)
  const empty = ref(false)
  let instance = null

  const resize = () => {
    if (instance) instance.resize()
  }

  const dispose = () => {
    resizers.delete(resize)
    if (instance) {
      instance.dispose()
      instance = null
    }
  }

  /** 渲染 option；传 falsy（null/undefined）显示空态 */
  const render = async (option) => {
    dispose()
    if (!option) {
      empty.value = true
      return
    }
    empty.value = false
    // empty 复位可能触发 el-empty ↔ 容器的 v-if 切换，等容器真正挂载后再 init
    await nextTick()
    if (!chartRef.value) return
    instance = echarts.init(chartRef.value)
    instance.setOption(option)
    ensureGlobalResizeListener()
    resizers.add(resize)
  }

  /**
   * 取数 + 渲染一站式。toOption 支持异步工厂（可在其中继续发起 fallback 请求）。
   * 返回空 option 或 fetcher 抛错均落空态，业务错误提示由 axios 拦截器统一弹出
   */
  const run = async (fetcher, toOption) => {
    try {
      const data = await fetcher()
      await render(toOption ? await toOption(data) : data)
    } catch (error) {
      console.error('[useChart] 图表数据加载失败:', error)
      await render(null)
    }
  }

  /**
   * 原地更新：复用已有实例 setOption(notMerge)，不销毁重建。
   * 适用于定时轮询刷新的图表（如监控页），避免每次刷新闪屏。
   * 传 falsy 走空态；实例尚未创建时等价于 render(option)
   */
  const update = async (option) => {
    if (!option) {
      await render(null)
      return
    }
    empty.value = false
    await nextTick()
    if (!chartRef.value) return
    if (!instance) {
      instance = echarts.init(chartRef.value)
      ensureGlobalResizeListener()
      resizers.add(resize)
    }
    instance.setOption(option, true)
  }

  onUnmounted(dispose)

  return { chartRef, empty, render, run, update, dispose, resize }
}
