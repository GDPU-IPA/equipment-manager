# API 接口文档

> **全局约定**：
> 1. 除登录、注册外，所有接口需在 HTTP Header 中携带 `Authorization: Bearer <token>`。
> 2. 统一响应格式：`{ "code": 200, "msg": "success", "data": { ... } }`。下文表格仅列出 `data` 内部的核心字段。
> 3. **时间格式**：所有 `DATETIME` 类型字段统一返回格式为 `yyyy-mm-dd hh:mm:ss.xxxxxx` (如: `2026-09-20 14:30:00.000000`)，前端请求时若传字符串需符合 ISO 8601 或该格式。

## 目录
- [用户管理](#用户管理)
- [器材分类管理](#器材分类管理)
- [器材管理](#器材管理)
- [器材借用与归还](#器材借用与归还)

---

## 用户管理

| 功能 | 请求方法 | URL | 说明 |
| :--- | :--- | :--- | :--- |
| 注册 | POST | `/api/users` | 注册账号（默认角色为 `student` 或 `user`） |
| 登录 | POST | `/api/session` | 验证账号密码，返回 Token |
| 登出 | POST | `/api/sessions/current` | 清除当前 Token（服务端配合黑名单） |
| 当前用户信息 | GET | `/api/users/me` | 返回当前登录用户详细信息 |
| 修改密码 | POST | `/api/users/me/password` | 用户修改自己的密码 |
| 重置密码(管理员)| POST | `/api/users/{id}/password`| 管理员重置指定用户的密码 |
| 用户列表 | GET | `/api/users` | 管理员获取用户列表（支持分页/角色/状态筛选） |

### 1. 注册
| 字段 | 类型 | 必填 | 说明 | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| username | string | 是 | 登录账号（学号/工号），全局唯一 | "20230001" |
| password | string | 是 | 密码（后端需校验复杂度并哈希存储）| "Pass@1234" |
| profile | object | 是 | 附加信息，结构见下方 | 见下方 |

*`profile` 对象结构：*
```json
{
  "name": "张三",
  "grade": "2023级",
  "class_name": "计算机科学与技术1班",
  "phone": "13800138000",
  "email": "zhangsan@example.com"
}
```

### 2. 登录
| 字段 | 类型 | 必填 | 说明 | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| username | string | 是 | 登录账号（学号/工号） | "20230001" |
| password | string | 是 | 密码 | "Pass@1234" |

#### 响应字段 (data)
| 字段 | 类型 | 说明 | 示例 |
| :--- | :--- | :--- | :--- |
| token | string | JWT 或 Session Token，用于后续鉴权 | "eyJhbGciOiJI..." |
| role | string | 用户角色（`student`, `teacher`, `admin`） | "student" |

### 3. 当前用户信息 (GET `/api/users/me`)
#### 响应字段 (data)
| 字段 | 类型 | 说明 | 示例 |
| :--- | :--- | :--- | :--- |
| id | int | 用户唯一标识 | 1001 |
| username | string | 学号/账号 | "20230001" |
| role | string | 角色 | "student" |
| profile | object | 附加信息（同注册时的 profile 结构） | `{ "name": "张三", ... }` |
| status | int | 状态：1-正常，0-禁用，2-锁定 | 1 |

---

## 器材分类管理

> **注**：此模块对应数据库 `item_category` 表，用于构建树形分类结构。

| 功能 | 请求方法 | URL | 说明 |
| :--- | :--- | :--- | :--- |
| 获取分类列表 | GET | `/api/categories` | 返回所有启用的分类（通常按树形结构返回） |
| 添加分类 | POST | `/api/categories` | 新增分类（需管理员权限） |
| 修改分类 | PATCH | `/api/categories/{id}` | 修改分类名称、排序、图标等 |
| 停用/启用分类 | PATCH | `/api/categories/{id}/status`| 修改分类状态（1-启用，0-禁用） |

### 添加/修改分类 (请求体示例)
| 字段 | 类型 | 必填 | 说明 | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| parent_id | int | 是 | 父分类ID，`0` 表示顶级分类 | 0 |
| name | string | 是 | 分类名称（同一父分类下不可重复） | "电子测量仪器" |
| sort_order | int | 否 | 排序权重，数值越小越靠前 | 10 |
| icon | string | 否 | 分类图标（URL 或 class 名） | "icon-electronic" |

---

## 器材管理

> **注**：此模块对应数据库 `item` 表。

| 功能 | 请求方法 | URL | 说明 |
| :--- | :--- | :--- | :--- |
| 获取器材列表 | GET | `/api/equipments` | 返回器材列表（支持分页、名称搜索、分类筛选） |
| 添加器材 | POST | `/api/equipments` | 新增器材定义及初始库存 |
| 器材详情 | GET | `/api/equipments/{id}` | 查看单个器材详情（含当前可用库存） |
| 修改器材 | PATCH | `/api/equipments/{id}` | 修改器材名称、描述、库存等 |
| 停用/启用器材 | PATCH | `/api/equipments/{id}/status`| 修改器材状态（1-正常，0-报废/停用） |

### 添加/修改器材 (请求体示例)
| 字段 | 类型 | 必填 | 说明 | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| name | string | 是 | 器材名称 | "数字万用表" |
| category_id | int | 是 | 关联的分类ID (`item_category.id`) | 5 |
| description| string | 否 | 规格型号/详细描述 | "UT61E, 精度0.05%" |
| total_stock | int | 是 | 总库存数量（物理总数） | 50 |
| available_stock| int | 否 | 当前可用库存（新增时若不传，默认等于 `total_stock`）| 50 |
| status | int | 否 | 状态：1-正常，0-报废/停用（默认1） | 1 |

---

## 器材借用与归还

> **核心模块**：对应数据库 `borrow_order`, `borrow_order_item`, `return_record`。
> **状态机约束**：订单状态由系统根据数量关系自动计算，严禁前端直接传入状态值。

| 功能 | 请求方法 | URL | 说明 |
| :--- | :--- | :--- | :--- |
| 申请借用 | POST | `/api/borrows` | 用户提交借用申请（支持多器材） |
| 获取借用列表 | GET | `/api/borrows` | 用户查自己的，管理员查所有的（支持状态筛选）|
| 借用详情 | GET | `/api/borrows/{id}` | 查看订单详情、**各器材的归还进度明细**及归还流水 |
| 审批借用 | PATCH | `/api/borrows/{id}/approve`| **管理员**审批通过，触发库存扣减与状态变更 |
| 取消/驳回借用 | PATCH | `/api/borrows/{id}/cancel` | 用户取消待审批订单，或管理员驳回 |
| 登记归还 | POST | `/api/borrows/{id}/return` | **管理员**登记归还（核心：支持部分归还） |
| 作废归还记录 | POST | `/api/return-records/{id}/void`| **管理员**作废错误的归还流水（触发冲正机制） |

### 1. 申请借用 (`POST /api/borrows`)
| 字段 | 类型 | 必填 | 说明 | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| items | array | 是 | 借用的器材明细列表 | 见下方 |
| remark | string | 否 | 订单级备注/借用事由 | "物理实验使用" |

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
| due_date | string | 是 | 预计应还时间 (ISO 8601 或 `yyyy-mm-dd hh:mm:ss`) | "2026-10-01 18:00:00" |

### 3. 借用详情 (`GET /api/borrows/{id}`)
#### 响应字段 (data)
| 字段 | 类型 | 说明 | 示例 |
| :--- | :--- | :--- | :--- |
| id | int | 订单ID | 1001 |
| user_info | object | 借用人信息 (含 username, profile.name) | `{ "username": "20230001", "name": "张三" }` |
| admin_info | object | 审批管理员信息 (若已审批) | `{ "username": "admin01", "name": "李四" }` |
| submit_at | string | 提交申请时间 | "2026-09-20 10:00:00.000000" |
| confirm_at | string | 审批时间 (未审批则为 null) | "2026-09-20 14:30:00.000000" |
| due_date | string | 应还时间 | "2026-10-01 18:00:00.000000" |
| status | int | 订单状态：0-待审批, 1-借用中, 2-部分归还, 3-已结清, 4-已取消 | 1 |
| items | array | **订单明细列表** (见下方) | - |

*`items` 明细数组元素结构：*
```json
{
  "id": 501,
  "item_id": 101,
  "item_name": "数字万用表",
  "borrow_qty": 2,
  "returned_qty": 1,
  "status": 1, 
  "status_text": "未还完" 
}
```
*(注：明细 status: 1-未还完, 2-已还清, 3-损坏/遗失)*

### 4. 登记归还 (`POST /api/borrows/{id}/return`)
> **业务说明**：支持一次归还多种器材，或只归还某几种器材的部分数量。后端将自动累加 `returned_qty`，恢复 `available_stock`，并重算订单及明细状态。

| 字段 | 类型 | 必填 | 说明 | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| returns | array | 是 | 本次归还的明细列表 | 见下方 |

*`returns` 数组元素结构：*
```json
[
  { 
    "item_id": 101, 
    "return_qty": 1,             // 本次归还数量 (需 <= borrow_qty - returned_qty)
    "item_condition": 1,         // 归还时物料状态：1-完好, 2-磨损, 3-损坏
    "remark": "边角有轻微划痕"      // 归还备注 (可选)
  }
]
```

### 5. 作废归还记录 (`POST /api/return-records/{id}/void`)
> **业务说明**：管理员发现某条归还流水登记错误，执行逻辑作废。系统会自动回滚对应的 `returned_qty` 和 `available_stock`，并重算订单状态。原记录不可物理删除。

| 字段 | 类型 | 必填 | 说明 | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| void_reason | string | 是 | 作废原因（强制要求，用于审计） | "手滑多登了1个，实际只收了3个" |

---

### 核心状态码字典
**借用订单状态 (`borrow_order.status`)**
- `0`: 待审批
- `1`: 借用中
- `2`: 部分归还
- `3`: 已结清 (终态)
- `4`: 已取消 (终态)

**订单明细状态 (`borrow_order_item.status`)**
- `1`: 未还完
- `2`: 已还清
- `3`: 损坏/遗失 (终态，需触发赔偿流程)

**归还物料状态 (`return_record.item_condition`)**
- `1`: 完好
- `2`: 磨损
- `3`: 损坏