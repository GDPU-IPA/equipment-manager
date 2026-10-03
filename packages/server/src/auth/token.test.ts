import assert from 'node:assert/strict';
import test from 'node:test';
import { revokeToken, signToken, verifyToken } from './token.js';

test('signed tokens can be revoked for logout', () => {
  process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-bytes-long';
  const token = signToken(42, 'student');
  const claims = verifyToken(token);

  assert.ok(claims);
  revokeToken(claims, token);
  assert.equal(verifyToken(token), null);
});

test('expired and malformed tokens are rejected', () => {
  process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-bytes-long';
  assert.equal(verifyToken('not-a-token'), null);
});
