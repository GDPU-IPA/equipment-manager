import type { NextFunction, Request, Response } from 'express';
import { type SessionClaims } from './token.js';
export type AuthenticatedRequest = Request & {
    user: SessionClaims;
    authToken: string;
};
export declare function requireAuth(req: Request, res: Response, next: NextFunction): void;
export declare function requireAdmin(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=require-auth.d.ts.map