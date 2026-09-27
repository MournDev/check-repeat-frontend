<template>
  <div class="similarity-threshold">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">相似度阈值设置</h1>
          <p class="page-subtitle">设置论文查重的相似度阈值，超过阈值的论文将被标记为需要重点审核</p>
        </div>
      </div>
    </div>

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

        <el-form-item label="学科/专业阈值">
          <div class="category-thresholds">
            <el-button
              type="primary"
              :icon="Plus"
              @click="showCategoryDialog"
              :disabled="isLoading"
            >
              添加学科/专业阈值
            </el-button>

            <el-table
              v-if="categoryThresholds.length > 0"
              :data="categoryThresholds"
              style="width: 100%"
              :disabled="isLoading"
            >
              <el-table-column prop="categoryType" label="类型" width="120">
                <template #default="scope">
                  {{ scope.row.categoryType === 'college' ? '学院' : '专业' }}
                </template>
              </el-table-column>
              <el-table-column prop="categoryName" label="名称" min-width="150" />
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
              <el-empty description="暂无学科/专业阈值设置">
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

    <!-- 学科/专业阈值编辑对话框 -->
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
          </el-radio-group>
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

// 图标导入
import {
  Plus
} from '@element-plus/icons-vue'

// API导入
import {
  getSimilarityThresholds,
  updateSimilarityThresholds,
  getColleges,
  getMajors
} from '@/api/teacher'

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
  threshold: 30
})
const categoryFormRef = ref(null)
const colleges = ref([])
const majors = ref([])

// 计算属性
const categoryDialogTitle = ref('添加学科/专业阈值')

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
    const response = await getSimilarityThresholds()
    if (response.success) {
      const data = response.data
      thresholdForm.value.globalThreshold = data.globalThreshold || 30
      categoryThresholds.value = data.categoryThresholds || []
    } else {
      ElMessage.error('加载设置失败')
    }

    // 获取学院列表
    const collegesResponse = await getColleges()
    if (collegesResponse.success) {
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

const saveSettings = async () => {
  if (!thresholdFormRef.value) return

  isLoading.value = true
  try {
    await thresholdFormRef.value.validate(async (valid) => {
      if (valid) {
        const response = await updateSimilarityThresholds({
          globalThreshold: thresholdForm.value.globalThreshold,
          categoryThresholds: categoryThresholds.value
        })

        if (response.success) {
          ElMessage.success('保存设置成功')
        } else {
          ElMessage.error('保存设置失败')
        }
      }
    })
  } catch (error) {
    console.error('保存设置失败:', error)
    ElMessage.error('保存设置失败')
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
    threshold: 30
  }
  categoryDialogTitle.value = '添加学科/专业阈值'
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
          threshold: categoryForm.value.threshold
        }

        if (categoryForm.value.categoryType === 'college') {
          threshold.collegeId = categoryForm.value.collegeId
          // 查找学院名称
          const college = colleges.value.find(c => c.id === categoryForm.value.collegeId)
          if (college) {
            threshold.categoryName = college.name
          }
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
      if (response.success) {
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
})

// 监听分类类型变化
watch(
  () => categoryForm.value.categoryType,
  (newType) => {
    if (newType === 'college') {
      categoryForm.value.majorId = ''
    }
  }
)
</script>

<style lang="scss" scoped>
.similarity-threshold {
  .page-header {
    margin-bottom: 20px;
    
    .header-content {
      .page-title {
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 600;
      }
      
      .page-subtitle {
        margin: 0;
        color: #606266;
      }
    }
  }
  
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
      color: #909399;
      margin-top: 8px;
    }
    
    .category-thresholds {
      margin-top: 16px;
      
      .empty-category-thresholds {
        padding: 40px 0;
      }
    }
  }
}
</style>
