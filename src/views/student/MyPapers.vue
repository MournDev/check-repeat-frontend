<template>
  <div class="my-papers-page">
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
      :page-sizes="[10, 20, 50, 100]"
      show-total
      total-suffix="篇论文"
      @size-change="handleSizeChange"
      @page-change="handleCurrentChange"
    >
      <template #header-extra>
        <template v-if="selectedPaperIds.length > 0">
          <span class="selected-count">已选 {{ selectedPaperIds.length }} 篇</span>
          <el-button :icon="Download" @click="batchDownload">批量下载</el-button>
          <el-button :icon="Document" @click="batchCheckPlagiarism">批量查重</el-button>
          <el-button type="danger" plain :icon="Delete" @click="batchDelete">批量删除</el-button>
        </template>
      </template>

      <template #filters>
        <el-form :model="filterForm" inline class="papers-filter">
          <el-form-item label="论文状态">
            <el-select
              v-model="filterForm.paperStatus"
              placeholder="全部状态"
              clearable
              style="width: 140px"
              @change="handleSearch"
            >
              <el-option
                v-for="item in paperStatusDictList"
                :key="item.dictValue"
                :label="item.dictLabel"
                :value="item.dictValue"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="提交时间">
            <el-date-picker
              v-model="filterForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              style="width: 240px"
              @change="handleSearch"
            />
          </el-form-item>
          <el-form-item label="论文标题">
            <el-input
              v-model="filterForm.paperTitle"
              placeholder="搜索论文标题"
              clearable
              style="width: 220px"
              @keyup.enter="handleSearch"
              @clear="handleSearch"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
            <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </template>

      <el-table
        ref="tableRef"
        class="papers-table"
        :data="papers"
        row-key="id"
        size="default"
        :max-height="tableMaxHeight"
        v-loading="papersLoading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="44" />

        <el-table-column label="论文标题" min-width="300">
          <template #default="{ row }">
            <button
              type="button"
              class="paper-title-link"
              :title="row.paperTitle"
              @click="viewPaperDetail(row)"
            >
              {{ row.paperTitle }}
            </button>
          </template>
        </el-table-column>

        <el-table-column label="提交时间" width="160">
          <template #default="{ row }">{{ formatDate(row.submitTime, '-') }}</template>
        </el-table-column>

        <el-table-column label="总相似比" width="130" align="center">
          <template #default="{ row }">
            <span class="similarity-value" :class="getSimilarityClass(row.similarityRate)">
              {{ similarityText(row.similarityRate) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.paperStatus)" size="small" round>
              {{ getStatusText(row.paperStatus) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="230" fixed="right">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button text size="small" type="primary" @click="viewPaperDetail(row)">
                查看详情
              </el-button>
              <el-button text size="small" @click="openVersionDrawer(row)">版本</el-button>
              <el-dropdown trigger="click" @command="(command) => handleMoreCommand(command, row)">
                <el-button text size="small">
                  更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="download" :icon="Download">下载</el-dropdown-item>
                    <el-dropdown-item
                      v-if="row.paperStatus === 'completed' || row.similarityRate != null"
                      command="report"
                      :icon="Document"
                    >
                      查重报告
                    </el-dropdown-item>
                    <el-dropdown-item
                      v-if="row.paperStatus === 'checking'"
                      command="monitor"
                      :icon="Monitor"
                    >
                      查重监控
                    </el-dropdown-item>
                    <el-dropdown-item
                      v-if="row.paperStatus === 'rejected'"
                      command="revise"
                      :icon="Upload"
                      divided
                    >
                      提交修改
                    </el-dropdown-item>
                    <el-dropdown-item
                      v-if="row.paperStatus === 'revision_needed'"
                      command="resubmit"
                      :icon="Upload"
                    >
                      重新提交
                    </el-dropdown-item>
                    <el-dropdown-item
                      v-if="row.paperStatus === 'withdrawn'"
                      command="reedit"
                      :icon="EditPen"
                    >
                      重新编辑
                    </el-dropdown-item>
                    <el-dropdown-item
                      v-if="row.paperStatus === 'completed'"
                      command="request-modify"
                      :icon="EditPen"
                    >
                      申请修改
                    </el-dropdown-item>
                    <el-dropdown-item
                      v-if="canWithdraw(row)"
                      command="withdraw"
                      :icon="RefreshLeft"
                      divided
                    >
                      申请撤回
                    </el-dropdown-item>
                    <el-dropdown-item
                      command="delete"
                      :icon="Delete"
                      :disabled="!canDelete(row)"
                      divided
                    >
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>

        <template #empty>
          <div class="papers-empty">
            <el-icon class="papers-empty-icon"><Document /></el-icon>
            <p>暂无论文提交记录</p>
            <el-button type="primary" @click="goToPaperSubmit">立即提交论文</el-button>
          </div>
        </template>
      </el-table>
    </ListPageShell>

    <!-- 论文详情对话框 -->
    <el-dialog v-model="detailDialogVisible" :title="currentPaper?.paperTitle || '论文详情'" width="800px">
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
            {{ similarityText(currentPaper.similarityRate) }}
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
              <el-button text size="small" :icon="Download" @click="downloadAttachment(file)">
                下载
              </el-button>
            </div>
            <p v-if="!currentPaper.attachments || currentPaper.attachments.length === 0" class="attachment-empty">
              暂无附件
            </p>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button
          v-if="currentPaper?.paperStatus === 'rejected'"
          type="primary"
          @click="submitRevision(currentPaper.id)"
        >
          提交修改版本
        </el-button>
      </template>
    </el-dialog>

    <!-- 版本历史抽屉 -->
    <el-drawer v-model="versionDrawerVisible" size="min(520px, 92vw)" :close-on-click-modal="true">
      <template #header>
        <div class="drawer-header">
          <span class="drawer-title">版本历史</span>
          <span class="drawer-sub">{{ versionPaper?.paperTitle || '—' }}</span>
        </div>
      </template>

      <div class="version-drawer" v-loading="versionsLoading">
        <div class="version-summary">
          <span>共 {{ versions.length }} 个版本</span>
          <span>勾选两个版本可对比</span>
        </div>

        <el-empty
          v-if="!versionsLoading && versions.length === 0"
          description="暂无版本记录"
          :image-size="80"
        />

        <ul v-else class="version-list">
          <li v-for="version in versions" :key="version.id" class="version-item">
            <el-checkbox
              v-model="selectedVersionIds"
              :value="version.id"
              class="version-check"
              @change="handleVersionSelection"
            />
            <div class="version-body">
              <div class="version-top">
                <span class="version-name">V{{ version.submitVersion ?? version.version ?? '—' }}</span>
                <el-tag v-if="version.isCurrent" size="small" type="primary" round>当前版本</el-tag>
                <span class="version-time">{{ formatDate(version.submitTime, '-') }}</span>
              </div>
              <div class="version-meta">
                <span>
                  相似比
                  <strong :class="getSimilarityClass(version.similarityRate)">
                    {{ similarityText(version.similarityRate) }}
                  </strong>
                </span>
                <span>字数 {{ version.wordCount ?? '—' }}</span>
              </div>
              <p v-if="version.changes" class="version-note">{{ version.changes }}</p>
            </div>
            <div class="version-actions">
              <el-button text size="small" @click="viewVersionDetail(version)">查看</el-button>
              <el-button text size="small" @click="downloadVersion(version)">下载</el-button>
            </div>
          </li>
        </ul>
      </div>

      <template #footer>
        <div class="drawer-footer">
          <el-button :disabled="selectedVersionIds.length !== 2" @click="openVersionCompare">
            对比所选版本（{{ selectedVersionIds.length }}/2）
          </el-button>
          <el-button @click="versionDrawerVisible = false">关闭</el-button>
        </div>
      </template>
    </el-drawer>

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
            <div class="version-column">
              <h4>版本 A (v{{ compareVersions[0]?.version }})</h4>
              <div class="version-info">
                <div class="info-item">
                  <div class="info-label">提交时间</div>
                  <div class="info-value">{{ formatDate(compareVersions[0]?.submitTime, '-') }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">总相似比</div>
                  <div class="info-value">{{ similarityText(compareVersions[0]?.similarityRate) }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">字数</div>
                  <div class="info-value">{{ compareVersions[0]?.wordCount }}字</div>
                </div>
              </div>
            </div>

            <div class="version-column">
              <h4>版本 B (v{{ compareVersions[1]?.version }})</h4>
              <div class="version-info">
                <div class="info-item">
                  <div class="info-label">提交时间</div>
                  <div class="info-value">{{ formatDate(compareVersions[1]?.submitTime, '-') }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">总相似比</div>
                  <div class="info-value">{{ similarityText(compareVersions[1]?.similarityRate) }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">字数</div>
                  <div class="info-value">{{ compareVersions[1]?.wordCount }}字</div>
                </div>
              </div>
            </div>
          </div>

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
        <el-button @click="versionCompareDialogVisible = false">关闭</el-button>
        <el-button type="primary" :icon="Download" @click="downloadCompareReport">
          下载对比报告
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { getDictDataByType } from "@/api/user.js";
// 论文类型统一走共享模块（真相源是后端 PaperTypeEnum），本页不再自持一份映射
import { loadPaperTypes, getPaperTypeText } from "@/utils/paperType.js";
import { getStatusText, getStatusType } from '@/utils/reviewStatus.js';
import { getSimilarityClass, normalizeSimilarity } from '@/utils/similarity.js';
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
  createBatchCheckTasks
} from "@/api/student.js";
import { useUserStore } from "@/stores/user";

// 图标引入
import {
  UploadFilled,
  Search,
  Refresh,
  Document,
  Monitor,
  Download,
  Upload,
  ArrowDown,
  RefreshLeft,
  EditPen,
  Delete,
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
  size: 10
});
const total = ref(0);
const papers = ref([]);
const papersLoading = ref(false);
const tableRef = ref();
const tableMaxHeight = ref(480);
const detailDialogVisible = ref(false);
const currentPaper = ref(null);

// 版本抽屉
const versionDrawerVisible = ref(false);
const versionPaper = ref(null);
const versions = ref([]);
const versionsLoading = ref(false);

// 版本对比
const selectedVersionIds = ref([]);
const versionCompareDialogVisible = ref(false);
const compareVersions = ref([]);

// 批量操作
const selectedPaperIds = ref([]);

// 表格高度随视口自适应，保留表头固定后的可视行区域
const updateTableHeight = () => {
  tableMaxHeight.value = Math.max(260, window.innerHeight - 380);
};

onMounted(async () => {
  updateTableHeight();
  window.addEventListener('resize', updateTableHeight);

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

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateTableHeight);
});

// 监听路由变化，当从查重相关页面返回时刷新数据
watch(
  () => route.name,
  (newRouteName, oldRouteName) => {
    if (
      oldRouteName === 'PlagiarismReport' ||
      oldRouteName === 'CheckMonitor' ||
      oldRouteName === 'CheckHistory'
    ) {
      fetchPapers();
    }
  }
);

// ── 相似度展示 ───────────────────────────────────────────
const similarityText = (value) => {
  const percent = normalizeSimilarity(value);
  return percent === null ? '未检测' : `${percent}%`;
};

// ── 列表查询 ─────────────────────────────────────────────
const fetchPapers = async () => {
  papersLoading.value = true;
  try {
    const queryParams = {
      studentId: userStore.userInfo?.userId,
      paperStatus: filterForm.paperStatus || "",
      paperTitle: filterForm.paperTitle || "",
      startTime: filterForm.dateRange?.[0] || "",
      endTime: filterForm.dateRange?.[1] || "",
      pageNum: pagination.current,
      pageSize: pagination.size
    };
    const res = await getStudentPaperPage(queryParams);
    if (res.data && res.data.records) {
      papers.value = res.data.records;
      total.value = Number(res.data.total);
      if (res.data.current) {
        pagination.current = Number(res.data.current);
      }
      if (res.data.size) {
        pagination.size = Number(res.data.size);
      }
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
    nextTick(clearSelection);
  }
};

const clearSelection = () => {
  selectedPaperIds.value = [];
  tableRef.value?.clearSelection();
};

const handleSelectionChange = (rows) => {
  selectedPaperIds.value = rows.map(row => row.id);
};

const handleSizeChange = (newSize) => {
  pagination.size = newSize;
  pagination.current = 1;
  fetchPapers();
};

const handleCurrentChange = (newPage) => {
  pagination.current = newPage;
  fetchPapers();
};

const handleSearch = () => {
  pagination.current = 1;
  fetchPapers();
};

const handleReset = () => {
  Object.keys(filterForm).forEach((key) => {
    filterForm[key] = key === "dateRange" ? [] : "";
  });
  pagination.current = 1;
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

// ── 行内动作 ─────────────────────────────────────────────
const canWithdraw = (paper) =>
  ['pending', 'checking', 'auditing', 'revision_needed'].includes(paper.paperStatus);

const canDelete = (paper) =>
  paper.paperStatus === 'pending' || paper.paperStatus === 'withdrawn';

const handleMoreCommand = (command, paper) => {
  switch (command) {
    case 'download':
      downloadPaper(paper);
      break;
    case 'report':
      viewPlagiarismReport(paper.id);
      break;
    case 'monitor':
      monitorCheckProgress(paper.id);
      break;
    case 'revise':
      submitRevision(paper.id);
      break;
    case 'resubmit':
      resubmitAfterRevision(paper);
      break;
    case 'reedit':
      resubmitPaper(paper);
      break;
    case 'request-modify':
      requestModification(paper);
      break;
    case 'withdraw':
      withdrawPaper(paper);
      break;
    case 'delete':
      deletePaper(paper);
      break;
    default:
      break;
  }
};

const downloadPaper = async (paper) => {
  try {
    await ElMessageBox.confirm("确定要下载这篇论文吗？", "下载确认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
    });

    const res = await downloadPaperApi(paper.id);
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
  router.push({
    path: '/student/paper-submit',
    query: { paperId: paper.id, action: 'resubmit' }
  });
};

const resubmitAfterRevision = (paper) => {
  router.push({
    path: '/student/paper-submit',
    query: { paperId: paper.id, action: 'revision' }
  });
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
    const { value: reason } = await ElMessageBox.prompt(
      `确定要撤回论文《${paper.paperTitle}》吗？\n请简要说明撤回理由：`,
      '撤回论文',
      {
        confirmButtonText: '提交',
        cancelButtonText: '取消',
        type: 'warning',
        inputPattern: /.+/,
        inputErrorMessage: '请输入撤回理由',
        inputPlaceholder: '例如：上传文件有误，需要重新提交',
        textarea: true,
        inputType: 'textarea',
        inputValidator(val) {
          return val && val.trim().length > 0;
        }
      }
    );

    const res = await withdrawPaperApi(paper.id, 'OTHER', reason);

    if (res.code === 200) {
      ElMessage.success('论文已撤回，您可以修改后重新提交');

      papers.value = papers.value.filter(p => p.id !== paper.id);
      total.value = Math.max(0, total.value - 1);
      clearSelection();

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
  router.push(`/student/plagiarism-report/${paperId}`);
};

const monitorCheckProgress = (paperId) => {
  router.push(`/student/check-monitor/${paperId}`);
};

// ── 版本历史抽屉 ─────────────────────────────────────────
const openVersionDrawer = async (paper) => {
  versionPaper.value = paper;
  versionDrawerVisible.value = true;
  selectedVersionIds.value = [];
  versions.value = [];
  versionsLoading.value = true;
  try {
    const res = await getPaperVersions(paper.id);
    versions.value = res.code === 200 ? (res.data || []) : [];
  } catch (error) {
    console.error('加载版本列表失败:', error);
    versions.value = [];
  } finally {
    versionsLoading.value = false;
  }
};

const handleVersionSelection = () => {
  if (selectedVersionIds.value.length > 2) {
    selectedVersionIds.value = selectedVersionIds.value.slice(0, 2);
    ElMessage.warning('最多只能选择两个版本进行对比');
  }
};

const openVersionCompare = async () => {
  const paperId = versionPaper.value?.id;
  if (!paperId || selectedVersionIds.value.length !== 2) {
    ElMessage.warning('请选择两个版本进行对比');
    return;
  }

  try {
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
  const paperId = versionPaper.value?.id;
  if (!paperId || selectedVersionIds.value.length !== 2) {
    ElMessage.warning('请选择两个版本进行对比');
    return;
  }

  try {
    ElMessage.info('对比报告生成中...');

    const res = await downloadVersionCompare(paperId, selectedVersionIds.value);
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

const viewVersionDetail = async (version) => {
  const paperId = versionPaper.value?.id;
  if (!paperId) {
    ElMessage.error('无法获取论文信息');
    return;
  }

  try {
    const res = await getVersionDetail(paperId, version.id);

    if (res.code === 200) {
      ElMessageBox.alert(
        `<div style="text-align: left;">
          <p><strong>版本号：</strong>V${res.data.version}</p>
          <p><strong>提交时间：</strong>${formatDateTime(res.data.submitTime, 'YYYY-MM-DD HH:mm:ss', '-')}</p>
          <p><strong>总相似比：</strong>${similarityText(res.data.similarityRate)}</p>
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

const downloadVersion = async (version) => {
  const label = version.submitVersion ?? version.version ?? '';
  try {
    await ElMessageBox.confirm(`确定要下载版本 V${label} 吗？`, '下载确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    });

    const res = await downloadVersionApi(version.id);
    const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `论文版本_V${label}.pdf`;
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

const downloadAttachment = async (attachment) => {
  try {
    const res = await downloadAttachmentApi(attachment.id);
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

// ── 删除与批量操作 ──────────────────────────────────────
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

    const res = await deletePaperApi(paper.id);

    if (res.code === 200) {
      ElMessage.success('论文删除成功');
      papers.value = papers.value.filter(p => p.id !== paper.id);
      total.value = Math.max(0, total.value - 1);
      clearSelection();

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

const batchDownload = async () => {
  try {
    ElMessage.success(`正在下载 ${selectedPaperIds.value.length} 篇论文...`);

    const res = await batchDownloadPapers(selectedPaperIds.value);
    const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'application/zip' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `批量论文下载_${new Date().getTime()}.zip`;
    link.click();
    window.URL.revokeObjectURL(url);

    ElMessage.success('打包下载已开始，请稍候...');
    clearSelection();
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

    const res = await createBatchCheckTasks(selectedPaperIds.value);

    if (res.code === 200) {
      ElMessage.success(`批量查重任务已提交，共 ${res.data?.totalCount || selectedPaperIds.value.length} 篇论文`);
      clearSelection();
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
    const selectedPapers = papers.value.filter(paper => selectedPaperIds.value.includes(paper.id));
    const invalidPapers = selectedPapers.filter(paper => !canDelete(paper));

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

    const res = await batchDeletePapers(selectedPaperIds.value);

    if (res.code === 200) {
      const deletedCount = res.data?.deletedCount || selectedPaperIds.value.length;
      ElMessage.success(`成功删除 ${deletedCount} 篇论文`);
      clearSelection();
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
// ── 表格 ──────────────────────────────────────────────────
.papers-table {
  width: 100%;
}

.paper-title-link {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: none;
  font-family: var(--app-font-family);
  font-size: var(--app-fs-caption);
  font-weight: 500;
  color: var(--app-color-ink);
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover {
    color: var(--app-color-primary);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
}

// 关键数据提权：20px / 600 / 语义色（颜色由全局 .similarity-* 类提供）
.similarity-value {
  display: inline-flex;
  align-items: center;
  height: 24px;
  font-family: var(--app-font-family);
  font-size: 20px;
  font-weight: 600;
  line-height: 1;
  font-variant-numeric: tabular-nums;

  &.similarity-unknown {
    font-size: var(--app-fs-caption);
    font-weight: 500;
  }
}

.row-actions {
  display: flex;
  align-items: center;
  gap: var(--app-space-1);
  white-space: nowrap;

  :deep(.el-button + .el-button) {
    margin-left: 0;
  }
}

.selected-count {
  font-size: var(--app-fs-caption);
  color: var(--app-color-text-muted);
}

.papers-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--app-space-2);
  padding: var(--app-space-10) var(--app-space-6);
  color: var(--app-color-text-muted);

  p {
    margin: 0;
    font-size: var(--app-fs-caption);
  }
}

.papers-empty-icon {
  font-size: 28px;
  color: var(--app-color-text-secondary);
}

// ── 版本抽屉 ─────────────────────────────────────────────
.drawer-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.drawer-title {
  font-family: var(--app-font-family);
  font-size: var(--app-fs-heading);
  font-weight: 600;
  color: var(--app-color-ink);
}

.drawer-sub {
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.version-drawer {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-3);
  min-height: 120px;
}

.version-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-3);
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
}

.version-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.version-item {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) auto;
  align-items: start;
  gap: var(--app-space-3);
  padding: var(--app-space-3) 0;
  border-bottom: 1px solid var(--app-color-divider);

  &:last-child {
    border-bottom: none;
  }
}

.version-body {
  min-width: 0;
}

.version-top {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--app-space-2);
}

.version-name {
  font-size: var(--app-fs-body);
  font-weight: 600;
  color: var(--app-color-ink);
}

.version-time {
  margin-left: auto;
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);
  font-variant-numeric: tabular-nums;
}

.version-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-4);
  margin-top: var(--app-space-1);
  font-size: var(--app-fs-meta);
  color: var(--app-color-text-muted);

  strong {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
}

.version-note {
  margin: var(--app-space-1) 0 0;
  font-size: var(--app-fs-meta);
  line-height: var(--app-lh-body);
  color: var(--app-color-text-secondary);
}

.version-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--app-space-2);
}

// ── 详情弹窗 ─────────────────────────────────────────────
.paper-detail {
  .feedback-content {
    background: var(--app-color-fill);
    padding: var(--app-space-4);
    border-radius: var(--app-radius-md);
    border-left: 4px solid var(--app-color-primary);
    font-size: var(--app-fs-caption);
    color: var(--app-color-ink);
    line-height: var(--app-lh-body);
  }

  .file-attachments {
    margin-top: var(--app-space-6);

    h4 {
      margin: 0 0 var(--app-space-3);
      font-family: var(--app-font-family);
      font-size: var(--app-fs-body);
      font-weight: 600;
      color: var(--app-color-ink);
    }
  }

  .attachment-item {
    display: flex;
    align-items: center;
    gap: var(--app-space-3);
    padding: var(--app-space-2) 0;
    border-bottom: 1px solid var(--app-color-divider);

    &:last-child {
      border-bottom: none;
    }

    .el-icon {
      color: var(--app-color-text-muted);
    }

    .file-name {
      flex: 1;
      min-width: 0;
      color: var(--app-color-ink);
      font-size: var(--app-fs-caption);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .file-size {
      color: var(--app-color-text-muted);
      font-size: var(--app-fs-meta);
      font-variant-numeric: tabular-nums;
    }
  }

  .attachment-empty {
    margin: 0;
    padding: var(--app-space-3) 0;
    font-size: var(--app-fs-meta);
    color: var(--app-color-text-muted);
  }
}

// ── 版本对比弹窗 ─────────────────────────────────────────
.version-compare-container {
  .compare-header {
    margin-bottom: var(--app-space-6);

    .alert-info {
      display: flex;
      align-items: center;
      gap: var(--app-space-2);
      padding: var(--app-space-3) var(--app-space-4);
      background: var(--app-color-info-bg);
      color: var(--app-color-primary);
      border-radius: var(--app-radius-md);

      .el-icon {
        font-size: 16px;
      }
    }
  }

  .version-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--app-space-6);
    margin-bottom: var(--app-space-6);
  }

  .version-column {
    background: var(--app-color-card-bg);
    border: 1px solid var(--app-color-border);
    border-radius: var(--app-radius-md);
    padding: var(--app-space-5);

    h4 {
      margin: 0 0 var(--app-space-3);
      font-family: var(--app-font-family);
      color: var(--app-color-ink);
      font-size: var(--app-fs-caption);
      font-weight: 600;
    }
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--app-space-2) 0;
    border-bottom: 1px solid var(--app-color-border-soft);

    &:last-child {
      border-bottom: none;
    }

    .info-label {
      font-size: var(--app-fs-caption);
      color: var(--app-color-text-muted);
    }

    .info-value {
      font-size: var(--app-fs-caption);
      color: var(--app-color-ink);
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
  }

  .diff-section {
    h4 {
      margin: 0 0 var(--app-space-3);
      color: var(--app-color-ink);
      font-size: var(--app-fs-body);
      font-weight: 600;
    }
  }

  .diff-table {
    background: var(--app-color-card-bg);
    border: 1px solid var(--app-color-border);
    border-radius: var(--app-radius-md);
    overflow: hidden;

    .table-header,
    .table-row {
      display: grid;
      grid-template-columns: 120px 1fr 1fr 100px;
      padding: var(--app-space-3) var(--app-space-4);
    }

    .table-header {
      background: var(--app-color-fill);
      border-bottom: 1px solid var(--app-color-border);

      .table-cell {
        font-size: var(--app-fs-meta);
        font-weight: 600;
        color: var(--app-color-text-muted);
      }
    }

    .table-row {
      border-bottom: 1px solid var(--app-color-divider);

      &:last-child {
        border-bottom: none;
      }

      .table-cell {
        font-size: var(--app-fs-caption);
        color: var(--app-color-ink);

        &.field {
          font-weight: 600;
        }

        &.change {
          display: flex;
          align-items: center;

          .change-badge {
            padding: 2px var(--app-space-2);
            border-radius: var(--app-radius-pill);
            font-size: var(--app-fs-meta);
            font-weight: 600;
            font-variant-numeric: tabular-nums;

            &.increase {
              background: var(--app-color-danger-bg);
              color: var(--app-color-danger);
            }

            &.decrease {
              background: var(--app-color-fill);
              color: var(--app-color-success);
            }
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .similarity-value {
    font-size: 18px;
  }

  .version-item {
    grid-template-columns: 20px minmax(0, 1fr);
  }

  .version-actions {
    grid-column: 2;
    justify-content: flex-end;
  }

  .version-columns {
    grid-template-columns: 1fr;
  }

  .diff-table {
    .table-header,
    .table-row {
      grid-template-columns: 100px 1fr;
    }
  }
}
</style>
