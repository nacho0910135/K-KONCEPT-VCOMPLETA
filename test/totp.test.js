const assert = require('node:assert/strict');
const test = require('node:test');
const { codeAtStep, decryptSecret, encryptSecret, generateSecret, matchingStep, setupUri } = require('../src/utils/totp.util');

test('Google Authenticator compatible six-digit TOTP and encrypted setup secret', () => {
  assert.equal(codeAtStep('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', 1), '287082');
  const secret = generateSecret();
  assert.equal(decryptSecret(encryptSecret(secret)), secret);
  const now = 90_000;
  const code = codeAtStep(secret, 3);
  assert.equal(matchingStep(secret, code, now), 3);
  assert.equal(matchingStep(secret, code, now + 60_000), null);
  assert.match(setupUri('user@example.com', secret), /issuer=Kollab%20Koncepts/);
});
