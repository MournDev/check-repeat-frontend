<template>
  <div class="review-templates">
    <!-- 页面头部 -->
    <PageHeader description="管理常用的审核意见模板，提高审核效率">
      <template #actions>
        <el-button type="primary" :icon="Plus" @click="showTemplateDialog">
          新建模板
        </el-button>
      </template>
    </PageHeader>

    <!-- 模板分类导航 -->
    <div class="category-nav">
      <el-tabs v-model="activeCategory" @tab-change="handleCategoryChange">
        <el-tab-pane
          v-for="category in categories"
          :key="category.value"
          :label="category.label"
          :name="category.value"
        >
          <div class="templates-grid">
            <div
              v-for="template in filteredTemplates"
              :key="template.id"
              class="template-card"
              @click="useTemplate(template)"
            >
              <div class="template-header">
                <div class="template-title">{{ template.title }}</div>
                <div class="template-actions">
                  <el-button
                    size="small"
                    type="primary"
                    text
                    :icon="Edit"
                    @click.stop="editTemplate(template)"
                  />
                  <el-button
                    size="small"
                    type="danger"
                    text
                    :icon="Delete"
                    @click.stop="deleteTemplate(template)"
                  />
                </div>
              </div>
              <div class="template-content">
                {{ truncateContent(template.content) }}
              </div>
              <div class="template-footer">
                <div class="template-meta">
                  <el-tag size="small" :type="getCategoryTagType(template.category)">
                    {{ getCategoryText(template.category) }}
                  </el-tag>
                  <span class="usage-count">使用 {{ template.usageCount }} 次</span>
                </div>
                <div class="template-time">
                  {{ formatDate(template.updateTime) }}
                </div>
              </div>
            </div>
            
            <div v-if="filteredTemplates.length === 0" class="empty-templates">
              <el-empty description="该分类下暂无模板">
                <el-button type="primary" @click="showTemplateDialog">
                  创建第一个模板
                </el-button>
              </el-empty>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 模板编辑对话框 -->
    <el-dialog
      v-model="templateDialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="resetForm"
    >
      <el-form
        :model="templateForm"
        :rules="templateRules"
        ref="templateFormRef"
        label-width="80px"
      >
        <el-form-item label="模板标题" prop="title">
          <el-input
            v-model="templateForm.title"
            placeholder="请输入模板标题"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="模板分类" prop="category">
          <el-select v-model="templateForm.category" placeholder="请选择分类">
            <el-option
              v-for="category in categories"
              :key="category.value"
              :label="category.label"
              :value="category.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="模板内容" prop="content">
          <el-input
            v-model="templateForm.content"
            type="textarea"
            :rows="8"
            placeholder="请输入模板内容"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="使用场景">
          <el-checkbox-group v-model="templateForm.scenarios">
            <el-checkbox label="初审">初审</el-checkbox>
            <el-checkbox label="复审">复审</el-checkbox>
            <el-checkbox label="终审">终审</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        
        <el-form-item label="是否公开">
          <el-switch
            v-model="templateForm.isPublic"
            active-text="公开"
            inactive-text="私有"
          />
          <div class="help-text">公开模板可供其他教师使用</div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="templateDialogVisible = false">取消</el-button>
          <el-button @click="previewTemplate">预览</el-button>
          <el-button type="primary" @click="saveTemplate">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 模板预览对话框 -->
    <el-dialog
      v-model="previewDialogVisible"
      title="模板预览"
      width="500px"
    >
      <div class="template-preview">
        <div class="preview-title">{{ previewTemplateData.title }}</div>
        <div class="preview-category">
          <el-tag size="small" :type="getCategoryTagType(previewTemplateData.category)">
            {{ getCategoryText(previewTemplateData.category) }}
          </el-tag>
        </div>
        <div class="preview-content">
          {{ previewTemplateData.content }}
        </div>
      </div>
    </el-dialog>

    <!-- 快速使用抽屉 -->
    <el-drawer
      v-model="quickUseDrawerVisible"
      title="快速使用模板"
      direction="rtl"
      size="400px"
    >
      <div class="quick-use-content">
        <div class="search-box">
          <el-input
            v-model="quickSearchKeyword"
            placeholder="搜索模板..."
            :prefix-icon="Search"
            clearable
          />
        </div>
        
        <div class="recent-templates">
          <div class="section-title">最近使用</div>
          <div
            v-for="template in recentTemplates"
            :key="template.id"
            class="template-item"
            @click="applyTemplate(template)"
          >
            <div class="template-info">
              <div class="template-name">{{ template.title }}</div>
              <div class="template-preview-text">
                {{ truncateContent(template.content, 50) }}
              </div>
            </div>
            <el-button size="small" type="primary" @click.stop="applyTemplate(template)">
              应用
            </el-button>
          </div>
        </div>
        
        <div class="all-templates">
          <div class="section-title">所有模板</div>
          <div
            v-for="template in searchableTemplates"
            :key="template.id"
            class="template-item"
            @click="applyTemplate(template)"
          >
            <div class="template-info">
              <div class="template-name">{{ template.title }}</div>
              <div class="template-category">
                <el-tag size="small" :type="getCategoryTagType(template.category)">
                  {{ getCategoryText(template.category) }}
                </el-tag>
              </div>
            </div>
            <el-button size="small" type="primary" @click.stop="applyTemplate(template)">
              应用
            </el-button>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '@/components/common/PageHeader.vue'
import { formatDate } from '@/utils/dataType.js'

// 图标导入
import {
  Plus, Edit, Delete, Search
} from '@element-plus/icons-vue'

// API导入
import {
  getReviewTemplates,
  createReviewTemplate,
  updateReviewTemplate,
  deleteReviewTemplate,
  useReviewTemplate
} from '@/api/teacher'

// 响应式数据
const activeCategory = ref('all')
const templates = ref([])
const templateDialogVisible = ref(false)
const previewDialogVisible = ref(false)
const quickUseDrawerVisible = ref(false)
const quickSearchKeyword = ref('')
const templateForm = ref({
  id: null,
  title: '',
  category: '',
  content: '',
  scenarios: [],
  isPublic: false
})
const templateFormRef = ref(null)
const previewTemplateData = ref({})

// 分类定义
const categories = [
  { label: '全部', value: 'all' },
  { label: '通过类', value: 'approve' },
  { label: '修改类', value: 'modify' },
  { label: '拒绝类', value: 'reject' },
  { label: '建议类', value: 'suggest' },
  { label: '格式类', value: 'format' }
]

// 计算属性
const filteredTemplates = computed(() => {
  if (activeCategory.value === 'all') {
    return templates.value
  }
  return templates.value.filter(template => template.category === activeCategory.value)
})

const recentTemplates = computed(() => {
  // 先复制再排：sort 是原地排序，直接对 templates.value 排会把表格的数据源一起改掉。
  // lastUsed 为 null（从未使用过）时用 0 兜底 —— new Date(undefined) 是 Invalid Date，
  // 参与比较会得到 NaN，排序结果就不确定了。
  return [...templates.value]
    .sort((a, b) => new Date(b.lastUsed || 0) - new Date(a.lastUsed || 0))
    .slice(0, 5)
})

const searchableTemplates = computed(() => {
  if (!quickSearchKeyword.value) return templates.value
  const keyword = quickSearchKeyword.value.toLowerCase()
  return templates.value.filter(template =>
    template.title.toLowerCase().includes(keyword) ||
    template.content.toLowerCase().includes(keyword)
  )
})

const dialogTitle = computed(() => {
  return templateForm.value.id ? '编辑模板' : '新建模板'
})

// 表单验证规则
const templateRules = {
  title: [
    { required: true, message: '请输入模板标题', trigger: 'blur' },
    { max: 50, message: '标题不能超过50个字符', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择模板分类', trigger: 'change' }
  ],
  content: [
    { required: true, message: '请输入模板内容', trigger: 'blur' },
    { min: 10, message: '内容至少10个字符', trigger: 'blur' },
    { max: 1000, message: '内容不能超过1000个字符', trigger: 'blur' }
  ]
}

// 方法
const handleCategoryChange = () => {
  // 分类切换处理
}

const showTemplateDialog = () => {
  templateForm.value = {
    id: null,
    title: '',
    category: '',
    content: '',
    scenarios: [],
    isPublic: false
  }
  templateDialogVisible.value = true
}

const editTemplate = (template) => {
  templateForm.value = { ...template }
  templateDialogVisible.value = true
}

const deleteTemplate = async (template) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除模板 "${template.title}" 吗？此操作不可撤销。`,
      '删除模板',
      { type: 'warning' }
    )
    
    // 非 200 已被全局拦截器 reject，能走到这里就是成功
    await deleteReviewTemplate(template.id)
    const index = templates.value.findIndex(t => t.id === template.id)
    if (index > -1) {
      templates.value.splice(index, 1)
    }
    ElMessage.success('模板删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      // 不在这里再弹提示：拦截器已经按状态码弹过一次，再弹就是两条
      console.error('删除模板失败:', error)
    }
  }
}

const saveTemplate = async () => {
  if (!templateFormRef.value) return
  
  await templateFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (templateForm.value.id) {
          // 更新模板
          const response = await updateReviewTemplate(templateForm.value.id, templateForm.value)
          const index = templates.value.findIndex(t => t.id === templateForm.value.id)
          if (index > -1) {
            templates.value[index] = response.data
          }
        } else {
          // 新建模板
          const response = await createReviewTemplate(templateForm.value)
          templates.value.push(response.data)
        }

        templateDialogVisible.value = false
        ElMessage.success('模板保存成功')
      } catch (error) {
        // 不在这里再弹提示：拦截器已经按状态码弹过一次
        console.error('保存模板失败:', error)
      }
    }
  })
}

const previewTemplate = () => {
  previewTemplateData.value = { ...templateForm.value }
  previewDialogVisible.value = true
}

const useTemplate = (template) => {
  // 使用模板的逻辑
  ElMessage.success(`已选择模板：${template.title}`)
}

const resetForm = () => {
  if (templateFormRef.value) {
    templateFormRef.value.resetFields()
  }
}

const openQuickUse = () => {
  quickUseDrawerVisible.value = true
}

const applyTemplate = async (template) => {
  try {
    // 应用模板到当前审核
    const response = await useReviewTemplate(template.id)
    ElMessage.success(`模板 "${template.title}" 已应用`)
    quickUseDrawerVisible.value = false

    // 用服务端返回的 VO 覆盖本地那一行：使用次数与最后使用时间都由服务端维护，
    // 本地再自行 +1 会与服务端算出的值重复计一次。
    const index = templates.value.findIndex(t => t.id === template.id)
    if (index > -1) {
      templates.value[index] = response.data
    }
  } catch (error) {
    // 不在这里再弹提示：拦截器已经按状态码弹过一次
    console.error('应用模板失败:', error)
  }
}

const truncateContent = (content, length = 100) => {
  if (!content) return ''
  return content.length > length ? content.substring(0, length) + '...' : content
}

const getCategoryTagType = (category) => {
  const typeMap = {
    'approve': 'success',
    'modify': 'warning',
    'reject': 'danger',
    'suggest': 'info',
    'format': 'primary'
  }
  return typeMap[category] || 'info'
}

const getCategoryText = (category) => {
  const textMap = {
    'approve': '通过类',
    'modify': '修改类',
    'reject': '拒绝类',
    'suggest': '建议类',
    'format': '格式类'
  }
  return textMap[category] || '未知分类'
}

// 生命周期
onMounted(async () => {
  // 加载模板数据
  try {
    const response = await getReviewTemplates()
    // 非 200 已被全局拦截器 reject，能拿到响应就是成功
    templates.value = response.data || []
  } catch (error) {
    // 不在这里再弹提示：拦截器已经按状态码弹过一次
    console.error('加载模板失败:', error)
  }
})
</script>

<style lang="scss" scoped>
.review-templates {
  .category-nav {
    :deep(.el-tabs__content) {
      padding: var(--apple-spacing-md) 0;
    }
    
    .templates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: var(--apple-spacing-md);
      
      .template-card {
        border: 1px solid var(--apple-hairline);
        border-radius: var(--apple-rounded-lg);
        padding: var(--apple-spacing-md);
        cursor: pointer;
        transition: border-color var(--apple-transition-normal);
        
        &:hover {
          border-color: var(--apple-primary);
        }
        
        .template-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--apple-spacing-sm);
          
          .template-title {
            font-family: var(--apple-font-display);
            font-size: var(--apple-fs-body-strong);
            font-weight: 600;
            color: var(--apple-ink);
            flex: 1;
            margin-right: var(--apple-spacing-sm);
          }
          
          .template-actions {
            display: flex;
            gap: var(--apple-spacing-xs);
          }
        }
        
        .template-content {
          color: var(--apple-ink-muted-80);
          line-height: 1.6;
          margin-bottom: var(--apple-spacing-md);
          font-size: var(--apple-fs-caption);
        }
        
        .template-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          
          .template-meta {
            display: flex;
            align-items: center;
            gap: var(--apple-spacing-xs);
            
            .usage-count {
              font-size: var(--apple-fs-fine-print);
              color: var(--apple-ink-muted-48);
            }
          }
          
          .template-time {
            font-size: var(--apple-fs-fine-print);
            color: var(--apple-ink-muted-48);
          }
        }
      }
      
      .empty-templates {
        grid-column: 1 / -1;
        padding: var(--apple-spacing-xxl) 0;
        text-align: center;
      }
    }
  }
  
  .template-preview {
    .preview-title {
      font-family: var(--apple-font-display);
      font-size: var(--apple-fs-body-strong);
      font-weight: 600;
      margin-bottom: var(--apple-spacing-sm);
      color: var(--apple-ink);
    }
    
    .preview-category {
      margin-bottom: var(--apple-spacing-md);
    }
    
    .preview-content {
      font-size: var(--apple-fs-caption);
      line-height: 1.6;
      color: var(--apple-ink-muted-80);
      white-space: pre-wrap;
    }
  }
  
  .quick-use-content {
    .search-box {
      margin-bottom: var(--apple-spacing-md);

      :deep(.el-input__wrapper) {
        border-radius: var(--apple-rounded-md);
        font-size: var(--apple-fs-caption);
      }
    }
    
    .section-title {
      margin: var(--apple-spacing-md) 0 var(--apple-spacing-sm);
      padding-bottom: var(--apple-spacing-xs);
      font-family: var(--apple-font-display);
      font-size: var(--apple-fs-body-strong);
      font-weight: 600;
      color: var(--apple-ink);
      border-bottom: 1px solid var(--apple-hairline);
    }
    
    .template-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--apple-spacing-sm);
      border: 1px solid var(--apple-hairline);
      border-radius: var(--apple-rounded-sm);
      margin-bottom: var(--apple-spacing-xs);
      cursor: pointer;
      transition: border-color var(--apple-transition-normal);

      &:hover {
        border-color: var(--apple-primary);
        background-color: var(--apple-canvas-parchment);
      }
      
      .template-info {
        flex: 1;
        margin-right: var(--apple-spacing-sm);
        
        .template-name {
          font-weight: 500;
          margin-bottom: var(--apple-spacing-xxs);
          color: var(--apple-ink);
        }
        
        .template-preview-text {
          font-size: var(--apple-fs-fine-print);
          color: var(--apple-ink-muted-48);
          margin-bottom: var(--apple-spacing-xxs);
        }
        
        .template-category {
          display: inline-block;
        }
      }
    }
  }
  
  .help-text {
    font-size: var(--apple-fs-fine-print);
    color: var(--apple-ink-muted-48);
    margin-top: var(--apple-spacing-xxs);
  }
}
</style>
