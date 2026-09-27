<script setup lang="ts">
import { computed, ref } from 'vue'
import { Collection, Files, Fold, Goods, House, User } from '@element-plus/icons-vue'
import Borrows from './components/Borrows.vue'
import Categories from './components/Categories.vue'
import Dashboard from './components/Dashboard.vue'
import Items from './components/Items.vue'
import Users from './components/Users.vue'

const activeMenu = ref('home')
const isCollapse = ref(false)
const menuItems = [
  { index: 'home', title: '数据概览', icon: House, component: Dashboard },
  { index: 'equipments', title: '器材管理', icon: Goods, component: Items },
  { index: 'categories', title: '器材分类', icon: Collection, component: Categories },
  { index: 'borrows', title: '借用记录', icon: Files, component: Borrows },
  { index: 'users', title: '用户管理', icon: User, component: Users },
]
const currentMenu = computed(() => menuItems.find((item) => item.index === activeMenu.value) || menuItems[0])
</script>

<template>
  <el-container class="app-layout">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="sidebar">
      <div class="brand"><el-icon :size="24"><Collection /></el-icon><span v-show="!isCollapse">实验室管理</span></div>
      <el-menu :default-active="activeMenu" :collapse="isCollapse" class="sidebar-menu" background-color="#1f2937" text-color="#cbd5e1" active-text-color="#fff" @select="activeMenu = $event">
        <el-menu-item v-for="item in menuItems" :key="item.index" :index="item.index">
          <el-icon><component :is="item.icon" /></el-icon><template #title>{{ item.title }}</template>
        </el-menu-item>
      </el-menu>
      <el-button class="collapse-button" text @click="isCollapse = !isCollapse"><el-icon><Fold /></el-icon><span v-show="!isCollapse">收起菜单</span></el-button>
    </el-aside>

    <el-container>
      <el-header class="topbar"><div><h1>{{ currentMenu.title }}</h1><p>实验室器材借用管理系统</p></div><el-tag type="success">管理端</el-tag></el-header>
      <el-main class="content"><component :is="currentMenu.component" /></el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.app-layout { min-height: 100vh; background: #f3f4f6; }
.sidebar { display: flex; flex-direction: column; overflow: hidden; background: #1f2937; transition: width .2s; }
.brand { display: flex; align-items: center; gap: 10px; height: 64px; padding: 0 20px; color: #fff; font-size: 17px; font-weight: 600; white-space: nowrap; }
.sidebar-menu { flex: 1; border-right: 0; }
.sidebar-menu:not(.el-menu--collapse) { width: 220px; }
.collapse-button { justify-content: flex-start; width: 100%; height: 48px; padding: 0 20px; color: #cbd5e1; }
.collapse-button:hover { color: #fff; background: #374151; }
.topbar { display: flex; align-items: center; justify-content: space-between; height: 76px; padding: 0 28px; background: #fff; border-bottom: 1px solid #e5e7eb; }
.topbar h1 { margin: 0; color: #111827; font-size: 20px; }
.topbar p { margin: 5px 0 0; color: #6b7280; font-size: 13px; }
.content { min-width: 0; padding: 24px; }
@media (max-width: 700px) { .sidebar { width: 64px !important; } .topbar { padding: 0 16px; } .content { padding: 12px; } }
</style>
