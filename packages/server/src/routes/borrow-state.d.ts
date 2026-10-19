export interface BorrowLineState {
    borrow_qty: number;
    returned_qty: number;
}
export declare function orderStatus(items: BorrowLineState[]): number;
export declare function lineStatus(item: BorrowLineState, hasDamagedReturn: boolean): number;
export declare class BorrowOperationError extends Error {
    readonly statusCode: number;
    readonly responseCode: number;
    constructor(statusCode: number, responseCode: number, message: string);
}
//# sourceMappingURL=borrow-state.d.ts.map