<template>
  <div class="defense-workbench">
    <!-- ==================== 我的批次列表 ==================== -->
    <template v-if="view === 'list'">
      <el-card class="console-card console-page-head-card" shadow="never">
        <h2 class="head-title">答辩工作台</h2>
        <p class="head-desc">我参与的中期/终期答辩批次：作为组长可提交答辩结论，成员与秘书可查看会议信息与答辩记录。</p>
      </el-card>

      <el-card class="console-card" shadow="never">
        <el-table :data="batches" v-loading="loading" row-key="id">
          <el-table-column prop="batchNo" label="批次编号" min-width="140" show-overflow-tooltip />
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
          <el-table-column label="地点 / 方式" min-width="170" show-overflow-tooltip>
            <template #default="{ row }">
              <span>{{ row.location || '—' }}</span>
              <el-tag size="small" :type="row.mode === 'online' ? 'info' : 'success'" effect="plain" round class="mode-tag">
                {{ row.modeDesc || modeText(row.mode) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="组长 / 秘书" min-width="140">
            <template #default="{ row }">
              <span>{{ row.leaderName || '待定' }}</span>
              <span class="sep">/</span>
              <span>{{ row.secretaryName || '待定' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="我的角色" width="100">
            <template #default="{ row }">
              <el-tag :type="myRole(row).type" effect="light" round size="small">{{ myRole(row).text }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="结论进度" width="110" align="center">
            <template #default="{ row }">{{ row.submittedCount ?? 0 }}/{{ row.paperCount ?? 0 }}</template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="statusTagType(row.status)" effect="light" round>{{ row.statusDesc || statusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="enterDetail(row)">会议详情</el-button>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="暂未参与任何答辩批次" />
          </template>
        </el-table>
      </el-card>
    </template>

    <!-- ==================== 批次会议详情 ==================== -->
    <template v-else>
      <el-card class="console-card console-page-head-card" shadow="never" v-loading="detailLoading">
        <div class="head-row">
          <div class="head-left">
            <el-button link @click="backToList">
              <el-icon><ArrowLeft /></el-icon>
              返回我的批次
            </el-button>
            <h2 class="head-title">
              {{ batch.batchNo || '批次会议' }}
              <el-tag :type="myRole(batch).type" effect="light" round class="role-tag">{{ myRole(batch).text }}</el-tag>
              <el-tag :type="statusTagType(batch.status)" effect="light" round>{{ batch.statusDesc || statusText(batch.status) }}</el-tag>
            </h2>
          </div>
          <div class="conclusion-progress">
            <span class="progress-text">结论进度 {{ batch.submittedCount ?? 0 }}/{{ batch.paperCount ?? 0 }}</span>
            <el-progress
              :percentage="conclusionPercent"
              :stroke-width="8"
              :show-text="false"
              class="progress-bar"
            />
          </div>
        </div>
        <el-descriptions :column="3" border class="meeting-desc">
          <el-descriptions-item label="批次类型">{{ batch.batchTypeDesc || batchTypeText(batch.batchType) }}</el-descriptions-item>
          <el-descriptions-item label="答辩时间">{{ formatDateTime(batch.defenseDate, 'YYYY-MM-DD HH:mm', '—') }}</el-descriptions-item>
          <el-descriptions-item label="答辩方式">{{ batch.modeDesc || modeText(batch.mode) }}</el-descriptions-item>
          <el-descriptions-item label="地点" :span="2">{{ batch.location || '—' }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ batch.remark || '—' }}</el-descriptions-item>
          <el-descriptions-item label="答辩组长">{{ batch.leaderName || '待定' }}</el-descriptions-item>
          <el-descriptions-item label="答辩秘书">{{ batch.secretaryName || '待定' }}</el-descriptions-item>
          <el-descriptions-item label="组员人数">{{ batch.memberCount ?? '—' }}</el-descriptions-item>
        </el-descriptions>
        <div v-if="members.length" class="members-line">
          <span class="members-label">答辩组成员</span>
          <el-tag
            v-for="m in members"
            :key="m.id"
            :type="m.groupRole === 'leader' ? 'danger' : 'info'"
            effect="light"
            round
            size="small"
            class="member-tag"
          >
            {{ m.teacherName || m.teacherUsername || '未知' }}<template v-if="m.groupRole === 'leader'">（组长）</template>
          </el-tag>
        </div>
      </el-card>

      <el-card class="console-card" shadow="never">
        <template #header>
          <div class="section-head">
            <span class="section-title">答辩记录</span>
            <el-select v-model="recordResult" placeholder="全部结论" clearable class="result-filter" @change="fetchRecords">
              <el-option v-for="o in resultOpts" :key="o.value" :label="o.label" :value="o.value" />
            </el-select>
          </div>
        </template>

        <el-alert
          v-if="!isLeader"
          type="info"
          :closable="false"
          show-icon
          title="评分结论由答辩组长汇总提交，成员与秘书仅可查看记录"
          class="leader-tip"
        />

        <el-table :data="records" v-loading="recordLoading" row-key="id">
          <el-table-column prop="defenseOrder" label="顺序号" width="80" align="center">
            <template #default="{ row }">{{ row.defenseOrder ?? '—' }}</template>
          </el-table-column>
          <el-table-column prop="paperTitle" label="论文标题" min-width="200" show-overflow-tooltip />
          <el-table-column label="学生" min-width="130">
            <template #default="{ row }">
              <span>{{ row.studentName || '—' }}</span>
              <span v-if="row.studentUsername" class="stu-no">（{{ row.studentUsername }}）</span>
            </template>
          </el-table-column>
          <el-table-column label="得分" width="80" align="center">
            <template #default="{ row }">{{ row.score ?? '—' }}</template>
          </el-table-column>
          <el-table-column label="等级" width="80" align="center">
            <template #default="{ row }">{{ row.grade || '—' }}</template>
          </el-table-column>
          <el-table-column label="结论" width="90">
            <template #default="{ row }">
              <el-tag v-if="row.result" :type="resultTagType(row.result)" effect="light" round>
                {{ row.resultDesc || resultText(row.result) }}
              </el-tag>
              <span v-else class="muted">未出结论</span>
            </template>
          </el-table-column>
          <el-table-column prop="comment" label="答辩记录" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">{{ row.comment || '—' }}</template>
          </el-table-column>
          <el-table-column label="结论提交" min-width="150">
            <template #default="{ row }">
              <span v-if="row.submitTime">{{ row.submitByName || '' }} · {{ formatDateTime(row.submitTime, 'YYYY-MM-DD HH:mm', '—') }}</span>
              <span v-else class="muted">—</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="110" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="isLeader && !row.result && batch.status !== 2"
                link
                type="primary"
                @click="openScoreDialog(row)"
              >
                评分录入
              </el-button>
              <span v-else class="muted">—</span>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="本批次暂无答辩记录" />
          </template>
        </el-table>
      </el-card>
    </template>

    <!-- ==================== 评分录入弹窗 ==================== -->
    <el-dialog v-model="scoreDialog.visible" title="评分录入" width="520px" destroy-on-close @closed="resetUploadState">
      <div class="score-paper-info">
        <div class="score-paper-title">{{ scoreDialog.paperTitle }}</div>
        <div class="score-paper-student">{{ scoreDialog.studentName || '—' }}</div>
      </div>
      <el-form ref="scoreFormRef" :model="scoreForm" :rules="scoreRules" label-width="80px">
        <el-form-item label="结论" prop="result">
          <el-radio-group v-model="scoreForm.result" @change="handleResultChange">
            <el-radio v-for="o in resultOpts" :key="o.value" :value="o.value">{{ o.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="得分" prop="score">
          <el-input-number
            v-model="scoreForm.score"
            :min="0"
            :max="100"
            :precision="1"
            :step="0.5"
            controls-position="right"
            style="width: 180px"
          />
          <span class="form-tip-inline">0 - 100；结论为「通过」时必填</span>
        </el-form-item>
        <el-form-item label="等级" prop="grade">
          <el-select v-model="scoreForm.grade" placeholder="选择等级" clearable style="width: 180px">
            <el-option v-for="o in gradeOpts" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="答辩记录" prop="comment">
          <el-input v-model="scoreForm.comment" type="textarea" :rows="3" maxlength="2000" show-word-limit placeholder="答辩过程记录（可空）" />
        </el-form-item>
        <el-form-item label="扫描件" prop="attachmentId">
          <div class="upload-area">
            <el-upload
              :show-file-list="false"
              :auto-upload="true"
              accept="image/*,application/pdf"
              :http-request="handleAttachmentUpload"
            >
              <el-button :loading="scoreDialog.uploading">
                <el-icon><Upload /></el-icon>
                {{ scoreForm.attachmentId ? '重新上传' : '上传扫描件' }}
              </el-button>
            </el-upload>
            <span v-if="scoreForm.attachmentName" class="upload-name">{{ scoreForm.attachmentName }}</span>
            <el-button v-if="scoreForm.attachmentId" link type="danger" @click="clearAttachment">移除</el-button>
          </div>
          <div class="form-tip">线下答辩表扫描件（图片/PDF，可空）</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="scoreDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="scoreDialog.submitting" @click="handleScoreSubmit">提交结论</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import {
  getMyDefenseBatches,
  getTeacherDefenseBatchDetail,
  getTeacherDefenseRecords,
  getTeacherDefenseMembers,
  submitDefenseScore,
  uploadDefenseAttachment
} from '@/api/defense'
import {
  loadDefenseDict,
  useDefenseDictOptions,
  getDefenseDictText,
  DICT_BATCH_TYPE,
  DICT_MODE,
  DICT_RESULT,
  DICT_GRADE
} from '@/utils/defenseDict'
import { formatDateTime } from '@/utils/dataType.js'

const userStore = useUserStore()

// ==================== 我的批次 ====================
const view = ref('list')
const loading = ref(false)
const batches = ref([])

const fetchBatches = async () => {
  loading.value = true
  try {
    const res = await getMyDefenseBatches()
    batches.value = res.data || []
  } finally {
    loading.value = false
  }
}

// 我的角色按批次字段推导：leaderId/secretaryId 命中本人即为组长/秘书，否则按组员展示
const myRole = (row) => {
  const myId = userStore.userInfo?.userId != null ? String(userStore.userInfo.userId) : ''
  if (myId && row.leaderId && String(row.leaderId) === myId) return { text: '组长', type: 'danger' }
  if (myId && row.secretaryId && String(row.secretaryId) === myId) return { text: '秘书', type: 'warning' }
  return { text: '组员', type: 'primary' }
}

// ==================== 批次会议详情 ====================
const detailLoading = ref(false)
const batch = ref({})
const records = ref([])
const recordLoading = ref(false)
const recordResult = ref('')
const members = ref([])

const isLeader = computed(() => {
  const myId = userStore.userInfo?.userId != null ? String(userStore.userInfo.userId) : ''
  return Boolean(myId && batch.value.leaderId && String(batch.value.leaderId) === myId)
})

const conclusionPercent = computed(() => {
  const paper = Number(batch.value.paperCount ?? 0)
  const submitted = Number(batch.value.submittedCount ?? 0)
  if (!paper) return 0
  return Math.min(100, Math.round((submitted / paper) * 100))
})

// 组成员名单属辅助信息：失败（如 40303）静默降级为不展示，不阻塞详情页
const fetchMembers = async () => {
  try {
    const res = await getTeacherDefenseMembers(batch.value.id)
    members.value = res.data || []
  } catch {
    members.value = []
  }
}

const enterDetail = async (row) => {
  view.value = 'detail'
  recordResult.value = ''
  detailLoading.value = true
  try {
    const res = await getTeacherDefenseBatchDetail(row.id)
    batch.value = res.data || {}
  } catch {
    view.value = 'list'
    return
  } finally {
    detailLoading.value = false
  }
  fetchRecords()
  fetchMembers()
}

const backToList = () => {
  view.value = 'list'
  batch.value = {}
  records.value = []
  members.value = []
}

const fetchRecords = async () => {
  recordLoading.value = true
  try {
    const res = await getTeacherDefenseRecords(batch.value.id, recordResult.value || undefined)
    records.value = res.data || []
  } finally {
    recordLoading.value = false
  }
}

// ==================== 评分录入 ====================
// 等级选项：defense_grade 字典驱动，失败兜底本地五档（dictValue 与 dictLabel 同为中文，可直接作提交值）
const gradeOptions = useDefenseDictOptions(DICT_GRADE)
const GRADE_OPTIONS = ['优', '良', '中', '及格', '不及格']
const gradeOpts = computed(() =>
  gradeOptions.value.length ? gradeOptions.value : GRADE_OPTIONS.map((g) => ({ value: g, label: g }))
)

const scoreFormRef = ref(null)
const scoreDialog = reactive({
  visible: false,
  submitting: false,
  uploading: false,
  recordId: null,
  paperTitle: '',
  studentName: ''
})
const scoreForm = reactive({
  result: 'pass',
  score: null,
  grade: '',
  comment: '',
  attachmentId: '',
  attachmentName: ''
})

// result=pass 时 score 与 grade 必填（终期通过要回写 final_score）
const scoreRules = {
  result: [{ required: true, message: '请选择结论', trigger: 'change' }],
  score: [
    {
      validator: (rule, value, callback) => {
        if (scoreForm.result === 'pass' && (value === null || value === undefined || value === '')) {
          return callback(new Error('结论为通过时必须填写得分'))
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  grade: [
    {
      validator: (rule, value, callback) => {
        if (scoreForm.result === 'pass' && !value) {
          return callback(new Error('结论为通过时必须选择等级'))
        }
        callback()
      },
      trigger: 'change'
    }
  ]
}

const openScoreDialog = (row) => {
  scoreDialog.recordId = row.id
  scoreDialog.paperTitle = row.paperTitle || ''
  scoreDialog.studentName = row.studentName || ''
  Object.assign(scoreForm, {
    result: 'pass',
    score: null,
    grade: '',
    comment: '',
    attachmentId: '',
    attachmentName: ''
  })
  scoreDialog.visible = true
}

const handleResultChange = () => {
  if (scoreFormRef.value) {
    scoreFormRef.value.clearValidate(['score', 'grade'])
  }
}

const handleAttachmentUpload = async (option) => {
  scoreDialog.uploading = true
  try {
    const fd = new FormData()
    fd.append('file', option.file)
    const res = await uploadDefenseAttachment(fd)
    scoreForm.attachmentId = String(res.data?.fileId || '')
    scoreForm.attachmentName = res.data?.fileName || option.file.name
    ElMessage.success('扫描件上传成功')
  } catch {
    // 全局拦截器已提示
  } finally {
    scoreDialog.uploading = false
  }
}

const clearAttachment = () => {
  scoreForm.attachmentId = ''
  scoreForm.attachmentName = ''
}

const resetUploadState = () => {
  scoreDialog.uploading = false
}

const handleScoreSubmit = async () => {
  try {
    await scoreFormRef.value.validate()
  } catch {
    return
  }
  scoreDialog.submitting = true
  try {
    const data = {
      recordId: scoreDialog.recordId,
      result: scoreForm.result,
      comment: scoreForm.comment || null
    }
    if (scoreForm.score !== null && scoreForm.score !== undefined) data.score = scoreForm.score
    if (scoreForm.grade) data.grade = scoreForm.grade
    if (scoreForm.attachmentId) data.attachmentId = scoreForm.attachmentId
    await submitDefenseScore(data)
    ElMessage.success('答辩结论提交成功')
    scoreDialog.visible = false
    fetchRecords()
    getTeacherDefenseBatchDetail(batch.value.id).then((res) => {
      batch.value = res.data || {}
    }).catch(() => {})
  } finally {
    scoreDialog.submitting = false
  }
}

// ==================== 展示辅助 ====================
const batchTypeText = (v) =>
  getDefenseDictText(DICT_BATCH_TYPE, v, v === 'final' ? '终期答辩' : v === 'mid_term' ? '中期答辩' : v || '—')
const modeText = (v) =>
  getDefenseDictText(DICT_MODE, v, v === 'online' ? '线上答辩' : v === 'offline' ? '线下答辩' : v || '—')
const statusText = (v) => ({ 0: '筹备中', 1: '进行中', 2: '已结束' }[v] ?? '—')
const statusTagType = (v) => ({ 0: 'info', 1: 'primary', 2: 'success' }[v] || 'info')
const resultText = (v) => getDefenseDictText(DICT_RESULT, v, { pass: '通过', fail: '不通过', postpone: '缓辩' }[v] || v)
const resultTagType = (v) => ({ pass: 'success', fail: 'danger', postpone: 'warning' }[v] || 'info')

// 结论选项：defense_result 字典驱动（dictValue=pass/fail/postpone 可直接作提交值），失败兜底本地
const resultOptions = useDefenseDictOptions(DICT_RESULT)
const resultOpts = computed(() =>
  resultOptions.value.length
    ? resultOptions.value
    : [
        { value: 'pass', label: '通过' },
        { value: 'fail', label: '不通过' },
        { value: 'postpone', label: '缓辩' }
      ]
)

onMounted(() => {
  fetchBatches()
  // defense_* 字典：失败不阻塞页面（文案走本地兜底，选项走兜底数组）
  loadDefenseDict(DICT_BATCH_TYPE).catch(() => {})
  loadDefenseDict(DICT_MODE).catch(() => {})
  loadDefenseDict(DICT_RESULT).catch(() => {})
  loadDefenseDict(DICT_GRADE).catch(() => {})
})
</script>

<style scoped lang="scss">
.defense-workbench {
  display: flex;
  flex-direction: column;
  gap: var(--apple-spacing-md);
  color: var(--apple-ink);
  font-family: var(--apple-font-text);
}

.head-title {
  display: flex;
  align-items: center;
  gap: var(--apple-spacing-xs);
  margin: 0 0 var(--apple-spacing-xxs);
  font-family: var(--apple-font-display);
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.2;
}

.head-desc {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--apple-ink-muted-48);
}

.head-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--apple-spacing-md);
}

.head-left {
  flex: 1;
  min-width: 0;
}

.role-tag {
  flex-shrink: 0;
}

.conclusion-progress {
  width: 200px;
  flex-shrink: 0;
  text-align: right;
}

.progress-text {
  display: block;
  margin-bottom: var(--apple-spacing-xxs);
  font-size: var(--apple-fs-fine-print);
  font-variant-numeric: tabular-nums;
}

.progress-bar {
  width: 100%;
}

.meeting-desc {
  margin-top: var(--apple-spacing-md);
}

.members-line {
  display: flex;
  align-items: center;
  gap: var(--apple-spacing-xs);
  margin-top: var(--apple-spacing-sm);
  flex-wrap: wrap;
}

.members-label {
  font-size: var(--apple-fs-fine-print);
  color: var(--apple-ink-muted-48);
}

.member-tag {
  margin: 0;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-family: var(--apple-font-display);
  font-size: var(--apple-fs-body-strong);
  font-weight: 600;
}

.result-filter {
  width: 140px;

  :deep(.el-select__wrapper) {
    border-radius: var(--apple-rounded-md);
    font-size: var(--apple-fs-caption);
  }
}

.leader-tip {
  margin-bottom: var(--apple-spacing-md);
}

.sep {
  margin: 0 var(--apple-spacing-xxs);
  color: var(--apple-divider-soft);
}

.mode-tag {
  margin-left: var(--apple-spacing-xs);
}

.stu-no {
  color: var(--apple-ink-muted-48);
}

.muted {
  color: var(--apple-ink-muted-48);
}

.score-paper-info {
  padding: var(--apple-spacing-sm) var(--apple-spacing-md);
  margin-bottom: var(--apple-spacing-md);
  border-radius: var(--apple-rounded-md);
  background: var(--apple-canvas-parchment);
}

.score-paper-title {
  font-weight: 600;
}

.score-paper-student {
  margin-top: var(--apple-spacing-xxs);
  font-size: var(--apple-fs-fine-print);
  color: var(--apple-ink-muted-48);
}

.form-tip-inline {
  margin-left: var(--apple-spacing-sm);
  font-size: var(--apple-fs-fine-print);
  color: var(--apple-ink-muted-48);
}

.form-tip {
  width: 100%;
  margin-top: var(--apple-spacing-xxs);
  font-size: var(--apple-fs-fine-print);
  line-height: 1.5;
  color: var(--apple-ink-muted-48);
}

.upload-area {
  display: flex;
  align-items: center;
  gap: var(--apple-spacing-xs);
  flex-wrap: wrap;
}

.upload-name {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--apple-fs-fine-print);
}

@media (max-width: 768px) {
  .head-row {
    flex-direction: column;
  }

  .conclusion-progress {
    width: 100%;
    text-align: left;
  }

  .members-line {
    gap: var(--apple-spacing-xxs);
  }
}
</style>
