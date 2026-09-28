const assert = require('node:assert/strict');
const test = require('node:test');

test('ticket history reads diagnosis and evidence deletion events only for the case', async () => {
  const databasePath = require.resolve('../src/config/database');
  const previous = require.cache[databasePath];
  let query;
  require.cache[databasePath] = { exports: { prisma: { auditLog: { findMany: async (value) => { query = value; return []; } } } } };
  try {
    const { auditRepository } = require('../src/repositories/audit.repository');
    await auditRepository.findTicketEvents('case-1');
    assert.equal(query.where.entityId, 'case-1');
    assert.deepEqual(query.where.action.in, ['TICKET_UPDATED', 'EVIDENCE_DELETED']);
    assert.equal(query.where.result, 'SUCCESS');
  } finally {
    if (previous) require.cache[databasePath] = previous;
    else delete require.cache[databasePath];
  }
});
