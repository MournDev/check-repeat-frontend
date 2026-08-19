<template>
  <div class="my-papers-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">我的论文</h1>
      <p class="page-desc">管理您的所有论文提交记录</p>
      <div class="header-actions">
        <el-button type="primary" :icon="UploadFilled" @click="goToPaperSubmit">
          提交新论文
        </el-button>
      </div>
    </div>

    <!-- 筛选和搜索 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filterForm" inline>
        <el-form-item label="论文状态">
          <el-select
            v-model="filterForm.paperStatus"
            placeholder="全部状态"
            clearable
            @change="fetchPapers"
          >
            <el-option
              v-for="item in paperStatusDictList"
              :key="item.dictValue"
              :label="item.dictLabel"
              :value="item.dictValue"
            >
            </el-option>
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
            @change="fetchPapers"
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="filterForm.paperTitle"
            placeholder="搜索论文标题..."
            :prefix-icon="Search"
            style="width: 240px"
            @keyup.enter="fetchPapers"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="fetchPapers">
            搜索
          </el-button>
          <el-button :icon="Refresh" @click="handleReset"> 重置 </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 论文列表 -->
    <el-card class="papers-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Document /></el-icon>
            论文列表
          </span>
          <div class="header-actions-group">
            <!-- 批量操作工具栏 -->
            <div v-if="selectedPaperIds.length > 0" class="batch-toolbar">
              <el-tag type="info" size="small">
                已选择 {{ selectedPaperIds.length }} 篇论文
              </el-tag>
              <el-button 
                type="primary" 
                size="small" 
                :icon="Download" 
                @click="batchDownload"
              >
                批量下载
              </el-button>
              <el-button 
                type="success" 
                size="small" 
                :icon="Document" 
                @click="batchCheckPlagiarism"
              >
                批量查重
              </el-button>
              <el-button 
                type="danger" 
                size="small" 
                :icon="Delete" 
                @click="batchDelete"
              >
                批量删除
              </el-button>
              <el-divider direction="vertical" />
              <el-checkbox 
                v-model="selectAll" 
                @change="handleSelectAll"
              >
                全选
              </el-checkbox>
            </div>
            <span v-else class="card-extra"> 共 {{ total }} 篇论文 </span>
          </div>
        </div>
      </template>

      <div class="papers-list">
        <div
          v-for="paper in papers"
          :key="paper.id"
          class="paper-item"
          :class="{ 'paper-active': paper.id === activePaperId, 'paper-selected': selectedPaperIds.includes(paper.id) }"
        >
          <!-- 批量选择 -->
          <div class="paper-select">
            <el-checkbox 
              v-model="selectedPaperIds" 
              :label="paper.id" 
              @change="handlePaperSelect"
            />
          </div>
          <div class="paper-main">
            <div class="paper-header">
              <h4 class="paper-title">{{ paper.paperTitle }}</h4>
              <div class="paper-actions">
                <el-button
                  v-if="paper.paperStatus === 'rejected'"
                  type="primary"
                  text
                  :icon="Upload"
                  @click="submitRevision(paper.id)"
                >
                  提交修改
                </el-button>
                <!-- 重新编辑已撤回论文 -->
                <el-button
                  v-if="paper.paperStatus === 'withdrawn'"
                  type="primary"
                  text
                  :icon="EditPen"
                  @click="resubmitPaper(paper)"
                >
                  重新编辑
                </el-button>
                <!-- 撤回申请 -->
                <el-button
                  v-if="['pending', 'checking', 'auditing'].includes(paper.paperStatus)"
                  type="warning"
                  text
                  :icon="RefreshLeft"
                  @click="withdrawPaper(paper)"
                >
                  申请撤回
                </el-button>
                <!-- 申请修改 -->
                <el-button
                  v-if="paper.paperStatus === 'PASSED'"
                  type="info"
                  text
                  :icon="EditPen"
                  @click="requestModification(paper)"
                >
                  申请修改
                </el-button>
                <el-button text :icon="View" @click="viewPaperDetail(paper)">
                  查看详情
                </el-button>
                <el-button text :icon="Download" @click="downloadPaper(paper)">
                  下载
                </el-button>
                <!-- 查重功能按钮 -->
                <el-button 
                  v-if="paper.paperStatus !== 'DRAFT'" 
                  text 
                  :icon="Document" 
                  @click="viewPlagiarismReport(paper.id)"
                >
                  查重报告
                </el-button>
                <el-button 
                  v-if="paper.paperStatus !== 'DRAFT'" 
                  text 
                  :icon="Monitor" 
                  @click="monitorCheckProgress(paper.id)"
                >
                  查重监控
                </el-button>
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
                <!-- 新增论文类型 -->
              </div>
              <div class="meta-item">
                <el-icon><Files /></el-icon>
                <span>相似度：{{ paper.similarityRate }}%</span>
                <!-- 显示相似度 -->
              </div>
            </div>

            <div class="paper-status">
              <el-tag :type="getStatusType(paper.paperStatus)" effect="light">
                {{ getStatusText(paper.paperStatus) }}
              </el-tag>
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
            <el-timeline>
              <el-timeline-item
                v-for="version in paper.versions"
                :key="version.id"
                :timestamp="formatDate(version.submitTime)"
                :type="version.isCurrent ? 'primary' : 'info'"
              >
                <div class="version-item">
                  <span class="version-title">版本 v{{ version.version }}</span>
                  <el-tag v-if="version.isCurrent" type="primary" size="small">
                    当前版本
                  </el-tag>
                  <div class="version-actions">
                    <el-checkbox 
                      v-model="selectedVersionIds" 
                      :label="version.id" 
                      size="small"
                      @change="handleVersionSelection"
                    >
                      对比
                    </el-checkbox>
                    <el-button
                      text
                      :icon="View"
                      size="small"
                      @click="viewVersionDetail(version)"
                    >
                      查看
                    </el-button>
                    <el-button
                      text
                      :icon="Download"
                      size="small"
                      @click="downloadVersion(version)"
                    >
                      下载
                    </el-button>
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>

          <div class="paper-toggle">
            <el-button
              text
              :icon="paper.showVersions ? 'ArrowUp' : 'ArrowDown'"
              @click="toggleVersions(paper.id)"
            >
              {{ paper.showVersions ? "收起" : "展开" }}版本历史
            </el-button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="papers.length === 0" class="empty-state">
        <el-empty description="暂无论文提交记录">
          <el-button
            type="primary"
            :icon="UploadFilled"
            @click="goToPaperSubmit"
          >
            立即提交论文
          </el-button>
        </el-empty>
      </div>
      <div v-if="papers.length > 0" class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :page-sizes="[5, 10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

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
              <el-button 
                type="primary" 
                text 
                :icon="Download" 
                size="small"
                @click="downloadAttachment(file)"
              >
                下载
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button
          v-if="currentPaper?.paperStatus === 'rejected'"
          type="primary"
          :icon="Upload"
          @click="submitRevision(currentPaper.id)"
        >
          提交修改版本
        </el-button>
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
          <el-alert 
            title="已选择以下两个版本进行对比" 
            type="info" 
            :closable="false" 
            show-icon 
          />
        </div>

        <div class="compare-content">
          <el-row :gutter="20">
            <!-- 左侧：版本 A -->
            <el-col :span="12">
              <div class="version-column">
                <h4>版本 A (v{{ compareVersions[0]?.version }})</h4>
                <el-descriptions :column="1" border size="small">
                  <el-descriptions-item label="提交时间">
                    {{ formatDate(compareVersions[0]?.submitTime) }}
                  </el-descriptions-item>
                  <el-descriptions-item label="相似度">
                    {{ compareVersions[0]?.similarityRate }}%
                  </el-descriptions-item>
                  <el-descriptions-item label="字数">
                    {{ compareVersions[0]?.wordCount }}字
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </el-col>

            <!-- 右侧：版本 B -->
            <el-col :span="12">
              <div class="version-column">
                <h4>版本 B (v{{ compareVersions[1]?.version }})</h4>
                <el-descriptions :column="1" border size="small">
                  <el-descriptions-item label="提交时间">
                    {{ formatDate(compareVersions[1]?.submitTime) }}
                  </el-descriptions-item>
                  <el-descriptions-item label="相似度">
                    {{ compareVersions[1]?.similarityRate }}%
                  </el-descriptions-item>
                  <el-descriptions-item label="字数">
                    {{ compareVersions[1]?.wordCount }}字
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </el-col>
          </el-row>

          <!-- 差异对比区域 -->
          <div class="diff-section">
            <h4>主要变化</h4>
            <el-table :data="getDiffData()" border size="small">
              <el-table-column prop="field" label="对比项" width="120" />
              <el-table-column prop="before" label="版本 A" />
              <el-table-column prop="after" label="版本 B" />
              <el-table-column prop="change" label="变化" width="100">
                <template #default="{ row }">
                  <el-tag 
                    :type="row.change > 0 ? 'danger' : 'success'" 
                    size="small"
                  >
                    {{ row.change > 0 ? '+' : '' }}{{ row.change }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="versionCompareDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="downloadCompareReport">
          <el-icon><Download /></el-icon>
          下载对比报告
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { getDictDataByType } from "@/api/user.js";
import { 
  getStudentPaperPage, 
  withdrawPaper as withdrawPaperApi, 
  requestModification as requestModificationApi,
  downloadPaper as downloadPaperApi,
  batchDownloadPapers,
  batchDeletePapers,
  getVersionDetail,
  comparePaperVersions,
  downloadVersionCompare,
  downloadVersion as downloadVersionApi,
  downloadAttachment as downloadAttachmentApi
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
} from "@element-plus/icons-vue";
import useStore from "element-plus/es/components/table/src/store/index.mjs";

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
    papers.value = res.data; // 赋值后端返回的论文列表
    papers.value = res.data.records; // 论文列表数据

    total.value = res.data.total; // 论文总数
    ElMessage.success(`查询成功${total.value}篇论文`);
  } catch (error) {
    ElMessage.error("查询论文失败，请重试");
    console.error("论文查询失败：", error);
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
  console.log("查看论文详情:", paper);
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
    const blob = new Blob([res.data], { type: 'application/octet-stream' });
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

const toggleVersions = (paperId) => {
  const paper = papers.value.find((p) => p.id === paperId);
  if (paper) {
    paper.showVersions = !paper.showVersions;
  }
};

// 状态映射
const getStatusType = (status) => {
  const typeMap = {
    pending: "info",
    checking: "warning",
    withdrawn: "warning",
    auditing: "primary",
    completed: "success",
    rejected: "danger",
  };
  return typeMap[status] || "info";
};

const getStatusText = (status) => {
  const textMap = {
    assigned: "已分配",
    withdrawn: "已撤回",
    pending: "待分配",
    checking: "待查重",
    auditing: "审核中",
    completed: "已完成",
    rejected: "需修改",
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
      `确定要撤回论文《${paper.paperTitle}》吗？\n请简要说明撤回理由：`,
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
    // 再弹窗选择原因类型和详细描述
    try {
      await ElMessageBox({
        title: '请选择撤回原因类型',
        message: h('div', {}, [
          h(ElSelect, {
            modelValue: selectedReasonType.value,
            placeholder: '请选择原因类型',
            style: 'width: 100%; margin-bottom: 15px;',
            onChange: (value) => {
              selectedReasonType.value = value;
            }
          }, {
            default: () => [
              h(ElOption, { label: '个人原因', value: 'PERSONAL' }),
              h(ElOption, { label: '格式问题', value: 'FORMAT' }),
              h(ElOption, { label: '内容问题', value: 'CONTENT' }),
              h(ElOption, { label: '其他', value: 'OTHER' })
            ]
          }),
          h(ElInput, {
            modelValue: reasonDetail.value,
            placeholder: '详细原因描述（可选）',
            type: 'textarea',
            rows: 3,
            maxlength: 500,
            showWordLimit: true,
            style: 'margin-top: 10px;',
            'onUpdate:modelValue': (value) => {
              reasonDetail.value = value;
            }
          })
        ]),
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        customClass: 'reason-type-dialog',
        distinguishCancelAndClose: true // 区分取消按钮和关闭动作
      });
    } catch (action) {
      // 如果用户点击了取消或关闭对话框
      if (action === 'cancel') {
        console.log('用户取消了撤回操作');
        return; // 直接返回，不执行后续逻辑
      }
      throw action; // 其他错误继续抛出
    }

    // 验证是否选择了原因类型
    if (!selectedReasonType.value) {
      ElMessage.warning('请选择撤回原因类型');
      return;
    }

    // 调用撤回接口
    const res = await withdrawPaperApi(paper.id, selectedReasonType.value, reasonDetail.value);

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
  router.push(`/student/plagiarism-report/${paperId}`);
};

const monitorCheckProgress = async (paperId) => {
  try {
    // 先获取查重任务详情，获取 taskId
    const taskRes = await getCheckTaskDetail(paperId);
    if (taskRes.code === 200 && taskRes.data) {
      const taskId = taskRes.data.taskId || taskRes.data.id;
      if (taskId) {
        router.push(`/student/check-monitor/${taskId}`);
      } else {
        ElMessage.error('未找到查重任务');
      }
    } else {
      ElMessage.error('获取查重任务信息失败');
    }
  } catch (error) {
    console.error('获取查重任务失败:', error);
    ElMessage.error('获取查重任务失败，请稍后重试');
  }
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

const compareTwoVersions = async () => {
  try {
    // TODO: 调用版本对比接口
    // const res = await comparePaperVersions(paperId, selectedVersionIds.value);
    // compareData.value = res.data;
    
    ElMessage.success('版本对比数据已加载');
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
      p.versions?.some(v => selectedVersionIds.value.includes(v.id))
    )?.id;
    
    if (!paperId) {
      ElMessage.error('无法获取论文信息');
      return;
    }
    
    // 调用下载对比报告接口
    const res = await downloadVersionCompare(paperId, selectedVersionIds.value);
    
    // 创建下载链接
    const blob = new Blob([res.data], { type: 'application/pdf' });
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
      p.versions?.some(v => v.id === version.id)
    )?.id;
    
    if (!paperId) {
      ElMessage.error('无法获取论文信息');
      return;
    }
    
    // 调用获取版本详情接口
    const res = await getVersionDetail(paperId, version.id);
    
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
    await ElMessageBox.confirm(`确定要下载版本 V${version.version} 吗？`, '下载确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    });
    
    // 调用下载版本接口
    const res = await downloadVersionApi(version.id);
    
    // 创建下载链接
    const blob = new Blob([res.data], { type: 'application/octet-stream' });
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
    const blob = new Blob([res.data], { type: 'application/octet-stream' });
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
    const blob = new Blob([res.data], { type: 'application/zip' });
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
.my-papers-page {
  padding: 0;
}

.page-header {
  margin-bottom: 1.5rem;

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

  .header-actions {
    margin-top: 1rem;
  }
}

.filter-card {
  margin-bottom: 1.5rem;
  border-radius: 12px;
  border: 1px solid #f1f2f6;

  :deep(.el-card__body) {
    padding: 1.25rem;
  }
}

.papers-card {
  border-radius: 12px;
  border: 1px solid #f1f2f6;

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

      .card-extra {
        color: #7f8c8d;
        font-size: 0.875rem;
      }
    }
  }
}

.header-actions-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  
  .batch-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    
    .el-tag {
      flex-shrink: 0;
    }
    
    .el-button {
      flex-shrink: 0;
    }
    
    .el-divider {
      margin: 0 8px;
    }
    
    .el-checkbox {
      margin-left: auto;
    }
  }
}

.papers-list {
  .paper-item {
    border: 1px solid #f1f2f6;
    border-radius: 8px;
    margin-bottom: 1rem;
    transition: all 0.3s ease;
    display: flex;
    gap: 1rem;

    &:hover {
      border-color: #667eea;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
    }

    &.paper-selected {
      border-color: #409eff;
      background-color: rgba(64, 158, 255, 0.05);
      box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
    }

    .paper-select {
      display: flex;
      align-items: center;
      flex-shrink: 0;
      padding-top: 8px;
    }

    &.paper-active {
      border-color: #667eea;
      background-color: #f8f9ff;
    }

    .paper-main {
      padding: 1.25rem;
    }

    .paper-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;

      .paper-title {
        margin: 0;
        color: #2c3e50;
        font-size: 1.1rem;
        flex: 1;
        margin-right: 1rem;
      }

      .paper-actions {
        display: flex;
        gap: 0.5rem;
      }
    }

    .paper-meta {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 1rem;

      .meta-item {
        display: flex;
        align-items: center;
        color: #7f8c8d;
        font-size: 0.875rem;

        .el-icon {
          margin-right: 0.5rem;
          color: #667eea;
        }
      }
    }

    .paper-status {
      display: flex;
      align-items: center;
      gap: 1rem;

      .feedback-brief {
        color: #e74c3c;
        font-size: 0.875rem;
        font-style: italic;
      }
    }

    .paper-versions {
      border-top: 1px solid #f1f2f6;
      padding: 1rem 1.25rem;
      background-color: #f8f9fa;

      .versions-header {
        margin-bottom: 1rem;

        h5 {
          margin: 0;
          color: #2c3e50;
        }
      }

      .version-item {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .version-title {
          font-weight: 500;
          color: #2c3e50;
        }

        .version-actions {
          display: flex;
          gap: 0.5rem;
        }
      }
    }

    .paper-toggle {
      border-top: 1px solid #f1f2f6;
      padding: 0.75rem 1.25rem;
      text-align: center;
      background-color: #f8f9fa;
    }
  }
}

.empty-state {
  padding: 3rem 0;
}

.paper-detail {
  .feedback-content {
    background-color: #f8f9fa;
    padding: 1rem;
    border-radius: 4px;
    border-left: 4px solid #667eea;
  }

  .file-attachments {
    margin-top: 1.5rem;

    h4 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
    }

    .attachment-list {
      .attachment-item {
        display: flex;
        align-items: center;
        padding: 0.75rem;
        border: 1px solid #f1f2f6;
        border-radius: 6px;
        margin-bottom: 0.5rem;

        .el-icon {
          margin-right: 0.5rem;
          color: #667eea;
        }

        .file-name {
          flex: 1;
          color: #2c3e50;
        }

        .file-size {
          margin: 0 1rem;
          color: #7f8c8d;
          font-size: 0.875rem;
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .paper-header {
    flex-direction: column;
    align-items: flex-start !important;

    .paper-title {
      margin-right: 0 !important;
      margin-bottom: 1rem;
    }
  }

  .paper-meta {
    flex-direction: column;
    gap: 0.5rem !important;
  }

  .paper-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  // 版本对比样式
  .version-compare-container {
    .compare-header {
      margin-bottom: 20px;
    }
  
    .compare-content {
      .version-column {
        h4 {
          margin-bottom: 16px;
          color: #303133;
          font-size: 16px;
        }
  
        :deep(.el-descriptions) {
          .el-descriptions__label {
            width: 100px;
          }
        }
      }
  
      .diff-section {
        margin-top: 24px;
  
        h4 {
          margin-bottom: 16px;
          color: #303133;
          font-size: 16px;
        }
      }
    }
  }
}
</style>