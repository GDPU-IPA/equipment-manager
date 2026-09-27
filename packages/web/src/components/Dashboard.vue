<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api, errorMessage, type ApiResponse, type PageData } from '../api'

const equipmentTotal = ref(0)
const borrowTotal = ref(0)
const userTotal = ref(0)
const categoryTotal = ref(0)
const loading = ref(false)
const error = ref('')

async function loadSummary() {
  loading.value = true
  error.value = ''
  try {
    const [equipments, borrows, users, categories] = await Promise.all([
      api.get<ApiResponse<PageData<unknown>>>('/equipments', { params: { pageSize: 1 } }),
      api.get<ApiResponse<PageData<unknown>>>('/borrows', { params: { pageSize: 1 } }),
      api.get<ApiResponse<PageData<unknown>>>('/users', { params: { pageSize: 1 } }),
      api.get<ApiResponse<unknown[]>>('/categories'),
    ])
    equipmentTotal.value = equipments.data.data.total
    borrowTotal.value = borrows.data.data.total
    userTotal.value = users.data.data.total
    categoryTotal.value = categories.data.data.length
  } catch (reason) { error.value = errorMessage(reason) }
  finally { loading.value = false }
}

onMounted(loadSummary)
</script>

<template>
  <div v-loading="loading">
    <el-alert v-if="error" :title="error" type="error" show-icon class="message" />
    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" :lg="6"><el-card shadow="hover"><el-statistic title="器材数量" :value="equipmentTotal" /></el-card></el-col>
      <el-col :xs="24" :sm="12" :lg="6"><el-card shadow="hover"><el-statistic title="借用明细" :value="borrowTotal" /></el-card></el-col>
      <el-col :xs="24" :sm="12" :lg="6"><el-card shadow="hover"><el-statistic title="用户数量" :value="userTotal" /></el-card></el-col>
      <el-col :xs="24" :sm="12" :lg="6"><el-card shadow="hover"><el-statistic title="启用分类" :value="categoryTotal" /></el-card></el-col>
    </el-row>
  </div>
</template>

<style scoped>
.message { margin-bottom: 16px; }
.el-col { margin-bottom: 20px; }
</style>
