<template>
  <div class="my-papers-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">我的论文</h1>
          <p class="page-desc">管理您的所有论文提交记录</p>
        </div>
        <div class="header-actions">
          <button class="primary-button" @click="goToPaperSubmit">
            <el-icon><UploadFilled /></el-icon>
            <span>提交新论文</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 筛选和搜索 -->
    <div class="filter-card">
      <div class="filter-form">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">论文状态</label>
            <select 
              v-model="filterForm.paperStatus" 
              class="form-select"
              @change="fetchPapers"
            >
              <option value="">全部状态</option>
              <option 
                v-for="item in paperStatusDictList" 
                :key="item.dictValue" 
                :value="item.dictValue"
              >
                {{ item.dictLabel }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">提交时间</label>
            <el-date-picker
              v-model="filterForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              @change="fetchPapers"
              class="form-control"
            />
          </div>
          <div class="form-group">
            <label class="form-label">论文标题</label>
            <div class="search-input">
              <el-icon class="search-icon"><Search /></el-icon>
              <el-input
                v-model="filterForm.paperTitle"
                placeholder="搜索论文标题..."
                @keyup.enter="fetchPapers"
                class="input-field"
              />
            </div>
          </div>
          <div class="form-actions">
            <button class="primary-button" @click="fetchPapers">
              <el-icon><Search /></el-icon>
              <span>搜索</span>
            </button>
            <button class="secondary-button" @click="handleReset">
              <el-icon><Refresh /></el-icon>
              <span>重置</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 论文列表 -->
    <div class="papers-card">
      <div class="card-header">
        <div class="card-title">
          <el-icon><Document /></el-icon>
          <span>论文列表</span>
        </div>
        <div class="header-actions-group">
          <!-- 批量操作工具栏 -->
          <div v-if="selectedPaperIds.length > 0" class="batch-toolbar">
            <span class="selected-count">
              已选择 {{ selectedPaperIds.length }} 篇论文
            </span>
            <button class="primary-button" @click="batchDownload">
              <el-icon><Download /></el-icon>
              <span>批量下载</span>
            </button>
            <button class="success-button" @click="batchCheckPlagiarism">
              <el-icon><Document /></el-icon>
              <span>批量查重</span>
            </button>
            <button class="danger-button" @click="batchDelete">
              <el-icon><Delete /></el-icon>
              <span>批量删除</span>
            </button>
            <div class="divider"></div>
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="selectAll" 
                @change="handleSelectAll"
                class="checkbox-input"
              />
              <span class="checkbox-text">全选</span>
            </label>
          </div>
          <span v-else class="card-extra"> 共 {{ total }} 篇论文 </span>
        </div>
      </div>

      <div class="papers-list">
        <div
          v-for="paper in papers"
          :key="paper.id"
          class="paper-item"
          :class="{ 'paper-active': paper.id === activePaperId, 'paper-selected': selectedPaperIds.includes(paper.id) }"
        >
          <!-- 批量选择 -->
          <div class="paper-select">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="selectedPaperIds" 
                :value="paper.id" 
                @change="handlePaperSelect"
                class="checkbox-input"
              />
            </label>
          </div>
          <div class="paper-main">
            <div class="paper-header">
              <h4 class="paper-title">{{ paper.paperTitle }}</h4>
              <div class="paper-actions">
                <button
                  v-if="paper.paperStatus === 'rejected'"
                  class="action-button primary"
                  @click="submitRevision(paper.id)"
                >
                  <el-icon><Upload /></el-icon>
                  <span>提交修改</span>
                </button>
                <!-- 需要修改状态：重新提交 -->
                <button
                  v-if="paper.paperStatus === 'revision_needed'"
                  class="action-button primary"
                  @click="resubmitAfterRevision(paper)"
                >
                  <el-icon><Upload /></el-icon>
                  <span>重新提交</span>
                </button>
                <!-- 重新编辑已撤回论文 -->
                <button
                  v-if="paper.paperStatus === 'withdrawn'"
                  class="action-button primary"
                  @click="resubmitPaper(paper)"
                >
                  <el-icon><EditPen /></el-icon>
                  <span>重新编辑</span>
                </button>
                <!-- 撤回申请 -->
                <button
                  v-if="['pending', 'checking', 'auditing', 'revision_needed'].includes(paper.paperStatus)"
                  class="action-button warning"
                  @click="withdrawPaper(paper)"
                >
                  <el-icon><RefreshLeft /></el-icon>
                  <span>申请撤回</span>
                </button>
                <!-- 申请修改 -->
                <button
                  v-if="paper.paperStatus === 'completed'"
                  class="action-button info"
                  @click="requestModification(paper)"
                >
                  <el-icon><EditPen /></el-icon>
                  <span>申请修改</span>
                </button>
                <button class="action-button" @click="viewPaperDetail(paper)">
                  <el-icon><View /></el-icon>
                  <span>查看详情</span>
                </button>
                <button class="action-button" @click="downloadPaper(paper)">
                  <el-icon><Download /></el-icon>
                  <span>下载</span>
                </button>
                <!-- 查重功能按钮 -->
                <button
                  v-if="paper.paperStatus === 'completed' || paper.similarityRate != null"
                  class="action-button"
                  @click="viewPlagiarismReport(paper.id)"
                >
                  <el-icon><Document /></el-icon>
                  <span>查重报告</span>
                </button>
                <button
                  v-if="paper.paperStatus === 'checking'"
                  class="action-button"
                  @click="monitorCheckProgress(paper.id)"
                >
                  <el-icon><Monitor /></el-icon>
                  <span>查重监控</span>
                </button>
                <button 
                  class="action-button danger"
                  @click="deletePaper(paper)"
                  :disabled="paper.paperStatus !== 'pending' && paper.paperStatus !== 'withdrawn'"
                >
                  <el-icon><Delete /></el-icon>
                  <span>删除</span>
                </button>
              </div>
            </div>

            <div class="paper-meta">
              <div class="meta-item">
                <el-icon><Calendar /></el-icon>
                <span>提交时间：{{ formatDate(paper.submitTime) }}</span>
              </div>
              <div class="meta-item">
                <el-icon><User /></el-icon>
                <span>论文类型：{{ getPaperTypeText(paper.paperType) }}</span>
              </div>
              <div class="meta-item">
                <el-icon><Files /></el-icon>
                <span>相似度：{{ paper.similarityRate != null ? paper.similarityRate + '%' : '未检测' }}</span>
              </div>
            </div>

            <div class="paper-status">
              <span class="status-badge" :class="getStatusType(paper.paperStatus)">
                {{ getStatusText(paper.paperStatus) }}
              </span>
              <span v-if="paper.feedback" class="feedback-brief">
                {{ paper.feedback }}
              </span>
            </div>
          </div>

          <!-- 版本历史 -->
          <div v-if="paper.showVersions" class="paper-versions">
            <div class="versions-header">
              <h5>版本历史</h5>
            </div>
            <div class="timeline">
              <div
                v-for="version in paper.versions"
                :key="version.id"
                class="timeline-item"
              >
                <div class="timeline-node" :class="version.isCurrent ? 'current' : ''"></div>
                <div class="timeline-content">
                  <div class="timeline-timestamp">{{ formatDate(version.submitTime) }}</div>
                  <div class="version-item">
                    <div class="version-header">
                      <span class="version-title">版本 v{{ version.submitVersion }}</span>
                      <span v-if="version.isCurrent" class="current-badge">当前版本</span>
                    </div>
                    <div class="version-actions">
                      <label class="checkbox-label">
                        <input
                          type="checkbox"
                          v-model="selectedVersionIds"
                          :value="version.submitVersion"
                          @change="handleVersionSelection"
                          class="checkbox-input"
                        />
                        <span class="checkbox-text">对比</span>
                      </label>
                      <button
                        class="version-button"
                        @click="viewVersionDetail(version)"
                      >
                        <el-icon><View /></el-icon>
                        <span>查看</span>
                      </button>
                      <button
                        class="version-button"
                        @click="downloadVersion(version)"
                      >
                        <el-icon><Download /></el-icon>
                        <span>下载</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="paper-toggle">
            <button
              class="toggle-button"
              @click="toggleVersions(paper.id)"
            >
              <el-icon :is="paper.showVersions ? 'ArrowUp' : 'ArrowDown'" />
              <span>{{ paper.showVersions ? "收起" : "展开" }}版本历史</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="papers.length === 0" class="empty-state">
        <div class="empty-content">
          <el-icon class="empty-icon"><Document /></el-icon>
          <h3>暂无论文提交记录</h3>
          <p>开始您的第一篇论文提交之旅</p>
          <button class="primary-button" @click="goToPaperSubmit">
            <el-icon><UploadFilled /></el-icon>
            <span>立即提交论文</span>
          </button>
        </div>
      </div>
      <div v-if="papers.length > 0" class="pagination-container">
        <el-pagination
          :current-page="pagination.current"
          @update:current-page="pagination.current = $event"
          :page-size="pagination.size"
          @update:page-size="pagination.size = $event"
          :page-sizes="[5, 10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 论文详情对话框 -->
    <el-dialog v-model="detailDialogVisible" :title="paperTitle" width="800px">
      <div v-if="currentPaper" class="paper-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="论文标题">
            {{ currentPaper.paperTitle }}
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">
            {{ formatDateTime(currentPaper.submitTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="指导老师">
            {{ currentPaper.advisorName || "待分配" }}
          </el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="getStatusType(currentPaper.paperStatus)">
              {{ getStatusText(currentPaper.paperStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="论文摘要" :span="2">
            {{ currentPaper.paperAbstract || "暂无摘要" }}
          </el-descriptions-item>
          <el-descriptions-item label="论文类型">
            {{ getPaperTypeText(currentPaper.paperType) }}
          </el-descriptions-item>
          <el-descriptions-item label="相似度">
            {{ currentPaper.similarityRate }}%
          </el-descriptions-item>
          <el-descriptions-item label="查重结果">
            {{ currentPaper.checkResult || "暂无结果" }}
          </el-descriptions-item>
          <el-descriptions-item label="审核意见" :span="2">
            <div class="feedback-content">
              {{ currentPaper.feedback || "暂无审核意见" }}
            </div>
          </el-descriptions-item>
        </el-descriptions>

        <div class="file-attachments">
          <h4>附件列表</h4>
          <div class="attachment-list">
            <div
              v-for="file in currentPaper.attachments"
              :key="file.id"
              class="attachment-item"
            >
              <el-icon><Document /></el-icon>
              <span class="file-name">{{ file.name }}</span>
              <span class="file-size">{{ formatFileSize(file.size) }}</span>
              <button 
                class="attachment-button"
                @click="downloadAttachment(file)"
              >
                <el-icon><Download /></el-icon>
                <span>下载</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <button class="secondary-button" @click="detailDialogVisible = false">关闭</button>
        <button
          v-if="currentPaper?.paperStatus === 'rejected'"
          class="primary-button"
          @click="submitRevision(currentPaper.id)"
        >
          <el-icon><Upload /></el-icon>
          <span>提交修改版本</span>
        </button>
      </template>
    </el-dialog>

    <!-- 版本对比对话框 -->
    <el-dialog 
      v-model="versionCompareDialogVisible" 
      title="版本对比" 
      width="900px"
      :close-on-click-modal="false"
    >
      <div class="version-compare-container">
        <div class="compare-header">
          <div class="alert-info">
            <el-icon><InfoFilled /></el-icon>
            <span>已选择以下两个版本进行对比</span>
          </div>
        </div>

        <div class="compare-content">
          <div class="version-columns">
            <!-- 左侧：版本 A -->
            <div class="version-column">
              <h4>版本 A (v{{ compareVersions[0]?.version }})</h4>
              <div class="version-info">
                <div class="info-item">
                  <div class="info-label">提交时间</div>
                  <div class="info-value">{{ formatDate(compareVersions[0]?.submitTime) }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">相似度</div>
                  <div class="info-value">{{ compareVersions[0]?.similarityRate }}%</div>
                </div>
                <div class="info-item">
                  <div class="info-label">字数</div>
                  <div class="info-value">{{ compareVersions[0]?.wordCount }}字</div>
                </div>
              </div>
            </div>

            <!-- 右侧：版本 B -->
            <div class="version-column">
              <h4>版本 B (v{{ compareVersions[1]?.version }})</h4>
              <div class="version-info">
                <div class="info-item">
                  <div class="info-label">提交时间</div>
                  <div class="info-value">{{ formatDate(compareVersions[1]?.submitTime) }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">相似度</div>
                  <div class="info-value">{{ compareVersions[1]?.similarityRate }}%</div>
                </div>
                <div class="info-item">
                  <div class="info-label">字数</div>
                  <div class="info-value">{{ compareVersions[1]?.wordCount }}字</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 差异对比区域 -->
          <div class="diff-section">
            <h4>主要变化</h4>
            <div class="diff-table">
              <div class="table-header">
                <div class="table-cell field">对比项</div>
                <div class="table-cell before">版本 A</div>
                <div class="table-cell after">版本 B</div>
                <div class="table-cell change">变化</div>
              </div>
              <div 
                v-for="(row, index) in getDiffData()" 
                :key="index"
                class="table-row"
              >
                <div class="table-cell field">{{ row.field }}</div>
                <div class="table-cell before">{{ row.before }}</div>
                <div class="table-cell after">{{ row.after }}</div>
                <div class="table-cell change">
                  <span class="change-badge" :class="row.change > 0 ? 'increase' : 'decrease'">
                    {{ row.change > 0 ? '+' : '' }}{{ row.change }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <button class="secondary-button" @click="versionCompareDialogVisible = false">关闭</button>
        <button class="primary-button" @click="downloadCompareReport">
          <el-icon><Download /></el-icon>
          <span>下载对比报告</span>
        </button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, h } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox, ElSelect, ElOption, ElInput } from "element-plus";
import { getDictDataByType } from "@/api/user.js";
import { 
  getStudentPaperPage, 
  withdrawPaper as withdrawPaperApi, 
  requestModification as requestModificationApi,
  downloadPaper as downloadPaperApi,
  deletePaper as deletePaperApi,
  batchDownloadPapers,
  batchDeletePapers,
  getVersionDetail,
  getPaperVersions,
  comparePaperVersions,
  downloadVersionCompare,
  downloadVersion as downloadVersionApi,
  downloadAttachment as downloadAttachmentApi,
  getSimpleCheckReport,
  createBatchCheckTasks,
  getCheckTaskDetail
} from "@/api/student.js";
import { useUserStore } from "@/stores/user";

// 图标引入
import {
  UploadFilled,
  Search,
  Refresh,
  Document,
  Monitor,
  Calendar,
  User,
  Files,
  View,
  Download,
  Upload,
  ArrowUp,
  ArrowDown,
  RefreshLeft,
  EditPen,
  InfoFilled
} from "@element-plus/icons-vue";

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

// 响应式数据
const filterForm = reactive({
  paperStatus: "",
  dateRange: [],
  paperTitle: "",
});
const paperStatusDictList = ref([]);

const pagination = reactive({
  current: 1,
  size: 5
})
const total = ref(0);
const papers = ref([]);
const activePaperId = ref(null);
const detailDialogVisible = ref(false);
const currentPaper = ref(null);

// 版本对比相关
const selectedVersionIds = ref([]);
const versionCompareDialogVisible = ref(false);
const compareVersions = ref([]);

// 批量操作相关
const selectedPaperIds = ref([]);
const selectAll = ref(false);

onMounted(async () => {
  try {
    // 调用接口：获取论文状态字典（后端 dictType 是 "paper_status"）
    const res = await getDictDataByType("paper_status");
    paperStatusDictList.value = res.data;
  } catch (err) {
    console.error("获取论文状态字典失败：", err);
  }
  fetchPapers();
});

// 监听路由变化，当从查重相关页面返回时刷新数据
watch(
  () => route.name,
  (newRouteName, oldRouteName) => {
    // 如果是从查重报告或查重监控页面返回
    if (
      oldRouteName === 'PlagiarismReport' || 
      oldRouteName === 'CheckMonitor' ||
      oldRouteName === 'CheckHistory'
    ) {
      fetchPapers();
    }
  }
);

// 方法
const fetchPapers = async () => {
  try {
    const queryParams = {
      studentId: userStore.userInfo?.userId,
      paperStatus: filterForm.paperStatus || "", // 空状态则查全部
      paperTitle: filterForm.paperTitle || "",
      startTime: filterForm.dateRange[0] || "",
      endTime: filterForm.dateRange[1] || "",
      pageNum: pagination.current,
      pageSize: pagination.size
    };
    // 调用真实后端接口
    const res = await getStudentPaperPage(queryParams);
    if (res.data && res.data.records) {
      papers.value = res.data.records; // 论文列表数据
      total.value = Number(res.data.total); // 转换为数字类型
      // 同步更新分页信息
      if (res.data.current) {
        pagination.current = Number(res.data.current);
      }
      if (res.data.size) {
        pagination.size = Number(res.data.size);
      }
      ElMessage.success(`查询成功${total.value}篇论文`);
    } else {
      papers.value = [];
      total.value = 0;
      ElMessage.info("暂无论文数据");
    }
  } catch (error) {
    ElMessage.error("查询论文失败，请重试");
    console.error("论文查询失败：", error);
    papers.value = [];
    total.value = 0;
  }
};

// 分页相关方法
const handleSizeChange = (newSize) => {
  pagination.size = newSize;
  pagination.current = 1; // 页数重置为第一页
  fetchPapers();
};

const handleCurrentChange = (newPage) => {
  pagination.current = newPage;
  fetchPapers();
};

const handleSearch = () => {
  pagination.current = 1; // 搜索时回到第一页
  fetchPapers();
};

const handleReset = () => {
  Object.keys(filterForm).forEach((key) => {
    filterForm[key] = key === "dateRange" ? [] : "";
  });
  fetchPapers();
  ElMessage.success("已重置筛选条件，显示全部论文");
};

const goToPaperSubmit = () => {
  router.push("/student/paper-submit");
};

const viewPaperDetail = (paper) => {
  currentPaper.value = paper;
  detailDialogVisible.value = true;
};

const downloadPaper = async (paper) => {
  try {
    await ElMessageBox.confirm("确定要下载这篇论文吗？", "下载确认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
    });
    
    // 调用下载接口
    const res = await downloadPaperApi(paper.id);
    
    // 创建下载链接
    const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${paper.paperTitle}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    ElMessage.success('下载开始，请稍候...');
  } catch (error) {
    if (error !== 'cancel') {
      console.error('下载失败:', error);
      ElMessage.error('下载失败，请稍后重试');
    }
  }
};

const submitRevision = (paperId) => {
  ElMessage.info(`提交论文 ${paperId} 的修改版本`);
  // 跳转到提交修改页面
};

const resubmitPaper = (paper) => {
  // 跳转到论文提交页面，带上论文ID用于重新编辑
  router.push({
    path: '/student/paper-submit',
    query: { paperId: paper.id, action: 'resubmit' }
  });
};

const resubmitAfterRevision = (paper) => {
  // 跳转到论文提交页面，带上论文ID和revision标记
  router.push({
    path: '/student/paper-submit',
    query: { paperId: paper.id, action: 'revision' }
  });
};

const toggleVersions = async (paperId) => {
  const paper = papers.value.find((p) => String(p.id) === String(paperId));
  if (!paper) return;
  if (!paper.showVersions) {
    // 展开：加载版本列表
    try {
      const res = await getPaperVersions(paperId)
      if (res.code === 200) {
        paper.versions = res.data || []
      } else {
        paper.versions = []
      }
    } catch (error) {
      console.error('加载版本列表失败:', error)
      paper.versions = []
    }
  }
  paper.showVersions = !paper.showVersions;
};

// 状态映射（与后端 PaperStatusEnum 一致）
const getStatusType = (status) => {
  const typeMap = {
    draft: "info",
    submitted: "info",
    pending: "info",
    checking: "warning",
    auditing: "primary",
    reviewed: "primary",
    completed: "success",
    rejected: "danger",
    revision_needed: "warning",
    revised: "warning",
    withdrawn: "warning",
  };
  return typeMap[status] || "info";
};

const getStatusText = (status) => {
  const textMap = {
    draft: "草稿",
    submitted: "已提交",
    pending: "待处理",
    checking: "待查重",
    auditing: "审核中",
    reviewed: "已评审",
    completed: "已完成",
    rejected: "审核不通过",
    revision_needed: "需要修改",
    revised: "修改中",
    withdrawn: "已撤回",
  };
  return textMap[status] || "未知状态";
};

// 新增论文类型映射
const getPaperTypeText = (type) => {
  const typeMap = {
    graduation: "毕业论文",
    course: "课程论文",
    other: "其他",
  };
  return typeMap[type] || "其他";
};

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("zh-CN");
};

const formatDateTime = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleString("zh-CN");
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// 撤回论文（一步对话框）
const withdrawPaper = async (paper) => {
  try {
    // 在同一个 prompt 里同时确认操作并收集理由
    const { value: reason } = await ElMessageBox.prompt(
      `确定要撤回论文《${paper.paperTitle}》吗？\\n请简要说明撤回理由：`,
      '撤回论文',
      {
        confirmButtonText: '提交',
        cancelButtonText: '取消',
        type: 'warning',
        inputPattern: /.+/, // 不允许空
        inputErrorMessage: '请输入撤回理由',
        inputPlaceholder: '例如：上传文件有误，需要重新提交',
        textarea: true,
        inputType: 'textarea',
        inputValidator(val) {
          return val && val.trim().length > 0;
        }
      }
    );

    // 调用撤回接口，后端接口已扩展接受原因参数
    const res = await withdrawPaperApi(paper.id, 'OTHER', reason);

    if (res.code === 200) {
      ElMessage.success('论文已撤回，您可以修改后重新提交');

      papers.value = papers.value.filter(p => p.id !== paper.id);
      total.value = Math.max(0, total.value - 1);

      if (papers.value.length === 0 && pagination.current > 1) {
        pagination.current--;
        fetchPapers();
      }
    } else {
      ElMessage.error(res.message || '撤回失败，请稍后重试');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('撤回失败:', error);
      ElMessage.error('撤回失败，请稍后重试');
    }
  }
};

// 申请修改已通过论文
const requestModification = async (paper) => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      `论文《${paper.paperTitle}》已通过审核。如需修改，请说明原因：`,
      '申请修改',
      {
        confirmButtonText: '提交申请',
        cancelButtonText: '取消',
        type: 'info',
        inputPattern: /.+/,
        inputErrorMessage: '请输入修改原因',
        inputPlaceholder: '请简要说明需要修改的内容和原因'
      }
    );
    
    // 调用申请修改接口
    const res = await requestModificationApi(paper.id, reason);
    
    if (res.code === 200) {
      ElMessage.success('修改申请已提交，等待导师审核');
    } else {
      ElMessage.error(res.message || '申请失败，请稍后重试');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('申请失败:', error);
      ElMessage.error('申请失败，请稍后重试');
    }
  }
};

// 查重功能相关方法
const viewPlagiarismReport = (paperId) => {
  // PlagiarismReport页面会自动获取最新报告，无需此处重复请求
  router.push(`/student/plagiarism-report/${paperId}`)
};

const monitorCheckProgress = (paperId) => {
  router.push(`/student/check-monitor/${paperId}`);
};

// 版本对比相关方法
const handleVersionSelection = () => {
  // 限制只能选择两个版本进行对比
  if (selectedVersionIds.value.length > 2) {
    selectedVersionIds.value.pop();
    ElMessage.warning('最多只能选择两个版本进行对比');
  }
  
  // 当选择了两个版本时，自动打开对比对话框
  if (selectedVersionIds.value.length === 2) {
    openVersionCompare();
  }
};

const openVersionCompare = async () => {
  try {
    if (selectedVersionIds.value.length !== 2) {
      ElMessage.warning('请选择两个版本进行对比');
      return;
    }
    
    // 获取当前论文的 ID（从选中的版本中获取）
    const paperId = papers.value.find(p =>
      p.versions?.some(v => selectedVersionIds.value.includes(v.submitVersion))
    )?.id;
    
    if (!paperId) {
      ElMessage.error('无法获取论文信息');
      return;
    }
    
    // 调用版本对比接口
    const res = await comparePaperVersions(paperId, selectedVersionIds.value);
    
    if (res.code === 200) {
      compareVersions.value = [res.data.versionA, res.data.versionB];
      versionCompareDialogVisible.value = true;
      ElMessage.success('版本对比数据已加载');
    } else {
      ElMessage.error(res.message || '版本对比失败');
    }
  } catch (error) {
    console.error('版本对比失败:', error);
    ElMessage.error('版本对比失败，请稍后重试');
  }
};

// 获取差异数据（使用接口返回的 diffData）
const getDiffData = () => {
  if (compareVersions.value.length < 2) return [];
  
  // 如果有接口返回的 diffData，直接使用
  // 否则手动计算差异
  const v1 = compareVersions.value[0];
  const v2 = compareVersions.value[1];
  
  return [
    {
      field: '相似度',
      before: v1.similarityRate,
      after: v2.similarityRate,
      change: (v2.similarityRate - v1.similarityRate).toFixed(1)
    },
    {
      field: '字数',
      before: v1.wordCount,
      after: v2.wordCount,
      change: v2.wordCount - v1.wordCount
    }
  ];
};

const downloadCompareReport = async () => {
  try {
    ElMessage.info('对比报告生成中...');
    
    // 获取论文 ID
    const paperId = papers.value.find(p => 
      p.versions?.some(v => selectedVersionIds.value.includes(v.submitVersion))
    )?.id;
    
    if (!paperId) {
      ElMessage.error('无法获取论文信息');
      return;
    }
    
    // 调用下载对比报告接口
    const res = await downloadVersionCompare(paperId, selectedVersionIds.value);
    
    // 创建下载链接
    const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `版本对比报告_${new Date().getTime()}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    ElMessage.success('对比报告已下载');
  } catch (error) {
    console.error('下载对比报告失败:', error);
    ElMessage.error('下载对比报告失败，请稍后重试');
  }
};

// 查看版本详情
const viewVersionDetail = async (version) => {
  try {
    // 获取论文 ID
    const paperId = papers.value.find(p =>
      p.versions?.some(v => v.submitVersion === version.submitVersion)
    )?.id;

    if (!paperId) {
      ElMessage.error('无法获取论文信息');
      return;
    }

    // 调用获取版本详情接口（后端按submit_version查询）
    const res = await getVersionDetail(paperId, version.submitVersion);
    
    if (res.code === 200) {
      ElMessageBox.alert(
        `<div style="text-align: left;">
          <p><strong>版本号：</strong>V${res.data.version}</p>
          <p><strong>提交时间：</strong>${formatDateTime(res.data.submitTime)}</p>
          <p><strong>相似度：</strong>${res.data.similarityRate}%</p>
          <p><strong>字数：</strong>${res.data.wordCount}字</p>
          <p><strong>修改说明：</strong>${res.data.changes || '无'}</p>
        </div>`,
        '版本详情',
        {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '确定'
        }
      );
    } else {
      ElMessage.error(res.message || '获取版本详情失败');
    }
  } catch (error) {
    console.error('获取版本详情失败:', error);
    ElMessage.error('获取版本详情失败，请稍后重试');
  }
};

// 下载版本
const downloadVersion = async (version) => {
  try {
    await ElMessageBox.confirm(`确定要下载版本 V${version.submitVersion} 吗？`, '下载确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    });
    
    // 调用下载版本接口
    const res = await downloadVersionApi(version.id);
    
    // 创建下载链接
    const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `论文版本_V${version.version}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    ElMessage.success('下载开始，请稍候...');
  } catch (error) {
    if (error !== 'cancel') {
      console.error('下载版本失败:', error);
      ElMessage.error('下载版本失败，请稍后重试');
    }
  }
};

// 下载附件
const downloadAttachment = async (attachment) => {
  try {
    // 调用下载附件接口
    const res = await downloadAttachmentApi(attachment.id);
    
    // 创建下载链接
    const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.name;
    link.click();
    window.URL.revokeObjectURL(url);
    
    ElMessage.success('下载开始，请稍候...');
  } catch (error) {
    console.error('下载附件失败:', error);
    ElMessage.error('下载附件失败，请稍后重试');
  }
};

// 删除单个论文
const deletePaper = async (paper) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除论文《${paper.paperTitle}》吗？此操作不可恢复！`,
      '删除论文',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'danger'
      }
    );
    
    // 调用删除接口
    const res = await deletePaperApi(paper.id);
    
    if (res.code === 200) {
      ElMessage.success('论文删除成功');
      // 从列表中移除删除的论文
      papers.value = papers.value.filter(p => p.id !== paper.id);
      total.value = Math.max(0, total.value - 1);
      
      if (papers.value.length === 0 && pagination.current > 1) {
        pagination.current--;
        fetchPapers();
      }
    } else {
      ElMessage.error(res.message || '删除失败，请稍后重试');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error);
      ElMessage.error('删除失败，请稍后重试');
    }
  }
};

// 批量操作相关方法
const handleSelectAll = (checked) => {
  if (checked) {
    selectedPaperIds.value = papers.value.map(p => p.id);
  } else {
    selectedPaperIds.value = [];
  }
};

const handlePaperSelect = () => {
  // 更新全选状态
  selectAll.value = selectedPaperIds.value.length === papers.value.length;
};

const batchDownload = async () => {
  try {
    ElMessage.success(`正在下载 ${selectedPaperIds.value.length} 篇论文...`);
    
    // 调用批量下载接口
    const res = await batchDownloadPapers(selectedPaperIds.value);
    
    // 创建下载链接
    const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'application/zip' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `批量论文下载_${new Date().getTime()}.zip`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    ElMessage.success('打包下载已开始，请稍候...');
    selectedPaperIds.value = [];
    selectAll.value = false;
  } catch (error) {
    console.error('批量下载失败:', error);
    ElMessage.error('批量下载失败，请稍后重试');
  }
};

const batchCheckPlagiarism = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要对选中的 ${selectedPaperIds.value.length} 篇论文进行查重吗？`,
      '批量查重',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    // 调用批量查重接口（已在 student.js 中定义）
    const res = await createBatchCheckTasks(selectedPaperIds.value);
    
    if (res.code === 200) {
      ElMessage.success(`批量查重任务已提交，共 ${res.data?.totalCount || selectedPaperIds.value.length} 篇论文`);
      selectedPaperIds.value = [];
      selectAll.value = false;
    } else {
      ElMessage.error(res.message || '批量查重失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量查重失败:', error);
      ElMessage.error('批量查重失败，请稍后重试');
    }
  }
};

const batchDelete = async () => {
  try {
    // 检查选中的论文是否都是待分配状态或撤回状态
    const selectedPapers = papers.value.filter(paper => selectedPaperIds.value.includes(paper.id));
    const invalidPapers = selectedPapers.filter(paper => paper.paperStatus !== 'pending' && paper.paperStatus !== 'withdrawn');
    
    if (invalidPapers.length > 0) {
      ElMessage.error('只能删除待分配状态和撤回状态的论文');
      return;
    }
    
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedPaperIds.value.length} 篇论文吗？此操作不可恢复！`,
      '批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'danger'
      }
    );
    
    // 调用批量删除接口
    const res = await batchDeletePapers(selectedPaperIds.value);
    
    if (res.code === 200) {
      const deletedCount = res.data?.deletedCount || selectedPaperIds.value.length;
      ElMessage.success(`成功删除 ${deletedCount} 篇论文`);
      selectedPaperIds.value = [];
      selectAll.value = false;
      fetchPapers();
    } else {
      ElMessage.error(res.message || '批量删除失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error);
      ElMessage.error('批量删除失败，请稍后重试');
    }
  }
};
</script>

<style lang="scss" scoped>
// 全局样式
.my-papers-page {
  min-height: 100vh;
  background: #f5f5f7; // Slate-50
  color: #0f172a; // Slate-900
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding: 24px 0;
}

// 页面头部
.page-header {
  margin-bottom: 32px;
  
  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .header-left {
      .page-title {
        margin: 0 0 8px 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: #0f172a;
      }
      
      .page-desc {
        margin: 0;
        color: #64748b;
        font-size: 0.875rem;
      }
    }
    
    .header-actions {
      .primary-button {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: #0066cc;
        color: white;
        border: none;
        border-radius: 11px;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:hover {
          background: #0055aa;
          /* translateY removed */
          /* box-shadow removed */
        }
      }
    }
  }
}

// 筛选卡片
.filter-card {
  max-width: 1200px;
  margin: 0 auto 24px;
  padding: 0 24px;
  
  .filter-form {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 24px;
    transition: all 0.2s ease;
    
    &:hover {
      /* box-shadow removed */
      border-color: #cbd5e1;
    }
    
    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      align-items: end;
      
      .form-group {
        .form-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .form-select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 11px;
          font-size: 0.875rem;
          transition: all 0.2s ease;
          
          &:hover {
            border-color: #cbd5e1;
          }
          
          &:focus {
            outline: none;
            border-color: #0ea5e9;
            box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
          }
        }
        
        .form-control {
          width: 100%;
          
          :deep(.el-input__wrapper) {
            border-radius: 11px;
            
            &:hover {
              box-shadow: none;
              border-color: #cbd5e1;
            }
            
            &.is-focus {
              box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
            }
          }
        }
        
        .search-input {
          position: relative;
          
          .search-icon {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: #94a3b8;
          }
          
          .input-field {
            width: 100%;
            padding-left: 36px;
            
            :deep(.el-input__wrapper) {
              border-radius: 11px;
              
              &:hover {
                box-shadow: none;
                border-color: #cbd5e1;
              }
              
              &.is-focus {
                box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
              }
            }
          }
        }
      }
      
      .form-actions {
        display: flex;
        gap: 12px;
        
        .primary-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #0066cc;
          color: white;
          border: none;
          border-radius: 11px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          
          &:hover {
            background: #0055aa;
            /* translateY removed */
            /* box-shadow removed */
          }
        }
        
        .secondary-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: white;
          color: #475569;
          border: 1px solid #e2e8f0;
          border-radius: 11px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          
          &:hover {
            border-color: #cbd5e1;
            background: #f5f5f7;
            /* translateY removed */
          }
        }
      }
    }
  }
}

// 论文卡片
.papers-card {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  
  .card-header {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 18px 12px 0 0;
    padding: 20px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.125rem;
      font-weight: 600;
      color: #0f172a;
      
      .el-icon {
        color: #64748b;
      }
    }
    
    .card-extra {
      color: #64748b;
      font-size: 0.875rem;
    }
  }
  
  .header-actions-group {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .batch-toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .selected-count {
        padding: 4px 12px;
        background: #f1f5f9;
        color: #64748b;
        border-radius: 16px;
        font-size: 0.75rem;
        font-weight: 600;
      }
      
      .primary-button,
      .success-button,
      .danger-button {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border: none;
        border-radius: 11px;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:hover {
          /* translateY removed */
        }
      }
      
      .primary-button {
        background: #0066cc;
        color: white;
        
        &:hover {
          background: #0055aa;
          /* box-shadow removed */
        }
      }
      
      .success-button {
        background: #10b981;
        color: white;
        
        &:hover {
          background: #34c759;
          /* box-shadow removed */
        }
      }
      
      .danger-button {
        background: #ef4444;
        color: white;
        
        &:hover {
          background: #dc2626;
          /* box-shadow removed */
        }
      }
      
      .divider {
        width: 1px;
        height: 24px;
        background: #e2e8f0;
      }
      
      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        
        .checkbox-input {
          width: 16px;
          height: 16px;
        }
        
        .checkbox-text {
          font-size: 0.75rem;
          color: #64748b;
        }
      }
    }
  }
  
  .papers-list {
    background: white;
    border: 1px solid #e2e8f0;
    border-top: none;
    border-radius: 0 0 12px 12px;
    padding: 24px;
    
    .paper-item {
      border: 1px solid #e2e8f0;
      border-radius: 11px;
      margin-bottom: 16px;
      transition: all 0.2s ease;
      display: flex;
      gap: 16px;
      background: white;
      
      &:hover {
        /* translateY removed */
        /* box-shadow removed */
        border-color: #cbd5e1;
      }
      
      &.paper-selected {
        border-color: #0ea5e9;
        background: rgba(0, 102, 204, 0.05);
      }
      
      .paper-select {
        display: flex;
        align-items: center;
        flex-shrink: 0;
        padding-top: 20px;
        padding-left: 20px;
        
        .checkbox-label {
          cursor: pointer;
          
          .checkbox-input {
            width: 16px;
            height: 16px;
          }
        }
      }
      
      .paper-main {
        padding: 20px;
        flex: 1;
      }
      
      .paper-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;
        
        .paper-title {
          margin: 0;
          color: #0f172a;
          font-size: 1.125rem;
          font-weight: 600;
          flex: 1;
          margin-right: 16px;
        }
        
        .paper-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          
          .action-button {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 4px 8px;
            border: 1px solid #e2e8f0;
            border-radius: 11px;
            background: white;
            color: #64748b;
            font-size: 0.75rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            
            &:hover {
              border-color: #cbd5e1;
              color: #0f172a;
              /* translateY removed */
            }
            
            &.primary {
              background: #0066cc;
              color: white;
              border-color: #0066cc;
              
              &:hover {
                background: #0055aa;
                /* box-shadow removed */
              }
            }
            
            &.warning {
              background: #f59e0b;
              color: white;
              border-color: #f59e0b;
              
              &:hover {
                background: #ff9500;
                /* box-shadow removed */
              }
            }
            
            &.info {
              background: #0ea5e9;
              color: white;
              border-color: #0ea5e9;
              
              &:hover {
                background: #0284c7;
                /* box-shadow removed */
              }
            }
            
            &.danger {
              background: #ef4444;
              color: white;
              border-color: #ef4444;
              
              &:hover {
                background: #dc2626;
                /* box-shadow removed */
              }
              
              &:disabled {
                background: #fca5a5;
                border-color: #fca5a5;
                cursor: not-allowed;
                
                &:hover {
                  transform: none;
                  box-shadow: none;
                }
              }
            }
          }
        }
      }
      
      .paper-meta {
        display: flex;
        gap: 24px;
        margin-bottom: 16px;
        flex-wrap: wrap;
        
        .meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #64748b;
          font-size: 0.875rem;
          
          .el-icon {
            color: #94a3b8;
          }
        }
      }
      
      .paper-status {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        
        .status-badge {
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 0.75rem;
          font-weight: 600;
          
          &.info {
            background: #e0f2fe;
            color: #0284c7;
          }
          &.warning {
            background: #f5f5f7;
            color: #ff9500;
          }
          &.primary {
            background: #f5f5f7;
            color: #0066cc;
          }
          &.success {
            background: #f5f5f7;
            color: #34c759;
          }
          &.danger {
            background: #fee2e2;
            color: #dc2626;
          }
        }
        
        .feedback-brief {
          color: #ef4444;
          font-size: 0.875rem;
          font-style: italic;
        }
      }
      
      .paper-versions {
        border-top: 1px solid #e2e8f0;
        padding: 20px;
        background: #f5f5f7;
        
        .versions-header {
          margin-bottom: 16px;
          
          h5 {
            margin: 0;
            color: #0f172a;
            font-size: 1rem;
            font-weight: 600;
          }
        }
        
        .timeline {
          position: relative;
          padding-left: 24px;
          
          &::before {
            content: '';
            position: absolute;
            left: 8px;
            top: 0;
            bottom: 0;
            width: 2px;
            background: #e2e8f0;
          }
          
          .timeline-item {
            position: relative;
            margin-bottom: 24px;
            
            &:last-child {
              margin-bottom: 0;
            }
            
            .timeline-node {
              position: absolute;
              left: -24px;
              top: 4px;
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background: #cbd5e1;
              border: 2px solid white;
              /* box-shadow removed */
              
              &.current {
                background: #0ea5e9;
              }
            }
            
            .timeline-content {
              .timeline-timestamp {
                font-size: 0.75rem;
                color: #94a3b8;
                margin-bottom: 8px;
              }
              
              .version-item {
                .version-header {
                  display: flex;
                  align-items: center;
                  gap: 12px;
                  margin-bottom: 8px;
                  
                  .version-title {
                    font-weight: 600;
                    color: #0f172a;
                    font-size: 0.875rem;
                  }
                  
                  .current-badge {
                    padding: 2px 8px;
                    background: #0ea5e9;
                    color: white;
                    border-radius: 18px;
                    font-size: 0.75rem;
                    font-weight: 600;
                  }
                }
                
                .version-actions {
                  display: flex;
                  gap: 12px;
                  
                  .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                    
                    .checkbox-input {
                      width: 14px;
                      height: 14px;
                    }
                    
                    .checkbox-text {
                      font-size: 0.75rem;
                      color: #64748b;
                    }
                  }
                  
                  .version-button {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 8px;
                    border: 1px solid #e2e8f0;
                    border-radius: 11px;
                    background: white;
                    color: #64748b;
                    font-size: 0.75rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    
                    &:hover {
                      border-color: #cbd5e1;
                      color: #0f172a;
                    }
                  }
                }
              }
            }
          }
        }
      }
      
      .paper-toggle {
        border-top: 1px solid #e2e8f0;
        padding: 16px 20px;
        text-align: center;
        background: #f5f5f7;
        
        .toggle-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          
          &:hover {
            color: #0f172a;
            background: #f1f5f9;
            border-radius: 11px;
          }
        }
      }
    }
  }
  
  .empty-state {
    background: white;
    border: 1px solid #e2e8f0;
    border-top: none;
    border-radius: 0 0 12px 12px;
    padding: 64px 24px;
    text-align: center;
    
    .empty-content {
      .empty-icon {
        font-size: 48px;
        color: #94a3b8;
        margin-bottom: 16px;
      }
      
      h3 {
        margin: 0 0 8px 0;
        color: #0f172a;
        font-size: 1.125rem;
        font-weight: 600;
      }
      
      p {
        margin: 0 0 24px 0;
        color: #64748b;
        font-size: 0.875rem;
      }
      
      .primary-button {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: #0066cc;
        color: white;
        border: none;
        border-radius: 11px;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:hover {
          background: #0055aa;
          /* translateY removed */
          /* box-shadow removed */
        }
      }
    }
  }
  
  .pagination-container {
    background: white;
    border: 1px solid #e2e8f0;
    border-top: none;
    border-radius: 0 0 12px 12px;
    padding: 20px 24px;
    
    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .page-info {
        color: #64748b;
        font-size: 0.875rem;
      }
      
      .page-controls {
        display: flex;
        align-items: center;
        gap: 12px;
        
        .page-button {
          padding: 4px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 11px;
          background: white;
          color: #64748b;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
          
          &:hover:not(:disabled) {
            border-color: #cbd5e1;
            color: #0f172a;
            /* translateY removed */
          }
          
          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        }
        
        .page-number {
          font-size: 0.875rem;
          color: #64748b;
        }
        
        .page-size-select {
          padding: 4px 8px;
          border: 1px solid #e2e8f0;
          border-radius: 11px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
          
          &:hover {
            border-color: #cbd5e1;
          }
        }
      }
    }
  }
}

// 论文详情
.paper-detail {
  .detail-section {
    .detail-row {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 16px;
      
      &.full-width {
        grid-template-columns: 1fr;
      }
      
      .detail-item {
        .detail-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .detail-value {
          font-size: 0.875rem;
          color: #0f172a;
          
          .status-badge {
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 0.75rem;
            font-weight: 600;
            
            &.info {
              background: #e0f2fe;
              color: #0284c7;
            }
            &.warning {
              background: #f5f5f7;
              color: #ff9500;
            }
            &.primary {
              background: #f5f5f7;
              color: #0066cc;
            }
            &.success {
              background: #f5f5f7;
              color: #34c759;
            }
            &.danger {
              background: #fee2e2;
              color: #dc2626;
            }
          }
        }
        
        &.full-width {
          .detail-value {
            line-height: 1.5;
          }
        }
      }
    }
  }
  
  .feedback-content {
    background: #f5f5f7;
    padding: 16px;
    border-radius: 11px;
    border-left: 4px solid #0ea5e9;
    line-height: 1.5;
  }
  
  .file-attachments {
    margin-top: 24px;
    
    h4 {
      margin: 0 0 16px 0;
      color: #0f172a;
      font-size: 1rem;
      font-weight: 600;
    }
    
    .attachment-list {
      .attachment-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border: 1px solid #e2e8f0;
        border-radius: 11px;
        margin-bottom: 8px;
        background: white;
        transition: all 0.2s ease;
        
        &:hover {
          border-color: #cbd5e1;
          /* box-shadow removed */
        }
        
        .el-icon {
          color: #64748b;
        }
        
        .file-name {
          flex: 1;
          color: #0f172a;
          font-size: 0.875rem;
        }
        
        .file-size {
          color: #64748b;
          font-size: 0.75rem;
        }
        
        .attachment-button {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border: 1px solid #e2e8f0;
          border-radius: 11px;
          background: white;
          color: #64748b;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s ease;
          
          &:hover {
            border-color: #cbd5e1;
            color: #0f172a;
          }
        }
      }
    }
  }
}

// 版本对比
.version-compare-container {
  .compare-header {
    margin-bottom: 24px;
    
    .alert-info {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: #e0f2fe;
      color: #0284c7;
      border-radius: 11px;
      
      .el-icon {
        font-size: 16px;
      }
    }
  }
  
  .compare-content {
    .version-columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
      
      .version-column {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 11px;
        padding: 20px;
        
        h4 {
          margin: 0 0 16px 0;
          color: #0f172a;
          font-size: 1rem;
          font-weight: 600;
        }
        
        .version-info {
          .info-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
            
            &:last-child {
              border-bottom: none;
            }
            
            .info-label {
              font-size: 0.875rem;
              color: #64748b;
            }
            
            .info-value {
              font-size: 0.875rem;
              color: #0f172a;
              font-weight: 600;
            }
          }
        }
      }
    }
    
    .diff-section {
      h4 {
        margin: 0 0 16px 0;
        color: #0f172a;
        font-size: 1rem;
        font-weight: 600;
      }
      
      .diff-table {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 11px;
        overflow: hidden;
        
        .table-header {
          display: grid;
          grid-template-columns: 120px 1fr 1fr 100px;
          background: #f5f5f7;
          padding: 12px 16px;
          border-bottom: 1px solid #e2e8f0;
          
          .table-cell {
            font-size: 0.75rem;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
        }
        
        .table-row {
          display: grid;
          grid-template-columns: 120px 1fr 1fr 100px;
          padding: 12px 16px;
          border-bottom: 1px solid #e2e8f0;
          
          &:last-child {
            border-bottom: none;
          }
          
          .table-cell {
            font-size: 0.875rem;
            color: #0f172a;
            
            &.field {
              font-weight: 600;
            }
            
            &.change {
              display: flex;
              align-items: center;
              
              .change-badge {
                padding: 2px 8px;
                border-radius: 18px;
                font-size: 0.75rem;
                font-weight: 600;
                
                &.increase {
                  background: #fee2e2;
                  color: #dc2626;
                }
                &.decrease {
                  background: #f5f5f7;
                  color: #34c759;
                }
              }
            }
          }
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .filter-card,
  .papers-card {
    padding: 0 16px;
  }
  
  .page-header {
    .header-content {
      padding: 0 16px;
    }
  }
}

@media (max-width: 768px) {
  .my-papers-page {
    padding: 16px 0;
  }
  
  .page-header {
    margin-bottom: 24px;
    
    .header-content {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
      
      .header-actions {
        align-self: stretch;
        
        .primary-button {
          width: 100%;
          justify-content: center;
        }
      }
    }
  }
  
  .filter-card {
    margin-bottom: 16px;
    
    .filter-form {
      padding: 16px;
      
      .form-row {
        grid-template-columns: 1fr;
        
        .form-actions {
          flex-direction: column;
          
          .primary-button,
          .secondary-button {
            width: 100%;
            justify-content: center;
          }
        }
      }
    }
  }
  
  .papers-card {
    .card-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      
      .header-actions-group {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
        width: 100%;
        
        .batch-toolbar {
          flex-wrap: wrap;
          width: 100%;
        }
      }
    }
    
    .papers-list {
      padding: 16px;
      
      .paper-item {
        flex-direction: column;
        gap: 8px;
        
        .paper-select {
          padding: 16px 16px 0;
        }
        
        .paper-main {
          padding: 16px;
        }
        
        .paper-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
          
          .paper-title {
            margin-right: 0;
          }
          
          .paper-actions {
            width: 100%;
            flex-wrap: wrap;
            
            .action-button {
              flex: 1;
              min-width: calc(50% - 4px);
              justify-content: center;
            }
          }
        }
        
        .paper-meta {
          flex-direction: column;
          gap: 8px;
        }
        
        .paper-versions {
          padding: 16px;
        }
        
        .paper-toggle {
          padding: 12px 16px;
        }
      }
    }
    
    .pagination-container {
      .pagination {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
        
        .page-controls {
          justify-content: center;
        }
      }
    }
  }
  
  .version-compare-container {
    .compare-content {
      .version-columns {
        grid-template-columns: 1fr;
      }
      
      .diff-section {
        .diff-table {
          .table-header,
          .table-row {
            grid-template-columns: 100px 1fr;
            
            .table-cell.field {
              grid-column: 1;
            }
            .table-cell.before {
              grid-column: 2;
              grid-row: 1;
            }
            .table-cell.after {
              grid-column: 2;
              grid-row: 2;
            }
            .table-cell.change {
              grid-column: 1;
              grid-row: 2;
            }
          }
        }
      }
    }
  }
  
  .paper-detail {
    .detail-section {
      .detail-row {
        grid-template-columns: 1fr;
      }
    }
  }
}
</style>