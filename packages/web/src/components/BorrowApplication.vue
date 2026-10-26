<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { api, errorMessage, type ApiResponse, type PageData } from '../api'

interface Equipment {
  id: number
  name: string
  available_stock: number
  status: number
}
interface RequestedItem extends Equipment { borrow_qty: number }

const visible = defineModel<boolean>('visible', { required: true })
const emit = defineEmits<{ created: [] }>()
const equipment = ref<Equipment[]>([])
const selectedId = ref<number>()
const requested = ref<RequestedItem[]>([])
const query = ref('')
const remark = ref('')
const loading = ref(false)
const saving = ref(false)
const error = ref('')

const selectableEquipment = computed(() => equipment.value.filter(item =>
  item.status === 1 && item.available_stock > 0 && !requested.value.some(line => line.id === item.id),
))

async function loadEquipment() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get<ApiResponse<PageData<Equipment>>>('/equipments', {
      params: { name: query.value.trim() || undefined, pageSize: 100 },
    })
    equipment.value = data.data.list
  } catch (reason) {
    error.value = errorMessage(reason)
    equipment.value = []
  } finally {
    loading.value = false
  }
}

watch(visible, open => {
  if (!open) return
  selectedId.value = undefined
  requested.value = []
  query.value = ''
  remark.value = ''
  error.value = ''
  loadEquipment()
})

function addEquipment() {
  const item = selectableEquipment.value.find(entry => entry.id === selectedId.value)
  if (!item) return
  requested.value.push({ ...item, borrow_qty: 1 })
  selectedId.value = undefined
}

function removeEquipment(id: number) {
  requested.value = requested.value.filter(item => item.id !== id)
}

async function submit() {
  if (saving.value) return
  error.value = ''
  if (requested.value.length === 0) {
    error.value = '请先添加至少一件器材'
    return
  }
  if (requested.value.some(item => !Number.isInteger(item.borrow_qty) || item.borrow_qty < 1 || item.borrow_qty > item.available_stock)) {
    error.value = '借用数量必须是正整数，且不能超过当前可用库存'
    return
  }
  if (remark.value.length > 255) {
    error.value = '借用事由不能超过 255 字'
    return
  }
  saving.value = true
  try {
    await api.post('/borrows', {
      items: requested.value.map(item => ({ item_id: item.id, borrow_qty: item.borrow_qty })),
      remark: remark.value.trim(),
    })
    visible.value = false
    emit('created')
  } catch (reason) {
    error.value = errorMessage(reason)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <el-dialog v-model="visible" title="申请借用" width="min(680px, 94vw)" :close-on-click-modal="!saving" :show-close="!saving">
    <el-alert v-if="error" :title="error" type="error" show-icon class="message" />
    <p class="hint">选择器材和数量。提交后等待管理员审批，审批通过时才会扣减可用库存。</p>
    <div class="equipment-picker">
      <el-input v-model="query" clearable placeholder="按名称搜索器材" @keyup.enter="loadEquipment" />
      <el-button :loading="loading" @click="loadEquipment">搜索</el-button>
    </div>
    <div class="equipment-picker">
      <el-select v-model="selectedId" filterable clearable placeholder="选择可借器材" style="flex: 1">
        <el-option v-for="item in selectableEquipment" :key="item.id" :value="item.id"
          :label="`${item.name}（可用 ${item.available_stock}）`" />
      </el-select>
      <el-button type="primary" :disabled="selectedId === undefined" @click="addEquipment">添加</el-button>
    </div>
    <el-table :data="requested" empty-text="尚未添加器材" class="requested-table">
      <el-table-column prop="name" label="器材" min-width="150" />
      <el-table-column prop="available_stock" label="可用库存" width="100" />
      <el-table-column label="借用数量" width="160">
        <template #default="{ row }">
          <el-input-number v-model="row.borrow_qty" :min="1" :max="row.available_stock" :step="1" step-strictly size="small" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="80">
        <template #default="{ row }">
          <el-button link type="danger" @click="removeEquipment(row.id)">移除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-input v-model="remark" type="textarea" :rows="2" maxlength="255" show-word-limit placeholder="借用事由（选填）" />
    <template #footer>
      <el-button :disabled="saving" @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="submit">提交申请</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.message, .requested-table { margin-bottom: 16px; }
.hint { color: var(--el-text-color-secondary); margin: 0 0 16px; }
.equipment-picker { display: flex; gap: 8px; margin-bottom: 12px; }
</style>
