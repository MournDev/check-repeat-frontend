<template>
  <div class="paper-library">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">论文库管理</h1>
        <p class="page-desc">统一管理校内所有论文资源，支持校内查重和第三方查重</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Upload" @click="showUploadDialog">
          上传论文
        </el-button>
        <el-button :icon="Refresh" @click="refreshLibrary">
          刷新
        </el-button>
      </div>
    </div>

    <!-- 统计概览 -->
    <el-row :gutter="16" class="stats-cards">
      <el-col :xs="12" :sm="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon bg-primary">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ libraryStats.totalPapers }}</div>
              <div class="stat-label">论文总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon bg-success">
              <el-icon><Check /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ libraryStats.checkedPapers }}</div>
              <div class="stat-label">已查重</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon bg-warning">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ libraryStats.highSimilarity }}</div>
              <div class="stat-label">高重复率</div>
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
              <div class="stat-value">{{ libraryStats.avgSimilarity }}%</div>
              <div class="stat-label">平均相似度</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 筛选和搜索 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filterForm" label-width="80px" inline>
        <el-form-item label="学院">
          <el-select 
            v-model="filterForm.collegeId" 
            placeholder="请选择学院" 
            clearable 
            style="width: 180px"
            @change="handleCollegeChange"
          >
            <el-option 
              v-for="college in collegeList" 
              :key="college.value" 
              :label="college.label" 
              :value="college.value"
            >
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="专业">
          <el-select 
            v-model="filterForm.majorId" 
            placeholder="请选择专业" 
            clearable 
            style="width: 180px"
            :disabled="!filterForm.collegeId"
          >
            <el-option 
              v-for="major in filteredMajorList" 
              :key="major.value" 
              :label="major.label" 
              :value="major.value"
            >
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="年级">
          <el-select v-model="filterForm.grade" placeholder="请选择年级" clearable style="width: 120px">
            <el-option label="2024级" value="2024"></el-option>
            <el-option label="2023级" value="2023"></el-option>
            <el-option label="2022级" value="2022"></el-option>
            <el-option label="2021级" value="2021"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="查重状态">
          <el-select v-model="filterForm.checkStatus" placeholder="请选择状态" clearable style="width: 120px">
            <el-option label="未查重" value="not_checked"></el-option>
            <el-option label="校内查重" value="school_check"></el-option>
            <el-option label="第三方查重" value="third_party_check"></el-option>
            <el-option label="已完成" value="completed"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="相似度范围">
          <el-select v-model="filterForm.similarityRange" placeholder="请选择范围" clearable style="width: 120px">
            <el-option label="< 20%" value="low"></el-option>
            <el-option label="20%-50%" value="medium"></el-option>
            <el-option label="> 50%" value="high"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="filterForm.keyword"
            placeholder="论文标题/作者/关键词"
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

    <!-- 论文列表 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Files /></el-icon>
            论文列表
          </span>
          <div class="table-actions">
            <el-button 
              type="success" 
              :icon="Check" 
              :disabled="selectedPapers.length === 0"
              @click="performBatchInternalCheck"
            >
              批量校内查重
            </el-button>
            <el-button 
              type="warning" 
              :icon="MagicStick" 
              :disabled="selectedPapers.length === 0"
              @click="performBatchThirdPartyCheck"
            >
              批量第三方查重
            </el-button>
            <el-button 
              :icon="Download" 
              @click="exportLibrary"
            >
              导出数据
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="paperList"
        style="width: 100%"
        row-key="id"
        @selection-change="handleSelectionChange"
        v-loading="loading"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="paperTitle" label="论文标题" min-width="200">
          <template #default="{ row }">
            <div class="paper-title">{{ row.paperTitle }}</div>
            <div class="paper-abstract" v-if="row.paperAbstract">
              {{ row.paperAbstract }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="studentName" label="学生姓名" width="100"></el-table-column>
        <el-table-column prop="studentUsername" label="学号" width="120"></el-table-column>
        <el-table-column prop="studentMajor" label="专业" width="150">
          <template #default="{ row }">
            <el-tag size="small">{{ row.studentMajor }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="studentGrade" label="年级" width="80"></el-table-column>
        <el-table-column prop="studentCollege" label="学院" width="150"></el-table-column>
        <el-table-column prop="similarityRate" label="相似度" width="100">
          <template #default="{ row }">
            <el-tag :type="getSimilarityTagType(row.similarityRate)">
              {{ row.similarityRate }}%
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="paperStatus" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusLabelType(row.paperStatus)">
              {{ getStatusText(row.paperStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="allocationStatus" label="分配状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getAllocationStatusType(row.allocationStatus)">
              {{ getAllocationStatusText(row.allocationStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="校内查重" width="120">
          <template #default="{ row }">
            <div v-if="row.checkCompleted === 1 && row.checkSource === 'local'">
              <el-tag :type="getSimilarityTagType(row.similarityRate)">
                {{ row.similarityRate }}%
              </el-tag>
              <div class="check-time">{{ formatDate(row.checkTime) }}</div>
            </div>
            <div v-else>
              <el-tag type="info">未查重</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="第三方查重" width="120">
          <template #default="{ row }">
            <div v-if="row.checkCompleted === 1 && row.checkSource === 'third_party'">
              <el-tag :type="getSimilarityTagType(row.similarityRate)">
                {{ row.similarityRate }}%
              </el-tag>
              <div class="check-time">{{ formatDate(row.checkTime) }}</div>
            </div>
            <div v-else>
              <el-tag type="info">未查重</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="submitTime" label="提交时间" width="120">
          <template #default="{ row }">
            {{ formatDate(row.submitTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="teacherName" label="指导老师" width="120"></el-table-column>
        <el-table-column prop="wordCount" label="字数" width="100">
          <template #default="{ row }">
            {{ row.wordCount }}字
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="250">
          <template #default="{ row }">
            <el-button size="small" type="primary" text @click="viewPaper(row)">
              查看
            </el-button>
            <el-button size="small" type="info" text @click="handleDownloadPaper(row)">
              下载
            </el-button>
            <el-button size="small" type="success" text @click="performInternalCheck(row)">
              校内查重
            </el-button>
            <el-button size="small" type="warning" text @click="performThirdPartyCheck(row)">
              第三方查重
            </el-button>
            <el-button size="small" type="danger" text @click="removePaper(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
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

    <!-- 上传论文对话框 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="上传论文"
      width="600px"
    >
      <el-form
        :model="uploadForm"
        :rules="uploadRules"
        ref="uploadFormRef"
        label-width="100px"
      >
        <el-form-item label="论文标题" prop="title">
          <el-input v-model="uploadForm.title" placeholder="请输入论文标题"></el-input>
        </el-form-item>
        <el-form-item label="作者姓名" prop="author">
          <el-input v-model="uploadForm.author" placeholder="请输入作者姓名"></el-input>
        </el-form-item>
        <el-form-item label="学号" prop="studentNum">
          <el-input v-model="uploadForm.studentNum" placeholder="请输入学号"></el-input>
        </el-form-item>
        <el-form-item label="专业" prop="major">
          <el-select v-model="uploadForm.major" placeholder="请选择专业" style="width: 100%">
            <el-option label="计算机科学与技术" value="CS"></el-option>
            <el-option label="软件工程" value="SE"></el-option>
            <el-option label="电子信息工程" value="EE"></el-option>
            <el-option label="机械工程" value="ME"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="年级" prop="grade">
          <el-select v-model="uploadForm.grade" placeholder="请选择年级" style="width: 100%">
            <el-option label="2024级" value="2024"></el-option>
            <el-option label="2023级" value="2023"></el-option>
            <el-option label="2022级" value="2022"></el-option>
            <el-option label="2021级" value="2021"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="关键词" prop="keyword">
          <el-select
            v-model="uploadForm.keyword"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="请输入关键词"
            style="width: 100%"
          >
          </el-select>
        </el-form-item>
        <el-form-item label="摘要" prop="summary">
          <el-input
            v-model="uploadForm.summary"
            type="textarea"
            :rows="4"
            placeholder="请输入论文摘要"
          ></el-input>
        </el-form-item>
        <el-form-item label="论文文件" prop="file">
          <el-upload
            class="upload-demo"
            drag
            :auto-upload="false"
            :on-change="handleFileChange"
            :limit="1"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                只能上传 doc/docx/pdf 文件，且不超过 10MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item v-if="uploading">
          <el-progress :percentage="uploadProgress" stroke-width="12" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitUpload" :loading="uploading">
          上传
        </el-button>
      </template>
    </el-dialog>

    <!-- 论文详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="论文详情"
      width="800px"
    >
      <div v-if="currentPaper" class="paper-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="论文标题">{{ currentPaper.paperTitle }}</el-descriptions-item>
          <el-descriptions-item label="学生姓名">{{ currentPaper.studentName }}</el-descriptions-item>
          <el-descriptions-item label="学号">{{ currentPaper.studentUsername }}</el-descriptions-item>
          <el-descriptions-item label="专业">{{ currentPaper.studentMajor }}</el-descriptions-item>
          <el-descriptions-item label="年级">{{ currentPaper.studentGrade }}级</el-descriptions-item>
          <el-descriptions-item label="学院">{{ currentPaper.studentCollege }}</el-descriptions-item>
          <el-descriptions-item label="指导老师">{{ currentPaper.teacherName }}</el-descriptions-item>
          <el-descriptions-item label="相似度">
            <el-tag :type="getSimilarityTagType(currentPaper.similarityRate)">
              {{ currentPaper.similarityRate }}%
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="论文状态">
            <el-tag :type="getStatusLabelType(currentPaper.paperStatus)">
              {{ getStatusText(currentPaper.paperStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="分配状态">
            <el-tag :type="getAllocationStatusType(currentPaper.allocationStatus)">
              {{ getAllocationStatusText(currentPaper.allocationStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ formatDate(currentPaper.submitTime) }}</el-descriptions-item>
          <el-descriptions-item label="字数">{{ currentPaper.wordCount }}字</el-descriptions-item>
        </el-descriptions>
        
        <div class="section" v-if="currentPaper.paperAbstract">
          <h3>摘要</h3>
          <p class="summary">{{ currentPaper.paperAbstract }}</p>
        </div>
        
        <div class="section" v-if="currentPaper.checkCompleted === 1 && currentPaper.checkSource === 'local'">
          <h3>校内查重结果</h3>
          <el-tag :type="getSimilarityTagType(currentPaper.similarityRate)">
            相似度: {{ currentPaper.similarityRate }}%
          </el-tag>
          <div class="check-details">
            <p>查重时间: {{ formatDate(currentPaper.checkTime) }}</p>
            <p>查重引擎: {{ getCheckEngineText(currentPaper.checkEngineType) }}</p>
          </div>
        </div>
        
        <div class="section" v-if="currentPaper.checkCompleted === 1 && currentPaper.checkSource === 'third_party'">
          <h3>第三方查重结果</h3>
          <el-tag :type="getSimilarityTagType(currentPaper.similarityRate)">
            相似度: {{ currentPaper.similarityRate }}%
          </el-tag>
          <div class="check-details">
            <p>查重时间: {{ formatDate(currentPaper.checkTime) }}</p>
            <p>查重引擎: {{ getCheckEngineText(currentPaper.checkEngineType) }}</p>
          </div>
        </div>
        
        <div class="section" v-if="currentPaper.internalCheck">
          <h3>校内查重结果</h3>
          <el-tag :type="getSimilarityTagType(currentPaper.internalCheck.score)">
            相似度: {{ currentPaper.internalCheck.score }}%
          </el-tag>
          <div class="check-details">
            <p>查重时间: {{ formatDate(currentPaper.internalCheck.time) }}</p>
            <div v-if="(currentPaper.internalCheck.details || []).length > 0">
              <h4>相似论文:</h4>
              <ul>
                <li v-for="detail in currentPaper.internalCheck.details" :key="detail.paperId">
                  《{{ detail.title }}》 - {{ detail.author }} (相似度: {{ detail.similarity }}%)
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div class="section" v-if="currentPaper.thirdPartyCheck">
          <h3>第三方查重结果</h3>
          <el-tag :type="getSimilarityTagType(currentPaper.thirdPartyCheck.score)">
            相似度: {{ currentPaper.thirdPartyCheck.score }}%
          </el-tag>
          <p>查重时间: {{ formatDate(currentPaper.thirdPartyCheck.time) }}</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleDownloadPaper(currentPaper)">下载原文</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 导入管理员API
import { 
  getPaperList, 
  getPaperStats, 
  deletePaper as deleteApiPaper, 
  batchDeletePapers,
  internalCheck,
  thirdPartyCheck,
  batchInternalCheck,
  batchThirdPartyCheck,
  exportPapers,
  uploadPaper,
  downloadPaper
} from '@/api/admin/papers'

// 导入通用接口
import { getMajors, getColleges } from '@/api/admin/common'

// 图标导入
import {
  Upload, Refresh, Search, RefreshLeft, Document, Check, Warning,
  TrendCharts, Files, Download, MagicStick, UploadFilled
} from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const paperList = ref([])
const selectedPapers = ref([])
const uploadDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const currentPaper = ref(null)

// 统计数据
const libraryStats = ref({
  totalPapers: 1247,
  checkedPapers: 986,
  highSimilarity: 47,
  avgSimilarity: 23.5
})

// 学院和专业数据
const collegeList = ref([])
const majorList = ref([])
const filteredMajorList = computed(() => {
  // 根据选中的学院ID过滤专业
  if (!filterForm.collegeId) return []
  
  // 专业数据中包含 collegeId 字段
  return majorList.value.filter(major => major.collegeId === filterForm.collegeId)
})

// 筛选表单
const filterForm = reactive({
  collegeId: '',
  majorId: '',
  grade: '',
  checkStatus: '',
  similarityRange: '',
  keyword: ''
})

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 上传表单
const uploadForm = reactive({
  title: '',
  author: '',
  studentNum: '',
  major: '',
  grade: '',
  keyword: [],
  summary: '',
  file: null
})

const uploadFormRef = ref()

// 表单验证规则
const uploadRules = {
  title: [
    { required: true, message: '请输入论文标题', trigger: 'blur' }
  ],
  author: [
    { required: true, message: '请输入作者姓名', trigger: 'blur' }
  ],
  student: [
    { required: true, message: '请输入学号', trigger: 'blur' }
  ],
  major: [
    { required: true, message: '请选择专业', trigger: 'change' }
  ],
  grade: [
    { required: true, message: '请选择年级', trigger: 'change' }
  ],
  summary: [
    { required: true, message: '请输入论文摘要', trigger: 'blur' }
  ],
  file: [
    { required: true, message: '请上传论文文件', trigger: 'change' }
  ]
}

// 方法
const refreshLibrary = () => {
  loadPaperList()
  ElMessage.success('数据已刷新')
}

const handleSearch = () => {
  pagination.currentPage = 1
  loadPaperList()
}

const resetFilter = () => {
  filterForm.collegeId = ''
  filterForm.majorId = ''
  filterForm.grade = ''
  filterForm.checkStatus = ''
  filterForm.similarityRange = ''
  filterForm.keyword = ''
  pagination.currentPage = 1
  loadPaperList()
}

const handleSelectionChange = (selection) => {
  selectedPapers.value = selection
}

const handleSizeChange = (val) => {
  pagination.pageSize = val
  loadPaperList()
}

const handleCurrentChange = (val) => {
  pagination.currentPage = val
  loadPaperList()
}

const loadLibraryStats = async () => {
  try {
    const response = await getPaperStats()
    libraryStats.value = {
      totalPapers: response.data.totalPapers || 0,
      checkedPapers: response.data.checkedPapers || 0,
      highSimilarity: response.data.highSimilarity || 0,
      avgSimilarity: response.data.avgSimilarity || 0
    }
  } catch (error) {
    console.error('加载论文库统计失败:', error)
    ElMessage.error('加载统计数据失败')
    
    // 降级到模拟数据
    libraryStats.value = {
      totalPapers: 1247,
      checkedPapers: 986,
      highSimilarity: 47,
      avgSimilarity: 23.5
    }
  }
}

const loadPaperList = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.currentPage,
      size: pagination.pageSize,
      collegeId: filterForm.collegeId,
      majorId: filterForm.majorId,
      grade: filterForm.grade,
      checkStatus: filterForm.checkStatus,
      keyword: filterForm.keyword
    }
    
    // 添加相似度范围筛选
    if (filterForm.similarityRange) {
      switch (filterForm.similarityRange) {
        case 'low':
          params.minSimilarity = 0
          params.maxSimilarity = 20
          break
        case 'medium':
          params.minSimilarity = 20
          params.maxSimilarity = 50
          break
        case 'high':
          params.minSimilarity = 50
          params.maxSimilarity = 100
          break
      }
    }
    
    const response = await getPaperList(params)
    console.debug('loadPaperList response:', response)
    // 兼容多层嵌套与多种格式：
    // 常见形式：
    // A: { code:200, data: { records: [...], total } }
    // B: { code:200, data: { list: [...], total } }
    // C: { code:200, records: [...], total }
    // D: { code:200, list: [...], total }
    // E: { code:200, data: [...] } 或直接返回数组
    let list = []
    let total = 0
    const unwrap = (obj) => {
      if (!obj) return null
      if (Array.isArray(obj)) return { list: obj, total: obj.length }
      if (obj.records || obj.list) return { list: obj.records || obj.list, total: obj.total ?? (Array.isArray(obj.records || obj.list) ? (obj.records || obj.list).length : 0) }
      return null
    }

    // try response.data first
    let candidate = null
    if (response && response.data) candidate = unwrap(response.data) || unwrap(response.data.data) || null
    if (!candidate) candidate = unwrap(response) || unwrap(response?.data)
    if (!candidate && Array.isArray(response)) candidate = { list: response, total: response.length }
    if (candidate) {
      list = candidate.list || []
      total = candidate.total || 0
    }
    // 规范化每项，解析 keyword 字符串为数组
    const normalized = (list || []).map(normalizePaper)
    paperList.value = normalized
    pagination.total = total
    loading.value = false
  } catch (error) {
    console.error('加载论文列表失败:', error)
    ElMessage.error('加载论文列表失败')
    loading.value = false
    
    // 降级到模拟数据
    paperList.value = [
      {
        id: '1',
        title: '基于深度学习的图像识别技术研究',
        author: '张三',
        studentNum: '2024001001',
        major: 'CS',
        grade: '2024',
        advisor: '李教授',
        keyword: ['深度学习', '图像识别', '卷积神经网络'],
        summary: '本文研究了基于深度学习的图像识别技术...',
        createTime: '2024-01-15T10:30:00Z',
        fileSize: 2560,
        internalCheck: {
          score: 15.3,
          time: '2024-01-16T09:15:00Z',
          details: []
        }
      }
    ]
    pagination.total = 1
  }
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

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString('zh-CN')
}

const getSimilarityTagType = (score) => {
  if (score >= 50) return 'danger'
  if (score >= 20) return 'warning'
  return 'success'
}

const getStatusLabelType = (status) => {
  const statusMap = {
    'pending': 'info',
    'auditing': 'warning',
    'completed': 'success',
    'rejected': 'danger'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status) => {
  const statusMap = {
    'pending': '待分配',
    'checking': '待查重',
    'auditing': '待审核',
    'completed': '已通过',
    'rejected': '未通过'
  }
  return statusMap[status] || status
}

const getAllocationStatusType = (status) => {
  const statusMap = {
    'pending': 'info',
    'allocated': 'success',
    'unallocated': 'warning'
  }
  return statusMap[status] || 'info'
}

const getAllocationStatusText = (status) => {
  const statusMap = {
    'pending': '待确认',
    'confirmed': '已确认',
    'rejected': '已拒绝'
  }
  return statusMap[status] || status
}

const getCheckEngineText = (engineType) => {
  const engineMap = {
    'school': '校内查重系统',
    'third_party': '第三方查重平台'
  }
  return engineMap[engineType] || engineType
}

const normalizePaper = (p) => {
  if (!p) return p
  const np = Object.assign({}, p)
  try {
    // 兼容字段名 keyword 或 keywords
    const raw = np.keyword || np.keywords
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw)
        np.keywords = Array.isArray(parsed) ? parsed : [String(parsed)]
      } catch (e) {
        const cleaned = raw.replace(/\\+/g, '').replace(/^\s*"|"\s*$/g, '').replace(/^\[|\]$/g, '')
        np.keywords = cleaned ? cleaned.split(',').map(k => k.trim().replace(/^\s*"|"\s*$/g, '')) : []
      }
    } else if (Array.isArray(raw)) {
      np.keywords = raw
    } else {
      np.keywords = []
    }
  } catch (err) {
    np.keywords = []
  }

  if (np.internalCheck && !Array.isArray(np.internalCheck.details)) np.internalCheck.details = np.internalCheck.details || []
  if (np.thirdPartyCheck && !Array.isArray(np.thirdPartyCheck.details)) np.thirdPartyCheck.details = np.thirdPartyCheck.details || []
  return np
}

const showUploadDialog = () => {
  resetUploadForm()
  uploadDialogVisible.value = true
}

const handleFileChange = (file) => {
  uploadForm.file = file.raw
}

const submitUpload = async () => {
  if (!uploadFormRef.value) return
  
  try {
    await uploadFormRef.value.validate()
    uploading.value = true
    // 构建 FormData
    const formData = new FormData()
    formData.append('title', uploadForm.title)
    formData.append('author', uploadForm.author)
    formData.append('studentNum', uploadForm.studentNum)
    formData.append('major', uploadForm.major)
    formData.append('grade', uploadForm.grade)
    formData.append('summary', uploadForm.summary)
    if (uploadForm.keyword && uploadForm.keyword.length) {
      formData.append('keyword', JSON.stringify(uploadForm.keyword))
    }
    if (uploadForm.file) {
      formData.append('file', uploadForm.file)
    }

    try {
      const res = await uploadPaper(formData, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total > 0) {
            uploadProgress.value = Math.round((progressEvent.loaded / progressEvent.total) * 100)
          }
        }
      })
      ElMessage.success(res.message || '论文上传成功')
      uploadDialogVisible.value = false
      resetUploadForm()
      uploadProgress.value = 0
      await loadPaperList()
    } catch (err) {
      console.error('上传失败', err)
      ElMessage.error(err.message || '论文上传失败')
    } finally {
      uploading.value = false
    }
  } catch (error) {
    console.log('表单验证失败')
  }
}

const resetUploadForm = () => {
  Object.assign(uploadForm, {
    title: '',
    author: '',
    studentNum: '',
    major: '',
    grade: '',
    keyword: [],
    summary: '',
    file: null
  })
  if (uploadFormRef.value) {
    uploadFormRef.value.resetFields()
  }
}

const viewPaper = (paper) => {
  currentPaper.value = normalizePaper(paper)
  detailDialogVisible.value = true
}

const performInternalCheck = async (paper) => {
  try {
    await ElMessageBox.confirm(
      `确定要对论文《${paper.paperTitle}》进行校内查重吗？`,
      '校内查重确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    ElMessage.info('正在进行校内查重...')
    try {
      const res = await internalCheck(paper.id)
      ElMessage.success(res.message || '校内查重完成')
      await loadPaperList()
    } catch (err) {
      console.error('校内查重失败', err)
      ElMessage.error(err.message || '校内查重失败')
    }
  } catch (error) {
    // 用户取消操作
  }
}

const performThirdPartyCheck = async (paper) => {
  try {
    await ElMessageBox.confirm(
      `确定要对论文《${paper.paperTitle}》进行第三方查重吗？`,
      '第三方查重确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    ElMessage.info('正在调用第三方查重服务...')
    try {
      const res = await thirdPartyCheck(paper.id)
      ElMessage.success(res.message || '第三方查重完成')
      await loadPaperList()
    } catch (err) {
      console.error('第三方查重失败', err)
      ElMessage.error(err.message || '第三方查重失败')
    }
  } catch (error) {
    // 用户取消操作
  }
}

const performBatchInternalCheck = () => {
  if (selectedPapers.value.length === 0) {
    ElMessage.warning('请先选择论文')
    return
  }
  ElMessage.info(`开始对 ${selectedPapers.value.length} 篇论文进行校内查重`)
  const ids = selectedPapers.value.map(p => p.id)
  batchInternalCheck(ids).then(res => {
    ElMessage.success(res.message || '批量校内查重请求已发送')
    loadPaperList()
  }).catch(err => {
    console.error('批量校内查重失败', err)
    ElMessage.error(err.message || '批量校内查重失败')
  })
}

const performBatchThirdPartyCheck = () => {
  if (selectedPapers.value.length === 0) {
    ElMessage.warning('请先选择论文')
    return
  }
  ElMessage.info(`开始对 ${selectedPapers.value.length} 篇论文进行第三方查重`)
  const ids = selectedPapers.value.map(p => p.id)
  batchThirdPartyCheck(ids).then(res => {
    ElMessage.success(res.message || '批量第三方查重请求已发送')
    loadPaperList()
  }).catch(err => {
    console.error('批量第三方查重失败', err)
    ElMessage.error(err.message || '批量第三方查重失败')
  })
}

const removePaper = async (paper) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除论文《${paper.paperTitle}》吗？此操作不可恢复`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    const res = await deleteApiPaper(paper.id)
    ElMessage.success(res.message || '论文删除成功')
    await loadPaperList()
  } catch (error) {
    // 用户取消操作
  }
}

const handleDownloadPaper = async (paper) => {
  if (!paper || !paper.id) {
    ElMessage.warning('未选择论文或论文不存在')
    return
  }
  try {
    ElMessage.info('开始下载论文...')
    const res = await downloadPaper(paper.id)
    // request 在 responseType=blob 时返回的是 axios response
    const blob = res.data || res
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    // 尝试从响应头取文件名
    const disposition = res.headers && res.headers['content-disposition']
    let filename = `paper_${paper.id}.pdf`
    if (disposition) {
      const match = disposition.match(/filename\*=UTF-8''(.+)|filename="?([^";]+)"?/) 
      if (match) filename = decodeURIComponent(match[1] || match[2])
    }
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
    ElMessage.success('下载已开始')
  } catch (err) {
    console.error('下载失败', err)
    ElMessage.error(err.message || '下载失败')
  }
}

const exportLibrary = () => {
  // 导出当前筛选条件下的数据
  const params = {
    collegeId: filterForm.collegeId,
    majorId: filterForm.majorId,
    grade: filterForm.grade,
    checkStatus: filterForm.checkStatus,
    keyword: filterForm.keyword
  }
  exportPapers(params).then(res => {
    // request 在 responseType=blob 时返回 axios response
    const blob = res.data || res
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `papers_export_${new Date().toISOString().slice(0,10)}.xlsx`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出已开始')
  }).catch(err => {
    console.error('导出失败', err)
    ElMessage.error(err.message || '导出失败')
  })
}

// 获取学院列表
const loadColleges = async () => {
  try {
    const res = await getColleges()
    if (res.code === 200) {
      collegeList.value = res.data
    } else {
      ElMessage.error('获取学院列表失败：' + res.message)
    }
  } catch (error) {
    ElMessage.error('获取学院列表失败')
    console.error('获取学院列表失败：', error)
  }
}

// 获取专业列表
const loadMajors = async () => {
  try {
    const res = await getMajors()
    if (res.code === 200) {
      majorList.value = res.data
    } else {
      ElMessage.error('获取专业列表失败：' + res.message)
    }
  } catch (error) {
    ElMessage.error('获取专业列表失败')
    console.error('获取专业列表失败：', error)
  }
}

// 学院选择变化处理
const handleCollegeChange = () => {
  // 清空已选择的专业
  filterForm.majorName = ''
}

// 生命周期
onMounted(async () => {
  await Promise.all([
    loadColleges(),
    loadMajors(),
    loadPaperList(),
    loadLibraryStats()
  ])
})
</script>

<style lang="scss" scoped>
.paper-library {
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

.paper-title {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.paper-keyword {
  .el-tag {
    margin-right: 0.25rem;
    margin-bottom: 0.25rem;
  }
}

.paper-abstract {
  font-size: 0.85rem;
  color: #7f8c8d;
  margin-top: 0.25rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

/* 修复模板中使用的 .paper-keywords 类，并美化标签 */
.paper-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;

  .el-tag {
    background: #f5f7fa;
    color: #34495e;
    border-radius: 6px;
    padding: 2px 8px;
    font-size: 12px;
    line-height: 20px;
  }
}

.check-time {
  font-size: 0.75rem;
  color: #7f8c8d;
  margin-top: 0.25rem;
}

.pagination-container {
  padding: 1rem;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #f1f2f6;
}

.paper-detail {
  .section {
    margin: 1.5rem 0;
    
    h3 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
      font-size: 1.1rem;
    }
    
    .paper-keyword {
      .el-tag {
        margin-right: 0.5rem;
        margin-bottom: 0.5rem;
      }
    }
    
    .summary {
      line-height: 1.6;
      color: #5a6c7d;
      text-align: justify;
    }
    
    .check-details {
      margin-top: 1rem;
      
      ul {
        margin: 0.5rem 0;
        padding-left: 1.5rem;
        
        li {
          margin-bottom: 0.25rem;
          color: #5a6c7d;
        }
      }
    }
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