<template>
  <section class="overdue-panel">
    <header class="panel-head">
      <div class="panel-title">
        <el-icon><Warning /></el-icon>
        <span>超期论文预警</span>
        <el-tag size="small" type="info" effect="plain">演示数据</el-tag>
      </div>
      <el-button
        type="primary"
        size="small"
        :icon="Bell"
        :disabled="filtered.length === 0"
        @click="remind(filtered)"
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
        @click="level = chip.value"
      >
        {{ chip.label }}
        <span class="chip-count">{{ chip.count }}</span>
      </button>
    </div>

    <el-table :data="filtered" size="small" class="overdue-table" :max-height="300">
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
          <el-button
            v-if="!remindedIds.includes(row.paperId)"
            link
            type="primary"
            size="small"
            @click="remind([row])"
          >
            催办
          </el-button>
          <el-tag v-else size="small" type="success" effect="plain">已催办</el-tag>
        </template>
      </el-table-column>
      <template #empty>
        <div class="panel-empty">当前筛选下没有超期论文</div>
      </template>
    </el-table>

    <p class="panel-tip">
      预警与催办为前端演示：后端暂无「按审核超期天数」的接口，催办仅提示并记录 console。
      后端提供预警与催办接口后，替换 MOCK_OVERDUE 与 remind() 即可。
    </p>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Warning, Bell } from '@element-plus/icons-vue'

// TODO(mock): 后端 /api/admin/alerts/active 是系统指标预警（CPU/内存等），
// 不含"论文审核超期"维度；这里先用示例数据把产品结构跑通。
const MOCK_OVERDUE = [
  { paperId: '1001', paperTitle: '基于深度学习的图像识别算法研究', studentName: '张一鸣', advisorName: '李建国', overdueDays: 9 },
  { paperId: '1002', paperTitle: '高校教务管理系统设计与实现', studentName: '王思远', advisorName: '陈晓梅', overdueDays: 7 },
  { paperId: '1003', paperTitle: '面向智能制造的生产调度优化', studentName: '赵子涵', advisorName: '周明', overdueDays: 6 },
  { paperId: '1004', paperTitle: '城市交通流量预测模型研究', studentName: '孙雨桐', advisorName: '吴海', overdueDays: 4 },
  { paperId: '1005', paperTitle: '区块链在供应链金融中的应用', studentName: '刘浩然', advisorName: '郑琳', overdueDays: 3 },
  { paperId: '1006', paperTitle: '基于知识图谱的问答系统', studentName: '陈嘉懿', advisorName: '李建国', overdueDays: 2 },
  { paperId: '1007', paperTitle: '低碳建筑能耗评估方法研究', studentName: '杨若曦', advisorName: '陈晓梅', overdueDays: 1 }
]

const bucketOf = (days) => (days >= 7 ? '7' : days >= 3 ? '3' : '1')

const level = ref('all')

const chips = computed(() => {
  const all = MOCK_OVERDUE.length
  return [
    { value: 'all', label: '全部', count: all },
    { value: '1', label: '超时 1 天', count: MOCK_OVERDUE.filter(item => bucketOf(item.overdueDays) === '1').length },
    { value: '3', label: '超时 3 天', count: MOCK_OVERDUE.filter(item => bucketOf(item.overdueDays) === '3').length },
    { value: '7', label: '超时 7 天', count: MOCK_OVERDUE.filter(item => bucketOf(item.overdueDays) === '7').length }
  ]
})

const filtered = computed(() => {
  const list = level.value === 'all'
    ? MOCK_OVERDUE
    : MOCK_OVERDUE.filter(item => bucketOf(item.overdueDays) === level.value)
  return [...list].sort((a, b) => b.overdueDays - a.overdueDays)
})

// 已催办只在本地记：没有后端记录可回读，刷新后重置
const remindedIds = ref([])

const remind = (rows) => {
  const targets = (rows || []).filter(row => row?.paperId)
  if (!targets.length) return
  // TODO(mock): 后端暂未提供管理员催办接口，先打印并提示，接口就绪后替换为真实请求
  console.log('[mock] 一键催办:', targets.map(row => ({
    paperId: row.paperId,
    advisorName: row.advisorName,
    overdueDays: row.overdueDays
  })))
  const ids = new Set(remindedIds.value)
  targets.forEach(row => ids.add(row.paperId))
  remindedIds.value = [...ids]
  ElMessage.success(`已向 ${targets.length} 位导师发送催办（演示）`)
}
</script>

<style scoped lang="scss">
.overdue-panel {
  height: 100%;
  padding: var(--app-space-4);
  background: var(--app-color-card-bg);
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-lg);
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

.panel-tip {
  margin: var(--app-space-2) 0 0;
  font-size: var(--app-fs-meta);
  line-height: 1.4;
  color: var(--app-color-text-muted);
}
</style>
