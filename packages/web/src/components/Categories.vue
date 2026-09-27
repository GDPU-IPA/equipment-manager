<!-- <script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api, errorMessage, type ApiResponse } from '../api'

interface Category {
  id: number
  parent_id: number
  name: string
  sort_order: number
  icon: string | null
}

const categories = ref<Category[]>([])
const loading = ref(false)
const error = ref('')

async function loadCategories() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get<ApiResponse<Category[]>>('/categories')
    categories.value = data.data
  } catch (reason) {
    error.value = errorMessage(reason)
  } finally {
    loading.value = false
  }
}

onMounted(loadCategories)
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <div class="card-header">
        <span>器材分类</span>
        <el-button @click="loadCategories">刷新</el-button>
      </div>
    </template>
    <el-alert v-if="error" :title="error" type="error" show-icon class="message" />
    <el-table v-loading="loading" :data="categories" stripe>
      <el-table-column prop="id" label="编号" width="90" />
      <el-table-column prop="name" label="分类名称" min-width="180" />
      <el-table-column prop="parent_id" label="父分类编号" width="130" />
      <el-table-column prop="sort_order" label="排序" width="100" />
      <el-table-column prop="icon" label="图标" min-width="180">
        <template #default="{ row }">{{ row.icon || '-' }}</template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<style scoped>
.card-header { display: flex; align-items: center; justify-content: space-between; }
.message { margin-bottom: 16px; }
</style> -->
