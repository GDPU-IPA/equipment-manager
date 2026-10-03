export interface BorrowLineState {
  borrow_qty: number;
  returned_qty: number;
}

export function orderStatus(items: BorrowLineState[]): number {
  if (items.every((item) => item.returned_qty >= item.borrow_qty)) return 3;
  if (items.some((item) => item.returned_qty > 0)) return 2;
  return 1;
}

export function lineStatus(item: BorrowLineState, hasDamagedReturn: boolean): number {
  if (item.returned_qty < item.borrow_qty) return 1;
  return hasDamagedReturn ? 3 : 2;
}

export class BorrowOperationError extends Error {
  constructor(
    readonly statusCode: number,
    readonly responseCode: number,
    message: string,
  ) {
    super(message);
  }
}
