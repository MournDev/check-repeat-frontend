import { useUserStore } from '@/stores/user';

/**
 * 权限指令：根据用户角色控制元素显示
 * 使用方式：v-permission="['ADMIN', 'TEACHER']"
 */
export const permissionDirective = {
  mounted(el, binding) {
    const userStore = useUserStore();
    const roles = binding.value;
    
    if (!roles || !Array.isArray(roles)) {
      console.error('权限指令参数必须是角色数组');
      return;
    }
    
    const hasPermission = roles.includes(userStore.role);
    if (!hasPermission) {
      el.style.display = 'none';
    }
  },
  updated(el, binding) {
    const userStore = useUserStore();
    const roles = binding.value;
    
    if (!roles || !Array.isArray(roles)) {
      console.error('权限指令参数必须是角色数组');
      return;
    }
    
    const hasPermission = roles.includes(userStore.role);
    if (!hasPermission) {
      el.style.display = 'none';
    } else {
      el.style.display = '';
    }
  }
};

/**
 * 注册权限指令
 */
export function registerPermissionDirective(app) {
  app.directive('permission', permissionDirective);
}
