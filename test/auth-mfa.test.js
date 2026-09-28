const assert = require('node:assert/strict');
const test = require('node:test');

test('password alone issues no session; authenticator and email codes complete separate challenges', async () => {
  const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
  const { codeAtStep, encryptSecret } = require('../src/utils/totp.util');
  const user = { id: 'user-1', email: 'test@example.com', password: 'hashed', active: true, role: 'CLIENT', totpSecret: encryptSecret(secret), totpLastStep: null };
  const challenge = { id: 'challenge-1', userId: user.id, expiresAt: new Date(Date.now() + 600000), usedAt: null, attempts: 0 };
  let refreshTokens = 0;
  let emailedCode;
  const fakePrisma = {
    loginChallenge: {
      updateMany: async ({ data }) => { if (data.usedAt && challenge.usedAt) return { count: 0 }; Object.assign(challenge, { ...data, sendCount: typeof data.sendCount === 'object' ? challenge.sendCount + 1 : challenge.sendCount }); return { count: 1 }; },
      create: async () => { Object.assign(challenge, { usedAt: null, codeHash: null, sentAt: null, sendCount: 0 }); return challenge; },
      findUnique: async () => challenge,
      aggregate: async () => ({ _sum: { sendCount: 0 } })
    },
    $transaction: async (work) => work({
      user: { updateMany: async ({ data }) => { user.totpLastStep = data.totpLastStep; return { count: 1 }; } },
      loginChallenge: fakePrisma.loginChallenge
    })
  };
  const mocks = [
    ['../src/config/database', { prisma: fakePrisma }],
    ['../src/repositories/auth.repository', { authRepository: { findByEmail: async () => user, findByIdWithPassword: async () => user, updateLastLogin: async () => ({ id: user.id, email: user.email, role: user.role }) } }],
    ['../src/repositories/refreshToken.repository', { refreshTokenRepository: { create: async () => { refreshTokens += 1; } } }],
    ['../src/services/audit.service', { auditService: { logEvent: async () => {}, record: async () => {} } }],
    ['../src/utils/password.util', { comparePassword: async (password) => password === 'correct', hashPassword: async () => 'hashed' }],
    ['../src/services/transactionalEmail.service', { transactionalEmailService: { sendLoginCodeEmail: async (_user, code) => { emailedCode = code; } } }]
  ];
  const originals = mocks.map(([path]) => require.cache[require.resolve(path)]);
  mocks.forEach(([path, exports]) => { require.cache[require.resolve(path)] = { exports }; });
  try {
    const { authService } = require('../src/services/auth.service');
    const first = await authService.login({ email: user.email, password: 'correct' }, {});
    assert.deepEqual(first.methods, ['email', 'authenticator']);
    assert.equal(first.accessToken, undefined);
    assert.equal(refreshTokens, 0);
    const code = codeAtStep(secret, Math.floor(Date.now() / 30000));
    const session = await authService.verifyLogin({ challengeId: challenge.id, method: 'authenticator', code });
    assert.ok(session.accessToken);
    assert.equal(refreshTokens, 1);
    await assert.rejects(authService.verifyLogin({ challengeId: challenge.id, method: 'authenticator', code }));
    const second = await authService.login({ email: user.email, password: 'correct' }, {});
    assert.equal(second.accessToken, undefined);
    await authService.sendLoginEmailCode({ challengeId: challenge.id });
    const emailSession = await authService.verifyLogin({ challengeId: challenge.id, method: 'email', code: emailedCode });
    assert.ok(emailSession.accessToken);
    assert.equal(refreshTokens, 2);
  } finally {
    mocks.forEach(([path], index) => { const resolved = require.resolve(path); if (originals[index]) require.cache[resolved] = originals[index]; else delete require.cache[resolved]; });
  }
});
