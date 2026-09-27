<!-- <script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api, errorMessage, type ApiResponse, type PageData } from '../api'

interface Category { id: number; name: string }
interface Item { id: number; name: string; category_id: number; description: string | null; total_stock: number; available_stock: number; status: number; category?: Category }
interface ItemForm { name: string; category_id?: number; description: string; total_stock: number; available_stock?: number; status: number }

const items = ref<Item[]>([])
const categories = ref<Category[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const name = ref('')
const categoryId = ref<number>()
const loading = ref(false)
const error = ref('')
const dialogVisible = ref(false)
const editingId = ref<number>()
const saving = ref(false)
const form = ref<ItemForm>({ name: '', description: '', total_stock: 0, status: 1 })

async function loadCategories() {
  try {
    const { data } = await api.get<ApiResponse<Category[]>>('/categories')
    categories.value = data.data
  } catch (reason) { error.value = errorMessage(reason) }
}

async function loadItems() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get<ApiResponse<PageData<Item>>>('/equipments', { params: { page: page.value, pageSize: pageSize.value, name: name.value || undefined, category_id: categoryId.value } })
    items.value = data.data.list
    total.value = data.data.total
  } catch (reason) {
    error.value = errorMessage(reason)
    items.value = []
  } finally { loading.value = false }
}

function search() { page.value = 1; loadItems() }

function openCreate() {
  editingId.value = undefined
  form.value = { name: '', description: '', total_stock: 0, status: 1 }
  dialogVisible.value = true
}

function openEdit(item: Item) {
  editingId.value = item.id
  form.value = { name: item.name, category_id: item.category_id, description: item.description || '', total_stock: item.total_stock, available_stock: item.available_stock, status: item.status }
  dialogVisible.value = true
}

async function save() {
  if (!form.value.name.trim() || !form.value.category_id || form.value.total_stock < 0) return
  saving.value = true
  try {
    if (editingId.value) await api.patch(`/equipments/${editingId.value}`, form.value)
    else await api.post('/equipments', form.value)
    dialogVisible.value = false
    await loadItems()
  } catch (reason) { error.value = errorMessage(reason) }
  finally { saving.value = false }
}

async function toggleStatus(item: Item) {
  try {
    await api.patch(`/equipments/${item.id}/status`, { status: item.status === 1 ? 0 : 1 })
    await loadItems()
  } catch (reason) { error.value = errorMessage(reason) }
}

onMounted(() => { loadCategories(); loadItems() })
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <div class="header"><strong>器材管理</strong><el-button type="primary" @click="openCreate">新增器材</el-button></div>
    </template>
    <el-form inline class="filters">
      <el-form-item label="名称"><el-input v-model="name" clearable placeholder="器材名称" @keyup.enter="search" /></el-form-item>
      <el-form-item label="分类"><el-select v-model="categoryId" clearable placeholder="全部" style="width: 160px"><el-option v-for="category in categories" :key="category.id" :label="category.name" :value="category.id" /></el-select></el-form-item>
      <el-form-item><el-button type="primary" @click="search">查询</el-button></el-form-item>
    </el-form>
    <el-alert v-if="error" :title="error" type="error" show-icon class="message" />
    <el-table v-loading="loading" :data="items" stripe>
      <el-table-column prop="id" label="编号" width="80" />
      <el-table-column prop="name" label="名称" min-width="160" />
      <el-table-column label="分类" min-width="120"><template #default="{ row }">{{ row.category?.name || '-' }}</template></el-table-column>
      <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
      <el-table-column prop="total_stock" label="总库存" width="100" />
      <el-table-column prop="available_stock" label="可用库存" width="110" />
      <el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag></template></el-table-column>
      <el-table-column label="操作" width="180" fixed="right"><template #default="{ row }"><el-button link type="primary" @click="openEdit(row)">编辑</el-button><el-button link :type="row.status === 1 ? 'warning' : 'success'" @click="toggleStatus(row)">{{ row.status === 1 ? '停用' : '启用' }}</el-button></template></el-table-column>
    </el-table>
    <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" @current-change="loadItems" @size-change="search" />
  </el-card>

  <el-dialog v-model="dialogVisible" :title="editingId ? '编辑器材' : '新增器材'" width="520px">
    <el-form label-width="90px">
      <el-form-item label="名称" required><el-input v-model="form.name" /></el-form-item>
      <el-form-item label="分类" required><el-select v-model="form.category_id" placeholder="请选择分类" style="width: 100%"><el-option v-for="category in categories" :key="category.id" :label="category.name" :value="category.id" /></el-select></el-form-item>
      <el-form-item label="总库存" required><el-input-number v-model="form.total_stock" :min="0" /></el-form-item>
      <el-form-item label="描述"><el-input v-model="form.description" type="textarea" /></el-form-item>
    </el-form>
    <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="save">保存</el-button></template>
  </el-dialog>
</template>

<style scoped>
.header { display: flex; align-items: center; justify-content: space-between; }
.filters, .message { margin-bottom: 16px; }
.el-pagination { justify-content: flex-end; margin-top: 16px; }
</style> -->


<script setup lang="ts">
// import {ref} from 'vue'
import { onMounted, ref } from 'vue'
import { api, errorMessage, type ApiResponse, type PageData } from '../api'

interface Category { id: number; name: string }
interface Item { id: number; name: string; category_id: number; description: string | null; total_stock: number; available_stock: number; status: number; category?: Category }
interface ItemForm { name: string; category_id?: number; description: string; total_stock: number; available_stock?: number; status: number }

const items = ref<Item[]>([])
const categories = ref<Category[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const name = ref('')
const categoryId = ref<number>()
const loading = ref(false)
const error = ref('')
const dialogVisible = ref(false)
const editingId = ref<number>()
const saving = ref(false)
const form = ref<ItemForm>({ name: '', description: '', total_stock: 0, status: 1 })

async function loadCategories() {
  try {
    const { data } = await api.get<ApiResponse<Category[]>>('/categories')
    categories.value = data.data
  } catch (reason) { error.value = errorMessage(reason) }
}

async function loadItems() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get<ApiResponse<PageData<Item>>>('/equipments', { params: { page: page.value, pageSize: pageSize.value, name: name.value || undefined, category_id: categoryId.value } })
    items.value = data.data.list
    total.value = data.data.total
  } catch (reason) {
    error.value = errorMessage(reason)
    items.value = []
  } finally { loading.value = false }
}

function search() { page.value = 1; loadItems() }

function openCreate() {
  editingId.value = undefined
  form.value = { name: '', description: '', total_stock: 0, status: 1 }
  dialogVisible.value = true
}

function openEdit(item: Item) {
  editingId.value = item.id
  form.value = { name: item.name, category_id: item.category_id, description: item.description || '', total_stock: item.total_stock, available_stock: item.available_stock, status: item.status }
  dialogVisible.value = true
}

async function save() {
  if (!form.value.name.trim() || !form.value.category_id || form.value.total_stock < 0) return
  saving.value = true
  try {
    if (editingId.value) await api.patch(`/equipments/${editingId.value}`, form.value)
    else await api.post('/equipments', form.value)
    dialogVisible.value = false
    await loadItems()
  } catch (reason) { error.value = errorMessage(reason) }
  finally { saving.value = false }
}

async function toggleStatus(item: Item) {
  try {
    await api.patch(`/equipments/${item.id}/status`, { status: item.status === 1 ? 0 : 1 })
    await loadItems()
  } catch (reason) { error.value = errorMessage(reason) }
}

onMounted(() => { loadCategories(); loadItems() })

</script>


<template>
  <!-- <h2>Hello</h2> -->
  <el-card shadow="never">
    <template #header>
      <div class="header">
        <!-- <strong>器材管理</strong> -->
        <el-button type="primary" @click="openCreate">新增器材</el-button></div>
    </template>
    <el-form inline class="filters">
      <el-form-item label="名称"><el-input v-model="name" clearable placeholder="器材名称"
          @keyup.enter="search" /></el-form-item>
      <el-form-item label="分类"><el-select v-model="categoryId" clearable placeholder="全部"
          style="width: 160px"><el-option v-for="category in categories" :key="category.id" :label="category.name"
            :value="category.id" /></el-select></el-form-item>
      <el-form-item><el-button type="primary" @click="search">查询</el-button></el-form-item>
    </el-form>
    <el-alert v-if="error" :title="error" type="error" show-icon class="message" />
    <el-table v-loading="loading" :data="items" stripe>
      <el-table-column prop="id" label="编号" width="80" />
      <el-table-column prop="name" label="名称" min-width="160" />
      <el-table-column label="分类" min-width="120"><template #default="{ row }">{{ row.category?.name || '-'
          }}</template></el-table-column>
      <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
      <el-table-column prop="total_stock" label="总库存" width="100" />
      <el-table-column prop="available_stock" label="可用库存" width="110" />
      <el-table-column label="状态" width="100"><template #default="{ row }"><el-tag
            :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用'
            }}</el-tag></template></el-table-column>
      <el-table-column label="操作" width="180" fixed="right"><template #default="{ row }"><el-button link type="primary"
            @click="openEdit(row)">编辑</el-button><el-button link :type="row.status === 1 ? 'warning' : 'success'"
            @click="toggleStatus(row)">{{ row.status === 1 ? '停用' : '启用' }}</el-button></template></el-table-column>
    </el-table>
    <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50]"
      layout="total, sizes, prev, pager, next" @current-change="loadItems" @size-change="search" />
  </el-card>

  <el-dialog v-model="dialogVisible" :title="editingId ? '编辑器材' : '新增器材'" width="520px">
    <el-form label-width="90px">
      <el-form-item label="名称" required><el-input v-model="form.name" /></el-form-item>
      <el-form-item label="分类" required><el-select v-model="form.category_id" placeholder="请选择分类"
          style="width: 100%"><el-option v-for="category in categories" :key="category.id" :label="category.name"
            :value="category.id" /></el-select></el-form-item>
      <el-form-item label="总库存" required><el-input-number v-model="form.total_stock" :min="0" /></el-form-item>
      <el-form-item label="描述"><el-input v-model="form.description" type="textarea" /></el-form-item>
    </el-form>
    <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary"
        :loading="saving" @click="save">保存</el-button></template>
  </el-dialog>

</template>