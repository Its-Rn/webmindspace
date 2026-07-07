const stripNested = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(stripNested);
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('$') || key.includes('.')) continue;
    sanitized[key] = stripNested(value);
  }
  return sanitized;
};

export const sanitize = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = stripNested(req.body);
  }
  next();
};
