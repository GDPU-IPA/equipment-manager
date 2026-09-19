<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { useApp } from "../store";
import { dateText, roles, type Role, type User } from "../domain";
const app = useApp();
const route = useRoute();
const search = ref("");
const status = ref("待审批");
const editing = ref(false);
const form = reactive<{
  id: string;
  name: string;
  role: Role;
  department: string;
}>({ id: "", name: "", role: "成员", department: "" });
const applications = computed(() =>
  app.db.applications.filter(
    (a) =>
      (!status.value || a.status === status.value) &&
      `${app.userName(a.userId)} ${a.department}`.includes(search.value),
  ),
);
const users = computed(() =>
  app.db.users.filter((u) =>
    `${u.name} ${u.department} ${u.role}`.includes(search.value),
  ),
);
function edit(u: User) {
  Object.assign(form, {
    id: u.id,
    name: u.name,
    role: app.isAdmin ? u.role : "成员",
    department: u.department,
  });
  editing.value = true;
}
function save() {
  try {
    app.updateUser(form.id, form.role, form.department);
    editing.value = false;
    ElMessage.success("身份已更新");
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
}
async function review(id: string, pass: boolean) {
  try {
    let reason = "";
    if (!pass) {
      const r = await ElMessageBox.prompt(
        "请说明驳回原因，申请人会收到通知。",
        "驳回申请",
        {
          inputValidator: (v) => !!v?.trim() || "请填写原因",
          confirmButtonText: "确认驳回",
          cancelButtonText: "取消",
        },
      );
      reason = r.value;
    } else
      await ElMessageBox.confirm("确认通过申请并授予成员身份？", "通过申请", {
        confirmButtonText: "确认通过",
        cancelButtonText: "取消",
      });
    app.review(id, pass, reason);
    ElMessage.success("审批完成");
  } catch (e) {
    if (e instanceof Error) ElMessage.error(e.message);
  }
}
</script>
<template>
  <div class="page-heading">
    <div>
      <p class="eyebrow">ADMINISTRATION / 团队管理</p>
      <h1>{{ route.meta.title }}</h1>
      <p class="muted">
        {{
          route.path.endsWith("users")
            ? "维护成员身份、部门归属与角色。"
            : "审核加入申请，让协作从这里开始。"
        }}
      </p>
    </div>
  </div>
  <section class="panel">
    <div class="filter-bar">
      <el-input
        v-model="search"
        clearable
        aria-label="搜索成员"
        placeholder="搜索姓名或部门"
      /><el-select
        v-if="route.path.endsWith('applications')"
        v-model="status"
        clearable
        placeholder="全部状态"
        aria-label="审批状态"
        ><el-option
          v-for="s in ['待审批', '已通过', '已驳回']"
          :key="s"
          :value="s"
          :label="s"
      /></el-select>
    </div>
    <el-table
      v-if="route.path.endsWith('applications')"
      :data="applications"
      empty-text="暂无待处理申请"
      ><el-table-column label="申请人" width="120"
        ><template #default="{ row }">{{
          app.userName(row.userId)
        }}</template></el-table-column
      ><el-table-column
        prop="department"
        label="申请部门"
        min-width="120"
      /><el-table-column
        prop="reason"
        label="申请理由"
        min-width="220"
      /><el-table-column label="提交时间" width="150"
        ><template #default="{ row }">{{
          dateText(row.time)
        }}</template></el-table-column
      ><el-table-column
        prop="status"
        label="状态"
        width="100"
      /><el-table-column label="操作 / 意见" min-width="180" fixed="right"
        ><template #default="{ row }"
          ><template v-if="row.status === '待审批'"
            ><el-button link type="primary" @click="review(row.id, true)"
              >通过</el-button
            ><el-button link type="danger" @click="review(row.id, false)"
              >驳回</el-button
            ></template
          ><span v-else>{{ row.review }}</span></template
        ></el-table-column
      ></el-table
    >
    <el-table v-else :data="users" empty-text="暂无匹配成员"
      ><el-table-column
        prop="name"
        label="姓名"
        min-width="130"
      /><el-table-column label="学号 / 工号" min-width="130"
        ><template #default="{ row }">{{
          row.account.length > 4
            ? row.account.slice(0, 2) + "****" + row.account.slice(-2)
            : "演示账号"
        }}</template></el-table-column
      ><el-table-column
        prop="department"
        label="部门"
        min-width="130"
      /><el-table-column label="角色" min-width="130"
        ><template #default="{ row }"
          ><el-tag :type="row.role === '非成员' ? 'info' : 'success'">{{
            row.role
          }}</el-tag></template
        ></el-table-column
      ><el-table-column label="操作" width="160" fixed="right"
        ><template #default="{ row }"
          ><el-button
            link
            type="primary"
            :disabled="
              row.id === app.user?.id || (!app.isAdmin && row.role !== '非成员')
            "
            @click="edit(row)"
            >{{ app.isAdmin ? "调整身份 / 部门" : "设为成员" }}</el-button
          ></template
        ></el-table-column
      ></el-table
    >
  </section>
  <section v-if="route.path.endsWith('users')" class="panel">
    <h2>角色权限说明</h2>
    <p class="muted">
      第一版使用固定角色规则；自定义权限配置等待团队确认后接入。
    </p>
    <div class="permission-grid">
      <article>
        <strong>非成员</strong>
        <p>查询设备与耗材、提交成员申请。</p>
      </article>
      <article>
        <strong>成员</strong>
        <p>查询、借用、归还、领用，查看自己的记录。</p>
      </article>
      <article>
        <strong>组长及以上</strong>
        <p>
          维护器材和库存、审批成员、查看管理记录。部门数据范围尚待后端落实。
        </p>
      </article>
      <article>
        <strong>系统管理员</strong>
        <p>具备演示管理功能，并可调整用户角色和部门。</p>
      </article>
    </div>
  </section>
  <el-dialog v-model="editing" title="调整成员身份" width="460px"
    ><p class="dialog-intro">{{ form.name }}</p>
    <el-form label-position="top" @submit.prevent="save"
      ><el-form-item label="角色"
        ><el-select
          v-model="form.role"
          aria-label="角色"
          :disabled="!app.isAdmin"
          ><el-option
            v-for="r in roles"
            :key="r"
            :label="r"
            :value="r" /></el-select></el-form-item
      ><el-form-item label="部门 / 组别"
        ><el-input
          v-model="form.department"
          aria-label="部门 / 组别"
          maxlength="60"
      /></el-form-item>
      <div class="dialog-actions">
        <el-button @click="editing = false">取消</el-button
        ><el-button type="primary" native-type="submit">保存身份</el-button>
      </div></el-form
    ></el-dialog
  >
</template>
