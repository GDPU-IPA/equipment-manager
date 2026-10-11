import assert from 'node:assert/strict';
import test from 'node:test';
import { hashPassword, verifyPassword } from './password.js';

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
