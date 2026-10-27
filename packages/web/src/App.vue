<script setup lang="ts">
import './styles/light.css'
// import './styles/dark.css'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api, errorMessage } from './api'
import { clearSession, currentUser } from './session'
import axios from 'axios'
import { HomeFilled } from '@element-plus/icons-vue'

const drawerVisible = ref(false)

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



    <!-- 电脑端的侧边栏 -->
    <el-aside id="sidebar">
      <div style="display: flex;justify-content: center;justify-items: center;margin-top:30px ;">
        <img src="/ipa-t.png" alt="" style="width: 100px;height: 100px;border-radius: 50%;background-color: white;">
      </div>
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
        <!-- <el-menu-item index="/announcement">公告</el-menu-item> -->
        <el-menu-item v-if="currentUser?.role === 'admin'" index="/item">设备中心</el-menu-item>
        <el-menu-item index="/borrows">借用记录</el-menu-item>
        <!-- <el-menu-item index="/categories">器材分类</el-menu-item> -->

        <el-menu-item v-if="currentUser?.role === 'admin'" index="/users">人员管理</el-menu-item>
        <el-menu-item index="/account">账号信息</el-menu-item>
        <div
          style="display: flex;flex-direction:column-reverse;justify-items: center;justify-content:center;align-items: center;margin-top: 8vh;">
          <el-button type="danger" plain :loading="loggingOut" @click="logout" style="width:88px;">退出登录</el-button>

        </div>


      </el-menu>
    </el-aside>

    <el-main>


      <!-- 移动端的顶部栏和汉堡菜单 -->
      <el-header class="app-header">
        <h2 style="margin-right: 28vw;" id="name">你好，{{ displayName }}</h2>
        <el-button class="hamburger" @click="drawerVisible = true">
          <el-icon>
            <HomeFilled />
          </el-icon>
        </el-button>
      </el-header>

      <el-alert v-if="logoutError" :title="logoutError" type="error" show-icon class="message" />
      <router-view />
    </el-main>

  </el-container>

  <!-- 移动端抽屉菜单 -->
  <el-drawer v-model="drawerVisible" direction="ltr" size="200px" :with-header="false">
    <el-menu @select="drawerVisible = false" router :default-active="$route.path">
      <div>
        <img src="/ipa-t.png" alt="" style="width: 70px;height: 70px;border-radius: 50%;background-color: white;margin-left: 12vw;margin-bottom:3vh;">
      </div>
      <el-menu-item index="/">工作台</el-menu-item>
      <!-- <el-menu-item index="/announcement">公告</el-menu-item> -->
      <el-menu-item v-if="currentUser?.role === 'admin'" index="/item">设备中心</el-menu-item>
      <el-menu-item index="/borrows">借用记录</el-menu-item>
      <!-- <el-menu-item index="/categories">器材分类</el-menu-item> -->

      <el-menu-item v-if="currentUser?.role === 'admin'" index="/users">人员管理</el-menu-item>
      <el-menu-item index="/account">账号信息</el-menu-item>
      <div
        style="display: flex;flex-direction:column-reverse;justify-items: center;justify-content:center;align-items: center;margin-top: 8vh;">
        <el-button type="danger" plain :loading="loggingOut" @click="logout" style="width:88px;">退出登录</el-button>

      </div>

    </el-menu>
  </el-drawer>

</template>

<style scoped>
/* .app-header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

*/


/* 默认（电脑端）：隐藏汉堡按钮，显示侧边栏 */
.hamburger {
  display: none;
}
.app-header{
  display: none;
}
#sidebar {
  width: 16vw !important;
  display: block;
  border-color: rgba(199, 200, 202, 0.301);
}

@media (max-width:768px) {
  #sidebar {
    display: none;
  }
  .app-header{
    display: flex;
  }
  .hamburger {
    display: inline-flex;
  }
}
</style>
