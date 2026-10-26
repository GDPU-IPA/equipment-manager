export interface BorrowListItem {
  id: number
  order_id: number
  borrow_qty: number
  returned_qty: number
  created_at: string
  item: { id: number; name: string }
  order: { id: number; status: number; due_date: string | null }
}

export interface BorrowDetailItem {
  id: number
  item_id: number
  item_name: string
  borrow_qty: number
  returned_qty: number
  status: number
  status_text: string
}

export interface BorrowDetail {
  id: number
  status: number
  remark: string | null
  submit_at: string
  confirm_at: string | null
  due_date: string | null
  user_info: { username: string; name: string | null }
  admin_info: { username: string; name: string | null } | null
  items: BorrowDetailItem[]
  return_records: Array<{
    id: number
    item_id: number
    return_qty: number
    item_condition: number
    remark: string | null
    created_at: string
    is_void: number
  }>
}

export const borrowStatusLabels: Record<number, string> = {
  0: '待审批',
  1: '借用中',
  2: '部分归还',
  3: '已结清',
  4: '已取消',
}

export function borrowStatusLabel(status: number) {
  return borrowStatusLabels[status] ?? `状态 ${status}`
}

export function formatBorrowDate(value: string | null | undefined) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN')
}
