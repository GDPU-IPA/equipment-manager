import { verifyToken } from './token.js';
export function requireAuth(req, res, next) {
    const authorization = req.header('authorization') ?? '';
    const match = /^Bearer\s+(.+)$/i.exec(authorization);
    const token = match?.[1];
    const claims = token ? verifyToken(token) : null;
    if (!token || !claims) {
        res.status(401).json({ code: 401, msg: '请先登录或重新登录', data: null });
        return;
    }
    req.user = claims;
    req.authToken = token;
    next();
}
export function requireAdmin(req, res, next) {
    const user = req.user;
    if (user?.role !== 'admin') {
        res.status(403).json({ code: 403, msg: 'admin_required', data: null });
        return;
    }
    next();
}
//# sourceMappingURL=require-auth.js.map