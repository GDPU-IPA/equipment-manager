# API 接口文档

> **全局约定**：
> 1. 除登录、注册外，所有接口需在 HTTP Header 中携带 `Authorization: Bearer <token>`。
> 2. 统一响应格式：`{ "code": 200, "msg": "success", "data": { ... } }`。下文表格仅列出 `data` 内部的核心字段。

## 目录
- [用户注册登录](#用户注册登录)
  - [注册](#注册)
  - [登录](#登录)
  - [登出](#登出)
  - [修改密码](#修改密码)
  - [修改密码(管理员)](#修改密码管理员)
- [器材管理](#器材管理)
- [器材使用](#器材使用)

---

## 用户注册登录

| 功能 | 请求方法 | URL | 说明 |
| :--- | :--- | :--- | :--- |
| 注册 | POST | `/api/users` | 注册账号（默认角色为普通用户） |
| 登录 | POST | `/api/session` | 验证账号密码，返回 Token |
| 登出 | POST | `/api/sessions/current` | 清除当前 Token（服务端可配合黑名单） |
| 用户信息 | GET | `/api/users/me` | 返回当前登录用户信息 |
| 修改密码 | POST | `/api/users/me/password` | 用户修改自己的密码 |
| 管理员修改密码| POST | `/api/users/{id}/password`| 管理员重置指定用户的密码 |
| 用户列表 | GET | `/api/users` | 管理员获取用户列表（支持分页/搜索） |

### 注册
| 字段 | 类型 | 必填 | 说明 | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| account | string | 是 | 登录账号（学号/工号） | "20230001" |
| username | string | 是 | 用户真实姓名 | "张三" |
| password | string | 是 | 密码（前端需加密或后端强制校验复杂度）| "Pass@1234" |

### 登录
| 字段 | 类型 | 必填 | 说明 | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| account | string | 是 | 登录账号 | "20230001" |
| password | string | 是 | 密码 | "Pass@1234" |

#### 响应字段 (data)
| 字段 | 类型 | 说明 | 示例 |
| :--- | :--- | :--- | :--- |
| token | string | JWT 或 Session Token，用于后续鉴权 | "eyJhbGciOiJI..." |
| role | string | 用户角色（前端用于路由权限控制） | "student" / "admin" |

### 登出
*(无请求参数，依赖 Header 中的 Token)*

### 修改密码
| 字段 | 类型 | 必填 | 说明 | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| old_password | string | 是 | 旧密码 | "Pass@1234" |
| new_password | string | 是 | 新密码 | "NewPass@5678" |

### 修改密码(管理员)
| 字段 | 类型 | 必填 | 说明 | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| new_password | string | 是 | 重置后的新密码 | "Reset@1234" |

---

## 器材管理

> **注**：此模块对应数据库 `item` 表。

| 功能 | 请求方法 | URL | 说明 |
| :--- | :--- | :--- | :--- |
| 获取器材列表 | GET | `/api/equipments` | 返回器材列表（支持分页、名称搜索） |
| 添加器材 | POST | `/api/equipments` | 新增器材定义及初始库存 |
| 器材详情 | GET | `/api/equipments/{id}` | 查看单个器材详情（含当前可用库存） |
| 修改器材 | PATCH | `/api/equipments/{id}` | 修改器材名称、描述、总库存等 |
| 删除器材 | DELETE | `/api/equipments/{id}` | 逻辑删除器材（需校验无进行中的借用） |

### 添加/修改器材 (请求体示例)
| 字段 | 类型 | 必填 | 说明 | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| name | string | 是 | 器材名称 | "数字万用表" |
| description| string | 否 | 规格型号/描述 | "UT61E, 精度0.05%" |
| total_stock | int | 是 | 总库存数量（修改时若变更，需同步调整 available_stock）| 50 |

---

## 器材使用

> **核心模块**：对应数据库 `borrow_order`, `borrow_order_item`, `return_record`。

| 功能 | 请求方法 | URL | 说明 |
| :--- | :--- | :--- | :--- |
| 申请借用 | POST | `/api/borrows` | 用户提交借用申请（支持多器材） |
| 获取借用列表 | GET | `/api/borrows` | 用户查自己的，管理员查所有的（支持状态筛选）|
| 借用详情 | GET | `/api/borrows/{id}` | 查看订单详情及**各器材的归还进度明细** |
| 审批借用 | PATCH | `/api/borrows/{id}/approve`| **管理员**审批通过，触发库存扣减 |
| 取消借用 | PATCH | `/api/borrows/{id}/cancel` | 用户取消待审批订单，或管理员驳回 |
| 登记归还 | POST | `/api/borrows/{id}/return` | **管理员**登记归还（核心：支持部分归还） |
| 作废归还记录 | POST | `/api/return-records/{id}/void`| **管理员**作废错误的归还流水（冲正机制） |

### 1. 申请借用 (`POST /api/borrows`)
| 字段 | 类型 | 必填 | 说明 | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| items | array | 是 | 借用的器材明细列表 | 见下方 |
| remark | string | 否 | 借用事由 | "物理实验使用" |

*`items` 数组元素结构：*
```json
[
  { "item_id": 101, "borrow_qty": 2 },
  { "item_id": 105, "borrow_qty": 1 }
]
```

### 2. 审批借用 (`PATCH /api/borrows/{id}/approve`)
| 字段 | 类型 | 必填 | 说明 | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| due_date | string | 是 | 预计应还时间 (ISO 8601格式) | "2026-10-01T18:00:00Z" |

### 3. 登记归还 (`POST /api/borrows/{id}/return`)
> **业务说明**：支持一次归还多种器材，或只归还某几种器材的部分数量。

| 字段 | 类型 | 必填 | 说明 | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| returns | array | 是 | 本次归还的明细列表 | 见下方 |

*`returns` 数组元素结构：*
```json
[
  { 
    "item_id": 101, 
    "return_qty": 1,       // 借了2个，本次先还1个（部分归还）
    "condition": 1         // 1-完好, 2-磨损, 3-损坏
  }
]
```

### 4. 作废归还记录 (`POST /api/return-records/{id}/void`)
> **业务说明**：管理员发现某条归还流水登记错误，执行逻辑作废。系统会自动回滚对应的库存和订单进度。

| 字段 | 类型 | 必填 | 说明 | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| reason | string | 是 | 作废原因（强制要求，用于审计） | "手滑多登了1个，实际只收了3个" |
