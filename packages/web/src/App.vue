<script setup lang="ts">
import './style.css'
// import Items from '../src/components/Items.vue'
import { RouterView, useRouter } from 'vue-router';

const router = useRouter()

function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('role')
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('role')
  router.replace('/login')
}
</script>

<template>
  <router-view v-if="$route.meta.layout === 'auth'" />
  <el-container v-else>
    <el-aside>
      <div style="text-align: center;justify-content: center;">
        <h3>我的我的</h3>
      </div>
      <el-menu router :default-active="$route.path">
        <el-menu-item index="/">工作台</el-menu-item>
        <el-menu-item index="/item">设备中心</el-menu-item>
        <el-menu-item index="/borrows">我的借用</el-menu-item>
      </el-menu>
    </el-aside>
    <el-main>
      <el-header class="app-header">
        <span>什么什么什么</span>
        <el-button type="danger" plain @click="logout">退出登录</el-button>
      </el-header>
      <router-view />
    </el-main>

  </el-container>

</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
