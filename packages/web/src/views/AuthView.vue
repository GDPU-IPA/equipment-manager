<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useApp } from "../store";
const app = useApp();
const router = useRouter();
const mode = ref("login");
const busy = ref(false);
const form = reactive({
  account: "",
  password: "",
  confirm: "",
  name: "",
  department: "",
});
async function submit() {
  busy.value = true;
  try {
    if (mode.value === "register") {
      if (form.password !== form.confirm)
        throw new Error("两次输入的密码不一致");
      await app.register(
        form.account.trim(),
        form.name,
        form.department,
        form.password,
      );
    } else await app.login(form.account, form.password);
    router.push("/");
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    busy.value = false;
  }
}
function demo(id: string) {
  app.demoLogin(id);
  router.push("/");
}
</script>
<template>
  <div class="auth-page">
    <section class="auth-story">
      <div class="brand light">
        <span class="brand-mark">创</span
        ><span>创协器材管理<small>IPA · EQUIPMENT</small></span>
      </div>
      <div>
        <p class="eyebrow">为每一个创意，准备好工具</p>
        <h1>器材有序，<br />创造无限。</h1>
        <p>
          查询、借用、归还，让协作更简单。<br />一个工作空间，连接社团的每一份资源。
        </p>
        <div class="auth-art">
          <span>01 / FIND</span><strong>找到所需</strong>
          <div class="art-line" />
          <span>02 / CREATE</span><strong>专注创造</strong>
          <div class="art-line" />
          <span>03 / RETURN</span><strong>共享价值</strong>
        </div>
      </div>
      <small>创新协会 · 设备与耗材管理系统</small>
    </section>
    <section class="auth-panel">
      <div class="auth-form">
        <p class="eyebrow">欢迎来到你的工作空间</p>
        <h2>{{ mode === "login" ? "登录账号" : "创建账号" }}</h2>
        <p class="muted">
          {{
            mode === "login"
              ? "登录后，开始管理和使用社团资源。"
              : "注册即生效；通过成员申请后可借用设备。"
          }}
        </p>
        <el-form label-position="top" @submit.prevent="submit"
          ><el-form-item label="学号 / 工号"
            ><el-input
              v-model="form.account"
              aria-label="学号 / 工号"
              maxlength="20"
              placeholder="请输入学号 / 工号"
              autocomplete="username" /></el-form-item
          ><template v-if="mode === 'register'"
            ><el-form-item label="姓名"
              ><el-input
                v-model="form.name"
                aria-label="姓名"
                maxlength="30"
                placeholder="演示环境请用化名" /></el-form-item
            ><el-form-item label="部门 / 身份说明"
              ><el-input
                v-model="form.department"
                aria-label="部门 / 身份说明"
                maxlength="60"
                placeholder="例如：电子组 / 校内学生" /></el-form-item></template
          ><el-form-item label="密码"
            ><el-input
              v-model="form.password"
              aria-label="密码"
              type="password"
              show-password
              maxlength="72"
              placeholder="至少 8 位，包含字母和数字"
              :autocomplete="
                mode === 'login' ? 'current-password' : 'new-password'
              " /></el-form-item
          ><el-form-item v-if="mode === 'register'" label="确认密码"
            ><el-input
              v-model="form.confirm"
              aria-label="确认密码"
              type="password"
              show-password
              maxlength="72" /></el-form-item
          ><el-button
            type="primary"
            native-type="submit"
            :loading="busy"
            class="full-width"
            >{{
              mode === "login" ? "登录工作空间 →" : "注册并登录 →"
            }}</el-button
          ></el-form
        >
        <p class="auth-switch">
          <span>{{ mode === "login" ? "还没有账号？" : "已有账号？" }}</span
          ><el-button
            link
            type="primary"
            @click="mode = mode === 'login' ? 'register' : 'login'"
            >{{ mode === "login" ? "立即注册" : "返回登录" }}</el-button
          >
        </p>
        <div class="demo-entry">
          <span>无需密码，先体验一下</span>
          <div>
            <el-button @click="demo('member')">成员体验</el-button
            ><el-button @click="demo('guest')">非成员体验</el-button
            ><el-button @click="demo('admin')">管理员体验</el-button>
          </div>
          <small>本地演示 · 非真实认证 · 请勿填写真实密码</small>
        </div>
        <p class="fineprint">
          忘记测试账号密码？请联系项目负责人。正式密码重置待后端接口接入。
        </p>
      </div>
    </section>
  </div>
</template>
