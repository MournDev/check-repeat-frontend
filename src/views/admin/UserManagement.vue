<template>
  <div class="user-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">人员管理</h1>
        <p class="page-desc">统一管理系统内所有人员账号（学生/教师）</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Plus" @click="showAddUserDialog">
          新增用户
        </el-button>
        <el-button :icon="Refresh" @click="refreshData">
          刷新
        </el-button>
        <el-switch v-model="fetchAllUsers" active-text="全部显示" inactive-text="分页显示" style="margin-left:12px" />
      </div>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filterForm" label-width="80px" inline>
        <el-form-item label="人员类型">
          <el-select v-model="filterForm.userType" placeholder="请选择人员类型" clearable>
            <el-option label="学生" value="STUDENT"></el-option>
            <el-option label="教师" value="TEACHER"></el-option>
            <el-option label="管理员" value="ADMIN"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="请选择状态" clearable>
            <el-option label="启用" value="ENABLED"></el-option>
            <el-option label="禁用" value="DISABLED"></el-option>
            <el-option label="锁定" value="LOCKED"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="filterForm.keyword"
            placeholder="用户名/姓名/学号"
            clearable
            style="width: 200px"
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">
            搜索
          </el-button>
          <el-button :icon="RefreshLeft" @click="resetFilter">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 用户列表 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><User /></el-icon>
            用户列表
          </span>
          <div class="table-actions">
            <el-button 
              type="danger" 
              :icon="Delete" 
              :disabled="selectedUsers.length === 0"
              @click="batchDelete"
            >
              批量删除
            </el-button>
            <el-button 
              :icon="Download" 
              @click="exportUsers"
            >
              导出数据
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="userList"
        style="width: 100%"
        :row-key="rowKey"
        @selection-change="handleSelectionChange"
        v-loading="loading"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="username" label="用户名" width="120"></el-table-column>
        <el-table-column prop="realName" label="真实姓名" width="100"></el-table-column>
        <el-table-column prop="roleName" label="人员类型" width="100">
          <template #default="{ row }">
            <el-tag 
              :type="getRoleTagType(row.roleCode)"
              size="small"
            >
              {{ row.roleName }}
            </el-tag>
          </template>
        </el-table-column>
        <!-- 已移除按角色显示的字段：学号/专业/指导老师/所属院系/职称/指导学生数 -->
        <el-table-column prop="email" label="邮箱" width="180"></el-table-column>
        <el-table-column prop="phone" label="手机号" width="120"></el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              active-color="#13ce66"
              inactive-color="#ff4949"
              @change="handleStatusChange(row, $event)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="{ row }">
            <el-button size="small" type="primary" text @click="viewUser(row)">
              查看
            </el-button>
            <el-button size="small" type="warning" text @click="editUser(row)">
              编辑
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              text 
              @click="deleteUser(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container" v-if="!fetchAllUsers">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 用户详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="用户详情"
      width="600px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="用户名">{{ currentUser.username }}</el-descriptions-item>
        <el-descriptions-item label="真实姓名">{{ currentUser.realName }}</el-descriptions-item>
        <el-descriptions-item label="人员类型">{{ currentUser.roleName }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusTagType(currentUser.status)">
            {{ getStatusText(currentUser.status) }}
          </el-tag>
        </el-descriptions-item>
        <!-- 学生特有信息 -->
        <template v-if="currentUser.roleCode === 'STUDENT'">
          <el-descriptions-item label="学号">{{ currentUser.studentId }}</el-descriptions-item>
          <el-descriptions-item label="专业">{{ getMajorName(currentUser.major) }}</el-descriptions-item>
          <el-descriptions-item label="指导老师">{{ currentUser.advisorName || '未分配' }}</el-descriptions-item>
          <el-descriptions-item label="年级">{{ currentUser.grade }}级</el-descriptions-item>
        </template>
        <!-- 教师特有信息 -->
        <template v-if="currentUser.roleCode === 'TEACHER'">
          <el-descriptions-item label="所属院系">{{ currentUser.department }}</el-descriptions-item>
          <el-descriptions-item label="职称">{{ currentUser.title }}</el-descriptions-item>
          <el-descriptions-item label="指导学生数">{{ currentUser.studentCount || 0 }}</el-descriptions-item>
        </template>
        <el-descriptions-item label="邮箱">{{ currentUser.email }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ currentUser.phone }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDate(currentUser.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="最后登录">{{ formatDate(currentUser.lastLoginTime) }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 新增/编辑用户对话框 -->
    <el-dialog
      v-model="userDialogVisible"
      :title="dialogTitle"
      width="500px"
    >
      <el-form
        :model="userForm"
        :rules="userRules"
        ref="userFormRef"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" :disabled="isEdit"></el-input>
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="userForm.realName"></el-input>
        </el-form-item>
        <el-form-item label="人员类型" prop="roleId">
          <el-select v-model="userForm.roleId" placeholder="请选择人员类型" style="width: 100%" @change="handleRoleChange">
            <el-option label="学生" value="1001"></el-option>
            <el-option label="教师" value="2001"></el-option>
            <el-option label="管理员" value="3001"></el-option>
          </el-select>
        </el-form-item>
        
        <!-- 学生特有字段 -->
        <template v-if="userForm.roleId === '1001'">
          <el-form-item label="学号" prop="studentId">
            <el-input v-model="userForm.studentId" placeholder="请输入学号"></el-input>
          </el-form-item>
          <el-form-item label="专业">
            <el-select v-model="userForm.major" placeholder="请选择专业" style="width: 100%">
              <el-option label="计算机科学与技术" value="CS"></el-option>
              <el-option label="软件工程" value="SE"></el-option>
              <el-option label="电子信息工程" value="EE"></el-option>
              <el-option label="机械工程" value="ME"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="年级">
            <el-select v-model="userForm.grade" placeholder="请选择年级" style="width: 100%">
              <el-option label="2024级" value="2024"></el-option>
              <el-option label="2023级" value="2023"></el-option>
              <el-option label="2022级" value="2022"></el-option>
              <el-option label="2021级" value="2021"></el-option>
            </el-select>
          </el-form-item>
        </template>
        
        <!-- 教师特有字段 -->
        <template v-if="userForm.roleId === '2001'">
          <el-form-item label="所属院系">
            <el-input v-model="userForm.department" placeholder="请输入所属院系"></el-input>
          </el-form-item>
          <el-form-item label="职称">
            <el-select v-model="userForm.title" placeholder="请选择职称" style="width: 100%">
              <el-option label="教授" value="Professor"></el-option>
              <el-option label="副教授" value="Associate Professor"></el-option>
              <el-option label="讲师" value="Lecturer"></el-option>
              <el-option label="助教" value="Teaching Assistant"></el-option>
            </el-select>
          </el-form-item>
        </template>
        
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email"></el-input>
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone"></el-input>
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <el-input v-model="userForm.password" type="password"></el-input>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="userForm.status">
            <el-radio label="ENABLED">启用</el-radio>
            <el-radio label="DISABLED">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="userDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveUser" :loading="saving">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 导入管理员API
import { 
  getUserList, 
  createUser, 
  updateUser, 
  deleteUser as deleteApiUser, 
  batchDeleteUsers, 
  updateUserStatus 
} from '@/api/admin/users'

// 图标导入
import {
  Plus, Refresh, Search, RefreshLeft, User, Delete, Download
} from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const userList = ref([])
const selectedUsers = ref([])
const detailDialogVisible = ref(false)
const userDialogVisible = ref(false)
const isEdit = ref(false)
const currentUser = ref({})
// 是否一次性获取全部用户（true=获取全部，false=分页获取）
const fetchAllUsers = ref(true)

// 筛选表单
const filterForm = reactive({
  userType: '',
  status: '',
  keyword: ''
})

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 用户表单
const userForm = reactive({
  username: '',
  realName: '',
  roleId: '',
  email: '',
  phone: '',
  password: '',
  status: 'ENABLED',
  // 学生特有字段
  studentId: '',
  major: '',
  grade: '',
  advisorName: '',
  // 教师特有字段
  department: '',
  title: '',
  studentCount: 0
})

const userFormRef = ref()

// 表单验证规则
const userRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度为3-20个字符', trigger: 'blur' }
  ],
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' }
  ],
  roleId: [
    { required: true, message: '请选择用户类型', trigger: 'change' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

// 计算属性
const dialogTitle = computed(() => {
  return isEdit.value ? '编辑用户' : '新增用户'
})

// 方法
const refreshData = () => {
  loadUserList()
  ElMessage.success('数据已刷新')
}

const handleSearch = () => {
  pagination.currentPage = 1
  loadUserList()
}

const resetFilter = () => {
  filterForm.userType = ''
  filterForm.status = ''
  filterForm.keyword = ''
  pagination.currentPage = 1
  loadUserList()
}

const handleSelectionChange = (selection) => {
  selectedUsers.value = selection
}

const handleSizeChange = (val) => {
  pagination.pageSize = val
  loadUserList()
}

const handleCurrentChange = (val) => {
  pagination.currentPage = val
  loadUserList()
}

const loadUserList = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.currentPage,
      size: fetchAllUsers.value ? 1000000 : pagination.pageSize,
      userType: filterForm.userType,
      status: filterForm.status ? toStatusNumber(filterForm.status) : '',
      keyword: filterForm.keyword
    }

    const response = await getUserList(params)
    // 调试：打印后端返回结构，便于排查字段差异
    console.debug('getUserList response:', response)

    // 兼容后端常见返回：data.records (分页), data.list, list, 或直接数组
    let list = []
    let total = 0
    let current = pagination.currentPage
    let size = pagination.pageSize

    if (response?.data?.records) {
      list = response.data.records
      total = response.data.total ?? list.length
      current = response.data.current ?? current
      size = response.data.size ?? size
    } else if (response?.data && Array.isArray(response.data)) {
      list = response.data
      total = response.total ?? list.length
    } else if (Array.isArray(response.list)) {
      list = response.list
      total = response.total ?? list.length
    } else if (Array.isArray(response)) {
      list = response
      total = list.length
    } else if (response?.list) {
      list = response.list
      total = response.total ?? list.length
    }

    // 如果用户选择一次性获取全部，但后端仍按分页返回（pages>1），则尝试用 total 拉取全部
    if (fetchAllUsers.value && response?.data?.pages > 1 && response.data.total) {
      const fullResp = await getUserList({ ...params, page: 1, size: response.data.total })
      console.debug('getUserList full response:', fullResp)
      if (fullResp?.data?.records) {
        list = fullResp.data.records
        total = fullResp.data.total ?? list.length
        current = fullResp.data.current ?? 1
        size = fullResp.data.size ?? list.length
      } else if (Array.isArray(fullResp?.data)) {
        list = fullResp.data
        total = fullResp.total ?? list.length
      }
    }

    userList.value = (list || []).map(user => ({
      ...user,
      // 确保 status 字段为数字 0/1 格式
      status: toStatusNumber(user.status)
    }))
    
    // 调试：打印前几个用户的状 thái 转换结果
    if (userList.value.length > 0) {
      console.debug('用户状态转换示例:', 
        userList.value.slice(0, 3).map(u => ({
          id: u.id || u.userId,
          username: u.username,
          rawStatus: u.status,
          normalized: normalizeStatus(u.status)
        }))
      )
    }
    // 更新分页信息
    pagination.currentPage = fetchAllUsers.value ? 1 : (current || pagination.currentPage)
    pagination.pageSize = fetchAllUsers.value ? (list.length || pagination.pageSize) : (size || pagination.pageSize)
    pagination.total = total || (list.length || 0)
    loading.value = false
  } catch (error) {
    console.error('加载用户列表失败:', error)
    ElMessage.error('加载用户列表失败，请检查网络连接')
    loading.value = false

    // 清空数据而不是使用模拟数据
    userList.value = []
    pagination.total = 0
  }
}

const getRoleTagType = (roleCode) => {
  const typeMap = {
    'STUDENT': 'primary',
    'TEACHER': 'success',
    'ADMIN': 'warning'
  }
  return typeMap[roleCode] || 'info'
}

const getStatusTagType = (status) => {
  const s = normalizeStatus(status)
  const typeMap = {
    'ENABLED': 'success',
    'DISABLED': 'danger',
    'LOCKED': 'warning'
  }
  return typeMap[s] || 'info'
}

const getStatusText = (status) => {
  const s = normalizeStatus(status)
  const textMap = {
    'ENABLED': '启用',
    'DISABLED': '禁用',
    'LOCKED': '锁定'
  }
  return textMap[s] || '未知'
}

// 将后端或前端不同表示的状态统一为字符串标识
const normalizeStatus = (status) => {
  if (status === 1 || status === '1' || status === true) return 'ENABLED'
  if (status === 0 || status === '0' || status === false) return 'DISABLED'
  if (typeof status === 'string') {
    const up = status.toUpperCase()
    if (up === 'ENABLED' || up === 'EN') return 'ENABLED'
    if (up === 'DISABLED' || up === 'DIS') return 'DISABLED'
    if (up === 'LOCKED') return 'LOCKED'
  }
  return status
}

const toStatusNumber = (status) => {
  if (status === 1 || status === '1') return 1
  if (status === 0 || status === '0') return 0
  const s = normalizeStatus(status)
  if (s === 'ENABLED') return 1
  if (s === 'DISABLED') return 0
  return 0
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('zh-CN')
}

const getMajorName = (majorCode) => {
  const majorMap = {
    'CS': '计算机科学与技术',
    'SE': '软件工程',
    'EE': '电子信息工程',
    'ME': '机械工程'
  }
  return majorMap[majorCode] || majorCode
}

const handleRoleChange = () => {
  // 清除之前角色的特有字段
  userForm.studentId = ''
  userForm.major = ''
  userForm.grade = ''
  userForm.advisorName = ''
  userForm.department = ''
  userForm.title = ''
  userForm.studentCount = 0
}

const viewGuidedStudents = (teacher) => {
  ElMessage.info(`查看 ${teacher.realName} 指导的学生列表`)
}

const viewUser = (user) => {
  currentUser.value = user
  detailDialogVisible.value = true
}

const showAddUserDialog = () => {
  isEdit.value = false
  resetUserForm()
  userDialogVisible.value = true
}

const editUser = (user) => {
  isEdit.value = true
  Object.assign(userForm, {
    username: user.username,
    realName: user.realName,
    roleId: user.roleId || '',
    email: user.email,
    phone: user.phone,
    status: toStatusNumber(user.status), // 确保状态为数字格式
    // 学生特有字段
    studentId: user.studentId || '',
    major: user.major || '',
    grade: user.grade || '',
    advisorName: user.advisorName || '',
    // 教师特有字段
    department: user.department || '',
    title: user.title || '',
    studentCount: user.studentCount || 0
  })
  userDialogVisible.value = true
}

const deleteUser = async (user) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 ${user.realName} 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteApiUser(user.userId ?? user.id)
    ElMessage.success('删除成功')
    loadUserList()
  } catch (error) {
    console.error('删除用户失败:', error)
    ElMessage.error('删除用户失败')
    // 用户取消操作
  }
}

const batchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedUsers.value.length} 个用户吗？`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const userIds = selectedUsers.value.map(user => user.userId ?? user.id)
    await batchDeleteUsers(userIds)
    ElMessage.success('批量删除成功')
    selectedUsers.value = []
    loadUserList()
  } catch (error) {
    console.error('批量删除失败:', error)
    ElMessage.error('批量删除失败')
    // 用户取消操作
  }
}

const exportUsers = () => {
  ElMessage.info('导出功能开发中...')
}

const handleStatusChange = async (user, newStatus) => {
  // newStatus 为数字 1/0（后端约定）或可被 toStatusNumber 解析的值
  const prevStatus = newStatus === 1 || newStatus === '1' ? 0 : 1
  const userId = user.userId ?? user.id
  if (!userId) {
    ElMessage.error('用户ID缺失，无法更新状态')
    // 回退到之前的状态
    user.status = prevStatus
    return
  }

  const statusNumber = toStatusNumber(newStatus)
  try {
    await updateUserStatus(userId, statusNumber)
    ElMessage.success(`用户状态已${normalizeStatus(statusNumber) === 'ENABLED' ? '启用' : '禁用'}`)
  } catch (error) {
    console.error('状态更新失败:', error)
    ElMessage.error('状态更新失败')
    // 恢复原状态
    user.status = prevStatus
  }
}

const saveUser = async () => {
  if (!userFormRef.value) return
  
  try {
    await userFormRef.value.validate()
    saving.value = true
    
    const userData = {
      username: userForm.username,
      realName: userForm.realName,
      roleId: userForm.roleId,
      email: userForm.email,
      phone: userForm.phone,
      status: toStatusNumber(userForm.status)
    }
    
    // 添加密码（仅创建时）
    if (!isEdit.value && userForm.password) {
      userData.password = userForm.password
    }
    
    // 添加角色特定字段
    if (userForm.roleId === '1001') { // 学生
      userData.studentId = userForm.studentId
      userData.major = userForm.major
      userData.grade = userForm.grade
    } else if (userForm.roleId === '2001') { // 教师
      userData.department = userForm.department
      userData.title = userForm.title
    }
    
    if (isEdit.value) {
      await updateUser(currentUser.value.userId ?? currentUser.value.id, userData)
    } else {
      await createUser(userData)
    }
    
    ElMessage.success(`${isEdit.value ? '更新' : '创建'}成功`)
    userDialogVisible.value = false
    resetUserForm()
    loadUserList()
    saving.value = false
  } catch (error) {
    console.error('保存用户失败:', error)
    ElMessage.error(`${isEdit.value ? '更新' : '创建'}失败`)
    saving.value = false
  }
}

const resetUserForm = () => {
  Object.assign(userForm, {
    username: '',
    realName: '',
    roleId: '',
    email: '',
    phone: '',
    password: '',
    status: 'ENABLED',
    // 学生特有字段
    studentId: '',
    major: '',
    grade: '',
    advisorName: '',
    // 教师特有字段
    department: '',
    title: '',
    studentCount: 0
  })
  if (userFormRef.value) {
    userFormRef.value.resetFields()
  }
}

// 生命周期
onMounted(() => {
  loadUserList()
})

// 行主键：优先使用 id，其次 userId，最后使用 username
const rowKey = (row) => {
  return row.id ?? row.userId ?? row.username
}
</script>

<style lang="scss" scoped>
.user-management {
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

.filter-card {
  margin-bottom: 1.5rem;
  border-radius: 12px;
  
  :deep(.el-card__body) {
    padding: 1.25rem;
  }
}

.table-card {
  border-radius: 12px;
  
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
      }
      
      .table-actions {
        display: flex;
        gap: 0.75rem;
      }
    }
  }
  
  :deep(.el-card__body) {
    padding: 0;
  }
}

.pagination-container {
  padding: 1rem;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #f1f2f6;
}

.unassigned {
  color: #f56c6c;
  font-style: italic;
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
  
  .filter-card {
    :deep(.el-form) {
      .el-form-item {
        margin-bottom: 1rem;
        width: 100%;
        
        .el-input,
        .el-select {
          width: 100% !important;
        }
      }
    }
  }
  
  .table-card {
    :deep(.el-table) {
      .el-table__cell {
        padding: 8px 0;
      }
    }
  }
  
  .pagination-container {
    justify-content: center;
    
    :deep(.el-pagination) {
      .el-pagination__sizes,
      .el-pagination__jump {
        display: none;
      }
    }
  }
}
</style>