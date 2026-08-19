<template>
  <el-card class="paper-submit-card">
    <h3 class="card-title">论文提交</h3>
    <el-form :model="paperForm" :rules="paperRules" ref="paperFormRef" label-width="100px" class="paper-form">
      <!-- 论文基础信息 -->
      <el-form-item label="学科领域" prop="subjectCode">
        <el-tree-select v-model="paperForm.subjectCode" :data="subjectTree" placeholder="请选择学科领域" :props="treeProps"
          check-strictly :only-leaf-select="true" style="width: 100%;" />
      </el-form-item>
      <el-form-item label="论文标题" prop="paperTitle">
        <el-input v-model="paperForm.paperTitle" placeholder="请输入论文标题" maxlength="200" />
      </el-form-item>
      <el-form-item label="所属学院" prop="collegeId">
        <el-select v-model="paperForm.collegeId" placeholder="请选择学院" @change="handleCollegeChange"
          :loading="collegeLoading">
          <el-option v-for="college in collegeList" :key="college.value" :label="college.label"
            :value="college.value"></el-option>
          <el-option v-for="college in collegeList" :key="college.value" :label="college.label" :value="college.value"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="专业" prop="majorId">
        <el-select v-model="paperForm.majorId" placeholder="请选择专业" :disabled="!paperForm.collegeId"
          :loading="majorLoading">
          <el-option v-for="major in majorList" :key="major.value" :label="major.label" :value="major.value"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="论文类型" prop="paperType">
        <el-select v-model="paperForm.paperType" placeholder="请选择论文类型">
          <el-option v-for="item in paperTypeDictList" :key="item.dictValue" :label="item.dictLabel"
            :value="item.dictValue">
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="论文摘要" prop="paperAbstract">
        <el-input v-model="paperForm.paperAbstract" type="textarea" :rows="5" placeholder="请输入论文摘要（不超过500字）"
          maxlength="500" />
      </el-form-item>

      <!-- 论文附件上传 -->
      <el-form-item label="论文附件" prop="file">
        <el-upload class="upload-file" :action="uploadUrl" :headers="uploadHeaders" :data="uploadData"
          :file-list="fileList" :before-upload="beforeUpload" :on-success="onUploadSuccess" :on-error="onUploadError"
          :on-remove="handleFileRemove" :limit="1" accept=".pdf,.doc,.docx" name="file">
          <el-button type="primary" icon="Upload">选择文件</el-button>
          <div class="upload-tip">支持PDF、Word格式，单个文件不超过50MB</div>
        </el-upload>
        <div v-if="paperForm.file" class="upload-success">
          <el-icon color="#67c23a">
            <Check />
          </el-icon>
          <span style="margin-left: 5px; color: #67c23a;">文件已上传</span>
        </div>
      </el-form-item>

      <!-- 提交按钮 -->
      <el-form-item>
        <el-button type="primary" @click="submitPaper" :loading="submitLoading">提交论文</el-button>
        <el-button @click="resetForm" style="margin-left: 10px">重置</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getAllColleges, getMajorsByCollegeId } from '@/api/user'
import { uploadPaper, resubmitAfterWithdraw } from '@/api/student'
import { ElMessage, ElLoading, ElMessageBox } from 'element-plus'
import { Check } from '@element-plus/icons-vue'
import SparkMD5 from 'spark-md5'
import { getDictDataByType, getSubjectFieldTree } from '@/api/user.js'
import { autoAssign } from '@/api/student.js'

const route = useRoute()
const router = useRouter()

const userStore = useUserStore()
const paperFormRef = ref(null)
const submitLoading = ref(false)
const fileList = ref([])
const paperId = ref('') // 上传成功后的文件 ID
const fileMd5 = ref('') // 文件 MD5 值
const loginUserId = ref('') // Long 类型，后端已改为 Long

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
  getColleges()
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
    console.log('用户 ID 已设置:', loginUserId.value)
  }
  
  // 检查是否是撤回后重新提交模式
  checkResubmitMode();
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
  console.log('文件MD5:', md5)
  console.log('上传参数:', uploadData.value)
  return true
}

// 上传成功回调
const onUploadSuccess = (response, file, fileList) => {
  console.log('上传成功回调 - 完整 response:', response);
  console.log('上传成功回调 - response.data:', response.data);
  if (response.code === 200) {
    const fileId = response.data.fileId
    if (!fileId) {
      ElMessage.error('文件上传异常：未返回 fileId');
      return;
    }
    console.log('解析到的 fileId:', fileId); // 现在会显示正确值
    paperId.value = fileId
    paperForm.value.file = fileId
    // 关键：手动触发 file 字段的校验，更新表单状态
    if (paperFormRef.value) {
      paperFormRef.value.validateField('file');
    }
    ElMessage.success('文件上传成功')
    console.log('文件上传成功，fileId:', paperId.value); // 查看控制台是否有值
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

  // 手动触发表单验证更新
  if (paperFormRef.value) {
    paperFormRef.value.validateField('file')
  }
}

// 上传失败回调
const onUploadError = (error) => {
  ElMessage.error('文件上传失败，请重试')
  console.error('上传失败：', error)
}

// 检查是否是撤回后重新提交模式
const checkResubmitMode = () => {
  const action = route.query.action;
  const paperIdParam = route.query.paperId;
  
  if (action === 'resubmit-after-withdraw' && paperIdParam) {
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
    
    console.log('进入撤回后重新提交模式，论文 ID:', resubmitPaperId.value);
  }
}

const assignTeacherAutomatically = async (submittedPaperId) => {
  try {
    console.log('开始分配导师，paperId:', submittedPaperId)
    const loading = ElLoading.service({
      lock: true,
      text: '正在自动分配指导老师...',
      background: 'rgba(0, 0, 0, 0.7)',
    })

    const result = await autoAssign(submittedPaperId)

    loading.close()

    if (result.code === 200) {
      const teacherInfo = result.data
      let successMessage = '指导老师分配成功'

      if (teacherInfo && teacherInfo.teacherName) {
        successMessage += `，分配的老师：${teacherInfo.teacherName}`
        if (teacherInfo.teacherTitle) {
          successMessage += `（${teacherInfo.teacherTitle}）`
        }
      }

      ElMessage.success(successMessage)
      return { success: true, teacherInfo }
    } else {
      ElMessage.warning('自动分配指导老师失败：' + result.message)
      return { success: false, message: result.message }
    }
  } catch (error) {
    ElMessage.error('分配导师服务异常：' + (error.message || '未知错误'))
    console.error('分配导师失败：', error)
    return { success: false, message: error.message }
  }
}

// 提交论文
const submitPaper = async () => {
  try {
    // 表单校验
    const valid = await paperFormRef.value.validate()
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
    console.log('提交参数:', submitParams)
        
    let res;
    // 判断是否是撤回后重新提交模式
    if (isResubmitMode.value && resubmitPaperId.value) {
      // 撤回后重新提交
      res = await resubmitAfterWithdraw(resubmitPaperId.value, submitParams);
      console.log('撤回后重新提交响应数据:', res.data)
          
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
      console.log('论文提交完整响应:', res)
      console.log('论文提交响应数据:', res.data)
      if (res.code === 200) {
        const submittedPaperId = res.data.id
        ElMessage.success('附件上传成功')
        const assignResult = await assignTeacherAutomatically(String(submittedPaperId))
        if (assignResult.success) {
          ElMessage.success('论文提交完成，指导老师已分配')
        } else {
          ElMessage.warning('论文提交完成，但指导老师分配失败，请联系管理员')
        }
      }
    }
    // 重置表单
    resetForm()
  } catch (error) {
    ElMessage.error('论文提交失败：' + (error.message || '未知错误'))
    console.error('提交失败：', error)
  } finally {
    submitLoading.value = false
  }
}

// 重置表单
const resetForm = () => {
  paperFormRef.value.resetFields()
  fileList.value = []
  paperId.value = ''
  fileMd5.value = ''
  paperForm.value.file = ''
}
</script>

<style lang="scss" scoped>
$gray-color: #666;

.paper-submit-card {
  margin-bottom: 1.5rem;

  .card-title {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: #1f2937;
  }
}

.paper-form {
  max-width: 800px;
}

.upload-file {
  margin-bottom: 1rem;

  .upload-tip {
    margin-top: 0.5rem;
    color: $gray-color;
    font-size: 0.9rem;
  }
}
</style>