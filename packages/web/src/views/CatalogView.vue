<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { Search, Plus, Monitor, Collection } from "@element-plus/icons-vue";
import { useApp } from "../store";
import { dateText, type Asset, type Material } from "../domain";
const route = useRoute();
const app = useApp();
const materialMode = computed(() =>
  ["/materials", "/admin/inventory"].includes(route.path),
);
const managing = computed(() => route.path.startsWith("/admin"));
const search = ref("");
const category = ref("");
const status = ref("");
const page = ref(1);
const categories = computed(() => [
  ...new Set(
    (materialMode.value ? app.db.materials : app.db.assets).map(
      (a) => a.category,
    ),
  ),
]);
const assets = computed(() =>
  app.db.assets.filter(
    (a) =>
      `${a.name} ${a.serial} ${a.location}`
        .toLowerCase()
        .includes(search.value.toLowerCase()) &&
      (!category.value || a.category === category.value) &&
      (!status.value || a.status === status.value),
  ),
);
const materials = computed(() =>
  app.db.materials.filter(
    (m) =>
      `${m.name} ${m.spec} ${m.location}`
        .toLowerCase()
        .includes(search.value.toLowerCase()) &&
      (!category.value || m.category === category.value) &&
      (!status.value ||
        (status.value === "低库存"
          ? m.stock <= m.warning
          : m.stock > m.warning)),
  ),
);
watch([search, category, status], () => (page.value = 1));
const detail = ref<Asset>();
const detailOpen = ref(false);
const borrowOpen = ref(false);
const borrowForm = reactive({ purpose: "", place: "", due: "" });
function showDetail(a: Asset) {
  detail.value = a;
  detailOpen.value = true;
}
if (route.query.detail) {
  const a = app.db.assets.find((a) => a.id === route.query.detail);
  if (a) showDetail(a);
}
const activeLoan = computed(() =>
  app.db.loans.find((l) => l.assetId === detail.value?.id && !l.returned),
);
function openBorrow(a: Asset) {
  detail.value = a;
  Object.assign(borrowForm, { purpose: "", place: "", due: "" });
  borrowOpen.value = true;
}
function run(action: () => void, close: () => void) {
  try {
    action();
    close();
    ElMessage.success("操作成功");
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
}
const movementOpen = ref(false);
const targetMaterial = ref<Material>();
const movement = reactive<{
  kind: "领用" | "入库" | "盘点";
  quantity: number;
  reason: string;
}>({ kind: "领用", quantity: 1, reason: "" });
function openMovement(m: Material, kind: "领用" | "入库" | "盘点") {
  targetMaterial.value = m;
  Object.assign(movement, {
    kind,
    quantity: kind === "盘点" ? m.stock : 1,
    reason: "",
  });
  movementOpen.value = true;
}
const editOpen = ref(false);
const assetForm = reactive<Asset>({
  id: "",
  serial: "",
  name: "",
  category: "",
  location: "",
  department: "",
  status: "在库",
  description: "",
});
const materialForm = reactive<Material>({
  id: "",
  name: "",
  category: "",
  location: "",
  department: "",
  spec: "",
  unit: "个",
  stock: 0,
  warning: 5,
});
function editAsset(a?: Asset) {
  Object.assign(
    assetForm,
    a || {
      id: "",
      serial: "",
      name: "",
      category: "",
      location: "",
      department: "",
      status: "在库",
      description: "",
    },
  );
  editOpen.value = true;
}
function editMaterial(m?: Material) {
  Object.assign(
    materialForm,
    m || {
      id: "",
      name: "",
      category: "",
      location: "",
      department: "",
      spec: "",
      unit: "个",
      stock: 0,
      warning: 5,
    },
  );
  editOpen.value = true;
}
const editForm = computed(() =>
  materialMode.value ? materialForm : assetForm,
);
const tag = (s: string) =>
  s === "在库" ? "success" : s === "借出中" ? "warning" : "info";
</script>
<template>
  <div class="page-heading">
    <div>
      <p class="eyebrow">
        RESOURCES / {{ managing ? "资源管理" : "资源共享" }}
      </p>
      <h1>{{ route.meta.title }}</h1>
      <p class="muted">
        {{
          materialMode
            ? "按需领用，让每一份材料都物尽其用。"
            : "发现可用器材，为你的下一个项目找到合适工具。"
        }}
      </p>
    </div>
    <el-button
      v-if="managing"
      type="primary"
      :icon="Plus"
      @click="materialMode ? editMaterial() : editAsset()"
      >{{ materialMode ? "新增耗材" : "新增设备" }}</el-button
    >
  </div>
  <div v-if="!app.canBorrow" class="membership-callout">
    <span>你当前是非成员，可以查询器材；借用和领用需先通过成员申请。</span
    ><router-link to="/application">申请加入 →</router-link>
  </div>
  <section class="panel catalog-panel">
    <div class="filter-bar">
      <el-input
        v-model="search"
        :prefix-icon="Search"
        clearable
        placeholder="搜索名称、编号或位置"
        aria-label="搜索器材"
      /><el-select
        v-model="category"
        clearable
        placeholder="全部分类"
        aria-label="分类筛选"
        ><el-option
          v-for="c in categories"
          :key="c"
          :value="c"
          :label="c" /></el-select
      ><el-select
        v-model="status"
        clearable
        placeholder="全部状态"
        aria-label="状态筛选"
        ><el-option
          v-for="s in materialMode
            ? ['库存充足', '低库存']
            : ['在库', '借出中', '维修中', '报废']"
          :key="s"
          :value="s"
          :label="s" /></el-select
      ><el-button
        @click="
          search = '';
          category = '';
          status = '';
        "
        >重置</el-button
      >
    </div>
    <div class="table-caption">
      {{ materialMode ? "耗材目录" : "设备目录"
      }}<span>共 {{ materialMode ? materials.length : assets.length }} 项</span>
    </div>
    <el-table
      v-if="!materialMode"
      :data="assets.slice((page - 1) * 8, page * 8)"
      empty-text="没有符合条件的设备"
      row-key="id"
      ><el-table-column label="设备信息" min-width="230"
        ><template #default="{ row }"
          ><div class="table-object">
            <span class="object-icon"
              ><el-icon><Monitor /></el-icon
            ></span>
            <div>
              <strong>{{ row.name }}</strong
              ><small>{{ row.serial }}</small>
            </div>
          </div></template
        ></el-table-column
      ><el-table-column
        prop="category"
        label="分类"
        min-width="110"
      /><el-table-column
        prop="location"
        label="存放位置"
        min-width="180"
      /><el-table-column
        prop="department"
        label="归属"
        min-width="90"
      /><el-table-column label="状态" width="110"
        ><template #default="{ row }"
          ><el-tag :type="tag(row.status)" effect="light">{{
            row.status
          }}</el-tag></template
        ></el-table-column
      ><el-table-column label="操作" :width="managing ? 180 : 170" fixed="right"
        ><template #default="{ row }"
          ><el-button link type="primary" @click="showDetail(row)"
            >详情</el-button
          ><el-button
            v-if="managing"
            link
            type="primary"
            @click="editAsset(row)"
            >编辑</el-button
          ><el-button
            v-else
            link
            type="primary"
            :disabled="!app.canBorrow || row.status !== '在库'"
            @click="openBorrow(row)"
            >借用</el-button
          ></template
        ></el-table-column
      ></el-table
    >
    <el-table
      v-else
      :data="materials.slice((page - 1) * 8, page * 8)"
      empty-text="没有符合条件的耗材"
      row-key="id"
      ><el-table-column label="耗材信息" min-width="220"
        ><template #default="{ row }"
          ><div class="table-object">
            <span class="object-icon"
              ><el-icon><Collection /></el-icon
            ></span>
            <div>
              <strong>{{ row.name }}</strong
              ><small>{{ row.spec }}</small>
            </div>
          </div></template
        ></el-table-column
      ><el-table-column
        prop="category"
        label="分类"
        min-width="110"
      /><el-table-column
        prop="location"
        label="位置"
        min-width="180"
      /><el-table-column label="库存" width="110"
        ><template #default="{ row }"
          ><strong :class="{ danger: row.stock <= row.warning }">{{
            row.stock
          }}</strong>
          {{ row.unit }}</template
        ></el-table-column
      ><el-table-column label="状态" width="110"
        ><template #default="{ row }"
          ><el-tag :type="row.stock <= row.warning ? 'warning' : 'success'">{{
            row.stock === 0
              ? "缺货"
              : row.stock <= row.warning
                ? "库存偏低"
                : "充足"
          }}</el-tag></template
        ></el-table-column
      ><el-table-column label="操作" :width="managing ? 190 : 100" fixed="right"
        ><template #default="{ row }"
          ><template v-if="managing"
            ><el-button link type="primary" @click="editMaterial(row)"
              >编辑</el-button
            ><el-button link type="primary" @click="openMovement(row, '入库')"
              >入库</el-button
            ><el-button link type="primary" @click="openMovement(row, '盘点')"
              >盘点</el-button
            ></template
          ><el-button
            v-else
            link
            type="primary"
            :disabled="!app.canBorrow || row.stock === 0"
            @click="openMovement(row, '领用')"
            >领用</el-button
          ></template
        ></el-table-column
      ></el-table
    >
    <div class="mobile-resource-list">
      <template v-if="!materialMode"
        ><el-empty
          v-if="!assets.length"
          description="没有符合条件的设备"
          :image-size="60"
        />
        <article
          v-for="a in assets.slice((page - 1) * 8, page * 8)"
          :key="a.id"
          class="mobile-resource-card"
        >
          <div class="panel-heading">
            <strong>{{ a.name }}</strong
            ><el-tag :type="tag(a.status)" size="small">{{ a.status }}</el-tag>
          </div>
          <p>{{ a.serial }} · {{ a.category }}</p>
          <p>{{ a.location }}</p>
          <div class="mobile-resource-actions">
            <el-button @click="showDetail(a)">详情</el-button
            ><el-button v-if="managing" @click="editAsset(a)">编辑</el-button
            ><el-button
              v-else
              type="primary"
              :disabled="!app.canBorrow || a.status !== '在库'"
              @click="openBorrow(a)"
              >借用</el-button
            >
          </div>
        </article></template
      >
      <template v-else
        ><el-empty
          v-if="!materials.length"
          description="没有符合条件的耗材"
          :image-size="60"
        />
        <article
          v-for="m in materials.slice((page - 1) * 8, page * 8)"
          :key="m.id"
          class="mobile-resource-card"
        >
          <div class="panel-heading">
            <strong>{{ m.name }}</strong
            ><el-tag
              :type="m.stock <= m.warning ? 'warning' : 'success'"
              size="small"
              >{{ m.stock }} {{ m.unit }}</el-tag
            >
          </div>
          <p>{{ m.spec }}</p>
          <p>{{ m.location }}{{ m.stock <= m.warning ? " · 库存偏低" : "" }}</p>
          <div class="mobile-resource-actions">
            <template v-if="managing"
              ><el-button @click="editMaterial(m)">编辑</el-button
              ><el-button @click="openMovement(m, '入库')">入库</el-button
              ><el-button @click="openMovement(m, '盘点')"
                >盘点</el-button
              ></template
            ><el-button
              v-else
              type="primary"
              :disabled="!app.canBorrow || m.stock === 0"
              @click="openMovement(m, '领用')"
              >领用</el-button
            >
          </div>
        </article></template
      >
    </div>
    <div class="pagination">
      <el-pagination
        v-model:current-page="page"
        :page-size="8"
        :total="materialMode ? materials.length : assets.length"
        layout="prev, pager, next"
      />
    </div>
  </section>
  <section v-if="materialMode && managing" class="panel">
    <div class="panel-heading">
      <h2>库存变动记录</h2>
      <span class="muted">每次入库、领用和盘点都保留记录</span>
    </div>
    <el-table
      :data="app.db.movements"
      max-height="400"
      empty-text="暂无库存变动"
      ><el-table-column label="耗材" min-width="150"
        ><template #default="{ row }">{{
          app.db.materials.find((m) => m.id === row.materialId)?.name
        }}</template></el-table-column
      ><el-table-column prop="kind" label="类型" width="80" /><el-table-column
        prop="delta"
        label="变动"
        width="80"
      /><el-table-column
        prop="balance"
        label="变动后"
        width="80"
      /><el-table-column
        prop="reason"
        label="原因"
        min-width="180"
      /><el-table-column label="操作人" width="100"
        ><template #default="{ row }">{{
          app.userName(row.userId)
        }}</template></el-table-column
      ><el-table-column label="时间" width="150"
        ><template #default="{ row }">{{
          dateText(row.time)
        }}</template></el-table-column
      ></el-table
    >
  </section>
  <el-dialog v-model="detailOpen" title="设备详情" width="560px"
    ><template v-if="detail"
      ><div class="detail-hero">
        <el-icon><Monitor /></el-icon>
        <div>
          <h2>{{ detail.name }}</h2>
          <span class="muted">{{ detail.serial }}</span>
        </div>
        <el-tag :type="tag(detail.status)">{{ detail.status }}</el-tag>
      </div>
      <dl class="detail-list">
        <dt>设备分类</dt>
        <dd>{{ detail.category }}</dd>
        <dt>存放位置</dt>
        <dd>{{ detail.location }}</dd>
        <dt>归属部门</dt>
        <dd>{{ detail.department }}</dd>
        <dt>使用说明</dt>
        <dd>{{ detail.description || "暂无补充说明" }}</dd>
      </dl>
      <el-alert
        v-if="activeLoan"
        type="warning"
        :closable="false"
        :title="`当前借用人：${app.userName(activeLoan.userId)}；预计归还：${dateText(activeLoan.due)}`"
      />
      <div class="dialog-actions">
        <el-button @click="detailOpen = false">关闭</el-button
        ><el-button
          type="primary"
          :disabled="!app.canBorrow || detail.status !== '在库'"
          @click="openBorrow(detail)"
          >借用这件设备</el-button
        >
      </div></template
    ></el-dialog
  >
  <el-dialog v-model="borrowOpen" title="借用设备" width="500px"
    ><p class="dialog-intro">{{ detail?.name }} · 请填写本次使用信息</p>
    <el-form
      label-position="top"
      @submit.prevent="
        run(
          () =>
            app.borrow(
              detail!.id,
              borrowForm.purpose,
              borrowForm.place,
              borrowForm.due,
            ),
          () => {
            borrowOpen = false;
            detailOpen = false;
          },
        )
      "
      ><el-form-item label="借用用途"
        ><el-input
          v-model="borrowForm.purpose"
          aria-label="借用用途"
          maxlength="200" /></el-form-item
      ><el-form-item label="使用地点"
        ><el-input
          v-model="borrowForm.place"
          aria-label="使用地点"
          maxlength="80" /></el-form-item
      ><el-form-item label="预计归还时间"
        ><input
          v-model="borrowForm.due"
          class="native-input"
          type="datetime-local"
          aria-label="预计归还时间"
      /></el-form-item>
      <div class="dialog-actions">
        <el-button @click="borrowOpen = false">取消</el-button
        ><el-button type="primary" native-type="submit">确认借用</el-button>
      </div></el-form
    ></el-dialog
  >
  <el-dialog
    v-model="movementOpen"
    :title="`${movement.kind}耗材`"
    width="480px"
    ><p class="dialog-intro">
      {{ targetMaterial?.name }} · 当前库存 {{ targetMaterial?.stock }}
      {{ targetMaterial?.unit }}
    </p>
    <el-form
      label-position="top"
      @submit.prevent="
        run(
          () =>
            app.moveStock(
              targetMaterial!.id,
              movement.kind,
              movement.quantity,
              movement.reason,
            ),
          () => (movementOpen = false),
        )
      "
      ><el-form-item
        :label="movement.kind === '盘点' ? '实盘数量（将记录差异）' : '数量'"
        ><el-input-number
          v-model="movement.quantity"
          aria-label="数量"
          :min="movement.kind === '盘点' ? 0 : 1"
          :max="movement.kind === '领用' ? targetMaterial?.stock : 1000000"
          :precision="0" /></el-form-item
      ><el-form-item label="用途 / 原因"
        ><el-input
          v-model="movement.reason"
          aria-label="用途 / 原因"
          type="textarea"
          maxlength="200"
          :rows="3"
      /></el-form-item>
      <div class="dialog-actions">
        <el-button @click="movementOpen = false">取消</el-button
        ><el-button type="primary" native-type="submit"
          >确认{{ movement.kind }}</el-button
        >
      </div></el-form
    ></el-dialog
  >
  <el-dialog
    v-model="editOpen"
    :title="`${editForm.id ? '编辑' : '新增'}${materialMode ? '耗材' : '设备'}`"
    width="550px"
    ><el-form
      label-position="top"
      @submit.prevent="
        run(
          () =>
            materialMode
              ? app.saveMaterial({ ...materialForm })
              : app.saveAsset({ ...assetForm }),
          () => (editOpen = false),
        )
      "
      ><div class="form-grid">
        <el-form-item label="名称"
          ><el-input
            v-model="editForm.name"
            aria-label="名称"
            maxlength="60" /></el-form-item
        ><el-form-item label="分类"
          ><el-input
            v-model="editForm.category"
            aria-label="分类"
            maxlength="40" /></el-form-item
        ><el-form-item label="位置"
          ><el-input
            v-model="editForm.location"
            aria-label="位置"
            maxlength="80" /></el-form-item
        ><el-form-item label="归属部门"
          ><el-input
            v-model="editForm.department"
            aria-label="归属部门"
            maxlength="40" /></el-form-item
        ><template v-if="!materialMode"
          ><el-form-item label="设备编号"
            ><el-input
              v-model="assetForm.serial"
              aria-label="设备编号"
              maxlength="40" /></el-form-item
          ><el-form-item label="设备状态"
            ><el-select
              v-model="assetForm.status"
              :disabled="assetForm.status === '借出中'"
              aria-label="设备状态"
              ><el-option
                v-for="s in [
                  '在库',
                  '维修中',
                  '报废',
                  ...(assetForm.status === '借出中' ? ['借出中'] : []),
                ]"
                :key="s"
                :value="s"
                :label="s" /></el-select></el-form-item></template
        ><template v-else
          ><el-form-item label="规格"
            ><el-input
              v-model="materialForm.spec"
              aria-label="规格"
              maxlength="80" /></el-form-item
          ><el-form-item label="单位"
            ><el-input
              v-model="materialForm.unit"
              aria-label="单位"
              maxlength="10" /></el-form-item
          ><el-form-item label="库存预警值"
            ><el-input-number
              v-model="materialForm.warning"
              :min="0"
              :max="1000000"
              :precision="0"
              aria-label="库存预警值" /></el-form-item
        ></template>
      </div>
      <el-form-item v-if="!materialMode" label="使用说明"
        ><el-input
          v-model="assetForm.description"
          type="textarea"
          aria-label="使用说明"
          maxlength="500"
      /></el-form-item>
      <p v-else class="soft-note">
        新耗材初始库存为 0。保存后通过“入库”记录数量，不直接改库存。
      </p>
      <div class="dialog-actions">
        <el-button @click="editOpen = false">取消</el-button
        ><el-button type="primary" native-type="submit">保存</el-button>
      </div></el-form
    ></el-dialog
  >
</template>
