/**
 * 校内论文查重算法核心类
 * 实现基于文本相似度的查重检测
 */

class ChineseTokenizer {
  /**
   * 中文文本分词处理
   * @param {string} text - 输入文本
   * @returns {Array} 分词结果数组
   */
  tokenize(text) {
    // 简化的分词实现（实际项目中建议使用jieba等专业分词库）
    const stopWords = new Set(['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这']);
    
    // 基本的中文分词：按字符分割，过滤停用词
    return text
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ') // 保留中英文数字，其他替换为空格
      .split(/\s+/)
      .filter(word => word.length > 0 && !stopWords.has(word))
      .map(word => word.toLowerCase());
  }
}

class InternalPlagiarismChecker {
  constructor() {
    this.paperDatabase = new Map(); // 论文索引库
    this.tokenizer = new ChineseTokenizer(); // 中文分词器
    this.similarityThreshold = 0.2; // 相似度阈值 (20%)
    this.minMatchLength = 10; // 最小匹配长度
  }

  /**
   * 预处理文本
   * @param {string} text - 原始文本
   * @returns {Object} 处理后的文本特征
   */
  preprocess(text) {
    const tokens = this.tokenizer.tokenize(text);
    const frequency = this.calculateFrequency(tokens);
    const tfidf = this.calculateTFIDF(tokens, frequency);
    
    return {
      tokens,
      frequency,
      tfidf,
      length: tokens.length
    };
  }

  /**
   * 计算词频
   * @param {Array} tokens - 分词结果
   * @returns {Object} 词频统计
   */
  calculateFrequency(tokens) {
    const freq = {};
    tokens.forEach(token => {
      freq[token] = (freq[token] || 0) + 1;
    });
    return freq;
  }

  /**
   * 计算TF-IDF权重
   * @param {Array} tokens - 分词结果
   * @param {Object} frequency - 词频统计
   * @returns {Object} TF-IDF权重
   */
  calculateTFIDF(tokens, frequency) {
    const tfidf = {};
    const totalTokens = tokens.length;
    
    Object.keys(frequency).forEach(token => {
      const tf = frequency[token] / totalTokens;
      // 简化的IDF计算（实际应基于整个语料库）
      const idf = Math.log(this.paperDatabase.size / 1 + 1);
      tfidf[token] = tf * idf;
    });
    
    return tfidf;
  }

  /**
   * 余弦相似度计算
   * @param {Object} doc1 - 文档1特征
   * @param {Object} doc2 - 文档2特征
   * @returns {number} 相似度分数 (0-1)
   */
  cosineSimilarity(doc1, doc2) {
    const tfidf1 = doc1.tfidf;
    const tfidf2 = doc2.tfidf;
    
    // 获取所有词汇
    const allTokens = new Set([...Object.keys(tfidf1), ...Object.keys(tfidf2)]);
    
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;
    
    allTokens.forEach(token => {
      const tfidf1Value = tfidf1[token] || 0;
      const tfidf2Value = tfidf2[token] || 0;
      
      dotProduct += tfidf1Value * tfidf2Value;
      magnitude1 += tfidf1Value * tfidf1Value;
      magnitude2 += tfidf2Value * tfidf2Value;
    });
    
    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);
    
    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }
    
    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Jaccard相似度计算
   * @param {Array} tokens1 - 文档1分词
   * @param {Array} tokens2 - 文档2分词
   * @returns {number} 相似度分数 (0-1)
   */
  jaccardSimilarity(tokens1, tokens2) {
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    if (union.size === 0) return 0;
    return intersection.size / union.size;
  }

  /**
   * 查找匹配段落
   * @param {string} text1 - 文本1
   * @param {string} text2 - 文本2
   * @returns {Array} 匹配段落信息
   */
  findMatchedSections(text1, text2) {
    const sentences1 = this.splitToSentences(text1);
    const sentences2 = this.splitToSentences(text2);
    
    const matches = [];
    
    sentences1.forEach((sentence1, i) => {
      sentences2.forEach((sentence2, j) => {
        const similarity = this.calculateSentenceSimilarity(sentence1, sentence2);
        if (similarity > 0.7) { // 句子相似度阈值
          matches.push({
            sourceIndex: i,
            targetIndex: j,
            similarity: similarity,
            sourceText: sentence1,
            targetText: sentence2
          });
        }
      });
    });
    
    return matches.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * 句子分割
   * @param {string} text - 输入文本
   * @returns {Array} 句子数组
   */
  splitToSentences(text) {
    // 简单的句子分割（按句号、问号、感叹号分割）
    return text
      .split(/[。！？；]/)
      .filter(sentence => sentence.trim().length > this.minMatchLength);
  }

  /**
   * 句子相似度计算
   * @param {string} sentence1 - 句子1
   * @param {string} sentence2 - 句子2
   * @returns {number} 相似度分数
   */
  calculateSentenceSimilarity(sentence1, sentence2) {
    const tokens1 = this.tokenizer.tokenize(sentence1);
    const tokens2 = this.tokenizer.tokenize(sentence2);
    
    if (tokens1.length === 0 || tokens2.length === 0) return 0;
    
    return this.jaccardSimilarity(tokens1, tokens2);
  }

  /**
   * 添加论文到数据库
   * @param {Object} paper - 论文对象
   */
  addPaper(paper) {
    const processed = this.preprocess(paper.content);
    this.paperDatabase.set(paper.id, {
      ...paper,
      processed: processed
    });
  }

  /**
   * 从数据库移除论文
   * @param {string} paperId - 论文ID
   */
  removePaper(paperId) {
    this.paperDatabase.delete(paperId);
  }

  /**
   * 校内查重主方法
   * @param {string} paperId - 待查重论文ID
   * @param {string} content - 论文内容
   * @returns {Object} 查重结果
   */
  async checkPaper(paperId, content) {
    const startTime = Date.now();
    
    // 预处理待查重论文
    const currentDoc = this.preprocess(content);
    
    const results = [];
    let maxSimilarity = 0;
    let totalSimilarity = 0;
    let comparisonCount = 0;
    
    // 与库中每篇论文比较
    for (const [id, storedPaper] of this.paperDatabase) {
      if (id === paperId) continue; // 跳过自身
      
      comparisonCount++;
      
      // 计算多种相似度
      const cosineSim = this.cosineSimilarity(currentDoc, storedPaper.processed);
      const jaccardSim = this.jaccardSimilarity(currentDoc.tokens, storedPaper.processed.tokens);
      
      // 综合相似度（加权平均）
      const combinedSimilarity = (cosineSim * 0.7 + jaccardSim * 0.3);
      
      if (combinedSimilarity > this.similarityThreshold) {
        // 查找具体匹配段落
        const matchedSections = this.findMatchedSections(content, storedPaper.content);
        
        const result = {
          paperId: id,
          title: storedPaper.title,
          author: storedPaper.author,
          similarity: Math.round(combinedSimilarity * 10000) / 100, // 保留两位小数
          cosineSimilarity: Math.round(cosineSim * 10000) / 100,
          jaccardSimilarity: Math.round(jaccardSim * 10000) / 100,
          matchedSections: matchedSections.slice(0, 5), // 只保留前5个最匹配的段落
          wordCount: storedPaper.processed.length
        };
        
        results.push(result);
        maxSimilarity = Math.max(maxSimilarity, combinedSimilarity);
        totalSimilarity += combinedSimilarity;
      }
    }
    
    const processingTime = Date.now() - startTime;
    
    return {
      paperId: paperId,
      totalSimilarity: Math.round((totalSimilarity / Math.max(comparisonCount, 1)) * 10000) / 100,
      maxSimilarity: Math.round(maxSimilarity * 10000) / 100,
      averageSimilarity: Math.round((totalSimilarity / Math.max(results.length, 1)) * 10000) / 100,
      similarPapers: results.sort((a, b) => b.similarity - a.similarity),
      comparisonCount: comparisonCount,
      processingTime: processingTime,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 批量查重
   * @param {Array} papers - 论文数组
   * @returns {Promise<Array>} 查重结果数组
   */
  async batchCheck(papers) {
    const results = [];
    
    for (const paper of papers) {
      const result = await this.checkPaper(paper.id, paper.content);
      results.push({
        ...result,
        originalPaper: paper
      });
    }
    
    return results;
  }

  /**
   * 获取查重统计信息
   * @returns {Object} 统计信息
   */
  getStatistics() {
    return {
      totalPapers: this.paperDatabase.size,
      lastUpdateTime: new Date().toISOString(),
      threshold: this.similarityThreshold,
      minMatchLength: this.minMatchLength
    };
  }

  /**
   * 设置相似度阈值
   * @param {number} threshold - 阈值 (0-1)
   */
  setThreshold(threshold) {
    this.similarityThreshold = Math.max(0, Math.min(1, threshold));
  }

  /**
   * 导出查重报告
   * @param {Object} checkResult - 查重结果
   * @returns {Object} 格式化的报告
   */
  generateReport(checkResult) {
    return {
      reportId: `CHK_${Date.now()}`,
      paperId: checkResult.paperId,
      checkTime: checkResult.timestamp,
      totalSimilarity: checkResult.totalSimilarity,
      maxSimilarity: checkResult.maxSimilarity,
      similarPaperCount: checkResult.similarPapers.length,
      topMatches: checkResult.similarPapers.slice(0, 10),
      summary: this.generateSummary(checkResult),
      recommendations: this.generateRecommendations(checkResult)
    };
  }

  /**
   * 生成查重摘要
   * @param {Object} checkResult - 查重结果
   * @returns {string} 摘要文本
   */
  generateSummary(checkResult) {
    if (checkResult.maxSimilarity < 20) {
      return '该论文原创性较高，与其他论文相似度较低。';
    } else if (checkResult.maxSimilarity < 50) {
      return '该论文存在一定相似性，建议仔细检查引用标注。';
    } else {
      return '该论文相似度较高，可能存在抄袭风险，请重点关注。';
    }
  }

  /**
   * 生成建议
   * @param {Object} checkResult - 查重结果
   * @returns {Array} 建议列表
   */
  generateRecommendations(checkResult) {
    const recommendations = [];
    
    if (checkResult.maxSimilarity >= 50) {
      recommendations.push('建议进行人工复核');
      recommendations.push('检查参考文献标注是否完整');
      recommendations.push('核实是否存在合理引用');
    } else if (checkResult.maxSimilarity >= 20) {
      recommendations.push('建议补充参考文献');
      recommendations.push('完善引用标注');
    } else {
      recommendations.push('论文原创性良好');
    }
    
    return recommendations;
  }
}

// 导出查重器实例
export const plagiarismChecker = new InternalPlagiarismChecker();

// 导出工具函数
export const PlagiarismUtils = {
  /**
   * 文本清洗
   * @param {string} text - 原始文本
   * @returns {string} 清洗后的文本
   */
  cleanText(text) {
    return text
      .replace(/\s+/g, ' ') // 合并多个空白字符
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s。，！？；：""''（）]/g, '') // 保留基本标点
      .trim();
  },

  /**
   * 计算文本哈希值
   * @param {string} text - 输入文本
   * @returns {string} 哈希值
   */
  hashText(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash.toString(16);
  },

  /**
   * 生成论文指纹
   * @param {string} content - 论文内容
   * @returns {Array} 指纹数组
   */
  generateFingerprint(content) {
    const sentences = content.split(/[。！？]/).filter(s => s.trim().length > 0);
    const fingerprints = [];
    
    sentences.forEach((sentence, index) => {
      if (sentence.length > 20) {
        // 取句子的前10个字符和后10个字符作为指纹
        const fingerprint = sentence.substring(0, 10) + sentence.substring(Math.max(0, sentence.length - 10));
        fingerprints.push({
          index,
          fingerprint: this.hashText(fingerprint),
          length: sentence.length
        });
      }
    });
    
    return fingerprints;
  }
};