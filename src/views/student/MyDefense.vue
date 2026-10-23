<template>
  <div class="my-defense">
    <!-- 页头 -->
    <el-card class="console-card console-page-head-card" shadow="never">
      <div class="head-row">
        <div class="head-text">
          <h2 class="head-title">我的答辩</h2>
          <p class="head-desc">查看我被安排的中期/终期答辩安排：批次会议信息、答辩顺序与结论成绩（如已出）。</p>
        </div>
        <el-radio-group v-model="batchType" @change="fetchList">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button v-for="o in batchTypeOpts" :key="o.value" :value="o.value">{{ o.label }}</el-radio-button>
        </el-radio-group>
      </div>
    </el-card>

    <!-- 安排列表 -->
    <el-card class="console-card" shadow="never" v-loading="loading">
      <el-table :data="list" row-key="batchId">
        <el-table-column prop="batchNo" label="批次编号" min-width="130" show-overflow-tooltip />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.batchType === 'final' ? 'warning' : 'primary'" effect="light" round>
              {{ row.batchTypeDesc || batchTypeText(row.batchType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="答辩时间" width="160">
          <template #default="{ row }">{{ formatDateTime(row.defenseDate, 'YYYY-MM-DD HH:mm', '—') }}</template>
        </el-table-column>
        <el-table-column label="地点" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <!-- 线上答辩时 location 是会议链接，渲染为可点击链接 -->
            <a
              v-if="row.mode === 'online' && row.location"
              :href="row.location"
              target="_blank"
              rel="noopener"
              class="meet-link"
            >{{ row.location }}</a>
            <span v-else>{{ row.location || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="方式" width="100">
          <template #default="{ row }">{{ row.modeDesc || modeText(row.mode) }}</template>
        </el-table-column>
        <el-table-column label="组长 / 秘书" min-width="150">
          <template #default="{ row }">
            <span>{{ row.leaderName || '待定' }}</span>
            <span class="sep">/</span>
            <span>{{ row.secretaryName || '待定' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="顺序号" width="80" align="center">
          <template #default="{ row }">
            <span v-if="row.defenseOrder != null" class="order-badge">{{ row.defenseOrder }}</span>
            <span v-else class="muted">待编排</span>
          </template>
        </el-table-column>
        <el-table-column label="结论" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.result" :type="resultTagType(row.result)" effect="light" round>
              {{ row.resultDesc || resultText(row.result) }}
            </el-tag>
            <span v-else class="muted">暂未出结论</span>
          </template>
        </el-table-column>
        <el-table-column label="成绩" min-width="130">
          <template #default="{ row }">
            <template v-if="row.result === 'pass' && row.score != null">
              <span class="score-value">{{ row.score }}</span>
              <span class="grade-text">（{{ row.grade || '—' }}）</span>
            </template>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无答辩安排，论文进入答辩阶段后可在此查看" />
        </template>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { getMyDefenseList } from '@/api/defense'
import {
  loadDefenseDict,
  useDefenseDictOptions,
  getDefenseDictText,
  DICT_BATCH_TYPE,
  DICT_MODE,
  DICT_RESULT
} from '@/utils/defenseDict'
import { formatDateTime } from '@/utils/dataType.js'

const loading = ref(false)
const list = ref([])
const batchType = ref('')

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getMyDefenseList(batchType.value || undefined)
    list.value = res.data || []
  } finally {
    loading.value = false
  }
}

// ==================== 展示辅助（defense_* 字典驱动，本地兜底） ====================
const batchTypeOptions = useDefenseDictOptions(DICT_BATCH_TYPE)
const localBatchTypeOptions = [
  { value: 'mid_term', label: '中期答辩' },
  { value: 'final', label: '终期答辩' }
]
const batchTypeOpts = computed(() => (batchTypeOptions.value.length ? batchTypeOptions.value : localBatchTypeOptions))

const batchTypeText = (v) =>
  getDefenseDictText(DICT_BATCH_TYPE, v, v === 'final' ? '终期答辩' : v === 'mid_term' ? '中期答辩' : v || '—')
const modeText = (v) =>
  getDefenseDictText(DICT_MODE, v, v === 'online' ? '线上答辩' : v === 'offline' ? '线下答辩' : v || '—')
const resultText = (v) => getDefenseDictText(DICT_RESULT, v, { pass: '通过', fail: '不通过', postpone: '缓辩' }[v] || v)
const resultTagType = (v) => ({ pass: 'success', fail: 'danger', postpone: 'warning' }[v] || 'info')

onMounted(() => {
  fetchList()
  // defense_* 字典：失败不阻塞页面（文案走本地兜底，选项走兜底数组）
  loadDefenseDict(DICT_BATCH_TYPE).catch(() => {})
  loadDefenseDict(DICT_MODE).catch(() => {})
  loadDefenseDict(DICT_RESULT).catch(() => {})
})
</script>

<style scoped lang="scss">
.my-defense {
  display: flex;
  flex-direction: column;
  gap: var(--apple-spacing-md);
  color: var(--apple-ink);
  font-family: var(--apple-font-text);
}

.head-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--apple-spacing-sm);
  flex-wrap: wrap;
}

.head-title {
  margin: 0 0 var(--apple-spacing-xxs);
  font-size: 1.25rem;
  font-weight: 700;
  font-family: var(--apple-font-display);
  line-height: 1.2;
  color: var(--apple-ink);
}

.head-desc {
  margin: 0;
  font-size: var(--apple-fs-caption);
  color: var(--apple-ink-muted-48);
}

.sep {
  margin: 0 var(--apple-spacing-xxs);
  color: var(--apple-hairline);
}

.order-badge {
  display: inline-block;
  min-width: 26px;
  padding: 0 6px;
  border-radius: var(--apple-rounded-pill);
  background: var(--apple-canvas-parchment);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  text-align: center;
  color: var(--apple-ink);
}

.meet-link {
  color: var(--apple-primary);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.score-value {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.grade-text {
  font-size: var(--apple-fs-fine-print);
  color: var(--apple-ink-muted-48);
}

.muted {
  font-size: var(--apple-fs-caption);
  color: var(--apple-ink-muted-48);
}
</style>
