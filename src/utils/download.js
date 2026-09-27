import Cookies from 'js-cookie'
import { ElMessage } from 'element-plus'

/**
 * 下载论文文件
 * @param {number|string} fileId - 文件ID
 * @param {string} fileName - 文件名（可选，用于下载时显示的文件名）
 */
export const downloadPaper = async (fileId, fileName) => {
  if (!fileId) {
    ElMessage.error('文件ID不存在')
    return
  }

  try {
    const token = Cookies.get('token')
    if (!token) {
      ElMessage.error('请先登录')
      return
    }

    let downloadFileName = fileName ? decodeURIComponent(fileName) : '论文文件'
    
    // 确保文件名包含正确的扩展名
    const ext = downloadFileName.split('.').pop().toLowerCase()
    const validExts = ['docx', 'doc', 'pdf', 'txt', 'xlsx', 'xls', 'pptx', 'ppt']
    if (!validExts.includes(ext)) {
      downloadFileName += '.docx'
    }

    const response = await fetch(`/check/api/v1/file/download/${fileId}/${encodeURIComponent(downloadFileName)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': '*/*'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      ElMessage.error(`下载失败: ${errorText || '服务器错误'}`)
      return
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = downloadFileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    ElMessage.success('文件下载成功')
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error('下载失败，请重试')
  }
}
