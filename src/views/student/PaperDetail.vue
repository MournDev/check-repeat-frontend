<template>
    <div class="paper-details-container">
        <!-- 页面头部 -->
        <div class="paper-header">
            <div class="header-content">
                <div class="back-section">
                    <el-button :icon="ArrowLeft" text @click="goBack" class="back-btn">
                        返回论文列表
                    </el-button>
                </div>

                <div class="title-section">
                    <h1 class="paper-title">{{ paperDetails.paperTitle }}</h1>
                    <div class="paper-status-row">
                        <el-tag :type="getStatusType(paperDetails.paperStatus)" effect="light" size="large"
                            class="status-tag">
                            {{ getStatusText(paperDetails.paperStatus) }}
                        </el-tag>
                        <div class="paper-meta">
                            <span class="meta-item">
                                <el-icon>
                                    <Calendar />
                                </el-icon>
                                提交时间：{{ formatDateTime(paperDetails.submitTime) }}
                            </span>
                            <span class="meta-item">
                                <el-icon>
                                    <Document />
                                </el-icon>
                                论文ID：{{ paperDetails.id }}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="action-section">
                    <el-button-group class="header-actions">
                        <el-button type="primary" :icon="Edit" @click="editPaper" size="large">
                            修改
                        </el-button>
                        <el-button :icon="Download" @click="downloadPaper" size="large">
                            下载
                        </el-button>
                        <el-dropdown @command="handleMoreActions">
                            <el-button :icon="More" size="large" />
                            <template #dropdown>
                                <el-dropdown-menu>
                                    <el-dropdown-item :icon="Share" command="share">分享</el-dropdown-item>
                                    <el-dropdown-item :icon="Printer" command="print">打印</el-dropdown-item>
                                    <el-dropdown-item :icon="Delete" command="delete" divided>删除</el-dropdown-item>
                                </el-dropdown-menu>
                            </template>
                        </el-dropdown>
                    </el-button-group>
                </div>
            </div>
        </div>

        <!-- 主要内容区域 -->
        <div class="paper-content">
            <el-row :gutter="24">
                <!-- 左侧：论文核心信息 -->
                <el-col :xs="24" :lg="16">
                    <!-- 论文摘要 -->
                    <el-card class="section-card" shadow="hover">
                        <template #header>
                            <div class="section-header">
                                <el-icon>
                                    <Document />
                                </el-icon>
                                <span class="section-title">论文摘要</span>
                            </div>
                        </template>

                        <div class="abstract-content">
                            {{ paperDetails.paperAbstract }}
                        </div>

                        <div class="abstract-footer">
                            <div class="word-count-info">
                                <span class="count-label">字数统计：</span>
                                <span class="count-value">{{ paperDetails.wordCount || 0 }}</span>
                                <span class="count-unit">字</span>
                                <el-progress :percentage="getWordCountPercentage(paperDetails.wordCount)"
                                    :stroke-width="6" :show-text="false" class="count-progress" />
                            </div>
                        </div>
                    </el-card>

                    <!-- 论文详情 -->
                    <el-card class="section-card" shadow="hover">
                        <template #header>
                            <div class="section-header">
                                <el-icon>
                                    <List />
                                </el-icon>
                                <span class="section-title">论文详情</span>
                            </div>
                        </template>

                        <div class="details-grid">
                            <div class="detail-item">
                                <span class="detail-label">学科领域：</span>
                                <span class="detail-value">
                                    {{ findSubjectLabelByCode(paperDetails.subjectCode) }}
                                </span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">论文类型：</span>
                                <el-tag :type="getPaperTypeTag(paperDetails.paperType)" size="small">
                                    {{ getPaperTypeText(paperDetails.paperType) }}
                                </el-tag>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">文档格式：</span>
                                <span class="detail-value">{{ paperDetails.fileFormat || '.docx' }}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">文件大小：</span>
                                <span class="detail-value">{{ fileInfo?.fileSizeDesc }}</span>
                            </div>
                        </div>

                        <div class="keywords-section">
                            <span class="keywords-label">关键词：</span>
                            <div class="keywords-container">
                                <el-tag v-for="keyword in paperDetails.keywords" :key="keyword" type="info" size="small"
                                    class="keyword-tag">
                                    {{ keyword }}
                                </el-tag>
                                <span v-if="!paperDetails.keywords?.length" class="no-keywords">未设置关键词</span>
                            </div>
                        </div>
                    </el-card>

                    <!-- 相似度检测 -->
                    <el-card class="section-card similarity-card" shadow="hover">
                        <template #header>
                            <div class="section-header">
                                <el-icon>
                                    <TrendCharts />
                                </el-icon>
                                <span class="section-title">相似度检测</span>
                                <el-tag v-if="checkTask" :type="getCheckStatusTag(checkTask.checkStatus)" size="small">
                                    {{ getCheckStatusText(checkTask.checkStatus) }}
                                </el-tag>
                                <el-tag v-else type="info" size="small">未检测</el-tag>
                            </div>
                        </template>

                        <div class="similarity-content">
                            <div class="similarity-main">
                                <div class="similarity-value">
                                    <el-progress type="dashboard" :percentage="getSimilarityRate" :width="100"
                                        :stroke-width="10" :color="getSimilarityColor(getSimilarityRate)">
                                        <template #default="{ percentage }">
                                            <span class="percentage-value">{{ percentage }}%</span>
                                        </template>
                                    </el-progress>
                                </div>
                                <div class="similarity-info">
                                    <div class="similarity-status">
                                        <el-tag :type="getSimilarityTagType(getSimilarityRate)" size="large"
                                            effect="light">
                                            {{ getSimilarityStatus(getSimilarityRate) }}
                                        </el-tag>
                                    </div>
                                    <!-- 显示检测任务详情 -->
                                    <div v-if="checkTask" class="similarity-details">
                                        <div class="detail-item">
                                            <span class="detail-label">任务编号：</span>
                                            <span class="detail-value">{{ checkTask.taskNo || '--' }}</span>
                                        </div>
                                        <div class="detail-item" v-if="checkTask.startTime">
                                            <span class="detail-label">开始时间：</span>
                                            <span class="detail-value">{{ formatDateTime(checkTask.startTime) }}</span>
                                        </div>
                                        <div class="detail-item" v-if="checkTask.endTime">
                                            <span class="detail-label">结束时间：</span>
                                            <span class="detail-value">{{ formatDateTime(checkTask.endTime) }}</span>
                                        </div>
                                        <div class="detail-item" v-if="checkTask.failReason">
                                            <span class="detail-label">失败原因：</span>
                                            <span class="detail-value error-text">{{ checkTask.failReason }}</span>
                                        </div>
                                    </div>
                                    <div class="similarity-tips">
                                        <el-icon>
                                            <InfoFilled />
                                        </el-icon>
                                        <span>{{ getSimilarityTips(getSimilarityRate) }}</span>
                                    </div>
                                    <div class="similarity-actions">
                                        <el-button type="primary" :icon="Refresh" size="small"
                                            @click="recheckSimilarity">
                                            重新检测
                                        </el-button>

                                        <el-button type="success" :icon="View" size="small"
                                            @click="viewSimilarityReport">
                                            查看报告
                                        </el-button>
                                    </div>

                                    <!-- 独立出来的弹窗（放在相似度卡片外面） -->
                                    <el-dialog v-model="similarityPreviewVisible" title="相似度报告预览" width="90%" top="5vh"
                                        destroy-on-close @closed="closeSimilarityPreview">
                                        <div class="preview-wrapper" v-loading="similarityPreviewLoading">
                                            <iframe v-if="similarityPreviewUrl && !similarityPreviewError"
                                                :src="similarityPreviewUrl" class="preview-iframe"
                                                @load="onSimilarityIframeLoad"
                                                @error="onSimilarityIframeError"></iframe>

                                            <div v-if="similarityPreviewError" class="preview-error">
                                                <el-empty description="报告加载失败">
                                                    <p class="error-detail">{{ similarityErrorMessage }}</p>
                                                    <div style="margin-top: 16px;">
                                                        <el-button type="primary" @click="retrySimilarityPreview">
                                                            <el-icon>
                                                                <Refresh />
                                                            </el-icon>
                                                            重新加载
                                                        </el-button>
                                                        <el-button @click="closeSimilarityPreview">关闭</el-button>
                                                    </div>
                                                </el-empty>
                                            </div>
                                        </div>

                                        <template #footer>
                                            <div class="preview-footer">
                                                <div class="file-info">
                                                    <span class="file-name">相似度检测报告</span>
                                                    <span class="file-size" v-if="currentSimilarityFileSize">
                                                        • {{ currentSimilarityFileSize }}
                                                    </span>
                                                </div>
                                                <div class="footer-actions">
                                                    <el-button @click="downloadSimilarityReport">
                                                        <el-icon>
                                                            <Download />
                                                        </el-icon>
                                                        下载报告
                                                    </el-button>
                                                    <el-button @click="openReportInNewWindow">
                                                        <el-icon>
                                                            <FullScreen />
                                                        </el-icon>
                                                        新窗口
                                                    </el-button>
                                                    <el-button @click="closeSimilarityReport">
                                                        关闭</el-button>
                                                </div>
                                            </div>
                                        </template>
                                    </el-dialog>
                                </div>
                            </div>
                        </div>
                    </el-card>

                    <!-- 审核进度 -->
                    <el-card class="section-card" shadow="hover">
                        <template #header>
                            <div class="section-header">
                                <el-icon>
                                    <Timer />
                                </el-icon>
                                <span class="section-title">审核进度</span>
                            </div>
                        </template>

                        <div class="progress-section">
                            <el-steps :active="getActiveStep(paperDetails.paperStatus)" finish-status="success"
                                align-center>
                                <el-step title="提交论文" :description="formatDate(paperDetails.submitTime)" />
                                <el-step :title="paperDetails.teacherName ? '分配导师' : '等待分配'"
                                    :description="paperDetails.teacherName || '处理中'" />
                                <el-step :title="getReviewStepTitle(paperDetails.paperStatus)"
                                    :description="getReviewStepDesc(paperDetails)" />
                                <el-step title="审核完成" description="--" />
                            </el-steps>
                        </div>
                    </el-card>

                    <!-- 导师反馈 -->
                    <el-card v-if="paperDetails.feedback" class="section-card feedback-card" shadow="hover">
                        <template #header>
                            <div class="section-header">
                                <div class="feedback-header-left">
                                    <el-icon>
                                        <ChatLineRound />
                                    </el-icon>
                                    <span class="section-title">导师反馈</span>
                                </div>
                                <div class="feedback-header-right">
                                    <span class="advisor-name">{{ paperDetails.teacherName }}</span>
                                    <span class="feedback-time">{{ formatDate(paperDetails.feedbackTime) }}</span>
                                </div>
                            </div>
                        </template>

                        <div class="feedback-content">
                            {{ paperDetails.feedback }}
                        </div>

                        <div class="feedback-actions">
                            <el-button :icon="ChatDotRound" @click="contactAdvisor">
                                联系导师
                            </el-button>
                            <el-button :icon="Edit" @click="replyToFeedback">
                                回复反馈
                            </el-button>
                        </div>
                    </el-card>
                </el-col>

                <!-- 右侧：相关信息 -->
                <el-col :xs="24" :lg="8">
                    <!-- 指导老师 -->
                    <el-card class="sidebar-card" shadow="hover">
                        <template #header>
                            <div class="section-header">
                                <el-icon>
                                    <UserFilled />
                                </el-icon>
                                <span class="section-title">指导老师</span>
                            </div>
                        </template>

                        <div v-if="paperDetails.teacherName" class="advisor-info">
                            <div class="advisor-avatar-section">
                                <el-avatar :size="60" :src="getAvatarUrl(paperDetails.advisorAvatar)" class="advisor-avatar">
                                    {{ paperDetails.advisorName?.charAt(0) }}
                                </el-avatar>
                                <div class="advisor-basic">
                                    <h4 class="advisor-name">{{ paperDetails.teacherName }}</h4>
                                    <p class="advisor-title">{{ paperDetails.advisorTitle || '教授' }}</p>
                                </div>
                            </div>

                            <div class="advisor-contact">
                                <div class="contact-item">
                                    <el-icon>
                                        <Phone />
                                    </el-icon>
                                    <span>{{ advisorInfo?.phone }}</span>
                                </div>
                                <div class="contact-item">
                                    <el-icon>
                                        <Message />
                                    </el-icon>
                                    <span>{{ advisorInfo?.email }}</span>
                                </div>
                                <div class="contact-item">
                                    <el-icon>
                                        <OfficeBuilding />
                                    </el-icon>
                                    <span>{{ paperDetails.advisorOffice || '--' }}</span>
                                </div>
                            </div>

                            <div class="advisor-actions">
                                <el-button type="primary" :icon="ChatDotRound" @click="contactAdvisor"
                                    class="contact-btn">
                                    联系导师
                                </el-button>
                            </div>
                        </div>

                        <div v-else class="no-advisor">
                            <el-empty description="暂未分配指导老师" :image-size="60" />
                            <p class="no-advisor-tips">系统将在论文提交后自动分配</p>
                        </div>
                    </el-card>


                    <!-- 论文附件 -->
                    <el-card class="sidebar-card" shadow="hover">
                        <template #header>
                            <div class="section-header">
                                <el-icon>
                                    <Paperclip />
                                </el-icon>
                                <span class="section-title">论文文件</span>
                                <el-button v-if="!fileInfo" text size="small" :icon="Plus" @click="uploadFile"
                                    class="add-file" />
                            </div>
                        </template>

                        <!-- 文件信息展示 -->
                        <div v-if="fileInfo && fileInfo.id" class="file-info-container">
                            <!-- 文件基本信息 -->
                            <div class="file-card">
                                <div class="file-header">
                                    <div class="file-icon-wrapper" :class="getFileIconClass(fileInfo.originalFilename)">
                                        <el-icon :size="28">
                                            <component :is="getFileIcon(fileInfo.originalFilename)" />
                                        </el-icon>
                                    </div>
                                    <div class="file-main-info">
                                        <div class="file-name" :title="fileInfo.originalFilename">
                                            {{ fileInfo.originalFilename }}
                                        </div>
                                        <div class="file-meta">
                                            <span class="meta-item">
                                                <el-icon size="12">
                                                    <Document />
                                                </el-icon>
                                                {{ fileInfo.fileSizeDesc }}
                                            </span>
                                            <span class="meta-item" v-if="fileInfo.wordCount > 0">
                                                <el-icon size="12">
                                                    <EditPen />
                                                </el-icon>
                                                {{ fileInfo.wordCount }}字
                                            </span>
                                            <span class="meta-item">
                                                <el-icon size="12">
                                                    <Clock />
                                                </el-icon>
                                                {{ formatDate(fileInfo.uploadTime) }}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <!-- 文件操作 -->
                                <div class="file-actions">
                                    <el-button-group>
                                        <el-tooltip content="下载文件" placement="top">
                                            <el-button type="primary" :icon="Download" @click="downloadFile(fileInfo)"
                                                circle size="small" />
                                        </el-tooltip>
                                        <el-tooltip content="在线预览" placement="top">
                                            <el-button :icon="View" @click="previewFile(fileInfo)" circle
                                                size="small" />
                                        </el-tooltip>
                                        <el-tooltip content="替换文件" placement="top">
                                            <el-button :icon="Refresh" @click="replaceFile(fileInfo)" circle
                                                size="small" />
                                        </el-tooltip>
                                        <el-tooltip content="删除文件" placement="top">
                                            <el-button :icon="Delete" @click="deleteFile(fileInfo)" circle size="small"
                                                type="danger" />
                                        </el-tooltip>
                                    </el-button-group>
                                </div>
                            </div>

                            <!-- 文件状态提示 -->
                            <div class="file-status-tip" v-if="fileInfo.wordCount === 0">
                                <el-alert title="字数统计未完成" type="info" :closable="false" show-icon
                                    description="系统正在统计文件字数，请稍后刷新查看" size="small" />
                            </div>
                        </div>

                        <!-- 无文件时的显示 -->
                        <div v-else class="no-file">
                            <div class="empty-state">
                                <el-icon :size="48" color="#c0c4cc">
                                    <Document />
                                </el-icon>
                                <p class="empty-text">暂无论文文件</p>
                                <el-button type="primary" :icon="Upload" @click="uploadFile" size="large">
                                    上传论文文件
                                </el-button>
                            </div>
                        </div>
                    </el-card>

                    <!-- 审核历史 -->
                    <el-card v-if="paperDetails.reviewHistory?.length" class="sidebar-card" shadow="hover">
                        <template #header>
                            <div class="section-header">
                                <el-icon>
                                    <History />
                                </el-icon>
                                <span class="section-title">审核历史</span>
                            </div>
                        </template>

                        <div class="review-history">
                            <div v-for="review in paperDetails.reviewHistory" :key="review.id" class="review-item">
                                <div class="review-header">
                                    <div class="reviewer-info">
                                        <el-avatar :size="24" :src="getAvatarUrl(review.reviewerAvatar)" class="reviewer-avatar">
                                            {{ review.reviewerName?.charAt(0) }}
                                        </el-avatar>
                                        <span class="reviewer-name">{{ review.reviewerName }}</span>
                                        <el-tag size="mini" :type="getReviewTypeTag(review.type)">
                                            {{ getReviewTypeText(review.type) }}
                                        </el-tag>
                                    </div>
                                    <div class="review-time">{{ formatDate(review.reviewTime) }}</div>
                                </div>
                                <div class="review-content">
                                    {{ review.comments }}
                                </div>
                            </div>
                        </div>
                    </el-card>
                </el-col>
            </el-row>
        </div>
        <!-- 文件预览弹框 -->
        <el-dialog v-model="previewVisible" :title="previewTitle" width="90%" top="5vh" destroy-on-close
            @closed="resetPreview" class="file-preview-dialog">
            <div class="preview-wrapper" v-loading="previewLoading">
                <!-- 统一用iframe加载所有类型（后端+kkfileview自动处理格式转换） -->
                <iframe v-if="previewUrl && !previewError" :src="previewUrl" class="preview-iframe" @load="onIframeLoad"
                    @error="onIframeError"></iframe>

                <!-- 错误状态 -->
                <div v-if="previewError" class="preview-error">
                    <el-empty description="文件预览加载失败">
                        <p class="error-detail">{{ errorMessage }}</p>
                        <el-button type="primary" @click="retryPreview">
                            <el-icon>
                                <Refresh />
                            </el-icon>
                            重新加载
                        </el-button>
                        <el-button @click="downloadInstead">
                            <el-icon>
                                <Download />
                            </el-icon>
                            下载文件
                        </el-button>
                    </el-empty>
                </div>
            </div>

            <template #footer>
                <div class="preview-footer">
                    <div class="file-info">
                        <span class="file-name">{{ currentFileName }}</span>
                        <span class="file-size" v-if="currentFileSize">
                            • {{ currentFileSize }}
                        </span>
                    </div>
                    <div class="footer-actions">
                        <el-button @click="closePreview">关闭</el-button>
                        <el-button @click="openInNewWindow">
                            <el-icon>
                                <FullScreen />
                            </el-icon>
                            新窗口
                        </el-button>
                    </div>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted, computed, defineProps } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { getPaperDetails, deleteFile as deleteFileAPI, deletePaper as deletePaperAPI, createCheckTask, getCheckTaskDetail } from "@/api/student.js"
import { getAvatarUrl } from '@/utils/avatar'

// 图标引入
import {
    ArrowLeft, Edit, Download, Share, Printer, Delete, More,
    Calendar, Document, List, TrendCharts, InfoFilled, Timer,
    ChatLineRound, ChatDotRound, UserFilled, Phone, Message,
    OfficeBuilding, Paperclip, Plus, View, Refresh,
    DocumentChecked, DocumentAdd, Picture, VideoPlay, EditPen, FullScreen
} from '@element-plus/icons-vue'
import { getAdvisorInfo, getFileInfo } from "@/api/student.js"
import { getSubjectFieldTree } from '@/api/user.js'
import { tr } from 'element-plus/es/locales.mjs'
const props = defineProps({
  paperId: {
    type: [String, Number],
    default: null
  }
})

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const paperDetails = ref({})
const advisorInfo = ref(null)
const fileInfo = ref(null)
const loading = ref(false)
// 优先使用 props 传递的 ID，其次使用路由参数
const paperId = computed(() => props.paperId || route.query.id)
console.log('论文ID:', paperId.value)
const subjectTree = ref([]); // 学科领域树形结构
const checkTask = ref(null)  // 存储检测任务信息
const checkTaskLoading = ref(false)

// ========== 论文附件预览相关数据==========
const previewVisible = ref(false)
const previewUrl = ref('')
const previewLoading = ref(false)
const previewError = ref(false)
const previewMode = ref('')
const errorMessage = ref('')
// 相似度报告预览相关数据
const similarityPreviewVisible = ref(false)
const similarityPreviewUrl = ref('')
const reportLoading = ref(false)
const reportError = ref(false)
const reportErrorMessage = ref('')

// 当前文件信息
const currentFileId = ref('')
const currentFileName = ref('')
const currentFileSize = ref('')
const currentFileType = ref('')

// ========== 计算属性 ==========
const previewTitle = computed(() => {
    return currentFileName.value ? `预览 - ${currentFileName.value}` : '文件预览'
})

const hasReport = computed(() => {
    return checkTask.value?.checkStatus === 'completed' &&
        checkTask.value?.reportId
})

// 是否可以查看报告
const canViewReport = computed(() => {
    return hasReport.value
})

// 是否可以下载报告
const canDownloadReport = computed(() => {
    return hasReport.value
})
// 相似度报告当前相似度
// 后端 checkRate 可能是小数(0.23)或整数(23)，统一转为整数百分比
const getSimilarityRate = computed(() => {
    const raw = checkTask.value?.checkRate
        ?? paperDetails.value?.similarityRate
        ?? paperDetails.value?.similarity
        ?? 0
    if (!raw) return 0
    // 小数形式（0~1 之间）转为百分比整数
    return raw > 0 && raw <= 1 ? Math.round(raw * 100) : Math.round(raw)
})

// 方法
// 智能预览
const previewFile = async (file) => {
    if (!file || !file.id) {
        ElMessage.warning('文件信息不完整');
        return;
    }

    // 1. 保存当前文件信息
    currentFileId.value = file.id
    currentFileName.value = file.originalFilename || '未知文件'
    currentFileSize.value = file.fileSizeDesc || ''
    currentFileType.value = getFileExtension(file.originalFilename)

    // 2. 构建后端智能预览接口路径（和Controller完全匹配，无额外前缀）
    const previewApiUrl = `/check/api/file/smartPreview?fileId=${file.id}`

    // 3. 显示预览弹框，开始加载
    previewVisible.value = true
    previewLoading.value = true
    previewError.value = false
    previewUrl.value = ''
    previewMode.value = ''

    try {
        const previewApiUrl = `/check/api/file/smartPreview?fileId=${file.id}`
        previewUrl.value = previewApiUrl
    } catch (error) {
        handlePreviewError(error)
    }
}

// iframe加载完成
const onIframeLoad = () => {
    previewLoading.value = false
    console.log('预览加载完成')
}

// iframe加载错误
const onIframeError = () => {
    previewLoading.value = false
    previewError.value = true
    errorMessage.value = '文件加载失败，可能格式不受支持'
}

// 关闭预览
const closePreview = () => {
    previewVisible.value = false
}

// 重置预览状态
const resetPreview = () => {
    previewUrl.value = ''
    currentFileId.value = ''
    currentFileName.value = ''
    currentFileSize.value = ''
    currentFileType.value = ''
    previewLoading.value = false
    previewError.value = false
    errorMessage.value = ''
}

// 重新加载
const retryPreview = () => {
    if (currentFileId.value) {
        previewLoading.value = true
        previewError.value = false
        // 直接调用 /smartPreview
        const previewApiUrl = `/check/api/file/smartPreview?fileId=${currentFileId.value}`
        previewUrl.value = previewApiUrl // 重新赋值触发iframe刷新
    }
}

// 新窗口打开
const openInNewWindow = () => {
    if (currentFileId.value) {
        const previewApiUrl = `/check/api/file/smartPreview?fileId=${currentFileId.value}`
        window.open(previewApiUrl, '_blank', 'width=1200,height=800');
        closePreview()
    }
}

// 下载代替预览
const downloadInstead = () => {
    downloadCurrentFile()
    closePreview()
}



// 确保这个函数被正确声明
const downloadFile = async (file) => {
    if (!file || !file.id) {
        ElMessage.warning('文件信息不完整');
        return;
    }

    try {
        // 根据后端代码构建下载URL
        const encodedFileName = encodeURIComponent(file.originalFilename || 'document');
        const downloadUrl = `/check/api/file/download/${file.id}/${encodedFileName}`;
        console.log('下载URL:', downloadUrl);
        window.open(downloadUrl, '_blank');
        ElMessage.success('开始下载文件');
    } catch (error) {
        console.error('下载文件失败:', error);
        ElMessage.error('下载失败');
    }
}

// 处理预览错误
const handlePreviewError = (error) => {
    console.error('预览失败:', error);
    previewLoading.value = false;
    previewError.value = true;
    errorMessage.value = error.message || '文件预览失败，请尝试下载文件查看';
}

const openSimilarityReport = async () => {
    const paper = paperDetails.value
    const checkTask = paper?.checkTask
    if (!checkTask) {
        ElMessage.warning('暂无检测记录')
        return
    }
    if (checkTask.checkStatus !== 'completed') {
        if (checkTask.checkStatus === 'checking') {
            ElMessage.warning('检测正在进行中，请稍后再查看报告')
        } else if (checkTask.checkStatus === 'failure') {
            ElMessage.error(`检测失败`)
        } else {
            ElMessage.warning('请先完成相似度检测')
        }
        return
    }
    //2. 检查报告ID
    // if (!checkTask.value.reportSummary.reportId) {
    //     ElMessage.warning('报告生成中，请稍后重试')
    //     return
    // }
    if (!checkTask.reportSummary?.reportId) {
        ElMessage.warning('报告生成中，请稍后重试')
        return
    }
    // 3.显示弹窗
    similarityPreviewVisible.value = true
    reportLoading.value = true
    reportError.value = false
    reportErrorMessage.value = ''

    try {
        const currentPaperId = paperId.value
        console.log('开始获取报告预览，论文ID:', currentPaperId)
        // 调用API获取预览URL
        const response = await getSimilarityReportPreview(currentPaperId)

        if (response.code === 200 && response.data) {
            similarityPreviewUrl.value = response.data
            ElMessage.success('报告加载成功')
        } else {
            throw new Error(response.message || '获取报告失败')
        }
    } catch (error) {
        console.error('打开相似度报告失败:', error)
        reportError.value = true
        reportErrorMessage.value = error.message || '报告加载失败，请稍后重试'
        ElMessage.error('加载报告失败')
    } finally {
        reportLoading.value = false
    }
}

// 获取相似度报告预览URL的API
const getSimilarityReportPreview = async (paperIdParam) => {
    try {
        console.log('获取报告预览，paperId:', paperIdParam);

        // 这个接口返回的是PDF文件，不是JSON
        const url = `/check/api/file/smartPreviewReport?paperId=${paperIdParam}`;

        // 直接返回URL，让iframe加载
        return {
            code: 200,
            data: url, // 直接返回URL
            message: 'success'
        };

    } catch (error) {
        console.error('API请求失败:', error);
        throw error;
    }
};

// iframe加载完成
const onReportIframeLoad = () => {
    reportLoading.value = false
    reportError.value = false
    console.log('报告iframe加载完成')
}

// iframe加载错误
const onReportIframeError = () => {
    reportLoading.value = false
    reportError.value = true
    reportErrorMessage.value = '报告预览加载失败，可能是文件格式不支持或服务异常'
}

// 重试预览
const retryReportPreview = () => {
    if (paperDetails.value?.checkTask?.reportId) {
        reportLoading.value = true
        reportError.value = false
        openSimilarityReport() // 重新调用打开方法
    }
}

// 下载相似度报告
const downloadSimilarityReport = async () => {
    let loadingInstance = null
    try {
        console.log('=== 下载报告开始 ===')
        console.log('当前检测任务:', checkTask.value)

        // 1. 检查检测任务
        if (!checkTask.value) {
            ElMessage.warning('暂无检测记录，请先进行相似度检测')
            return
        }

        // 2. 检查检测状态
        if (checkTask.value.checkStatus !== 'completed') {
            ElMessage.warning('检测未完成，无法下载报告')
            return
        }

        // 3. 检查报告ID
        const reportId = checkTask.value.reportSummary.reportId
        if (!reportId) {
            ElMessage.warning('报告ID不存在，无法下载')
            return
        }

        console.log('使用reportId下载:', reportId)

        // 4. 构建下载URL（根据后端接口）
        // 使用reportId
        const downloadUrl = `/check/api/file/downloadReport/${reportId}`

        console.log('下载URL:', downloadUrl)

        // 5. 显示加载提示
        loadingInstance = ElLoading.service({
            lock: true,
            text: '正在准备下载...',
            background: 'rgba(0, 0, 0, 0.7)'
        })

        // 6. 尝试下载
        try {
            const response = await fetch(downloadUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/pdf',
                    // 'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                }
            })

            console.log('下载响应状态:', response.status)

            if (!response.ok) {
                throw new Error(`下载失败: HTTP ${response.status}`)
            }

            // 获取文件
            const blob = await response.blob()

            // 创建下载链接
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `相似度报告_${paperDetails.value?.paperTitle || paperId.value}.pdf`
            link.style.display = 'none'

            document.body.appendChild(link)
            link.click()

            // 清理
            setTimeout(() => {
                window.URL.revokeObjectURL(url)
                document.body.removeChild(link)
                loadingInstance.close()
                ElMessage.success('报告下载成功')
            }, 100)

        } catch (fetchError) {
            loadingInstance.close()
            console.error('Fetch下载失败:', fetchError)

            // 降级方案：直接打开
            window.open(downloadUrl, '_blank')
            ElMessage.info('已在新窗口打开下载')
        }

    } catch (error) {
        console.error('下载报告失败:', error)
        ElMessage.error(`下载失败: ${error.message}`)
    }finally {
        // 关闭加载提示
        if (loadingInstance) {
            loadingInstance.close()
        }
    }
}

// 在新窗口打开
const openReportInNewWindow = () => {
    if (similarityPreviewUrl.value) {
        window.open(similarityPreviewUrl.value, '_blank', 'width=1200,height=800')
        // 可以关闭当前弹窗
        closeSimilarityReport()
    }
}

// 关闭报告预览
const closeSimilarityReport = () => {
    similarityPreviewVisible.value = false
    similarityPreviewUrl.value = ''
    reportLoading.value = false
    reportError.value = false
    reportErrorMessage.value = ''
}

const deleteFile = async (file) => {
    try {
        const deleteRes = await deleteFileAPI(file.id)
        if (deleteRes.code === 200) {
            ElMessage.success('文件删除成功')
            await loadPaperDetails()
        }
    } catch (error) {
        console.log('删除文件失败:', error)
        ElMessage.error('网络错误，请检查连接后重试')
    }
}

const loadAdvisorData = async () => {
    loading.value = true
    try {
        const [advisorRes] = await Promise.all([
            getAdvisorInfo()
        ])
        if (advisorRes.code === 200) {
            advisorInfo.value = advisorRes.data
            // 如果没有导师信息，显示默认状态
            if (!advisorInfo.value) {
                advisorInfo.value = {
                    name: '暂未分配',
                    title: '待分配',
                    researchField: '待分配导师后显示',
                    phone: '',
                    email: '',
                    office: '待分配',
                    avatar: '',
                    expertise: []
                }
            }
        } else {
            ElMessage.error(advisorRes.message || '获取导师信息失败')
        }
    } catch (error) {
        console.error('加载导师信息数据失败:', error)
        ElMessage.error('网络错误，请检查连接后重试')
    }
    finally {
        loading.value = false
    }
}
const loadPaperDetails = async () => {
    loading.value = true
    try {
        const res = await getPaperDetails(paperId.value)
        if (res.code === 200) {
            paperDetails.value = res.data || {}
            if (paperDetails.value.fileId) {
                await loadFileInfo(paperDetails.value.fileId)
            }
            // 3. 加载检测任务信息
            await loadCheckTask()
        } else {
            ElMessage.error(res.message || '获取论文详情失败')
        }
    } catch (error) {
        console.error('加载论文详情失败:', error)
        ElMessage.error('网络错误，请检查连接后重试')
        // 使用模拟数据作为fallback
        paperDetails.value = {
            id: paperId.value,
            subjectCode: '',
            paperTitle: '',
            paperStatus: '',
            allocationStatus: '',
            submitTime: '',
            subject: '计算机科学',
            paperType: '',
            keywords: ['深度学习', '图像识别', '卷积神经网络'],
            wordCount: '',
            similarityRate: '',
            paperAbstract: '',
            teacherName: '',
            advisorTitle: '计算机科学教授',
            advisorEmail: 'zhang@university.edu',
            advisorOffice: '信息楼 301室',
            feedback: '论文结构合理，实验设计完整，但文献综述部分需要补充最新的研究成果。建议在第三章增加对比实验，进一步验证模型性能。',
            feedbackTime: '2024-01-18T14:20:00',
            fileFormat: '.docx',
            fileSizeDesc: '',
            reviewHistory: [
                {
                    id: 1,
                    reviewerName: '张教授',
                    reviewerAvatar: '',
                    type: 'advisor',
                    reviewTime: '2024-01-18T14:20:00',
                    comments: '论文初审通过，部分内容需要修改'
                }
            ]
        }
    } finally {
        loading.value = false
    }
}

const loadCheckTask = async () => {
    checkTaskLoading.value = true
    try {
        const res = await getCheckTaskDetail(paperId.value)
        console.log('检测任务响应:', res)

        if (res.code === 200 && res.data) {
            checkTask.value = res.data
            console.log('检测任务加载成功:', checkTask.value)
        } else {
            console.warn('未找到检测任务:', res.message)
            checkTask.value = null
        }
    } catch (error) {
        console.error('加载检测任务失败:', error)
        checkTask.value = null
    } finally {
        checkTaskLoading.value = false
    }
}

const loadFileInfo = async (fileId) => {
    try {
        const fileRes = await getFileInfo(fileId)
        if (fileRes.code === 200 && fileRes.data) {
            fileInfo.value = fileRes.data
            console.log('文件信息加载成功:', fileInfo.value)
        } else {
            console.warn('获取文件信息失败:', fileRes.message)
            fileInfo.value = null
        }
    } catch (error) {
        console.error('加载文件信息失败:', error)
        fileInfo.value = null
    }
}

const goBack = () => {
    router.push('/student/my-papers')
}

const editPaper = () => {
    if (paperDetails.value.status === 'rejected' || paperDetails.value.status === 'pending') {
        router.push(`/student/paper-edit/${paperId.value}`)
    } else {
        ElMessage.warning('当前状态下不可修改论文')
    }
}

const downloadPaper = () => {
    ElMessage.info('开始下载论文文档...')
}

const handleMoreActions = (command) => {
    switch (command) {
        case 'share':
            ElMessage.info('生成分享链接')
            break
        case 'print':
            window.print()
            break
        case 'delete':
            deletePaper()
            break
    }
}

const deletePaper = async () => {
    ElMessageBox.confirm('确定要删除这篇论文吗？删除后不可恢复！', '删除确认', {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(async () => {
        const deleteRes = await deletePaperAPI(paperId.value)
        if (deleteRes.code === 200) {
            ElMessage.success('论文删除成功')
            goBack()
        } else {
            ElMessage.error(deleteRes.message || '删除论文失败')
        }
    }).catch(() => {
        ElMessage.info('已取消删除')
    })
}

const recheckSimilarity = async () => {
    const currentPaperId = paperId.value

    if (!currentPaperId) {
        ElMessage.warning('论文ID不存在')
        return
    }

    try {
        await ElMessageBox.confirm(
            '确定要重新检测相似度吗？',
            '重新检测确认',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }
        )

        // 调用API创建检测任务
        const res = await createCheckTask(currentPaperId)

        if (res.code === 200) {
            ElMessage.success('相似度检测任务已创建，请稍后刷新查看结果')

            // 重新加载检测任务
            setTimeout(() => {
                loadCheckTask()
            }, 3000)
        } else {
            ElMessage.error(res.message || '创建检测任务失败')
        }

    } catch (error) {
        // 用户取消
        console.log('用户取消重新检测')
    }
}

const viewSimilarityReport = async () => {
    const idToUse = paperId.value
    console.log('=== 查看相似度报告开始 ===', checkTask.value)
    if (!checkTask.value) {
        ElMessage.warning('暂无检测记录，请先进行相似度检测')
        return
    }
    if (checkTask.value.checkStatus !== 'completed') {
        const statusMap = {
            'checking': '检测正在进行中，请稍后再查看报告',
            'failure': '检测失败，无法查看报告',
            'pending': '检测排队中'
        }
        ElMessage.warning(statusMap[checkTask.value.checkStatus] || '检测未完成')
        return
    }
    if (!checkTask.value.reportSummary.reportId) {
        ElMessage.warning('报告生成中，请稍后重试')
        return
    }
    similarityPreviewVisible.value = true
    reportLoading.value = true
    reportError.value = false
    reportErrorMessage.value = ''
    try {
        console.log('开始获取报告预览，reportId:', checkTask.value.reportSummary.reportId)
        // 调用API获取预览URL
        similarityPreviewUrl.value = `/check/api/file/smartPreviewReport?paperId=${idToUse}`;
        ElMessage.success('报告加载成功');
    } catch (error) {
    console.error('打开相似度报告失败:', error)
    reportError.value = true
    reportErrorMessage.value = error.message || '报告加载失败，请稍后重试'
    ElMessage.error('加载报告失败: ' + error.message)
} finally {
    reportLoading.value = false
}
};
const onSimilarityIframeLoad = () => {
    reportLoading.value = false
}
const onSimilarityIframeError = () => {
    reportLoading.value = false
    reportError.value = true
    reportErrorMessage.value = '报告加载失败，可能文件不存在或格式错误'
}
const closeSimilarityPreview = () => {
    similarityPreviewVisible.value = false
    similarityPreviewUrl.value = ''
    reportLoading.value = false
    reportError.value = false
    reportErrorMessage.value = ''
}

const contactAdvisor = () => {
    if (paperDetails.value && paperDetails.value.teacherName) {
        const phone = advisorInfo.value.phone
        const email = advisorInfo.value.email

        ElMessageBox.alert(
            `联系 ${paperDetails.value.teacherName} 老师\n\n电话：${phone}\n邮箱：${email}`,
            '联系指导老师',
            { confirmButtonText: '我知道了' }
        )
    } else {
        ElMessage.warning('暂无导师联系信息')
    }
}

const replyToFeedback = async () => {
    try {
        const { value } = await ElMessageBox.prompt('请输入对导师反馈的回复：', '回复反馈', {
            confirmButtonText: '发送',
            cancelButtonText: '取消',
            inputType: 'textarea',
            inputPlaceholder: '请输入您的回复内容'
        });
        
        if (value) {
            // TODO: 调用回复接口
            // await replyFeedbackApi(paperDetails.value.id, value)
            
            ElMessage.success('回复已发送给导师');
            // 刷新数据
            loadPaperDetails();
        }
    } catch (error) {
        if (error !== 'cancel') {
            console.error('回复失败:', error);
            ElMessage.error('回复发送失败，请稍后重试');
        }
    }
};

//状态处理
const getStatusText = (status) => {
    const textMap = {
        'pending': '待分配',
        'assigned': '已分配',
        'auditing': '审核中',
        'completed': '已通过',
        'rejected': '需修改'
    }
    return textMap[status] || '未知状态'
}

const getStatusType = (status) => {
    const typeMap = {
        'pending': 'info',
        'assigned': 'warning',
        'auditing': 'warning',
        'completed': 'success',
        'rejected': 'danger'
    }
    return typeMap[status] || 'info'
}

const formatDateTime = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    })
}

const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    })
}

const getPaperTypeText = (type) => {
    const typeMap = {
        'graduation': '毕业论文',
        'course': '课程论文',
        'other': '其他'
    }
    return typeMap[type] || '其他论文'
}

const getPaperTypeTag = (type) => {
    const tagMap = {
        'graduation': 'success',
        'course': 'info',
        'research': 'warning'
    }
    return tagMap[type] || 'info'
}

const getWordCountPercentage = (wordCount) => {
    const target = 8000
    if (!wordCount) return 0
    return Math.min(Math.round((wordCount / target) * 100), 100)
}

const getSimilarityColor = (similarity) => {
    if (!similarity) return '#909399'
    if (similarity === 0) return '#909399'
    if (similarity < 15) return '#52c41a'
    if (similarity < 30) return '#faad14'
    return '#ff4d4f'
}

const getSimilarityTagType = (similarity) => {
    if (!similarity) return 'info'
    if (similarity < 15) return 'success'
    if (similarity < 30) return 'warning'
    return 'danger'
}

const getSimilarityStatus = (similarity) => {
    if (!similarity) return '未检测'
    if (similarity < 15) return '通过'
    if (similarity < 30) return '警告'
    return '过高'
}

const getSimilarityTips = (similarity) => {
    if (!similarity) return '请进行相似度检测'
    if (similarity < 15) return '相似度符合要求'
    if (similarity < 30) return '相似度较高，建议修改'
    return '相似度过高，需要大幅修改'
}

const getActiveStep = (paperStatus) => {
    const stepMap = {
        'pending': 1,        // 步骤 1：待分配
        'assigned': 2,       // 步骤 2：已分配（有导师）
        'auditing': 2,       // 步骤 2：审核中（与 assigned 同一级）
        'rejected': 3,       // 步骤 3：需修改
        'completed': 4       // 步骤 4：已完成
    }
    return stepMap[paperStatus] || 1
}

const getReviewStepTitle = (paperStatus) => {
    if (paperStatus === 'rejected') return '需要修改'
    if (paperStatus === 'completed') return '审核通过'
    if (paperStatus === 'auditing' || paperStatus === 'assigned') return '导师审核'
    if (paperStatus === 'pending') return '等待分配'
    return '处理中'
}

const getReviewStepDesc = (paper) => {
    const status = paper.paperStatus

    if (status === 'pending') {
        return '论文已提交，等待分配导师'
    }

    // auditing 和 assigned 都属于第2步
    if (status === 'assigned' || status === 'auditing') {
        if (!paper.teacherName) {
            return '等待分配导师'
        }

        // 根据分配状态显示不同描述
        if (paper.allocationStatus === 'pending') {
            return `已分配给 ${paper.teacherName}，等待确认`
        }
        if (paper.allocationStatus === 'confirmed') {
            return `${paper.teacherName} 老师正在审核`
        }
        if (paper.allocationStatus === 'rejected') {
            return `${paper.teacherName} 拒绝接收，等待重新分配`
        }

        // 默认情况
        return paper.teacherName ?
            `${paper.teacherName} 老师正在审核` :
            '审核中'
    }

    if (status === 'rejected') {
        return paper.feedback ?
            paper.feedback.substring(0, 30) + '...' :
            '需要根据反馈修改论文'
    }

    if (status === 'completed') {
        return '论文已通过审核'
    }

    return '状态未知'
}

const getReviewTypeTag = (type) => {
    const tagMap = {
        'advisor': 'primary',
        'committee': 'success'
    }
    return tagMap[type] || 'info'
}

const getReviewTypeText = (type) => {
    const textMap = {
        'advisor': '导师',
        'committee': '委员会'
    }
    return textMap[type] || '审核'
}

const getFileIconClass = (filename) => {
    const ext = getFileExtension(filename)
    const classMap = {
        'doc': 'file-icon-doc',
        'docx': 'file-icon-doc',
        'pdf': 'file-icon-pdf',
        'xlsx': 'file-icon-excel',
        'xls': 'file-icon-excel',
        'ppt': 'file-icon-ppt',
        'pptx': 'file-icon-ppt',
        'txt': 'file-icon-txt'
    }
    return classMap[ext] || 'file-icon-default'
}

const getFileIcon = (filename) => {
    const ext = getFileExtension(filename)
    const iconMap = {
        'doc': Document,
        'docx': Document,
        'pdf': DocumentChecked,
        'xlsx': DocumentAdd,
        'xls': DocumentAdd,
        'ppt': VideoPlay,
        'pptx': VideoPlay,
        'txt': EditPen,
        'jpg': Picture,
        'jpeg': Picture,
        'png': Picture,
        'gif': Picture,
        'zip': Paperclip,
        'rar': Paperclip,
        '7z': Paperclip
    }
    return iconMap[ext] || Document
}
// 获取文件扩展名
const getFileExtension = (filename) => {
    if (!filename) return ''
    const lastDotIndex = filename.lastIndexOf('.')
    return lastDotIndex !== -1 ? filename.substring(lastDotIndex + 1).toLowerCase() : ''
}

const subjectField = async () => {
    try {
        const subjectRes = await getSubjectFieldTree('subject_field');
        subjectTree.value = subjectRes.data; // res.data 是 List<SysDictData>
    } catch (error) {
        console.error('加载数据失败:', error)
        ElMessage.error('网络错误，请检查连接后重试')
    }
}
const findSubjectLabelByCode = (code, tree = subjectTree.value) => {
    for (const node of tree) {
        if (node.value === code) return node.label
        if (node.children && node.children.length) {
            const found = findSubjectLabelByCode(code, node.children)
            if (found) return found
        }
    }
    return code // 没找到就显示编号
}

const getCheckStatusTag = (status) => {
    if (!status) return 'info'

    const tagMap = {
        'completed': 'success',
        'checking': 'warning',
        'failure': 'danger',
        'pending': 'info'
    }
    return tagMap[status] || 'info'
}

// 检测状态文本（已有，确保正确）
const getCheckStatusText = (status) => {
    if (!status) return '未检测'

    const textMap = {
        'completed': '已完成',
        'checking': '检测中',
        'failure': '失败',
        'pending': '排队中'
    }
    return textMap[status] || '未知'
}

const getCheckStatusIcon = (status) => {
    const iconMap = {
        'completed': 'CircleCheck',
        'checking': 'Loading',
        'processing': 'Loading',
        'failure': 'CircleClose',
        'pending': 'Clock'
    }
    return iconMap[status] || 'QuestionFilled'
}

onMounted(() => {
    loadPaperDetails(),
        loadAdvisorData(),
        subjectField()
});
</script>

<style lang="scss" scoped>
.similarity-card {
    margin-bottom: 16px;

    .section-header {
        display: flex;
        align-items: center;
        gap: 8px;

        .similarity-rate-tag {
            margin-left: auto;
        }
    }

    .similarity-content {
        .similarity-main {
            display: flex;
            align-items: center;
            gap: 24px;
            margin-bottom: 16px;

            @media (max-width: 768px) {
                flex-direction: column;
                gap: 16px;
            }

            .similarity-value {
                flex-shrink: 0;

                .percentage-value {
                    display: block;
                    font-size: 1.25rem;
                    font-weight: 700;
                    text-align: center;
                    margin-top: 8px;
                }
            }

            .similarity-info {
                flex: 1;

                .similarity-status {
                    margin-bottom: 12px;
                }

                .similarity-details {
                    .detail-item {
                        display: flex;
                        align-items: center;
                        margin-bottom: 6px;
                        font-size: 14px;

                        .detail-label {
                            color: #7f8c8d;
                            min-width: 80px;
                        }

                        .detail-value {
                            color: #2c3e50;
                        }
                    }
                }
            }
        }

        .similarity-actions {
            display: flex;
            gap: 12px;
            margin-top: 16px;

            .el-button {
                flex: 1;
            }
        }
    }
}

// 相似度报告弹窗样式
.similarity-report-dialog {
    :deep(.el-dialog) {
        border-radius: 12px;
        overflow: hidden;
        max-width: 1200px;
    }

    :deep(.el-dialog__header) {
        padding: 16px 20px;
        border-bottom: 1px solid #e4e7ed;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        margin-right: 0;

        .el-dialog__title {
            color: white;
            font-weight: 600;
        }

        .el-dialog__headerbtn {
            top: 16px;

            .el-dialog__close {
                color: white;

                &:hover {
                    color: rgba(255, 255, 255, 0.8);
                }
            }
        }
    }

    :deep(.el-dialog__body) {
        padding: 0;
    }

    :deep(.el-dialog__footer) {
        padding: 12px 20px;
        border-top: 1px solid #e4e7ed;
        background: #fafafa;
    }
}

// 预览容器
.preview-wrapper {
    height: 70vh;
    position: relative;
    background: #f5f7fa;

    .preview-iframe {
        width: 100%;
        height: 100%;
        border: none;
        background: white;
    }

    .preview-error,
    .no-report {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white;

        .error-detail {
            margin-top: 8px;
            color: #909399;
            font-size: 14px;
            max-width: 400px;
            text-align: center;
            line-height: 1.4;
        }

        .error-actions {
            margin-top: 16px;
            display: flex;
            gap: 12px;
            justify-content: center;
        }

        .empty-tip {
            margin-top: 8px;
            color: #909399;
            max-width: 300px;
            text-align: center;
        }
    }
}

// 预览页脚
.preview-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;

    .report-info {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
        min-width: 0;

        .report-name {
            display: flex;
            align-items: center;
            gap: 6px;
            font-weight: 500;
            color: #2c3e50;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;

            .el-icon {
                color: #667eea;
                flex-shrink: 0;
            }
        }

        .report-meta {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #5a6c7d;
            font-size: 14px;
            flex-shrink: 0;
        }
    }

    .footer-actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
    }
}

.paper-details-container {
    padding: 20px;
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea0d 0%, #764ba20d 100%);
}

// 页面头部
.paper-header {
    margin-bottom: 24px;
    background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 2px 12px rgba(102, 126, 234, 0.1);

    .header-content {
        display: flex;
        flex-direction: column;
        gap: 16px;

        .back-section {
            .back-btn {
                padding-left: 0;
                color: #667eea;
                font-weight: 500;

                &:hover {
                    color: #5a67d8;
                }
            }
        }

        .title-section {
            .paper-title {
                margin: 0 0 16px 0;
                font-size: 1.75rem;
                font-weight: 700;
                color: #2c3e50;
                line-height: 1.3;
            }

            .paper-status-row {
                display: flex;
                align-items: center;
                gap: 24px;
                flex-wrap: wrap;

                .status-tag {
                    font-weight: 600;
                }

                .paper-meta {
                    display: flex;
                    gap: 24px;
                    flex-wrap: wrap;

                    .meta-item {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        font-size: 14px;
                        color: #5a6c7d;

                        .el-icon {
                            color: #667eea;
                        }
                    }
                }
            }
        }

        .action-section {
            .header-actions {
                display: flex;
                gap: 8px;
            }
        }
    }
}

// 主要内容区域
.paper-content {
    .section-card {
        margin-bottom: 16px;
        border-radius: 12px;
        border: none;
        transition: all 0.3s ease;

        &:hover {
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
        }

        :deep(.el-card__header) {
            padding: 16px 20px;
            border-bottom: 1px solid #f1f2f6;
        }

        :deep(.el-card__body) {
            padding: 20px;
        }
    }

    .sidebar-card {
        margin-bottom: 16px;
        border-radius: 12px;
        border: none;

        :deep(.el-card__header) {
            padding: 16px;
            border-bottom: 1px solid #f1f2f6;
        }

        :deep(.el-card__body) {
            padding: 16px;
        }
    }
}

// 通用样式
.section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: #2c3e50;

    .el-icon {
        color: #667eea;
    }

    .section-title {
        font-size: 1.125rem;
    }
}

// 论文摘要部分
.abstract-content {
    line-height: 1.6;
    color: #5a6c7d;
    margin-bottom: 20px;
    padding: 8px 0;
}

.abstract-footer {
    .word-count-info {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;

        .count-label {
            color: #7f8c8d;
        }

        .count-value {
            font-size: 1.25rem;
            font-weight: 700;
            color: #667eea;
        }

        .count-unit {
            color: #7f8c8d;
        }

        .count-progress {
            flex: 1;
            max-width: 200px;
        }
    }
}

// 论文详情部分
.details-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 20px;

    .detail-item {
        display: flex;
        align-items: center;
        gap: 8px;

        .detail-label {
            color: #7f8c8d;
            white-space: nowrap;
        }

        .detail-value {
            color: #2c3e50;
            font-weight: 500;
        }
    }
}

.keywords-section {
    display: flex;
    align-items: flex-start;
    gap: 12px;

    .keywords-label {
        color: #7f8c8d;
        white-space: nowrap;
        padding-top: 4px;
    }

    .keywords-container {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;

        .keyword-tag {
            font-size: 12px;
        }

        .no-keywords {
            color: #999;
            font-style: italic;
        }
    }
}

// 相似度检测部分
.similarity-card {
    .similarity-content {
        .similarity-main {
            display: flex;
            align-items: center;
            gap: 24px;

            .similarity-value {
                flex-shrink: 0;

                .percentage-value {
                    display: block;
                    font-size: 1.5rem;
                    font-weight: 700;
                    text-align: center;
                    margin-top: 8px;
                }
            }

            .similarity-info {
                flex: 1;

                .similarity-status {
                    margin-bottom: 12px;
                }

                .similarity-tips {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-bottom: 16px;
                    color: #7f8c8d;

                    .el-icon {
                        color: #faad14;
                    }
                }

                .similarity-actions {
                    display: flex;
                    gap: 8px;
                }
            }
        }
    }
}

// 审核进度部分
.progress-section {
    padding: 8px 0;

    :deep(.el-steps) {
        .el-step__head {
            .el-step__icon {
                width: 32px;
                height: 32px;
                font-size: 14px;
            }
        }

        .el-step__title {
            font-size: 14px;
            font-weight: 600;
        }

        .el-step__description {
            font-size: 12px;
            color: #7f8c8d;
        }
    }
}

// 导师反馈部分
.feedback-card {
    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .feedback-header-left {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .feedback-header-right {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 14px;

            .advisor-name {
                color: #667eea;
                font-weight: 500;
            }

            .feedback-time {
                color: #7f8c8d;
            }
        }
    }

    .feedback-content {
        line-height: 1.6;
        color: #5a6c7d;
        padding: 16px;
        background: #f8f9fa;
        border-radius: 8px;
        margin-bottom: 20px;
    }

    .feedback-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
    }
}

// 指导老师部分（侧边栏）
.advisor-info {
    .advisor-avatar-section {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 20px;

        .advisor-avatar {
            flex-shrink: 0;
            border: 3px solid #fff;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .advisor-basic {
            .advisor-name {
                margin: 0 0 4px 0;
                font-size: 1.125rem;
                color: #2c3e50;
            }

            .advisor-title {
                margin: 0;
                color: #667eea;
                font-size: 14px;
            }
        }
    }

    .advisor-contact {
        margin-bottom: 20px;

        .contact-item {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            color: #5a6c7d;
            font-size: 14px;

            .el-icon {
                color: #667eea;
                width: 16px;
            }
        }
    }

    .advisor-actions {
        .contact-btn {
            width: 100%;
        }
    }
}

.no-advisor {
    text-align: center;
    padding: 20px 0;

    .no-advisor-tips {
        margin-top: 12px;
        color: #7f8c8d;
        font-size: 14px;
    }
}

// 论文附件部分
.attachments-list {
    .attachment-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 0;
        border-bottom: 1px solid #f1f2f6;

        &:last-child {
            border-bottom: none;
        }

        .file-info {
            display: flex;
            align-items: center;
            gap: 12px;
            flex: 1;

            .file-icon {
                flex-shrink: 0;
            }

            .file-details {
                flex: 1;
                min-width: 0;

                .file-name {
                    font-weight: 500;
                    color: #2c3e50;
                    margin-bottom: 4px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .file-meta {
                    display: flex;
                    gap: 12px;
                    font-size: 12px;
                    color: #7f8c8d;
                }
            }
        }

        .file-actions {
            flex-shrink: 0;
            display: flex;
            gap: 4px;
        }
    }

    .no-attachments {
        padding: 20px 0;
        text-align: center;
    }
}

.add-attachment {
    margin-left: auto;
}

// 审核历史部分
.review-history {
    .review-item {
        padding: 12px 0;
        border-bottom: 1px solid #f1f2f6;

        &:last-child {
            border-bottom: none;
        }

        .review-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;

            .reviewer-info {
                display: flex;
                align-items: center;
                gap: 8px;

                .reviewer-avatar {
                    flex-shrink: 0;
                }

                .reviewer-name {
                    font-weight: 500;
                    color: #2c3e50;
                }
            }

            .review-time {
                font-size: 12px;
                color: #7f8c8d;
            }
        }

        .review-content {
            font-size: 14px;
            color: #5a6c7d;
            line-height: 1.4;
            padding-left: 32px;
        }
    }
}

// 响应式设计
@media (max-width: 768px) {
    .paper-header {
        padding: 16px;

        .header-content {
            .title-section {
                .paper-title {
                    font-size: 1.5rem;
                }

                .paper-status-row {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 12px;
                }
            }

            .action-section {
                .header-actions {
                    flex-wrap: wrap;
                }
            }
        }
    }

    .details-grid {
        grid-template-columns: 1fr;
    }

    .similarity-card {
        .similarity-content {
            .similarity-main {
                flex-direction: column;
                text-align: center;
                gap: 16px;

                .similarity-info {
                    .similarity-actions {
                        justify-content: center;
                    }
                }
            }
        }
    }

    .feedback-card {
        .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;

            .feedback-header-right {
                width: 100%;
                justify-content: space-between;
            }
        }
    }
}

/* 文件信息样式 */
.file-info-container {
    .file-card {
        padding: 16px;
        border-radius: 8px;
        background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
        border: 1px solid #e0e6ef;
        margin-bottom: 16px;
    }

    .file-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 16px;
    }

    .file-icon-wrapper {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        &.file-icon-doc {
            background: linear-gradient(135deg, #1890ff20 0%, #1890ff40 100%);
            color: #1890ff;
        }

        &.file-icon-pdf {
            background: linear-gradient(135deg, #ff4d4f20 0%, #ff4d4f40 100%);
            color: #ff4d4f;
        }

        &.file-icon-excel {
            background: linear-gradient(135deg, #52c41a20 0%, #52c41a40 100%);
            color: #52c41a;
        }

        &.file-icon-ppt {
            background: linear-gradient(135deg, #722ed120 0%, #722ed140 100%);
            color: #722ed1;
        }

        &.file-icon-txt {
            background: linear-gradient(135deg, #faad1420 0%, #faad1440 100%);
            color: #faad14;
        }

        &.file-icon-default {
            background: linear-gradient(135deg, #667eea20 0%, #764ba240 100%);
            color: #667eea;
        }
    }

    .file-main-info {
        flex: 1;
        min-width: 0;

        .file-name {
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 8px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 1.1rem;
        }

        .file-meta {
            display: flex;
            gap: 16px;
            flex-wrap: wrap;

            .meta-item {
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 12px;
                color: #5a6c7d;

                .el-icon {
                    color: #667eea;
                }
            }
        }
    }

    .file-actions {
        display: flex;
        justify-content: center;

        .el-button-group {
            display: flex;
            gap: 8px;

            .el-button {
                transition: all 0.3s ease;

                &:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }
            }
        }
    }

    .file-status-tip {
        margin-top: 12px;

        :deep(.el-alert) {
            border-radius: 8px;
            border: 1px solid #e0e6ef;
        }
    }

    /* 无文件状态 */
    .no-file {
        .empty-state {
            text-align: center;
            padding: 32px 0;

            .empty-text {
                margin: 16px 0 8px;
                color: #2c3e50;
                font-weight: 500;
            }

            .empty-tip {
                color: #7f8c8d;
                margin-bottom: 24px;
                font-size: 14px;
            }
        }
    }
}

.add-file {
    margin-left: auto;
}

.file-preview-dialog {
    .el-dialog__body {
        padding: 0;
    }

    .preview-wrapper {
        height: 70vh;
        position: relative;
        background: #f5f7fa;
        border-radius: 4px;
        overflow: hidden;

        .preview-iframe {
            width: 100%;
            height: 100%;
            border: none;
        }

        .word-preview {
            height: 100%;
            display: flex;
            flex-direction: column;

            .word-preview-tip {
                padding: 12px;
                background: white;
                border-top: 1px solid #e4e7ed;
            }
        }

        .preview-error {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: white;

            .error-detail {
                margin-top: 8px;
                color: #909399;
                font-size: 14px;
            }
        }
    }

    .preview-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .file-info {
            .file-name {
                font-weight: 500;
                color: #2c3e50;
            }

            .file-size {
                color: #909399;
                font-size: 12px;
                margin-left: 8px;
            }
        }

        .footer-actions {
            display: flex;
            gap: 8px;
        }
    }
}

/* 响应式调整 */
@media (max-width: 768px) {
    .file-info-container {
        .file-header {
            flex-direction: column;
            text-align: center;
            gap: 12px;
        }

        .file-meta {
            justify-content: center;
        }

        .file-actions {
            .el-button-group {
                flex-wrap: wrap;
                justify-content: center;
            }
        }
    }

    .file-preview-dialog {
        .el-dialog {
            width: 95% !important;
            margin-top: 10vh !important;
        }

        .preview-wrapper {
            height: 60vh;
        }

        .preview-footer {
            flex-direction: column;
            gap: 12px;

            .file-info {
                width: 100%;
                text-align: center;
            }

            .footer-actions {
                width: 100%;
                justify-content: center;
            }
        }
    }
}

@media (max-width: 1200px) {
    .paper-content {
        .el-col {
            &:first-child {
                margin-bottom: 16px;
            }
        }
    }
}

@media (max-width: 768px) {
    .similarity-actions {
        flex-direction: column;

        .el-button {
            width: 100%;
        }
    }

    .preview-footer {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;

        .report-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
        }

        .footer-actions {
            width: 100%;
            justify-content: flex-end;
        }
    }

    .similarity-report-dialog {
        width: 95% !important;
        margin-top: 2vh !important;

        :deep(.el-dialog__body) {
            height: 60vh;
        }
    }

    .preview-wrapper {
        height: 60vh;
    }
}
</style>