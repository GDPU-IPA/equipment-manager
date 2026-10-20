import assert from 'node:assert/strict';
import test from 'node:test';
import bcrypt from 'bcrypt';
import { hashPassword, isStrongPassword, needsPasswordRehash, verifyPassword } from './password.js';

test('password validation enforces length, character types and allowed symbols', () => {
  for (const symbol of '$@!%*?.&_-') {
    assert.equal(isStrongPassword(`Abcdef1${symbol}`), true);
  }
  assert.equal(isStrongPassword('Abcdefghijklm1!x'), true);
  for (const password of [
    'Abcde1!', 'Abcdefghijklmn1!x', 'abcdef1!', 'ABCDEF1!',
    'Abcdefg!', 'Abcdef12', 'Abcdef1#', 'Abcde1! ',
    'Abcde1!中', ',Abcdef1!', 'Abcdef1!\n', '', 1234567, null,
  ]) {
    assert.equal(isStrongPassword(password), false, `Unexpected valid password: ${password}`);
  }
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

test('legacy bcrypt hashes remain login-compatible and are marked for rehash', async () => {
  const password = 'TestPass@123';
  const hash = await bcrypt.hash(password, 10);

  assert.equal(needsPasswordRehash(hash), true);
  assert.equal(await verifyPassword(password, hash), true);
  assert.equal(await verifyPassword('WrongPass@123', hash), false);
});

test('current scrypt hashes do not need rehashing', async () => {
  assert.equal(needsPasswordRehash(await hashPassword('TestPass@123')), false);
});
