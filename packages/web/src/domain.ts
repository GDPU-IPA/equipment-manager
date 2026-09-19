export type Role =
  | "非成员"
  | "成员"
  | "组长"
  | "部长"
  | "副社长"
  | "社长"
  | "指导老师"
  | "系统管理员";
export const roles: Role[] = [
  "非成员",
  "成员",
  "组长",
  "部长",
  "副社长",
  "社长",
  "指导老师",
  "系统管理员",
];
export const managers: Role[] = [
  "组长",
  "部长",
  "副社长",
  "社长",
  "指导老师",
  "系统管理员",
];
export interface User {
  id: string;
  account: string;
  name: string;
  department: string;
  role: Role;
  salt?: string;
  passwordHash?: string;
}
export interface Asset {
  id: string;
  name: string;
  category: string;
  location: string;
  department: string;
  description: string;
  status: "在库" | "借出中" | "维修中" | "报废";
  serial: string;
}
export interface Material {
  id: string;
  name: string;
  category: string;
  location: string;
  department: string;
  unit: string;
  stock: number;
  warning: number;
  spec: string;
}
export interface Loan {
  id: string;
  assetId: string;
  userId: string;
  purpose: string;
  place: string;
  start: string;
  due: string;
  returned?: string;
}
export interface Movement {
  id: string;
  materialId: string;
  userId: string;
  delta: number;
  balance: number;
  reason: string;
  time: string;
  kind: "领用" | "入库" | "盘点";
}
export interface Application {
  id: string;
  userId: string;
  department: string;
  reason: string;
  status: "待审批" | "已通过" | "已驳回";
  time: string;
  review?: string;
}
export interface Notice {
  id: string;
  userId: string;
  title: string;
  content: string;
  time: string;
  read: boolean;
}
export interface Audit {
  id: string;
  userId: string;
  action: string;
  detail: string;
  time: string;
}
export interface Database {
  users: User[];
  assets: Asset[];
  materials: Material[];
  loans: Loan[];
  movements: Movement[];
  applications: Application[];
  notices: Notice[];
  audits: Audit[];
}
export const uid = () => crypto.randomUUID();
export const now = () => new Date().toISOString();
export const dateText = (value: string) =>
  new Date(value).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
export function seed(): Database {
  return {
    users: [
      {
        id: "admin",
        account: "admin",
        name: "林知远",
        department: "技术部",
        role: "系统管理员",
      },
      {
        id: "member",
        account: "20260001",
        name: "程同学",
        department: "电子组",
        role: "成员",
      },
      {
        id: "guest",
        account: "20260002",
        name: "新同学",
        department: "待加入",
        role: "非成员",
      },
      {
        id: "leader",
        account: "20260003",
        name: "陈明",
        department: "电子组",
        role: "组长",
      },
    ],
    assets: [
      {
        id: "EQ-001",
        serial: "IPA-2026-001",
        name: "数字示波器",
        category: "测量仪器",
        location: "实验室 A · 01 柜",
        department: "电子组",
        status: "在库",
        description:
          "双通道数字示波器，配备探头与电源线。使用后请将配件完整收回。",
      },
      {
        id: "EQ-002",
        serial: "IPA-2026-002",
        name: "恒温焊台",
        category: "电子工具",
        location: "实验室 A · 02 柜",
        department: "电子组",
        status: "在库",
        description: "温度可调，适合电路焊接。离开前请关闭电源并等待降温。",
      },
      {
        id: "EQ-003",
        serial: "IPA-2026-003",
        name: "数显万用表",
        category: "测量仪器",
        location: "实验室 A · 01 柜",
        department: "电子组",
        status: "借出中",
        description: "含表笔一对。请根据测量对象选择正确档位。",
      },
      {
        id: "EQ-004",
        serial: "IPA-2026-004",
        name: "树莓派开发套件",
        category: "开发套件",
        location: "创新空间 · 03 柜",
        department: "技术部",
        status: "在库",
        description: "包含开发板、外壳、电源与存储卡。归还前请备份个人数据。",
      },
      {
        id: "EQ-005",
        serial: "IPA-2026-005",
        name: "桌面 3D 打印机",
        category: "加工设备",
        location: "创客工坊 · 工作台",
        department: "公共",
        status: "维修中",
        description: "喷头维护中，暂不开放借用。",
      },
      {
        id: "EQ-006",
        serial: "IPA-2026-006",
        name: "Arduino 入门套装",
        category: "开发套件",
        location: "创新空间 · 03 柜",
        department: "公共",
        status: "在库",
        description: "包含控制板、面包板与基础传感器，适合入门项目。",
      },
    ],
    materials: [
      {
        id: "MT-001",
        name: "杜邦线",
        category: "连接配件",
        location: "实验室 A · 耗材柜",
        department: "公共",
        unit: "根",
        stock: 120,
        warning: 30,
        spec: "公对公 · 20 cm",
      },
      {
        id: "MT-002",
        name: "电阻套装",
        category: "电子元件",
        location: "实验室 A · 耗材柜",
        department: "电子组",
        unit: "包",
        stock: 8,
        warning: 10,
        spec: "1/4 W · 常用阻值",
      },
      {
        id: "MT-003",
        name: "无铅焊锡丝",
        category: "焊接耗材",
        location: "实验室 A · 02 柜",
        department: "电子组",
        unit: "卷",
        stock: 16,
        warning: 5,
        spec: "0.8 mm · 100 g",
      },
      {
        id: "MT-004",
        name: "PLA 打印耗材",
        category: "加工耗材",
        location: "创客工坊 · 耗材架",
        department: "公共",
        unit: "卷",
        stock: 0,
        warning: 3,
        spec: "白色 · 1.75 mm",
      },
    ],
    loans: [
      {
        id: "LN-DEMO",
        assetId: "EQ-003",
        userId: "member",
        purpose: "电路调试",
        place: "实验室 A",
        start: new Date(Date.now() - 86400000).toISOString(),
        due: new Date(Date.now() + 3 * 86400000).toISOString(),
      },
    ],
    movements: [],
    applications: [],
    audits: [],
    notices: ["admin", "member", "guest", "leader"].map((userId) => ({
      id: uid(),
      userId,
      title: "欢迎使用创协器材管理",
      content:
        "这里可以查询设备、借还器材和领用耗材。当前为本地演示环境，请勿填写真实个人信息。",
      time: now(),
      read: false,
    })),
  };
}
