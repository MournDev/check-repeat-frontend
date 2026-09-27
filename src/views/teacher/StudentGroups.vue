<template>
  <div class="student-groups">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">学生分组管理</h1>
          <p class="page-subtitle">创建和管理学生分组，方便批量操作</p>
        </div>
        <div class="header-right">
          <el-button type="primary" :icon="Plus" @click="showGroupDialog">
            新建分组
          </el-button>
        </div>
      </div>
    </div>

    <!-- 分组列表 -->
    <div class="groups-list">
      <el-card shadow="never" v-for="group in groups" :key="group.id" class="group-card">
        <div class="group-header">
          <div class="group-info">
            <h3 class="group-name">{{ group.name }}</h3>
            <div class="group-meta">
              <span class="student-count">{{ group.studentCount }} 名学生</span>
              <span class="create-time">{{ formatDate(group.createTime) }}</span>
            </div>
          </div>
          <div class="group-actions">
            <el-button size="small" type="primary" text :icon="Edit" @click="editGroup(group)">
              编辑
            </el-button>
            <el-button size="small" type="danger" text :icon="Delete" @click="deleteGroup(group)">
              删除
            </el-button>
          </div>
        </div>
        <div class="group-students">
          <div class="students-list" v-if="group.students && group.students.length > 0">
            <el-tag 
              v-for="student in group.students" 
              :key="student.id" 
              class="student-tag"
              closable
              @close="handleRemoveStudent(group.id, student.id)"
            >
              {{ student.name }} ({{ student.studentId }})
            </el-tag>
          </div>
          <div class="empty-students" v-else>
            <el-empty description="该分组暂无学生">
              <el-button type="primary" @click="openAddStudentsDialog(group.id)">
                添加学生
              </el-button>
            </el-empty>
          </div>
        </div>
        <div class="group-footer">
          <el-button size="small" type="primary" @click="openAddStudentsDialog(group.id)">
            添加学生
          </el-button>
          <el-button size="small" @click="sendMessageToGroup(group.id)">
            发送消息
          </el-button>
          <el-button size="small" @click="exportGroupData(group.id)">
            导出数据
          </el-button>
        </div>
      </el-card>
      
      <div v-if="groups.length === 0" class="empty-groups">
        <el-empty description="暂无分组">
          <el-button type="primary" @click="showGroupDialog">
            创建第一个分组
          </el-button>
        </el-empty>
      </div>
    </div>

    <!-- 分组编辑对话框 -->
    <el-dialog
      v-model="groupDialogVisible"
      :title="dialogTitle"
      width="500px"
      @close="resetForm"
    >
      <el-form
        :model="groupForm"
        :rules="groupRules"
        ref="groupFormRef"
        label-width="80px"
      >
        <el-form-item label="分组名称" prop="name">
          <el-input
            v-model="groupForm.name"
            placeholder="请输入分组名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="分组描述" prop="description">
          <el-input
            v-model="groupForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入分组描述"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="groupDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveGroup">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 添加学生对话框 -->
    <el-dialog
      v-model="addStudentsDialogVisible"
      title="添加学生到分组"
      width="600px"
      @close="resetAddStudentsForm"
    >
      <div class="add-students-content">
        <div class="search-box">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索学生姓名或学号"
            :prefix-icon="Search"
            clearable
            @input="handleSearch"
          />
        </div>
        
        <div class="students-selector">
          <el-checkbox-group v-model="selectedStudentIds">
            <el-checkbox 
              v-for="student in filteredStudents" 
              :key="student.id" 
              :label="student.id"
              class="student-checkbox"
            >
              <div class="student-info">
                <div class="student-name">{{ student.name }}</div>
                <div class="student-details">{{ student.studentId }} | {{ student.collegeName }} | {{ student.majorName }}</div>
              </div>
            </el-checkbox>
          </el-checkbox-group>
        </div>
        
        <div class="selected-count">
          已选择 {{ selectedStudentIds.length }} 名学生
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addStudentsDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmAddStudents">确认添加</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 图标导入
import {
  Plus, Edit, Delete, Search
} from '@element-plus/icons-vue'

// API导入
import {
  getStudentGroups,
  createStudentGroup,
  updateStudentGroup,
  deleteStudentGroup,
  addStudentsToGroup,
  removeStudentFromGroup,
  getStudentsNotInGroup
} from '@/api/teacher'

// 响应式数据
const groups = ref([])
const groupDialogVisible = ref(false)
const addStudentsDialogVisible = ref(false)
const groupForm = ref({
  id: null,
  name: '',
  description: ''
})
const groupFormRef = ref(null)
const searchKeyword = ref('')
const selectedStudentIds = ref([])
const students = ref([])
const currentGroupId = ref(null)

// 计算属性
const dialogTitle = computed(() => {
  return groupForm.value.id ? '编辑分组' : '新建分组'
})

const filteredStudents = computed(() => {
  if (!searchKeyword.value) return students.value
  const keyword = searchKeyword.value.toLowerCase()
  return students.value.filter(student =>
    student.name.toLowerCase().includes(keyword) ||
    student.studentId.toLowerCase().includes(keyword)
  )
})

// 表单验证规则
const groupRules = {
  name: [
    { required: true, message: '请输入分组名称', trigger: 'blur' },
    { max: 50, message: '名称不能超过50个字符', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '描述不能超过200个字符', trigger: 'blur' }
  ]
}

// 方法
const showGroupDialog = () => {
  groupForm.value = {
    id: null,
    name: '',
    description: ''
  }
  groupDialogVisible.value = true
}

const editGroup = (group) => {
  groupForm.value = { ...group }
  groupDialogVisible.value = true
}

const deleteGroup = async (group) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除分组 "${group.name}" 吗？此操作不可撤销。`,
      '删除分组',
      { type: 'warning' }
    )
    
    const response = await deleteStudentGroup(group.id)
    if (response.success) {
      const index = groups.value.findIndex(g => g.id === group.id)
      if (index > -1) {
        groups.value.splice(index, 1)
      }
      ElMessage.success('分组删除成功')
    } else {
      ElMessage.error('删除分组失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除分组失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const saveGroup = async () => {
  if (!groupFormRef.value) return
  
  await groupFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (groupForm.value.id) {
          // 更新分组
          const response = await updateStudentGroup(groupForm.value.id, groupForm.value)
          if (response.success) {
            const index = groups.value.findIndex(g => g.id === groupForm.value.id)
            if (index > -1) {
              groups.value[index] = response.data
            }
          } else {
            ElMessage.error('更新分组失败')
            return
          }
        } else {
          // 新建分组
          const response = await createStudentGroup(groupForm.value)
          if (response.success) {
            groups.value.push(response.data)
          } else {
            ElMessage.error('创建分组失败')
            return
          }
        }
        
        groupDialogVisible.value = false
        ElMessage.success('分组保存成功')
      } catch (error) {
        console.error('保存分组失败:', error)
        ElMessage.error('保存失败')
      }
    }
  })
}

const openAddStudentsDialog = async (groupId) => {
  currentGroupId.value = groupId
  selectedStudentIds.value = []
  
  try {
    const response = await getStudentsNotInGroup({ groupId })
    if (response.success) {
      students.value = response.data
      addStudentsDialogVisible.value = true
    } else {
      ElMessage.error('获取学生列表失败')
    }
  } catch (error) {
    console.error('获取学生列表失败:', error)
    ElMessage.error('获取学生列表失败')
  }
}

const handleRemoveStudent = async (groupId, studentId) => {
  try {
    const response = await removeStudentFromGroup(groupId, studentId)
    if (response.success) {
      const group = groups.value.find(g => g.id === groupId)
      if (group && group.students) {
        const index = group.students.findIndex(s => s.id === studentId)
        if (index > -1) {
          group.students.splice(index, 1)
          group.studentCount = group.students.length
        }
      }
      ElMessage.success('移除学生成功')
    } else {
      ElMessage.error('移除学生失败')
    }
  } catch (error) {
    console.error('移除学生失败:', error)
    ElMessage.error('移除学生失败')
  }
}

const confirmAddStudents = async () => {
  if (selectedStudentIds.value.length === 0) {
    ElMessage.warning('请选择学生')
    return
  }
  
  try {
    const response = await addStudentsToGroup(currentGroupId.value, selectedStudentIds.value)
    if (response.success) {
      // 刷新分组列表
      loadGroups()
      addStudentsDialogVisible.value = false
      ElMessage.success('添加学生成功')
    } else {
      ElMessage.error('添加学生失败')
    }
  } catch (error) {
    console.error('添加学生失败:', error)
    ElMessage.error('添加学生失败')
  }
}

const handleSearch = () => {
  // 搜索逻辑已在filteredStudents计算属性中实现
}

const resetForm = () => {
  if (groupFormRef.value) {
    groupFormRef.value.resetFields()
  }
}

const resetAddStudentsForm = () => {
  searchKeyword.value = ''
  selectedStudentIds.value = []
  students.value = []
  currentGroupId.value = null
}

const sendMessageToGroup = (groupId) => {
  // 发送消息功能，后续实现
  ElMessage.info('发送消息功能开发中')
}

const exportGroupData = (groupId) => {
  // 导出数据功能，后续实现
  ElMessage.info('导出数据功能开发中')
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}

const loadGroups = async () => {
  try {
    const response = await getStudentGroups()
    if (response.success) {
      groups.value = response.data
    } else {
      ElMessage.error('加载分组失败')
    }
  } catch (error) {
    console.error('加载分组失败:', error)
    ElMessage.error('加载分组失败')
  }
}

// 生命周期
onMounted(() => {
  loadGroups()
})
</script>

<style lang="scss" scoped>
.student-groups {
  .page-header {
    margin-bottom: 20px;
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
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
  
  .groups-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 20px;
    
    .group-card {
      .group-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;
        
        .group-info {
          flex: 1;
          
          .group-name {
            margin: 0 0 8px 0;
            font-size: 18px;
            font-weight: 400;
          }
          
          .group-meta {
            display: flex;
            gap: 16px;
            font-size: 12px;
            color: #909399;
          }
        }
        
        .group-actions {
          display: flex;
          gap: 8px;
        }
      }
      
      .group-students {
        margin-bottom: 16px;
        
        .students-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          
          .student-tag {
            margin-bottom: 8px;
          }
        }
        
        .empty-students {
          padding: 20px 0;
        }
      }
      
      .group-footer {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }
    }
    
    .empty-groups {
      grid-column: 1 / -1;
      padding: 60px 0;
      text-align: center;
    }
  }
  
  .add-students-content {
    .search-box {
      margin-bottom: 20px;
    }
    
    .students-selector {
      max-height: 400px;
      overflow-y: auto;
      margin-bottom: 20px;
      
      .student-checkbox {
        display: block;
        margin-bottom: 12px;
        padding: 12px;
        border: 1px solid #ebeef5;
        border-radius: 8px;
        cursor: pointer;
        transition: border-color 0.2s ease;
        
        &:hover {
          border-color: #0066cc;
          background-color: #f5f5f7;
        }
        
        .student-info {
          .student-name {
            font-weight: 400;
            margin-bottom: 4px;
          }
          
          .student-details {
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }
    
    .selected-count {
      font-size: 17px;
      color: #606266;
      margin-bottom: 20px;
    }
  }
}
</style>
