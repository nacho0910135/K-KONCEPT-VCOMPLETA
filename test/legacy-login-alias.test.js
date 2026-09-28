const assert = require('node:assert/strict');
const test = require('node:test');

test('legacy login addresses resolve the canonical account and are unavailable for new users', async () => {
  const legacy = 'admin@kollabkoncepts.com';
  const canonical = '1josemendezporras@gmail.com';
  const user = { id: 'admin-1', email: canonical, loginAlias: legacy };
  const databasePath = require.resolve('../src/config/database');
  const authPath = require.resolve('../src/repositories/auth.repository');
  const usersPath = require.resolve('../src/repositories/user.repository');
  const originals = [databasePath, authPath, usersPath].map((path) => require.cache[path]);
  require.cache[databasePath] = { exports: { prisma: { user: { findFirst: async ({ where }) => {
    assert.deepEqual(where, { OR: [{ email: legacy }, { loginAlias: legacy }] });
    return user;
  } } } } };
  delete require.cache[authPath];
  delete require.cache[usersPath];
  try {
    const { authRepository } = require('../src/repositories/auth.repository');
    const { userRepository } = require('../src/repositories/user.repository');
    assert.equal((await authRepository.findByEmail(legacy)).email, canonical);
    assert.equal((await userRepository.findByEmail(legacy)).email, canonical);
  } finally {
    [databasePath, authPath, usersPath].forEach((path, index) => {
      if (originals[index]) require.cache[path] = originals[index];
      else delete require.cache[path];
    });
  }
});
