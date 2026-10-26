<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { api, errorMessage, type ApiResponse, type PageData } from '../api'
import { borrowStatusLabel, formatBorrowDate, type BorrowListItem } from '../borrow'
import { currentUser } from '../session'
import BorrowApplication from './BorrowApplication.vue'
import BorrowDetail from './BorrowDetail.vue'

const records = ref<BorrowListItem[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const status = ref<number>()
const loading = ref(false)
const error = ref('')
const createVisible = ref(false)
const detailVisible = ref(false)
const selectedOrderId = ref<number | null>(null)
const isAdmin = computed(() => currentUser.value?.role === 'admin')

async function loadRecords() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get<ApiResponse<PageData<BorrowListItem>>>('/borrows', {
      params: { page: page.value, pageSize: pageSize.value, status: status.value },
    })
    records.value = data.data.list
    total.value = data.data.total
  } catch (reason) {
    error.value = errorMessage(reason)
    records.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function search() {
  page.value = 1
  loadRecords()
}

function showDetail(orderId: number) {
  selectedOrderId.value = orderId
  detailVisible.value = true
}

function applicationCreated() {
  status.value = undefined
  page.value = 1
  loadRecords()
  ElMessage.success('申请已提交，等待管理员审批')
}

onMounted(loadRecords)
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <div class="header">
        <strong>{{ isAdmin ? '借用管理' : '我的借用' }}</strong>
        <el-button type="primary" @click="createVisible = true">申请借用</el-button>
      </div>
    </template>
    <el-form inline class="filters">
      <el-form-item label="订单状态">
        <el-select v-model="status" clearable placeholder="全部" style="width: 150px">
          <el-option label="待审批" :value="0" />
          <el-option label="借用中" :value="1" />
          <el-option label="部分归还" :value="2" />
          <el-option label="已结清" :value="3" />
          <el-option label="已取消" :value="4" />
        </el-select>
      </el-form-item>
      <el-form-item><el-button @click="search">查询</el-button></el-form-item>
      <el-form-item><el-button :loading="loading" @click="loadRecords">刷新</el-button></el-form-item>
    </el-form>
    <el-alert v-if="error" :title="error" type="error" show-icon class="message" />
    <el-table v-loading="loading" :data="records" stripe empty-text="暂无借用记录">
      <el-table-column prop="order_id" label="订单编号" width="100" />
      <el-table-column prop="item.name" label="器材" min-width="160" />
      <el-table-column prop="borrow_qty" label="借用数量" width="100" />
      <el-table-column prop="returned_qty" label="已还数量" width="100" />
      <el-table-column label="订单状态" width="120">
        <template #default="{ row }">
          <el-tag :type="row.order.status === 0 ? 'warning' : row.order.status === 4 ? 'info' : 'success'">
            {{ borrowStatusLabel(row.order.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="应还时间" min-width="170">
        <template #default="{ row }">{{ formatBorrowDate(row.order.due_date) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="110" fixed="right">
        <template #default="{ row }"><el-button link type="primary" @click="showDetail(row.order_id)">查看与处理</el-button></template>
      </el-table-column>
    </el-table>
    <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50]"
      layout="total, sizes, prev, pager, next" @current-change="loadRecords" @size-change="search" />
  </el-card>

  <BorrowApplication v-model:visible="createVisible" @created="applicationCreated" />
  <BorrowDetail v-if="selectedOrderId !== null" v-model:visible="detailVisible" :order-id="selectedOrderId"
    @changed="loadRecords" />
</template>

<style scoped>
.header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.message { margin-bottom: 16px; }
</style>
