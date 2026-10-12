import assert from 'node:assert/strict';
import test from 'node:test';
import { requireAdmin, requireAuth } from './require-auth.js';
import { signToken } from './token.js';

process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-bytes-long';

function createRequest(authorization?: string) {
  return {
    header(name: string) {
      return name.toLowerCase() === 'authorization' ? authorization : undefined;
    },
  } as any;
}

function createResponse() {
  const response: any = {
    statusCode: 200,
    body: undefined,
  };

  response.status = (value: number) => {
    response.statusCode = value;
    return response;
  };
  response.json = (value: unknown) => {
    response.body = value;
    return response;
  };

  return response;
}

test('requireAuth rejects requests without a bearer token', () => {
  const req = createRequest();
  const res = createResponse();
  let nextCalled = false;

  requireAuth(req, res, () => { nextCalled = true; });

  assert.equal(res.statusCode, 401);
  assert.equal(nextCalled, false);
});

test('requireAuth attaches claims from a valid token', () => {
  const token = signToken(42, 'student');
  const req = createRequest(`Bearer ${token}`);
  const res = createResponse();
  let nextCalled = false;

  requireAuth(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
  assert.equal(req.user.sub, '42');
  assert.equal(req.user.role, 'student');
  assert.equal(req.authToken, token);
});

test('requireAdmin blocks non-admin callers', () => {
  const req = { user: { role: 'student' } } as any;
  const res = createResponse();
  let nextCalled = false;

  requireAdmin(req, res, () => { nextCalled = true; });

  assert.equal(res.statusCode, 403);
  assert.equal(nextCalled, false);
});

test('requireAdmin allows admin callers', () => {
  const req = { user: { role: 'admin' } } as any;
  const res = createResponse();
  let nextCalled = false;

  requireAdmin(req, res, () => { nextCalled = true; });

  assert.equal(res.statusCode, 200);
  assert.equal(nextCalled, true);
});
