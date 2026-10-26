<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessageBox } from 'element-plus'
import { api, errorMessage, type ApiResponse } from '../api'
import { borrowStatusLabel, formatBorrowDate, type BorrowDetail } from '../borrow'
import { currentUser } from '../session'

interface ReturnLine {
  item_id: number
  item_name: string
  remaining: number
  return_qty: number
  item_condition: number
  remark: string
}

const props = defineProps<{ orderId: number }>()
const visible = defineModel<boolean>('visible', { required: true })
const emit = defineEmits<{ changed: [] }>()
const detail = ref<BorrowDetail | null>(null)
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const dueDate = ref('')
const returnLines = ref<ReturnLine[]>([])
let latestRequest = 0
const isAdmin = computed(() => currentUser.value?.role === 'admin')
const active = computed(() => detail.value?.status === 1 || detail.value?.status === 2)

async function loadDetail() {
  const request = ++latestRequest
  loading.value = true
  error.value = ''
  detail.value = null
  try {
    const { data } = await api.get<ApiResponse<BorrowDetail>>(`/borrows/${props.orderId}`)
    if (request !== latestRequest) return
    detail.value = data.data
    returnLines.value = data.data.items
      .filter(item => item.borrow_qty > item.returned_qty)
      .map(item => ({
        item_id: item.item_id,
        item_name: item.item_name,
        remaining: item.borrow_qty - item.returned_qty,
        return_qty: 0,
        item_condition: 1,
        remark: '',
      }))
  } catch (reason) {
    if (request !== latestRequest) return
    error.value = errorMessage(reason)
    detail.value = null
  } finally {
    if (request === latestRequest) loading.value = false
  }
}

watch([visible, () => props.orderId], ([open]) => {
  if (open) {
    dueDate.value = ''
    loadDetail()
  }
}, { immediate: true })

async function approve() {
  if (!detail.value || saving.value) return
  const parsed = new Date(dueDate.value.replace(' ', 'T'))
  if (!dueDate.value || Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) {
    error.value = '请选择晚于当前时间的应还日期'
    return
  }
  saving.value = true
  error.value = ''
  try {
    await api.patch(`/borrows/${detail.value.id}/approve`, { due_date: parsed.toISOString() })
    await loadDetail()
    emit('changed')
  } catch (reason) {
    error.value = errorMessage(reason)
  } finally {
    saving.value = false
  }
}

async function cancel() {
  if (!detail.value || saving.value) return
  try {
    await ElMessageBox.confirm(
      isAdmin.value ? '确定驳回这份借用申请吗？' : '确定取消这份借用申请吗？',
      '确认操作',
      { type: 'warning', confirmButtonText: '确定', cancelButtonText: '返回' },
    )
  } catch { return }
  saving.value = true
  error.value = ''
  try {
    await api.patch(`/borrows/${detail.value.id}/cancel`)
    await loadDetail()
    emit('changed')
  } catch (reason) {
    error.value = errorMessage(reason)
  } finally {
    saving.value = false
  }
}

async function registerReturn() {
  if (!detail.value || saving.value) return
  error.value = ''
  const lines = returnLines.value.filter(line => line.return_qty > 0)
  if (!lines.length) {
    error.value = '请填写至少一件器材的归还数量'
    return
  }
  if (lines.some(line => !Number.isInteger(line.return_qty) || line.return_qty > line.remaining || line.remark.length > 255)) {
    error.value = '归还数量不能超过未还数量，备注不能超过 255 字'
    return
  }
  try {
    await ElMessageBox.confirm('确认已收到所填数量和状态的器材？登记后会更新库存。', '确认归还', {
      type: 'warning', confirmButtonText: '确认登记', cancelButtonText: '返回',
    })
  } catch { return }
  saving.value = true
  try {
    await api.post(`/borrows/${detail.value.id}/return`, {
      returns: lines.map(line => ({
        item_id: line.item_id,
        return_qty: line.return_qty,
        item_condition: line.item_condition,
        remark: line.remark.trim(),
      })),
    })
    await loadDetail()
    emit('changed')
  } catch (reason) {
    error.value = errorMessage(reason)
  } finally {
    saving.value = false
  }
}

function conditionLabel(condition: number) {
  return ({ 1: '完好', 2: '磨损', 3: '损坏' } as Record<number, string>)[condition] ?? '-'
}
</script>

<template>
  <el-dialog v-model="visible" :title="`借用订单 #${orderId}`" width="min(780px, 96vw)">
    <div v-loading="loading">
      <el-alert v-if="error" :title="error" type="error" show-icon class="message" />
      <template v-if="detail && !loading">
        <el-descriptions :column="2" border class="section">
          <el-descriptions-item label="状态">{{ borrowStatusLabel(detail.status) }}</el-descriptions-item>
          <el-descriptions-item label="借用人">{{ detail.user_info.name || detail.user_info.username }}</el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ formatBorrowDate(detail.submit_at) }}</el-descriptions-item>
          <el-descriptions-item label="应还时间">{{ formatBorrowDate(detail.due_date) }}</el-descriptions-item>
          <el-descriptions-item label="事由" :span="2">{{ detail.remark || '-' }}</el-descriptions-item>
        </el-descriptions>

        <h3>器材明细</h3>
        <el-table :data="detail.items" stripe class="section">
          <el-table-column prop="item_name" label="器材" min-width="150" />
          <el-table-column prop="borrow_qty" label="借用" width="80" />
          <el-table-column prop="returned_qty" label="已还" width="80" />
          <el-table-column prop="status_text" label="进度" width="120" />
        </el-table>

        <template v-if="detail.status === 0">
          <div v-if="isAdmin" class="action-row">
            <el-date-picker v-model="dueDate" type="datetime" value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="选择应还日期" :disabled="saving" />
            <el-button type="primary" :loading="saving" @click="approve">审批通过</el-button>
            <el-button type="danger" plain :disabled="saving" @click="cancel">驳回申请</el-button>
          </div>
          <div v-else class="action-row">
            <el-button type="danger" plain :loading="saving" @click="cancel">取消申请</el-button>
          </div>
        </template>

        <template v-if="isAdmin && active && returnLines.length">
          <h3>登记归还</h3>
          <p class="hint">只填写本次实际收到的数量；不归还的器材保持 0。</p>
          <div v-for="line in returnLines" :key="line.item_id" class="return-line">
            <strong>{{ line.item_name }}（未还 {{ line.remaining }}）</strong>
            <el-input-number v-model="line.return_qty" :min="0" :max="line.remaining" :step="1" step-strictly size="small" />
            <el-select v-model="line.item_condition" style="width: 100px" :disabled="line.return_qty === 0">
              <el-option label="完好" :value="1" />
              <el-option label="磨损" :value="2" />
              <el-option label="损坏" :value="3" />
            </el-select>
            <el-input v-model="line.remark" maxlength="255" placeholder="备注（选填）" :disabled="line.return_qty === 0" />
          </div>
          <el-button type="primary" :loading="saving" @click="registerReturn">确认登记归还</el-button>
        </template>

        <template v-if="detail.return_records.length">
          <h3>归还记录</h3>
          <el-table :data="detail.return_records" stripe>
            <el-table-column label="器材" min-width="140">
              <template #default="{ row }">{{ detail.items.find(item => item.item_id === row.item_id)?.item_name || row.item_id }}</template>
            </el-table-column>
            <el-table-column prop="return_qty" label="数量" width="75" />
            <el-table-column label="状态" width="90">
              <template #default="{ row }">{{ conditionLabel(row.item_condition) }}</template>
            </el-table-column>
            <el-table-column label="登记时间" min-width="170">
              <template #default="{ row }">{{ formatBorrowDate(row.created_at) }}</template>
            </el-table-column>
            <el-table-column label="记录" width="90">
              <template #default="{ row }">{{ row.is_void ? '已作废' : '有效' }}</template>
            </el-table-column>
          </el-table>
        </template>
      </template>
    </div>
    <template #footer><el-button @click="visible = false">关闭</el-button></template>
  </el-dialog>
</template>

<style scoped>
.message, .section { margin-bottom: 16px; }
h3 { font-size: 16px; margin: 20px 0 10px; }
.action-row { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.hint { color: var(--el-text-color-secondary); }
.return-line { display: grid; grid-template-columns: minmax(140px, 1fr) auto 100px minmax(120px, 1fr); align-items: center; gap: 8px; margin: 12px 0; }
@media (max-width: 680px) { .return-line { grid-template-columns: 1fr 1fr; } .return-line strong, .return-line .el-input { grid-column: 1 / -1; } }
</style>
