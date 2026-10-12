import { Router } from 'express';
import type { Request, Response } from 'express';
import type { Prisma } from '../db.js';
// import {jsonwebtoken} from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { verifyToken } from '../../utils/token.js';
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


router.post('/', async (req: Request, res: Response) => {
    const { username, password } = req.body ?? {};
    if (typeof username !== 'string' || !username.trim() ||
        typeof password !== 'string' || !password) {
        return res.send({ code: 401, msg: '请输入用户名或密码' });
    }
    if (typeof password !== 'string' || password.length < 6) {
        return res.status(400).send({ code: 400, msg: '密码长度不能少于6位' });
    }
    try {
        const hashedPwd = bcrypt.hashSync(password, 10);
        const createResult = await prisma.user.create({
            data: {
                username: username,
                password_hash: hashedPwd,
                role: 'user',
                status: 1
            }
        })
        return res.json({ code: 200, msg: '注册成功', data: { id: createResult.id, username: createResult.username } });
    } catch (err) {
        if (typeof err === 'object' && err !== null && 'code' in err && err.code === 'P2002') {
            return res.status(409).json({ code: 409, msg: '用户名已存在' });
        }
        res.status(500).send({ code: 500, msg: '服务器内部错误' })
    }

})

// PATCH /api/user/me
router.patch('/me', async (req: Request, res: Response) => {
  const token = req.headers.authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];
  let id: number;
  try {
    const payload = verifyToken(token ?? '');
    id = payload.userinfo?.id;
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Invalid user');
  } catch {
    return res.status(401).json({ code: 401, msg: '登录凭证无效或已过期' });
  }
  const { username, name, email, phone } = req.body ?? {};
  if (typeof username !== 'string' || !username.trim() || username.trim().length > 50 ||
      typeof name !== 'string' || name.length > 50 || typeof email !== 'string' || email.length > 254 ||
      (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) ||
      typeof phone !== 'string' || phone.length > 30) {
    return res.status(400).json({ code: 400, msg: '请检查用户名、姓名、邮箱和联系电话的格式或长度' });
  }
  try {
    const user = await prisma.$transaction(async tx => {
      const existing = await tx.user.findUnique({ where: { id } });
      if (!existing || existing.status !== 1) return null;
      const profile = existing.profile && typeof existing.profile === 'object' && !Array.isArray(existing.profile)
        ? existing.profile : {};
      return tx.user.update({
        where: { id },
        data: { username: username.trim(), profile: { ...profile, name: name.trim(), email: email.trim(), phone: phone.trim() } },
        select: userSelect,
      });
    });
    if (!user) return res.status(401).json({ code: 401, msg: '用户不存在或已被禁用' });
    return res.json({ code: 200, msg: '账号信息保存成功', data: user });
  } catch (err) {
    if (typeof err === 'object' && err !== null && 'code' in err && err.code === 'P2002') {
      return res.status(409).json({ code: 409, msg: '用户名已存在' });
    }
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

router.patch('/me/password', async (req: Request, res: Response) => {
  const token = req.headers.authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!token) {
    return res.status(401).json({ code: 401, msg: '请先登录' });
  }

  let id: number;
  try {
    const payload = verifyToken(token);
    if (!Number.isSafeInteger(payload.userinfo?.id) || payload.userinfo.id <= 0) {
      return res.status(401).json({ code: 401, msg: '登录凭证无效' });
    }
    id = payload.userinfo.id;
  } catch {
    return res.status(401).json({ code: 401, msg: '登录凭证无效或已过期' });
  }

  const { oldPassword, newPassword } = req.body ?? {};
  if (typeof oldPassword !== 'string' || !oldPassword ||
      typeof newPassword !== 'string' || !newPassword ||
      Buffer.byteLength(newPassword, 'utf8') > 72) {
    return res.status(400).json({ code: 400, msg: '请输入旧密码和新密码，新密码不能超过72字节' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.status !== 1) {
      return res.status(401).json({ code: 401, msg: '用户不存在或已被禁用' });
    }
    if (!await bcrypt.compare(oldPassword, user.password_hash)) {
      return res.status(400).json({ code: 400, msg: '旧密码错误' });
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const result = await prisma.user.updateMany({
      where: { id: user.id, password_hash: user.password_hash, status: 1 },
      data: { password_hash: passwordHash },
    });
    if (result.count !== 1) {
      return res.status(409).json({ code: 409, msg: '用户状态或密码已发生变化，请重试' });
    }
    return res.json({ code: 200, msg: '密码修改成功' });
  } catch {
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// POST /api/user/:id/password
router.post('/:id/password', async (req: Request, res: Response) => {
  const token = req.headers.authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!token) {
    return res.status(401).json({ code: 401, msg: '请先登录' });
  }

  let adminId: number;
  try {
    const payload = verifyToken(token);
    if (typeof payload === 'string' || !Number.isSafeInteger(payload.userinfo?.id) ||
        payload.userinfo.id <= 0) {
      return res.status(401).json({ code: 401, msg: '登录凭证无效' });
    }
    adminId = payload.userinfo.id;
  } catch {
    return res.status(401).json({ code: 401, msg: '登录凭证无效或已过期' });
  }

  try {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true, status: true },
    });
    if (!admin || admin.status !== 1) {
      return res.status(401).json({ code: 401, msg: '用户不存在或已被禁用' });
    }
    if (admin.role !== 'admin') {
      return res.status(403).json({ code: 403, msg: '仅管理员可以修改用户密码' });
    }

    const id = Number(req.params.id);
    if (!/^\d+$/.test(String(req.params.id)) || !Number.isSafeInteger(id) || id <= 0 || id > 2147483647) {
      return res.status(400).json({ code: 400, msg: '用户ID无效' });
    }
    const { newPassword } = req.body ?? {};
    if (typeof newPassword !== 'string' || newPassword.length < 6 ||
        Buffer.byteLength(newPassword, 'utf8') > 72) {
      return res.status(400).json({ code: 400, msg: '新密码不能少于6位或超过72字节' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const result = await prisma.user.updateMany({
      where: { id },
      data: { password_hash: passwordHash },
    });
    if (result.count === 0) {
      return res.status(404).json({ code: 404, msg: '用户不存在' });
    }
    return res.json({ code: 200, msg: '密码修改成功' });
  } catch {
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// PATCH /api/user/:id/role
router.patch('/:id/role', async (req: Request, res: Response) => {
  const token = req.headers.authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];
  let adminId: number;
  try {
    const payload = verifyToken(token ?? '');
    adminId = payload.userinfo?.id;
    if (!Number.isSafeInteger(adminId) || adminId <= 0) throw new Error('invalid token');
  } catch {
    return res.status(401).json({ code: 401, msg: '登录凭证无效或已过期' });
  }
  try {
    const admin = await prisma.user.findUnique({ where: { id: adminId }, select: { role: true, status: true } });
    if (!admin || admin.status !== 1) return res.status(401).json({ code: 401, msg: '用户不存在或已被禁用' });
    if (admin.role !== 'admin') return res.status(403).json({ code: 403, msg: '仅管理员可以修改用户类型' });
    const id = Number(req.params.id);
    const role = req.body?.role;
    if (!/^\d+$/.test(String(req.params.id)) || !Number.isSafeInteger(id) || id <= 0 || id > 2147483647 || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ code: 400, msg: '用户ID或用户类型无效' });
    }
    const result = await prisma.user.updateMany({ where: { id }, data: { role } });
    if (result.count === 0) return res.status(404).json({ code: 404, msg: '用户不存在' });
    return res.json({ code: 200, msg: '用户类型修改成功', data: { id, role } });
  } catch {
    return res.status(500).json({ code: 500, msg: '服务器内部错误' });
  }
});

// GET /api/user/users?page=1&pageSize=20&role=student&status=1
router.get('/users', async (req: Request, res: Response) => {
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
