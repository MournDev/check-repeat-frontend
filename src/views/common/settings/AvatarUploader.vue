<template>
  <div class="avatar-uploader">
    <el-avatar :size="size" :src="userStore.avatarSrc">{{ userStore.realName?.charAt(0) }}</el-avatar>
    <div class="avatar-actions">
      <slot :trigger="triggerFile" :uploading="uploading">
        <el-button :icon="Edit" @click="triggerFile">更换头像</el-button>
      </slot>
    </div>
    <input ref="avatarInput" type="file" accept="image/*" @change="handleAvatarChange" style="display:none" />
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Edit } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { uploadAvatar } from '@/api/user'

defineProps({
  size: { type: Number, default: 120 },
})

const userStore = useUserStore()
const avatarInput = ref(null)
const uploading = ref(false)

function triggerFile() { avatarInput.value?.click() }

async function handleAvatarChange(event) {
  const file = event.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) { ElMessage.error('请选择图片文件'); event.target.value = ''; return }
  if (file.size / 1024 / 1024 > 3) { ElMessage.error('图片大小不能超过3MB'); event.target.value = ''; return }
  const fd = new FormData(); fd.append('file', file)
  try {
    uploading.value = true
    // silent：失败提示统一在下面的 catch 里出一次，否则拦截器和 catch 会连弹两根红条
    const res = await uploadAvatar(fd, { silent: true })
    // code!==200 已经被拦截器 reject 到下面的 catch 了，这里只剩"成功但没给地址"这一种，
    // 曾经失败时 data 就是 null，而这里不判空，结果静默什么都不做、看起来像点了没反应
    if (!res.data) {
      ElMessage.error('头像上传失败：服务端未返回地址')
      return
    }
    userStore.updateAvatar(res.data)
    await nextTick()
    ElMessage.success('头像上传成功')
  } catch (e) { ElMessage.error(e?.response?.data?.message || e?.message || '头像上传失败') }
  finally { uploading.value = false; event.target.value = '' }
}
</script>
