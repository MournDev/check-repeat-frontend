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
              :loading="majorLoading" @change="handleMajorChange" class="form-control">
              <el-option v-for="major in majorList" :key="major.value" :label="major.label" :value="major.value"></el-option>
            </el-select>
          </div>
          <!-- 学科领域排在专业之后：候选要靠专业收窄，选完专业才有得选。
               门类与二级学科**都可以选**（学生只知道大类时不必硬凑二级），
               门类在后面缀「（大类）」以便一眼区分层级。 -->
          <div class="form-group">
            <label class="form-label">学科领域</label>
            <el-tree-select v-model="paperForm.subjectCode" :data="subjectTree" :placeholder="subjectPlaceholder"
              :props="treeProps" :loading="subjectLoading" check-strictly filterable :disabled="!paperForm.majorId"
              class="form-control" />
          </div>
          <div class="form-group">
            <label class="form-label">论文类型</label>
            <!-- 选项来自共享模块（后端 PaperTypeEnum），不再是本页自己拉的一份字典 -->
            <el-select v-model="paperForm.paperType" placeholder="请选择论文类型" class="form-control"
              :loading="!paperTypesLoaded">
              <el-option v-for="item in paperTypeOptions" :key="item.code" :label="item.label" :value="item.code">
              </el-option>
            </el-select>
            <!-- 加载失败时选项是空的，不给出口的话用户只会看到"下拉点开空白" -->
            <div v-if="paperTypeLoadFailed" class="form-tip-error">
              论文类型加载失败，<a href="javascript:;" @click="retryLoadPaperTypes">点击重试</a>
            </div>
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
              <el-upload ref="uploadRef" class="upload-file" :action="uploadUrl" :headers="uploadHeaders" :data="uploadData"
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
                <!-- 进度条改用 el-progress：颜色由 --el-color-primary（映射 --app-color-primary）统一 -->
                <el-progress :percentage="uploadProgress" :show-text="false" :stroke-width="6" />
              </div>
              <div v-if="paperForm.file" class="upload-success">
                <el-icon class="upload-success-icon"><Check /></el-icon>
                <span class="upload-success-text">文件已上传</span>
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
              <span class="detail-value">{{ getPaperTypeText(paperForm.paperType) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">论文摘要</span>
              <span class="detail-value">{{ paperForm.paperAbstract }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">论文附件</span>
              <span class="detail-value">{{ paperForm.file ? (uploadedFileName || '已上传') : '未上传' }}</span>
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
import { getSubjectFieldTree } from '@/api/user.js'
import {
  loadPaperTypes,
  getPaperTypeText,
  usePaperTypeOptions,
  usePaperTypesLoaded,
} from '@/utils/paperType.js'


const route = useRoute()
const router = useRouter()

const userStore = useUserStore()
const basicFormRef = ref(null)
const uploadFormRef = ref(null)
const uploadRef = ref(null)
const submitLoading = ref(false)
const fileList = ref([])
// 上传成功的原始文件名——确认页展示用。fileList 经 :file-list 单向绑定不回写，
// 不能作为「是否已上传」的判据（上传成功后仍为空数组，确认页会误显「未上传」）
const uploadedFileName = ref('')
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
// 论文类型选项来自共享模块（全前端唯一一份，见 utils/paperType.js），本页不再自持
const paperTypeOptions = usePaperTypeOptions()
const paperTypesLoaded = usePaperTypesLoaded()
const paperTypeLoadFailed = ref(false) // 只用于本页显示重试入口
const collegeLoading = ref(false)
const majorLoading = ref(false)
const subjectTree = ref([]); // 学科领域树形结构
const subjectLoading = ref(false)

const treeProps = {
  label: 'label',
  value: 'value',
  children: 'children',
}
// 上传配置
const uploadUrl = import.meta.env.VITE_API_BASE_URL + '/api/file/upload'
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

// 占位文案跟着专业走：专业没选时提示「先选专业」，选完后还挂着同一句会让人
// 以为选择器没生效（实际是候选已就绪、只是没选而已）。
const subjectPlaceholder = computed(() => paperForm.value.majorId
  ? '请选择学科领域（一级门类或二级学科）'
  : '请先选择专业，再选择学科领域')

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

// 拉论文类型选项。
// 只负责触发共享模块的加载与失败置位；不要再弹 ElMessage ——
// 全局 axios 拦截器已经弹过，这里再弹就是双份提示。
const initPaperTypes = async () => {
  try {
    await loadPaperTypes()
    paperTypeLoadFailed.value = false
  } catch (err) {
    console.error('获取论文类型选项失败：', err)
    paperTypeLoadFailed.value = true
  }
}

const retryLoadPaperTypes = async () => {
  paperTypeLoadFailed.value = false
  try {
    await loadPaperTypes(true)
  } catch (err) {
    paperTypeLoadFailed.value = true
  }
}

// 页面初始化。两处分支（token 就绪 / 等 500ms）走同一套逻辑。
const initPage = async () => {
  await getColleges()
  // 学科树与论文类型是两件互不相干的事，必须分开处理：
  // 改造前两者挤在同一个 try 里，字典一失败学科树也就跟着不加载了。
  // 此时还没选专业，先给整棵树；选完专业由 handleMajorChange 重拉成收窄后的
  await loadSubjectTree()
  await initPaperTypes()
  if (userStore.userInfo?.userId) {
    loginUserId.value = userStore.userInfo.userId
  }
  // 检查是否是撤回后重新提交模式
  checkResubmitMode()
}

onMounted(async () => {
  // 确保 userStore.token 存在
  if (userStore.token) {
    await initPage()
  } else {
    // 等待一段时间后再尝试
    setTimeout(async () => {
      if (userStore.token) {
        await initPage()
      } else {
        ElMessage.error('登录状态未初始化，请刷新页面')
      }
    }, 500)
  }
})

// 加载学科领域树。
// 传 majorId = 只列该专业映射到的分支；不传 = 整棵树。
// 专业没配映射时（哲学/历史学/体育类等）后端会**回退成整棵树**，所以这里永远是
// 「有得选」，不会因为收窄没命中而把选择器变空。
// 后端在回滚场景下没有 level 字段，装饰层会自动退化成不加后缀（见 decorateLevel）。
const loadSubjectTree = async (majorId) => {
  subjectLoading.value = true
  try {
    const res = await getSubjectFieldTree(majorId ? { majorId } : {})
    if (res.code === 200) {
      subjectTree.value = decorateLevel(res.data || [])
    } else {
      subjectTree.value = []
      ElMessage.error('获取学科领域失败：' + res.message)
    }
  } catch (error) {
    subjectTree.value = []
    ElMessage.error('获取学科领域失败')
    console.error('获取学科领域失败：', error)
  } finally {
    subjectLoading.value = false
  }
}

// 门类与二级学科都能选（学生只知道大类时不必硬凑二级），给门类后缀「（大类）」区分层级。
// level 缺失（旧后端）时不加后缀，而不是当成二级 —— 避免回滚后一半节点冒出奇怪的标注。
const decorateLevel = (nodes) => nodes.map(node => ({
  ...node,
  label: node.level === 1 ? `${node.label}（大类）` : node.label,
  children: node.children && node.children.length ? decorateLevel(node.children) : node.children
}))

// 换专业要把已选学科清掉：旧学科很可能不在新专业的候选里，
// 留着就会提交出一个「专业与学科对不上」的组合（症状是阈值解析拿不到学科维度的规则）
const handleMajorChange = async (majorId) => {
  paperForm.value.subjectCode = ''
  await loadSubjectTree(majorId)
}

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
  // 专业没了，依附于它的学科候选也就不成立了，一并清掉（学科选择器同时被禁用）
  paperForm.value.subjectCode = ''
  subjectTree.value = []

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

// 上传成功回调（第三参数 uploadFiles 为 el-upload 内部列表，不能遮蔽外部 fileList ref）
const onUploadSuccess = (response, file, uploadFiles) => {
  if (response.code === 200) {
    const fileId = response.data.fileId
    if (!fileId) {
      ElMessage.error('文件上传异常：未返回 fileId');
      return;
    }
    paperId.value = fileId
    paperForm.value.file = fileId
    uploadedFileName.value = file.name
    // 关键：手动触发 file 字段的校验，更新表单状态
    if (uploadFormRef.value) {
      uploadFormRef.value.validateField('file');
    }
    ElMessage.success('文件上传成功')
  } else {
    ElMessage.error('文件上传失败：' + response.message)
    paperForm.value.file = ''; // 上传失败清空文件列表
    paperId.value = ''; // 清空 fileId
    uploadedFileName.value = '';
    fileList.value = [];
  }
}

// 文件移除处理
const handleFileRemove = () => {
  paperForm.value.file = ''
  paperId.value = ''
  fileMd5.value = ''
  uploadedFileName.value = ''
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
const handleDrop = async (event) => {
  event.preventDefault()
  const files = event.dataTransfer.files
  if (files.length > 0) {
    const file = files[0]
    const valid = await beforeUpload(file)
    if (valid) {
      // 拖拽入口不在 el-upload 内部，需手动交给组件并触发上传
      uploadRef.value?.handleStart(file)
      uploadRef.value?.submit()
    }
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
  uploadedFileName.value = ''
  uploadProgress.value = 0
  uploadStatus.value = ''
  activeStep.value = 0
}
</script>

<style lang="scss" scoped>
// 论文提交页面样式
.paper-submit-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.paper-submit-card {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  background: var(--app-color-card-bg);
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-lg);
  overflow: hidden;

  .card-header {
    background: var(--app-color-card-bg);
    color: var(--app-color-ink);
    padding: var(--app-space-6) var(--app-space-8);
    border-bottom: 1px solid var(--app-color-divider);
    text-align: center;

    .card-title {
      margin: 0 0 var(--app-space-1);
      font-family: var(--app-font-family);
      font-size: var(--app-fs-title);
      font-weight: 600;
    }

    .card-subtitle {
      font-size: var(--app-fs-caption);
      color: var(--app-color-text-muted);
      opacity: 1;
      margin: 0;
    }
  }
}

// 步骤条
.submit-steps {
  display: flex;
  gap: var(--app-space-6);
  padding: var(--app-space-8);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 24px;
    left: 32px;
    right: 32px;
    height: 2px;
    background: var(--app-color-border);
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
      width: 44px;
      height: 44px;
      border-radius: var(--app-radius-pill);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--app-fs-body);
      font-weight: 600;
      margin-bottom: var(--app-space-3);
    }
    
    .step-content {
      .step-title {
        font-size: var(--app-fs-caption);
        font-weight: 600;
        color: var(--app-color-text-muted);
      }
    }
    
    &.step-active {
      .step-number {
        background: var(--app-color-success);
        color: var(--app-color-on-primary);
      }
      .step-title {
        color: var(--app-color-ink);
        font-weight: 600;
      }
    }
    
    &.step-current {
      .step-number {
        background: var(--app-color-primary);
        color: var(--app-color-on-primary);
      }
      .step-title {
        color: var(--app-color-ink);
        font-weight: 600;
      }
    }
    
    &.step-pending {
      .step-number {
        background: var(--app-color-fill);
        color: var(--app-color-text-muted);
      }
      .step-title {
        color: var(--app-color-text-muted);
      }
    }
  }
}

.step-content {
  padding: 0 var(--app-space-8) var(--app-space-8);
}

// 表单样式
.paper-form {
  max-width: 100%;
  
  .form-group {
    margin-bottom: var(--app-space-6);
    
    .form-label {
      display: block;
      font-size: var(--app-fs-caption);
      font-weight: 600;
      color: var(--app-color-ink);
      margin-bottom: var(--app-space-2);
    }

    /* 选项拉取失败时的行内提示。比再弹一次 ElMessage 好：
       全局拦截器已经弹过一次，这里只需要一个不会消失的出口。 */
    .form-tip-error {
      margin-top: 6px;
      font-size: var(--app-fs-meta);
      color: var(--app-color-danger);

      a {
        color: var(--app-color-primary);
        text-decoration: underline;
      }
    }

    .form-control {
      width: 100%;

      :deep(.el-input__wrapper),
      :deep(.el-textarea__inner),
      :deep(.el-select__wrapper) {
        border-radius: var(--app-radius-md);
        font-size: var(--app-fs-caption);
      }

      :deep(.el-input__wrapper.is-focus),
      :deep(.el-select__wrapper.is-focused) {
        box-shadow: 0 0 0 1px var(--app-color-primary) inset,
          0 0 0 3px rgba(var(--app-color-primary-rgb), 0.1);
      }
    }
  }
}

// 上传区域
.upload-area {
  border: 1px dashed var(--app-color-border);
  border-radius: var(--app-radius-lg);
  padding: var(--app-space-8);
  background: var(--app-color-fill-light);
  text-align: center;
  transition: all var(--app-transition-normal);
  
  &:hover {
    border-color: var(--app-color-primary);
    background: var(--app-color-info-bg);
  }
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--app-space-3);
  
  .upload-icon {
    font-size: var(--app-fs-display);
    color: var(--app-color-primary);
  }
  
  .upload-text {
    p {
      margin: 0;
      color: var(--app-color-ink);
      font-size: var(--app-fs-body);
      font-weight: 600;
    }
    .upload-tip {
      margin-top: var(--app-space-2);
      color: var(--app-color-text-muted);
      font-size: var(--app-fs-caption);
    }
  }
}

// 上传进度：进度条本体由 el-progress 渲染，这里只留容器间距
.upload-progress {
  margin-top: var(--app-space-3);
}

.upload-success {
  margin-top: var(--app-space-4);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--app-space-2);

  .upload-success-icon,
  .upload-success-text {
    color: var(--app-color-success);
  }
}

// 确认内容
.confirm-content {
  background: var(--app-color-fill);
  border-radius: var(--app-radius-lg);
  padding: var(--app-space-6);
  
  h4 {
    margin-top: 0;
    color: var(--app-color-ink);
    font-family: var(--app-font-family);
    font-size: var(--app-fs-body);
    font-weight: 600;
    margin-bottom: var(--app-space-4);
  }
  
  .confirm-details {
    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: var(--app-space-3) var(--app-space-4);
      background: var(--app-color-card-bg);
      border: 1px solid var(--app-color-border);
      border-radius: var(--app-radius-md);
      margin-bottom: var(--app-space-2);

      &:last-child {
        margin-bottom: 0;
      }
      
      .detail-label {
        font-size: var(--app-fs-caption);
        font-weight: 600;
        color: var(--app-color-text-muted);
        min-width: 104px;
      }
      
      .detail-value {
        font-size: var(--app-fs-caption);
        color: var(--app-color-ink);
        flex: 1;
        text-align: right;
      }
    }
  }
}

// 操作按钮
.step-actions {
  padding: var(--app-space-4) var(--app-space-8);
  background: var(--app-color-card-bg);
  border-top: 1px solid var(--app-color-divider);
  display: flex;
  justify-content: flex-end;
  gap: var(--app-space-3);

  .btn {
    padding: 9px 22px;
    border-radius: var(--app-radius-pill);
    font-size: var(--app-fs-caption);
    font-weight: 500;
  }

  .btn-secondary {
    background: var(--app-color-card-bg);
    border: 1px solid var(--app-color-border);
    color: var(--app-color-ink);

    &:hover {
      background: var(--app-color-fill);
    }
  }

  .btn-primary {
    background: var(--app-color-primary);
    color: var(--app-color-on-primary);

    &:hover {
      background: var(--app-color-primary-hover);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .btn-text {
    color: var(--app-color-text-muted);

    &:hover {
      color: var(--app-color-ink);
      background: var(--app-color-fill);
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .paper-submit-container {
    padding: var(--app-space-3);
  }
  
  .paper-submit-card {
    margin: 0;

    .card-header {
      padding: var(--app-space-4);
      
      .card-title {
        font-size: var(--app-fs-body);
      }
    }
  }
  
  .submit-steps {
    padding: var(--app-space-4);
    gap: var(--app-space-3);
    
    .step {
      .step-number {
        width: 36px;
        height: 36px;
        font-size: var(--app-fs-caption);
      }
      
      .step-content {
        .step-title {
          font-size: var(--app-fs-meta);
        }
      }
    }
  }
  
  .step-content {
    padding: 0 var(--app-space-4) var(--app-space-4);
  }
  
  .paper-form {
    .form-group {
      margin-bottom: var(--app-space-4);
    }
  }
  
  .upload-area {
    padding: var(--app-space-6);
  }
  
  .confirm-content {
    padding: var(--app-space-4);
    
    .detail-item {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--app-space-2);
      
      .detail-value {
        text-align: left;
        width: 100%;
      }
    }
  }
  
  .step-actions {
    padding: var(--app-space-4);
    flex-direction: column;
    
    .btn {
      width: 100%;
      justify-content: center;
    }
  }
}
</style>
