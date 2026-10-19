export interface SessionClaims {
    sub: string;
    role: string;
    exp: number;
    jti?: string;
}
export declare function signToken(userId: number, role: string): string;
export declare function revokeToken(claims: SessionClaims, token: string): void;
export declare function verifyToken(token: string): SessionClaims | null;
//# sourceMappingURL=token.d.ts.map