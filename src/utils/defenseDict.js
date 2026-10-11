/**
 * 答辩模块字典统一处理 —— P3 播种的 defense_* 五类 + 学生端时间线用的 paper_status。
 *
 * 与 paperType.js 同一范式：模块级 ref 缓存 + 单 inflight promise 去重，
 * 文案/取值域的真相源是数据库字典（sys_dict_data），本地不抄第二份映射。
 *
 * 响应项结构（后端 /api/dict/data/type/{type}）：{ dictValue, dictLabel, dictSort }。
 * 已核对 P3 播种 SQL：defense_result 的 dictValue 是 pass/fail/postpone（可直接作提交值），
 * defense_grade 的 dictValue 与 dictLabel 同为「优/良/中/及格/不及格」。
 * defense_batch_status 的 dictValue 是 '0'/'1'/'2' 字符串，文本查找按 String 归一。
 *
 * 失败语义：loadDefenseDict 不吞异常（全局拦截器已 toast，调用方勿重复弹）；
 * getDefenseDictText 在「字典未加载」时返回传入的 fallback（页面本地兜底文案），
 * 在「已加载但未命中」时返回裸值——库里有脏数据时显示裸值比显示"未知"更容易被发现。
 */

import { ref } from 'vue'
import { getDictDataByType } from '@/api/user'

export const DICT_BATCH_TYPE = 'defense_batch_type'
export const DICT_BATCH_STATUS = 'defense_batch_status'
export const DICT_MODE = 'defense_mode'
export const DICT_GROUP_ROLE = 'defense_group_role'
export const DICT_RESULT = 'defense_result'
export const DICT_GRADE = 'defense_grade'
/** 学生端论文进度时间线（13 态，P1 播种） */
export const DICT_PAPER_STATUS = 'paper_status'

const registry = new Map()

function getEntry(type) {
  if (!registry.has(type)) {
    registry.set(type, { options: ref([]), loaded: ref(false), inflight: null })
  }
  return registry.get(type)
}

/**
 * 加载指定字典类型的选项。已有缓存直接返回；并发调用共用同一个请求。
 * @param {string} type 字典类型
 * @param {boolean} force 绕过缓存重新拉取
 * @returns {Promise<Array<{value: string, label: string}>>}
 */
export function loadDefenseDict(type, force = false) {
  const entry = getEntry(type)
  if (entry.loaded.value && !force) {
    return Promise.resolve(entry.options.value)
  }
  if (entry.inflight) {
    return entry.inflight
  }
  entry.inflight = getDictDataByType(type)
    .then((res) => {
      const rows = res?.data || []
      entry.options.value = rows
        .map((item, index) => ({
          value: item.dictValue,
          label: item.dictLabel,
          sort: item.dictSort ?? index,
        }))
        .sort((a, b) => a.sort - b.sort)
      entry.loaded.value = true
      return entry.options.value
    })
    .catch((err) => {
      // 保持 loaded=false，下次调用会重新发请求
      entry.options.value = []
      entry.loaded.value = false
      throw err
    })
    .finally(() => {
      entry.inflight = null
    })
  return entry.inflight
}

/** 响应式选项列表（ref），模板里可直接 v-for；空数组表示尚未加载成功 */
export function useDefenseDictOptions(type) {
  return getEntry(type).options
}

/** 是否已成功加载过（用于判断要不要走本地兜底选项） */
export function useDefenseDictLoaded(type) {
  return getEntry(type).loaded
}

/**
 * code → 展示文案。同步，可在模板里直接调用（渲染期读取 ref，加载完成自动重渲染）。
 * @param {string} type 字典类型
 * @param {string|number} code 字典值
 * @param {string} [fallback] 字典未加载成功时的兜底文案（通常传页面本地映射的结果）
 */
export function getDefenseDictText(type, code, fallback = '') {
  if (code === null || code === undefined || code === '') return ''
  const entry = getEntry(type)
  if (!entry.loaded.value) return fallback
  const hit = entry.options.value.find((item) => String(item.value) === String(code))
  return hit ? hit.label : String(code)
}
