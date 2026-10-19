<template>
    <div class="paper-details-container">
        <!-- 页面头部 -->
        <div class="paper-header">
            <div class="header-content">
                <div class="back-section">
                    <el-button :icon="ArrowLeft" text @click="goBack" class="back-btn">
                        {{ getBackButtonText }}
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

            </div>
        </div>

        <!-- 主要内容区域 -->
        <div class="paper-content">
            <el-row :gutter="24">
                <!-- 左侧：论文核心信息 -->
                <el-col :xs="24" :lg="16">
                    <!-- 论文信息（摘要 + 详情合并） -->
                    <el-card class="section-card" shadow="never">
                        <template #header>
                            <div class="section-header">
                                <el-icon><Document /></el-icon>
                                <span class="section-title">论文信息</span>
                            </div>
                        </template>

                        <div class="info-section">
                            <div class="info-label">论文摘要</div>
                            <div class="info-value abstract-text">{{ paperDetails.paperAbstract || '暂无摘要' }}</div>
                        </div>

                        <div class="info-divider"></div>

                        <div class="info-grid">
                            <div class="info-cell">
                                <span class="info-label">学科领域</span>
                                <span class="info-value">{{ findSubjectLabelByCode(paperDetails.subjectCode) }}</span>
                            </div>
                            <div class="info-cell">
                                <span class="info-label">论文类型</span>
                                <span class="info-value">{{ getPaperTypeText(paperDetails.paperType) }}</span>
                            </div>
                            <div class="info-cell">
                                <span class="info-label">字数统计</span>
                                <span class="info-value">{{ paperDetails.wordCount || 0 }} 字</span>
                            </div>
                            <div class="info-cell">
                                <span class="info-label">文件大小</span>
                                <span class="info-value">{{ fileInfo?.fileSizeDesc || '--' }}</span>
                            </div>
                        </div>

                        <div v-if="paperDetails.keywords?.length" class="info-divider"></div>

                        <div v-if="paperDetails.keywords?.length" class="info-section">
                            <div class="info-label">关键词</div>
                            <div class="keywords-list">
                                <el-tag v-for="keyword in paperDetails.keywords" :key="keyword" size="small" effect="plain">
                                    {{ keyword }}
                                </el-tag>
                            </div>
                        </div>
                    </el-card>

                    <!-- 相似度检测 -->
                    <el-card class="section-card" shadow="never">
                        <template #header>
                            <div class="section-header">
                                <el-icon><TrendCharts /></el-icon>
                                <span class="section-title">相似度检测</span>
                                <el-tag v-if="checkTask" :type="getCheckStatusTag(checkTask.checkStatus)" size="small" class="header-tag">
                                    {{ getCheckStatusText(checkTask.checkStatus) }}
                                </el-tag>
                                <el-tag v-else type="info" size="small" class="header-tag">未检测</el-tag>
                            </div>
                        </template>

                        <div class="similarity-row">
                            <div class="similarity-rate" :style="{ color: getSimilarityColor(getSimilarityRate) }">
                                {{ getSimilarityRate }}%
                            </div>
                            <div class="similarity-detail">
                                <el-tag :type="getSimilarityTagType(getSimilarityRate)" size="small" effect="light">
                                    {{ getSimilarityStatus(getSimilarityRate) }}
                                </el-tag>
                                <span class="similarity-tip">{{ getSimilarityTips(getSimilarityRate) }}</span>
                            </div>
                            <div class="similarity-actions">
                                <el-button type="primary" plain :icon="Refresh" size="small" @click="recheckSimilarity">重新检测</el-button>
                                <el-button type="success" plain :icon="View" size="small" @click="viewSimilarityReport" :disabled="!checkTask">查看报告</el-button>
                                <el-button type="primary" text size="small" @click="viewSentenceDetail" :disabled="!checkTask?.taskId">查看检测明细</el-button>
                            </div>
                        </div>

                        <!-- 检测任务详情 -->
                        <div v-if="checkTask" class="check-task-info">
                            <!-- P5 新指标：存量任务为 null，显示「—」不按 0 处理 -->
                            <div class="task-row">
                                <span class="task-label">单篇最大</span>
                                <span class="task-value">{{ checkTask.maxPerSource != null ? checkTask.maxPerSource + '%' : '—' }}</span>
                            </div>
                            <div class="task-row">
                                <span class="task-label">引用率</span>
                                <span class="task-value">{{ checkTask.citationRate != null ? checkTask.citationRate + '%' : '—' }}</span>
                            </div>
                            <div class="task-row">
                                <span class="task-label">任务编号</span>
                                <span class="task-value">{{ checkTask.taskNo || '--' }}</span>
                            </div>
                            <div class="task-row" v-if="checkTask.startTime">
                                <span class="task-label">开始时间</span>
                                <span class="task-value">{{ formatDateTime(checkTask.startTime) }}</span>
                            </div>
                            <div class="task-row" v-if="checkTask.endTime">
                                <span class="task-label">结束时间</span>
                                <span class="task-value">{{ formatDateTime(checkTask.endTime) }}</span>
                            </div>
                            <div class="task-row" v-if="checkTask.failReason">
                                <span class="task-label">失败原因</span>
                                <span class="task-value error-text">{{ checkTask.failReason }}</span>
                            </div>
                        </div>
                    </el-card>

                    <!-- 相似度报告预览弹窗 -->
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
                                            <el-icon><Refresh /></el-icon> 重新加载
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
                                </div>
                                <div class="footer-actions">
                                    <el-button @click="downloadSimilarityReport">
                                        <el-icon><Download /></el-icon> 下载报告
                                    </el-button>
                                    <el-button @click="openReportInNewWindow">
                                        <el-icon><FullScreen /></el-icon> 新窗口
                                    </el-button>
                                    <el-button @click="closeSimilarityReport">关闭</el-button>
                                </div>
                            </div>
                        </template>
                    </el-dialog>

                    <!-- 审核进度 -->
                    <el-card class="section-card" shadow="never">
                        <template #header>
                            <div class="section-header">
                                <el-icon><Timer /></el-icon>
                                <span class="section-title">审核进度</span>
                            </div>
                        </template>

                        <el-steps :active="getActiveStep(paperDetails.paperStatus)" finish-status="success" align-center>
                            <el-step title="提交论文" :description="formatDate(paperDetails.submitTime)" />
                            <el-step :title="paperDetails.teacherName ? '分配导师' : '等待分配'"
                                :description="paperDetails.teacherName || '处理中'" />
                            <el-step :title="getReviewStepTitle(paperDetails.paperStatus)"
                                :description="getReviewStepDesc(paperDetails)" />
                            <el-step title="审核完成"
                                :description="paperDetails.paperStatus === 'completed' ? formatDate(paperDetails.reviewTime) : '--'" />
                            <el-step :title="dictStatusText('mid_defense', '中期答辩')" :icon="Calendar" :description="getDefenseStepDesc('mid_defense')" />
                            <el-step :title="dictStatusText('final_defense', '终期答辩')" :icon="Trophy" :description="getDefenseStepDesc('final_defense')" />
                            <el-step :title="dictStatusText('defense_passed', '答辩通过')" :icon="CircleCheckFilled" :description="getDefenseStepDesc('defense_passed')" />
                        </el-steps>
                    </el-card>
                </el-col>

                <!-- 右侧：相关信息 -->
                <el-col :xs="24" :lg="8">
                    <!-- 论文文件 -->
                    <el-card class="section-card" shadow="never">
                        <template #header>
                            <div class="section-header">
                                <el-icon><Paperclip /></el-icon>
                                <span class="section-title">论文文件</span>
                            </div>
                        </template>

                        <div v-if="fileInfo && fileInfo.id" class="file-info-container">
                            <div class="file-card">
                                <div class="file-header">
                                    <div class="file-icon-wrapper" :class="getFileIconClass(fileInfo.originalFilename)">
                                        <el-icon :size="24">
                                            <component :is="getFileIcon(fileInfo.originalFilename)" />
                                        </el-icon>
                                    </div>
                                    <div class="file-main-info">
                                        <div class="file-name" :title="fileInfo.originalFilename">{{ fileInfo.originalFilename }}</div>
                                        <div class="file-meta">
                                            <span>{{ fileInfo.fileSizeDesc }}</span>
                                            <span v-if="fileInfo.wordCount > 0">{{ fileInfo.wordCount }}字</span>
                                            <span>{{ formatDate(fileInfo.uploadTime) }}</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="file-actions">
                                    <el-button type="primary" plain :icon="Download" size="small" @click="downloadFile(fileInfo)">下载</el-button>
                                    <el-button plain :icon="View" size="small" @click="previewFile(fileInfo)">预览</el-button>
                                </div>
                            </div>
                            <div v-if="fileInfo.wordCount === 0" class="file-status-tip">
                                <el-alert title="字数统计未完成" type="info" :closable="false" show-icon size="small" />
                            </div>
                        </div>
                        <div v-else class="no-file">
                            <el-empty description="暂无论文文件" :image-size="48">
                                <el-button type="primary" :icon="Upload" @click="uploadFile">上传论文文件</el-button>
                            </el-empty>
                        </div>
                    </el-card>

                    <!-- 导师反馈 -->
                    <el-card class="section-card" shadow="never">
                        <template #header>
                            <div class="section-header">
                                <el-icon><ChatLineRound /></el-icon>
                                <span class="section-title">导师反馈</span>
                                <span v-if="paperDetails.teacherName" class="header-tag advisor-name">{{ paperDetails.teacherName }}</span>
                            </div>
                        </template>

                        <div v-if="paperDetails.feedback" class="feedback-text">{{ paperDetails.feedback }}</div>
                        <div v-else class="no-feedback">
                            <el-empty description="导师暂未给出反馈" :image-size="48" />
                        </div>

                        <div class="feedback-actions">
                            <el-button :icon="ChatDotRound" size="small" @click="contactAdvisor">联系导师</el-button>
                            <el-button :icon="ChatDotRound" size="small" @click="replyToFeedback">回复反馈</el-button>
                            <el-button
                                v-if="['defense_passed', 'finalized'].includes(paperDetails.paperStatus)"
                                type="primary"
                                plain
                                :icon="Star"
                                size="small"
                                @click="goAdvisorEvaluation"
                            >评价导师</el-button>
                        </div>
                    </el-card>

                    <!-- 审核历史 -->
                    <el-card v-if="paperDetails.reviewHistory?.length" class="section-card" shadow="never">
                        <template #header>
                            <div class="section-header">
                                <el-icon><Timer /></el-icon>
                                <span class="section-title">审核历史</span>
                            </div>
                        </template>

                        <div class="review-history">
                            <div v-for="review in paperDetails.reviewHistory" :key="review.id" class="review-item">
                                <div class="review-header">
                                    <div class="reviewer-info">
                                        <el-avatar :size="20" :src="getAvatarUrl(review.reviewerAvatar)">
                                            {{ review.reviewerName?.charAt(0) }}
                                        </el-avatar>
                                        <span class="reviewer-name">{{ review.reviewerName }}</span>
                                        <el-tag size="small" :type="getReviewTypeTag(review.type)">
                                            {{ getReviewTypeText(review.type) }}
                                        </el-tag>
                                    </div>
                                    <span class="review-time">{{ formatDate(review.reviewTime) }}</span>
                                </div>
                                <div class="review-content">{{ review.comments }}</div>
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
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { getPaperDetails, deleteFile as deleteFileAPI, createCheckTask, getCheckTaskDetail } from "@/api/student.js"
import { getAvatarUrl } from '@/utils/avatar'
import { getSimilarityColor, getSimilarityTagType as baseGetSimilarityTagType } from '@/utils/reviewStatus.js'
import { loadPaperTypes, getPaperTypeText } from '@/utils/paperType.js'
import { loadDefenseDict, getDefenseDictText, DICT_PAPER_STATUS } from '@/utils/defenseDict.js'
import { getSmartPreviewBlobUrl, getSmartPreviewReportBlobUrl, downloadFileBlob, revokeBlobUrl } from '@/utils/filePreview'

// 图标引入
import {
    ArrowLeft, Download, Document, TrendCharts, Timer,
    ChatLineRound, ChatDotRound, Paperclip, Upload, View, Refresh,
    DocumentChecked, DocumentAdd, Picture, VideoPlay, EditPen, FullScreen, Star,
    Calendar, Trophy, CircleCheckFilled, CircleCheck, Loading, CircleClose, Clock, QuestionFilled
} from '@element-plus/icons-vue'
import { getFileInfo } from "@/api/student.js"
import { getSubjectFieldTree } from '@/api/user.js'
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
const fileInfo = ref(null)
const loading = ref(false)
// 优先使用 props 传递的 ID，其次使用路由参数
const paperId = computed(() => props.paperId || route.query.id)
const subjectTree = ref([]); // 学科领域树形结构
const checkTask = ref(null)  // 存储检测任务信息
const checkTaskLoading = ref(false)

// ========== 论文附件预览相关数据==========
const previewVisible = ref(false)
const previewUrl = ref('')
const previewLoading = ref(false)
const previewError = ref(false)
const errorMessage = ref('')
// 相似度报告预览相关数据
const similarityPreviewVisible = ref(false)
const similarityPreviewUrl = ref('')
const similarityPreviewLoading = ref(false)
const similarityPreviewError = ref(false)
const similarityErrorMessage = ref('')
const currentSimilarityFileSize = ref('')

// 当前文件信息
const currentFileId = ref('')
const currentFileName = ref('')
const currentFileSize = ref('')
const currentFileType = ref('')

// ========== 计算属性 ==========
const previewTitle = computed(() => {
    return currentFileName.value ? `预览 - ${currentFileName.value}` : '文件预览'
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

    // 2. 显示预览弹框，开始加载
    // /api/file/** 需要登录态，iframe 直连接口地址会 401；改为带 JWT 拉取 blob 再给 iframe
    previewVisible.value = true
    previewLoading.value = true
    previewError.value = false
    previewUrl.value = ''

    try {
        revokeBlobUrl(previewUrl.value)
        previewUrl.value = await getSmartPreviewBlobUrl(file.id)
    } catch (error) {
        handlePreviewError(error)
    } finally {
        previewLoading.value = false
    }
}

// iframe加载完成
const onIframeLoad = () => {
    previewLoading.value = false
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
const retryPreview = async () => {
    if (currentFileId.value) {
        previewLoading.value = true
        previewError.value = false
        try {
            revokeBlobUrl(previewUrl.value)
            previewUrl.value = await getSmartPreviewBlobUrl(currentFileId.value) // 重新赋值触发iframe刷新
        } catch (error) {
            handlePreviewError(error)
        } finally {
            previewLoading.value = false
        }
    }
}

// 新窗口打开
const openInNewWindow = async () => {
    if (currentFileId.value) {
        try {
            const blobUrl = await getSmartPreviewBlobUrl(currentFileId.value)
            window.open(blobUrl, '_blank', 'width=1200,height=800')
            closePreview()
        } catch (error) {
            ElMessage.error(error.message || '打开失败，请重试')
        }
    }
}

// 下载代替预览
const downloadInstead = async () => {
    if (currentFileId.value) {
        try {
            await downloadFileBlob(
                `/api/file/download/${currentFileId.value}/${encodeURIComponent(currentFileName.value || 'document')}`,
                currentFileName.value || 'document'
            )
        } catch (error) {
            ElMessage.error(error.message || '下载失败，请重试')
        }
    }
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
        window.open(downloadUrl, '_blank');
        ElMessage.success('开始下载文件');
    } catch (error) {
        console.error('下载文件失败:', error);
        ElMessage.error('下载失败');
    }
}

// 处理预览错误
const handlePreviewError = (error) => {
    previewLoading.value = false;
    previewError.value = true;
    errorMessage.value = error.message || '文件预览失败，请尝试下载文件查看';
}

// 查看句级检测明细（P5 新页，taskId 按字符串传递防雪花 ID 精度丢失）
const viewSentenceDetail = () => {
    const taskId = checkTask.value?.taskId
    if (!taskId) {
        ElMessage.warning('暂无检测任务，无法查看明细')
        return
    }
    router.push(`/student/sentence-detail/${taskId}`)
}

// 重试预览
const retryReportPreview = () => {
    if (checkTask.value?.reportSummary?.reportId) {
        similarityPreviewLoading.value = true
        similarityPreviewError.value = false
        viewSimilarityReport()
    }
}

// 下载相似度报告
const downloadSimilarityReport = async () => {
    let loadingInstance = null
    try {
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
        const reportId = checkTask.value.reportSummary?.reportId
        if (!reportId) {
            ElMessage.warning('报告ID不存在，无法下载')
            return
        }

        // 4. 构建下载URL（根据后端接口）
        // 使用reportId
        const downloadUrl = `/check/api/file/downloadReport/${reportId}`

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
                    'Accept': 'application/pdf'
                }
            })

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

            // 降级方案：直接打开
            window.open(downloadUrl, '_blank')
            ElMessage.info('已在新窗口打开下载')
        }

    } catch (error) {
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
    similarityPreviewLoading.value = false
    similarityPreviewError.value = false
    similarityErrorMessage.value = ''
}

const deleteFile = async (file) => {
    try {
        const deleteRes = await deleteFileAPI(file.id)
        if (deleteRes.code === 200) {
            ElMessage.success('文件删除成功')
            await loadPaperDetails()
        }
    } catch (error) {
        ElMessage.error('网络错误，请检查连接后重试')
    }
}

const replaceFile = async (file) => {
    try {
        // 创建一个文件选择器
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.doc,.docx,.pdf,.txt';
        input.style.display = 'none';
        document.body.appendChild(input);
        
        // 触发文件选择
        input.click();
        
        // 监听文件选择事件
        input.onchange = async (e) => {
            const selectedFile = e.target.files[0];
            if (selectedFile) {
                // 创建FormData对象
                const formData = new FormData();
                formData.append('file', selectedFile);
                formData.append('userId', localStorage.getItem('userId') || 1);
                
                // 显示加载提示
                const loading = ElLoading.service({
                    lock: true,
                    text: '正在上传文件...',
                    background: 'rgba(0, 0, 0, 0.7)'
                });
                
                try {
                    // 调用上传接口
                    const uploadRes = await uploadFileAPI(formData);
                    if (uploadRes.code === 200) {
                        // 上传成功后，调用替换文件接口
                        const replaceRes = await updatePaperFile(paperId.value, uploadRes.data.fileId, uploadRes.data.md5);
                        if (replaceRes.code === 200) {
                            ElMessage.success('文件替换成功');
                            // 重新加载论文详情
                            await loadPaperDetails();
                        } else {
                            ElMessage.error(replaceRes.message || '文件替换失败');
                        }
                    } else {
                        ElMessage.error(uploadRes.message || '文件上传失败');
                    }
                } catch (error) {
            ElMessage.error('网络错误，请检查连接后重试');
        } finally {
                    // 关闭加载提示
                    loading.close();
                    // 移除临时创建的input元素
                    document.body.removeChild(input);
                }
            }
        };
    } catch (error) {
        console.error('文件替换失败:', error);
        ElMessage.error('网络错误，请检查连接后重试');
    }
}

// 上传文件操作（打开文件选择器）
const uploadFile = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.doc,.docx,.pdf,.txt'
    input.style.display = 'none'
    document.body.appendChild(input)
    input.click()

    input.onchange = async (e) => {
        const selectedFile = e.target.files[0]
        if (!selectedFile) {
            document.body.removeChild(input)
            return
        }

        const loading = ElLoading.service({
            lock: true,
            text: '正在上传文件...',
            background: 'rgba(0, 0, 0, 0.7)'
        })

        try {
            const formData = new FormData()
            formData.append('file', selectedFile)
            formData.append('userId', localStorage.getItem('userId') || '1')

            const uploadRes = await uploadFileAPI(formData)
            if (uploadRes.code === 200) {
                const replaceRes = await updatePaperFile(paperId.value, uploadRes.data.fileId, uploadRes.data.md5)
                if (replaceRes.code === 200) {
                    ElMessage.success('文件上传成功')
                    await loadPaperDetails()
                } else {
                    ElMessage.error(replaceRes.message || '关联文件失败')
                }
            } else {
                ElMessage.error(uploadRes.message || '文件上传失败')
            }
        } catch (error) {
            ElMessage.error('网络错误，请检查连接后重试')
        } finally {
            loading.close()
            document.body.removeChild(input)
        }
    }
}

// 上传文件的API调用
const uploadFileAPI = async (formData) => {
    const token = userStore.token || ''
    const response = await fetch('/check/api/file/upload', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    })
    return await response.json()
}

// 更新论文文件的API调用
//
// ⚠️ 这个端点在后端没有对应映射（StudentPaperController 没有 /papers/{id}/update），
//    属于死调用。这里只做一件事：去掉原先那几个**伪造默认值**
//    （collegeId/majorId 兜 1、paperType 兜 'graduation'）。
//    它们比"传空"危险得多 —— 一旦这个端点将来真的接上，论文缺失的字段会被静默
//    改绑成 1 号学院/1 号专业、类型改成"毕业论文"，而且不报任何错。
//    传空值让后端明确拒绝，比悄悄写错强。
//    另外这个调用用的是原生 fetch，绕开了 axios 拦截器，所以它失败时不会有全局提示。
const updatePaperFile = async (paperId, fileId, fileMd5) => {
    const token = userStore.token || ''
    const response = await fetch(`/check/api/papers/${paperId}/update`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            subjectCode: paperDetails.value.subjectCode || '',
            paperTitle: paperDetails.value.paperTitle || '',
            collegeId: paperDetails.value.collegeId,
            majorId: paperDetails.value.majorId,
            paperType: paperDetails.value.paperType,
            paperAbstract: paperDetails.value.paperAbstract || '',
            fileId: fileId,
            fileMd5: fileMd5
        })
    })
    return await response.json()
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
        ElMessage.error('网络错误，请检查连接后重试')
    } finally {
        loading.value = false
    }
}

const loadCheckTask = async () => {
    checkTaskLoading.value = true
    try {
        const res = await getCheckTaskDetail(paperId.value)

        if (res.code === 200 && res.data) {
            checkTask.value = res.data
        } else {
            checkTask.value = null
        }
    } catch (error) {
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
        } else {
            fileInfo.value = null
        }
    } catch (error) {
        fileInfo.value = null
    }
}

const goBack = () => {
    if (userStore.isStudent) {
        router.replace('/student/my-papers')
    } else if (userStore.isTeacher) {
        router.push('/teacher/paper-review/audit-records')
    } else if (userStore.isAdmin) {
        router.replace('/admin/paper-assignment')
    } else {
        router.replace('/')
    }
}

const getBackButtonText = computed(() => {
    if (userStore.isStudent) {
        return '返回我的论文'
    } else if (userStore.isTeacher) {
        return '返回审核记录'
    } else if (userStore.isAdmin) {
        return '返回论文分配'
    } else {
        return '返回首页'
    }
})

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
    }
}

const viewSimilarityReport = async () => {
    const idToUse = paperId.value
    
    // 检查paperId是否存在
    if (!idToUse) {
        ElMessage.error('论文ID不存在，无法查看报告')
        return
    }
    
    if (!checkTask.value) {
        // 检查paperDetails中是否有相似度数据
        if (paperDetails.value.similarityRate || paperDetails.value.similarity) {
            similarityPreviewVisible.value = true
            similarityPreviewLoading.value = true
            similarityPreviewError.value = false
            similarityErrorMessage.value = ''
            try {
                revokeBlobUrl(similarityPreviewUrl.value)
                similarityPreviewUrl.value = await getSmartPreviewReportBlobUrl(idToUse)
            } catch (error) {
                console.error('打开相似度报告失败:', error)
                similarityPreviewError.value = true
                similarityErrorMessage.value = error.message || '报告加载失败，请稍后重试'
                ElMessage.error('加载报告失败: ' + error.message)
            } finally {
                similarityPreviewLoading.value = false
            }
        } else {
            ElMessage.warning('暂无检测记录，请先进行相似度检测')
            return
        }
    } else if (checkTask.value.checkStatus.toLowerCase() !== 'completed') {
        const statusMap = {
            'checking': '检测正在进行中，请稍后再查看报告',
            'failure': '检测失败，无法查看报告',
            'pending': '检测排队中'
        }
        ElMessage.warning(statusMap[checkTask.value.checkStatus.toLowerCase()] || '检测未完成')
        return
    } else if (!checkTask.value.reportSummary?.reportId) {
        ElMessage.warning('报告生成中，请稍后重试')
        return
    } else {
        similarityPreviewVisible.value = true
        similarityPreviewLoading.value = true
        similarityPreviewError.value = false
        similarityErrorMessage.value = ''
        try {
            revokeBlobUrl(similarityPreviewUrl.value)
            similarityPreviewUrl.value = await getSmartPreviewReportBlobUrl(idToUse)
        } catch (error) {
            console.error('打开相似度报告失败:', error)
            similarityPreviewError.value = true
            similarityErrorMessage.value = error.message || '报告加载失败，请稍后重试'
            ElMessage.error('加载报告失败: ' + error.message)
        } finally {
            similarityPreviewLoading.value = false
        }
    }
};
const onSimilarityIframeLoad = () => {
    similarityPreviewLoading.value = false
}
const onSimilarityIframeError = () => {
    similarityPreviewLoading.value = false
    similarityPreviewError.value = true
    similarityErrorMessage.value = '报告加载失败，可能文件不存在或格式错误'
}
const retrySimilarityPreview = () => {
    similarityPreviewLoading.value = true
    similarityPreviewError.value = false
    similarityErrorMessage.value = ''
    viewSimilarityReport()
}

const closeSimilarityPreview = () => {
    similarityPreviewVisible.value = false
    similarityPreviewUrl.value = ''
    similarityPreviewLoading.value = false
    similarityPreviewError.value = false
    similarityErrorMessage.value = ''
}

const contactAdvisor = () => {
    if (paperDetails.value && paperDetails.value.teacherName) {
        const phone = paperDetails.value.teacherPhone || '未提供'
        const email = paperDetails.value.teacherEmail || '未提供'

        ElMessageBox.alert(
            `联系 ${paperDetails.value.teacherName} 老师\n\n电话：${phone}\n邮箱：${email}`,
            '联系指导老师',
            { confirmButtonText: '我知道了' }
        )
    } else {
        ElMessage.warning('暂无导师联系信息')
    }
}

const goAdvisorEvaluation = () => {
    router.push({ name: 'AdvisorEvaluation', query: { paperId: String(paperDetails.value?.id || '') } })
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
            // 引导用户到导师互动页面发送消息
            const confirmed = await ElMessageBox.confirm(
              '回复导师反馈请前往"导师互动"页面发送消息，是否立即跳转？',
              '提示',
              { confirmButtonText: '立即前往', cancelButtonText: '稍后', type: 'info' }
            ).catch(() => false)
            if (confirmed) {
              router.push('/student/advisor-interaction')
            }
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

// 论文类型的文案不再由本页维护：getPaperTypeText / getPaperTypeTagType
// 来自 utils/paperType.js（数据源是后端 PaperTypeEnum），见文件顶部 import。
// 原先这里有 getPaperTypeText 与 getPaperTypeTag 两份硬编码映射，
// 后者还多带一个 'research' —— 一个从未存在过的取值。

const getWordCountPercentage = (wordCount) => {
    if (!wordCount) return 0
    const type = paperDetails.value?.paperType
    const targetMap = {
        'graduation': 10000,
        'course': 3000,
        'other': 5000
    }
    // 这里的 key 是 PaperTypeEnum 的 code，与上面的映射同源；
    // 它只是进度条的展示基准（不是阈值、不参与判定），所以没走字典接口，
    // 新增类型时落到 default 即可，不会显示错东西。
    const target = targetMap[type] || 8000
    return Math.min(Math.round((wordCount / target) * 100), 100)
}

const getSimilarityTagType = (similarity) => {
    if (!similarity) return 'info'
    return baseGetSimilarityTagType(similarity)
}

const getSimilarityStatus = (similarity) => {
    // 如果检测任务状态为已完成，即使相似度为0，也应该显示相应状态
    if (checkTask.value?.checkStatus === 'completed') {
        if (similarity < 15) return '通过'
        if (similarity < 30) return '警告'
        return '过高'
    }
    if (!similarity) return '未检测'
    if (similarity < 15) return '通过'
    if (similarity < 30) return '警告'
    return '过高'
}

const getSimilarityTips = (similarity) => {
    // 如果检测任务状态为已完成，即使相似度为0，也应该显示相应提示
    if (checkTask.value?.checkStatus === 'completed') {
        if (similarity < 15) return '相似度符合要求'
        if (similarity < 30) return '相似度较高，建议修改'
        return '相似度过高，需要大幅修改'
    }
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
        'completed': 4,      // 步骤 4：初审通过（语义收窄），进入评阅阶段
        'reviewing': 4,      // 步骤 4：评阅任务已下发，仍在初审完成门槛内
        'mid_defense': 5,    // 步骤 5：中期答辩批次已安排
        'final_defense': 6,  // 步骤 6：终期答辩批次已安排
        'defense_passed': 7, // 步骤 7：答辩通过
        'finalized': 7,      // 定稿/归档都在答辩通过之后
        'archived': 7
    }
    return stepMap[paperStatus] || 1
}

// 进度时间线状态名文案：优先读 paper_status 字典（13 态），字典未加载时回退本地措辞；
// 已加载但未命中时 getDefenseDictText 返回裸值（脏数据一眼可见）
const dictStatusText = (code, fallback) => getDefenseDictText(DICT_PAPER_STATUS, code, fallback)

const getReviewStepTitle = (paperStatus) => {
    if (paperStatus === 'rejected') return '需要修改'
    if (paperStatus === 'completed') return '审核通过'
    if (paperStatus === 'reviewing') return dictStatusText('reviewing', '评阅中')
    if (paperStatus === 'mid_defense') return dictStatusText('mid_defense', '中期答辩')
    if (paperStatus === 'final_defense') return dictStatusText('final_defense', '终期答辩')
    if (paperStatus === 'defense_passed' || paperStatus === 'finalized' || paperStatus === 'archived') return dictStatusText('defense_passed', '答辩通过')
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
        if (paper.allocationStatus === 'pending_reassign') {
            return `${paper.teacherName} 拒绝接收，正在重新分配`
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

    // P3 答辩阶段状态：评阅 → 中期/终期答辩 → 答辩通过 → 定稿/归档
    if (status === 'reviewing') {
        return '评阅任务已下发，等待评阅教师完成评阅'
    }
    if (status === 'mid_defense') {
        return '中期答辩批次已安排'
    }
    if (status === 'final_defense') {
        return '终期答辩批次已安排'
    }
    if (status === 'defense_passed') {
        return '答辩通过，等待定稿归档'
    }
    if (status === 'finalized') {
        return '已定稿，待归档'
    }
    if (status === 'archived') {
        return '材料已归档'
    }

    return '状态未知'
}

// 新增答辩三步（中期答辩/终期答辩/答辩通过）的描述：未到达该阶段显示 '--'
const getDefenseStepDesc = (stage) => {
    const status = paperDetails.value?.paperStatus
    const AFTER = ['defense_passed', 'finalized', 'archived']
    if (stage === 'mid_defense') {
        if (status === 'mid_defense') return '中期答辩批次已安排'
        if (status === 'final_defense' || AFTER.includes(status)) return '已完成'
    }
    if (stage === 'final_defense') {
        if (status === 'final_defense') return '终期答辩批次已安排'
        if (AFTER.includes(status)) return '已完成'
    }
    if (stage === 'defense_passed') {
        if (status === 'defense_passed') return '答辩通过，等待定稿'
        if (AFTER.includes(status)) return '已完成'
    }
    return '--'
}

const getReviewTypeTag = (type) => {
    const tagMap = {
        'completed': 'success',
        'approved': 'success',
        'rejected': 'danger',
        'advisor': 'primary',
        'committee': 'success'
    }
    return tagMap[type] || 'info'
}

const getReviewTypeText = (type) => {
    const textMap = {
        'completed': '审核通过',
        'approved': '审核通过',
        'rejected': '审核不通过',
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
    // 值为组件对象（非字符串名）：全局图标注册已移除，字符串无法解析
    const iconMap = {
        'completed': CircleCheck,
        'checking': Loading,
        'processing': Loading,
        'failure': CircleClose,
        'pending': Clock
    }
    return iconMap[status] || QuestionFilled
}

onMounted(() => {
    loadPaperDetails(),
        subjectField()
    // 预取论文类型，让 getPaperTypeText 能把 code 渲染成中文（未加载完时先显示裸 code）
    // 失败不在这里处理：全局 axios 拦截器已经 toast 过，catch 只为避免未处理的 rejection
    loadPaperTypes().catch(() => {})
    // 预取 paper_status 字典，时间线三个答辩节点文案改由字典驱动（失败回退本地措辞）
    loadDefenseDict(DICT_PAPER_STATUS).catch(() => {})
});
</script>

<style lang="scss" scoped>
.paper-details-container {
    padding: 24px;
    min-height: 100vh;
    background: var(--apple-canvas-parchment);
}

// 页面头部
.paper-header {
    margin-bottom: 24px;
    background: var(--apple-primary);
    border-radius: 16px;
    padding: 28px 32px;

    .header-content {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .back-btn {
            padding-left: 0;
            color: rgba(255, 255, 255, 0.85);
            font-weight: 500;

            &:hover {
                color: white;
            }
        }

        .paper-title {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 600;
            color: white;
            line-height: 1.4;
        }

        .paper-status-row {
            display: flex;
            align-items: center;
            gap: 16px;
            flex-wrap: wrap;

            .paper-meta {
                display: flex;
                gap: 20px;
                flex-wrap: wrap;

                .meta-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 13px;
                    color: rgba(255, 255, 255, 0.8);
                }
            }
        }
    }
}

// 内容区域
.paper-content {
    .section-card {
        margin-bottom: 20px;
        border-radius: 12px;
        border: 1px solid var(--apple-slate-border);

        :deep(.el-card__header) {
            padding: 14px 20px;
            border-bottom: 1px solid var(--apple-canvas-parchment);
            background: var(--apple-surface-pearl);
        }

        :deep(.el-card__body) {
            padding: 20px;
        }
    }
}

.section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: var(--apple-ink);
    font-size: 15px;

    .el-icon {
        color: var(--apple-primary);
    }

    .header-tag {
        margin-left: auto;
    }

    .advisor-name {
        margin-left: auto;
        color: var(--apple-primary);
        font-size: 13px;
        font-weight: 500;
    }
}

// 论文信息卡片
.info-section {
    margin-bottom: 0;

    .info-label {
        font-size: 13px;
        color: var(--apple-ink-secondary);
        margin-bottom: 8px;
        font-weight: 500;
    }

    .info-value {
        color: var(--apple-ink);
        line-height: 1.6;
    }

    .abstract-text {
        color: var(--apple-slate-body);
        font-size: 14px;
        line-height: 1.7;
    }
}

.info-divider {
    height: 1px;
    background: var(--apple-canvas-parchment);
    margin: 16px 0;
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;

    .info-cell {
        display: flex;
        flex-direction: column;
        gap: 4px;

        .info-label {
            font-size: 12px;
            color: var(--apple-ink-secondary);
        }

        .info-value {
            font-size: 14px;
            color: var(--apple-ink);
            font-weight: 500;
        }
    }
}

.keywords-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

// 相似度检测
.similarity-row {
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;

    .similarity-rate {
        font-size: 2rem;
        font-weight: 700;
        line-height: 1;
    }

    .similarity-detail {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6px;

        .similarity-tip {
            font-size: 13px;
            color: var(--apple-ink-secondary);
        }
    }

    .similarity-actions {
        display: flex;
        gap: 8px;
    }
}

.check-task-info {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--apple-canvas-parchment);

    .task-row {
        display: flex;
        align-items: center;
        padding: 6px 0;
        font-size: 13px;

        .task-label {
            color: var(--apple-ink-secondary);
            min-width: 70px;
        }

        .task-value {
            color: var(--apple-ink);
        }

        .error-text {
            color: var(--apple-danger);
        }
    }
}

// 审核进度
:deep(.el-steps) {
    .el-step__title {
        font-size: 14px;
        font-weight: 600;
    }

    .el-step__description {
        font-size: 12px;
        color: var(--apple-ink-secondary);
    }
}

// 导师反馈
.feedback-text {
    font-size: 14px;
    line-height: 1.7;
    color: var(--apple-slate-body);
    padding: 16px;
    background: var(--apple-surface-pearl);
    border-radius: 8px;
    border-left: 3px solid var(--apple-primary);
    margin-bottom: 16px;
}

.no-feedback {
    padding: 16px 0;
}

.feedback-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
}

// 论文文件
.file-info-container {
    .file-card {
        padding: 14px;
        border-radius: 8px;
        background: var(--apple-surface-pearl);
        border: 1px solid var(--apple-slate-border);
    }

    .file-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
    }

    .file-icon-wrapper {
        width: 44px;
        height: 44px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        &.file-icon-doc { background: rgba(0, 102, 204, 0.1); color: var(--apple-primary); }
        &.file-icon-pdf { background: rgba(255, 77, 79, 0.08); color: var(--apple-danger); }
        &.file-icon-excel { background: rgba(82, 196, 26, 0.08); color: var(--apple-success); }
        &.file-icon-ppt { background: rgba(114, 46, 209, 0.08); color: #722ed1; }
        &.file-icon-txt { background: rgba(250, 173, 20, 0.08); color: var(--apple-warning); }
        &.file-icon-default { background: rgba(0, 102, 204, 0.1); color: var(--apple-primary); }
    }

    .file-main-info {
        flex: 1;
        min-width: 0;

        .file-name {
            font-weight: 600;
            color: var(--apple-ink);
            margin-bottom: 4px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 14px;
        }

        .file-meta {
            display: flex;
            gap: 12px;
            font-size: 12px;
            color: var(--apple-ink-secondary);
        }
    }

    .file-actions {
        display: flex;
        gap: 8px;
    }

    .file-status-tip {
        margin-top: 12px;
    }
}

.no-file {
    padding: 16px 0;
}

// 审核历史
.review-history {
    .review-item {
        padding: 12px;
        background: var(--apple-surface-pearl);
        border-radius: 8px;
        margin-bottom: 10px;

        &:last-child {
            margin-bottom: 0;
        }

        .review-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;

            .reviewer-info {
                display: flex;
                align-items: center;
                gap: 6px;

                .reviewer-name {
                    font-weight: 600;
                    color: var(--apple-ink);
                    font-size: 13px;
                }
            }

            .review-time {
                font-size: 12px;
                color: var(--apple-ink-secondary);
            }
        }

        .review-content {
            font-size: 13px;
            color: var(--apple-slate-body);
            line-height: 1.5;
            padding-left: 26px;
        }
    }
}

// 预览弹窗
.preview-wrapper {
    height: 70vh;
    position: relative;
    background: var(--apple-canvas-parchment);

    .preview-iframe {
        width: 100%;
        height: 100%;
        border: none;
        background: white;
    }

    .preview-error {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white;

        .error-detail {
            margin-top: 8px;
            color: var(--apple-ink-secondary);
            font-size: 14px;
            text-align: center;
        }
    }
}

.preview-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .file-info .file-name {
        font-weight: 600;
        color: var(--apple-ink);
    }

    .footer-actions {
        display: flex;
        gap: 8px;
    }
}

// 响应式
@media (max-width: 768px) {
    .paper-details-container {
        padding: 16px;
    }

    .paper-header {
        padding: 20px;
    }

    .info-grid {
        grid-template-columns: 1fr;
    }

    .similarity-row {
        flex-direction: column;
        align-items: flex-start;
    }

    .feedback-actions {
        flex-direction: column;
    }
}
</style>