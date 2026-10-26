<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api, errorMessage, type ApiResponse, type PageData } from '../api'
import { currentUser } from '../session'

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
    const [equipments, borrows, categories] = await Promise.all([
      api.get<ApiResponse<PageData<unknown>>>('/equipments', { params: { pageSize: 1 } }),
      api.get<ApiResponse<PageData<unknown>>>('/borrows', { params: { pageSize: 1 } }),
      api.get<ApiResponse<unknown[]>>('/categories'),
    ])
    equipmentTotal.value = equipments.data.data.total
    borrowTotal.value = borrows.data.data.total
    categoryTotal.value = categories.data.data.length
    if (currentUser.value?.role === 'admin') {
      const users = await api.get<ApiResponse<PageData<unknown>>>('/user', { params: { pageSize: 1 } })
      userTotal.value = users.data.data.total
    } else {
      userTotal.value = 0
    }
  } catch (reason) { error.value = errorMessage(reason) }
  finally { loading.value = false }
}

onMounted(loadSummary)
</script>

<template>
  <div v-loading="loading">
    <div class="card-header message">
      <h2>工作台</h2><el-button :loading="loading" @click="loadSummary">刷新统计</el-button>
    </div>
    <el-alert v-if="error" :title="error" type="error" show-icon class="message" />
    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" :lg="6"><el-card shadow="hover" class="statistic-card"><el-statistic title="器材数量"
            :value="equipmentTotal" /></el-card></el-col>
      <el-col :xs="24" :sm="12" :lg="6"><el-card shadow="hover" class="statistic-card"><el-statistic title="借用明细"
            :value="borrowTotal" /></el-card></el-col>
      <el-col v-if="currentUser?.role === 'admin'" :xs="24" :sm="12" :lg="6"><el-card shadow="hover" class="statistic-card"><el-statistic
            title="用户数量" :value="userTotal" /></el-card></el-col>
      <el-col :xs="24" :sm="12" :lg="6"><el-card shadow="hover" class="statistic-card"><el-statistic title="启用分类"
            :value="categoryTotal" /></el-card></el-col>
    </el-row>
    <el-card shadow="never"><template #header><strong>快捷入口</strong></template>
      <el-space wrap>
        <el-button @click="$router.push('/item')" v-if="currentUser?.role === 'admin'">查看器材</el-button>
        <el-button @click="$router.push('/borrows')">{{ currentUser?.role === 'admin' ? '借用管理' : '申请借用' }}</el-button>
        <el-button @click="$router.push('/categories')">查看分类</el-button>
        <el-button @click="$router.push('/account')">账号信息</el-button>
        <el-button @click="$router.push('/announcement')" v-if="currentUser?.role === 'admin'">发布公告</el-button>

      </el-space>
    </el-card>
    <h2>公告</h2>
    <el-card shadow="never" style="margin-top: 2vh;">
      测试



    </el-card>
  </div>
</template>

<style scoped>
.message {
  margin-bottom: 16px;
}

.el-col {
  margin-bottom: 20px;
}

.el-card {
  border-radius: 11px !important;
}

</style>
