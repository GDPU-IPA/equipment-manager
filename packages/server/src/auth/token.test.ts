import assert from 'node:assert/strict';
import test from 'node:test';
import { requireAdmin } from './require-auth.js';
import { revokeToken, signToken, verifyToken } from './token.js';

test('non-admin callers are blocked from admin-only routes', () => {
  let statusCode = 200;
  const req = { user: { role: 'student' } } as any;
  const res = {
    status(value: number) {
      statusCode = value;
      return this;
    },
    json() {
      return this;
    },
  } as any;

  let nextCalled = false;
  requireAdmin(req, res, () => { nextCalled = true; });

  assert.equal(statusCode, 403);
  assert.equal(nextCalled, false);
});

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
