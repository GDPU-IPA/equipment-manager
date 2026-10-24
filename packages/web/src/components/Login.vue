<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { api, errorMessage, type ApiResponse } from '../api'
import { isStrongPassword, passwordRule } from '../password'

interface SessionData {
  token: string
  role: string
}

const router = useRouter()
const username = ref('')
const name = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const mode = ref<'login' | 'register'>('login')
const confirmPassword = ref('')
const success = ref('')

watch(mode, () => {
  password.value = ''
  confirmPassword.value = ''
  error.value = ''
  success.value = ''
}, { flush: 'sync' })

async function login() {
  if (loading.value) return
  if (!username.value.trim() || !password.value) {
    error.value = '请输入用户名和密码'
    return
  }

  if (mode.value === 'register' && !name.value.trim()) {
    error.value = '请输入姓名'
    return
  }
  if (mode.value === 'register' && password.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致'
    return
  }
  if (mode.value === 'register' && !isStrongPassword(password.value)) {
    error.value = passwordRule
    return
  }

  loading.value = true
  error.value = ''
  success.value = ''
  try {
    const credentials = {
      username: username.value.trim(),
      password: password.value,
    }
    if (mode.value === 'register') {
      const registration = { ...credentials, profile: { name: credentials.username } }
      const { data } = await api.post<ApiResponse<unknown>>('/users', registration)
      if (data.code !== 201) throw new Error(data.msg || '注册失败')
      mode.value = 'login'
      success.value = '注册成功，请登录'
      return
    }
    const { data } = await api.post<ApiResponse<SessionData>>('/session', credentials)
    if (data.code !== 200) throw new Error(data.msg || '登录失败')
    const session = data.data
    if (typeof session?.token !== 'string' || !session.token) throw new Error('登录响应缺少有效凭证')
    localStorage.setItem('token', session.token)
    localStorage.setItem('role', session.role)
    localStorage.setItem('username', username.value.trim())
    await router.replace('/')
  } catch (reason) {
    error.value = errorMessage(reason)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="login-page" style="background-color: #FFFFFF;">
    <!-- <el-card id="slogan">
      
    </el-card> -->
    <div
      style="background-color:#FFFFFF ;display: flex;align-items: center;justify-content: center;justify-items: center;text-align: center;">
      <div style="display: block;justify-items: center;margin-right: 16vw;">
        <div style="margin-bottom: 3vh;"><img src="/ipa.png" alt="" style="height: 23vh;"></div>
        <div>
          <h1 style="font-family:Georgia, 'Times New Roman', Times, serif;">广东药科大学</h1>
        </div>
        <div style="margin-bottom: 7vh;">
          <h1 style="font-family:Georgia, 'Times New Roman', Times, serif;">创新实践协会器材管理系统</h1>
        </div>

      </div>


      <div>
        <el-card class="login-card" shadow="never">
          <template #header><strong>{{ mode === 'login' ? '登录' : '注册' }}</strong></template>
          <el-alert v-if="success" :title="success" type="success" show-icon :closable="false" class="login-error" />
          <el-alert v-if="error" :title="error" type="error" show-icon class="login-error" />
          <el-form label-position="top" @submit.prevent="login">
            <el-form-item label="学号/工号">
              <el-input v-model="username" :disabled="loading" autocomplete="username" placeholder="请输入用户名" />
            </el-form-item>
            <el-form-item v-if="mode === 'register'" label="姓名">
              <el-input v-model="name" :disabled="loading" autocomplete="name" placeholder="请输入姓名" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input v-model="password" type="password" :disabled="loading"
                :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
                :placeholder="mode === 'login' ? '请输入密码' : '请输入8-16位强密码'" show-password />
              <small v-if="mode === 'register'">{{ passwordRule }}</small>
            </el-form-item>
            <el-form-item v-if="mode === 'register'" label="确认密码">
              <el-input v-model="confirmPassword" :disabled="loading" type="password" autocomplete="new-password"
                placeholder="请再次输入密码" show-password />
            </el-form-item>
            <el-button class="login-button" type="primary" native-type="submit" :loading="loading">
              {{ mode === 'login' ? '登录' : '注册' }}
            </el-button>
            <el-button class="switch-button" link type="primary" :disabled="loading"
              @click="mode = mode === 'login' ? 'register' : 'login'">
              {{ mode === 'login' ? '没有账号？立即注册' : '已有账号？返回登录' }}
            </el-button>
          </el-form>
        </el-card>
      </div>
    </div>

  </main>
</template>

<style scoped>
#slogan {
  justify-content: center;
  text-align: center;

}

.el-input {
  --el-input-focus-border-color: #142B5D;
}

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
  background-color: #142B5D;
  border: #142B5D;
}

.switch-button {
  margin-top: 16px;
  color: #142B5D;
  /* border: #142B5D; */
}
</style>
