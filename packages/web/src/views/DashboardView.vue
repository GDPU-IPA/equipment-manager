<script setup lang="ts">
import { computed } from "vue";
import {
  Box,
  Collection,
  Document,
  Bell,
  ArrowRight,
  Monitor,
  Tools,
  Cpu,
} from "@element-plus/icons-vue";
import { useApp } from "../store";
import { dateText } from "../domain";
const app = useApp();
const loans = computed(() =>
  app.db.loans.filter((l) => l.userId === app.user?.id && !l.returned),
);
const low = computed(() =>
  app.db.materials.filter((m) => m.stock <= m.warning),
);
const available = computed(() =>
  app.db.assets.filter((a) => a.status === "在库"),
);
const today = new Date().toLocaleDateString("zh-CN", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "long",
});
const icons = [Monitor, Tools, Cpu];
</script>
<template>
  <div class="page-heading">
    <div>
      <p class="eyebrow">OVERVIEW / 工作台</p>
      <h1>你好，{{ app.user?.name }} <span class="hello-dot">✦</span></h1>
      <p class="muted">今天也让灵感落地。你的社团资源，一目了然。</p>
    </div>
    <span class="date-label">{{ today }}</span>
  </div>
  <section class="welcome-card">
    <div>
      <span class="pill">资源共享 · 高效协作</span>
      <h2>下一次创造，从这里开始。</h2>
      <p>找到需要的工具，把时间留给想法与实践。</p>
      <router-link to="/equipment"
        ><el-button type="primary"
          >浏览可借设备 <el-icon><ArrowRight /></el-icon></el-button
      ></router-link>
    </div>
    <div class="welcome-art" aria-hidden="true">
      <div class="orb orb-a" />
      <div class="orb orb-b" />
      <div class="equipment-outline">
        <el-icon><Monitor /></el-icon><span>READY TO CREATE</span>
      </div>
      <div class="floating-label">
        <span class="status-dot" /> {{ available.length }} 件设备可借
      </div>
    </div>
  </section>
  <div class="stats-grid">
    <article class="stat-card">
      <el-icon class="stat-icon green"><Box /></el-icon><span>设备总数</span
      ><strong>{{ app.db.assets.length }}<small>件</small></strong>
      <p>{{ available.length }} 件当前可借用</p>
    </article>
    <article class="stat-card">
      <el-icon class="stat-icon blue"><Document /></el-icon><span>我的在借</span
      ><strong>{{ loans.length }}<small>件</small></strong>
      <p>按时归还，让资源流转</p>
    </article>
    <article class="stat-card">
      <el-icon class="stat-icon orange"><Collection /></el-icon
      ><span>库存提醒</span><strong>{{ low.length }}<small>项</small></strong>
      <p>耗材低于或达到预警值</p>
    </article>
    <article class="stat-card">
      <el-icon class="stat-icon violet"><Bell /></el-icon><span>未读通知</span
      ><strong>{{ app.unread }}<small>条</small></strong>
      <p>及时查看最新动态</p>
    </article>
  </div>
  <div class="dashboard-columns">
    <section class="panel">
      <div class="panel-heading">
        <h2>我的借用</h2>
        <router-link to="/loans">查看全部 →</router-link>
      </div>
      <el-empty
        v-if="!loans.length"
        description="还没有在借设备，去设备中心看看吧"
        :image-size="75"
      />
      <div v-for="loan in loans.slice(0, 3)" :key="loan.id" class="loan-row">
        <div class="object-icon">
          <el-icon><Monitor /></el-icon>
        </div>
        <div class="grow">
          <strong>{{ app.assetName(loan.assetId) }}</strong>
          <p class="muted">预计归还 {{ dateText(loan.due) }}</p>
        </div>
        <el-tag type="warning" effect="light">借用中</el-tag>
      </div>
      <div class="soft-note">归还前请检查器材和配件是否完整。</div>
    </section>
    <section class="panel">
      <div class="panel-heading">
        <h2>库存关注</h2>
        <router-link to="/materials">查看耗材 →</router-link>
      </div>
      <el-empty v-if="!low.length" description="库存充足" :image-size="70" />
      <div v-for="m in low" :key="m.id" class="stock-row">
        <div>
          <strong>{{ m.name }}</strong>
          <p class="muted">{{ m.spec }}</p>
        </div>
        <div class="stock-number" :class="{ danger: !m.stock }">
          {{ m.stock }} <small>{{ m.unit }}</small>
          <p>{{ m.stock ? "库存偏低" : "暂时缺货" }}</p>
        </div>
      </div>
    </section>
  </div>
  <section class="panel">
    <div class="panel-heading">
      <div>
        <h2>随时可借，随时开始</h2>
        <p class="muted">当前可用的社团设备</p>
      </div>
      <router-link to="/equipment">进入设备中心 →</router-link>
    </div>
    <div class="recommended-grid">
      <router-link
        v-for="(asset, i) in available.slice(0, 3)"
        :key="asset.id"
        :to="{ path: '/demo/equipment', query: { detail: asset.id } }"
        class="recommended-card"
        ><div class="recommended-art" :class="'art-' + i">
          <el-icon><component :is="icons[i]" /></el-icon
          ><span>{{ asset.category }}</span>
        </div>
        <div class="recommended-body">
          <strong>{{ asset.name }}</strong
          ><el-tag size="small" type="success">可借用</el-tag>
          <p>{{ asset.location }}</p>
        </div></router-link
      >
    </div>
  </section>
  <div v-if="!app.canBorrow" class="membership-callout">
    <div>
      <strong>申请成为社团成员</strong>
      <p>通过申请后即可借用设备、领用耗材。</p>
    </div>
    <router-link to="/application"
      ><el-button>提交成员申请 →</el-button></router-link
    >
  </div>
</template>
