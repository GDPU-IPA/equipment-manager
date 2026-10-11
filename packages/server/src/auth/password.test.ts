import assert from 'node:assert/strict';
import test from 'node:test';
import { hashPassword, isStrongPassword, verifyPassword } from './password.js';

test('password strength validation enforces the documented rules', () => {
  assert.equal(isStrongPassword('StrongPass@123'), true);
  assert.equal(isStrongPassword('shortA1!'), true);
  assert.equal(isStrongPassword('lowercase1!'), false);
  assert.equal(isStrongPassword('UPPERCASE1!'), false);
  assert.equal(isStrongPassword('nonumber!'), false);
  assert.equal(isStrongPassword('NoSymbol123'), false);
  assert.equal(isStrongPassword(`Aa1!${'x'.repeat(125)}`), false);
  assert.equal(isStrongPassword(null), false);
});

test('password helper resolves its TypeScript module and verifies hashed passwords', async () => {
  const password = 'TestPass@123';
  const hash = await hashPassword(password);

  assert.match(hash, /^scrypt\$/);
  assert.equal(await verifyPassword(password, hash), true);
  assert.equal(await verifyPassword('WrongPass@123', hash), false);
});

test('malformed password hashes are rejected', async () => {
  assert.equal(await verifyPassword('TestPass@123', 'invalid-hash'), false);
});
