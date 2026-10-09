<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api, errorMessage, type ApiResponse } from '../api'

interface SessionData {
  token: string
  role: string
}

const router = useRouter()
const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function login() {
  if (!username.value.trim() || !password.value) {
    error.value = '请输入用户名和密码'
    return
  }

  loading.value = true
  error.value = ''
  try {
    const { data } = await api.post<ApiResponse<SessionData>>('/session', {
      username: username.value.trim(),
      password: password.value,
    })
    localStorage.setItem('token', data.data.token)
    localStorage.setItem('role', data.data.role)
    await router.replace('/')
  } catch (reason) {
    error.value = errorMessage(reason)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="login-page">
    <el-card class="login-card" shadow="never">
      <template #header><strong>登录</strong></template>
      <el-alert v-if="error" :title="error" type="error" show-icon class="login-error" />
      <el-form label-position="top" @submit.prevent="login">
        <el-form-item label="用户名">
          <el-input v-model="username" autocomplete="username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input
            v-model="password"
            type="password"
            autocomplete="current-password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        <el-button class="login-button" type="primary" native-type="submit" :loading="loading">
          登录
        </el-button>
      </el-form>
    </el-card>
  </main>
</template>

<style scoped>
.login-page {
  display: grid;
  min-height: 100vh;
  place-items: center;
  background: #f5f7fa;
}

.login-card {
  width: min(400px, calc(100vw - 32px));
}

.login-error {
  margin-bottom: 16px;
}

.login-button {
  width: 100%;
}
</style>
