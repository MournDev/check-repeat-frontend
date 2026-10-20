import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getSimpleCheckReport, getPaperReport, exportCheckReport } from '@/api/teacher.js'
import { saveBlobAs } from '@/utils/download.js'

const emptyMetrics = () => ({
  repeatRate: null,
  originalRate: null,
  maxPerSource: null,
  citationRate: null,
  repeatParagraphCount: null,
  totalParagraphCount: null
})

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

/**
 * 审核工作台查重报告加载：报告列表 → 最新报告详情 → 归一化。
 * - paperId 变化自动重载；用请求序号丢弃过期响应，避免快速切换论文时串数据
 * - 后端未提供 citationRate，固定 null，由展示层显示「—」
 */
export function useWorkbenchReport(paperIdRef) {
  const loading = ref(false)
  const error = ref('')
  const noReport = ref(false)
  const latestReport = ref(null)
  const baseInfo = ref({})
  const metrics = ref(emptyMetrics())
  const sources = ref([])
  const paragraphs = ref([])

  let requestSeq = 0

  const reset = () => {
    loading.value = false
    error.value = ''
    noReport.value = false
    latestReport.value = null
    baseInfo.value = {}
    metrics.value = emptyMetrics()
    sources.value = []
    paragraphs.value = []
  }

  const reload = async () => {
    const paperId = paperIdRef.value ? String(paperIdRef.value) : ''
    const seq = ++requestSeq

    if (!paperId) {
      reset()
      return
    }

    loading.value = true
    error.value = ''
    noReport.value = false
    latestReport.value = null
    baseInfo.value = {}
    metrics.value = emptyMetrics()
    sources.value = []
    paragraphs.value = []

    try {
      const listRes = await getSimpleCheckReport(paperId)
      if (seq !== requestSeq) return

      const list = Array.isArray(listRes?.data)
        ? listRes.data
        : (Array.isArray(listRes?.data?.records) ? listRes.data.records : [])
      const latest = [...list].sort(
        (a, b) => new Date(b?.createTime || 0) - new Date(a?.createTime || 0)
      )[0]

      if (!latest?.id) {
        noReport.value = true
        return
      }

      latestReport.value = latest

      const detailRes = await getPaperReport(latest.id)
      if (seq !== requestSeq) return

      if (detailRes?.code !== 200 || !detailRes.data) {
        error.value = detailRes?.message || '报告详情加载失败'
        return
      }

      const data = detailRes.data
      const rateStat = data.rateStat || {}
      const info = data.baseInfo || {}
      const sourceList = Array.isArray(data.similarSources) ? data.similarSources : []
      const maxPerSource = sourceList.length
        ? Math.max(...sourceList.map(item => toNumber(item.maxSimilarity) ?? 0))
        : null

      baseInfo.value = {
        ...info,
        checkTime: info.checkTime || latest.createTime || ''
      }
      sources.value = sourceList
      paragraphs.value = Array.isArray(data.paragraphs) ? data.paragraphs : []
      metrics.value = {
        repeatRate: toNumber(rateStat.repeatRate ?? info.similarityRate),
        originalRate: toNumber(rateStat.originalRate),
        maxPerSource,
        citationRate: null,
        repeatParagraphCount: rateStat.repeatParagraphCount ?? null,
        totalParagraphCount: rateStat.totalParagraphCount ?? null
      }
    } catch (e) {
      if (seq !== requestSeq) return
      error.value = e?.message || '查重报告加载失败'
    } finally {
      if (seq === requestSeq) loading.value = false
    }
  }

  const downloadFullReport = async () => {
    const report = latestReport.value
    if (!report?.id) {
      ElMessage.warning('暂无可下载的查重报告')
      return
    }
    try {
      const res = await exportCheckReport(report.id, 'pdf')
      const blob = res.data instanceof Blob ? res.data : new Blob([res.data])
      const fileName = `${report.reportNo || baseInfo.value.reportNo || '查重报告'}.pdf`
      saveBlobAs(blob, fileName)
      ElMessage.success('查重报告下载成功')
    } catch (e) {
      // 响应拦截器已按后端 message 提示，这里不重复弹窗
      console.error('查重报告下载失败:', e)
    }
  }

  watch(paperIdRef, reload, { immediate: true })

  return {
    loading,
    error,
    noReport,
    latestReport,
    baseInfo,
    metrics,
    sources,
    paragraphs,
    reload,
    downloadFullReport
  }
}
