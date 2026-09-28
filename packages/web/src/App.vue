<script setup lang="ts">
import './style.css'
// import Items from '../src/components/Items.vue'
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const username = ref('熊二')

watch(() => route.fullPath, () => {
  username.value = localStorage.getItem('username') || '熊二'
}, { immediate: true })
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
        <h2>你好，{{ username }}</h2>
      </div>
      <el-menu router :default-active="$route.path">
        <el-menu-item index="/">工作台</el-menu-item>
        <el-menu-item index="/item">设备中心</el-menu-item>
        <el-menu-item index="/borrows">我的借用</el-menu-item>
        <el-menu-item index="/categories">器材分类</el-menu-item>
        <el-menu-item index="/">账号信息</el-menu-item>


      </el-menu>
    </el-aside>
    <el-main>
      <el-header class="app-header">
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
