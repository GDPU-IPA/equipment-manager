import express, { Router } from 'express';
import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import type { Prisma as PrismaTypes } from '../db.js';
import { prisma } from '../db.js';
import { requireAdmin } from '../auth/require-auth.js';

const router: Router = express.Router();

const categorySelect = {
  id: true,
  parent_id: true,
  name: true,
  sort_order: true,
  icon: true,
} satisfies PrismaTypes.ItemCategorySelect;

const parseId = (raw: unknown): number | null => {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

async function validateParent(parentId: number, categoryId?: number): Promise<boolean> {
  if (parentId === 0) return true;
  const seen = new Set<number>();
  let currentId: number | null = parentId;
  while (currentId !== null) {
    if (currentId === categoryId || seen.has(currentId)) return false;
    seen.add(currentId);
    const parent: { parent_id: number } | null = await prisma.itemCategory.findUnique({
      where: { id: currentId },
      select: { parent_id: true },
    });
    if (!parent) return false;
    currentId = parent.parent_id === 0 ? null : parent.parent_id;
  }
  return true;
}

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
  const id = parseId(req.params.id);
  if (id === null) {
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

router.post('/', requireAdmin, async (req: Request, res: Response) => {
  const { parent_id: parentId, name, sort_order: sortOrder, icon } = req.body ?? {};
  if (!Number.isInteger(parentId) || parentId < 0) {
    res.status(400).json({ code: 400, msg: 'parent_id_must_be_non_negative', data: null });
    return;
  }
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 50) {
    res.status(400).json({ code: 400, msg: 'name_is_required_or_too_long', data: null });
    return;
  }
  if (sortOrder !== undefined && !Number.isInteger(sortOrder)) {
    res.status(400).json({ code: 400, msg: 'sort_order_must_be_an_integer', data: null });
    return;
  }
  if (icon !== undefined && icon !== null && typeof icon !== 'string') {
    res.status(400).json({ code: 400, msg: 'icon_must_be_a_string_or_null', data: null });
    return;
  }
  if (!(await validateParent(parentId))) {
    res.status(400).json({ code: 400, msg: 'parent_category_not_found', data: null });
    return;
  }

  try {
    const category = await prisma.itemCategory.create({
      data: {
        parent_id: parentId,
        name: name.trim(),
        ...(sortOrder !== undefined ? { sort_order: sortOrder } : {}),
        ...(icon !== undefined ? { icon } : {}),
      },
      select: categorySelect,
    });
    res.status(201).json({ code: 201, msg: 'success', data: category });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json({ code: 409, msg: 'category_name_already_exists_under_parent', data: null });
      return;
    }
    throw error;
  }
});

router.patch('/:id/status', requireAdmin, async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const { status } = req.body ?? {};
  if (id === null) {
    res.status(400).json({ code: 400, msg: 'invalid_id', data: null });
    return;
  }
  if (status !== 0 && status !== 1) {
    res.status(400).json({ code: 400, msg: 'status_must_be_0_or_1', data: null });
    return;
  }

  const result = await prisma.itemCategory.updateMany({ where: { id }, data: { status } });
  if (result.count === 0) {
    res.status(404).json({ code: 404, msg: 'category_not_found', data: null });
    return;
  }
  res.json({ code: 200, msg: 'success', data: { id, status } });
});

router.patch('/:id', requireAdmin, async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const { parent_id: parentId, name, sort_order: sortOrder, icon } = req.body ?? {};
  if (id === null) {
    res.status(400).json({ code: 400, msg: 'invalid_id', data: null });
    return;
  }
  const current = await prisma.itemCategory.findUnique({ where: { id }, select: { id: true } });
  if (!current) {
    res.status(404).json({ code: 404, msg: 'category_not_found', data: null });
    return;
  }

  const data: PrismaTypes.ItemCategoryUpdateInput = {};
  if (parentId !== undefined) {
    if (!Number.isInteger(parentId) || parentId < 0 || !(await validateParent(parentId, id))) {
      res.status(400).json({ code: 400, msg: 'invalid_parent_category', data: null });
      return;
    }
    data.parent_id = parentId;
  }
  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 50) {
      res.status(400).json({ code: 400, msg: 'name_is_required_or_too_long', data: null });
      return;
    }
    data.name = name.trim();
  }
  if (sortOrder !== undefined) {
    if (!Number.isInteger(sortOrder)) {
      res.status(400).json({ code: 400, msg: 'sort_order_must_be_an_integer', data: null });
      return;
    }
    data.sort_order = sortOrder;
  }
  if (icon !== undefined) {
    if (icon !== null && typeof icon !== 'string') {
      res.status(400).json({ code: 400, msg: 'icon_must_be_a_string_or_null', data: null });
      return;
    }
    data.icon = icon;
  }
  if (Object.keys(data).length === 0) {
    res.status(400).json({ code: 400, msg: 'no_fields_to_update', data: null });
    return;
  }

  try {
    const category = await prisma.itemCategory.update({ where: { id }, data, select: categorySelect });
    res.json({ code: 200, msg: 'success', data: category });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json({ code: 409, msg: 'category_name_already_exists_under_parent', data: null });
      return;
    }
    throw error;
  }
});

export default router;
