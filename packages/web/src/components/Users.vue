<script setup lang="ts">
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
const role = ref<'user' | 'admin'>('user')
const status = ref<number | undefined>()
const loading = ref(false)
const error = ref('')
const resetting = ref<UserRecord | null>(null)
const dialogVisible = ref(false)
const newPassword = ref('')
const confirmation = ref('')
const saving = ref(false)
const resetError = ref('')
const success = ref('')
const managementTab = ref<'password' | 'role'>('password')
const selectedRole = ref<'user' | 'admin'>('user')
function openReset(user: UserRecord) {
  resetting.value = user
  newPassword.value = confirmation.value = resetError.value = ''
  managementTab.value = 'password'
  selectedRole.value = user.role === 'admin' ? 'admin' : 'user'
  dialogVisible.value = true
}
async function updateRole() {
  if (saving.value || !resetting.value) return
  saving.value = true
  resetError.value = ''
  try {
    await api.patch(`/user/${resetting.value.id}/role`, { role: selectedRole.value })
    success.value = `已修改 ${resetting.value.username} 的用户类型`
    dialogVisible.value = false
    await loadUsers()
  } catch (reason) { resetError.value = errorMessage(reason) }
  finally { saving.value = false }
}
async function resetPassword() {
  if (saving.value || !resetting.value) return
  resetError.value = ''
  if (newPassword.value.length < 6 || newPassword.value !== confirmation.value) {
    resetError.value = '新密码至少6位，且两次输入须一致'
    return
  }
  saving.value = true
  try {
    await api.post(`/user/${resetting.value.id}/password`, { newPassword: newPassword.value })
    dialogVisible.value = false
    newPassword.value = confirmation.value = ''
    success.value = `已修改 ${resetting.value.username} 的密码`
  } catch (reason) { resetError.value = errorMessage(reason) }
  finally { saving.value = false }
}

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
    const { data } = await api.get<ApiResponse<PageData<UserRecord>>>('/user/users', {
      params: { page: page.value, pageSize: pageSize.value, role: role.value || undefined, status: status.value },
    })
    users.value = data.data.list
    total.value = data.data.total
  } catch (reason) {
    error.value = errorMessage(reason)
    users.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function search() {
  page.value = 1
  loadUsers()
}

function switchRole(value: string | number) {
  if (value !== 'user' && value !== 'admin') return
  const nextRole = value
  if (role.value === nextRole) return
  role.value = nextRole
  search()
}

onMounted(loadUsers)
</script>

<template>
  <el-card shadow="never">
    <template #header><strong>人员管理</strong></template>
    <el-tabs :model-value="role" @update:model-value="switchRole">
      <el-tab-pane label="普通用户" name="user" />
      <el-tab-pane label="管理员" name="admin" />
    </el-tabs>
    <el-form inline class="filters">
      <el-form-item label="状态">
        <el-select v-model="status" clearable placeholder="全部" style="width: 120px">
          <el-option label="启用" :value="1" />
          <el-option label="停用" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item><el-button type="primary" @click="search">查询</el-button></el-form-item>
    </el-form>
    <el-alert v-if="error" :title="error" type="error" show-icon class="message" />
    <el-alert v-if="success" :title="success" type="success" show-icon class="message" />
    <el-table v-loading="loading" :data="users" stripe empty-text="暂无用户">
      <el-table-column prop="id" label="编号" width="80" />
      <el-table-column prop="username" label="用户名" min-width="140" />
      <el-table-column label="姓名" min-width="120"><template #default="{ row }">{{ (row.profile && typeof row.profile === 'object' && !Array.isArray(row.profile) && 'name' in row.profile) ? (row.profile as { name?: unknown }).name || '-' : '-' }}</template></el-table-column>
      <el-table-column label="角色" width="120"><template #default="{ row }">{{ row.role === 'admin' ? '管理员' : '普通用户' }}</template></el-table-column>
      <el-table-column label="资料" min-width="200" show-overflow-tooltip>
        <template #default="{ row }">{{ formatProfile(row.profile) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }"><el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="创建时间" width="180">
        <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right"><template #default="{ row }"><el-button link type="primary" @click="openReset(row)">管理</el-button></template></el-table-column>
    </el-table>
    <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" @current-change="loadUsers" @size-change="search" />
  </el-card>
  <el-dialog v-model="dialogVisible" :title="`管理 ${resetting?.username || ''}`" width="min(480px, 92vw)" :close-on-click-modal="!saving" :show-close="!saving">
    <el-alert v-if="resetError" :title="resetError" type="error" class="message" />
    <el-tabs v-model="managementTab">
      <el-tab-pane label="修改密码" name="password">
      <el-form label-position="top" :disabled="saving" @submit.prevent="resetPassword">
      <el-form-item label="新密码"><el-input v-model="newPassword" type="password" autocomplete="new-password" show-password placeholder="至少6位" /></el-form-item>
      <el-form-item label="确认密码"><el-input v-model="confirmation" type="password" autocomplete="new-password" show-password /></el-form-item>
      <el-button :disabled="saving" @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" native-type="submit" :loading="saving">确认重置</el-button>
      </el-form>
      </el-tab-pane>
      <el-tab-pane label="修改用户类型" name="role">
        <el-form label-position="top" :disabled="saving" @submit.prevent="updateRole">
          <el-form-item label="用户类型"><el-radio-group v-model="selectedRole"><el-radio value="user">普通用户</el-radio><el-radio value="admin">管理员</el-radio></el-radio-group></el-form-item>
          <el-button type="primary" native-type="submit" :loading="saving">保存用户类型</el-button>
        </el-form>
      </el-tab-pane>
    </el-tabs>
  </el-dialog>
</template>

<!-- <style scoped>
.filters, .message { margin-bottom: 16px; }
.el-pagination { justify-content: flex-end; margin-top: 16px; }
</style> -->
