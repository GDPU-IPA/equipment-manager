<script setup lang="ts">
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useApp } from "./store";
import {
  Grid,
  Box,
  Files,
  Document,
  Bell,
  User,
  Setting,
  Tickets,
  Check,
  Menu,
  SwitchButton,
  ArrowRight,
  Collection,
} from "@element-plus/icons-vue";
const app = useApp();
const route = useRoute();
const router = useRouter();
const mobileOpen = ref(false);
const nav = [
  { path: "/", name: "工作台", icon: Grid },
  { path: "/equipment", name: "设备中心", icon: Box },
  { path: "/materials", name: "耗材领用", icon: Collection },
  { path: "/loans", name: "我的借用", icon: Document },
  { path: "/application", name: "成员申请", icon: Check },
  { path: "/notifications", name: "通知中心", icon: Bell },
];
const adminNav = [
  { path: "/admin/assets", name: "器材台账", icon: Files },
  { path: "/admin/inventory", name: "库存管理", icon: Box },
  { path: "/admin/loans", name: "借用管理", icon: Tickets },
  { path: "/admin/applications", name: "成员审批", icon: Check },
  { path: "/admin/users", name: "成员与权限", icon: User },
  { path: "/admin/logs", name: "操作日志", icon: Setting },
];
watch(
  () => route.path,
  () => {
    mobileOpen.value = false;
  },
);
function logout() {
  app.logout();
  router.push("/login");
}
</script>
<template>
  <router-view v-if="!app.user" />
  <div v-else class="app-shell">
    <button
      v-if="mobileOpen"
      class="sidebar-scrim"
      aria-label="关闭导航"
      @click="mobileOpen = false"
    />
    <aside class="sidebar" :class="{ open: mobileOpen }">
      <router-link to="/" class="brand"
        ><span class="brand-mark">创</span
        ><span>创协器材管理<small>IPA · EQUIPMENT</small></span></router-link
      >
      <div class="workspace-label">
        <span class="status-dot" /> 社团资源工作空间
      </div>
      <nav aria-label="主导航">
        <p class="nav-label">我的工作空间</p>
        <router-link
          v-for="n in nav"
          :key="n.path"
          :to="n.path"
          :class="{ selected: route.path === n.path }"
          ><el-icon><component :is="n.icon" /></el-icon>{{ n.name
          }}<span
            v-if="n.path === '/notifications' && app.unread"
            class="count-badge"
            >{{ app.unread }}</span
          ></router-link
        >
        <template v-if="app.canManage"
          ><p class="nav-label">管理控制台</p>
          <router-link
            v-for="n in adminNav"
            :key="n.path"
            :to="n.path"
            :class="{ selected: route.path === n.path }"
            ><el-icon><component :is="n.icon" /></el-icon
            >{{ n.name }}</router-link
          ></template
        >
      </nav>
      <div class="sidebar-bottom">
        <span class="status-dot" /> 本地演示环境<small
          >第一版 · 设备 / 耗材管理</small
        >
      </div>
    </aside>
    <section class="main-shell">
      <header class="topbar">
        <div class="breadcrumb">
          <el-button
            class="mobile-toggle"
            text
            aria-label="打开导航"
            @click="mobileOpen = !mobileOpen"
            ><el-icon><Menu /></el-icon></el-button
          ><span>工作空间</span><el-icon><ArrowRight /></el-icon
          ><strong>{{ route.meta.title }}</strong>
        </div>
        <div class="top-actions">
          <router-link
            to="/notifications"
            class="notification-link"
            aria-label="查看通知"
            ><el-badge :value="app.unread" :hidden="!app.unread"
              ><el-icon><Bell /></el-icon></el-badge></router-link
          ><router-link to="/profile" class="user-chip"
            ><span class="avatar">{{ app.user.name.slice(0, 1) }}</span
            ><span
              >{{ app.user.name }}<small>{{ app.user.role }}</small></span
            ></router-link
          ><el-button text aria-label="退出登录" @click="logout"
            ><el-icon><SwitchButton /></el-icon
          ></el-button>
        </div>
      </header>
      <div class="demo-banner">
        <span>演示模式</span>
        数据保存在当前浏览器，尚未连接后端；请使用虚构信息。<router-link
          to="/profile"
          >账号设置 →</router-link
        >
      </div>
      <el-alert
        v-if="app.storageError"
        :title="app.storageError"
        type="error"
        :closable="false"
      />
      <main id="main-content"><router-view :key="route.path" /></main>
      <footer class="footer">
        让每一件器材，都有迹可循。<span>创新协会 · 资源管理平台</span>
      </footer>
    </section>
  </div>
</template>
