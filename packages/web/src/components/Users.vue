<!-- <script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api, errorMessage, type ApiResponse, type PageData } from '../api'

interface UserRecord {
  id: number
  username: string
  role: string
  profile: unknown
  status: number
  created_at: string
  updated_at: string
}

const users = ref<UserRecord[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const role = ref('')
const status = ref<number | undefined>()
const loading = ref(false)
const error = ref('')

function formatDate(value: string) {
  return new Date(value).toLocaleString('zh-CN')
}

function formatProfile(profile: unknown) {
  if (!profile) return '-'
  return typeof profile === 'string' ? profile : JSON.stringify(profile)
}

async function loadUsers() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get<ApiResponse<PageData<UserRecord>>>('/users', {
      params: { page: page.value, pageSize: pageSize.value, role: role.value || undefined, status: status.value },
    })
    users.value = data.data.list
    total.value = data.data.total
  } catch (reason) {
    error.value = errorMessage(reason)
  } finally {
    loading.value = false
  }
}

function search() {
  page.value = 1
  loadUsers()
}

onMounted(loadUsers)
</script>

<template>
  <el-card shadow="never">
    <template #header><strong>用户管理</strong></template>
    <el-form inline class="filters">
      <el-form-item label="角色">
        <el-input v-model="role" clearable placeholder="例如 user / admin" @keyup.enter="search" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="status" clearable placeholder="全部" style="width: 120px">
          <el-option label="启用" :value="1" />
          <el-option label="停用" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item><el-button type="primary" @click="search">查询</el-button></el-form-item>
    </el-form>
    <el-alert v-if="error" :title="error" type="error" show-icon class="message" />
    <el-table v-loading="loading" :data="users" stripe>
      <el-table-column prop="id" label="编号" width="80" />
      <el-table-column prop="username" label="用户名" min-width="140" />
      <el-table-column prop="role" label="角色" width="120" />
      <el-table-column label="资料" min-width="200" show-overflow-tooltip>
        <template #default="{ row }">{{ formatProfile(row.profile) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }"><el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="创建时间" width="180">
        <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
      </el-table-column>
    </el-table>
    <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" @current-change="loadUsers" @size-change="search" />
  </el-card>
</template>

<style scoped>
.filters, .message { margin-bottom: 16px; }
.el-pagination { justify-content: flex-end; margin-top: 16px; }
</style> -->
