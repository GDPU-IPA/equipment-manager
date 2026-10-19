import assert from 'node:assert/strict';
import test from 'node:test';
import { hashPassword, isStrongPassword, verifyPassword } from './password.js';

test('password validation only requires more than six characters', () => {
  assert.equal(isStrongPassword('StrongPass@123'), true);
  assert.equal(isStrongPassword('shortA1!'), true);
  assert.equal(isStrongPassword('123456'), false);
  assert.equal(isStrongPassword('1234567'), true);
  assert.equal(isStrongPassword('abcdefg'), true);
  assert.equal(isStrongPassword('ABCDEFG'), true);
  assert.equal(isStrongPassword(''), false);
  assert.equal(isStrongPassword('x'.repeat(129)), true);
  assert.equal(isStrongPassword(1234567), false);
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
