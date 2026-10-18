export const passwordRule = '密码需为 8-128 位，并同时包含大写字母、小写字母、数字和符号'

export function isStrongPassword(value: string) {
  return value.length >= 8
    && value.length <= 128
    && /[a-z]/.test(value)
    && /[A-Z]/.test(value)
    && /\d/.test(value)
    && /[^A-Za-z0-9]/.test(value)
}
