/**
 * 论文类型统一处理模块 —— 全前端唯一的取值域与文案来源。
 *
 * 为什么要「拉」而不是像 reviewStatus.js 那样把 code/文案硬编码在前端：
 * 论文类型的真相源是后端的 PaperTypeEnum，接口 /api/dict/data/type/paper_type
 * 直接由该枚举合成返回。如果这里再抄一份 code→中文 的映射，就又回到了改造前
 * 「三套值域各自漂移」的局面（当时提交页读字典、详情页和列表页各有一份硬编码，
 * 列表页那份还是 THESIS/JOURNAL/CONFERENCE 这套从未存在过的值）。
 * 所以本模块只缓存后端给的东西，一个字面量文案都不持有。
 *
 * 缓存与去重：模块级 options + 单个 inflight promise。四个页面（提交、详情、
 * 我的论文、查重历史）在同一个页面生命周期里并发调用时只会发一次请求。
 * 没有用 Pinia store：消费者只有这几个，一个模块级 ref 足够，也省掉注册样板。
 *
 * 响应式：options 是 ref 而非普通数组，因为 getPaperTypeText 要在模板里同步调用。
 * 它在渲染期间读 options.value，于是加载完成会自动触发重渲染。
 * （src/utils/cache.js 是纯时间缓存、非响应式，用在这里会出现"数据到了但页面不更新"。）
 */

import { ref } from 'vue'
import { getDictDataByType } from '@/api/user'

/** 与后端 DictConstants.DICT_PAPER_TYPE 对应 */
const DICT_TYPE = 'paper_type'

/** 「不限定类型」的展示文案。仅用于管理端阈值表格的只读展示，不是可提交的值 */
export const ALL_TYPES_LABEL = '全部类型'

/** [{ code, label }]，顺序以后端返回为准（= PaperTypeEnum 的声明顺序） */
const options = ref([])

/** 供 UI 判断"该不该显示重试入口"。加载失败时保持 false */
const loaded = ref(false)

let inflight = null

/**
 * 加载论文类型选项。已有缓存时直接返回，不发请求。
 *
 * 失败时**不吞异常**：全局 axios 拦截器（src/api/request.js）已经弹过一次
 * ElMessage，调用方不要再弹第二次，只需决定页面怎么呈现（通常是给一个重试入口）。
 *
 * @param {boolean} force 绕过缓存重新拉取（重试按钮用）
 * @returns {Promise<Array<{code: string, label: string}>>}
 */
export function loadPaperTypes(force = false) {
  if (loaded.value && !force) {
    return Promise.resolve(options.value)
  }
  // 并发调用共用同一个请求：四个页面同时挂载时只会有一个真正飞出去
  if (inflight) {
    return inflight
  }
  inflight = getDictDataByType(DICT_TYPE)
    .then((res) => {
      const rows = res?.data || []
      options.value = rows
        .map((item, index) => ({
          code: item.dictValue,
          label: item.dictLabel,
          // 后端已按枚举顺序给出；dictSort 缺失时用下标兜底，保证顺序稳定
          sort: item.dictSort ?? index,
        }))
        .sort((a, b) => a.sort - b.sort)
      loaded.value = true
      return options.value
    })
    .catch((err) => {
      // 保持 loaded=false，下次调用（或重试按钮）会重新发请求
      options.value = []
      loaded.value = false
      throw err
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}

/** 响应式选项列表，模板里可直接 v-for */
export function usePaperTypeOptions() {
  return options
}

/** 是否已经成功加载过 */
export function usePaperTypesLoaded() {
  return loaded
}

/**
 * code → 展示文案。同步，可在模板里直接调用。
 *
 * 未命中时**返回原始 code**，而不是"未知类型"之类的兜底文案：
 * 库里可能存在历史非法值（例如 THESIS），显示裸值一眼能看出是脏数据，
 * 显示"未知类型"则会让人以为系统不认识一个其实很常见的类型。
 * 选项还没加载完时同样返回裸值，加载完会自动重渲染成中文。
 */
export function getPaperTypeText(code) {
  if (!code) return ''
  const hit = options.value.find((item) => item.code === code)
  return hit ? hit.label : code
}

/**
 * code → el-tag 的 type。
 * 只为视觉区分，不影响任何判定，因此与后端枚举解耦、在本地按 code 固定下来。
 */
export function getPaperTypeTagType(code) {
  const tagMap = {
    graduation: 'success',
    course: 'info',
    other: 'warning',
  }
  return tagMap[code] || 'info'
}

/** 是否是合法取值。选项尚未加载时返回 false —— 调用方不应据此做提交前的硬性拦截 */
export function isValidPaperType(code) {
  return options.value.some((item) => item.code === code)
}
