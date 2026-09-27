/**
 * 第三方查重服务集成
 * 支持多个查重平台的统一接口
 */

// 第三方查重服务配置
const ThirdPartyServices = {
  CNKI: {
    name: '中国知网',
    apiUrl: '/api/thirdparty/cnki/check',
    maxFileSize: 50 * 1024 * 1024, // 50MB
    supportedFormats: ['.doc', '.docx', '.pdf', '.txt'],
    timeout: 300000 // 5分钟超时
  },
  WANFANG: {
    name: '万方数据',
    apiUrl: '/api/thirdparty/wanfang/check',
    maxFileSize: 30 * 1024 * 1024, // 30MB
    supportedFormats: ['.doc', '.docx', '.pdf'],
    timeout: 180000 // 3分钟超时
  },
  VIP: {
    name: '维普网',
    apiUrl: '/api/thirdparty/vip/check',
    maxFileSize: 20 * 1024 * 1024, // 20MB
    supportedFormats: ['.doc', '.docx', '.pdf', '.txt'],
    timeout: 120000 // 2分钟超时
  }
};

class ThirdPartyChecker {
  constructor() {
    this.currentService = 'CNKI'; // 默认使用知网
    this.apiToken = ''; // API令牌
  }

  /**
   * 设置当前使用的查重服务
   * @param {string} serviceName - 服务名称
   */
  setService(serviceName) {
    if (ThirdPartyServices[serviceName]) {
      this.currentService = serviceName;
    } else {
      throw new Error(`不支持的查重服务: ${serviceName}`);
    }
  }

  /**
   * 验证文件格式和大小
   * @param {File} file - 待查重文件
   * @returns {Object} 验证结果
   */
  validateFile(file) {
    const service = ThirdPartyServices[this.currentService];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    
    // 检查文件格式
    if (!service.supportedFormats.includes(fileExt)) {
      return {
        valid: false,
        error: `文件格式 ${fileExt} 不被支持，支持的格式: ${service.supportedFormats.join(', ')}`
      };
    }
    
    // 检查文件大小
    if (file.size > service.maxFileSize) {
      return {
        valid: false,
        error: `文件大小 ${this.formatFileSize(file.size)} 超过限制 ${this.formatFileSize(service.maxFileSize)}`
      };
    }
    
    return { valid: true };
  }

  /**
   * 格式化文件大小显示
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的大小
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 调用第三方查重API
   * @param {File} file - 待查重文件
   * @param {Object} metadata - 论文元数据
   * @returns {Promise<Object>} 查重结果
   */
  async checkPaper(file, metadata = {}) {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const service = ThirdPartyServices[this.currentService];
    const formData = new FormData();
    
    // 添加文件
    formData.append('file', file);
    
    // 添加元数据
    formData.append('title', metadata.title || '');
    formData.append('author', metadata.author || '');
    formData.append('keywords', metadata.keywords?.join(',') || '');
    formData.append('abstract', metadata.abstract || '');
    
    try {
      const response = await fetch(service.apiUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${this.apiToken}`
        },
        timeout: service.timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return this.processResponse(result);
    } catch (error) {
      throw new Error(`第三方查重调用失败: ${error.message}`);
    }
  }

  /**
   * 处理API响应
   * @param {Object} response - API响应数据
   * @returns {Object} 标准化结果
   */
  processResponse(response) {
    // 标准化不同服务商的响应格式
    switch (this.currentService) {
      case 'CNKI':
        return this.processCNKIResponse(response);
      case 'WANFANG':
        return this.processWanfangResponse(response);
      case 'VIP':
        return this.processVIPResponse(response);
      default:
        return response;
    }
  }

  /**
   * 处理知网响应
   */
  processCNKIResponse(response) {
    return {
      service: '中国知网',
      reportId: response.report_id,
      similarity: response.overall_similarity,
      detailUrl: response.detail_url,
      sections: response.similar_sections?.map(section => ({
        source: section.source_title,
        author: section.source_author,
        similarity: section.similarity,
        content: section.similar_content
      })) || [],
      updateTime: new Date().toISOString()
    };
  }

  /**
   * 处理万方响应
   */
  processWanfangResponse(response) {
    return {
      service: '万方数据',
      reportId: response.task_id,
      similarity: response.total_similarity,
      detailUrl: response.report_url,
      sections: response.detail_list?.map(section => ({
        source: section.title,
        author: section.author,
        similarity: section.sim_rate,
        content: section.content
      })) || [],
      updateTime: new Date().toISOString()
    };
  }

  /**
   * 处理维普响应
   */
  processVIPResponse(response) {
    return {
      service: '维普网',
      reportId: response.check_id,
      similarity: response.similarity_rate,
      detailUrl: response.report_link,
      sections: response.match_details?.map(detail => ({
        source: detail.source_title,
        author: detail.source_author,
        similarity: detail.match_rate,
        content: detail.match_content
      })) || [],
      updateTime: new Date().toISOString()
    };
  }

  /**
   * 获取查重报告
   * @param {string} reportId - 报告ID
   * @returns {Promise<Object>} 报告详情
   */
  async getReport(reportId) {
    const service = ThirdPartyServices[this.currentService];
    const url = `${service.apiUrl}/${reportId}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`获取报告失败: HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      throw new Error(`获取查重报告失败: ${error.message}`);
    }
  }

  /**
   * 批量查重
   * @param {Array} files - 文件数组
   * @param {Array} metadataList - 元数据数组
   * @returns {Promise<Array>} 查重结果数组
   */
  async batchCheck(files, metadataList = []) {
    const results = [];
    const errors = [];
    
    // 串行处理避免并发限制
    for (let i = 0; i < files.length; i++) {
      try {
        const result = await this.checkPaper(files[i], metadataList[i] || {});
        results.push({
          index: i,
          file: files[i].name,
          result: result
        });
      } catch (error) {
        errors.push({
          index: i,
          file: files[i].name,
          error: error.message
        });
      }
    }
    
    return {
      success: results,
      failed: errors,
      totalCount: files.length,
      successCount: results.length,
      failedCount: errors.length
    };
  }
}

/**
 * 查重调度器 - 统一管理校内和第三方查重
 */
class PlagiarismScheduler {
  constructor() {
    this.internalChecker = null; // 校内查重器实例
    this.thirdPartyChecker = new ThirdPartyChecker();
    this.queue = []; // 查重队列
    this.processing = false;
  }

  /**
   * 设置校内查重器
   * @param {Object} checker - 查重器实例
   */
  setInternalChecker(checker) {
    this.internalChecker = checker;
  }

  /**
   * 两阶段查重流程
   * @param {Object} paper - 论文对象
   * @param {boolean} skipInternal - 是否跳过校内查重
   * @returns {Promise<Object>} 查重结果
   */
  async twoStageCheck(paper, skipInternal = false) {
    const results = {
      paperId: paper.id,
      stages: {}
    };

    // 第一阶段：校内查重
    if (!skipInternal && this.internalChecker) {
      try {
        results.stages.internal = await this.internalChecker.checkPaper(paper.id, paper.content);
        results.stages.internal.completed = true;
        
        // 如果校内查重相似度过高，可以选择跳过第三方查重
        if (results.stages.internal.maxSimilarity >= 80) {
          results.skipThirdParty = true;
          results.reason = '校内查重相似度过高，疑似完全重复';
        }
      } catch (error) {
        results.stages.internal = {
          completed: false,
          error: error.message
        };
      }
    }

    // 第二阶段：第三方查重
    if (!results.skipThirdParty) {
      try {
        const file = this.textToFile(paper.content, `${paper.id}.txt`);
        const metadata = {
          title: paper.title,
          author: paper.author,
          keywords: paper.keywords,
          abstract: paper.abstract
        };
        
        results.stages.thirdParty = await this.thirdPartyChecker.checkPaper(file, metadata);
        results.stages.thirdParty.completed = true;
      } catch (error) {
        results.stages.thirdParty = {
          completed: false,
          error: error.message
        };
      }
    }

    // 生成综合报告
    results.finalReport = this.generateFinalReport(results);
    results.timestamp = new Date().toISOString();
    
    return results;
  }

  /**
   * 文本转文件对象
   * @param {string} text - 文本内容
   * @param {string} filename - 文件名
   * @returns {File} 文件对象
   */
  textToFile(text, filename) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    return new File([blob], filename, { type: 'text/plain' });
  }

  /**
   * 生成最终查重报告
   * @param {Object} results - 两阶段查重结果
   * @returns {Object} 综合报告
   */
  generateFinalReport(results) {
    const report = {
      paperId: results.paperId,
      overallSimilarity: 0,
      recommendation: '',
      warnings: [],
      details: {}
    };

    // 整合校内查重结果
    if (results.stages.internal?.completed) {
      report.details.internal = {
        similarity: results.stages.internal.maxSimilarity,
        similarPapers: results.stages.internal.similarPapers.length
      };
      report.overallSimilarity = Math.max(report.overallSimilarity, results.stages.internal.maxSimilarity);
    }

    // 整合第三方查重结果
    if (results.stages.thirdParty?.completed) {
      report.details.thirdParty = {
        similarity: results.stages.thirdParty.similarity,
        service: results.stages.thirdParty.service
      };
      report.overallSimilarity = Math.max(report.overallSimilarity, results.stages.thirdParty.similarity);
    }

    // 生成建议
    if (report.overallSimilarity >= 50) {
      report.recommendation = '高度疑似抄袭，请人工复核';
      report.warnings.push('相似度超过50%，存在严重抄袭嫌疑');
    } else if (report.overallSimilarity >= 30) {
      report.recommendation = '存在一定程度相似，建议检查引用规范';
      report.warnings.push('相似度较高，需仔细核查引用标注');
    } else if (report.overallSimilarity >= 15) {
      report.recommendation = '相似度适中，注意完善参考文献';
    } else {
      report.recommendation = '原创性良好，符合学术规范';
    }

    return report;
  }

  /**
   * 添加到查重队列
   * @param {Object} paper - 论文对象
   * @param {Function} callback - 完成回调
   */
  addToQueue(paper, callback) {
    this.queue.push({
      paper: paper,
      callback: callback,
      timestamp: Date.now()
    });
    
    if (!this.processing) {
      this.processQueue();
    }
  }

  /**
   * 处理查重队列
   */
  async processQueue() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const task = this.queue.shift();

    try {
      const result = await this.twoStageCheck(task.paper);
      task.callback(null, result);
    } catch (error) {
      task.callback(error, null);
    }

    // 继续处理下一个任务
    setTimeout(() => this.processQueue(), 1000); // 1秒间隔避免过于频繁
  }
}

// 导出实例
export const thirdPartyChecker = new ThirdPartyChecker();
export const plagiarismScheduler = new PlagiarismScheduler();

// 导出配置
export { ThirdPartyServices };