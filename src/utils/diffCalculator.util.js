const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);

const normalize = (value) => value instanceof Date ? value.toISOString() : value;

const calculateDiff = (previous = {}, current = {}) => {
  const added = {};
  const removed = {};
  const modified = {};
  const keys = new Set([...Object.keys(previous || {}), ...Object.keys(current || {})]);

  for (const key of keys) {
    const before = normalize(previous?.[key]);
    const after = normalize(current?.[key]);

    if (before === undefined && after !== undefined) {
      added[key] = after;
      continue;
    }

    if (before !== undefined && after === undefined) {
      removed[key] = before;
      continue;
    }

    if (isObject(before) && isObject(after)) {
      const nested = calculateDiff(before, after);
      if (Object.keys(nested.added).length || Object.keys(nested.removed).length || Object.keys(nested.modified).length) {
        modified[key] = nested;
      }
      continue;
    }

    if (JSON.stringify(before) !== JSON.stringify(after)) {
      modified[key] = { from: before, to: after };
    }
  }

  return { added, removed, modified };
};

module.exports = { calculateDiff };
