export function orderStatus(items) {
    if (items.every((item) => item.returned_qty >= item.borrow_qty))
        return 3;
    if (items.some((item) => item.returned_qty > 0))
        return 2;
    return 1;
}
export function lineStatus(item, hasDamagedReturn) {
    if (item.returned_qty < item.borrow_qty)
        return 1;
    return hasDamagedReturn ? 3 : 2;
}
export class BorrowOperationError extends Error {
    statusCode;
    responseCode;
    constructor(statusCode, responseCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.responseCode = responseCode;
    }
}
//# sourceMappingURL=borrow-state.js.map