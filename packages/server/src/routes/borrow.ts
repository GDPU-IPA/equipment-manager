import express, { Router } from 'express';
import type { Request, Response } from 'express';
import type { Prisma } from '../db.js';
import { prisma } from '../db.js';

const router: Router = express.Router();

// GET /api/borrows?page=1&pageSize=20&status=1
router.get('/', async (req: Request, res: Response) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 20, 1), 100);

  const status = Number(req.query.status);
  const where: Prisma.BorrowOrderItemWhereInput = {
    ...(Number.isInteger(status) ? { status } : {}),
  };

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

export default router;
