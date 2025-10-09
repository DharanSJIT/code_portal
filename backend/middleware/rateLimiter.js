// backend/middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';

// Create a rate limiter for the API endpoints
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests, please try again later.'
    });
  }
});

// Default export
export default apiLimiter;