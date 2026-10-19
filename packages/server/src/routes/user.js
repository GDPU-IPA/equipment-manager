import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../db.js';
import { requireAdmin } from '../auth/require-auth.js';
import { hashPassword, isStrongPassword, verifyPassword } from '../auth/password.js';
const router = Router();
const userSelect = {
    id: true,
    username: true,
    role: true,
    profile: true,
    status: true,
    created_at: true,
    updated_at: true,
};
function isProfile(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return false;
    const profile = value;
    return typeof profile.name === 'string'
        && profile.name.trim().length > 0
        && Object.values(profile).every((field) => typeof field === 'string');
}
function parseId(value) {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}
export async function registerUser(req, res) {
    const { username, password, profile } = req.body ?? {};
    const normalizedUsername = typeof username === 'string' ? username.trim() : '';
    if (!normalizedUsername || normalizedUsername.length > 50) {
        res.status(400).json({ code: 400, msg: 'username_is_required_or_too_long', data: null });
        return;
    }
    if (!isStrongPassword(password)) {
        res.status(400).json({ code: 400, msg: '密码长度必须不少于6位', data: null });
        return;
    }
    if (!isProfile(profile)) {
        res.status(400).json({ code: 400, msg: 'profile_with_name_is_required', data: null });
        return;
    }
    try {
        const user = await prisma.user.create({
            data: {
                username: normalizedUsername,
                password_hash: await hashPassword(password),
                role: 'student',
                profile: profile,
            },
            select: userSelect,
        });
        res.status(201).json({ code: 201, msg: 'success', data: user });
    }
    catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            res.status(409).json({ code: 409, msg: 'username_already_exists', data: null });
            return;
        }
        throw error;
    }
}
router.get('/me', async (req, res) => {
    const userId = Number(req.user.sub);
    const user = await prisma.user.findUnique({ where: { id: userId }, select: userSelect });
    if (!user || user.status !== 1) {
        res.status(401).json({ code: 401, msg: 'user_not_active', data: null });
        return;
    }
    res.json({ code: 200, msg: 'success', data: user });
});
router.post('/me/password', async (req, res) => {
    const userId = Number(req.user.sub);
    const { old_pwd: oldPassword, new_pwd: newPassword } = req.body ?? {};
    if (!isStrongPassword(newPassword)) {
        res.status(400).json({ code: 400, msg: '密码长度必须不少于6位', data: null });
        return;
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== 1) {
        res.status(401).json({ code: 401, msg: 'user_not_active', data: null });
        return;
    }
    if (typeof oldPassword !== 'string' || !(await verifyPassword(oldPassword, user.password_hash))) {
        res.status(400).json({ code: 400, msg: 'old_password_is_incorrect', data: null });
        return;
    }
    await prisma.user.update({
        where: { id: userId },
        data: { password_hash: await hashPassword(newPassword) },
    });
    res.json({ code: 200, msg: 'success', data: null });
});
router.post('/:id/password', requireAdmin, async (req, res) => {
    const id = parseId(req.params.id);
    const { new_pwd: newPassword } = req.body ?? {};
    if (id === null) {
        res.status(400).json({ code: 400, msg: 'invalid_id', data: null });
        return;
    }
    if (!isStrongPassword(newPassword)) {
        res.status(400).json({ code: 400, msg: '密码长度必须大于6位', data: null });
        return;
    }
    const result = await prisma.user.updateMany({
        where: { id },
        data: { password_hash: await hashPassword(newPassword) },
    });
    if (result.count === 0) {
        res.status(404).json({ code: 404, msg: 'user_not_found', data: null });
        return;
    }
    res.json({ code: 200, msg: 'success', data: null });
});
router.patch('/:id/role', requireAdmin, async (req, res) => {
    const id = parseId(req.params.id);
    const role = req.body?.role;
    if (id === null) {
        res.status(400).json({ code: 400, msg: 'invalid_id', data: null });
        return;
    }
    if (role !== 'admin' && role !== 'student') {
        res.status(400).json({ code: 400, msg: 'role_must_be_admin_or_student', data: null });
        return;
    }
    const result = await prisma.user.updateMany({ where: { id }, data: { role } });
    if (result.count === 0) {
        res.status(404).json({ code: 404, msg: 'user_not_found', data: null });
        return;
    }
    res.json({ code: 200, msg: 'success', data: { id, role } });
});
router.get('/', requireAdmin, async (req, res) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 20, 1), 100);
    const role = typeof req.query.role === 'string' ? req.query.role.trim() : '';
    const status = Number(req.query.status);
    const where = {
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
//# sourceMappingURL=user.js.map