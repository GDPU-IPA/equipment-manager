<script setup lang="ts">
import './style.css'
// import "./styles/dark.css"
// import Items from '../src/components/Items.vue'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api, errorMessage } from './api'
import { clearSession, currentUser } from './session'
import axios from 'axios'

const displayName = computed(() => {
  const profile = currentUser.value?.profile
  if (profile && typeof profile === 'object' && 'name' in profile &&
    typeof profile.name === 'string' && profile.name.trim()) {
    return profile.name.trim()
  }
  return currentUser.value?.username || '用户'
})
const router = useRouter()
const loggingOut = ref(false)
const logoutError = ref('')
async function logout() {
  if (loggingOut.value) return
  loggingOut.value = true
  logoutError.value = ''
  try {
    await api.post('/sessions/current')
    clearSession()
    await router.replace('/login')
  } catch (reason) {
    if (axios.isAxiosError(reason) && reason.response?.status === 401) {
      clearSession()
      await router.replace('/login')
    } else logoutError.value = errorMessage(reason)
  } finally { loggingOut.value = false }
}

</script>

<template>
  <router-view v-if="$route.meta.layout === 'auth'" />
  <el-container v-else>
    <el-aside id="sidebar">
      <div style="text-align: center;
        justify-content: center;
        padding: 12px;
        margin: 12px;
        border-color: black ;
        ">
        <h2>你好，{{ displayName }}</h2>
      </div>
      <el-menu router :default-active="$route.path">
        <el-menu-item index="/">工作台</el-menu-item>
        <el-menu-item index="/item">设备中心</el-menu-item>
        <el-menu-item index="/borrows">借用记录</el-menu-item>
        <el-menu-item index="/categories">器材分类</el-menu-item>
        <el-menu-item v-if="currentUser?.role === 'admin'" index="/users">人员管理</el-menu-item>
        <el-menu-item index="/account">账号信息</el-menu-item>


      </el-menu>
    </el-aside>
    <el-main>
      <el-header class="app-header">
        <el-button type="danger" plain :loading="loggingOut" @click="logout">退出登录</el-button>
        <!-- <span class="header-username">{{ username }}</span> -->
        <!-- <span>什么什么什么</span> -->
        <!-- <el-button type="danger" plain @click="logout">退出登录</el-button> -->
        <!-- <el-menu>
          <el-sub-menu>
            <template #我的></template>
<el-menu-item>账号信息</el-menu-item>
<el-menu-item>退出登录</el-menu-item>
</el-sub-menu>
</el-menu> -->

      </el-header>
      <el-alert v-if="logoutError" :title="logoutError" type="error" show-icon class="message" />
      <router-view />
    </el-main>

  </el-container>

</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.header-username {
  font-weight: 500;
}

#sidebar {
  width: 200px !important;

}
</style>
