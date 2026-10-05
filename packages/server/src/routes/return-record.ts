import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../db.js';
import { requireAdmin } from '../auth/require-auth.js';
import type { AuthenticatedRequest } from '../auth/require-auth.js';
import { BorrowOperationError, lineStatus, orderStatus } from './borrow-state.js';

const router: Router = Router();

const parseId = (raw: unknown): number | null => {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

router.post('/:id/void', requireAdmin, async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const reason = typeof req.body?.void_reason === 'string' ? req.body.void_reason.trim() : '';
  if (id === null) {
    res.status(400).json({ code: 400, msg: 'invalid_id', data: null });
    return;
  }
  if (!reason || reason.length > 255) {
    res.status(400).json({ code: 400, msg: 'void_reason_is_required_and_must_be_at_most_255_characters', data: null });
    return;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const record = await tx.returnRecord.findUnique({ where: { id } });
      if (!record) throw new BorrowOperationError(404, 404, 'return_record_not_found');
      if (record.is_void !== 0) throw new BorrowOperationError(409, 409, 'return_record_already_void');

      const line = await tx.borrowOrderItem.findFirst({
        where: { order_id: record.order_id, item_id: record.item_id },
      });
      if (!line || line.returned_qty < record.return_qty) {
        throw new BorrowOperationError(409, 409, 'return_record_cannot_be_reversed');
      }

      if (record.item_condition !== 3) {
        const stock = await tx.item.updateMany({
          where: { id: record.item_id, available_stock: { gte: record.return_qty } },
          data: { available_stock: { decrement: record.return_qty } },
        });
        if (stock.count === 0) {
          throw new BorrowOperationError(409, 409, 'returned_equipment_is_already_borrowed');
        }
      }

      const changedRecord = await tx.returnRecord.updateMany({
        where: { id, is_void: 0 },
        data: {
          is_void: 1,
          void_at: new Date(),
          void_by: Number((req as AuthenticatedRequest).user.sub),
          void_reason: reason,
        },
      });
      if (changedRecord.count === 0) throw new BorrowOperationError(409, 409, 'return_record_already_void');

      const changedLine = await tx.borrowOrderItem.updateMany({
        where: { id: line.id, returned_qty: { gte: record.return_qty } },
        data: { returned_qty: { decrement: record.return_qty } },
      });
      if (changedLine.count === 0) throw new BorrowOperationError(409, 409, 'return_record_cannot_be_reversed');

      const lines = await tx.borrowOrderItem.findMany({ where: { order_id: record.order_id } });
      const damagedReturns = await tx.returnRecord.findMany({
        where: { order_id: record.order_id, is_void: 0, item_condition: 3 },
        select: { item_id: true },
      });
      const damagedItemIds = new Set(damagedReturns.map((activeRecord) => activeRecord.item_id));
      for (const item of lines) {
        await tx.borrowOrderItem.update({
          where: { id: item.id },
          data: { status: lineStatus(item, damagedItemIds.has(item.item_id)) },
        });
      }
      await tx.borrowOrder.update({
        where: { id: record.order_id },
        data: { status: orderStatus(lines) },
      });

      return tx.returnRecord.findUniqueOrThrow({
        where: { id },
        include: { admin: { select: { id: true, username: true } }, voided_by: { select: { id: true, username: true } } },
      });
    });
    res.json({ code: 200, msg: 'success', data: result });
  } catch (error) {
    if (error instanceof BorrowOperationError) {
      res.status(error.statusCode).json({ code: error.responseCode, msg: error.message, data: null });
      return;
    }
    throw error;
  }
});

export default router;
