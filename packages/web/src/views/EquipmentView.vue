<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { createEquipmentApi, equipmentError, type Category, type Equipment } from '../api/equipment';

const api = createEquipmentApi();
const route = useRoute();
const router = useRouter();
const search = ref('');
const appliedName = ref('');
const category = ref<number | undefined>();
const categories = ref<Category[]>([]);
const rows = ref<Equipment[]>([]);
const page = ref(1);
const pageSize = ref(12);
const total = ref(0);
const loading = ref(false);
const error = ref('');
const categoryError = ref('');
const categoryLoading = ref(false);
const detail = ref<Equipment | null>(null);
const detailLoading = ref(false);
const detailError = ref('');
let listRequest: AbortController | undefined;
let categoryRequest: AbortController | undefined;
let detailRequest: AbortController | undefined;
const detailOpen = computed(() => route.query.detail !== undefined);
const maxPage = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)));
function status(item: Equipment) {
  return item.status !== 1 ? '已停用' : item.available_stock > 0 ? '有可用库存' : '暂无库存';
}
async function loadList() {
  listRequest?.abort();
  const request = listRequest = new AbortController();
  loading.value = true;
  error.value = '';
  rows.value = [];
  try {
    const result = await api.list({ page: page.value, pageSize: pageSize.value,
      name: appliedName.value || undefined, category_id: category.value }, request.signal);
    if (request.signal.aborted) return;
    total.value = result.total;
    if (page.value > maxPage.value) { page.value = maxPage.value; void loadList(); return; }
    rows.value = result.list;
  } catch (e) { if (!request.signal.aborted) { error.value = equipmentError(e); total.value = 0; } }
  finally { if (listRequest === request) loading.value = false; }
}
async function loadCategories() {
  categoryRequest?.abort();
  const request = categoryRequest = new AbortController();
  categoryLoading.value = true;
  categoryError.value = '';
  try { const data = await api.categories(request.signal); if (!request.signal.aborted) categories.value = data; }
  catch (e) { if (!request.signal.aborted) categoryError.value = equipmentError(e); }
  finally { if (categoryRequest === request) categoryLoading.value = false; }
}
function filter() { appliedName.value = search.value.trim(); page.value = 1; void loadList(); }
function reset() { search.value = ''; category.value = undefined; filter(); }
function changePage(next: number) { page.value = next; void loadList(); }
function showDetail(item: Equipment) { void router.push({ query: { ...route.query, detail: String(item.id) } }); }
function closeDetail() { const query = { ...route.query }; delete query.detail; void router.replace({ query }); }
async function loadDetail() {
  detailRequest?.abort();
  detail.value = null;
  detailError.value = '';
  detailLoading.value = false;
  if (!detailOpen.value) return;
  const id = Number(route.query.detail);
  if (!Number.isSafeInteger(id) || id <= 0) { detailError.value = '器材编号无效。'; return; }
  const request = detailRequest = new AbortController();
  detailLoading.value = true;
  try { const data = await api.detail(id, request.signal); if (!request.signal.aborted) detail.value = data; }
  catch (e) { if (!request.signal.aborted) detailError.value = equipmentError(e); }
  finally { if (detailRequest === request) detailLoading.value = false; }
}
watch(() => route.query.detail, loadDetail, { immediate: true });
onMounted(() => { void loadList(); void loadCategories(); });
onBeforeUnmount(() => { listRequest?.abort(); categoryRequest?.abort(); detailRequest?.abort(); });
</script>

<template>
  <section class="live-equipment">
    <header class="equipment-heading">
      <div><p class="eyebrow">EQUIPMENT LIBRARY · 后端接口</p><h1>设备中心</h1><p>查找社团器材，了解分类与可用库存。</p></div>
      <router-link to="/demo/equipment">体验演示借用 →</router-link>
    </header>
    <el-alert title="此页通过接口读取器材；借用申请尚未对接，不会在这里生成借用记录。" type="info" :closable="false" show-icon />
    <form class="equipment-filters" @submit.prevent="filter">
      <label class="search-field">器材名称<el-input v-model="search" placeholder="输入器材名称" clearable @clear="filter" /></label>
      <label>器材分类<el-select v-model="category" aria-label="器材分类" placeholder="全部分类" clearable :loading="categoryLoading" @change="filter">
        <el-option v-for="item in categories" :key="item.id" :value="item.id" :label="item.name" />
      </el-select></label>
      <el-button type="primary" native-type="submit">搜索</el-button><el-button @click="reset">重置</el-button>
    </form>
    <div v-if="categoryError" class="request-error" role="alert">分类加载失败：{{ categoryError }}<el-button text @click="loadCategories">重试分类</el-button></div>
    <section class="equipment-results" aria-label="器材结果" :aria-busy="loading">
      <div class="results-heading"><strong>{{ loading ? '正在读取器材…' : error ? '器材加载失败' : `共 ${total} 种器材` }}</strong><el-button :disabled="loading" text @click="loadList">刷新列表</el-button></div>
      <el-skeleton v-if="loading" :rows="6" animated />
      <div v-else-if="error" class="result-message" role="alert"><h2>暂时无法加载器材</h2><p>{{ error }}</p><el-button type="primary" @click="loadList">重试列表</el-button></div>
      <el-empty v-else-if="!rows.length" description="没有找到符合条件的器材"><el-button @click="reset">清除筛选</el-button></el-empty>
      <div v-else class="equipment-grid">
        <article v-for="item in rows" :key="item.id" class="equipment-card">
          <div class="card-top"><span class="equipment-symbol" aria-hidden="true">▦</span><el-tag :type="item.status !== 1 ? 'info' : item.available_stock > 0 ? 'success' : 'warning'">{{ status(item) }}</el-tag></div>
          <p class="category-caption">{{ item.category?.name || '未分类' }} · #{{ item.id }}</p><h2>{{ item.name }}</h2>
          <p class="equipment-description">{{ item.description || '暂无器材介绍' }}</p>
          <div class="stock-line"><span>可用 <strong>{{ item.available_stock }}</strong> / 总库存 {{ item.total_stock }}</span><el-button @click="showDetail(item)">查看详情</el-button></div>
        </article>
      </div>
      <div v-if="!loading && !error && total > 0" class="equipment-pagination">
        <span>第 {{ page }} / {{ maxPage }} 页</span>
        <el-pagination :current-page="page" :page-size="pageSize" :total="total" layout="prev, pager, next" :pager-count="5" @current-change="changePage" />
      </div>
    </section>
    <el-dialog :model-value="detailOpen" title="器材详情" width="min(560px, 94vw)" @update:model-value="(value: boolean) => !value && closeDetail()">
      <el-skeleton v-if="detailLoading" :rows="5" animated />
      <div v-else-if="detailError" role="alert"><p>{{ detailError }}</p><el-button @click="loadDetail">重试详情</el-button></div>
      <div v-else-if="detail" class="equipment-detail"><el-tag>{{ status(detail) }}</el-tag><h2>{{ detail.name }}</h2>
        <dl><dt>器材编号</dt><dd>{{ detail.id }}</dd><dt>分类</dt><dd>{{ detail.category?.name || '未分类' }}</dd><dt>总库存</dt><dd>{{ detail.total_stock }}</dd><dt>可用库存</dt><dd>{{ detail.available_stock }}</dd></dl>
        <h3>器材介绍</h3><p>{{ detail.description || '暂无器材介绍' }}</p><el-alert title="借用功能等待后端接口接入，请暂时联系器材管理员。" :closable="false" type="info" />
      </div>
      <template #footer><el-button @click="closeDetail">关闭</el-button></template>
    </el-dialog>
  </section>
</template>

<style scoped>
.equipment-heading{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:24px}.eyebrow{font-size:11px;letter-spacing:2px;color:#508678}.equipment-heading h1{font-size:30px;margin:8px 0}.equipment-heading p:not(.eyebrow){color:#687970}.equipment-heading a{color:#18775e;font-size:13px;white-space:nowrap}.equipment-filters{display:flex;align-items:end;gap:12px;margin:24px 0;flex-wrap:wrap}.equipment-filters label{display:grid;gap:8px;font-size:13px;color:#4f625a;width:200px}.equipment-filters .search-field{flex:1;min-width:190px}.equipment-filters .el-button+.el-button{margin-left:0}.equipment-results{background:white;border:1px solid #e1e9e3;border-radius:16px;padding:22px}.results-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}.equipment-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.equipment-card{border:1px solid #e0e8e3;border-radius:12px;padding:20px;min-width:0}.card-top,.stock-line{display:flex;align-items:center;justify-content:space-between;gap:8px}.equipment-symbol{width:44px;height:44px;display:grid;place-items:center;background:#edf5ef;border-radius:12px;font-size:30px;color:#33715c}.category-caption{font-size:12px;color:#7b887f;margin-top:20px}.equipment-card h2{font-size:18px;overflow-wrap:anywhere}.equipment-description{color:#78847c;font-size:13px;line-height:1.7;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:44px}.stock-line{padding-top:14px;border-top:1px solid #edf1ed;font-size:12px;flex-wrap:wrap}.stock-line strong{font-size:20px;color:#196b50}.equipment-pagination{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-top:24px;font-size:13px;color:#6c7a70}.result-message{padding:45px 10px;text-align:center}.result-message h2{font-size:19px}.result-message p,.request-error{color:#8b5944;font-size:14px}.request-error{margin-bottom:15px}.equipment-detail dl{display:grid;grid-template-columns:100px 1fr;gap:16px;margin:26px 0}.equipment-detail dt{color:#7b887f}.equipment-detail dd{margin:0}.equipment-detail p{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.8}.equipment-detail h2{overflow-wrap:anywhere}.equipment-detail h3{font-size:14px}@media(max-width:1200px){.equipment-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:650px){.equipment-heading{align-items:start;flex-direction:column;gap:0}.equipment-grid{grid-template-columns:1fr}.equipment-results{padding:14px}.equipment-filters label{width:100%}.equipment-pagination{justify-content:center}}
</style>
