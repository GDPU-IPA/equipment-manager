import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { Server } from 'node:http';
import { after, before, test } from 'node:test';
import express from 'express';
import { requireAuth } from '../auth/require-auth.js';
import { signToken } from '../auth/token.js';
import { prisma } from '../db.js';
import equipmentRouter from './equipment.js';

process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-bytes-long';

const app = express();
app.use(express.json());
app.use('/api/equipments', requireAuth, equipmentRouter);

const item = {
  id: 1,
  name: 'Digital Multimeter',
  category_id: 1,
  description: null,
  total_stock: 5,
  available_stock: 5,
  status: 1,
};

const adminOnlyRequests = [
  {
    name: 'POST /api/equipments',
    method: 'POST',
    path: '',
    body: {
      name: 'Digital Multimeter',
      category_id: 1,
      description: 'Test equipment',
      total_stock: 5,
    },
  },
  {
    name: 'PATCH /api/equipments/:id',
    method: 'PATCH',
    path: '/1',
    body: { name: 'Updated Multimeter' },
  },
  {
    name: 'PATCH /api/equipments/:id/status',
    method: 'PATCH',
    path: '/1/status',
    body: { status: 0 },
  },
] as const;

let server: Server;
let baseUrl = '';

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');

  const address = server.address();
  assert.ok(address && typeof address === 'object');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

function stubEquipmentDb() {
  const original = {
    categoryFindUnique: prisma.itemCategory.findUnique,
    itemFindUnique: prisma.item.findUnique,
    itemCreate: prisma.item.create,
    itemUpdate: prisma.item.update,
    itemUpdateMany: prisma.item.updateMany,
  };
  let createCalls = 0;
  let updateCalls = 0;
  let updateManyCalls = 0;

  (prisma.itemCategory as any).findUnique = async () => ({ id: 1 });
  (prisma.item as any).findUnique = async () => ({
    total_stock: item.total_stock,
    available_stock: item.available_stock,
  });
  (prisma.item as any).create = async ({ data }: { data: Record<string, unknown> }) => {
    createCalls += 1;
    return { ...item, ...data };
  };
  (prisma.item as any).update = async ({ data }: { data: Record<string, unknown> }) => {
    updateCalls += 1;
    return { ...item, ...data };
  };
  (prisma.item as any).updateMany = async () => {
    updateManyCalls += 1;
    return { count: 1 };
  };

  return {
    get createCalls() { return createCalls; },
    get updateCalls() { return updateCalls; },
    get updateManyCalls() { return updateManyCalls; },
    restore() {
      (prisma.itemCategory as any).findUnique = original.categoryFindUnique;
      (prisma.item as any).findUnique = original.itemFindUnique;
      (prisma.item as any).create = original.itemCreate;
      (prisma.item as any).update = original.itemUpdate;
      (prisma.item as any).updateMany = original.itemUpdateMany;
    },
  };
}

function requestEquipment(
  method: string,
  path: string,
  token: string,
  body: Record<string, unknown>,
) {
  return fetch(`${baseUrl}/api/equipments${path}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

for (const route of adminOnlyRequests) {
  test(`student tokens are blocked from ${route.name}`, async () => {
    const stub = stubEquipmentDb();

    try {
      const response = await requestEquipment(
        route.method,
        route.path,
        signToken(1, 'student'),
        route.body,
      );
      const body = await response.json() as any;

      assert.equal(response.status, 403);
      assert.equal(body.code, 403);
      assert.equal(body.msg, 'admin_required');
      assert.equal(stub.createCalls + stub.updateCalls + stub.updateManyCalls, 0);
    } finally {
      stub.restore();
    }
  });
}

for (const route of adminOnlyRequests) {
  test(`admin tokens pass through ${route.name}`, async () => {
    const stub = stubEquipmentDb();

    try {
      const response = await requestEquipment(
        route.method,
        route.path,
        signToken(2, 'admin'),
        route.body,
      );
      const body = await response.json() as any;

      assert.equal(response.status, route.method === 'POST' ? 201 : 200);
      assert.equal(body.code, response.status);
    } finally {
      stub.restore();
    }
  });
}
