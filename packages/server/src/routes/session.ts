import { Router } from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcrypt'
import createToken, { revokeToken, verifyToken } from '../../utils/token.js'
import { prisma } from '../db.js';

const router: Router = Router();

// POST api/session
router.post('/', async (req: Request, res: Response) => {
    const userinfo = req.body ?? {};
    if (typeof userinfo.username !== 'string' || !userinfo.username ||
        typeof userinfo.password !== 'string' || !userinfo.password) {
        return res.send({ code: 401, msg: '请输入用户名或密码' });
    }
    try {
        const accountInfo = await prisma.user.findUnique({
            where: { username: userinfo.username }
        })
        if (!accountInfo) { return res.send({ code: 401, msg: '用户名或密码错误' }) }
        if (accountInfo.status !== 1) {
            return res.status(403).send({ code: 403, msg: '账户已被禁用' });
        }
        const match = await bcrypt.compare(userinfo.password, accountInfo.password_hash)
        if (match) {
            const token = createToken({ id: accountInfo.id, username: accountInfo.username });
            res.send({
                code: 200,
                msg: '登录成功',
                token: token,
                data: {
                    role: accountInfo.role,
                    profile: accountInfo.profile,
                    status: accountInfo.status
                }
            })
        }
        else {
            return res.send({ code: 401, msg: '密码错误' })
        }
    } catch (err) {
        console.log(err)
        res.status(500).send({ code: 500, msg: '服务器错误' })
    }
})

// GET /api/session/me
router.get('/me', async (req: Request, res: Response) => {
    const token = req.headers.authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];
    if (!token) {
        return res.status(401).json({ code: 401, msg: '请先登录' });
    }

    try {
        const payload = verifyToken(token);
        const userId = payload.userinfo?.id;
        if (!Number.isSafeInteger(userId) || userId <= 0) {
            return res.status(401).json({ code: 401, msg: '登录凭证无效' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                role: true,
                profile: true,
                status: true,
                created_at: true,
                updated_at: true,
            },
        });
        if (!user || user.status !== 1) {
            return res.status(401).json({ code: 401, msg: '用户不存在或已被禁用' });
        }
        return res.json({ code: 200, msg: 'success', data: user });
    } catch {
        return res.status(401).json({ code: 401, msg: '登录凭证无效或已过期' });
    }
});


// DELETE /api/session
router.delete('/', (req: Request, res: Response) => {
    const token = req.headers.authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];
    if (!token) {
        return res.status(401).json({ code: 401, msg: '请先登录' });
    }
    try {
        revokeToken(token);
        return res.json({ code: 200, msg: '登出成功' });
    } catch {
        return res.status(401).json({ code: 401, msg: '登录凭证无效或已过期' });
    }
})


export default router;
