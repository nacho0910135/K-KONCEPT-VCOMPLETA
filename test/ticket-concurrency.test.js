const assert = require('node:assert/strict');
const test = require('node:test');
const { changeStatusSchema, updateDiagnosisSchema } = require('../src/validators/ticket.validator');

test('status and diagnosis saves require the loaded revision', () => {
  assert.equal(changeStatusSchema.safeParse({ status: 'PENDING', comment: 'Revisando' }).success, false);
  assert.equal(updateDiagnosisSchema.safeParse({ diagnosis: 'Diagnóstico nuevo' }).success, false);
  assert.equal(changeStatusSchema.safeParse({ status: 'PENDING', comment: 'Revisando', expectedUpdatedAt: '2026-09-28T12:00:00.000Z' }).success, true);
});

test('ticket updates compare the revision atomically with the write', async () => {
  const databasePath = require.resolve('../src/config/database');
  const original = require.cache[databasePath];
  const writes = [];
  require.cache[databasePath] = { exports: { prisma: { ticket: { update: async (query) => { writes.push(query); return query; } } } } };
  try {
    const { ticketRepository } = require('../src/repositories/ticket.repository');
    const revision = new Date('2026-09-28T12:00:00.000Z');
    await ticketRepository.updateStatusWithHistory('ticket-1', { status: 'PENDING' }, { newStatus: 'PENDING' }, revision);
    await ticketRepository.update('ticket-1', { diagnosis: 'Nuevo' }, revision);
    assert.deepEqual(writes.map(({ where }) => where), [{ id: 'ticket-1', updatedAt: revision }, { id: 'ticket-1', updatedAt: revision }]);
    assert.deepEqual(writes[0].data.statusHistories.create, { newStatus: 'PENDING' });
  } finally {
    if (original) require.cache[databasePath] = original;
    else delete require.cache[databasePath];
  }
});
