// 缓存工具类

// 缓存项接口
class CacheItem {
  constructor(data, expireTime) {
    this.data = data;
    this.expireTime = expireTime;
    this.timestamp = Date.now();
  }

  // 检查缓存是否过期
  isExpired() {
    if (!this.expireTime) return false; // 永不过期
    return Date.now() - this.timestamp > this.expireTime;
  }
}

// 缓存管理器
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.defaultExpireTime = 5 * 60 * 1000; // 默认过期时间：5分钟
  }

  // 设置缓存
  set(key, data, expireTime = this.defaultExpireTime) {
    const cacheItem = new CacheItem(data, expireTime);
    this.cache.set(key, cacheItem);
    return data;
  }

  // 获取缓存
  get(key) {
    const cacheItem = this.cache.get(key);
    if (!cacheItem) return null;
    if (cacheItem.isExpired()) {
      this.cache.delete(key);
      return null;
    }
    return cacheItem.data;
  }

  // 删除缓存
  delete(key) {
    this.cache.delete(key);
  }

  // 清空缓存
  clear() {
    this.cache.clear();
  }

  // 检查缓存是否存在
  has(key) {
    const cacheItem = this.cache.get(key);
    if (!cacheItem) return false;
    if (cacheItem.isExpired()) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  // 获取缓存键列表
  keys() {
    return Array.from(this.cache.keys());
  }

  // 获取缓存大小
  size() {
    return this.cache.size;
  }
}

// 创建全局缓存实例
const cache = new CacheManager();

// 导出缓存实例和工具函数
export { cache };

// 生成缓存键的工具函数
export const generateCacheKey = (url, params = {}) => {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  return `${url}${sortedParams ? '?' + sortedParams : ''}`;
};

// 缓存装饰器
export const withCache = (expireTime) => {
  return (target, key, descriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = async function(...args) {
      // 生成缓存键
      const url = args[0];
      const params = args[1] || {};
      const cacheKey = generateCacheKey(url, params);
      
      // 检查缓存
      const cachedData = cache.get(cacheKey);
      if (cachedData) {
        console.log('📦 命中缓存:', cacheKey);
        return cachedData;
      }
      
      // 执行原始方法
      const result = await originalMethod.apply(this, args);
      
      // 缓存结果
      cache.set(cacheKey, result, expireTime);
      console.log('💾 缓存数据:', cacheKey);
      
      return result;
    };
    return descriptor;
  };
};
