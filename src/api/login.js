import request from './request'

export const login = (data) => {
  return request({
    url: '/api/v1/auth/login',
    method: 'post',
    data: data
  })
}

export const register = (registerForm) => {
  return request({
    url: '/api/v1/auth/register',
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
    url: '/api/v1/auth/forgot-password',
    method: 'post',
    data: data
  })
}

export const sendPasswordResetCode = (data) => {
  return request({
    url: '/api/v1/auth/send-password-reset-code',
    method: 'post',
    data: data
  })
}

export const logout = () => {
  return request({
    url: '/api/v1/auth/logout',
    method: 'post',
    _skipLoginRedirect: true
  })
}
