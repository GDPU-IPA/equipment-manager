import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
const revokedTokens = new Map();
function secret() {
    const value = process.env.JWT_SECRET;
    if (!value || Buffer.byteLength(value) < 32) {
        throw new Error('JWT_SECRET must be configured with at least 32 bytes');
    }
    return value;
}
function revocationKey(claims, token) {
    return claims.jti ?? createHash('sha256').update(token).digest('hex');
}
export function signToken(userId, role) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
        sub: String(userId),
        role,
        exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60,
        jti: randomUUID(),
    })).toString('base64url');
    const unsigned = `${header}.${payload}`;
    const signature = createHmac('sha256', secret()).update(unsigned).digest('base64url');
    return `${unsigned}.${signature}`;
}
export function revokeToken(claims, token) {
    revokedTokens.set(revocationKey(claims, token), claims.exp);
}
export function verifyToken(token) {
    const parts = token.split('.');
    if (parts.length !== 3)
        return null;
    try {
        const [headerPart, payloadPart, signaturePart] = parts;
        const header = JSON.parse(Buffer.from(headerPart, 'base64url').toString());
        if (header.alg !== 'HS256')
            return null;
        const expected = createHmac('sha256', secret()).update(`${headerPart}.${payloadPart}`).digest();
        const actual = Buffer.from(signaturePart, 'base64url');
        if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
            return null;
        const claims = JSON.parse(Buffer.from(payloadPart, 'base64url').toString());
        if (typeof claims.sub !== 'string' || !/^\d+$/.test(claims.sub))
            return null;
        if (typeof claims.role !== 'string' || typeof claims.exp !== 'number' || claims.exp <= Date.now() / 1000)
            return null;
        if (claims.jti !== undefined && typeof claims.jti !== 'string')
            return null;
        for (const [jti, expiresAt] of revokedTokens) {
            if (expiresAt <= Date.now() / 1000)
                revokedTokens.delete(jti);
        }
        if (revokedTokens.has(revocationKey(claims, token)))
            return null;
        return claims;
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=token.js.map