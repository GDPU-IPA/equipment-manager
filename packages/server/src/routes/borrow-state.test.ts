import assert from 'node:assert/strict';
import test from 'node:test';
import { lineStatus, orderStatus } from './borrow-state.js';

test('borrow order state follows aggregate return quantities', () => {
  assert.equal(orderStatus([{ borrow_qty: 2, returned_qty: 0 }]), 1);
  assert.equal(orderStatus([
    { borrow_qty: 2, returned_qty: 1 },
    { borrow_qty: 1, returned_qty: 0 },
  ]), 2);
  assert.equal(orderStatus([
    { borrow_qty: 2, returned_qty: 2 },
    { borrow_qty: 1, returned_qty: 1 },
  ]), 3);
});

test('borrow line is damaged only once its full quantity is returned', () => {
  assert.equal(lineStatus({ borrow_qty: 3, returned_qty: 2 }, true), 1);
  assert.equal(lineStatus({ borrow_qty: 3, returned_qty: 3 }, false), 2);
  assert.equal(lineStatus({ borrow_qty: 3, returned_qty: 3 }, true), 3);
});
