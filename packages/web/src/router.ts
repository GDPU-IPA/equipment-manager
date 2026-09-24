import { createRouter, createWebHashHistory } from "vue-router";
import { useApp } from "./store";
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/login", component: () => import("./views/AuthView.vue") },
    {
      path: "/",
      component: () => import("./views/DashboardView.vue"),
      meta: { title: "工作台" },
    },
    {
      path: "/equipment",
      component: () => import("./views/EquipmentView.vue"),
      meta: { title: "设备中心" },
    },
    {
      path: "/demo/equipment",
      component: () => import("./views/CatalogView.vue"),
      meta: { title: "设备借用演示" },
    },
    {
      path: "/materials",
      component: () => import("./views/CatalogView.vue"),
      meta: { title: "耗材领用" },
    },
    {
      path: "/loans",
      component: () => import("./views/RecordsView.vue"),
      meta: { title: "我的借用" },
    },
    {
      path: "/application",
      component: () => import("./views/AccountView.vue"),
      meta: { title: "成员申请" },
    },
    {
      path: "/notifications",
      component: () => import("./views/AccountView.vue"),
      meta: { title: "通知中心" },
    },
    {
      path: "/profile",
      component: () => import("./views/AccountView.vue"),
      meta: { title: "个人中心" },
    },
    {
      path: "/admin/assets",
      component: () => import("./views/CatalogView.vue"),
      meta: { title: "器材台账", manager: true },
    },
    {
      path: "/admin/inventory",
      component: () => import("./views/CatalogView.vue"),
      meta: { title: "库存管理", manager: true },
    },
    {
      path: "/admin/loans",
      component: () => import("./views/RecordsView.vue"),
      meta: { title: "借用管理", manager: true },
    },
    {
      path: "/admin/applications",
      component: () => import("./views/AdminView.vue"),
      meta: { title: "成员审批", manager: true },
    },
    {
      path: "/admin/users",
      component: () => import("./views/AdminView.vue"),
      meta: { title: "成员与权限", manager: true },
    },
    {
      path: "/admin/logs",
      component: () => import("./views/RecordsView.vue"),
      meta: { title: "操作日志", manager: true },
    },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});
router.beforeEach((to) => {
  const app = useApp();
  if (!app.user && to.path !== "/login") return "/login";
  if (app.user && to.path === "/login") return "/";
  if (to.meta.manager && !app.canManage) return "/";
  document.title = `${to.meta.title || "登录"} · 创协器材管理`;
});
