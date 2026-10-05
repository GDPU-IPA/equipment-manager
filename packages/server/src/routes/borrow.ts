import express, { Router } from 'express';
import type { Request, Response } from 'express';
import type { Prisma as PrismaTypes } from '../db.js';
import { prisma } from '../db.js';
import { requireAdmin } from '../auth/require-auth.js';
import type { AuthenticatedRequest } from '../auth/require-auth.js';
import { BorrowOperationError, lineStatus, orderStatus } from './borrow-state.js';

const router: Router = express.Router();

const parseId = (raw: unknown): number | null => {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

function currentUserId(req: Request): number {
  return Number((req as AuthenticatedRequest).user.sub);
}

function sendOperationError(res: Response, error: unknown): boolean {
  if (!(error instanceof BorrowOperationError)) return false;
  res.status(error.statusCode).json({
    code: error.responseCode,
    msg: error.message,
    data: null,
  });
  return true;
}

function validateItemList(items: unknown): items is Array<{ item_id: number; borrow_qty: number }> {
  if (!Array.isArray(items) || items.length === 0) return false;
  const seen = new Set<number>();
  for (const item of items) {
    if (!item || !Number.isInteger(item.item_id) || item.item_id <= 0
      || !Number.isInteger(item.borrow_qty) || item.borrow_qty <= 0
      || seen.has(item.item_id)) return false;
    seen.add(item.item_id);
  }
  return true;
}

function validateReturns(returns: unknown): returns is Array<{
  item_id: number;
  return_qty: number;
  item_condition: number;
  remark?: string;
}> {
  if (!Array.isArray(returns) || returns.length === 0) return false;
  const seen = new Set<number>();
  for (const item of returns) {
    if (!item || !Number.isInteger(item.item_id) || item.item_id <= 0
      || !Number.isInteger(item.return_qty) || item.return_qty <= 0
      || ![1, 2, 3].includes(item.item_condition)
      || (item.remark !== undefined && typeof item.remark !== 'string')
      || seen.has(item.item_id)) return false;
    seen.add(item.item_id);
  }
  return true;
}

// GET /api/borrows?page=1&pageSize=20&status=1
router.get('/', async (req: Request, res: Response) => {
  const page = Math.max(Math.floor(Number(req.query.page)) || 1, 1);
  const pageSize = Math.min(Math.max(Math.floor(Number(req.query.pageSize)) || 20, 1), 100);
  const status = req.query.status === undefined ? null : Number(req.query.status);
  if (status !== null && ![0, 1, 2, 3, 4].includes(status)) {
    res.status(400).json({ code: 400, msg: 'invalid_borrow_status', data: null });
    return;
  }

  const user = (req as AuthenticatedRequest).user;
  const orderWhere: PrismaTypes.BorrowOrderWhereInput = {
    ...(status !== null ? { status } : {}),
    ...(user.role === 'admin' ? {} : { user_id: Number(user.sub) }),
  };
  const where: PrismaTypes.BorrowOrderItemWhereInput = { order: { is: orderWhere } };
  const [total, list] = await prisma.$transaction([
    prisma.borrowOrderItem.count({ where }),
    prisma.borrowOrderItem.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { id: 'desc' },
      include: {
        order: { select: { id: true, status: true, due_date: true } },
        item: { select: { id: true, name: true } },
      },
    }),
  ]);
  res.json({ code: 200, msg: 'success', data: { list, page, pageSize, total } });
});

// POST /api/borrows
router.post('/', async (req: Request, res: Response) => {
  const { items, remark } = req.body ?? {};
  if (!validateItemList(items)) {
    res.status(400).json({ code: 400, msg: 'items_must_contain_unique_positive_quantities', data: null });
    return;
  }
  if (remark !== undefined && (typeof remark !== 'string' || remark.length > 255)) {
    res.status(400).json({ code: 400, msg: 'remark_must_be_at_most_255_characters', data: null });
    return;
  }

  const requestedIds = items.map((item) => item.item_id);
  const equipment = await prisma.item.findMany({
    where: { id: { in: requestedIds } },
    select: { id: true, name: true, status: true, available_stock: true },
  });
  const byId = new Map(equipment.map((item) => [item.id, item]));
  for (const requested of items) {
    const item = byId.get(requested.item_id);
    if (!item || item.status !== 1) {
      res.status(400).json({ code: 400, msg: 'equipment_not_available', data: { item_id: requested.item_id } });
      return;
    }
    if (item.available_stock < requested.borrow_qty) {
      res.status(409).json({ code: 409, msg: 'insufficient_available_stock', data: { item_id: item.id } });
      return;
    }
  }

  const created = await prisma.borrowOrder.create({
    data: {
      user_id: currentUserId(req),
      submit_at: new Date(),
      status: 0,
      remark: remark?.trim() || null,
      order_items: {
        create: items.map((item) => ({
          item_id: item.item_id,
          borrow_qty: item.borrow_qty,
        })),
      },
    },
    include: {
      order_items: { include: { item: { select: { id: true, name: true } } } },
    },
  });
  res.status(201).json({ code: 201, msg: 'success', data: created });
});

// GET /api/borrows/:id
router.get('/:id', async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ code: 400, msg: 'invalid_id', data: null });
    return;
  }
  const user = (req as AuthenticatedRequest).user;
  const borrow = await prisma.borrowOrder.findUnique({
    where: { id },
    include: {
      user: { select: { username: true, profile: true } },
      admin: { select: { username: true, profile: true } },
      order_items: {
        include: {
          item: { select: { id: true, name: true } },
        },
        orderBy: { id: 'asc' },
      },
      return_records: {
        orderBy: { id: 'asc' },
        include: {
          admin: { select: { id: true, username: true } },
          voided_by: { select: { id: true, username: true } },
        },
      },
    },
  });
  if (!borrow) {
    res.status(404).json({ code: 404, msg: 'borrow_not_found', data: null });
    return;
  }
  if (user.role !== 'admin' && borrow.user_id !== Number(user.sub)) {
    res.status(403).json({ code: 403, msg: 'borrow_access_denied', data: null });
    return;
  }

  const damagedItemIds = new Set(
    borrow.return_records
      .filter((record) => record.is_void === 0 && record.item_condition === 3)
      .map((record) => record.item_id),
  );
  res.json({
    code: 200,
    msg: 'success',
    data: {
      ...borrow,
      user_info: {
        ...borrow.user,
        name: typeof borrow.user.profile === 'object' && borrow.user.profile !== null
          && 'name' in borrow.user.profile ? borrow.user.profile.name : null,
      },
      admin_info: borrow.admin ? {
        ...borrow.admin,
        name: typeof borrow.admin.profile === 'object' && borrow.admin.profile !== null
          && 'name' in borrow.admin.profile ? borrow.admin.profile.name : null,
      } : null,
      items: borrow.order_items.map(({ item, ...line }) => ({
        ...line,
        item_id: item.id,
        item_name: item.name,
        status: lineStatus(line, damagedItemIds.has(item.id)),
        status_text: lineStatus(line, damagedItemIds.has(item.id)) === 1
          ? '未还完'
          : lineStatus(line, damagedItemIds.has(item.id)) === 2 ? '已还清' : '损坏/遗失',
      })),
    },
  });
});

// PATCH /api/borrows/:id/approve
router.patch('/:id/approve', requireAdmin, async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const dueDateValue = req.body?.due_date;
  if (id === null) {
    res.status(400).json({ code: 400, msg: 'invalid_id', data: null });
    return;
  }
  if (typeof dueDateValue !== 'string' || !dueDateValue.trim()) {
    res.status(400).json({ code: 400, msg: 'due_date_is_required', data: null });
    return;
  }
  const dueDate = new Date(dueDateValue);
  if (Number.isNaN(dueDate.getTime())) {
    res.status(400).json({ code: 400, msg: 'invalid_due_date', data: null });
    return;
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const order = await tx.borrowOrder.findUnique({
        where: { id },
        include: { order_items: true },
      });
      if (!order) throw new BorrowOperationError(404, 404, 'borrow_not_found');
      if (order.status !== 0) throw new BorrowOperationError(409, 409, 'borrow_is_not_pending');

      for (const line of order.order_items) {
        const stock = await tx.item.updateMany({
          where: { id: line.item_id, status: 1, available_stock: { gte: line.borrow_qty } },
          data: { available_stock: { decrement: line.borrow_qty } },
        });
        if (stock.count === 0) {
          throw new BorrowOperationError(409, 409, 'insufficient_available_stock');
        }
      }

      const changed = await tx.borrowOrder.updateMany({
        where: { id, status: 0 },
        data: {
          admin_id: currentUserId(req),
          confirm_at: new Date(),
          due_date: dueDate,
          status: 1,
        },
      });
      if (changed.count === 0) throw new BorrowOperationError(409, 409, 'borrow_is_not_pending');
      return tx.borrowOrder.findUniqueOrThrow({
        where: { id },
        include: { order_items: { include: { item: { select: { id: true, name: true } } } } },
      });
    });
    res.json({ code: 200, msg: 'success', data: updated });
  } catch (error) {
    if (sendOperationError(res, error)) return;
    throw error;
  }
});

// PATCH /api/borrows/:id/cancel
router.patch('/:id/cancel', async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ code: 400, msg: 'invalid_id', data: null });
    return;
  }
  const user = (req as AuthenticatedRequest).user;
  const order = await prisma.borrowOrder.findUnique({ where: { id }, select: { id: true, user_id: true, status: true } });
  if (!order) {
    res.status(404).json({ code: 404, msg: 'borrow_not_found', data: null });
    return;
  }
  if (user.role !== 'admin' && order.user_id !== Number(user.sub)) {
    res.status(403).json({ code: 403, msg: 'borrow_access_denied', data: null });
    return;
  }
  if (order.status !== 0) {
    res.status(409).json({ code: 409, msg: 'only_pending_borrows_can_be_cancelled', data: null });
    return;
  }

  const result = await prisma.borrowOrder.updateMany({
    where: { id, status: 0 },
    data: { status: 4 },
  });
  if (result.count === 0) {
    res.status(409).json({ code: 409, msg: 'borrow_is_not_pending', data: null });
    return;
  }
  res.json({ code: 200, msg: 'success', data: { id, status: 4 } });
});

// POST /api/borrows/:id/return
router.post('/:id/return', requireAdmin, async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const { returns } = req.body ?? {};
  if (id === null) {
    res.status(400).json({ code: 400, msg: 'invalid_id', data: null });
    return;
  }
  if (!validateReturns(returns)) {
    res.status(400).json({ code: 400, msg: 'returns_must_contain_unique_positive_quantities_and_valid_conditions', data: null });
    return;
  }
  if (returns.some((item) => item.remark && item.remark.length > 255)) {
    res.status(400).json({ code: 400, msg: 'remark_must_be_at_most_255_characters', data: null });
    return;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.borrowOrder.findUnique({
        where: { id },
        include: { order_items: true },
      });
      if (!order) throw new BorrowOperationError(404, 404, 'borrow_not_found');
      if (order.status !== 1 && order.status !== 2) {
        throw new BorrowOperationError(409, 409, 'borrow_is_not_active');
      }

      for (const entry of returns) {
        const line = order.order_items.find((item) => item.item_id === entry.item_id);
        if (!line) throw new BorrowOperationError(400, 400, 'equipment_is_not_in_borrow');
        if (line.borrow_qty - line.returned_qty < entry.return_qty) {
          throw new BorrowOperationError(409, 409, 'return_quantity_exceeds_unreturned_quantity');
        }

        const updatedLine = await tx.borrowOrderItem.updateMany({
          where: {
            id: line.id,
            returned_qty: { lte: line.borrow_qty - entry.return_qty },
          },
          data: { returned_qty: { increment: entry.return_qty } },
        });
        if (updatedLine.count === 0) {
          throw new BorrowOperationError(409, 409, 'return_quantity_exceeds_unreturned_quantity');
        }
        await tx.returnRecord.create({
          data: {
            order_id: id,
            item_id: entry.item_id,
            return_qty: entry.return_qty,
            admin_id: currentUserId(req),
            item_condition: entry.item_condition,
            remark: entry.remark?.trim() || null,
          },
        });
        if (entry.item_condition !== 3) {
          await tx.item.update({ where: { id: entry.item_id }, data: { available_stock: { increment: entry.return_qty } } });
        }
        line.returned_qty += entry.return_qty;
      }

      const updatedLines = await tx.borrowOrderItem.findMany({ where: { order_id: id } });
      const damagedReturns = await tx.returnRecord.findMany({
        where: { order_id: id, is_void: 0, item_condition: 3 },
        select: { item_id: true },
      });
      const damagedItemIds = new Set(damagedReturns.map((record) => record.item_id));
      for (const line of updatedLines) {
        await tx.borrowOrderItem.update({
          where: { id: line.id },
          data: { status: lineStatus(line, damagedItemIds.has(line.item_id)) },
        });
      }
      const updatedOrderStatus = orderStatus(updatedLines);
      await tx.borrowOrder.update({ where: { id }, data: { status: updatedOrderStatus } });
      return tx.borrowOrder.findUniqueOrThrow({
        where: { id },
        include: { order_items: { include: { item: { select: { id: true, name: true } } } } },
      });
    });
    res.json({ code: 200, msg: 'success', data: result });
  } catch (error) {
    if (sendOperationError(res, error)) return;
    throw error;
  }
});

export default router;
