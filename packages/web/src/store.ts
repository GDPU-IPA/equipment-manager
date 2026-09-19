import { computed, ref, watch } from "vue";
import { defineStore } from "pinia";
import {
  managers,
  now,
  seed,
  uid,
  type Asset,
  type Database,
  type Material,
  type Role,
  type User,
} from "./domain";
const KEY = "ipa-equipment-demo-v1";
const SESSION = "ipa-equipment-session-v1";
function load(): Database {
  try {
    const d = JSON.parse(
      localStorage.getItem(KEY) || "null",
    ) as Database | null;
    if (
      d &&
      [
        "users",
        "assets",
        "materials",
        "loans",
        "movements",
        "applications",
        "notices",
        "audits",
      ].every((k) => Array.isArray(d[k as keyof Database]))
    )
      return d;
  } catch {
    /* Reset invalid demo data. */
  }
  return seed();
}
async function hash(password: string, salt: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: new TextEncoder().encode(salt),
      iterations: 100000,
    },
    key,
    256,
  );
  return Array.from(new Uint8Array(bits), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}
function passwordValid(p: string) {
  if (p.length < 8 || p.length > 72 || !/[A-Za-z]/.test(p) || !/\d/.test(p))
    throw new Error("密码须为 8–72 位，并包含字母和数字");
}
export const useApp = defineStore("app", () => {
  const db = ref<Database>(load());
  const session = ref(sessionStorage.getItem(SESSION) || "");
  const storageError = ref("");
  watch(
    db,
    (v) => {
      try {
        localStorage.setItem(KEY, JSON.stringify(v));
        storageError.value = "";
      } catch {
        storageError.value = "浏览器无法保存演示数据，刷新后可能丢失本次操作。";
      }
    },
    { deep: true },
  );
  const user = computed(() =>
    db.value.users.find((u) => u.id === session.value),
  );
  const canManage = computed(
    () => !!user.value && managers.includes(user.value.role),
  );
  const isAdmin = computed(() => user.value?.role === "系统管理员");
  const canBorrow = computed(
    () => !!user.value && user.value.role !== "非成员",
  );
  const myNotices = computed(() =>
    db.value.notices.filter((n) => n.userId === user.value?.id),
  );
  const unread = computed(() => myNotices.value.filter((n) => !n.read).length);
  const current = () => {
    if (!user.value) throw new Error("请先登录");
    return user.value;
  };
  function requireManager() {
    if (!canManage.value) throw new Error("没有管理权限");
  }
  function audit(action: string, detail: string) {
    db.value.audits.unshift({
      id: uid(),
      userId: current().id,
      action,
      detail,
      time: now(),
    });
  }
  function notify(userId: string, title: string, content: string) {
    db.value.notices.unshift({
      id: uid(),
      userId,
      title,
      content,
      time: now(),
      read: false,
    });
  }
  function setSession(id: string) {
    session.value = id;
    sessionStorage.setItem(SESSION, id);
  }
  function demoLogin(id: string) {
    if (!["admin", "member", "guest"].includes(id))
      throw new Error("演示账号不存在");
    setSession(id);
    audit("演示登录", "进入本地演示环境");
  }
  async function login(account: string, password: string) {
    const u = db.value.users.find((u) => u.account === account.trim());
    if (
      !u?.passwordHash ||
      !u.salt ||
      (await hash(password, u.salt)) !== u.passwordHash
    )
      throw new Error("账号或密码不正确；内置账号请使用演示入口");
    setSession(u.id);
    audit("登录", "账号登录");
  }
  async function register(
    account: string,
    name: string,
    department: string,
    password: string,
  ) {
    if (!/^[A-Za-z0-9]{4,20}$/.test(account))
      throw new Error("学号 / 工号须为 4–20 位字母或数字");
    if (!name.trim() || !department.trim())
      throw new Error("请填写姓名和部门 / 身份说明");
    if (db.value.users.some((u) => u.account === account))
      throw new Error("该学号 / 工号已经注册");
    passwordValid(password);
    const salt = uid();
    const passwordHash = await hash(password, salt);
    if (db.value.users.some((u) => u.account === account))
      throw new Error("该账号已经注册");
    const u: User = {
      id: uid(),
      account,
      name: name.trim(),
      department: department.trim(),
      role: "非成员",
      salt,
      passwordHash,
    };
    db.value.users.push(u);
    setSession(u.id);
    audit("注册", "注册为非成员");
    notify(u.id, "注册成功", "通过成员申请后即可借用设备和领用耗材。");
  }
  function logout() {
    session.value = "";
    sessionStorage.removeItem(SESSION);
  }
  async function changePassword(old: string, next: string) {
    const u = current();
    if (!u.passwordHash || !u.salt)
      throw new Error("内置演示账号不支持修改密码，请注册测试账号");
    if ((await hash(old, u.salt)) !== u.passwordHash)
      throw new Error("原密码不正确");
    passwordValid(next);
    const salt = uid();
    u.passwordHash = await hash(next, salt);
    u.salt = salt;
    audit("修改密码", "更新自己的密码");
  }
  function borrow(
    assetId: string,
    purpose: string,
    place: string,
    due: string,
  ) {
    if (!canBorrow.value) throw new Error("请先申请成为成员");
    const a = db.value.assets.find((a) => a.id === assetId);
    if (
      !a ||
      a.status !== "在库" ||
      db.value.loans.some((l) => l.assetId === assetId && !l.returned)
    )
      throw new Error("设备当前不可借用");
    if (
      !purpose.trim() ||
      !place.trim() ||
      !due ||
      !Number.isFinite(Date.parse(due)) ||
      Date.parse(due) <= Date.now()
    )
      throw new Error("请填写用途、地点，以及未来的归还时间");
    db.value.loans.unshift({
      id: uid(),
      assetId,
      userId: current().id,
      purpose,
      place,
      due,
      start: now(),
    });
    a.status = "借出中";
    audit("借用设备", a.name);
    notify(current().id, "借用成功", `已借用「${a.name}」，请按时归还。`);
  }
  function returnLoan(id: string) {
    const l = db.value.loans.find((l) => l.id === id);
    if (!l || l.returned) throw new Error("该记录已处理或不存在");
    if (l.userId !== current().id && !canManage.value)
      throw new Error("只能归还自己的设备");
    l.returned = now();
    const a = db.value.assets.find((a) => a.id === l.assetId);
    if (a) a.status = "在库";
    audit("归还设备", a?.name || l.assetId);
    notify(l.userId, "归还完成", `「${a?.name}」已归还。`);
  }
  function moveStock(
    id: string,
    kind: "领用" | "入库" | "盘点",
    quantity: number,
    reason: string,
  ) {
    if (kind === "领用" ? !canBorrow.value : !canManage.value)
      throw new Error("没有操作权限");
    const m = db.value.materials.find((m) => m.id === id);
    if (
      !m ||
      !Number.isSafeInteger(quantity) ||
      quantity < (kind === "盘点" ? 0 : 1) ||
      quantity > 1000000 ||
      !reason.trim()
    )
      throw new Error("请填写有效整数数量与原因（最大 1000000）");
    const delta =
      kind === "盘点"
        ? quantity - m.stock
        : kind === "领用"
          ? -quantity
          : quantity;
    if (m.stock + delta < 0) throw new Error("库存不足，请减少领用数量");
    m.stock += delta;
    db.value.movements.unshift({
      id: uid(),
      materialId: id,
      userId: current().id,
      delta,
      balance: m.stock,
      reason,
      time: now(),
      kind,
    });
    audit(
      kind,
      `${m.name} ${delta > 0 ? "+" : ""}${delta} ${m.unit}；${reason}`,
    );
    notify(
      current().id,
      `${kind}完成`,
      `${m.name}：变动 ${delta} ${m.unit}，剩余 ${m.stock} ${m.unit}。`,
    );
  }
  function apply(department: string, reason: string) {
    if (current().role !== "非成员") throw new Error("你已经是成员");
    if (!department.trim() || !reason.trim())
      throw new Error("请填写部门和理由");
    if (
      db.value.applications.some(
        (a) => a.userId === current().id && a.status === "待审批",
      )
    )
      throw new Error("已有申请等待审批");
    db.value.applications.unshift({
      id: uid(),
      userId: current().id,
      department,
      reason,
      status: "待审批",
      time: now(),
    });
    audit("成员申请", department);
    db.value.users
      .filter((u) => managers.includes(u.role))
      .forEach((u) =>
        notify(
          u.id,
          "新的成员申请",
          `${current().name} 申请加入 ${department}。`,
        ),
      );
  }
  function review(id: string, pass: boolean, reason: string) {
    requireManager();
    const a = db.value.applications.find((a) => a.id === id);
    if (!a || a.status !== "待审批") throw new Error("申请已处理");
    if (!pass && !reason.trim()) throw new Error("请填写驳回原因");
    const u = db.value.users.find((u) => u.id === a.userId);
    if (!u) throw new Error("申请人不存在");
    a.status = pass ? "已通过" : "已驳回";
    a.review = reason || "欢迎加入社团";
    if (pass) {
      u.role = "成员";
      u.department = a.department;
    }
    audit("审批成员", `${u.name}：${a.status}`);
    notify(u.id, `成员申请${a.status}`, a.review);
  }
  function updateUser(id: string, role: Role, department: string) {
    requireManager();
    const u = db.value.users.find((u) => u.id === id);
    if (!u || !department.trim()) throw new Error("请选择用户并填写部门");
    if (id === current().id) throw new Error("不能更改自己的角色");
    if (!isAdmin.value && !(u.role === "非成员" && role === "成员"))
      throw new Error("管理层只可将非成员设为成员，角色调整需系统管理员操作");
    const before = u.role;
    u.role = role;
    u.department = department;
    audit("设置成员身份", `${u.name}：${before} → ${role}；${department}`);
    notify(id, "身份已更新", `当前角色：${role}，部门：${department}`);
    db.value.applications
      .filter(
        (a) => a.userId === id && a.status === "待审批" && role !== "非成员",
      )
      .forEach((a) => {
        a.status = "已通过";
        a.review = "管理人员直接设置成员身份";
      });
  }
  function saveAsset(input: Asset) {
    requireManager();
    if (
      ![
        input.name,
        input.serial,
        input.category,
        input.location,
        input.department,
      ].every((v) => v.trim())
    )
      throw new Error("请填写名称、编号、分类、位置和部门");
    if (
      db.value.assets.some(
        (a) => a.serial === input.serial && a.id !== input.id,
      )
    )
      throw new Error("设备编号已存在");
    const old = db.value.assets.find((a) => a.id === input.id);
    if (old?.status === "借出中" && input.status !== old.status)
      throw new Error("借出设备必须通过归还流程更改状态");
    if (input.status === "借出中" && old?.status !== "借出中")
      throw new Error("请通过借用流程借出设备");
    if (old) Object.assign(old, input);
    else db.value.assets.unshift({ ...input, id: uid() });
    audit(old ? "编辑设备" : "新增设备", input.name);
  }
  function saveMaterial(input: Material) {
    requireManager();
    if (
      ![
        input.name,
        input.unit,
        input.category,
        input.location,
        input.department,
      ].every((v) => v.trim()) ||
      !Number.isInteger(input.warning) ||
      input.warning < 0
    )
      throw new Error("请填写完整信息和有效预警值");
    const old = db.value.materials.find((m) => m.id === input.id);
    if (old) Object.assign(old, { ...input, stock: old.stock });
    else db.value.materials.unshift({ ...input, id: uid(), stock: 0 });
    audit(old ? "编辑耗材" : "新增耗材", input.name);
  }
  function markRead(id?: string) {
    myNotices.value
      .filter((n) => !id || n.id === id)
      .forEach((n) => (n.read = true));
  }
  function updateProfile(name: string) {
    if (!name.trim()) throw new Error("姓名不能为空");
    current().name = name.trim();
    audit("修改资料", "更新姓名");
  }
  const userName = (id: string) =>
    db.value.users.find((u) => u.id === id)?.name || "未知用户";
  const assetName = (id: string) =>
    db.value.assets.find((a) => a.id === id)?.name || "未知设备";
  return {
    db,
    user,
    canManage,
    isAdmin,
    canBorrow,
    myNotices,
    unread,
    storageError,
    demoLogin,
    login,
    register,
    logout,
    changePassword,
    borrow,
    returnLoan,
    moveStock,
    apply,
    review,
    updateUser,
    saveAsset,
    saveMaterial,
    markRead,
    updateProfile,
    userName,
    assetName,
  };
});
