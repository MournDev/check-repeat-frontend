<template>
  <div class="review-workflow">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">审核工作流配置</h1>
          <p class="page-subtitle">配置论文审核的工作流程，包括审核步骤和审批人设置</p>
        </div>
      </div>
    </div>

    <!-- 工作流配置 -->
    <el-card shadow="never" class="workflow-card">
      <el-form
        :model="workflowForm"
        :rules="workflowRules"
        ref="workflowFormRef"
        label-width="120px"
      >
        <el-form-item label="工作流名称" prop="name">
          <el-input
            v-model="workflowForm.name"
            placeholder="请输入工作流名称"
            maxlength="50"
            show-word-limit
            :disabled="isLoading"
          />
        </el-form-item>

        <el-form-item label="工作流描述" prop="description">
          <el-input
            v-model="workflowForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入工作流描述"
            maxlength="200"
            show-word-limit
            :disabled="isLoading"
          />
        </el-form-item>

        <el-form-item label="审核步骤">
          <div class="workflow-steps">
            <el-button
              type="primary"
              :icon="Plus"
              @click="addStep"
              :disabled="isLoading"
            >
              添加审核步骤
            </el-button>

            <div class="steps-container" v-if="workflowForm.steps.length > 0">
              <div
                v-for="(step, index) in workflowForm.steps"
                :key="step.id"
                class="step-item"
              >
                <div class="step-header">
                  <div class="step-info">
                    <span class="step-number">{{ index + 1 }}</span>
                    <el-input
                      v-model="step.name"
                      placeholder="步骤名称"
                      maxlength="30"
                      show-word-limit
                      size="small"
                      :disabled="isLoading"
                    />
                  </div>
                  <div class="step-actions">
                    <el-button
                      size="small"
                      :icon="ArrowUp"
                      @click="moveStepUp(index)"
                      :disabled="isLoading || index === 0"
                    />
                    <el-button
                      size="small"
                      :icon="ArrowDown"
                      @click="moveStepDown(index)"
                      :disabled="isLoading || index === workflowForm.steps.length - 1"
                    />
                    <el-button
                      size="small"
                      type="danger"
                      :icon="Delete"
                      @click="removeStep(index)"
                      :disabled="isLoading"
                    />
                  </div>
                </div>

                <div class="step-content">
                  <el-form-item label="审批人" class="step-form-item">
                    <el-select
                      v-model="step.approvers"
                      multiple
                      placeholder="请选择审批人"
                      :disabled="isLoading"
                    >
                      <el-option
                        v-for="teacher in teachers"
                        :key="teacher.id"
                        :label="teacher.name"
                        :value="teacher.id"
                      />
                    </el-select>
                  </el-form-item>

                  <el-form-item label="审批方式" class="step-form-item">
                    <el-radio-group v-model="step.approvalType" :disabled="isLoading">
                      <el-radio label="all">全部审批</el-radio>
                      <el-radio label="any">任意审批</el-radio>
                    </el-radio-group>
                  </el-form-item>

                  <el-form-item label="超时时间" class="step-form-item">
                    <el-input-number
                      v-model="step.timeout"
                      :min="0"
                      :max="30"
                      :step="1"
                      :disabled="isLoading"
                    />
                    <span class="unit">天</span>
                  </el-form-item>
                </div>
              </div>
            </div>

            <div v-else class="empty-steps">
              <el-empty description="暂无审核步骤">
                <el-button type="primary" @click="addStep">
                  添加第一个审核步骤
                </el-button>
              </el-empty>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="启用状态">
          <el-switch
            v-model="workflowForm.enabled"
            active-text="启用"
            inactive-text="禁用"
            :disabled="isLoading"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="saveWorkflow" :loading="isLoading">
            保存配置
          </el-button>
          <el-button @click="resetForm" :disabled="isLoading">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// 图标导入
import {
  Plus, Delete, ArrowUp, ArrowDown
} from '@element-plus/icons-vue'

// API导入
import {
  getReviewWorkflow,
  updateReviewWorkflow,
  getTeachers
} from '@/api/teacher'

// 响应式数据
const isLoading = ref(false)
const workflowForm = ref({
  id: 1,
  name: '',
  description: '',
  steps: [],
  enabled: true
})
const workflowFormRef = ref(null)
const teachers = ref([])

// 表单验证规则
const workflowRules = {
  name: [
    { required: true, message: '请输入工作流名称', trigger: 'blur' },
    { max: 50, message: '名称不能超过50个字符', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '描述不能超过200个字符', trigger: 'blur' }
  ]
}

// 方法
const loadWorkflow = async () => {
  isLoading.value = true
  try {
    // 获取工作流配置
    const response = await getReviewWorkflow()
    if (response.success) {
      const data = response.data
      workflowForm.value = {
        id: data.id || 1,
        name: data.name || '',
        description: data.description || '',
        steps: data.steps || [],
        enabled: data.enabled !== false
      }
    } else {
      ElMessage.error('加载工作流配置失败')
    }

    // 获取教师列表
    const teachersResponse = await getTeachers()
    if (teachersResponse.success) {
      teachers.value = teachersResponse.data
    } else {
      ElMessage.error('加载教师列表失败')
    }
  } catch (error) {
    console.error('加载工作流配置失败:', error)
    ElMessage.error('加载工作流配置失败')
  } finally {
    isLoading.value = false
  }
}

const saveWorkflow = async () => {
  if (!workflowFormRef.value) return

  isLoading.value = true
  try {
    await workflowFormRef.value.validate(async (valid) => {
      if (valid) {
        const response = await updateReviewWorkflow(workflowForm.value)

        if (response.success) {
          ElMessage.success('保存工作流配置成功')
        } else {
          ElMessage.error('保存工作流配置失败')
        }
      }
    })
  } catch (error) {
    console.error('保存工作流配置失败:', error)
    ElMessage.error('保存工作流配置失败')
  } finally {
    isLoading.value = false
  }
}

const resetForm = () => {
  loadWorkflow()
}

const addStep = () => {
  workflowForm.value.steps.push({
    id: Date.now(),
    name: `审核步骤 ${workflowForm.value.steps.length + 1}`,
    approvers: [],
    approvalType: 'all',
    timeout: 7
  })
}

const removeStep = (index) => {
  workflowForm.value.steps.splice(index, 1)
}

const moveStepUp = (index) => {
  if (index > 0) {
    const temp = workflowForm.value.steps[index]
    workflowForm.value.steps[index] = workflowForm.value.steps[index - 1]
    workflowForm.value.steps[index - 1] = temp
  }
}

const moveStepDown = (index) => {
  if (index < workflowForm.value.steps.length - 1) {
    const temp = workflowForm.value.steps[index]
    workflowForm.value.steps[index] = workflowForm.value.steps[index + 1]
    workflowForm.value.steps[index + 1] = temp
  }
}

// 生命周期
onMounted(() => {
  loadWorkflow()
})
</script>

<style lang="scss" scoped>
.review-workflow {
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
  
  .workflow-card {
    .workflow-steps {
      margin-top: 16px;
      
      .steps-container {
        margin-top: 16px;
        
        .step-item {
          border: 1px solid #ebeef5;
          border-radius: 11px;
          padding: 16px;
          margin-bottom: 16px;
          
          .step-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            
            .step-info {
              display: flex;
              align-items: center;
              gap: 12px;
              flex: 1;
              
              .step-number {
                width: 24px;
                height: 24px;
                background-color: #0066cc;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 17px;
                font-weight: 400;
              }
              
              .el-input {
                flex: 1;
              }
            }
            
            .step-actions {
              display: flex;
              gap: 8px;
            }
          }
          
          .step-content {
            margin-left: 36px;
            
            .step-form-item {
              margin-bottom: 12px;
            }
            
            .unit {
              margin-left: 8px;
              color: #606266;
            }
          }
        }
      }
      
      .empty-steps {
        padding: 40px 0;
      }
    }
  }
}
</style>