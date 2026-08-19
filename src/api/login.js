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
    data: data
  })
}
