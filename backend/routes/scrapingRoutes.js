// backend/routes/scrapingRoutes.js
import express from 'express';
import scrapingController from '../controllers/scrapingController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import rateLimiter from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply rate limiting to all routes
router.use(rateLimiter);

// Apply authentication to all routes
router.use(verifyToken);

// Routes for scraping different platforms
router.post('/leetcode', scrapingController.scrapeLeetcode);
router.post('/codeforces', scrapingController.scrapeCodeforces);
router.post('/atcoder', scrapingController.scrapeAtcoder);
router.post('/hackerrank', scrapingController.scrapeHackerrank);
router.post('/github', scrapingController.scrapeGithub);

// Route to scrape all platforms for a user
router.post('/all', scrapingController.scrapeAll);

// Route to get the scraping status
router.get('/status/:userId', scrapingController.getScrapingStatus);

export default router;
