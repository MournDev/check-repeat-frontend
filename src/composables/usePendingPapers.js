import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getPendingReviewList,
  getPendingStats,
  getTodayReviewedCount
} from '@/api/teacher.js'
import { getAllColleges } from '@/api/user'

// ── 截止时间判定（模块级导出，供表格组件复用）────────────────
export const isOverdue = (paper) => {
  if (!paper) return false
  const deadlineStr = paper.deadline
  if (!deadlineStr) return false
  const deadline = new Date(deadlineStr)
  if (isNaN(deadline.getTime())) return false
  return deadline.getTime() < Date.now()
}

export const isUrgent = (paper) => {
  if (!paper) return false
  const deadlineStr = paper.deadline
  if (!deadlineStr) return false
  const deadline = new Date(deadlineStr)
  if (isNaN(deadline.getTime())) return false
  const hoursLeft = (deadline - Date.now()) / (1000 * 60 * 60)
  return hoursLeft >= 0 && hoursLeft < 24
}

/**
 * 待审核论文：列表加载 / normalize / 筛选 / 排序 / 前端分页 / 统计
 * @param {Object} options
 * @param {Function} [options.onLoaded] 列表重新拉取后的回调（用于清空 reserve-selection 残留勾选）
 */
export function usePendingPapers(options = {}) {
  const { onLoaded } = options

  // 论文数据与统计
  const papers = ref([])
  const loading = ref(false)
  const stats = reactive({
    totalPending: 0,
    urgentPending: 0,
    avgWaitingTime: 0,
    todayReviewed: 0
  })

  // 筛选条件
  const searchKeyword = ref('')
  const debouncedKeyword = ref('')
  let keywordTimer = null
  watch(searchKeyword, (value) => {
    clearTimeout(keywordTimer)
    keywordTimer = setTimeout(() => {
      debouncedKeyword.value = value
    }, 300)
  })

  const filterPriority = ref('')
  const filterCollege = ref('')
  const filterSimilarity = ref('')
  const collegeList = ref([])

  // 快捷过滤：'overdue' | 'urgent' | null
  const activeQuickFilter = ref(null)

  // 排序状态（单一事实来源，由表头 sort-change 驱动）
  const sortState = reactive({ prop: 'submitTime', order: 'descending' })

  // 分页（阶段 A：接口按上限 200 拉取，前端筛选/排序/分页）
  const currentPage = ref(1)
  const pageSize = ref(20)

  // ── 状态条聚合 ────────────────────────────────────────────
  const overduePapers = computed(() => {
    if (!Array.isArray(papers.value)) return []
    return papers.value.filter(p => isOverdue(p))
  })

  const urgentPapers = computed(() => {
    if (!Array.isArray(papers.value)) return []
    return papers.value.filter(p => !isOverdue(p) && isUrgent(p))
  })

  const alertTitle = computed(() => {
    const overdueCount = overduePapers.value.length
    const urgentCount = urgentPapers.value.length
    if (overdueCount > 0 && urgentCount > 0) {
      return `您有 ${overdueCount} 篇论文已超时，${urgentCount} 篇论文即将超时，请尽快处理`
    }
    if (overdueCount > 0) {
      return `您有 ${overdueCount} 篇论文已超时，请立即处理`
    }
    return `您有 ${urgentCount} 篇论文即将超时，请尽快处理`
  })

  // ── 筛选操作 ──────────────────────────────────────────────
  const setQuickFilter = (value) => {
    activeQuickFilter.value = value
  }

  const toggleQuickFilter = (value) => {
    activeQuickFilter.value = activeQuickFilter.value === value ? null : value
  }

  const anyFilterActive = computed(() => {
    return activeQuickFilter.value !== null
      || !!filterPriority.value
      || !!filterCollege.value
      || !!filterSimilarity.value
      || !!debouncedKeyword.value
  })

  const resetFilters = () => {
    searchKeyword.value = ''
    debouncedKeyword.value = ''
    filterPriority.value = ''
    filterCollege.value = ''
    filterSimilarity.value = ''
    activeQuickFilter.value = null
  }

  // ── 列表派生：筛选 + 排序 ─────────────────────────────────
  const filteredPapers = computed(() => {
    const papersArray = Array.isArray(papers.value) ? [...papers.value] : []
    let result = papersArray

    // 快捷过滤：超时 / 紧急（互斥，覆盖默认排序）
    if (activeQuickFilter.value === 'overdue') {
      result = result.filter(p => isOverdue(p))
    } else if (activeQuickFilter.value === 'urgent') {
      result = result.filter(p => !isOverdue(p) && isUrgent(p))
    }

    // 关键词搜索：学生姓名 / 学号 / 论文标题
    const keyword = debouncedKeyword.value.trim().toLowerCase()
    if (keyword) {
      result = result.filter(paper => {
        return [paper.studentName, paper.studentId, paper.studentNo, paper.paperTitle]
          .some(field => field != null && String(field).toLowerCase().includes(keyword))
      })
    }

    // 按优先级筛选（兼容字符串和数字）
    if (filterPriority.value) {
      const priorityMap = { urgent: ['urgent', 2], high: ['high', 1], normal: ['normal', 0] }
      const match = priorityMap[filterPriority.value] || []
      result = result.filter(paper => match.includes(paper.priority))
    }

    // 按学院筛选（精确匹配）
    if (filterCollege.value) {
      result = result.filter(paper => paper.college === filterCollege.value)
    }

    // 按相似度筛选
    if (filterSimilarity.value) {
      result = result.filter(paper => {
        const s = paper.similarity
        if (filterSimilarity.value === 'low') return s < 15
        if (filterSimilarity.value === 'medium') return s >= 15 && s < 30
        if (filterSimilarity.value === 'high') return s >= 30
        return true
      })
    }

    // 排序（由表头 sort-change 驱动）
    const { prop, order } = sortState
    result.sort((a, b) => {
      let diff = 0
      if (prop === 'waitingTime') {
        diff = (Number(a.waitingTime) || 0) - (Number(b.waitingTime) || 0)
      } else {
        diff = new Date(a.submitTime) - new Date(b.submitTime)
      }
      return order === 'ascending' ? diff : -diff
    })

    return result
  })

  // 当前页切片
  const pagedPapers = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    return filteredPapers.value.slice(start, start + pageSize.value)
  })

  // 任意筛选条件变化时回到第 1 页
  watch([filterPriority, filterCollege, filterSimilarity, activeQuickFilter, debouncedKeyword], () => {
    currentPage.value = 1
  })

  const handleSizeChange = (size) => {
    pageSize.value = size
    currentPage.value = 1
  }

  const handlePageChange = (page) => {
    currentPage.value = page
  }

  const handleSortChange = ({ prop, order }) => {
    if (prop && order) {
      sortState.prop = prop
      sortState.order = order
    } else {
      // 第三态（取消排序）回到默认：提交时间倒序
      sortState.prop = 'submitTime'
      sortState.order = 'descending'
    }
  }

  // ── 数据加载 ──────────────────────────────────────────────
  // 增强的 normalize 函数，支持从嵌套结构中获取字段
  const normalize = (item) => {
    const base = item?.paperBaseInfo || {}
    const task = item?.taskBaseInfo || {}

    return {
      ...item,
      // 保持兼容性，确保所有字段都有合理的默认值
      paperId: item.paperId ?? base.paperId ?? item.id ?? null,
      paperTitle: item.paperTitle ?? base.paperTitle ?? '',
      studentName: item.studentName ?? base.studentName ?? '',
      studentId: item.studentId ?? base.studentId ?? '',
      studentNo: item.studentNo ?? base.studentNo ?? '',
      submitTime: item.submitTime ?? base.submitTime ?? null,
      similarity: item.similarity ?? task.checkRate ?? 0,
      waitingTime: item.waitingTime ?? 0,
      priority: item.priority ?? 'normal',
      deadline: item.deadline ?? null,
      college: item.college ?? base.college ?? '未知学院',
      email: item.email ?? base.email ?? '',
      version: item.version ?? base.version ?? 1,
      wordCount: item.wordCount ?? base.wordCount ?? null,
      pageCount: item.pageCount ?? base.pageCount ?? null,
      // 签核状态：后端顶层与 paperBaseInfo 都会带，缺失时按「可批量」兜底，
      // 最终仍由 do-review 的服务端签核门校验
      signoffQualified: item.signoffQualified ?? base.signoffQualified ?? false,
      signoffId: item.signoffId ?? base.signoffId ?? null,
      canBatchReview: item.canBatchReview ?? base.canBatchReview ?? true
    }
  }

  const getTodayReviewedCountLocal = async () => {
    try {
      const response = await getTodayReviewedCount()
      if (response?.code === 200 && response?.data) {
        stats.todayReviewed = response.data.count || 0
      } else {
        stats.todayReviewed = 0
      }
    } catch (error) {
      console.error('获取今日审核数量失败:', error)
      stats.todayReviewed = 0
    }
  }

  const refreshList = async () => {
    loading.value = true
    try {
      // 并行获取论文列表和统计信息（接口支持分页参数，按上限拉取，前端做筛选/分页）
      const [listResponse, statsResponse] = await Promise.all([
        getPendingReviewList(1, 200),
        getPendingStats()
      ])

      const raw = listResponse?.data?.records || []
      const list = raw
        .filter(it => it && typeof it === 'object' && (Object.keys(it).length > 0))
        .map(normalize)

      papers.value = list

      // reserve-selection 会保留跨页勾选，重新拉取后部分行可能已失效（如已审核），需清空
      onLoaded?.()

      // 刷新后若当前页超出范围，回到第 1 页
      const maxPage = Math.max(1, Math.ceil(filteredPapers.value.length / pageSize.value))
      if (currentPage.value > maxPage) {
        currentPage.value = 1
      }

      // 更新统计数据（使用后端返回的真实数据）
      if (statsResponse?.code === 200 && statsResponse?.data) {
        const backendStats = statsResponse.data
        stats.totalPending = backendStats.totalPending ?? list.length
        stats.urgentPending = backendStats.urgentPending ?? 0
        stats.avgWaitingTime = backendStats.avgWaitingTime ?? 0
        stats.todayReviewed = backendStats.todayReviewed ?? 0
      } else {
        // 后端接口异常时使用前端计算
        stats.totalPending = list.length
        const overdueCount = list.filter(p => isOverdue(p)).length
        const soonCount = list.filter(p => !isOverdue(p) && isUrgent(p)).length
        stats.urgentPending = overdueCount + soonCount

        if (list.length > 0) {
          const totalWaitingTime = list.reduce((sum, paper) => sum + (Number(paper.waitingTime) || 0), 0)
          stats.avgWaitingTime = parseFloat((totalWaitingTime / list.length).toFixed(1))
        } else {
          stats.avgWaitingTime = 0
        }
        // 获取今日审核数
        getTodayReviewedCountLocal()
      }
    } catch (error) {
      console.error('获取待审核论文列表失败:', error)
      ElMessage.error('获取数据失败，请重试')
    } finally {
      loading.value = false
    }
  }

  const loadColleges = async () => {
    try {
      const res = await getAllColleges()
      if (res.code === 200) {
        collegeList.value = res.data || []
      }
    } catch (e) {
      console.error('获取学院列表失败:', e)
    }
  }

  return {
    // 数据
    papers,
    loading,
    stats,
    collegeList,
    // 筛选
    searchKeyword,
    filterPriority,
    filterCollege,
    filterSimilarity,
    activeQuickFilter,
    anyFilterActive,
    // 排序 / 分页
    sortState,
    currentPage,
    pageSize,
    filteredPapers,
    pagedPapers,
    // 状态条
    overduePapers,
    urgentPapers,
    alertTitle,
    // 方法
    refreshList,
    loadColleges,
    setQuickFilter,
    toggleQuickFilter,
    resetFilters,
    handleSortChange,
    handleSizeChange,
    handlePageChange
  }
}
