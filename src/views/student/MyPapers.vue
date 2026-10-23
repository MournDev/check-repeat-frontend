<template>
  <div class="my-papers-page">
    <!-- 页面标题 -->
    <PageHeader description="管理您的所有论文提交记录">
      <template #actions>
        <el-button type="primary" :icon="UploadFilled" @click="goToPaperSubmit">提交新论文</el-button>
      </template>
    </PageHeader>

    <ListPageShell
      v-model:page="pagination.current"
      v-model:page-size="pagination.size"
      title="论文列表"
      :icon="Document"
      :total="total"
      :page-sizes="[5, 10, 20, 50]"
      show-total
      total-suffix="篇论文"
      @size-change="handleSizeChange"
      @page-change="handleCurrentChange"
    >
      <!-- 筛选和搜索 -->
      <template #filters>
        <div class="filter-card list-scope">
          <div class="filter-form list-scope">
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
      </template>

      <template #header-extra>
        <div v-if="selectedPaperIds.length > 0" class="papers-card list-scope">
          <div class="header-actions-group">
            <!-- 批量操作工具栏 -->
            <div class="batch-toolbar">
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
          </div>
        </div>
      </template>

      <!-- 论文列表 -->
      <div class="papers-card list-scope">
        <div class="papers-list" v-loading="papersLoading">
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
                <span>提交时间：{{ formatDate(paper.submitTime, '-') }}</span>
              </div>
              <div class="meta-item">
                <el-icon><User /></el-icon>
                <span>论文类型：{{ getPaperTypeText(paper.paperType) }}</span>
              </div>
              <div class="meta-item">
                <el-icon><Files /></el-icon>
                <span>总相似比：{{ paper.similarityRate != null ? paper.similarityRate + '%' : '未检测' }}</span>
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
                  <div class="timeline-timestamp">{{ formatDate(version.submitTime, '-') }}</div>
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
                          :value="version.id"
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

      <!-- 空状态（加载完成后才显示） -->
      <div v-if="!papersLoading && papers.length === 0" class="empty-state">
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
      </div>
    </ListPageShell>

    <!-- 论文详情对话框 -->
    <el-dialog v-model="detailDialogVisible" :title="paperTitle" width="800px">
      <div v-if="currentPaper" class="paper-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="论文标题">
            {{ currentPaper.paperTitle }}
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">
            {{ formatDateTime(currentPaper.submitTime, 'YYYY-MM-DD HH:mm:ss', '-') }}
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
          <el-descriptions-item label="总相似比">
            {{ currentPaper.similarityRate != null ? currentPaper.similarityRate + '%' : '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="单篇最大">
            {{ currentPaper.maxPerSource != null ? currentPaper.maxPerSource + '%' : '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="引用率">
            {{ currentPaper.citationRate != null ? currentPaper.citationRate + '%' : '—' }}
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
                  <div class="info-value">{{ formatDate(compareVersions[0]?.submitTime, '-') }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">总相似比</div>
                  <div class="info-value">{{ compareVersions[0]?.similarityRate != null ? compareVersions[0]?.similarityRate + '%' : '—' }}</div>
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
                  <div class="info-value">{{ formatDate(compareVersions[1]?.submitTime, '-') }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">总相似比</div>
                  <div class="info-value">{{ compareVersions[1]?.similarityRate != null ? compareVersions[1]?.similarityRate + '%' : '—' }}</div>
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
// 论文类型统一走共享模块（真相源是后端 PaperTypeEnum），本页不再自持一份映射
import { loadPaperTypes, getPaperTypeText } from "@/utils/paperType.js";
import { getStatusText, getStatusType } from '@/utils/reviewStatus.js';
import PageHeader from '@/components/common/PageHeader.vue';
import ListPageShell from '@/components/common/ListPageShell.vue';
import { formatDate, formatDateTime } from '@/utils/dataType.js';
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
const papersLoading = ref(false);
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
  // 预取论文类型，列表里的 code 才能渲染成中文。
  // 不 await：失败与否都不影响论文列表本身，且全局 axios 拦截器已经 toast 过。
  loadPaperTypes().catch(() => {});
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
  papersLoading.value = true;
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
      // 列表加载属常规刷新，不弹「查询成功」提示（提交论文跳回列表必弹，属噪音）
    } else {
      papers.value = [];
      total.value = 0;
    }
  } catch (error) {
    // 错误提示由 request 拦截器统一弹出，页面不重复弹
    console.error("论文查询失败：", error);
    papers.value = [];
    total.value = 0;
  } finally {
    papersLoading.value = false;
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

// 论文状态文案与标签色统一走 utils/reviewStatus.js（与 DB 字典 paper_status 对齐）

// 论文类型文案改由 utils/paperType.js 提供（见顶部 import）。
// 原先这里有一份硬编码映射，且未命中时返回 "其他" —— 会把未知/脏值
// 伪装成一个合法类型；共享模块未命中时返回原始 code，一眼能看出数据有问题。

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
    // 注意：selectedVersionIds 存的是 paper_submit 主键 id（后端详情/对比接口均按主键查询），
    // 不是 submitVersion 版本号——此前按版本号传给 selectById 必然查不到，报「版本不存在」
    const paperId = papers.value.find(p =>
      p.versions?.some(v => selectedVersionIds.value.includes(v.id))
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
      field: '总相似比',
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
      p.versions?.some(v => selectedVersionIds.value.includes(v.id))
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
    // 获取论文 ID（按主键 id 匹配，与列表返回的 version.id 一致）
    const paperId = papers.value.find(p =>
      p.versions?.some(v => v.id === version.id)
    )?.id;

    if (!paperId) {
      ElMessage.error('无法获取论文信息');
      return;
    }

    // 调用获取版本详情接口（versionId 为 paper_submit 主键，非版本号）
    const res = await getVersionDetail(paperId, version.id);
    
    if (res.code === 200) {
      ElMessageBox.alert(
        `<div style="text-align: left;">
          <p><strong>版本号：</strong>V${res.data.version}</p>
          <p><strong>提交时间：</strong>${formatDateTime(res.data.submitTime, 'YYYY-MM-DD HH:mm:ss', '-')}</p>
          <p><strong>总相似比：</strong>${res.data.similarityRate != null ? res.data.similarityRate + '%' : '—'}</p>
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
// 骨架迁移：原 .filter-card / .papers-card 仅作为 scoped 样式的选择器前缀保留，
// display: contents 让其不再生成额外卡片盒子，避免与 ListPageShell 的卡片重复。
.list-scope {
  display: contents;
}

// 全局样式
.my-papers-page {
  min-height: 100vh;
  background: var(--apple-canvas-parchment); // Slate-50
  color: var(--apple-ink); // Slate-900
  font-family: var(--apple-font-text);
  padding: var(--apple-spacing-lg);
}

// 筛选卡片
.filter-card {
  max-width: 1200px;
  margin: 0 auto var(--apple-spacing-lg);
  padding: 0;
  
  .filter-form {
    background: var(--apple-surface);
    border: 1px solid var(--apple-hairline);
    border-radius: var(--apple-rounded-lg);
    padding: var(--apple-spacing-lg);
    transition: all 0.2s ease;
    
    &:hover {
      /* box-shadow removed */
      border-color: var(--apple-hairline);
    }
    
    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--apple-spacing-md);
      align-items: end;
      
      .form-group {
        .form-label {
          display: block;
          font-size: var(--apple-fs-fine-print);
          font-weight: 600;
          color: var(--apple-ink-muted-48);
          margin-bottom: 6px;
          text-transform: none;
          letter-spacing: 0;
        }
        
        .form-select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid var(--apple-hairline);
          border-radius: var(--apple-rounded-md);
          font-size: var(--apple-fs-caption);
          color: var(--apple-ink);
          transition: all 0.2s ease;
          
          &:hover {
            border-color: var(--apple-ink-muted-48);
          }
          
          &:focus {
            outline: none;
            border-color: var(--apple-primary);
            box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.12);
          }
        }
        
        .form-control {
          width: 100%;
          
          :deep(.el-input__wrapper) {
            border-radius: var(--apple-rounded-md);
            
            &:hover {
              box-shadow: none;
              border-color: var(--apple-slate-border-strong);
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
            color: var(--apple-slate-faint);
          }
          
          .input-field {
            width: 100%;
            padding-left: 36px;
            
            :deep(.el-input__wrapper) {
              border-radius: var(--apple-rounded-md);
              
              &:hover {
                box-shadow: none;
                border-color: var(--apple-slate-border-strong);
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
        gap: var(--apple-spacing-sm);
        
        .primary-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 9px 16px;
          background: var(--apple-primary);
          color: var(--apple-on-primary);
          border: none;
          border-radius: var(--apple-rounded-md);
          font-size: var(--apple-fs-caption);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          
          &:hover {
            background: var(--apple-primary-hover);
            /* translateY removed */
            /* box-shadow removed */
          }
        }
        
        .secondary-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 9px 16px;
          background: var(--apple-surface);
          color: var(--apple-ink-secondary);
          border: 1px solid var(--apple-hairline);
          border-radius: var(--apple-rounded-md);
          font-size: var(--apple-fs-caption);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          
          &:hover {
            border-color: var(--apple-hairline);
            background: var(--apple-canvas-parchment);
            color: var(--apple-ink);
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
  padding: 0;
  background: var(--apple-surface);
  border: 1px solid var(--apple-hairline);
  border-radius: var(--apple-rounded-lg);
  overflow: hidden;
  
  .header-actions-group {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .batch-toolbar {
      display: flex;
      align-items: center;
      gap: var(--apple-spacing-xs);
      
      .selected-count {
        padding: 4px 10px;
        background: var(--apple-canvas-parchment);
        color: var(--apple-ink-muted-48);
        border-radius: var(--apple-rounded-pill);
        font-size: var(--apple-fs-fine-print);
        font-weight: 600;
      }
      
      .primary-button,
      .success-button,
      .danger-button {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 11px;
        border: none;
        border-radius: var(--apple-rounded-md);
        font-size: var(--apple-fs-fine-print);
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:hover {
          /* translateY removed */
        }
      }
      
      .primary-button {
        background: var(--apple-primary);
        color: white;
        
        &:hover {
          background: var(--apple-primary-active);
          /* box-shadow removed */
        }
      }
      
      .success-button {
        background: var(--apple-success);
        color: white;
        
        &:hover {
          background: var(--apple-success);
          /* box-shadow removed */
        }
      }
      
      .danger-button {
        background: var(--apple-danger);
        color: white;
        
        &:hover {
          background: var(--apple-danger);
          /* box-shadow removed */
        }
      }
      
      .divider {
        width: 1px;
        height: 20px;
        background: var(--apple-hairline);
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
          font-size: var(--apple-fs-fine-print);
          color: var(--apple-ink-secondary);
        }
      }
    }
  }
  
  .papers-list {
    background: transparent;
    border: none;
    border-top: none;
    border-radius: 0;
    padding: var(--apple-spacing-md) var(--apple-spacing-lg) var(--apple-spacing-lg);
    
    .paper-item {
      border: 1px solid var(--apple-hairline);
      border-radius: var(--apple-rounded-md);
      margin-bottom: var(--apple-spacing-sm);
      transition: all 0.2s ease;
      display: flex;
      gap: 16px;
      background: var(--apple-surface);
      
      &:hover {
        /* translateY removed */
        /* box-shadow removed */
        border-color: var(--apple-ink-muted-48);
      }
      
      &.paper-selected {
        border-color: var(--apple-primary);
        background: var(--apple-info-bg);
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
        padding: var(--apple-spacing-md);
        flex: 1;
      }
      
      .paper-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;
        
        .paper-title {
          margin: 0;
          font-family: var(--apple-font-display);
          color: var(--apple-ink);
          font-size: var(--apple-fs-body-strong);
          font-weight: 600;
          flex: 1;
          margin-right: 16px;
        }
        
        .paper-actions {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          
          .action-button {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 5px 10px;
            border: 1px solid var(--apple-hairline);
            border-radius: var(--apple-rounded-sm);
            background: var(--apple-surface);
            color: var(--apple-ink-secondary);
            font-size: var(--apple-fs-fine-print);
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            
            &:hover {
              background: var(--apple-canvas-parchment);
              border-color: var(--apple-ink-muted-48);
              color: var(--apple-ink);
              /* translateY removed */
            }
            
            &.primary {
              background: var(--apple-primary);
              color: white;
              border-color: var(--apple-primary);
              
              &:hover {
                background: var(--apple-primary-active);
                /* box-shadow removed */
              }
            }
            
            &.warning {
              background: var(--apple-warning);
              color: white;
              border-color: var(--apple-warning);
              
              &:hover {
                background: var(--apple-warning);
                /* box-shadow removed */
              }
            }
            
            &.info {
              background: var(--apple-primary);
              color: white;
              border-color: var(--apple-primary);
              
              &:hover {
                background: var(--apple-primary);
                /* box-shadow removed */
              }
            }
            
            &.danger {
              background: var(--apple-danger);
              color: white;
              border-color: var(--apple-danger);
              
              &:hover {
                background: var(--apple-danger);
                /* box-shadow removed */
              }
              
              &:disabled {
                background: var(--apple-danger-border);
                border-color: var(--apple-danger-border);
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
        gap: var(--apple-spacing-md);
        margin-bottom: var(--apple-spacing-sm);
        flex-wrap: wrap;
        
        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--apple-ink-muted-48);
          font-size: var(--apple-fs-fine-print);
          
          .el-icon {
            color: var(--apple-ink-muted-48);
          }
        }
      }
      
      .paper-status {
        display: flex;
        align-items: center;
        gap: var(--apple-spacing-xs);
        flex-wrap: wrap;
        
        .status-badge {
          padding: 3px 10px;
          border-radius: var(--apple-rounded-pill);
          font-size: var(--apple-fs-fine-print);
          font-weight: 500;
          
          &.info {
            background: var(--apple-info-bg);
            color: var(--apple-primary);
          }
          &.warning {
            background: var(--apple-warning-bg);
            color: var(--apple-warning);
          }
          &.primary {
            background: var(--apple-info-bg);
            color: var(--apple-primary);
          }
          &.success {
            background: var(--apple-success-bg);
            color: var(--apple-success);
          }
          &.danger {
            background: var(--apple-danger-bg);
            color: var(--apple-danger);
          }
        }
        
        .feedback-brief {
          color: var(--apple-danger);
          font-size: var(--apple-fs-fine-print);
          font-style: normal;
        }
      }
      
      .paper-versions {
        border-top: 1px solid var(--apple-divider-soft);
        padding: var(--apple-spacing-md) var(--apple-spacing-lg);
        background: var(--apple-canvas-parchment);
        
        .versions-header {
          margin-bottom: 16px;
          
          h5 {
            margin: 0;
            font-family: var(--apple-font-display);
            color: var(--apple-ink);
            font-size: var(--apple-fs-caption);
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
            background: var(--apple-hairline);
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
              background: var(--apple-hairline);
              border: 2px solid var(--apple-surface);
              /* box-shadow removed */
              
              &.current {
                background: var(--apple-primary);
              }
            }
            
            .timeline-content {
              .timeline-timestamp {
                font-size: var(--apple-fs-fine-print);
                color: var(--apple-ink-muted-48);
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
                    color: var(--apple-ink);
                    font-size: var(--apple-fs-fine-print);
                  }
                  
                  .current-badge {
                    padding: 2px 8px;
                    background: var(--apple-info-bg);
                    color: var(--apple-primary);
                    border-radius: var(--apple-rounded-pill);
                    font-size: var(--apple-fs-fine-print);
                    font-weight: 500;
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
                      font-size: var(--apple-fs-fine-print);
                      color: var(--apple-ink-secondary);
                    }
                  }
                  
                  .version-button {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 5px 10px;
                    border: 1px solid var(--apple-hairline);
                    border-radius: var(--apple-rounded-sm);
                    background: var(--apple-surface);
                    color: var(--apple-ink-secondary);
                    font-size: var(--apple-fs-fine-print);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    
                    &:hover {
                      color: var(--apple-ink);
                      border-color: var(--apple-ink-muted-48);
                    }
                  }
                }
              }
            }
          }
        }
      }
      
      .paper-toggle {
        border-top: 1px solid var(--apple-divider-soft);
        padding: var(--apple-spacing-sm) var(--apple-spacing-lg);
        text-align: center;
        background: var(--apple-surface);
        
        .toggle-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: transparent;
          border: none;
          color: var(--apple-ink-muted-48);
          font-size: var(--apple-fs-fine-print);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          
          &:hover {
            color: var(--apple-ink);
            background: var(--apple-canvas-parchment);
            border-radius: var(--apple-rounded-sm);
          }
        }
      }
    }
  }
  
  .empty-state {
    background: transparent;
    border: none;
    border-top: none;
    border-radius: 0;
    padding: var(--apple-spacing-xxl) var(--apple-spacing-lg);
    text-align: center;
    
    .empty-content {
      .empty-icon {
        font-size: 36px;
        color: var(--apple-ink-muted-48);
        margin-bottom: var(--apple-spacing-sm);
      }
      
      h3 {
        margin: 0 0 8px 0;
        font-family: var(--apple-font-display);
        color: var(--apple-ink);
        font-size: var(--apple-fs-body-strong);
        font-weight: 600;
      }
      
      p {
        margin: 0 0 var(--apple-spacing-lg) 0;
        color: var(--apple-ink-muted-48);
        font-size: var(--apple-fs-caption);
      }
      
      .primary-button {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 9px 16px;
        background: var(--apple-primary);
        color: var(--apple-on-primary);
        border: none;
        border-radius: var(--apple-rounded-md);
        font-size: var(--apple-fs-caption);
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:hover {
          background: var(--apple-primary-hover);
          /* translateY removed */
          /* box-shadow removed */
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
          color: var(--apple-slate-sub);
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .detail-value {
          font-size: 0.875rem;
          color: var(--apple-slate-ink);
          
          .status-badge {
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 0.75rem;
            font-weight: 600;
            
            &.info {
              background: var(--apple-info-bg);
              color: var(--apple-primary);
            }
            &.warning {
              background: var(--apple-canvas-parchment);
              color: var(--apple-warning);
            }
            &.primary {
              background: var(--apple-canvas-parchment);
              color: var(--apple-primary);
            }
            &.success {
              background: var(--apple-canvas-parchment);
              color: var(--apple-success);
            }
            &.danger {
              background: var(--apple-danger-bg);
              color: var(--apple-danger);
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
    background: var(--apple-canvas-parchment);
    padding: 16px;
    border-radius: var(--apple-rounded-md);
    border-left: 4px solid var(--apple-primary);
    font-size: var(--apple-fs-caption);
    color: var(--apple-ink);
    line-height: 1.5;
  }
  
  .file-attachments {
    margin-top: 24px;
    
    h4 {
      margin: 0 0 16px 0;
      color: var(--apple-slate-ink);
      font-size: 1rem;
      font-weight: 600;
    }
    
    .attachment-list {
      .attachment-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border: 1px solid var(--apple-hairline);
        border-radius: var(--apple-rounded-md);
        margin-bottom: 8px;
        background: var(--apple-surface);
        transition: all 0.2s ease;
        
        &:hover {
          border-color: var(--apple-ink-muted-48);
          /* box-shadow removed */
        }
        
        .el-icon {
          color: var(--apple-slate-sub);
        }
        
        .file-name {
          flex: 1;
          color: var(--apple-ink);
          font-size: var(--apple-fs-caption);
        }
        
        .file-size {
          color: var(--apple-ink-muted-48);
          font-size: var(--apple-fs-fine-print);
        }
        
        .attachment-button {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border: 1px solid var(--apple-hairline);
          border-radius: var(--apple-rounded-sm);
          background: var(--apple-surface);
          color: var(--apple-ink-secondary);
          font-size: var(--apple-fs-fine-print);
          cursor: pointer;
          transition: all 0.2s ease;
          
          &:hover {
            border-color: var(--apple-ink-muted-48);
            color: var(--apple-ink);
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
      background: var(--apple-info-bg);
      color: var(--apple-primary);
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
        border: 1px solid var(--apple-hairline);
        border-radius: var(--apple-rounded-md);
        padding: 20px;
        
        h4 {
          margin: 0 0 16px 0;
          font-family: var(--apple-font-display);
          color: var(--apple-ink);
          font-size: var(--apple-fs-caption);
          font-weight: 600;
        }
        
        .version-info {
          .info-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid var(--apple-slate-border);
            
            &:last-child {
              border-bottom: none;
            }
            
            .info-label {
              font-size: 0.875rem;
              color: var(--apple-slate-sub);
            }
            
            .info-value {
              font-size: 0.875rem;
              color: var(--apple-slate-ink);
              font-weight: 600;
            }
          }
        }
      }
    }
    
    .diff-section {
      h4 {
        margin: 0 0 16px 0;
        color: var(--apple-slate-ink);
        font-size: 1rem;
        font-weight: 600;
      }
      
      .diff-table {
        background: white;
        border: 1px solid var(--apple-hairline);
        border-radius: var(--apple-rounded-md);
        overflow: hidden;
        
        .table-header {
          display: grid;
          grid-template-columns: 120px 1fr 1fr 100px;
          background: var(--apple-canvas-parchment);
          padding: 12px 16px;
          border-bottom: 1px solid var(--apple-hairline);
          
          .table-cell {
            font-size: 0.75rem;
            font-weight: 600;
            color: var(--apple-slate-sub);
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
        }
        
        .table-row {
          display: grid;
          grid-template-columns: 120px 1fr 1fr 100px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--apple-divider-soft);
          
          &:last-child {
            border-bottom: none;
          }
          
          .table-cell {
            font-size: 0.875rem;
            color: var(--apple-slate-ink);
            
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
                  background: var(--apple-danger-bg);
                  color: var(--apple-danger);
                }
                &.decrease {
                  background: var(--apple-canvas-parchment);
                  color: var(--apple-success);
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
@media (max-width: 768px) {
  .my-papers-page {
    padding: var(--apple-spacing-sm);
  }

  .filter-card {
    margin-bottom: var(--apple-spacing-lg);
    
    .filter-form {
      padding: var(--apple-spacing-lg);
      
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
    .papers-list {
      padding: var(--apple-spacing-sm);
      
      .paper-item {
        flex-direction: column;
        gap: 8px;
        
        .paper-select {
          padding: 16px 16px 0;
        }
        
        .paper-main {
          padding: var(--apple-spacing-md);
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
          padding: var(--apple-spacing-md) var(--apple-spacing-lg);
        }
        
        .paper-toggle {
          padding: var(--apple-spacing-sm) var(--apple-spacing-lg);
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
