export declare function isStrongPassword(value: unknown): value is string;
export declare function hashPassword(password: string): Promise<string>;
export declare function verifyPassword(password: string, storedHash: string): Promise<boolean>;
//# sourceMappingURL=password.d.ts.map