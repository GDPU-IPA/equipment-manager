export declare const getTokenSecret: () => string;
declare const createToken: (userinfo: {
    id: number;
    username: string;
}) => any;
export declare const verifyToken: (token: string) => any;
export declare const revokeToken: (token: string) => void;
export default createToken;
//# sourceMappingURL=token.d.ts.map