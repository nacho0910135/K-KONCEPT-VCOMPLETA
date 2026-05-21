const { slaRepository } = require('../repositories/sla.repository');

const SOURCE_BY_MATCH = {
  clientId: 'CLIENT',
  categoryId: 'CATEGORY',
  priority: 'PRIORITY'
};

const pickLatest = (slas, field, value) => {
  if (!value) return null;
  return slas.find((sla) => sla[field] === value) || null;
};

const resolveApplicableSLA = async ({ priority, categoryId, clientId }) => {
  if (!priority && !categoryId && !clientId) return null;

  const slas = await slaRepository.findApplicable({ priority, categoryId, clientId });

  const clientSla = pickLatest(slas, 'clientId', clientId);
  if (clientSla) return { sla: clientSla, source: SOURCE_BY_MATCH.clientId };

  const categorySla = pickLatest(slas, 'categoryId', categoryId);
  if (categorySla) return { sla: categorySla, source: SOURCE_BY_MATCH.categoryId };

  const prioritySla = pickLatest(slas, 'priority', priority);
  if (prioritySla) return { sla: prioritySla, source: SOURCE_BY_MATCH.priority };

  return null;
};

module.exports = { resolveApplicableSLA };
