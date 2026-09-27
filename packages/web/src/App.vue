<script setup lang="ts">
import './style.css'
// import Items from '../src/components/Items.vue'
import { RouterView } from 'vue-router';

</script>

<template>
  <el-container>
    <el-aside>
      <div style="text-align: center;justify-content: center;">
        <h3>我的我的</h3>
      </div>
      <el-menu router:default-active="$route.path">
        <el-menu-item index="/">工作台</el-menu-item>
        <el-menu-item index="/item">设备中心</el-menu-item>
        <el-menu-item index="borrows">我的借用</el-menu-item>
      </el-menu>
    </el-aside>
    <el-main>
      <el-header>
        什么什么什么
      </el-header>
      <router-view/>
    </el-main>

  </el-container>

</template>

<style scoped></style>
