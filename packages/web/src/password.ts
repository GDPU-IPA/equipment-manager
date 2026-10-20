export const passwordRule = '密码需为 8-16 位，仅可使用字母、数字和 $@!%*?.&_-，且必须包含大写字母、小写字母、数字和符号'

export function isStrongPassword(value: string) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@!%*?.&_-])[\w$@!%*?.&-]{8,16}(?![\s\S])/.test(value)
}
