<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { useApp } from "../store";
import { dateText } from "../domain";
const app = useApp();
const route = useRoute();
const search = ref("");
const filter = ref("全部");
const page = ref(1);
const logs = computed(() => route.path === "/admin/logs");
const all = computed(() => route.path === "/admin/loans");
const loans = computed(() =>
  app.db.loans.filter(
    (l) =>
      (all.value || l.userId === app.user?.id) &&
      `${app.assetName(l.assetId)} ${app.userName(l.userId)}`.includes(
        search.value,
      ) &&
      (filter.value === "全部" ||
        (filter.value === "在借" ? !l.returned : !!l.returned)),
  ),
);
const audits = computed(() =>
  app.db.audits.filter((a) =>
    `${a.action} ${a.detail} ${app.userName(a.userId)}`.includes(search.value),
  ),
);
async function returnItem(id: string) {
  try {
    await ElMessageBox.confirm(
      "确认器材与配件已归还？此操作会将设备恢复为在库状态。",
      "确认归还",
      { confirmButtonText: "确认归还", cancelButtonText: "取消" },
    );
    app.returnLoan(id);
    ElMessage.success("设备已归还");
  } catch (e) {
    if (e instanceof Error) ElMessage.error(e.message);
  }
}
</script>
<template>
  <div class="page-heading">
    <div>
      <p class="eyebrow">RECORDS / 使用记录</p>
      <h1>{{ route.meta.title }}</h1>
      <p class="muted">
        {{
          logs
            ? "记录每一次操作，让器材流转有迹可循。"
            : "查看使用进度与归还记录。"
        }}
      </p>
    </div>
  </div>
  <section class="panel">
    <div class="filter-bar">
      <el-input
        v-model="search"
        clearable
        placeholder="搜索记录"
        aria-label="搜索记录"
        @input="page = 1"
      /><el-radio-group v-if="!logs" v-model="filter" @change="page = 1"
        ><el-radio-button
          v-for="s in ['全部', '在借', '已归还']"
          :key="s"
          :value="s"
          >{{ s }}</el-radio-button
        ></el-radio-group
      >
    </div>
    <el-table
      v-if="logs"
      :data="audits.slice((page - 1) * 10, page * 10)"
      empty-text="暂无匹配操作记录"
      ><el-table-column label="操作人" width="120"
        ><template #default="{ row }">{{
          app.userName(row.userId)
        }}</template></el-table-column
      ><el-table-column
        prop="action"
        label="操作"
        width="130"
      /><el-table-column
        prop="detail"
        label="详情"
        min-width="280"
      /><el-table-column label="时间" width="160"
        ><template #default="{ row }">{{
          dateText(row.time)
        }}</template></el-table-column
      ></el-table
    >
    <el-table
      v-else
      :data="loans.slice((page - 1) * 10, page * 10)"
      empty-text="暂无借用记录"
      ><el-table-column label="设备" min-width="170"
        ><template #default="{ row }"
          ><strong>{{ app.assetName(row.assetId) }}</strong></template
        ></el-table-column
      ><el-table-column v-if="all" label="借用人" width="100"
        ><template #default="{ row }">{{
          app.userName(row.userId)
        }}</template></el-table-column
      ><el-table-column
        prop="purpose"
        label="用途"
        min-width="140"
      /><el-table-column
        prop="place"
        label="使用地点"
        min-width="120"
      /><el-table-column label="预计归还" width="155"
        ><template #default="{ row }">{{
          dateText(row.due)
        }}</template></el-table-column
      ><el-table-column label="状态" width="110"
        ><template #default="{ row }"
          ><el-tag :type="row.returned ? 'info' : 'warning'">{{
            row.returned ? "已归还" : "借用中"
          }}</el-tag></template
        ></el-table-column
      ><el-table-column label="操作 / 归还时间" width="165" fixed="right"
        ><template #default="{ row }"
          ><span v-if="row.returned">{{ dateText(row.returned) }}</span
          ><el-button v-else link type="primary" @click="returnItem(row.id)"
            >归还设备</el-button
          ></template
        ></el-table-column
      ></el-table
    >
    <div class="pagination">
      <el-pagination
        v-model:current-page="page"
        :page-size="10"
        :total="logs ? audits.length : loans.length"
        layout="prev, pager, next"
      />
    </div>
  </section>
  <section v-if="!all && !logs" class="panel">
    <div class="panel-heading"><h2>我的耗材领用</h2></div>
    <el-table
      :data="
        app.db.movements.filter(
          (m) => m.userId === app.user?.id && m.kind === '领用',
        )
      "
      max-height="400"
      empty-text="暂无领用记录"
      ><el-table-column label="耗材" min-width="150"
        ><template #default="{ row }">{{
          app.db.materials.find((m) => m.id === row.materialId)?.name
        }}</template></el-table-column
      ><el-table-column label="数量" width="100"
        ><template #default="{ row }">{{
          -row.delta
        }}</template></el-table-column
      ><el-table-column
        prop="reason"
        label="用途"
        min-width="180"
      /><el-table-column label="时间" width="150"
        ><template #default="{ row }">{{
          dateText(row.time)
        }}</template></el-table-column
      ></el-table
    >
  </section>
</template>
