import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

export function isStrongPassword(value: unknown): value is string {
  return typeof value === 'string'
    && value.length >= 8
    && value.length <= 128
    && /[a-z]/.test(value)
    && /[A-Z]/.test(value)
    && /\d/.test(value)
    && /[^A-Za-z0-9]/.test(value);
}

function deriveKey(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, (error, key) => {
      if (error) reject(error);
      else resolve(key as Buffer);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const key = await deriveKey(password, salt);
  return `scrypt$${salt}$${key.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [algorithm, salt, keyHex] = storedHash.split('$');
  if (algorithm !== 'scrypt' || !salt || !keyHex || !/^[\da-f]+$/i.test(keyHex)) return false;

  const expected = Buffer.from(keyHex, 'hex');
  const actual = await deriveKey(password, salt);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}