<script setup lang="ts">
import { ref, watch } from 'vue'
import { api, errorMessage, type ApiResponse } from '../api'
import { currentUser, type CurrentUser } from '../session'
import { isStrongPassword, passwordRule } from '../password'
const account = ref({ username: '', name: '', email: '', phone: '' })
const profileSaving = ref(false)
const profileError = ref('')
const profileSuccess = ref('')
watch(currentUser, user => {
  if (!user) return
  const profile = user.profile && typeof user.profile === 'object' ? user.profile as Record<string, unknown> : {}
  const field = (key: string) => typeof profile[key] === 'string' ? profile[key] as string : ''
  account.value = { username: user.username, name: field('name'), email: field('email'), phone: field('phone') }
}, { immediate: true })
async function saveAccount() {
  if (profileSaving.value) return
  profileError.value = profileSuccess.value = ''
  if (!account.value.username.trim()) {
    profileError.value = '请输入用户名'
    return
  }
  if (account.value.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.value.email.trim())) {
    profileError.value = '请输入正确的邮箱'
    return
  }
  profileSaving.value = true
  try {
    const { data } = await api.patch<ApiResponse<CurrentUser>>('/user/me', account.value)
    currentUser.value = data.data
    localStorage.setItem('username', data.data.username)
    profileSuccess.value = '账号信息保存成功'
  } catch (reason) { profileError.value = errorMessage(reason) }
  finally { profileSaving.value = false }
}
const oldPassword = ref('')
const newPassword = ref('')
const confirmation = ref('')
const saving = ref(false)
const error = ref('')
const success = ref('')
async function save() {
  if (saving.value) return
  error.value = success.value = ''
  if (!oldPassword.value || newPassword.value.length < 6) {
    error.value = '请输入旧密码，新密码必须不少于6位'
    return
  }
  if (newPassword.value !== confirmation.value) {
    error.value = '两次输入的新密码不一致'
    return
  }
  if (!isStrongPassword(newPassword.value)) {
    error.value = passwordRule
    return
  }
  saving.value = true
  try {
    await api.post('/user/me/password', { old_pwd: oldPassword.value, new_pwd: newPassword.value })
    oldPassword.value = newPassword.value = confirmation.value = ''
    success.value = '密码修改成功'
  } catch (reason) { error.value = errorMessage(reason) }
  finally { saving.value = false }
}
</script>
<template>
  <el-card shadow="never">

    <template #header><strong>账号信息</strong></template>
    <el-descriptions v-if="currentUser" :column="1" border>
      <el-descriptions-item label="用户名">{{ currentUser.username }}</el-descriptions-item>
      <el-descriptions-item label="角色">{{ currentUser.role === 'admin' ? '管理员' : '普通用户' }}</el-descriptions-item>
      <el-descriptions-item label="注册时间">{{ new Date(currentUser.created_at).toLocaleString('zh-CN')
        }}</el-descriptions-item>
    </el-descriptions>


    <h3>编辑账号信息</h3>
    <el-alert v-if="profileError" :title="profileError" type="error" show-icon class="message" />
    <el-alert v-if="profileSuccess" :title="profileSuccess" type="success" show-icon class="message" />
    <el-form class="password-form" label-position="top" :disabled="profileSaving" @submit.prevent="saveAccount">
      <el-form-item label="用户名" required><el-input v-model="account.username" maxlength="50"
          autocomplete="username" /></el-form-item>
      <el-form-item label="姓名"><el-input v-model="account.name" maxlength="50" autocomplete="name" /></el-form-item>
      <el-form-item label="邮箱"><el-input v-model="account.email" maxlength="254" autocomplete="email" /></el-form-item>
      <el-form-item label="联系电话"><el-input v-model="account.phone" maxlength="30" autocomplete="tel" /></el-form-item>
      <el-button type="primary" native-type="submit" :loading="profileSaving">保存账号信息</el-button>
    </el-form>


    <h3>修改密码</h3>
    <el-alert v-if="error" :title="error" type="error" show-icon class="message" />
    <el-alert v-if="success" :title="success" type="success" show-icon class="message" />
    <el-form class="password-form" label-position="top" :disabled="saving" @submit.prevent="save">
      <el-form-item label="旧密码"><el-input v-model="oldPassword" type="password" show-password
          autocomplete="current-password" /></el-form-item>
      <el-form-item label="新密码"><el-input v-model="newPassword" type="password" show-password
          autocomplete="new-password" placeholder="至少6位" /></el-form-item>
      <el-form-item label="确认新密码"><el-input v-model="confirmation" type="password" show-password
          autocomplete="new-password" /></el-form-item>
      <el-button type="primary" native-type="submit" :loading="saving">保存密码</el-button>
    </el-form>


  </el-card>
</template>


<style scoped>
.password-form {
  max-width: 420px;
}

.el-button{
  background-color: #142B5D;
  border-color: #142B5D;
}
</style>
