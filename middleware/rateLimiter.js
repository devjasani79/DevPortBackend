// Simple in-memory rate limiter
const rateLimiter = (() => {
  const requests = new Map();
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 minutes
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Clean up old entries
    for (const [key, data] of requests.entries()) {
      if (now - data.firstRequest > windowMs) {
        requests.delete(key);
      }
    }
    
    const clientData = requests.get(clientId);
    
    if (!clientData) {
      // First request from this client
      requests.set(clientId, {
        count: 1,
        firstRequest: now,
        lastRequest: now
      });
      return next();
    }
    
    // Check if window has expired
    if (now - clientData.firstRequest > windowMs) {
      // Reset window
      requests.set(clientId, {
        count: 1,
        firstRequest: now,
        lastRequest: now
      });
      return next();
    }
    
    // Check if limit exceeded
    if (clientData.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later',
        retryAfter: Math.ceil((clientData.firstRequest + windowMs - now) / 1000)
      });
    }
    
    // Update count
    clientData.count++;
    clientData.lastRequest = now;
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - clientData.count));
    res.setHeader('X-RateLimit-Reset', new Date(clientData.firstRequest + windowMs).toISOString());
    
    next();
  };
})();

module.exports = rateLimiter;
