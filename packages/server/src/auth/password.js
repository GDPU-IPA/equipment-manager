import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
export function isStrongPassword(value) {
    return typeof value === 'string'
        && value.length >= 6
        && value.length <= 128;
    // && /[a-z]/.test(value)
    // && /[A-Z]/.test(value)
    // && /\d/.test(value)
    // && /[^A-Za-z0-9]/.test(value);
}
function deriveKey(password, salt) {
    return new Promise((resolve, reject) => {
        scrypt(password, salt, 64, (error, key) => {
            if (error)
                reject(error);
            else
                resolve(key);
        });
    });
}
export async function hashPassword(password) {
    const salt = randomBytes(16).toString('hex');
    const key = await deriveKey(password, salt);
    return `scrypt$${salt}$${key.toString('hex')}`;
}
export async function verifyPassword(password, storedHash) {
    const [algorithm, salt, keyHex] = storedHash.split('$');
    if (algorithm !== 'scrypt' || !salt || !keyHex || !/^[\da-f]+$/i.test(keyHex))
        return false;
    const expected = Buffer.from(keyHex, 'hex');
    const actual = await deriveKey(password, salt);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
}
//# sourceMappingURL=password.js.map