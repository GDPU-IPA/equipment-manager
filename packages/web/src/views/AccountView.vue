<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { useApp } from "../store";
import { dateText } from "../domain";
const route = useRoute();
const app = useApp();
const department = ref("");
const reason = ref("");
const name = ref(app.user?.name || "");
const unreadOnly = ref(false);
const busy = ref(false);
const password = reactive({ old: "", next: "", confirm: "" });
const applications = computed(() =>
  app.db.applications.filter((a) => a.userId === app.user?.id),
);
const pending = computed(() =>
  applications.value.some((a) => a.status === "待审批"),
);
function submit() {
  try {
    app.apply(department.value, reason.value);
    reason.value = "";
    ElMessage.success("申请已提交");
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
}
function profile() {
  try {
    app.updateProfile(name.value);
    ElMessage.success("资料已更新");
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
}
async function changePassword() {
  busy.value = true;
  try {
    if (password.next !== password.confirm) throw new Error("两次密码不一致");
    await app.changePassword(password.old, password.next);
    Object.assign(password, { old: "", next: "", confirm: "" });
    ElMessage.success("密码已更新");
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <div class="page-heading">
    <div>
      <p class="eyebrow">MY SPACE / 我的空间</p>
      <h1>{{ route.meta.title }}</h1>
      <p class="muted">
        {{
          route.path === "/application"
            ? "加入社团，解锁设备借用与耗材领用。"
            : route.path === "/notifications"
              ? "每一条进展，都在这里。"
              : "管理你的基本资料与账号。"
        }}
      </p>
    </div>
  </div>
  <template v-if="route.path === '/application'"
    ><section class="panel narrow-panel">
      <div class="panel-heading">
        <h2>申请加入社团</h2>
        <el-tag>{{ app.user?.role }}</el-tag>
      </div>
      <el-result
        v-if="app.canBorrow"
        icon="success"
        title="你已拥有成员权限"
        sub-title="可以前往设备中心开始借用。"
      /><el-alert
        v-else-if="pending"
        title="申请正在审核中，请等待管理人员处理。"
        type="info"
        :closable="false"
      /><el-form v-else label-position="top" @submit.prevent="submit"
        ><el-form-item label="申请部门 / 组别"
          ><el-input
            v-model="department"
            aria-label="申请部门 / 组别"
            maxlength="60"
            placeholder="例如：电子组" /></el-form-item
        ><el-form-item label="申请理由"
          ><el-input
            v-model="reason"
            aria-label="申请理由"
            type="textarea"
            :rows="4"
            maxlength="300"
            show-word-limit
            placeholder="介绍你的兴趣与器材使用需求" /></el-form-item
        ><el-button type="primary" native-type="submit"
          >提交申请</el-button
        ></el-form
      >
    </section>
    <section class="panel">
      <h2>申请记录</h2>
      <el-empty
        v-if="!applications.length"
        description="还没有提交过申请"
        :image-size="80"
      />
      <div v-for="a in applications" :key="a.id" class="notice">
        <div class="panel-heading">
          <strong>{{ a.department }}</strong
          ><el-tag
            :type="
              a.status === '已通过'
                ? 'success'
                : a.status === '已驳回'
                  ? 'danger'
                  : 'warning'
            "
            >{{ a.status }}</el-tag
          >
        </div>
        <p>{{ a.reason }}</p>
        <p v-if="a.review" class="soft-note">审批意见：{{ a.review }}</p>
        <small class="muted">{{ dateText(a.time) }}</small>
      </div>
    </section></template
  >
  <section v-else-if="route.path === '/notifications'" class="panel">
    <div class="panel-heading">
      <el-switch v-model="unreadOnly" active-text="只看未读" /><el-button
        :disabled="!app.unread"
        @click="app.markRead()"
        >全部标为已读</el-button
      >
    </div>
    <el-empty
      v-if="!app.myNotices.filter((n) => !unreadOnly || !n.read).length"
      description="没有待查看的通知"
    />
    <article
      v-for="n in app.myNotices.filter((n) => !unreadOnly || !n.read)"
      :key="n.id"
      class="notice"
      :class="{ unread: !n.read }"
    >
      <div class="panel-heading">
        <strong>{{ n.title }}</strong
        ><el-button
          v-if="!n.read"
          link
          type="primary"
          @click="app.markRead(n.id)"
          >标为已读</el-button
        ><span v-else class="muted">已读</span>
      </div>
      <p>{{ n.content }}</p>
      <small class="muted">{{ dateText(n.time) }}</small>
    </article>
  </section>
  <div v-else class="dashboard-columns">
    <section class="panel">
      <div class="panel-heading">
        <h2>基本资料</h2>
        <el-tag>{{ app.user?.role }}</el-tag>
      </div>
      <el-form label-position="top" @submit.prevent="profile"
        ><el-form-item label="学号 / 工号"
          ><el-input :model-value="app.user?.account" disabled /></el-form-item
        ><el-form-item label="姓名"
          ><el-input
            v-model="name"
            aria-label="姓名"
            maxlength="30" /></el-form-item
        ><el-form-item label="部门"
          ><el-input
            :model-value="app.user?.department"
            disabled /></el-form-item
        ><el-button type="primary" native-type="submit"
          >保存资料</el-button
        ></el-form
      >
    </section>
    <section class="panel">
      <h2>修改密码</h2>
      <p class="muted">仅支持自行注册的测试账号。</p>
      <el-form label-position="top" @submit.prevent="changePassword"
        ><el-form-item label="原密码"
          ><el-input
            v-model="password.old"
            aria-label="原密码"
            type="password"
            show-password /></el-form-item
        ><el-form-item label="新密码"
          ><el-input
            v-model="password.next"
            aria-label="新密码"
            type="password"
            show-password
            maxlength="72"
            placeholder="至少 8 位，包含字母和数字" /></el-form-item
        ><el-form-item label="确认新密码"
          ><el-input
            v-model="password.confirm"
            aria-label="确认新密码"
            type="password"
            show-password /></el-form-item
        ><el-button native-type="submit" :loading="busy"
          >更新密码</el-button
        ></el-form
      >
    </section>
  </div>
</template>
