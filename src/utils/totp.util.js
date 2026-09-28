const crypto = require('crypto');
const { env } = require('../config/env');

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const key = crypto.createHash('sha256').update(env.jwt.secret).digest();
const encodeBase32 = (bytes) => {
  let bits = 0;
  let value = 0;
  let result = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      result += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits) result += alphabet[(value << (5 - bits)) & 31];
  return result;
};
const decodeBase32 = (secret) => {
  let bits = 0;
  let value = 0;
  const bytes = [];
  for (const char of secret.replace(/\s/g, '').toUpperCase()) {
    const digit = alphabet.indexOf(char);
    if (digit < 0) throw new Error('Secreto TOTP invalido');
    value = (value << 5) | digit;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
};

const generateSecret = () => encodeBase32(crypto.randomBytes(20));
const encryptSecret = (secret) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString('base64url')).join('.');
};
const decryptSecret = (encrypted) => {
  const [iv, tag, ciphertext] = encrypted.split('.').map((part) => Buffer.from(part, 'base64url'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
};
const codeAtStep = (secret, step) => {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const digest = crypto.createHmac('sha1', decodeBase32(secret)).update(counter).digest();
  const offset = digest[19] & 15;
  return ((digest.readUInt32BE(offset) & 0x7fffffff) % 1000000).toString().padStart(6, '0');
};
const matchingStep = (secret, code, now = Date.now()) => {
  if (!/^\d{6}$/.test(code)) return null;
  const current = Math.floor(now / 30000);
  for (const step of [current, current - 1, current + 1]) {
    if (crypto.timingSafeEqual(Buffer.from(codeAtStep(secret, step)), Buffer.from(code))) return step;
  }
  return null;
};
const setupUri = (email, secret) => `otpauth://totp/${encodeURIComponent(`Kollab Koncepts:${email}`)}?secret=${secret}&issuer=${encodeURIComponent('Kollab Koncepts')}&algorithm=SHA1&digits=6&period=30`;

module.exports = { generateSecret, encryptSecret, decryptSecret, matchingStep, setupUri, codeAtStep };
