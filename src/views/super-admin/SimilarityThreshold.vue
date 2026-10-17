<template>
  <div class="similarity-threshold">
    <!-- 页面头部 -->
    <PageHeader title="相似度阈值设置" description="设置论文查重的相似度阈值，超过阈值的论文将被标记为需要重点审核" />

    <!-- 阈值设置表单 -->
    <el-card shadow="never" class="threshold-card">
      <el-form
        :model="thresholdForm"
        :rules="thresholdRules"
        ref="thresholdFormRef"
        label-width="120px"
      >
        <el-form-item label="全局相似度阈值" prop="globalThreshold">
          <div class="threshold-slider">
            <el-slider
              v-model="thresholdForm.globalThreshold"
              :min="0"
              :max="100"
              :step="1"
              show-input
              input-size="small"
              :disabled="isLoading"
            />
            <span class="threshold-label">{{ thresholdForm.globalThreshold }}%</span>
          </div>
          <div class="help-text">全局默认的相似度阈值，适用于所有未设置特定阈值的学科/专业</div>
        </el-form-item>

        <el-form-item label="分类阈值">
          <div class="category-thresholds">
            <el-button
              type="primary"
              :icon="Plus"
              @click="showCategoryDialog"
              :disabled="isLoading"
            >
              添加分类阈值
            </el-button>

            <el-table
              v-if="categoryThresholds.length > 0"
              :data="categoryThresholds"
              style="width: 100%"
              :disabled="isLoading"
            >
              <el-table-column prop="categoryType" label="类型" width="120">
                <template #default="scope">
                  <!-- 三路查表，别再写二元三元表达式：加 subject 后漏一种取值会显示成"专业" -->
                  {{ CATEGORY_TYPE_LABELS[scope.row.categoryType] || scope.row.categoryType }}
                </template>
              </el-table-column>
              <el-table-column prop="categoryName" label="名称" min-width="150" />
              <!-- 论文类型维度：空 = 该行不带类型限定，对所有论文类型生效（存量行都是这种形态） -->
              <el-table-column label="论文类型" width="130">
                <template #default="scope">
                  <span v-if="scope.row.paperType">
                    {{ getPaperTypeText(scope.row.paperType) }}
                  </span>
                  <span v-else class="all-types-label">{{ ALL_TYPES_LABEL }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="threshold" label="阈值" width="180">
                <template #default="scope">
                  <el-slider
                    v-model="scope.row.threshold"
                    :min="0"
                    :max="100"
                    :step="1"
                    show-input
                    input-size="small"
                    @change="updateCategoryThreshold(scope.row)"
                    :disabled="isLoading"
                  />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120" fixed="right">
                <template #default="scope">
                  <el-button
                    size="small"
                    type="danger"
                    @click="deleteCategoryThreshold(scope.row.id)"
                    :disabled="isLoading"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <div v-else class="empty-category-thresholds">
              <el-empty description="暂无分类阈值设置">
                <el-button type="primary" @click="showCategoryDialog">
                  添加第一个阈值设置
                </el-button>
              </el-empty>
            </div>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="saveSettings" :loading="isLoading">
            保存设置
          </el-button>
          <el-button @click="resetForm" :disabled="isLoading">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 分类阈值编辑对话框 -->
    <el-dialog
      v-model="categoryDialogVisible"
      :title="categoryDialogTitle"
      width="500px"
      @close="resetCategoryForm"
    >
      <el-form
        :model="categoryForm"
        :rules="categoryRules"
        ref="categoryFormRef"
        label-width="100px"
      >
        <el-form-item label="类型" prop="categoryType">
          <el-radio-group v-model="categoryForm.categoryType">
            <el-radio label="college">学院</el-radio>
            <el-radio label="major">专业</el-radio>
            <el-radio label="subject">学科领域</el-radio>
            <el-radio label="paper_type">论文类型（通用）</el-radio>
          </el-radio-group>
        </el-form-item>

        <!--
          论文类型维度，三种情况下都渲染：
          - 选「论文类型（通用）」时必填 —— 这一档就是"只按类型匹配"；
          - 选学院/专业/学科时留空 = 适用全部类型，填上则是"该作用域 + 该类型"的更精确一档。
          所以留空不是"没选"，而是明确表达"不限制类型"。
        -->
        <el-form-item label="论文类型" prop="paperType">
          <el-select
            v-model="categoryForm.paperType"
            :placeholder="categoryForm.categoryType === 'paper_type'
              ? '请选择论文类型'
              : '不限制（适用全部类型）'"
            :clearable="categoryForm.categoryType !== 'paper_type'"
            :disabled="!paperTypesLoaded || isLoading"
            style="width: 100%"
          >
            <el-option
              v-for="item in paperTypeOptions"
              :key="item.code"
              :label="item.label"
              :value="item.code"
            />
          </el-select>
          <div class="help-text">
            留空表示该行对所有论文类型生效；填上则只对这一种类型生效（同作用域下带类型的行优先级更高）。
          </div>
        </el-form-item>

        <el-form-item label="学院" prop="collegeId" v-if="categoryForm.categoryType === 'college'">
          <el-select
            v-model="categoryForm.collegeId"
            placeholder="请选择学院"
            :disabled="isLoading"
          >
            <el-option
              v-for="college in colleges"
              :key="college.id"
              :label="college.name"
              :value="college.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="专业" prop="majorId" v-if="categoryForm.categoryType === 'major'">
          <el-select
            v-model="categoryForm.collegeId"
            placeholder="请选择学院"
            @change="handleCollegeChange"
            :disabled="isLoading"
          >
            <el-option
              v-for="college in colleges"
              :key="college.id"
              :label="college.name"
              :value="college.id"
            />
          </el-select>
          <el-select
            v-model="categoryForm.majorId"
            placeholder="请选择专业"
            :disabled="!categoryForm.collegeId || isLoading"
          >
            <el-option
              v-for="major in majors"
              :key="major.id"
              :label="major.name"
              :value="major.id"
            />
          </el-select>
        </el-form-item>

        <!-- 学科领域选择器。一级门类与二级学科都能选（check-strictly 让父节点也可选），
             值取 subject.id 而不是 code —— 后端 category_similarity_threshold.subject_id
             存的是 id；树节点的 value 因此拼成 id 的字符串形态（与接口返回的 subjectId 同为字符串）。 -->
        <el-form-item
          label="学科领域"
          prop="subjectId"
          v-if="categoryForm.categoryType === 'subject'"
        >
          <el-tree-select
            v-model="categoryForm.subjectId"
            :data="subjectTree"
            :props="subjectTreeProps"
            :loading="subjectLoading"
            check-strictly
            filterable
            placeholder="请选择学科领域（一级门类或二级学科）"
            style="width: 100%"
            :disabled="isLoading"
          />
          <div class="help-text">
            配在一级门类上的阈值会继承给该门类下的全部二级学科；某个二级学科自己单独配了，则以它自己的为准。
          </div>
        </el-form-item>

        <el-form-item label="相似度阈值" prop="threshold">
          <div class="threshold-slider">
            <el-slider
              v-model="categoryForm.threshold"
              :min="0"
              :max="100"
              :step="1"
              show-input
              input-size="small"
              :disabled="isLoading"
            />
            <span class="threshold-label">{{ categoryForm.threshold }}%</span>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="categoryDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveCategoryThreshold" :loading="isLoading">
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'

// 图标导入
import {
  Plus
} from '@element-plus/icons-vue'

// API导入
// 阈值读写走管理端接口（/api/admin/similarity-thresholds）；
// 学院/专业下拉仍是教师侧的公共下拉数据源。
import {
  getSimilarityThresholds,
  updateSimilarityThresholds
} from '@/api/admin/config'
import {
  getColleges,
  getMajors
} from '@/api/teacher'
import { getSubjectFieldTree } from '@/api/user'
// 论文类型选项/文案统一走共享模块（真相源是后端 PaperTypeEnum）
import {
  loadPaperTypes,
  getPaperTypeText,
  usePaperTypeOptions,
  usePaperTypesLoaded,
  ALL_TYPES_LABEL
} from '@/utils/paperType.js'

// 类型列展示名。写成查表而不是三元表达式：漏一种取值会静默显示成别的类型。
// paper_type 是"仅按论文类型"那一档（不带学院/专业/学科）。
const CATEGORY_TYPE_LABELS = {
  college: '学院',
  major: '专业',
  subject: '学科领域',
  paper_type: '论文类型'
}

// 响应式数据
const isLoading = ref(false)
const thresholdForm = ref({
  globalThreshold: 30
})
const thresholdFormRef = ref(null)
const categoryThresholds = ref([])
const categoryDialogVisible = ref(false)
const categoryForm = ref({
  id: null,
  categoryType: 'college',
  collegeId: '',
  majorId: '',
  subjectId: '',
  paperType: '',
  threshold: 30
})
const categoryFormRef = ref(null)
const colleges = ref([])
const majors = ref([])

// 论文类型选项与加载状态（模块级缓存，与其他页面共用同一次请求）
const paperTypeOptions = usePaperTypeOptions()
const paperTypesLoaded = usePaperTypesLoaded()

// 学科领域下拉树：节点 value 是 subject.id 的字符串形态（后端阈值接口收的也是它）
const subjectTree = ref([])
const subjectLoading = ref(false)
const subjectTreeProps = {
  label: 'label',
  value: 'value',
  children: 'children'
}

// 计算属性
const categoryDialogTitle = ref('添加分类阈值')

// 表单验证规则
const thresholdRules = {
  globalThreshold: [
    { required: true, message: '请设置全局相似度阈值', trigger: 'blur' },
    { type: 'number', min: 0, max: 100, message: '阈值必须在0-100之间', trigger: 'blur' }
  ]
}

const categoryRules = {
  categoryType: [
    { required: true, message: '请选择类型', trigger: 'change' }
  ],
  collegeId: [
    { required: true, message: '请选择学院', trigger: 'change' }
  ],
  majorId: [
    { required: true, message: '请选择专业', trigger: 'change' }
  ],
  subjectId: [
    { required: true, message: '请选择学科领域', trigger: 'change' }
  ],
  paperType: [
    // 不能写成 required: true：这个下拉在学院/专业/学科三种类型下都渲染且都允许为空
    // （空 = 适用全部类型），只有选了"论文类型（通用）"那一档才必须填。
    {
      validator: (rule, value, callback) => {
        if (categoryForm.value.categoryType === 'paper_type' && !value) {
          callback(new Error('请选择论文类型'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  threshold: [
    { required: true, message: '请设置相似度阈值', trigger: 'blur' },
    { type: 'number', min: 0, max: 100, message: '阈值必须在0-100之间', trigger: 'blur' }
  ]
}

// 方法
const loadSettings = async () => {
  isLoading.value = true
  try {
    // 获取相似度阈值设置
    // 后端 Result 只有 code/errorCode/message/data，没有 success 字段，
    // 用 response.success 判断会恒为 undefined，成功也走 else 报"失败"。
    const response = await getSimilarityThresholds()
    if (response.code === 200) {
      const data = response.data
      // 用 ?? 而非 ||：阈值 0 是合法值，|| 会把它顶成默认 30
      thresholdForm.value.globalThreshold = data.globalThreshold ?? 30
      categoryThresholds.value = data.categoryThresholds || []
    } else {
      ElMessage.error(response.message || '加载设置失败')
    }

    // 获取学院列表
    const collegesResponse = await getColleges()
    if (collegesResponse.code === 200) {
      // 转换学院数据结构，将 value 改为 id，label 改为 name
      colleges.value = collegesResponse.data.map(college => ({
        id: college.value,
        name: college.label,
        code: college.code
      }))
    } else {
      ElMessage.error('加载学院列表失败')
    }
  } catch (error) {
    console.error('加载设置失败:', error)
    ElMessage.error('加载设置失败')
  } finally {
    isLoading.value = false
  }
}

// 拉学科领域树，转成选择器要的形状：node.value = subject.id（字符串），
// 门类在 label 后缀「（大类）」——同一棵树里门类和二级学科长得一样，
// 不标出来就分不清配的是哪一级，而门类会向下继承、二级不会。
const fetchSubjectTree = async () => {
  subjectLoading.value = true
  try {
    const response = await getSubjectFieldTree()
    if (response.code === 200) {
      subjectTree.value = decorateSubjectTree(response.data || [])
    } else {
      // 学科树拉不到只影响"新增学科领域阈值"，不该连累整页表单，所以只提示不抛
      subjectTree.value = []
      ElMessage.error('加载学科领域失败：' + response.message)
    }
  } catch (error) {
    subjectTree.value = []
    console.error('加载学科领域失败:', error)
  } finally {
    subjectLoading.value = false
  }
}

const decorateSubjectTree = (nodes) => (nodes || []).map(node => ({
  value: node.id === null || node.id === undefined ? '' : String(node.id),
  label: node.level === 1 ? node.label + '（大类）' : node.label,
  children: node.children && node.children.length ? decorateSubjectTree(node.children) : undefined
}))

// 从本地树里反查 label，用于新增行即时显示名称（保存后会回读服务端解析的名称）
const subjectLabelOf = (subjectId, nodes = subjectTree.value) => {
  if (!subjectId) return ''
  for (const node of nodes || []) {
    if (node.value === String(subjectId)) return node.label
    const hit = subjectLabelOf(subjectId, node.children)
    if (hit) return hit
  }
  return ''
}

// 组装 PUT 载荷：只保留后端认识的字段，并把空串收敛成 null。
// 表格行是从服务端读回来的，带着后端会忽略的 id / categoryName；
// 而表单里未选择时是 ''，别把一个空串丢给后端的 Long 字段去赌 Jackson 的强制转换配置。
const buildSavePayload = () => ({
  globalThreshold: thresholdForm.value.globalThreshold,
  categoryThresholds: categoryThresholds.value.map(item => ({
    categoryType: item.categoryType,
    collegeId: item.collegeId === '' || item.collegeId === undefined ? null : item.collegeId,
    majorId: item.majorId === '' || item.majorId === undefined ? null : item.majorId,
    // subjectId 从树里来时已经是字符串（与接口返回形态一致），直接透传即可
    subjectId: item.subjectId === '' || item.subjectId === undefined ? null : item.subjectId,
    // 空串必须收敛成 null：库里的空串会让解析器的 "paper_type IS NULL" 永远匹配不到它，
    // 于是这条行会静默失效（既不生效也不报错）。
    paperType: item.paperType === '' || item.paperType === undefined ? null : item.paperType,
    threshold: item.threshold
  }))
})

const saveSettings = async () => {
  if (!thresholdFormRef.value) return

  isLoading.value = true
  try {
    const valid = await thresholdFormRef.value.validate().catch(() => false)
    if (!valid) return

    const response = await updateSimilarityThresholds(buildSavePayload())
    if (response.code === 200) {
      ElMessage.success('保存设置成功')
      // 回读一次：新增行的 id 是本地 Date.now() 造的临时值，categoryName 也是前端拼的；
      // 刷新后表格里才是真实雪花 id 和服务端解析出的名称。
      await loadSettings()
    } else {
      ElMessage.error(response.message || '保存设置失败')
    }
  } catch (error) {
    // 不在这里再弹提示：底层 request 拦截器已经按 HTTP 状态码弹过了
    // （400 会带出后端校验文案），这里再弹一次会变成两条重复提示。
    console.error('保存设置失败:', error)
  } finally {
    isLoading.value = false
  }
}

const resetForm = () => {
  loadSettings()
}

const showCategoryDialog = () => {
  categoryForm.value = {
    id: null,
    categoryType: 'college',
    collegeId: '',
    majorId: '',
    subjectId: '',
    paperType: '',
    threshold: 30
  }
  categoryDialogTitle.value = '添加分类阈值'
  categoryDialogVisible.value = true
}

const saveCategoryThreshold = async () => {
  if (!categoryFormRef.value) return

  isLoading.value = true
  try {
    await categoryFormRef.value.validate(async (valid) => {
      if (valid) {
        // 构建阈值对象
        const threshold = {
          id: categoryForm.value.id,
          categoryType: categoryForm.value.categoryType,
          // 空串在 buildSavePayload 里会被收敛成 null（= 适用全部类型）
          paperType: categoryForm.value.paperType,
          threshold: categoryForm.value.threshold
        }

        if (categoryForm.value.categoryType === 'paper_type') {
          // "仅按类型"这一档只认 paperType，三个作用域 id 必须全空，
          // 否则后端 validate 会把它当成"某学院+类型"的行并拒绝。
          threshold.paperType = categoryForm.value.paperType
          threshold.categoryName = getPaperTypeText(categoryForm.value.paperType)
        } else if (categoryForm.value.categoryType === 'college') {
          threshold.collegeId = categoryForm.value.collegeId
          // 查找学院名称
          const college = colleges.value.find(c => c.id === categoryForm.value.collegeId)
          if (college) {
            threshold.categoryName = college.name
          }
        } else if (categoryForm.value.categoryType === 'subject') {
          // 学科维度只提交 subjectId；collegeId/majorId 留空，
          // 免得后端把这条学科配置也当成"某学院"的配置（三个字段是同一张表的并列列）
          threshold.subjectId = categoryForm.value.subjectId
          threshold.categoryName = subjectLabelOf(categoryForm.value.subjectId)
        } else {
          threshold.collegeId = categoryForm.value.collegeId
          threshold.majorId = categoryForm.value.majorId
          // 查找专业名称
          const major = majors.value.find(m => m.id === categoryForm.value.majorId)
          if (major) {
            threshold.categoryName = major.name
          }
        }

        if (categoryForm.value.id) {
          // 更新现有阈值
          const index = categoryThresholds.value.findIndex(t => t.id === categoryForm.value.id)
          if (index > -1) {
            categoryThresholds.value[index] = threshold
          }
        } else {
          // 添加新阈值
          threshold.id = Date.now()
          categoryThresholds.value.push(threshold)
        }

        categoryDialogVisible.value = false
        ElMessage.success('保存阈值成功')
      }
    })
  } catch (error) {
    console.error('保存阈值失败:', error)
    ElMessage.error('保存阈值失败')
  } finally {
    isLoading.value = false
  }
}

const updateCategoryThreshold = (threshold) => {
  // 阈值更新已通过双向绑定实现
}

const deleteCategoryThreshold = async (id) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除此阈值设置吗？此操作不可撤销。',
      '删除阈值',
      { type: 'warning' }
    )

    const index = categoryThresholds.value.findIndex(t => t.id === id)
    if (index > -1) {
      categoryThresholds.value.splice(index, 1)
      ElMessage.success('删除阈值成功')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除阈值失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const handleCollegeChange = async (collegeId) => {
  if (collegeId) {
    try {
      const response = await getMajors(collegeId)
      if (response.code === 200) {
        // 转换专业数据结构，将 value 改为 id，label 改为 name
        majors.value = response.data.map(major => ({
          id: major.value,
          name: major.label,
          code: major.code,
          collegeId: major.collegeId
        }))
        categoryForm.value.majorId = ''
      } else {
        ElMessage.error('加载专业列表失败')
      }
    } catch (error) {
      console.error('加载专业列表失败:', error)
      ElMessage.error('加载专业列表失败')
    }
  } else {
    majors.value = []
    categoryForm.value.majorId = ''
  }
}

const resetCategoryForm = () => {
  if (categoryFormRef.value) {
    categoryFormRef.value.resetFields()
  }
}

// 生命周期
onMounted(() => {
  loadSettings()
  fetchSubjectTree()
  // 预取论文类型，填充下拉并让表格里的 code 渲染成中文
  // 失败不在此提示：全局 axios 拦截器已 toast 过，catch 只避免未处理的 rejection
  loadPaperTypes().catch(() => {})
})

// 监听分类类型变化：切走时把该类型不再用到的字段清掉。
// collegeId 刻意不清 —— 学院/专业两档共用它（选专业时靠它过滤专业列表）。
watch(
  () => categoryForm.value.categoryType,
  (newType) => {
    if (newType !== 'major') {
      categoryForm.value.majorId = ''
    }
    if (newType !== 'subject') {
      categoryForm.value.subjectId = ''
    }
    // "仅按类型"档不允许带任何作用域 id，这里连 collegeId 一起清掉
    // （它与上面两处不同：别处是"该类型用不到"，这里是"存在就会被后端拒绝"）。
    // paperType 本身不清 —— 它在四种类型下都是合法维度，作用域行也可以带类型。
    if (newType === 'paper_type') {
      categoryForm.value.collegeId = ''
      categoryForm.value.majorId = ''
      categoryForm.value.subjectId = ''
    }
  }
)
</script>

<style lang="scss" scoped>
.similarity-threshold {
  .threshold-card {
    .threshold-slider {
      display: flex;
      align-items: center;
      gap: 16px;
      
      .threshold-label {
        font-weight: 400;
        min-width: 60px;
      }
    }
    
    .help-text {
      font-size: 12px;
      color: var(--apple-info);
      margin-top: 8px;
    }
    
    .category-thresholds {
      margin-top: 16px;

      .empty-category-thresholds {
        padding: 40px 0;
      }

      // 「全部类型」是占位语义（该行不带类型限定），压低存在感避免被读成一个真实取值
      .all-types-label {
        color: var(--apple-info);
      }
    }
  }
}
</style>
