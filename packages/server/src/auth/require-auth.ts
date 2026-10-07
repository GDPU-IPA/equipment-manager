import type { NextFunction, Request, Response } from 'express';
import { verifyToken, type SessionClaims } from './token.js';

export type AuthenticatedRequest = Request & { user: SessionClaims; authToken: string };

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authorization = req.header('authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  const token = match?.[1];
  const claims = token ? verifyToken(token) : null;

  if (!token || !claims) {
    res.status(401).json({ code: 401, msg: '请先登录或重新登录', data: null });
    return;
  }

  (req as AuthenticatedRequest).user = claims;
  (req as AuthenticatedRequest).authToken = token;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as AuthenticatedRequest).user;
  if (user?.role !== 'admin') {
    res.status(403).json({ code: 403, msg: 'admin_required', data: null });
    return;
  }
  next();
}