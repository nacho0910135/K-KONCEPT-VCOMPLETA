const assert = require('node:assert/strict');
const test = require('node:test');
const { kpiFilterSchema, reportExportSchema, scheduledReportSchema, scheduledReportUpdateSchema } = require('../src/validators/report.validator');

test('reports reject inverted dates for KPIs, exports and scheduled reports', () => {
  const inverted = { dateFrom: '2026-10-20', dateTo: '2026-10-01' };
  const valid = { dateFrom: '2026-10-01', dateTo: '2026-10-20' };
  for (const range of [valid, {}, { dateFrom: '2026-10-01' }, { dateTo: '2026-10-20' }]) {
    assert.equal(kpiFilterSchema.safeParse(range).success, true);
    assert.equal(reportExportSchema.safeParse({ reportType: 'KPI_OVERVIEW', filters: range }).success, true);
  }
  assert.equal(kpiFilterSchema.safeParse(inverted).success, false);
  assert.equal(reportExportSchema.safeParse({ reportType: 'KPI_OVERVIEW', filters: inverted }).success, false);
  assert.equal(reportExportSchema.safeParse({ reportType: 'AUDIT', filters: { dateTo: 'invalid' } }).success, false);
  assert.equal(scheduledReportSchema.safeParse({ name: 'Resumen', reportType: 'KPI_OVERVIEW', format: 'PDF', frequency: 'WEEKLY', recipients: ['qa@example.com'], parameters: inverted }).success, false);
  assert.equal(scheduledReportUpdateSchema.safeParse({ parameters: inverted }).success, false);
});

test('client mutations return entities that can replace rows without reloading', async () => {
  const { createServer } = await import('vite');
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  try {
    const { default: api } = await server.ssrLoadModule('/src/services/api.js');
    const user = { id: 'user-1', name: 'Tecnico', email: 'qa@example.com', role: 'TECHNICIAN', active: true };
    const sla = { id: 'sla-2', name: 'SLA', maxResponseHours: 1, maxResolutionHours: 8 };
    const scheduledReport = { id: 'report-1', name: 'Resumen', active: true };
    api.defaults.adapter = async (config) => ({
      data: { success: true, data: config.url.startsWith('/users') ? { user } : config.url.startsWith('/slas') ? { sla } : { scheduledReport } },
      status: 200, statusText: 'OK', headers: {}, config
    });
    const users = await server.ssrLoadModule('/src/services/users.service.js');
    for (const name of ['getUserById', 'createUser', 'updateUser', 'updateMyProfile', 'updateUserRole', 'deactivateUser', 'activateUser']) {
      assert.deepEqual(await users[name]('user-1', 'TECHNICIAN'), user, name);
    }
    const admin = await server.ssrLoadModule('/src/services/admin.client.service.js');
    for (const name of ['createSla', 'updateSla', 'deleteSla']) assert.deepEqual(await admin[name]('sla-1', {}), sla, name);
    for (const name of ['createScheduledReport', 'updateScheduledReport', 'toggleScheduledReport', 'deleteScheduledReport']) {
      assert.deepEqual(await admin[name]('report-1', {}), scheduledReport, name);
    }
    const { dateRangeSchema, passwordResetSchema } = await server.ssrLoadModule('/src/utils/validators.js');
    for (const password of ['', 'short', 'lowercase1', 'NoNumbers']) {
      assert.equal(passwordResetSchema.shape.password.safeParse(password).success, false);
    }
    assert.equal(passwordResetSchema.shape.password.safeParse('ValidPass1').success, true);
    assert.equal(dateRangeSchema.safeParse({ dateFrom: '2026-10-20', dateTo: '2026-10-01' }).success, false);
    assert.equal(dateRangeSchema.safeParse({ dateFrom: '', dateTo: '' }).success, true);
    const { getErrorMessage } = await server.ssrLoadModule('/src/utils/errorHandler.js');
    assert.equal(getErrorMessage({ response: { data: { message: 'Valor duplicado', errors: [{ target: ['event'] }] } } }), 'Valor duplicado');
  } finally {
    await server.close();
  }
});

test('preview serves security headers for the app, deep links and assets', async () => {
  const { build, preview } = await import('vite');
  await build({ logLevel: 'silent' });
  const server = await preview({ preview: { host: '127.0.0.1', port: 0, open: false } });
  try {
    const base = `http://127.0.0.1:${server.httpServer.address().port}`;
    const response = await fetch(base);
    const html = await response.text();
    assert.doesNotMatch(html, /https:\/\/fonts\.(googleapis|gstatic)\.com/);
    const asset = html.match(/src="([^\"]+\.js)"/)[1];
    for (const path of ['/', '/admin/usuarios', asset, '/missing.js']) {
      const res = await fetch(base + path);
      assert.equal(res.headers.get('x-frame-options'), 'DENY', path);
      assert.equal(res.headers.get('x-content-type-options'), 'nosniff', path);
      assert.equal(res.headers.get('strict-transport-security'), 'max-age=31536000', path);
      assert.match(res.headers.get('content-security-policy'), /frame-ancestors 'none'/, path);
      assert.match(res.headers.get('content-security-policy'), /script-src 'self';/, path);
    }
  } finally {
    await server.close();
  }
});
