/**
 * Simple in-memory caching middleware.
 * Keyed by user's collegeId + request URL to prevent data leaks across college tenants.
 */
const cache = new Map();

const cacheMiddleware = (ttlSeconds = 300) => (req, res, next) => {
  // If the user is not authenticated or lacks a collegeId, fall back to "global"
  const tenantId = req.user?.collegeId || "global";
  const key = `${tenantId}-${req.originalUrl}`;
  
  const cached = cache.get(key);
  if (cached && Date.now() - cached.time < ttlSeconds * 1000) {
    return res.json(cached.data);
  }
  
  // Intercept res.json to capture response payload
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    // Only cache successful JSON payloads
    if (res.statusCode >= 200 && res.statusCode < 300) {
      cache.set(key, { data, time: Date.now() });
    }
    return originalJson(data);
  };
  
  next();
};

const clearCache = (tenantId) => {
  if (!tenantId) {
    cache.clear();
    return;
  }
  const tenantStr = tenantId.toString();
  for (const key of cache.keys()) {
    if (key.startsWith(`${tenantStr}-`)) {
      cache.delete(key);
    }
  }
};

cacheMiddleware.clearCache = clearCache;

module.exports = cacheMiddleware;
