import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcrypt';

function isLegacyBcryptHash(storedHash: string): boolean {
  return /^\$2[aby]\$/.test(storedHash);
}

export function needsPasswordRehash(storedHash: string): boolean {
  return isLegacyBcryptHash(storedHash);
}

export const passwordRule = '密码需为 8-16 位，仅可使用字母、数字和 $@!%*?.&_-，且必须包含大写字母、小写字母、数字和符号';

export function isStrongPassword(value: unknown): value is string {
  return typeof value === 'string'
    && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@!%*?.&_-])[\w$@!%*?.&-]{8,16}(?![\s\S])/.test(value);
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
  if (isLegacyBcryptHash(storedHash)) {
    return bcrypt.compare(password, storedHash);
  }

  const [algorithm, salt, keyHex] = storedHash.split('$');
  if (algorithm !== 'scrypt' || !salt || !keyHex || !/^[\da-f]+$/i.test(keyHex)) return false;

  const expected = Buffer.from(keyHex, 'hex');
  const actual = await deriveKey(password, salt);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
