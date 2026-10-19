import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import express from 'express';
import { hashPassword } from '../auth/password.js';
import { prisma } from '../db.js';
import apiRouter from './index.js';
test('frontend session endpoints support login, current user, and logout', async () => {
    process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-bytes-long';
    const sessionSource = await readFile(new URL('../../../web/src/session.ts', import.meta.url), 'utf8');
    const appSource = await readFile(new URL('../../../web/src/App.vue', import.meta.url), 'utf8');
    const currentUserPath = /api\.get<[^\n]+>\('([^']+)'\)/.exec(sessionSource)?.[1];
    const logoutPath = /await api\.post\('([^']+)'\)/.exec(appSource)?.[1];
    assert.ok(currentUserPath, 'frontend must declare a current-user endpoint');
    assert.ok(logoutPath, 'frontend must declare a logout endpoint');
    const user = {
        id: 1, username: 'session-test', role: 'student', status: 1,
        profile: { name: 'Test User' },
        password_hash: await hashPassword('1234567'),
    };
    const originalFindUnique = prisma.user.findUnique;
    prisma.user.findUnique = async ({ select }) => {
        const { password_hash, ...publicUser } = user;
        return select ? publicUser : user;
    };
    const app = express();
    app.use(express.json());
    app.use('/api', apiRouter);
    const server = app.listen(0, '127.0.0.1');
    try {
        await once(server, 'listening');
        const address = server.address();
        assert.ok(address && typeof address === 'object');
        const baseUrl = `http://127.0.0.1:${address.port}/api`;
        const login = await fetch(`${baseUrl}/session`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ username: user.username, password: '1234567' }),
        });
        assert.equal(login.status, 200);
        const body = await login.json();
        assert.equal(typeof body.data.token, 'string');
        const headers = { authorization: `Bearer ${body.data.token}` };
        const me = await fetch(`${baseUrl}${currentUserPath}`, { headers });
        assert.equal(me.status, 200);
        const meBody = await me.json();
        assert.equal(meBody.data.username, user.username);
        assert.equal(meBody.data.password_hash, undefined);
        const logout = await fetch(`${baseUrl}${logoutPath}`, { method: 'POST', headers });
        assert.equal(logout.status, 200);
        const revoked = await fetch(`${baseUrl}${currentUserPath}`, { headers });
        assert.equal(revoked.status, 401);
    }
    finally {
        prisma.user.findUnique = originalFindUnique;
        await new Promise((resolve, reject) => {
            server.close(error => error ? reject(error) : resolve());
        });
    }
});
//# sourceMappingURL=session.test.js.map