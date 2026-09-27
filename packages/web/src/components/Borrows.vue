<!-- <script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api, errorMessage, type ApiResponse, type PageData } from '../api'

interface BorrowRecord {
  id: number
  order_id: number
  item_id: number
  borrow_qty: number
  returned_qty: number
  status: number
  created_at: string
  order: { id: number; status: number; due_date: string | null }
  item: { id: number; name: string }
}

const records = ref<BorrowRecord[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const status = ref<number | undefined>()
const loading = ref(false)
const error = ref('')

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString('zh-CN') : '-'
}

function statusText(value: number) {
  return ({ 0: '待处理', 1: '借用中', 2: '已归还' } as Record<number, string>)[value] || `状态 ${value}`
}

async function loadRecords() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get<ApiResponse<PageData<BorrowRecord>>>('/borrows', {
      params: { page: page.value, pageSize: pageSize.value, status: status.value },
    })
    records.value = data.data.list
    total.value = data.data.total
  } catch (reason) {
    error.value = errorMessage(reason)
  } finally {
    loading.value = false
  }
}

function search() {
  page.value = 1
  loadRecords()
}

onMounted(loadRecords)
</script>

<template>
  <el-card shadow="never">
    <template #header><strong>借用记录</strong></template>
    <el-form inline class="filters">
      <el-form-item label="明细状态">
        <el-select v-model="status" clearable placeholder="全部" style="width: 140px">
          <el-option label="待处理" :value="0" />
          <el-option label="借用中" :value="1" />
          <el-option label="已归还" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item><el-button type="primary" @click="search">查询</el-button></el-form-item>
    </el-form>
    <el-alert v-if="error" :title="error" type="error" show-icon class="message" />
    <el-table v-loading="loading" :data="records" stripe>
      <el-table-column prop="id" label="明细编号" width="100" />
      <el-table-column prop="order_id" label="订单编号" width="100" />
      <el-table-column prop="item.name" label="器材名称" min-width="160" />
      <el-table-column prop="borrow_qty" label="借用数量" width="100" />
      <el-table-column prop="returned_qty" label="已还数量" width="100" />
      <el-table-column label="状态" width="110">
        <template #default="{ row }"><el-tag>{{ statusText(row.status) }}</el-tag></template>
      </el-table-column>
      <el-table-column label="应还时间" width="180">
        <template #default="{ row }">{{ formatDate(row.order.due_date) }}</template>
      </el-table-column>
      <el-table-column label="创建时间" width="180">
        <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
      </el-table-column>
    </el-table>
    <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" @current-change="loadRecords" @size-change="search" />
  </el-card>
</template>

<style scoped>
.filters, .message { margin-bottom: 16px; }
.el-pagination { justify-content: flex-end; margin-top: 16px; }
</style> -->





<template>
  <h2>Hello</h2>

</template>

<script setup>


</script>

<style>


</style>