import { Router } from 'express';
import type { Request, Response } from 'express';
import type { Prisma } from '../db.js';
import { prisma } from '../db.js'; 


const router: Router = Router();

const userSelect = {
  id: true,
  username: true,
  role: true,
  profile: true,
  status: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.UserSelect;

// GET /api/users?page=1&pageSize=20&role=student&status=1
router.get('/', async (req: Request, res: Response) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 20, 1), 100);

  const role = typeof req.query.role === 'string' ? req.query.role.trim() : '';
  const status = Number(req.query.status);

  const where: Prisma.UserWhereInput = {
    ...(role ? { role } : {}),
    ...(Number.isInteger(status) ? { status } : {}),
  };

  const [total, list] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { id: 'desc' },
      select: userSelect,
    }),
  ]);

  res.json({ code: 200, msg: 'success', data: { list, page, pageSize, total } });
});

export default router;
