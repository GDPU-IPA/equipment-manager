import { Router } from 'express';
import { prisma } from '../db.js';
import { verifyPassword } from '../auth/password.js';
import { revokeToken, signToken } from '../auth/token.js';
const router = Router();
router.post('/', async (req, res) => {
    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!username || !password) {
        res.status(400).json({ code: 400, msg: '请输入用户名和密码', data: null });
        return;
    }
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || user.status !== 1 || !(await verifyPassword(password, user.password_hash))) {
        res.status(401).json({ code: 401, msg: '用户名或密码错误', data: null });
        return;
    }
    res.json({
        code: 200,
        msg: 'success',
        data: { token: signToken(user.id, user.role), role: user.role },
    });
});
export async function logoutCurrentSession(req, res) {
    const authenticatedRequest = req;
    revokeToken(authenticatedRequest.user, authenticatedRequest.authToken);
    res.json({ code: 200, msg: 'success', data: null });
}
export default router;
//# sourceMappingURL=session.js.map