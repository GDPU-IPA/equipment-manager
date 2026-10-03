import { Router } from 'express';
import type { Request, Response } from 'express';
import { Prisma as PrismaClient } from '@prisma/client';
import type { Prisma } from '../db.js';
import { prisma } from '../db.js'; 

const router: Router = Router();

const parseId = (raw: unknown): number | null => {
    const id = Number(raw);
    return Number.isInteger(id) && id > 0 ? id : null;
};

const itemBaseSelect = {
    id: true,
    name: true,
    category_id: true,
    description: true,
    total_stock: true,
    available_stock: true,
    status: true,
} satisfies Prisma.ItemSelect;

const itemSelect = {
    ...itemBaseSelect,
    category: { select: { name: true } },
} satisfies Prisma.ItemSelect;

// GET /api/equipments?page=1&pageSize=20&name=万用表&category_id=5
router.get('/', async (req: Request, res: Response) => {
    const page = Math.max(Math.floor(Number(req.query.page)) || 1, 1);
    const pageSize = Math.min(Math.max(Math.floor(Number(req.query.pageSize)) || 20, 1), 100);

    const name = typeof req.query.name === 'string' ? req.query.name.trim() : '';
    const categoryId = Number(req.query.category_id);

    const where: Prisma.ItemWhereInput = {
        ...(name ? { name: { contains: name, mode: 'insensitive' } } : {}),
        ...(Number.isInteger(categoryId) && categoryId > 0 ? { category_id: categoryId } : {}),
    };

    const [total, list] = await prisma.$transaction([
        prisma.item.count({ where }),
        prisma.item.findMany({
            where,
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: { id: 'desc' },
            select: itemSelect,
        }),
    ]);

    res.json({ code: 200, msg: 'success', data: { list, page, pageSize, total } });
});

// GET /api/equipments/:id
router.get('/:id', async (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    if (id === null) {
        res.status(400).json({ code: 400, msg: 'invalid_id', data: null });
        return;
    }

    const item = await prisma.item.findUnique({
        where: { id },
        select: { ...itemSelect, created_at: true, updated_at: true },
    });

    if (!item) {
        res.status(404).json({ code: 404, msg: 'equipment_not_found', data: null });
        return;
    }

    res.json({ code: 200, msg: 'success', data: item });
});

// POST /api/equipments
router.post('/', async (req: Request, res: Response) => {
    const body = req.body ?? {};
    const { name, category_id, description, total_stock, available_stock, status } = body;

    if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) {
        res.status(400).json({ code: 400, msg: 'name_is_required', data: null });
        return;
    }
    if (!Number.isInteger(category_id) || category_id <= 0) {
        res.status(400).json({ code: 400, msg: 'category_id_is_required', data: null });
        return;
    }
    if (!Number.isInteger(total_stock) || total_stock < 0) {
        res.status(400).json({ code: 400, msg: 'total_stock_must_be_non_negative', data: null });
        return;
    }
    if (available_stock !== undefined
        && (!Number.isInteger(available_stock) || available_stock < 0 || available_stock > total_stock)) {
        res.status(400).json({ code: 400, msg: 'available_stock_must_be_between_zero_and_total_stock', data: null });
        return;
    }
    if (status !== undefined && status !== 0 && status !== 1) {
        res.status(400).json({ code: 400, msg: 'status_must_be_0_or_1', data: null });
        return;
    }
    if (description !== undefined && description !== null && typeof description !== 'string') {
        res.status(400).json({ code: 400, msg: 'description_must_be_a_string_or_null', data: null });
        return;
    }

    const category = await prisma.itemCategory.findUnique({ where: { id: category_id }, select: { id: true } });
    if (!category) {
        res.status(400).json({ code: 400, msg: 'category_not_found', data: null });
        return;
    }

    const created = await prisma.item.create({
        data: {
            name: name.trim(),
            category_id,
            description: typeof description === 'string' ? description : null,
            total_stock,
            available_stock: Number.isInteger(available_stock) ? available_stock : total_stock,
            status: status === 0 ? 0 : 1,
        },
        select: itemBaseSelect,
    });

    res.status(201).json({ code: 201, msg: 'success', data: created });
});

// PATCH /api/equipments/:id
router.patch('/:id', async (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    if (id === null) {
        res.status(400).json({ code: 400, msg: 'invalid_id', data: null });
        return;
    }

    const current = await prisma.item.findUnique({ where: { id }, select: { total_stock: true, available_stock: true } });
    if (!current) {
        res.status(404).json({ code: 404, msg: 'equipment_not_found', data: null });
        return;
    }

    const body = req.body ?? {};
    const { name, category_id, description, total_stock, available_stock, status } = body;
    const data: Prisma.ItemUpdateInput = {};

    if (name !== undefined) {
        if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) {
            res.status(400).json({ code: 400, msg: 'invalid_name', data: null });
            return;
        }
        data.name = name.trim();
    }
    if (description !== undefined && description !== null && typeof description !== 'string') {
        res.status(400).json({ code: 400, msg: 'description_must_be_a_string_or_null', data: null });
        return;
    }
    if (description !== undefined) {
        data.description = description;
    }
    if (category_id !== undefined) {
        if (!Number.isInteger(category_id) || category_id <= 0) {
            res.status(400).json({ code: 400, msg: 'invalid_category_id', data: null });
            return;
        }
        const category = await prisma.itemCategory.findUnique({ where: { id: category_id }, select: { id: true } });
        if (!category) {
            res.status(400).json({ code: 400, msg: 'category_not_found', data: null });
            return;
        }
        data.category = { connect: { id: category_id } };
    }

    if (total_stock !== undefined && (!Number.isInteger(total_stock) || total_stock < 0)) {
        res.status(400).json({ code: 400, msg: 'total_stock_must_be_non_negative', data: null });
        return;
    }
    if (available_stock !== undefined && (!Number.isInteger(available_stock) || available_stock < 0)) {
        res.status(400).json({ code: 400, msg: 'available_stock_must_be_non_negative', data: null });
        return;
    }
    if (status !== undefined && status !== 0 && status !== 1) {
        res.status(400).json({ code: 400, msg: 'status_must_be_0_or_1', data: null });
        return;
    }

    const borrowed = current.total_stock - current.available_stock;
    const nextTotal = total_stock ?? current.total_stock;
    if (nextTotal < borrowed) {
        res.status(400).json({
            code: 400,
            msg: 'total_stock_cannot_be_less_than_borrowed',
            data: { borrowed },
        });
        return;
    }
    if (total_stock !== undefined) {
        data.total_stock = total_stock;
    }
    if (available_stock !== undefined) {
        if (available_stock + borrowed > nextTotal) {
            res.status(400).json({
                code: 400,
                msg: 'available_stock_and_borrowed_stock_exceed_total_stock',
                data: { borrowed },
            });
            return;
        }
        data.available_stock = available_stock;
    } else if (total_stock !== undefined) {
        data.available_stock = nextTotal - borrowed;
    }
    if (status !== undefined) {
        data.status = status;
    }
    if (Object.keys(data).length === 0) {
        res.status(400).json({ code: 400, msg: 'no_fields_to_update', data: null });
        return;
    }

    try {
        const updated = await prisma.item.update({ where: { id }, data, select: itemBaseSelect });
        res.json({ code: 200, msg: 'success', data: updated });
    } catch (error) {
        if (error instanceof PrismaClient.PrismaClientKnownRequestError && error.code === 'P2025') {
            res.status(404).json({ code: 404, msg: 'equipment_not_found', data: null });
            return;
        }
        throw error;
    }
});

// PATCH /api/equipments/:id/status
router.patch('/:id/status', async (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    if (id === null) {
        res.status(400).json({ code: 400, msg: 'invalid_id', data: null });
        return;
    }

    const { status } = req.body ?? {};
    if (status !== 0 && status !== 1) {
        res.status(400).json({ code: 400, msg: 'status_must_be_0_or_1', data: null });
        return;
    }

    const updated = await prisma.item.updateMany({ where: { id }, data: { status } });
    if (updated.count === 0) {
        res.status(404).json({ code: 404, msg: 'equipment_not_found', data: null });
        return;
    }
    res.json({ code: 200, msg: 'success', data: { id, status } });
});

export default router;
