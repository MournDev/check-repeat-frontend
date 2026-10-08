import request from './request'

export const login = (data) => {
  return request({
    url: '/api/auth/login',
    method: 'post',
    data: data
  })
}

export const register = (registerForm) => {
  return request({
    url: '/api/auth/register',
    method: 'post',
    data: {
      username: registerForm.username,
      password: registerForm.password,
      realName: registerForm.realName,
      roleId: registerForm.roleId,
      email: registerForm.email,
      phone: registerForm.phone
    }
  })
}

export const forgetPassword = (data) => {
  return request({
    url: '/api/auth/forgot-password',
    method: 'post',
    data: data,
    // silent：失败由 Reset.vue 用页面内联红条呈现。不加这个，拦截器会先弹一根
    // ElMessage.error，页面再显示同一句话，同一次失败报两遍。
    silent: true
  })
}

export const sendPasswordResetCode = (data) => {
  return request({
    url: '/api/auth/send-password-reset-code',
    method: 'post',
    data: data,
    silent: true
  })
}

export const logout = () => {
  return request({
    url: '/api/auth/logout',
    method: 'post',
    _skipLoginRedirect: true
  })
}
