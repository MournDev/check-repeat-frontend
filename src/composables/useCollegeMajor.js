import { ref } from 'vue'
import { getAllColleges, getAllMajors } from '@/api/user'

/**
 * 学院/专业字典（学生设置页的学院/专业级联、教师设置页的所属学院共用）。
 * 专业接口一次下发全部专业（每条带 collegeId），前端按学院过滤，换学院不用再等请求。
 */
export function useCollegeMajor() {
  const collegeList = ref([])
  const collegeLoading = ref(false)
  const majorList = ref([])
  const majorLoading = ref(false)

  async function fetchColleges() {
    collegeLoading.value = true
    try { const res = await getAllColleges(); if (res.code === 200) collegeList.value = res.data || [] }
    catch { /* ignore */ }
    finally { collegeLoading.value = false }
  }

  async function fetchMajors() {
    majorLoading.value = true
    try { const res = await getAllMajors(); if (res.code === 200) majorList.value = res.data || [] }
    catch { /* ignore */ }
    finally { majorLoading.value = false }
  }

  return { collegeList, collegeLoading, majorList, majorLoading, fetchColleges, fetchMajors }
}

/** 按 value 在字典列表里找一行；ID 在 JSON 里是数字、在下发时是字符串，一律转成字符串比 */
export function dictRowById(list, id) {
  if (id === null || id === undefined || id === '') return null
  return list.find(item => String(item.value) === String(id)) || null
}
