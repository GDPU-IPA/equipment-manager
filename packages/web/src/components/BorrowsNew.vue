<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api, errorMessage } from '../api'
import { Search } from '@element-plus/icons-vue'

const router = useRouter()

interface Equipment {
  id: number
  name: string
  description: string | null
  total_stock: number
  available_stock: number
  status: number
  category: { name: string } | null
}

const rows = ref<Equipment[]>([])
const loading = ref(false)
const error = ref('')

interface Category {
  id: number
  name: string
  parent_id: number
}

const keyword = ref('')
const categories = ref<Category[]>([])
const categoryId = ref<number>()

async function loadCategories() {
  try {
    const res = await api.get('/categories')
    categories.value = res.data.data
  } catch (e) {
    error.value = errorMessage(e)
  }
}

function search() {
  page.value = 1
  loadAll()
}

const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

async function loadAll() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get('/equipments', {
      params: {
        page: page.value,
        pageSize: pageSize.value,
        name: keyword.value.trim() || undefined,
        category_id: categoryId.value || undefined
      }
    })
    rows.value = res.data.data.list
    total.value = res.data.data.total
  } catch (e) {
    error.value = errorMessage(e)
    rows.value = []
  } finally {
    loading.value = false
  }
}

function canBorrow(row: Equipment) {
  return row.status === 1 && row.available_stock > 0
}

function changeSize() {
  page.value = 1
  loadAll()
}

const dialogVisible = ref(false)
const currentId = ref(0)
const currentName = ref('')
const maxStock = ref(1)
const qty = ref(1)
const remark = ref('')
const submitting = ref(false)
const dialogError = ref('')

const ERROR_TEXT: Record<string, string> = {
  equipment_not_available: '该器材已停用或不存在',
  insufficient_available_stock: '可用库存不足',
  items_must_contain_unique_positive_quantities: '数量不合法'
}

function friendly(e: unknown) {
  const raw = errorMessage(e)
  return ERROR_TEXT[raw] || raw
}

function pick(row: Equipment) {
  currentId.value = row.id
  currentName.value = row.name
  maxStock.value = row.available_stock
  qty.value = 1
  remark.value = ''
  dialogError.value = ''
  dialogVisible.value = true
}

async function submitBorrow() {
  if (submitting.value) return
  dialogError.value = ''
  if (!Number.isInteger(qty.value) || qty.value < 1) {
    dialogError.value = '数量至少为1'
    return
  }
  submitting.value = true
  try {
    await api.post('/borrows', {
      items: [{ item_id: currentId.value, borrow_qty: qty.value }],
      remark: remark.value.trim() || undefined
    })
    dialogVisible.value = false
    router.push('/borrows')
  } catch (e) {
    dialogError.value = friendly(e)
  } finally {
    submitting.value = false
  }
}

loadCategories()
loadAll()

</script>

<template>
  <el-card shadow="never">
    <template #header><strong>器材借用</strong></template>
    <el-form inline>
      <el-form-item><el-input :prefix-icon="Search" clearable placeholder="名称关键词" style="width: 200px" v-model="keyword"
          @keyup.enter="search" @clear="search" /></el-form-item>
      <el-form-item label="种类">
        <el-select clearable placeholder="全部" style="width: 160px" @change="search" v-model="categoryId">
          <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" @click="search">查询</el-button>
      </el-form-item>
    </el-form>
    <el-alert v-if="error" :title="error" type="error" show-icon class="message" />
    <el-table stripe empty-text="暂无器材数据" :data="rows" v-loading="loading">
      <el-table-column prop="id" label="编号" width="100px" align="center" />
      <el-table-column prop="name" label="名称" width="100px" align="center" />
      <el-table-column label="分类" width="100px" align="center">
        <template #default="scope">
          {{ scope.row.category ? scope.row.category.name : '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" min-width="100px" show-overflow-tooltip>
        <template #default="scope">
          {{ scope.row.description ? scope.row.description : '无' }}
        </template>
      </el-table-column>
      <el-table-column prop="total_stock" label="总库存" width="100px" align="center" />
      <el-table-column prop="available_stock" label="可用库存" width="100px" align="center">
        <template #default="scope">
          <span :class="{ 'stock-zero': scope.row.available_stock === 0 }">
            {{ scope.row.available_stock }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90px" align="center">
        <template #default="scope">
          <el-tag v-if="scope.row.status === 1" type="success">正常</el-tag>
          <el-tag v-else type="info">停用</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="借用" width="100px" fixed="right" align="center">
        <template #default="scope">
          <el-button size="small" type="primary" :disabled="!canBorrow(scope.row)"
            @click="pick(scope.row)">借用</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination layout="total,sizes,prev,pager,next" v-model:current-page="page" v-model:page-size="pageSize"
      :page-sizes="[10, 20, 50]" :total="total" @current-change="loadAll" @size-change="changeSize" />
  </el-card>
  <el-dialog v-model="dialogVisible" title="借用器材" width="min(420px, 90vw)" :close-on-click-modal="!submitting"
    :show-close="submitting">
    <el-descriptions :column="1" border size="small">
      <el-descriptions-item label="器材">{{ currentName }}</el-descriptions-item>
      <el-descriptions-item label="可用库存">{{ maxStock }}</el-descriptions-item>
    </el-descriptions>
    <el-alert v-if="dialogError" :title="dialogError" type="error" show-icon class="message" style="margin-top: 12px" />
    <el-form label-position="top" style="margin-top: 12px;">
      <el-form-item lable="借用数量" required>
        <el-input-number v-model="qty" min="1" :max="maxStock" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="remark" type="textarea" :rows="2" maxlength="225" show-word-limit placeholder="选填" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="submitting" @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submitBorrow">确认借用</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.stock-zero {
  color: var(--el-color-danger);
  font-weight: 600;
}

.pager {
  margin-top: 12px;
}
</style>