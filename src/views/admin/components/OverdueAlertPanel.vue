<template>
  <section class="overdue-panel">
    <header class="panel-head">
      <div class="panel-title">
        <el-icon><Warning /></el-icon>
        <span>超期论文预警</span>
        <el-tag size="small" type="info" effect="plain">{{ total }} 篇</el-tag>
      </div>
      <el-button
        type="primary"
        size="small"
        :icon="Bell"
        :loading="reminding"
        :disabled="records.length === 0"
        @click="remindAll"
      >
        一键催办
      </el-button>
    </header>

    <div class="level-chips" role="group" aria-label="按超期天数筛选">
      <button
        v-for="chip in chips"
        :key="chip.value"
        type="button"
        class="level-chip"
        :class="{ active: level === chip.value }"
        :aria-pressed="level === chip.value"
        @click="changeLevel(chip.value)"
      >
        {{ chip.label }}
        <span class="chip-count">{{ chip.count }}</span>
      </button>
    </div>

    <el-table
      :data="records"
      size="small"
      class="overdue-table"
      :max-height="300"
      v-loading="loading"
      @row-click="openPaperDrawer"
    >
      <el-table-column prop="studentName" label="学生" width="84" show-overflow-tooltip />
      <el-table-column prop="paperTitle" label="论文" min-width="160" show-overflow-tooltip />
      <el-table-column prop="advisorName" label="导师" width="84" show-overflow-tooltip />
      <el-table-column label="超期" width="76" align="center">
        <template #default="{ row }">
          <span class="overdue-days" :class="{ severe: row.overdueDays >= 7 }">{{ row.overdueDays }} 天</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="86" align="center">
        <template #default="{ row }">
          <el-tooltip
            v-if="row.reminded"
            :content="row.lastRemindTime ? `最近催办：${formatDateTime(row.lastRemindTime)}` : '24 小时内已催办'"
            placement="top"
          >
            <el-tag size="small" type="success" effect="plain">已催办</el-tag>
          </el-tooltip>
          <el-button v-else link type="primary" size="small" :disabled="reminding" @click.stop="remind([row])">
            催办
          </el-button>
        </template>
      </el-table-column>
      <template #empty>
        <div class="panel-empty">当前筛选下没有超期论文</div>
      </template>
    </el-table>

    <div v-if="total > size" class="panel-pagination">
      <el-pagination
        small
        layout="prev, pager, next"
        :current-page="page"
        :page-size="size"
        :total="total"
        @current-change="changePage"
      />
    </div>

    <p class="panel-tip">
      超期口径：提交时间 + 审核 SLA；仅统计未出结论的论文。催办会写入催办日志并通知导师。
    </p>

    <!-- 行点击详情：从预警直接定位到论文与导师，不再只看一行数字 -->
    <el-drawer v-model="drawerVisible" title="超期论文详情" size="420px">
      <div v-if="selectedPaper" class="overdue-drawer">
        <h3 class="drawer-title">{{ selectedPaper.paperTitle || '未命名论文' }}</h3>

        <el-descriptions :column="1" border>
          <el-descriptions-item label="学生">
            {{ selectedPaper.studentName || '未知学生' }}
            <span v-if="selectedPaper.studentNo" class="drawer-sub">（{{ selectedPaper.studentNo }}）</span>
          </el-descriptions-item>
          <el-descriptions-item label="指导老师">
            {{ selectedPaper.advisorName || '未分配导师' }}
          </el-descriptions-item>
          <el-descriptions-item label="论文状态">
            {{ getStatusText(selectedPaper.paperStatus) }}
          </el-descriptions-item>
          <el-descriptions-item label="超期天数">
            <span class="overdue-days" :class="{ severe: selectedPaper.overdueDays >= 7 }">
              {{ selectedPaper.overdueDays }} 天
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="应完成时间">
            {{ formatDateTime(selectedPaper.deadline, 'YYYY-MM-DD HH:mm', '—') }}
          </el-descriptions-item>
          <el-descriptions-item label="最近催办">
            {{ selectedPaper.lastRemindTime ? formatDateTime(selectedPaper.lastRemindTime) : '暂无催办记录' }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="drawer-actions">
          <el-button
            v-if="!selectedPaper.reminded"
            type="primary"
            :icon="Bell"
            :loading="reminding"
            :disabled="!selectedPaper.paperId"
            @click="remind([selectedPaper])"
          >
            催办该导师
          </el-button>
          <el-tag v-else type="success" effect="plain">24 小时内已催办</el-tag>
        </div>
      </div>
    </el-drawer>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Warning, Bell } from '@element-plus/icons-vue'
import { getOverduePapers, remindOverduePapers } from '@/api/admin/papers'
import { formatDateTime } from '@/utils/dataType.js'
import { getStatusText } from '@/utils/reviewStatus.js'

const level = ref('all')
const page = ref(1)
const size = ref(10)
const loading = ref(false)
const reminding = ref(false)
const drawerVisible = ref(false)
const selectedPaper = ref(null)

const openPaperDrawer = (row) => {
  if (!row) return
  selectedPaper.value = row
  drawerVisible.value = true
}

const records = ref([])
const total = ref(0)
const bucketCounts = ref({})

const allCount = computed(() =>
  ['1', '3', '7'].reduce((sum, key) => sum + Number(bucketCounts.value[key] || 0), 0)
)

const chips = computed(() => [
  { value: 'all', label: '全部', count: allCount.value },
  { value: '1', label: '超时 1 天', count: Number(bucketCounts.value['1'] || 0) },
  { value: '3', label: '超时 3 天', count: Number(bucketCounts.value['3'] || 0) },
  { value: '7', label: '超时 7 天', count: Number(bucketCounts.value['7'] || 0) }
])

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getOverduePapers({ bucket: level.value, page: page.value, size: size.value })
    if (res?.code === 200) {
      records.value = res.data?.records || []
      total.value = Number(res.data?.total) || 0
      bucketCounts.value = res.data?.bucketCounts || {}
    }
  } catch (error) {
    console.error('加载超期论文失败:', error)
  } finally {
    loading.value = false
  }
}

const changeLevel = (value) => {
  if (level.value === value) return
  level.value = value
  page.value = 1
  fetchList()
}

const changePage = (nextPage) => {
  page.value = nextPage
  fetchList()
}

// 一键催办：当前筛选下若不止一页，先拉取到后端 100 篇上限再统一提交
const MAX_REMIND = 100
const remindAll = async () => {
  let targets = records.value
  if (total.value > targets.length) {
    try {
      const res = await getOverduePapers({
        bucket: level.value,
        page: 1,
        size: Math.min(total.value, MAX_REMIND)
      })
      targets = res?.data?.records || targets
    } catch (error) {
      console.error('加载待催办论文失败:', error)
    }
  }
  if (total.value > MAX_REMIND) {
    ElMessage.warning(`单次最多催办 ${MAX_REMIND} 篇，本次仅处理前 ${MAX_REMIND} 篇`)
  }

  const teacherCount = new Set(
    targets.map(row => String(row.teacherId || row.advisorName || row.paperId))
  ).size
  const confirmed = await ElMessageBox.confirm(
    `本次将向 ${teacherCount} 位导师发送站内信催办，确定吗？`,
    '一键催办确认',
    {
      confirmButtonText: '确认催办',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).catch(() => false)

  if (!confirmed) return
  await remind(targets)
}

const remind = async (rows) => {
  const targets = (rows || []).filter(row => row?.paperId)
  if (!targets.length || reminding.value) return

  reminding.value = true
  let retryTargets = []
  try {
    const res = await remindOverduePapers({
      paperIds: targets.map(row => String(row.paperId)),
      channel: 'IN_APP'
    })
    if (res?.code !== 200) return

    const data = res.data || {}
    if (Number(data.failed) > 0) {
      // 失败明细：优先取逐篇结果，再兼容失败原因里的论文 ID
      const failedIds = new Set()
      ;(data.records || []).forEach(record => {
        if (record?.success === false && record.paperId != null) {
          failedIds.add(String(record.paperId))
        }
      })
      ;(data.failReasons || []).forEach(reason => {
        const matched = String(reason).match(/论文ID[：:]\s*(\d+)/)
        if (matched) failedIds.add(matched[1])
      })
      retryTargets = targets.filter(row => failedIds.has(String(row.paperId)))

      const reasonList = (data.failReasons || []).length
        ? data.failReasons.map(reason => `<li>${reason}</li>`).join('')
        : '<li>部分论文催办失败，原因未知</li>'
      const message = `
        <div style="margin-bottom: 6px;">成功 ${data.success ?? 0} 篇，失败 ${data.failed} 篇</div>
        <ul style="margin: 0; padding-left: 18px; line-height: 1.7;">${reasonList}</ul>
      `

      if (retryTargets.length) {
        const action = await ElMessageBox.confirm(
          message,
          `部分论文催办失败（${data.failed} 篇）`,
          {
            dangerouslyUseHTMLString: true,
            confirmButtonText: '重试失败项',
            cancelButtonText: '知道了',
            type: 'warning'
          }
        ).catch(err => err)
        if (action !== 'confirm') retryTargets = []
      } else {
        await ElMessageBox.alert(
          message,
          `成功 ${data.success ?? 0} 篇，失败 ${data.failed} 篇`,
          { dangerouslyUseHTMLString: true, confirmButtonText: '知道了' }
        ).catch(() => {})
      }
    } else {
      ElMessage.success(`已向 ${data.success ?? targets.length} 位导师发送催办`)
    }
    await fetchList()
  } catch (error) {
    // 响应拦截器已按后端 message 提示
    console.error('催办超期论文失败:', error)
  } finally {
    reminding.value = false
  }

  // 等 reminding 复位后再重试，避免被"正在催办"的守卫拦掉
  if (retryTargets.length) {
    await remind(retryTargets)
  }
}

onMounted(fetchList)
</script>

<style scoped lang="scss">
.overdue-panel {
  height: 100%;
  padding: var(--app-space-4);
  background: var(--app-color-card-bg);
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-lg);
}

.overdue-panel :deep(.el-table__row) {
  cursor: pointer;
}

.overdue-drawer {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-3);
}

.drawer-title {
  margin: 0;
  font-family: var(--app-font-family);
  font-size: var(--app-fs-body);
  line-height: 1.4;
  color: var(--app-color-ink);
}

.drawer-sub {
  color: var(--app-color-text-muted);
  font-weight: 400;
}

.drawer-actions {
  display: flex;
  align-items: center;
  gap: var(--app-space-2);
  padding-top: var(--app-space-2);
  border-top: 1px solid var(--app-color-divider);
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-2);
  margin-bottom: var(--app-space-3);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: var(--app-space-2);
  font-size: var(--app-fs-body);
  font-weight: 600;
  color: var(--app-color-ink);
}

.level-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-1);
  margin-bottom: var(--app-space-3);
}

.level-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--app-space-1);
  padding: 2px var(--app-space-2);
  font-family: var(--app-font-family);
  font-size: var(--app-fs-meta);
  line-height: 18px;
  color: var(--app-color-text-muted);
  background: var(--app-color-fill);
  border: 1px solid transparent;
  border-radius: var(--app-radius-pill);
  cursor: pointer;
  transition: var(--app-transition-fast);

  &:hover {
    color: var(--app-color-ink);
  }

  &.active {
    color: var(--app-color-primary);
    background: var(--app-color-info-bg);
    border-color: var(--app-color-info-border);
  }

  &:focus-visible {
    outline: 2px solid var(--app-color-primary);
    outline-offset: 1px;
  }
}

.chip-count {
  font-variant-numeric: tabular-nums;
}

.overdue-days {
  font-size: var(--app-fs-caption);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--app-color-warning);

  &.severe {
    color: var(--app-color-danger);
  }
}

.panel-empty {
  padding: var(--app-space-6) 0;
  text-align: center;
  font-size: var(--app-fs-caption);
  color: var(--app-color-text-muted);
}

.panel-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--app-space-2);
}

.panel-tip {
  margin: var(--app-space-2) 0 0;
  font-size: var(--app-fs-meta);
  line-height: 1.4;
  color: var(--app-color-text-muted);
}
</style>
