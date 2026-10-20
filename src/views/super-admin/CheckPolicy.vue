<template>
  <div class="check-policy">
    <!-- 页头 -->
    <el-card class="console-card console-page-head-card" shadow="never">
      <div class="head-row">
        <div class="head-text">
          <h2 class="head-title">检测策略</h2>
          <p class="head-desc">按学位类型配置查重合格阈值、单篇最大相似比上限与查重频次限制</p>
        </div>
        <el-button :icon="Refresh" @click="fetchPolicies">刷新</el-button>
      </div>
    </el-card>

    <!-- 策略列表 -->
    <el-card class="console-card" shadow="never">
      <el-alert
        type="info"
        :closable="false"
        show-icon
        class="mechanism-alert"
        title="机制说明：命中启用状态（enabled=1）的策略时，取其合格阈值作为该学位论文的合格线；删除或停用策略后，该学位论文自动回落到既有阈值链路（学科 > 学院 > 全局），删除操作是安全的。"
      />

      <el-table :data="tableRows" v-loading="loading" row-key="degreeType" class="policy-table">
        <el-table-column label="学位类型" min-width="110">
          <template #default="{ row }">
            <span class="degree-name">{{ degreeLabel(row.degreeType) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="合格阈值" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.policy">{{ row.policy.threshold }}%</span>
            <span v-else class="placeholder">—</span>
          </template>
        </el-table-column>
        <el-table-column label="单篇最大上限" width="120" align="center">
          <template #default="{ row }">
            <span v-if="row.policy">{{ row.policy.maxPerSource }}%</span>
            <span v-else class="placeholder">—</span>
          </template>
        </el-table-column>
        <el-table-column label="最多查重次数" width="120" align="center">
          <template #default="{ row }">
            <template v-if="row.policy">
              <span v-if="row.policy.maxCheckCount !== null && row.policy.maxCheckCount !== undefined">
                {{ row.policy.maxCheckCount }}
              </span>
              <span v-else class="placeholder">沿用全局</span>
            </template>
            <span v-else class="placeholder">—</span>
          </template>
        </el-table-column>
        <el-table-column label="查重间隔" width="110" align="center">
          <template #default="{ row }">
            <template v-if="row.policy">
              <span v-if="row.policy.checkInterval !== null && row.policy.checkInterval !== undefined">
                {{ row.policy.checkInterval }} 秒
              </span>
              <span v-else class="placeholder">沿用全局</span>
            </template>
            <span v-else class="placeholder">—</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="230">
          <template #default="{ row }">
            <el-switch
              v-if="row.policy"
              :model-value="row.policy.enabled === 1"
              :loading="row.toggling"
              inline-prompt
              active-text="启用"
              inactive-text="停用"
              @change="(val) => handleToggle(row, val)"
            />
            <el-tag v-else type="info" effect="plain" round>
              未配置（沿用学科 &gt; 学院 &gt; 全局阈值链路）
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="165">
          <template #default="{ row }">
            <span v-if="row.policy">{{ row.policy.createTime || '—' }}</span>
            <span v-else class="placeholder">—</span>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="165">
          <template #default="{ row }">
            <span v-if="row.policy">{{ row.policy.updateTime || '—' }}</span>
            <span v-else class="placeholder">—</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button v-if="row.policy" link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="`编辑${degreeLabel(form.degreeType)}检测策略`"
      width="520px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="学位类型">
          <el-input :model-value="degreeLabel(form.degreeType)" disabled />
          <div class="form-tip">学位类型保存后不可修改；同学位类型再次保存即覆盖</div>
        </el-form-item>
        <el-form-item label="合格阈值（%）" prop="threshold">
          <el-input-number v-model="form.threshold" :min="0" :max="100" class="num-input" />
        </el-form-item>
        <el-form-item label="单篇最大上限（%）" prop="maxPerSource">
          <el-input-number v-model="form.maxPerSource" :min="0" :max="100" class="num-input" />
          <div class="form-tip">单篇来源命中字数占正文字数比的上限</div>
        </el-form-item>
        <el-form-item label="最多查重次数" prop="maxCheckCount">
          <el-input-number
            v-model="form.maxCheckCount"
            :min="1"
            :precision="0"
            placeholder="留空沿用全局"
            class="num-input"
          />
          <div class="form-tip">正整数；留空表示沿用全局配置</div>
        </el-form-item>
        <el-form-item label="查重间隔（秒）" prop="checkInterval">
          <el-input-number
            v-model="form.checkInterval"
            :min="0"
            :precision="0"
            placeholder="留空沿用全局"
            class="num-input"
          />
          <div class="form-tip">≥0 秒；留空表示沿用全局配置</div>
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="formEnabled" active-text="启用" inactive-text="停用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'

// P5 学位检测策略接口（仅 SUPER_ADMIN 可调，见 @/api/p5.js）
import { getCheckPolicyList, saveCheckPolicy, deleteCheckPolicy } from '@/api/p5'
// 学位类型文案走 degree_type 字典（/api/dict/data/type/{type}），与 defenseDict 同一范式；
// 字典缺失时用本地兜底文案，页面不白屏
import { loadDefenseDict, getDefenseDictText } from '@/utils/defenseDict'

const DICT_DEGREE_TYPE = 'degree_type'

// 固定三行：undergraduate / master / doctor（清单 5.1）
const DEGREE_TYPES = ['undergraduate', 'master', 'doctor']
// 字典加载失败时的本地兜底文案（与 P5 播种的 degree_type 取值对齐）
const LOCAL_DEGREE_LABELS = { undergraduate: '本科', master: '硕士', doctor: '博士' }

const degreeLabel = (code) =>
  getDefenseDictText(DICT_DEGREE_TYPE, code, LOCAL_DEGREE_LABELS[code] || code || '—')

// ==================== 列表 ====================
const loading = ref(false)
const policies = ref([])
// 行内启停开关的 loading 态按学位类型记录（tableRows 是 computed，行对象不适合挂可变状态）
const togglingMap = reactive({})

const tableRows = computed(() =>
  DEGREE_TYPES.map((dt) => ({
    degreeType: dt,
    policy: policies.value.find((p) => p.degreeType === dt) || null,
    toggling: !!togglingMap[dt]
  }))
)

const fetchPolicies = async () => {
  loading.value = true
  try {
    const res = await getCheckPolicyList()
    policies.value = res.data || []
  } finally {
    loading.value = false
  }
}

// ==================== 编辑弹窗 ====================
const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const form = reactive({
  degreeType: '',
  threshold: null,
  maxPerSource: null,
  maxCheckCount: null,
  checkInterval: null,
  enabled: 1
})

// enabled 在接口侧是 0/1，开关用布尔交互
const formEnabled = computed({
  get: () => form.enabled === 1,
  set: (val) => { form.enabled = val ? 1 : 0 }
})

const rules = {
  threshold: [
    { required: true, message: '请设置合格阈值', trigger: 'blur' },
    { type: 'number', min: 0, max: 100, message: '合格阈值必须在 0-100 之间', trigger: 'blur' }
  ],
  maxPerSource: [
    { required: true, message: '请设置单篇最大上限', trigger: 'blur' },
    { type: 'number', min: 0, max: 100, message: '单篇最大上限必须在 0-100 之间', trigger: 'blur' }
  ],
  maxCheckCount: [
    {
      validator: (rule, value, callback) => {
        // 留空 = 沿用全局配置
        if (value === null || value === undefined || value === '') return callback()
        if (!Number.isInteger(value) || value < 1) {
          return callback(new Error('最多查重次数必须为正整数'))
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  checkInterval: [
    {
      validator: (rule, value, callback) => {
        // 留空 = 沿用全局配置
        if (value === null || value === undefined || value === '') return callback()
        if (typeof value !== 'number' || Number.isNaN(value) || value < 0) {
          return callback(new Error('查重间隔必须 ≥ 0 秒'))
        }
        callback()
      },
      trigger: 'blur'
    }
  ]
}

const openEditDialog = (row) => {
  const p = row.policy
  Object.assign(form, {
    degreeType: row.degreeType,
    threshold: p?.threshold ?? null,
    maxPerSource: p?.maxPerSource ?? null,
    maxCheckCount: p?.maxCheckCount ?? null,
    checkInterval: p?.checkInterval ?? null,
    enabled: p?.enabled ?? 1
  })
  dialogVisible.value = true
}

const buildPayload = (enabled) => ({
  degreeType: form.degreeType,
  threshold: form.threshold,
  maxPerSource: form.maxPerSource,
  // 留空收敛成 null（= 沿用全局），不传空串给后端的数字字段
  maxCheckCount: form.maxCheckCount ?? null,
  checkInterval: form.checkInterval ?? null,
  enabled
})

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  submitting.value = true
  try {
    // 按 degreeType upsert：同一学位类型再次保存即覆盖
    await saveCheckPolicy(buildPayload(form.enabled))
    ElMessage.success('检测策略保存成功')
    dialogVisible.value = false
    fetchPolicies()
  } finally {
    submitting.value = false
  }
}

// ==================== 行内启停 ====================
const handleToggle = async (row, val) => {
  togglingMap[row.degreeType] = true
  try {
    const p = row.policy
    await saveCheckPolicy({
      degreeType: p.degreeType,
      threshold: p.threshold,
      maxPerSource: p.maxPerSource,
      maxCheckCount: p.maxCheckCount ?? null,
      checkInterval: p.checkInterval ?? null,
      enabled: val ? 1 : 0
    })
    ElMessage.success(val ? '策略已启用' : '策略已停用，该学位回落到既有阈值链路')
    await fetchPolicies()
  } finally {
    togglingMap[row.degreeType] = false
  }
}

// ==================== 删除 ====================
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定删除「${degreeLabel(row.degreeType)}」的检测策略吗？删除后该学位论文将回落到既有阈值链路（学科 > 学院 > 全局），删除是安全的。`,
    '删除确认',
    { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
  )
    .then(async () => {
      // 策略 id 是雪花 ID，按字符串原样回传
      await deleteCheckPolicy(row.policy.id)
      ElMessage.success('检测策略已删除')
      fetchPolicies()
    })
    .catch(() => {})
}

// ==================== 生命周期 ====================
onMounted(() => {
  fetchPolicies()
  // 字典失败不在此提示：全局拦截器已 toast，页面用本地兜底文案即可
  loadDefenseDict(DICT_DEGREE_TYPE).catch(() => {})
})
</script>

<style scoped lang="scss">
.check-policy {
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: var(--apple-ink);
  font-family: var(--apple-font-text);
}

.head-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.head-title {
  margin: 0 0 6px;
  font-size: 1.25rem;
  font-weight: 600;
}

.head-desc {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--apple-ink-muted-48);
}

.mechanism-alert {
  margin-bottom: 16px;
}

.policy-table {
  width: 100%;
}

.degree-name {
  font-weight: 600;
}

.placeholder {
  color: var(--apple-ink-muted-48);
}

.num-input {
  width: 200px;
}

.form-tip {
  width: 100%;
  margin-top: 4px;
  font-size: 0.75rem;
  line-height: 1.5;
  color: var(--apple-ink-muted-48);
}

/* ── 视觉统一（design-tokens 覆盖层） ──────────────────────── */
.check-policy {
  gap: var(--apple-spacing-md);
}

.head-row {
  gap: var(--apple-spacing-md);
}

.head-title {
  margin-bottom: var(--apple-spacing-xxs);
  font-size: var(--apple-fs-tagline);
  font-family: var(--apple-font-display);
}

.head-desc {
  font-size: var(--apple-fs-fine-print);
}

.mechanism-alert {
  margin-bottom: var(--apple-spacing-md);
}

.form-tip {
  margin-top: var(--apple-spacing-xxs);
  font-size: var(--apple-fs-fine-print);
}

@media (max-width: 768px) {
  .head-row {
    flex-direction: column;
  }

  .num-input {
    width: 100%;
  }
}
</style>
