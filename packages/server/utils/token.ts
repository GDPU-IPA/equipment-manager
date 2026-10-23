import jwt from 'jsonwebtoken'
import { createHash, randomUUID } from 'node:crypto';

// Revocations are retained until token expiry in this server process.
const revokedTokens = new Map<string, number>();
const tokenKey = (token: string) => createHash('sha256').update(token).digest('hex');

const clearExpiredRevocations = () => {
    const now = Math.floor(Date.now() / 1000);
    for (const [key, expiresAt] of revokedTokens) {
        if (expiresAt <= now) revokedTokens.delete(key);
    }
};
export const getTokenSecret = (): string => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }
    return secret;
};

const createToken = (userinfo: { id: number; username: string }) => {
    return jwt.sign({ userinfo }, getTokenSecret(), { expiresIn: '72h', jwtid: randomUUID() });
};

export const verifyToken = (token: string) => {
    clearExpiredRevocations();
    const payload = jwt.verify(token, getTokenSecret(), { algorithms: ['HS256'] });
    if (typeof payload === 'string' || typeof payload.exp !== 'number' ||
        revokedTokens.has(tokenKey(token))) {
        throw new Error('Invalid or revoked token');
    }
    return payload;
};

export const revokeToken = (token: string): void => {
    const payload = verifyToken(token);
    revokedTokens.set(tokenKey(token), payload.exp!);
};

export default createToken;
