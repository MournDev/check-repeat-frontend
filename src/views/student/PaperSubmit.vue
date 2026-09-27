<template>
  <div class="paper-submit-container">
    <div class="paper-submit-card">
      <div class="card-header">
        <h3 class="card-title">论文提交</h3>
        <p class="card-subtitle">请填写以下信息并上传论文文件</p>
      </div>
      
      <div class="submit-steps">
        <div 
          v-for="(step, index) in steps" 
          :key="index"
          class="step"
          :class="{
            'step-active': index < activeStep,
            'step-current': index === activeStep,
            'step-pending': index > activeStep
          }"
        >
          <div class="step-number">{{ index + 1 }}</div>
          <div class="step-content">
            <div class="step-title">{{ step.title }}</div>
          </div>
        </div>
      </div>

      <!-- 第一步：基本信息 -->
      <div v-if="activeStep === 0" class="step-content">
        <el-form ref="basicFormRef" :model="paperForm" :rules="paperRules" class="paper-form">
          <div class="form-group">
            <label class="form-label">学科领域</label>
            <el-tree-select v-model="paperForm.subjectCode" :data="subjectTree" placeholder="请选择学科领域" :props="treeProps"
              check-strictly :only-leaf-select="true" class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">论文标题</label>
            <el-input v-model="paperForm.paperTitle" placeholder="请输入论文标题" maxlength="200" class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">所属学院</label>
            <el-select v-model="paperForm.collegeId" placeholder="请选择学院" @change="handleCollegeChange"
              :loading="collegeLoading" class="form-control">
              <el-option v-for="college in collegeList" :key="college.value" :label="college.label"
                :value="college.value"></el-option>
            </el-select>
          </div>
          <div class="form-group">
            <label class="form-label">专业</label>
            <el-select v-model="paperForm.majorId" placeholder="请选择专业" :disabled="!paperForm.collegeId"
              :loading="majorLoading" class="form-control">
              <el-option v-for="major in majorList" :key="major.value" :label="major.label" :value="major.value"></el-option>
            </el-select>
          </div>
          <div class="form-group">
            <label class="form-label">论文类型</label>
            <el-select v-model="paperForm.paperType" placeholder="请选择论文类型" class="form-control">
              <el-option v-for="item in paperTypeDictList" :key="item.dictValue" :label="item.dictLabel"
                :value="item.dictValue">
              </el-option>
            </el-select>
          </div>
          <div class="form-group">
            <label class="form-label">论文摘要</label>
            <el-input v-model="paperForm.paperAbstract" type="textarea" :rows="5" placeholder="请输入论文摘要（不超过500字）"
              maxlength="500" show-word-limit class="form-control" />
          </div>
        </el-form>
      </div>

      <!-- 第二步：文件上传 -->
      <div v-if="activeStep === 1" class="step-content">
        <el-form ref="uploadFormRef" :model="paperForm" :rules="paperRules" class="paper-form">
          <div class="form-group">
            <label class="form-label">论文附件</label>
            <div class="upload-area" @drop="handleDrop" @dragover.prevent @dragenter.prevent @dragleave.prevent>
              <el-upload class="upload-file" :action="uploadUrl" :headers="uploadHeaders" :data="uploadData"
                :file-list="fileList" :before-upload="beforeUpload" :on-success="onUploadSuccess" :on-error="onUploadError"
                :on-remove="handleFileRemove" :limit="1" accept=".pdf,.doc,.docx" name="file"
                :on-progress="onUploadProgress" :show-file-list="true">
                <div class="upload-content">
                  <el-icon class="upload-icon"><Upload /></el-icon>
                  <div class="upload-text">
                    <p>点击或拖拽文件到此处上传</p>
                    <p class="upload-tip">支持PDF、Word格式，单个文件不超过50MB</p>
                  </div>
                </div>
              </el-upload>
              <div v-if="uploadProgress > 0 && uploadProgress < 100" class="upload-progress">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
                </div>
              </div>
              <div v-if="paperForm.file" class="upload-success">
                <el-icon color="#10b981"><Check /></el-icon>
                <span style="margin-left: 8px; color: #10b981;">文件已上传</span>
              </div>
            </div>
          </div>
        </el-form>
      </div>

      <!-- 第三步：提交确认 -->
      <div v-if="activeStep === 2" class="step-content">
        <div class="confirm-content">
          <h4>提交信息确认</h4>
          <div class="confirm-details">
            <div class="detail-item">
              <span class="detail-label">学科领域</span>
              <span class="detail-value">{{ getSubjectName(paperForm.subjectCode) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">论文标题</span>
              <span class="detail-value">{{ paperForm.paperTitle }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">所属学院</span>
              <span class="detail-value">{{ getCollegeName(paperForm.collegeId) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">专业</span>
              <span class="detail-value">{{ getMajorName(paperForm.majorId) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">论文类型</span>
              <span class="detail-value">{{ getPaperTypeName(paperForm.paperType) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">论文摘要</span>
              <span class="detail-value">{{ paperForm.paperAbstract }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">论文附件</span>
              <span class="detail-value">{{ fileList.length > 0 ? fileList[0].name : '未上传' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="step-actions">
        <button v-if="activeStep > 0" class="btn btn-secondary" @click="prevStep" :disabled="submitLoading">
          上一步
        </button>
        <button v-if="activeStep < 2" class="btn btn-primary" @click="nextStep" :disabled="!canProceed || submitLoading">
          下一步
        </button>
        <button v-if="activeStep === 2" class="btn btn-primary" @click="submitPaper" :disabled="submitLoading">
          <span v-if="!submitLoading">提交论文</span>
          <span v-else>提交中...</span>
        </button>
        <button class="btn btn-text" @click="resetForm" :disabled="submitLoading">
          重置
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getAllColleges, getMajorsByCollegeId } from '@/api/user'
import { uploadPaper, resubmitAfterWithdraw, resubmitAfterRevision, getMajorList } from '@/api/student'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check, Upload } from '@element-plus/icons-vue'
import SparkMD5 from 'spark-md5'
import { getDictDataByType, getSubjectFieldTree } from '@/api/user.js'


const route = useRoute()
const router = useRouter()

const userStore = useUserStore()
const basicFormRef = ref(null)
const uploadFormRef = ref(null)
const submitLoading = ref(false)
const fileList = ref([])
const paperId = ref('') // 上传成功后的文件 ID
const fileMd5 = ref('') // 文件 MD5 值
const loginUserId = ref('') // Long 类型，后端已改为 Long
const uploadProgress = ref(0) // 上传进度
const uploadStatus = ref('') // 上传状态

// 分步表单相关
const activeStep = ref(0)
const steps = ref([
  { title: '基本信息' },
  { title: '文件上传' },
  { title: '提交确认' }
])

// 撤回后重新提交相关
const isResubmitMode = ref(false)
const resubmitPaperId = ref('')

// 学院和专业相关
const collegeList = ref([])
const majorList = ref([])
const paperTypeDictList = ref([]); // 论文类型字典列表
const collegeLoading = ref(false)
const majorLoading = ref(false)
const subjectTree = ref([]); // 学科领域树形结构

const treeProps = {
  label: 'label',
  value: 'value',
  children: 'children',
}
// 上传配置
const uploadUrl = import.meta.env.VITE_API_BASE_URL + '/api/v1/file/upload'
const uploadHeaders = computed(() => ({
  Authorization: `${userStore.token}`
}))

const uploadData = computed(() => ({
  fileMd5: fileMd5.value,
  userId: loginUserId.value
}))

// 论文表单
const paperForm = ref({
  subjectCode: '',
  paperTitle: '',
  collegeId: '',
  majorId: '',
  paperType: '',
  paperAbstract: '',
  file: '' // 存储文件ID
})

// 是否可以进入下一步
const canProceed = computed(() => {
  if (activeStep.value === 0) {
    // 第一步：检查基本信息是否填写完整
    return paperForm.value.subjectCode && 
           paperForm.value.paperTitle && 
           paperForm.value.collegeId && 
           paperForm.value.majorId && 
           paperForm.value.paperType && 
           paperForm.value.paperAbstract
  } else if (activeStep.value === 1) {
    // 第二步：检查文件是否上传成功
    return paperForm.value.file
  }
  return true
})

// 专业列表（从接口获取）
const getMajors = async () => {
  const res = await getMajorList()
  majorList.value = res.data
}

// 表单校验规则
const paperRules = {
  subjectCode: [{ required: true, message: '请选择学科领域', trigger: 'change' }],
  paperTitle: [{ required: true, message: '请输入论文标题', trigger: 'blur' }],
  collegeId: [{ required: true, message: '请选择所属学院', trigger: 'change' }],
  majorId: [{ required: true, message: '请选择专业', trigger: 'change' }],
  paperType: [{ required: true, message: '请选择论文类型', trigger: 'change' }],
  paperAbstract: [{ required: true, message: '请输入论文摘要', trigger: 'blur' }, { max: 500, message: '摘要不超过500字', trigger: 'blur' }],
  file: [{
    required: true, message: '请上传论文附件', trigger: ['change', 'blur'],
    // 自定义校验器：检查文件列表是否有有效文件
    validator: (rule, value, callback) => {
      if (value && value.trim()) { // 检查 fileId 是否存在
        callback(); // 校验通过
      } else {
        callback(new Error('请先上传论文附件')); // 校验失败
      }
    }
  }]
}

onMounted(async () => {
  // 确保 userStore.token 存在
  if (userStore.token) {
    await getColleges()
    // 获取论文类型字典数据
    try {
      const res = await getDictDataByType('paper_type');
      const subjectRes = await getSubjectFieldTree('subject_field');
      subjectTree.value = subjectRes.data;
      paperTypeDictList.value = res.data;
    } catch (err) {
      console.error('获取论文类型字典失败：', err);
    }
    if (userStore.userInfo?.userId) {
      loginUserId.value = userStore.userInfo.userId
    }
    
    // 检查是否是撤回后重新提交模式
    checkResubmitMode();
  } else {
    // 等待一段时间后再尝试
    setTimeout(async () => {
      if (userStore.token) {
        await getColleges()
        // 获取论文类型字典数据
        try {
          const res = await getDictDataByType('paper_type');
          const subjectRes = await getSubjectFieldTree('subject_field');
          subjectTree.value = subjectRes.data;
          paperTypeDictList.value = res.data;
        } catch (err) {
          console.error('获取论文类型字典失败：', err);
        }
        if (userStore.userInfo?.userId) {
          loginUserId.value = userStore.userInfo.userId
        }
        
        // 检查是否是撤回后重新提交模式
        checkResubmitMode();
      } else {
        ElMessage.error('登录状态未初始化，请刷新页面')
      }
    }, 500)
  }
})

// 获取所有学院
const getColleges = async () => {
  try {
    collegeLoading.value = true
    const res = await getAllColleges()
    if (res.code === 200) {
      collegeList.value = res.data
    } else {
      ElMessage.error('获取学院列表失败：' + res.message)
    }
  } catch (error) {
    ElMessage.error('获取学院列表失败')
    console.error('获取学院列表失败：', error)
  } finally {
    collegeLoading.value = false
  }
}

// 学院选择变化时获取对应专业
const handleCollegeChange = async (collegeId) => {
  // 清空已选择的专业
  paperForm.value.majorId = ''
  majorList.value = []

  if (!collegeId) return

  try {
    majorLoading.value = true
    const params = {
      collegeId: collegeId
    }
    const res = await getMajorsByCollegeId(params)
    if (res.code === 200) {
      majorList.value = res.data
    } else {
      ElMessage.error('获取专业列表失败：' + res.message)
    }
  } catch (error) {
    ElMessage.error('获取专业列表失败')
    console.error('获取专业列表失败：', error)
  } finally {
    majorLoading.value = false
  }
}

// 计算文件MD5（用于完整性校验）
const calculateFileMd5 = (file) => {
  return new Promise((resolve) => {
    const fileReader = new FileReader()
    const spark = new SparkMD5.ArrayBuffer()
    fileReader.onload = (e) => {
      spark.append(e.target.result)
      resolve(spark.end())
    }
    fileReader.readAsArrayBuffer(file)
  })
}

// 上传前校验（大小、类型、MD5）
const beforeUpload = async (file) => {
  // 类型校验
  const isAccept = file.type === 'application/pdf' || file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  if (!isAccept) {
    ElMessage.error('仅支持PDF、Word格式文件')
    return false
  }
  // 大小校验（50MB）
  const isLt50M = file.size / 1024 / 1024 < 50
  if (!isLt50M) {
    ElMessage.error('文件大小不能超过50MB')
    return false
  }
  // 计算MD5
  const md5 = await calculateFileMd5(file)
  fileMd5.value = md5
  return true
}

// 上传成功回调
const onUploadSuccess = (response, file, fileList) => {
  if (response.code === 200) {
    const fileId = response.data.fileId
    if (!fileId) {
      ElMessage.error('文件上传异常：未返回 fileId');
      return;
    }
    paperId.value = fileId
    paperForm.value.file = fileId
    // 关键：手动触发 file 字段的校验，更新表单状态
    if (uploadFormRef.value) {
      uploadFormRef.value.validateField('file');
    }
    ElMessage.success('文件上传成功')
  } else {
    ElMessage.error('文件上传失败：' + response.message)
    paperForm.value.file = ''; // 上传失败清空文件列表
    paperId.value = ''; // 清空 fileId
    fileList.value = [];
  }
}

// 文件移除处理
const handleFileRemove = () => {
  paperForm.value.file = ''
  paperId.value = ''
  fileMd5.value = ''
  fileList.value = []
  uploadProgress.value = 0
  uploadStatus.value = ''

  // 手动触发表单验证更新
  if (uploadFormRef.value) {
    uploadFormRef.value.validateField('file')
  }
}

// 上传进度处理
const onUploadProgress = (event, file, fileList) => {
  uploadProgress.value = Math.round((event.percent || 0) * 100)
  uploadStatus.value = ''
}

// 上传失败回调
const onUploadError = (error) => {
  ElMessage.error('文件上传失败，请重试')
  console.error('上传失败：', error)
  uploadStatus.value = 'exception'
}

// 拖拽上传处理
const handleDrop = (event) => {
  event.preventDefault()
  const files = event.dataTransfer.files
  if (files.length > 0) {
    // 处理文件上传逻辑
    const file = files[0]
    beforeUpload(file).then(valid => {
      if (valid) {
        // 这里可以手动触发上传
      }
    })
  }
}

// 检查是否是撤回后重新提交模式
const checkResubmitMode = () => {
  const action = route.query.action;
  const paperIdParam = route.query.paperId;

  if ((action === 'resubmit-after-withdraw' || action === 'resubmit') && paperIdParam) {
    isResubmitMode.value = true;
    resubmitPaperId.value = paperIdParam;

    // 显示提示信息
    ElMessageBox.alert(
      '您正在对已撤回的论文进行重新提交。请修改论文内容后重新上传并提交。',
      '重新提交模式',
      {
        confirmButtonText: '确定',
        type: 'info'
      }
    );
  } else if (action === 'revision' && paperIdParam) {
    isResubmitMode.value = true;
    resubmitPaperId.value = paperIdParam;

    // 显示提示信息
    ElMessageBox.alert(
      '您正在根据审核意见修改论文。请修改论文内容后重新上传并提交。',
      '修改重提模式',
      {
        confirmButtonText: '确定',
        type: 'warning'
      }
    );
  }
}

// 下一步
const nextStep = () => {
  if (activeStep.value < 2) {
    activeStep.value++
  }
}

// 上一步
const prevStep = () => {
  if (activeStep.value > 0) {
    activeStep.value--
  }
}

// 获取学科名称
const getSubjectName = (subjectCode) => {
  if (!subjectCode) return ''
  const findSubject = (tree, code) => {
    for (const item of tree) {
      if (item.value === code) {
        return item.label
      }
      if (item.children && item.children.length > 0) {
        const result = findSubject(item.children, code)
        if (result) {
          return result
        }
      }
    }
    return ''
  }
  return findSubject(subjectTree.value, subjectCode)
}

// 获取学院名称
const getCollegeName = (collegeId) => {
  if (!collegeId) return ''
  const college = collegeList.value.find(item => item.value === collegeId)
  return college ? college.label : ''
}

// 获取专业名称
const getMajorName = (majorId) => {
  if (!majorId) return ''
  const major = majorList.value.find(item => item.value === majorId)
  return major ? major.label : ''
}

// 获取论文类型名称
const getPaperTypeName = (paperType) => {
  if (!paperType) return ''
  const type = paperTypeDictList.value.find(item => item.dictValue === paperType)
  return type ? type.dictLabel : ''
}

// 提交论文
const submitPaper = async () => {
  try {
    // 表单校验
    let valid = true
    
    // 校验基本信息
    if (basicFormRef.value) {
      const basicValid = await basicFormRef.value.validate()
      if (!basicValid) {
        valid = false
      }
    }
    
    // 校验文件上传
    if (uploadFormRef.value) {
      const uploadValid = await uploadFormRef.value.validate()
      if (!uploadValid) {
        valid = false
      }
    }
    
    if (!valid) {
      return
    }
    submitLoading.value = true
    // 构建提交参数（含 MD5 值）
    const submitParams = {
      subjectCode: paperForm.value.subjectCode,
      paperTitle: paperForm.value.paperTitle,
      collegeId: paperForm.value.collegeId,
      majorId: paperForm.value.majorId,
      paperType: paperForm.value.paperType,
      paperAbstract: paperForm.value.paperAbstract,
      fileId: paperId.value,
      fileMd5: fileMd5.value
    }
        
    let res;
    // 判断是否是撤回后重新提交模式
    if (isResubmitMode.value && resubmitPaperId.value) {
      const action = route.query.action;
      if (action === 'revision') {
        // 审核意见修改后重新提交
        res = await resubmitAfterRevision(resubmitPaperId.value, submitParams);
      } else {
        // 撤回后重新提交
        res = await resubmitAfterWithdraw(resubmitPaperId.value, submitParams);
      }
          
      if (res.code === 200) {
        ElMessage.success('重新提交成功！论文已进入审核流程');
        // 跳转到我的论文页面
        setTimeout(() => {
          router.push('/student/my-papers');
        }, 1000);
      } else {
        ElMessage.error('重新提交失败：' + res.message);
      }
    } else {
      // 正常提交
      res = await uploadPaper(submitParams)
      if (res.code === 200) {
        ElMessage.success('论文提交成功，系统正在自动分配指导老师')
        // 后端已异步自动分配指导老师，无需前端单独调用
        // 跳转到我的论文页面
        setTimeout(() => {
          router.push('/student/my-papers');
        }, 1000);
      }
    }
  } catch (error) {
    ElMessage.error('论文提交失败：' + (error.message || '未知错误'))
    console.error('提交失败：', error)
  } finally {
    submitLoading.value = false
  }
}

// 重置表单
const resetForm = () => {
  if (basicFormRef.value) {
    basicFormRef.value.resetFields()
  }
  if (uploadFormRef.value) {
    uploadFormRef.value.resetFields()
  }
  fileList.value = []
  paperId.value = ''
  fileMd5.value = ''
  paperForm.value.file = ''
  uploadProgress.value = 0
  uploadStatus.value = ''
  activeStep.value = 0
}
</script>

<style lang="scss" scoped>
// 论文提交页面样式
.paper-submit-container {
  min-height: 100vh;
  background: #f5f5f7; // Slate-50
  padding: 24px 0;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.paper-submit-card {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  overflow: hidden;
  transition: all 0.2s ease;
  
  &:hover {
    /* box-shadow removed */
    border-color: #cbd5e1;
  }

  .card-header {
    background: #0066cc;
    color: white;
    padding: 24px 32px;
    text-align: center;

    .card-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .card-subtitle {
      font-size: 1rem;
      opacity: 0.9;
      margin: 0;
    }
  }
}

// 步骤条
.submit-steps {
  display: flex;
  gap: 32px;
  padding: 32px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 24px;
    left: 32px;
    right: 32px;
    height: 2px;
    background: #e2e8f0;
    z-index: 0;
  }
  
  .step {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    z-index: 1;
    
    .step-number {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 12px;
      transition: all 0.2s ease;
    }
    
    .step-content {
      .step-title {
        font-size: 17px;
        font-weight: 600;
        color: #64748b;
        transition: all 0.2s ease;
      }
    }
    
    &.step-active {
      .step-number {
        background: #10b981;
        color: white;
      }
      .step-title {
        color: #0f172a;
        font-weight: 600;
      }
    }
    
    &.step-current {
      .step-number {
        background: #0ea5e9;
        color: white;
        /* box-shadow removed */
      }
      .step-title {
        color: #0f172a;
        font-weight: 600;
      }
    }
    
    &.step-pending {
      .step-number {
        background: #f1f5f9;
        color: #64748b;
      }
      .step-title {
        color: #94a3b8;
      }
    }
  }
}

.step-content {
  padding: 0 32px 32px;
}

// 表单样式
.paper-form {
  max-width: 100%;
  
  .form-group {
    margin-bottom: 24px;
    
    .form-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 8px;
    }
    
    .form-control {
      width: 100%;
      transition: all 0.2s ease;
      
      &:hover {
        border-color: #cbd5e1;
      }
      
      &:focus {
        border-color: #0ea5e9;
        box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
      }
    }
  }
}

// 上传区域
.upload-area {
  border: 2px dashed #e2e8f0;
  border-radius: 18px;
  padding: 40px;
  text-align: center;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #0ea5e9;
    background: #f5f5f7;
  }
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  
  .upload-icon {
    font-size: 48px;
    color: #0ea5e9;
  }
  
  .upload-text {
    p {
      margin: 0;
      color: #0f172a;
      font-size: 1rem;
      font-weight: 600;
    }
    .upload-tip {
      margin-top: 8px;
      color: #64748b;
      font-size: 0.875rem;
    }
  }
}

// 上传进度
.upload-progress {
  margin-top: 16px;
  
  .progress-bar {
    height: 6px;
    background: #e2e8f0;
    border-radius: 3px;
    overflow: hidden;
    
    .progress-fill {
      height: 100%;
      background: #0ea5e9;
      border-radius: 3px;
      transition: width 0.3s ease;
    }
  }
}

.upload-success {
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

// 确认内容
.confirm-content {
  background: #f5f5f7;
  border-radius: 18px;
  padding: 24px;
  
  h4 {
    margin-top: 0;
    color: #0f172a;
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 20px;
  }
  
  .confirm-details {
    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 16px;
      background: #ffffff;
      border-radius: 11px;
      margin-bottom: 12px;
      transition: all 0.2s ease;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      &:hover {
        /* box-shadow removed */
      }
      
      .detail-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: #64748b;
        min-width: 120px;
      }
      
      .detail-value {
        font-size: 0.875rem;
        color: #0f172a;
        flex: 1;
        text-align: right;
      }
    }
  }
}

// 操作按钮
.step-actions {
  padding: 24px 32px;
  background: #f5f5f7;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

// 响应式设计
@media (max-width: 768px) {
  .paper-submit-container {
    padding: 16px;
  }
  
  .paper-submit-card {
    margin: 0;
  }
  
  .card-header {
    padding: 20px;
    
    .card-title {
      font-size: 1.25rem;
    }
  }
  
  .submit-steps {
    padding: 20px;
    gap: 16px;
    
    .step {
      .step-number {
        width: 40px;
        height: 40px;
        font-size: 17px;
      }
      
      .step-title {
        font-size: 12px;
      }
    }
  }
  
  .step-content {
    padding: 0 20px 20px;
  }
  
  .paper-form {
    .form-group {
      margin-bottom: 20px;
    }
  }
  
  .upload-area {
    padding: 32px;
  }
  
  .confirm-content {
    padding: 20px;
    
    .detail-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
      
      .detail-value {
        text-align: left;
        width: 100%;
      }
    }
  }
  
  .step-actions {
    padding: 20px;
    flex-direction: column;
    
    .btn {
      width: 100%;
      justify-content: center;
    }
  }
}
</style>