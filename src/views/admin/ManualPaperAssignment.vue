<template>
  <div class="manual-assignment">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">手动论文分配</h1>
        <p class="page-desc">为学生手动指定指导老师，支持批量分配和精细调整</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Refresh" @click="refreshData">
          刷新数据
        </el-button>
        <el-button :icon="Setting" @click="showRuleConfig">
          分配规则
        </el-button>
      </div>
    </div>

    <!-- 统计概览 -->
    <el-row :gutter="16" class="stats-cards">
      <el-col :xs="12" :sm="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon bg-primary">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ assignmentStats.unassignedStudents }}</div>
              <div class="stat-label">未分配学生</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon bg-success">
              <el-icon><UserFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ assignmentStats.availableTeachers }}</div>
              <div class="stat-label">可用教师</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon bg-warning">
              <el-icon><Connection /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ assignmentStats.avgLoad }}</div>
              <div class="stat-label">平均指导数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon bg-info">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ assignmentStats.todayAssignments }}</div>
              <div class="stat-label">今日分配</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 分配操作区域 -->
    <el-row :gutter="16" class="assignment-area">
      <!-- 左侧：学生列表 -->
      <el-col :xs="24" :lg="12">
        <el-card class="student-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><Avatar /></el-icon>
                待分配学生
                <el-tag v-if="unassignedStudents.length > 0" type="danger" size="small">
                  {{ unassignedStudents.length }}
                </el-tag>
              </span>
              <div class="card-actions">
                <el-input
                  v-model="studentFilter"
                  placeholder="搜索学生姓名/学号"
                  clearable
                  style="width: 200px"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
              </div>
            </div>
          </template>

          <div class="student-list">
            <div 
              v-for="student in filteredStudents" 
              :key="student.id"
              class="student-item"
              :class="{ selected: selectedStudents.includes(student.id) }"
              @click="toggleStudentSelection(student.id)"
            >
              <div class="student-info">
                <div class="student-basic">
                  <h4 class="student-name">{{ student.name }}</h4>
                  <span class="student-id">{{ student.studentId }}</span>
                </div>
                <div class="student-major">
                  <el-tag size="small">{{ getMajorName(student.major) }}</el-tag>
                  <span class="grade">{{ student.grade }}级</span>
                </div>
                <div class="student-interests" v-if="student.interests">
                  <el-tag 
                    v-for="interest in student.interests.slice(0, 2)" 
                    :key="interest" 
                    size="small" 
                    type="info"
                  >
                    {{ interest }}
                  </el-tag>
                </div>
              </div>
              <div class="student-actions">
                <el-button 
                  size="small" 
                  type="primary" 
                  text 
                  @click.stop="handleSingleAssign(student)"
                >
                  分配导师
                </el-button>
              </div>
            </div>
            
            <div v-if="filteredStudents.length === 0" class="empty-students">
              <el-empty description="暂无待分配学生" :image-size="80" />
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：教师列表 -->
      <el-col :xs="24" :lg="12">
        <el-card class="teacher-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><User /></el-icon>
                指导教师
                <el-tag type="success" size="small">
                  {{ availableTeachers.length }}
                </el-tag>
              </span>
              <div class="card-actions">
                <el-input
                  v-model="teacherFilter"
                  placeholder="搜索教师姓名"
                  clearable
                  style="width: 200px"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
              </div>
            </div>
          </template>

          <div class="teacher-list">
            <div 
              v-for="teacher in filteredTeachers" 
              :key="teacher.id"
              class="teacher-item"
              :class="{ selected: selectedTeacher === teacher.id }"
              @click="selectTeacher(teacher.id)"
            >
              <div class="teacher-info">
                <div class="teacher-basic">
                  <h4 class="teacher-name">{{ teacher.name }}</h4>
                  <span class="teacher-title">{{ teacher.title }}</span>
                </div>
                <div class="teacher-department">
                  {{ teacher.department }}
                </div>
                <div class="teacher-load">
                  <span>当前指导: </span>
                  <el-tag :type="getLoadTagType(teacher.currentLoad)">
                    {{ teacher.currentLoad }}/{{ teacher.maxLoad }}
                  </el-tag>
                </div>
                <div class="teacher-expertise" v-if="teacher.expertise">
                  <el-tag 
                    v-for="exp in teacher.expertise.slice(0, 2)" 
                    :key="exp" 
                    size="small" 
                    type="success"
                  >
                    {{ exp }}
                  </el-tag>
                </div>
              </div>
              <div class="teacher-actions">
                <el-button 
                  size="small" 
                  type="success" 
                  :disabled="selectedStudents.length === 0 || teacher.currentLoad >= teacher.maxLoad"
                  @click="assignSelectedStudents(teacher)"
                >
                  批量分配 ({{ selectedStudents.length }})
                </el-button>
              </div>
            </div>
            
            <div v-if="filteredTeachers.length === 0" class="empty-teachers">
              <el-empty description="暂无可选教师" :image-size="80" />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 批量操作栏 -->
    <el-card class="batch-actions-card" shadow="never" v-if="selectedStudents.length > 0">
      <div class="batch-actions">
        <div class="selected-info">
          已选择 <strong>{{ selectedStudents.length }}</strong> 名学生
        </div>
        <div class="batch-buttons">
          <el-button type="primary" @click="showBatchAssignDialog">
            批量分配导师
          </el-button>
          <el-button @click="clearSelection">
            清空选择
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 单个学生分配对话框 -->
    <el-dialog
      v-model="singleAssignDialogVisible"
      title="分配指导老师"
      width="500px"
    >
      <el-form
        :model="singleAssignForm"
        :rules="singleAssignRules"
        ref="singleAssignFormRef"
        label-width="100px"
      >
        <el-form-item label="学生信息">
          <div class="student-preview">
            <div><strong>{{ currentStudent?.name }}</strong> ({{ currentStudent?.studentId }})</div>
            <div>{{ getMajorName(currentStudent?.major) }} · {{ currentStudent?.grade }}级</div>
          </div>
        </el-form-item>
        <el-form-item label="选择导师" prop="teacherId">
          <el-select 
            v-model="singleAssignForm.teacherId" 
            placeholder="请选择指导老师" 
            style="width: 100%"
            filterable
          >
            <el-option
              v-for="teacher in availableTeachers"
              :key="teacher.id"
              :label="`${teacher.name} (${teacher.title}) - ${teacher.department}`"
              :value="teacher.id"
              :disabled="teacher.currentLoad >= teacher.maxLoad"
            >
              <div class="teacher-option">
                <div>
                  <span class="teacher-name">{{ teacher.name }}</span>
                  <el-tag size="small" :type="getLoadTagType(teacher.currentLoad)">
                    {{ teacher.currentLoad }}/{{ teacher.maxLoad }}
                  </el-tag>
                </div>
                <div class="teacher-detail">\                  <span>{{ teacher.title }} · {{ teacher.department }}</span>
                </div>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="分配说明">
          <el-input
            v-model="singleAssignForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入分配说明（可选）"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="singleAssignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSingleAssign" :loading="assigning">
          确认分配
        </el-button>
      </template>
    </el-dialog>

    <!-- 分配规则配置对话框 -->
    <el-dialog
      v-model="ruleConfigDialogVisible"
      title="分配规则配置"
      width="600px"
    >
      <el-form
        :model="ruleConfigForm"
        label-width="120px"
      >
        <el-form-item label="每位教师最大指导人数">
          <el-input-number 
            v-model="ruleConfigForm.maxLoadPerTeacher" 
            :min="1" 
            :max="50" 
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="自动平衡策略">
          <el-switch 
            v-model="ruleConfigForm.balanceStrategy" 
            active-text="开启" 
            inactive-text="关闭"
          />
        </el-form-item>
        <el-form-item label="按专业匹配优先">
          <el-switch 
            v-model="ruleConfigForm.majorPriority" 
            active-text="开启" 
            inactive-text="关闭"
          />
        </el-form-item>
        <el-form-item label="按研究兴趣匹配">
          <el-switch 
            v-model="ruleConfigForm.interestsMatch" 
            active-text="开启" 
            inactive-text="关闭"
          />
        </el-form-item>
        <el-form-item label="部门优先级">
          <el-switch 
            v-model="ruleConfigForm.departmentPriority" 
            active-text="开启" 
            inactive-text="关闭"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ruleConfigDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRuleConfig" :loading="savingRules">
          保存配置
        </el-button>
      </template>
    </el-dialog>

    <!-- 批量分配对话框 -->
    <el-dialog
      v-model="batchAssignDialogVisible"
      title="批量分配指导老师"
      width="600px"
    >
      <el-form
        :model="batchAssignForm"
        :rules="batchAssignRules"
        ref="batchAssignFormRef"
        label-width="100px"
      >
        <el-form-item label="选择学生">
          <div class="selected-students-preview">
            <el-tag 
              v-for="studentId in selectedStudents" 
              :key="studentId"
              closable
              @close="removeFromSelection(studentId)"
              class="student-tag"
            >
              {{ getStudentName(studentId) }}
            </el-tag>
          </div>
        </el-form-item>
        <el-form-item label="选择导师" prop="teacherId">
          <el-select 
            v-model="batchAssignForm.teacherId" 
            placeholder="请选择指导老师" 
            style="width: 100%"
            filterable
          >
            <el-option
              v-for="teacher in availableTeachers"
              :key="teacher.id"
              :label="`${teacher.name} (${teacher.title}) - ${teacher.department}`"
              :value="teacher.id"
              :disabled="teacher.currentLoad >= teacher.maxLoad || wouldExceedLoad(teacher)"
            >
              <div class="teacher-option">
                <div>
                  <span class="teacher-name">{{ teacher.name }}</span>
                  <el-tag size="small" :type="getLoadTagType(teacher.currentLoad)">
                    {{ teacher.currentLoad }}/{{ teacher.maxLoad }}
                  </el-tag>
                </div>
                <div class="teacher-detail">
                  <span>{{ teacher.title }} · {{ teacher.department }}</span>
                </div>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="分配策略">
          <el-radio-group v-model="batchAssignForm.strategy">
            <el-radio label="balanced">均衡分配</el-radio>
            <el-radio label="specific">指定分配</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="分配说明">
          <el-input
            v-model="batchAssignForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入分配说明（可选）"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchAssignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmBatchAssign" :loading="batchAssigning">
          确认批量分配
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 导入API接口
import {
  getAssignmentStats,
  getUnassignedStudents,
  getAvailableTeachers,
  assignSingleStudent,
  assignBatchStudents,
  getMajorMapping,
  getAssignmentRules,
  saveAssignmentRules,
  refreshAssignmentData
} from '@/api/admin/assignment'

// 图标导入
import {
  Refresh, Setting, User, UserFilled, Connection, TrendCharts,
  Avatar, Search
} from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)
const assigning = ref(false)
const batchAssigning = ref(false)
const savingRules = ref(false)
const singleAssignDialogVisible = ref(false)
const batchAssignDialogVisible = ref(false)
const ruleConfigDialogVisible = ref(false)
const selectedStudents = ref([])
const selectedTeacher = ref(null)
const currentStudent = ref(null)
const studentFilter = ref('')
const teacherFilter = ref('')

// 分页数据
const studentPagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

const teacherPagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 专业映射
const majorMapping = ref({})

// 统计数据
const assignmentStats = ref({
  unassignedStudents: 0,
  availableTeachers: 0,
  avgLoad: 0,
  todayAssignments: 0
})

// 学生数据
const unassignedStudents = ref([])

// 教师数据
const availableTeachers = ref([])

// 表单数据
const singleAssignForm = reactive({
  teacherId: '',
  remark: ''
})

const batchAssignForm = reactive({
  teacherId: '',
  strategy: 'balanced',
  remark: ''
})

const ruleConfigForm = reactive({
  maxLoadPerTeacher: 15,
  balanceStrategy: true,
  majorPriority: true,
  interestsMatch: true,
  departmentPriority: true
})

const singleAssignFormRef = ref()
const batchAssignFormRef = ref()

// 表单验证规则
const singleAssignRules = {
  teacherId: [
    { required: true, message: '请选择指导老师', trigger: 'change' }
  ]
}

const batchAssignRules = {
  teacherId: [
    { required: true, message: '请选择指导老师', trigger: 'change' }
  ]
}

// 计算属性
const filteredStudents = computed(() => {
  if (!studentFilter.value) return unassignedStudents.value
  const filterText = studentFilter.value.toLowerCase()
  return unassignedStudents.value.filter(student => 
    student.name.toLowerCase().includes(filterText) ||
    student.studentId.includes(filterText)
  )
})

const filteredTeachers = computed(() => {
  if (!teacherFilter.value) return availableTeachers.value
  const filterText = teacherFilter.value.toLowerCase()
  return availableTeachers.value.filter(teacher => 
    teacher.name.toLowerCase().includes(filterText) ||
    teacher.department.toLowerCase().includes(filterText)
  )
})

// 方法
const refreshData = async () => {
  try {
    await refreshAssignmentData()
    await loadAssignmentData()
    ElMessage.success('数据已刷新')
  } catch (error) {
    ElMessage.error('刷新数据失败: ' + error.message)
  }
}

const showRuleConfig = async () => {
  try {
    const res = await getAssignmentRules()
    if (res.code === 200) {
      // 加载现有配置
      Object.assign(ruleConfigForm, res.data)
      ruleConfigDialogVisible.value = true
    }
  } catch (error) {
    ElMessage.error('获取分配规则失败: ' + error.message)
  }
}

const saveRuleConfig = async () => {
  try {
    savingRules.value = true
    const res = await saveAssignmentRules(ruleConfigForm)
    if (res.code === 200) {
      ElMessage.success('分配规则保存成功')
      ruleConfigDialogVisible.value = false
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (error) {
    ElMessage.error('保存分配规则失败: ' + error.message)
  } finally {
    savingRules.value = false
  }
}

const loadAssignmentData = async () => {
  loading.value = true
  try {
    await Promise.all([
      loadStats(),
      loadStudents(),
      loadTeachers(),
      loadMajorMapping()
    ])
    loading.value = false
  } catch (error) {
    ElMessage.error('加载数据失败: ' + error.message)
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const res = await getAssignmentStats()
    if (res.code === 200) {
      assignmentStats.value = res.data
    }
  } catch (error) {
    console.error('加载统计信息失败:', error)
  }
}

const loadStudents = async () => {
  try {
    const params = {
      keyword: studentFilter.value,
      page: studentPagination.currentPage,
      size: studentPagination.pageSize
    }
    const res = await getUnassignedStudents(params)
    if (res.code === 200) {
      unassignedStudents.value = res.data.records || []
      studentPagination.total = res.data.total || 0
    }
  } catch (error) {
    console.error('加载学生数据失败:', error)
    ElMessage.error('加载学生数据失败')
  }
}

const loadTeachers = async () => {
  try {
    const params = {
      keyword: teacherFilter.value,
      page: teacherPagination.currentPage,
      size: teacherPagination.pageSize
    }
    const res = await getAvailableTeachers(params)
    if (res.code === 200) {
      availableTeachers.value = res.data.records || []
      teacherPagination.total = res.data.total || 0
    }
  } catch (error) {
    console.error('加载教师数据失败:', error)
    ElMessage.error('加载教师数据失败')
  }
}

const loadMajorMapping = async () => {
  try {
    const res = await getMajorMapping()
    if (res.code === 200) {
      majorMapping.value = res.data
    }
  } catch (error) {
    console.error('加载专业映射失败:', error)
  }
}

const getMajorName = (majorCode) => {
  return majorMapping.value[majorCode] || majorCode
}

const getLoadTagType = (currentLoad) => {
  if (currentLoad >= 12) return 'danger'
  if (currentLoad >= 8) return 'warning'
  return 'success'
}

const toggleStudentSelection = (studentId) => {
  const index = selectedStudents.value.indexOf(studentId)
  if (index > -1) {
    selectedStudents.value.splice(index, 1)
  } else {
    selectedStudents.value.push(studentId)
  }
}

const selectTeacher = (teacherId) => {
  selectedTeacher.value = teacherId === selectedTeacher.value ? null : teacherId
}

const handleSingleAssign = (student) => {
  currentStudent.value = student
  singleAssignForm.teacherId = ''
  singleAssignForm.remark = ''
  singleAssignDialogVisible.value = true
}

const assignSelectedStudents = (teacher) => {
  if (selectedStudents.value.length === 0) {
    ElMessage.warning('请先选择学生')
    return
  }
  batchAssignForm.teacherId = teacher.id
  batchAssignForm.strategy = 'balanced'
  batchAssignForm.remark = ''
  batchAssignDialogVisible.value = true
}

const showBatchAssignDialog = () => {
  if (selectedStudents.value.length === 0) {
    ElMessage.warning('请先选择学生')
    return
  }
  batchAssignForm.teacherId = ''
  batchAssignForm.strategy = 'balanced'
  batchAssignForm.remark = ''
  batchAssignDialogVisible.value = true
}

const clearSelection = () => {
  selectedStudents.value = []
  selectedTeacher.value = null
}

const removeFromSelection = (studentId) => {
  const index = selectedStudents.value.indexOf(studentId)
  if (index > -1) {
    selectedStudents.value.splice(index, 1)
  }
}

const getStudentName = (studentId) => {
  const student = unassignedStudents.value.find(s => s.id === studentId)
  return student ? student.name : ''
}

const wouldExceedLoad = (teacher) => {
  return teacher.currentLoad + selectedStudents.value.length > teacher.maxLoad
}

const confirmSingleAssign = async () => {
  if (!singleAssignFormRef.value) return
  
  try {
    await singleAssignFormRef.value.validate()
    assigning.value = true
    
    const assignData = {
      studentId: currentStudent.value.id,
      teacherId: singleAssignForm.teacherId,
      remark: singleAssignForm.remark
    }
    
    const res = await assignSingleStudent(assignData)
    if (res.code === 200) {
      ElMessage.success(`成功为 ${currentStudent.value.name} 分配指导老师`)
      singleAssignDialogVisible.value = false
      // 更新数据
      const studentIndex = unassignedStudents.value.findIndex(s => s.id === currentStudent.value.id)
      if (studentIndex > -1) {
        unassignedStudents.value.splice(studentIndex, 1)
      }
      // 更新统计信息
      await loadStats()
    } else {
      ElMessage.error(res.message || '分配失败')
    }
    assigning.value = false
  } catch (error) {
    ElMessage.error('分配失败: ' + error.message)
    assigning.value = false
  }
}

const confirmBatchAssign = async () => {
  if (!batchAssignFormRef.value) return
  
  try {
    await batchAssignFormRef.value.validate()
    batchAssigning.value = true
    
    const assignData = {
      studentIds: selectedStudents.value,
      teacherId: batchAssignForm.teacherId,
      strategy: batchAssignForm.strategy,
      remark: batchAssignForm.remark
    }
    
    const res = await assignBatchStudents(assignData)
    if (res.code === 200) {
      ElMessage.success(`成功为 ${selectedStudents.value.length} 名学生分配指导老师`)
      batchAssignDialogVisible.value = false
      // 更新数据
      selectedStudents.value.forEach(studentId => {
        const studentIndex = unassignedStudents.value.findIndex(s => s.id === studentId)
        if (studentIndex > -1) {
          unassignedStudents.value.splice(studentIndex, 1)
        }
      })
      selectedStudents.value = []
      // 更新统计信息
      await loadStats()
    } else {
      ElMessage.error(res.message || '批量分配失败')
    }
    batchAssigning.value = false
  } catch (error) {
    ElMessage.error('批量分配失败: ' + error.message)
    batchAssigning.value = false
  }
}

// 生命周期
onMounted(() => {
  loadAssignmentData()
})
</script>

<style lang="scss" scoped>
.manual-assignment {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  
  .header-content {
    .page-title {
      margin: 0 0 0.5rem 0;
      font-size: 1.75rem;
      font-weight: 600;
      color: #2c3e50;
    }
    
    .page-desc {
      margin: 0;
      color: #7f8c8d;
      font-size: 0.95rem;
    }
  }
  
  .header-actions {
    display: flex;
    gap: 0.75rem;
  }
}

.stats-cards {
  margin-bottom: 1.5rem;
  
  .stat-card {
    border: none;
    border-radius: 12px;
    
    .stat-content {
      display: flex;
      align-items: center;
      
      .stat-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: 12px;
        margin-right: 1rem;
        
        &.bg-primary {
          background: linear-gradient(135deg, #667eea, #764ba2);
        }
        
        &.bg-success {
          background: linear-gradient(135deg, #4facfe, #00f2fe);
        }
        
        &.bg-warning {
          background: linear-gradient(135deg, #f093fb, #f5576c);
        }
        
        &.bg-info {
          background: linear-gradient(135deg, #43e97b, #38f9d7);
        }
        
        .el-icon {
          color: white;
          font-size: 1.5rem;
        }
      }
      
      .stat-info {
        .stat-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: #2c3e50;
          line-height: 1;
        }
        
        .stat-label {
          font-size: 0.875rem;
          color: #7f8c8d;
          margin-top: 0.25rem;
        }
      }
    }
  }
}

.assignment-area {
  margin-bottom: 1.5rem;
  
  .student-card,
  .teacher-card {
    border-radius: 12px;
    height: 500px;
    
    :deep(.el-card__header) {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #f1f2f6;
      
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .card-title {
          display: flex;
          align-items: center;
          font-weight: 600;
          color: #2c3e50;
          
          .el-icon {
            margin-right: 0.5rem;
            color: #667eea;
          }
          
          .el-tag {
            margin-left: 0.5rem;
          }
        }
      }
    }
    
    :deep(.el-card__body) {
      padding: 0;
      height: calc(100% - 60px);
      overflow-y: auto;
    }
  }
}

.student-list,
.teacher-list {
  .student-item,
  .teacher-item {
    padding: 1rem;
    border-bottom: 1px solid #f8f9fa;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background-color: #f8f9fa;
    }
    
    &.selected {
      background-color: rgba(102, 126, 234, 0.1);
      border-left: 3px solid #667eea;
    }
    
    .student-info,
    .teacher-info {
      .student-basic,
      .teacher-basic {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
        
        .student-name,
        .teacher-name {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: #2c3e50;
        }
        
        .student-id,
        .teacher-title {
          font-size: 0.875rem;
          color: #7f8c8d;
        }
      }
      
      .student-major,
      .teacher-department {
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
        color: #5a6c7d;
        
        .grade {
          margin-left: 0.5rem;
        }
      }
      
      .student-interests,
      .teacher-expertise {
        .el-tag {
          margin-right: 0.25rem;
          margin-bottom: 0.25rem;
        }
      }
      
      .student-load,
      .teacher-load {
        font-size: 0.875rem;
        color: #5a6c7d;
      }
    }
    
    .student-actions,
    .teacher-actions {
      margin-top: 0.5rem;
    }
  }
  
  .empty-students,
  .empty-teachers {
    padding: 2rem 0;
    text-align: center;
  }
}

.batch-actions-card {
  border-radius: 12px;
  margin-bottom: 1.5rem;
  
  :deep(.el-card__body) {
    padding: 1rem 1.25rem;
  }
  
  .batch-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .selected-info {
      font-size: 1rem;
      color: #2c3e50;
    }
    
    .batch-buttons {
      display: flex;
      gap: 0.75rem;
    }
  }
}

.student-preview {
  padding: 0.75rem;
  background-color: #f8f9fa;
  border-radius: 6px;
  
  div {
    margin-bottom: 0.25rem;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}

.selected-students-preview {
  .student-tag {
    margin-right: 0.5rem;
    margin-bottom: 0.5rem;
  }
}

.teacher-option {
  .teacher-name {
    font-weight: 600;
    margin-right: 0.5rem;
  }
  
  .teacher-detail {
    font-size: 0.875rem;
    color: #7f8c8d;
    margin-top: 0.25rem;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 1rem;
    
    .header-actions {
      width: 100%;
      
      .el-button {
        flex: 1;
      }
    }
  }
  
  .stats-cards {
    .el-col {
      margin-bottom: 0.75rem;
    }
  }
  
  .assignment-area {
    .student-card,
    .teacher-card {
      height: auto;
      margin-bottom: 1rem;
      
      :deep(.el-card__body) {
        height: auto;
        max-height: 400px;
      }
    }
  }
  
  .batch-actions {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
}
</style>