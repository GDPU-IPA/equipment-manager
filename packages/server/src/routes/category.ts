import express, { Router } from 'express';
import type { Request, Response } from 'express';
import type { Prisma } from '../db.js';
import { prisma } from '../db.js';

const router: Router = express.Router();

const categorySelect = {
  id: true,
  parent_id: true,
  name: true,
  sort_order: true,
  icon: true,
} satisfies Prisma.ItemCategorySelect;

// GET /api/categories
router.get('/', async (_req: Request, res: Response) => {
  const categories = await prisma.itemCategory.findMany({
    where: { status: 1 },
    orderBy: [{ parent_id: 'asc' }, { sort_order: 'asc' }],
    select: categorySelect,
  });
  res.json({ code: 200, msg: 'success', data: categories });
});

// GET /api/categories/:id
router.get('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ code: 400, msg: 'invalid_id', data: null });
    return;
  }
  const category = await prisma.itemCategory.findUnique({ where: { id }, select: categorySelect });
  if (!category) {
    res.status(404).json({ code: 404, msg: 'category_not_found', data: null });
    return;
  }
  res.json({ code: 200, msg: 'success', data: category });
});

export default router;
