import 'dotenv/config';
import { Prisma } from '@prisma/client';
import { hashPassword, isStrongPassword } from '../auth/password.js';
import { prisma } from '../db.js';

async function main() {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim();

  if (!username || username.length > 50) {
    throw new Error('ADMIN_USERNAME is required and must be at most 50 characters.');
  }
  if (!isStrongPassword(password)) {
    throw new Error('ADMIN_PASSWORD must be 8-128 characters and include uppercase, lowercase, a number, and a symbol.');
  }
  if (!name || name.length > 100) {
    throw new Error('ADMIN_NAME is required and must be at most 100 characters.');
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(20261011, 1)`;

    const existingAdmin = await tx.user.findFirst({
      where: { role: 'admin' },
      select: { id: true },
    });
    if (existingAdmin) {
      throw new Error('An admin account already exists; refusing to create another bootstrap admin.');
    }

    return tx.user.create({
      data: {
        username,
        password_hash: passwordHash,
        role: 'admin',
        profile: { name },
      },
      select: { id: true, username: true },
    });
  });

  console.log(`Created initial admin account "${user.username}" (id: ${user.id}).`);
}

main()
  .catch((error: unknown) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      console.error('Admin bootstrap failed: the username is already in use.');
    } else {
      console.error(`Admin bootstrap failed: ${error instanceof Error ? error.message : 'Unexpected error.'}`);
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
