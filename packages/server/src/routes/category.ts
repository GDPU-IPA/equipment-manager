import express, { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../db.js';

const router: Router = express.Router();

// GET /api/categories
router.get('/', async (_req: Request, res: Response) => {
  const categories = await prisma.itemCategory.findMany({
    where: { status: 1 },
    orderBy: [{ parent_id: 'asc' }, { sort_order: 'asc' }],
    select: { id: true, parent_id: true, name: true, sort_order: true, icon: true },
  });
  res.json({ data: categories });
});

// GET /api/categories/:id
router.get('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ message: 'invalid_id' });
    return;
  }
  const category = await prisma.itemCategory.findUnique({ where: { id } });
  if (!category) {
    res.status(404).json({ message: 'category_not_found' });
    return;
  }
  res.json({ data: category });
});

export default router;