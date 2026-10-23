import { pbkdf2 } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';

export const PASSWORD_ITERATIONS = 600000;
export function digest(value) { return bytesToHex(sha256(utf8ToBytes(String(value)))); }
export function createPasswordRecord(password, salt, iterations = PASSWORD_ITERATIONS) {
  return { salt, iterations, hash: bytesToHex(pbkdf2(sha256, utf8ToBytes(password), utf8ToBytes(salt), { c: iterations, dkLen: 32 })) };
}
export function verifyPassword(password, record) {
  if (!record || typeof password !== 'string' || password.length > 256 || !Number.isInteger(record.iterations) || record.iterations < 1000 || record.iterations > PASSWORD_ITERATIONS) return false;
  const candidate = createPasswordRecord(password, record.salt, record.iterations).hash;
  let difference = candidate.length ^ record.hash.length;
  for (let i = 0; i < candidate.length; i++) difference |= candidate.charCodeAt(i) ^ record.hash.charCodeAt(i);
  return difference === 0;
}
export function safeCsvCell(value) {
  const text = String(value ?? '');
  return /^[\s]*[=+\-@\t\r]/.test(text) || /^[\t\r]/.test(text) ? "'" + text : text;
}
