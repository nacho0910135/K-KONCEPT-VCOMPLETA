const assert = require('node:assert/strict');
const test = require('node:test');

test('changing profile email requires the current password and a free address', async () => {
  const actor = { id: 'user-1', email: 'old@example.com', name: 'Usuario' };
  let updated;
  let invalidated;
  let occupied = false;
  const mocks = [
    ['../src/repositories/user.repository', { userRepository: {
      findById: async () => actor,
      findByEmail: async () => occupied ? { id: 'other' } : null,
      update: async (_id, data, invalidateChallenges) => { updated = data; invalidated = invalidateChallenges; return { ...actor, ...data }; }
    } }],
    ['../src/repositories/auth.repository', { authRepository: { findByIdWithPassword: async () => ({ password: 'stored' }) } }],
    ['../src/services/audit.service', { auditService: { record: async () => {} } }],
    ['../src/services/notification.service', { notificationService: {} }],
    ['../src/utils/password.util', { comparePassword: async (value) => value === 'correct', hashPassword: async () => 'stored' }]
  ];
  const originals = mocks.map(([path]) => require.cache[require.resolve(path)]);
  mocks.forEach(([path, exports]) => { require.cache[require.resolve(path)] = { exports }; });
  try {
    const { userService } = require('../src/services/user.service');
    await assert.rejects(userService.updateMe({ email: 'new@example.com' }, actor));
    await assert.rejects(userService.updateMe({ email: 'new@example.com', currentPassword: 'wrong' }, actor));
    occupied = true;
    await assert.rejects(userService.updateMe({ email: 'new@example.com', currentPassword: 'correct' }, actor));
    occupied = false;
    const result = await userService.updateMe({ email: 'new@example.com', currentPassword: 'correct' }, actor);
    assert.equal(result.email, 'new@example.com');
    assert.deepEqual(updated, { email: 'new@example.com' });
    assert.equal(invalidated, true);
  } finally {
    mocks.forEach(([path], index) => { const resolved = require.resolve(path); if (originals[index]) require.cache[resolved] = originals[index]; else delete require.cache[resolved]; });
  }
});
