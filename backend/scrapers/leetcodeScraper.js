// backend/scrapers/leetcodeScraper.js
import puppeteer from 'puppeteer';
import logger from '../utils/logger.js';

const leetcodeScraper = async (url) => {
  try {
    logger.info(`Starting LeetCode scraping for URL: ${url}`);
    
    // Launch browser
    const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Extract username from URL if not directly available
    const urlParts = url.split('/');
    const username = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
    
    // Extract data from the page
    const data = await page.evaluate(() => {
      // This depends on LeetCode's page structure
      // These are just examples and may need to be updated based on actual page structure
      const totalSolved = document.querySelector('.total-solved-container .total-solved-number')?.innerText || '0';
      const easySolved = document.querySelector('.difficulty-level-easy .difficulty-level-solved-count')?.innerText || '0';
      const mediumSolved = document.querySelector('.difficulty-level-medium .difficulty-level-solved-count')?.innerText || '0';
      const hardSolved = document.querySelector('.difficulty-level-hard .difficulty-level-solved-count')?.innerText || '0';
      const acceptanceRate = document.querySelector('.acceptance-rate-value')?.innerText || '0%';
      const streak = document.querySelector('.streak-count')?.innerText || '0';
      const rank = document.querySelector('.world-ranking-value')?.innerText || 'N/A';
      
      return {
        totalSolved,
        easySolved, 
        mediumSolved,
        hardSolved,
        acceptanceRate,
        streak,
        rank
      };
    });
    
    await browser.close();
    
    // Compile the final data object
    const leetcodeData = {
      username,
      totalSolved: data.totalSolved,
      easySolved: data.easySolved,
      mediumSolved: data.mediumSolved,
      hardSolved: data.hardSolved,
      acceptanceRate: data.acceptanceRate,
      streak: parseInt(data.streak) || 0,
      rank: data.rank,
      lastUpdated: new Date().toISOString()
    };
    
    logger.info(`Completed LeetCode scraping for user: ${username}`);
    return leetcodeData;
    
  } catch (error) {
    logger.error('Error in LeetCode scraper:', error);
    throw new Error(`LeetCode scraping error: ${error.message}`);
  }
};

export default leetcodeScraper;
