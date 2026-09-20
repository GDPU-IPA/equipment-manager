# 数据库设计文档
---

## 1. 整体架构与 ER 关系简述

系统核心围绕 **“订单（Order）”** 展开，采用**主表-明细表-流水表** 三层架构：

```text
[用户表 sys_user] 1 ──── N [借用订单主表 borrow_orders] 1 ──── N [借用订单明细表 borrow_order_items] N ──── 1 [物料表 items]
                              │                                      │
                              │                                      │ (每次归还产生一条)
                              └──────────── 1 ──── N [归还流水表 return_records] ──────────┘
```
---

### 1.1 用户表 (`sys_user`)
存储系统所有用户，通过 `role` 区分角色。

| 字段名 | 数据类型 | 约束/键 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| **id** | BIGINT | PK, Auto Inc | - | 用户唯一标识 |
| username | VARCHAR(50) | NOT NULL, Unique | - | 登录账号/姓名 |
| role | VARCHAR(50) | NOT NULL | 'user' | 角色（student, teacher, admin） |
| password_hash| VARCHAR(255) | NOT NULL | - | 密码哈希值 |
| profile | JSON | NULL | NULL | 附加信息（手机号、邮箱等） |
| status | TINYINT | NOT NULL | 1 | 状态：1-正常，0-禁用，2-锁定 |
| created_at | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

### 1.2 物料表 (`item`)
存储物料的抽象定义和全局库存。

| 字段名 | 数据类型 | 约束/键 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| **id** | BIGINT | PK, Auto Inc | - | 物料唯一标识 |
| name | VARCHAR(100) | NOT NULL | - | 物料名称 |
| description | TEXT | NULL | NULL | 规格型号/详细描述 |
| total_stock | INT | NOT NULL | 0 | 总库存数量（物理总数） |
| available_stock| INT | NOT NULL | 0 | 当前可用库存 |
| status | TINYINT | NOT NULL | 1 | 状态：1-正常，0-报废/停用 |
| created_at | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

### 1.3 借用订单主表 (`borrow_order`)
记录借用行为的宏观信息。

| 字段名 | 数据类型 | 约束/键 (含外键命名) | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| **id** | BIGINT | PK, Auto Inc | - | 订单唯一标识 |
| user_id | BIGINT | **FK (`fk_borrow_order_user_id`)**<br>NOT NULL | - | 借用人（关联 `sys_user.id`） |
| admin_id | BIGINT | **FK (`fk_borrow_order_admin_id`)**<br>NULL | NULL | 审批管理员（关联 `sys_user.id`） |
| submit_at | DATETIME | NOT NULL | - | 用户提交申请时间 |
| confirm_at | DATETIME | NULL | NULL | 管理员确认/审批时间 |
| due_date | DATETIME | NULL | NULL | 应还时间（用于计算逾期） |
| status | TINYINT | NOT NULL | 0 | 状态：0-待审批, 1-借用中, 2-部分归还, 3-已结清, 4-已取消 |
| remark | VARCHAR(255) | NULL | NULL | 订单级备注 |
| created_at | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

### 1.4 借用订单明细表 (`borrow_order_item`)
记录该订单具体借了哪些物料，及每种物料的归还进度。

| 字段名 | 数据类型 | 约束/键 (含外键命名) | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| **id** | BIGINT | PK, Auto Inc | - | 明细行唯一标识 |
| order_id | BIGINT | **FK (`fk_order_item_order_id`)**<br>NOT NULL | - | 关联订单主表 |
| item_id | BIGINT | **FK (`fk_order_item_item_id`)**<br>NOT NULL | - | 关联物料表 |
| borrow_qty | INT | NOT NULL | - | **借出数量**（创建后不可改） |
| returned_qty | INT | NOT NULL | 0 | **已归还数量**（每次有效归还累加） |
| status | TINYINT | NOT NULL | 1 | 行项状态：1-未还完, 2-已还清, 3-损坏/遗失 |
| created_at | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

### 1.5 归还流水表 (`return_record`) 

| 字段名 | 数据类型 | 约束/键 (含外键命名) | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| **id** | BIGINT | PK, Auto Inc | - | 流水唯一标识 |
| order_id | BIGINT | **FK (`fk_return_record_order_id`)**<br>NOT NULL | - | 关联订单主表 |
| item_id | BIGINT | **FK (`fk_return_record_item_id`)**<br>NOT NULL | - | 关联物料表 |
| return_qty | INT | NOT NULL | - | **本次归还数量** |
| return_at | DATETIME | NOT NULL | CURRENT_TIMESTAMP| 实际归还时间 |
| admin_id | BIGINT | **FK (`fk_return_record_admin_id`)**<br>NOT NULL | - | 接收归还的管理员 |
| item_condition | TINYINT | NOT NULL | 1 | 归还时物料状态：1-完好, 2-磨损, 3-损坏 |
| remark | VARCHAR(255) | NULL | NULL | 归还备注 |
| created_at | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 记录创建时间 |
| **is_void** | TINYINT | NOT NULL | 0 | **是否作废：0-有效，1-已作废** |
| **void_at** | DATETIME | NULL | NULL | **作废时间** |
| **void_by** | BIGINT | **FK (`fk_return_record_void_by`)**<br>NULL | NULL | **作废操作人（关联 `sys_user.id`）** |
| **void_reason**| VARCHAR(255)| NULL | NULL | **作废原因（必填，用于审计）** |

## 数据流转说明

## 1. 核心实体与数据流向概述

系统数据流转围绕 **借用订单 (`borrow_order`)** 展开，向下拆解为 **订单明细 (`borrow_order_item`)**，并在归还环节衍生出 **归还流水 (`return_record`)**。

*   **库存控制核心**：`item.available_stock`（可用库存）是借还流转的唯一校验与变更基准，`item.total_stock`（物理总库存）仅用于资产统计，不参与日常流转。
*   **状态驱动**：订单及明细的状态 (`status`) 由系统根据数量关系（借出量 vs 归还量）自动计算并更新，严禁业务代码直接硬编码修改状态。

---

## 2. 核心业务场景数据流转

### 2.1 场景一：借用申请与审批出库

**业务描述**：用户发起借用申请，管理员审核通过后，系统锁定并扣减相应库存。

**数据流转步骤**：
1. **创建订单主表**：向 `borrow_order` 插入记录，初始化 `status = 0` (待审批)，记录 `submit_at`。
2. **创建订单明细**：向 `borrow_order_item` 批量插入记录，初始化 `borrow_qty` 为申请数量，`returned_qty = 0`，`status = 1` (未还完)。
3. **审批与库存扣减（事务操作）**：
   * 更新 `borrow_order`：填充 `admin_id`, `confirm_at`, `due_date`，将 `status` 更新为 `1` (借用中)。
   * **库存校验与扣减**：遍历 `borrow_order_item`，对 `item` 表执行原子更新：
     ```sql
     UPDATE item 
     SET available_stock = available_stock - #{borrow_qty} 
     WHERE id = #{item_id} AND available_stock >= #{borrow_qty};
     ```
     *(注：若影响行数 `affected_rows = 0`，则触发库存不足异常，事务回滚。)*

### 2.2 场景二：正常归还（支持部分/全部归还）

**业务描述**：用户归还物料，管理员核对数量与状态后，系统登记归还流水并恢复库存。

**数据流转步骤**：
1. **创建归还流水**：向 `return_record` 插入记录，记录 `return_qty`, `return_at`, `admin_id`, `item_condition`，初始化 `is_void = 0` (有效)。
2. **更新明细进度**：累加 `borrow_order_item.returned_qty`：
   ```sql
   UPDATE borrow_order_item 
   SET returned_qty = returned_qty + #{return_qty} 
   WHERE order_id = #{order_id} AND item_id = #{item_id};
   ```
3. **恢复可用库存**：对 `item` 表执行原子更新：
   ```sql
   UPDATE item SET available_stock = available_stock + #{return_qty} WHERE id = #{item_id};
   ```
4. **状态自动重算**：
   * **明细状态**：查询更新后的 `borrow_order_item`，若 `returned_qty == borrow_qty`，则将其 `status` 更新为 `2` (已还清)。
   * **主表状态**：查询该 `order_id` 下的所有明细。若所有明细 `status = 2`，则将 `borrow_order.status` 更新为 `3` (已结清)；若存在 `returned_qty < borrow_qty` 的明细，则将其更新为 `2` (部分归还)。

### 2.3 场景三：归还流水冲正/作废（核心纠错机制）

**业务描述**：管理员发现历史归还登记数据有误（如数量登错、状态选错），执行作废操作。系统严禁物理删除或直接修改原流水的核心数量字段，必须采用逻辑冲正。

**数据流转步骤**：
1. **前置校验**：查询目标 `return_record`，确认其 `is_void = 0` (处于有效状态)。
2. **执行逻辑作废**：更新目标流水记录，标记作废信息：
   ```sql
   UPDATE return_record 
   SET is_void = 1, void_at = NOW(), void_by = #{admin_id}, void_reason = #{reason}
   WHERE id = #{record_id} AND is_void = 0;
   ```
3. **回滚明细数据**：扣减之前错误累加的 `returned_qty`：
   ```sql
   UPDATE borrow_order_item 
   SET returned_qty = returned_qty - #{原return_qty} 
   WHERE order_id = #{order_id} AND item_id = #{item_id};
   ```
   *(注：回滚后，需重新判断该明细状态。若 `returned_qty < borrow_qty`，必须将其 `status` 从 `2` (已还清) 重置回 `1` (未还完)。)*
4. **回滚可用库存**：扣减之前错误增加的库存：
   ```sql
   UPDATE item SET available_stock = available_stock - #{原return_qty} WHERE id = #{item_id};
   ```
5. **订单状态重算**：同场景 2.2 的步骤 4，根据回滚后的明细数据，重新计算并更新 `borrow_order.status`。

---

## 3. 状态机定义 (State Machine)

系统状态流转必须严格遵循以下状态机规则，禁止越级或逆向流转（除冲正机制触发的自动回退外）。

### 3.1 借用订单状态 (`borrow_order.status`)

| 状态码 | 状态名称 | 触发条件 / 允许流转至 |
| :--- | :--- | :--- |
| **0** | 待审批 | 初始状态。可流转至 **1** (审批通过) 或 **4** (用户取消/管理员驳回)。 |
| **1** | 借用中 | 审批通过后进入。当存在未还清明细时保持此状态；当所有明细还清时流转至 **3**。 |
| **2** | 部分归还 | 当至少有一项明细 `returned_qty > 0` 且 `returned_qty < borrow_qty` 时进入。可流转至 **3**。 |
| **3** | 已结清 | 终态。当该订单下所有明细的 `returned_qty == borrow_qty` 时进入。不可再流转。 |
| **4** | 已取消 | 终态。审批前取消或驳回。不可再流转。 |

### 3.2 订单明细状态 (`borrow_order_item.status`)

| 状态码 | 状态名称 | 触发条件 / 允许流转至 |
| :--- | :--- | :--- |
| **1** | 未还完 | 初始状态。当 `returned_qty > 0` 且 `< borrow_qty` 时保持此状态。 |
| **2** | 已还清 | 当 `returned_qty == borrow_qty` 时进入。若发生冲正导致数量回退，需重置为 **1**。 |
| **3** | 损坏/遗失 | 终态。归还时管理员判定物料损坏或确认遗失，需触发赔偿流程。不可再流转。 |

---

## 4. 事务与并发控制规范

为保障数据一致性（ACID），后端服务在执行以下操作时，必须严格遵循事务控制规范：

### 4.1 事务边界划分
以下三个业务动作必须包裹在**单一的数据库事务**中，确保“要么全部成功，要么全部回滚”：
1. **审批出库**：更新订单状态 + 扣减可用库存。
2. **归还登记**：插入归还流水 + 更新明细进度 + 恢复可用库存 + 重算订单状态。
3. **冲正作废**：标记流水作废 + 回滚明细进度 + 回滚可用库存 + 重算订单状态。

### 4.2 并发控制与防超卖
*   **库存扣减**：必须使用数据库层面的原子更新（`SET available_stock = available_stock - X WHERE ... >= X`），严禁在应用层先 `SELECT` 读取库存，计算后再 `UPDATE`，以防止并发超卖。
*   **流水作废**：在更新 `is_void` 状态时，必须在 `WHERE` 条件中带上 `is_void = 0`，利用数据库的行锁防止同一笔流水被并发重复作废。

### 4.3 查询规范
*   在所有涉及“当前有效归还总数”、“当前可用库存统计”的查询中，针对 `return_record` 表的查询**必须**包含过滤条件 `WHERE is_void = 0`，以排除已作废的脏数据。