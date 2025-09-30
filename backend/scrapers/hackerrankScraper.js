// backend/scrapers/hackerrankScraper.js
import puppeteer from 'puppeteer';
import logger from '../utils/logger.js';

const hackerrankScraper = async (url) => {
  try {
    logger.info(`Starting HackerRank scraping for URL: ${url}`);
    
    // Launch browser
    const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Extract username from URL
    const urlParts = url.split('/');
    const username = urlParts[urlParts.length - 1];
    
    // Extract data from the page
    const data = await page.evaluate(() => {
      // These selectors need to be updated based on actual HackerRank page structure
      
      // Get problem solved count
      let problemsSolved = '0';
      const statsElements = document.querySelectorAll('div.profile-stat-item');
      statsElements.forEach(el => {
        const label = el.querySelector('.stat-label')?.innerText;
        if (label && label.includes('Solved')) {
          problemsSolved = el.querySelector('.stat-value')?.innerText || '0';
        }
      });
      
      // Get badges
      const badges = [];
      const badgeElements = document.querySelectorAll('div.badge-card');
      badgeElements.forEach(el => {
        const badgeName = el.querySelector('.badge-title')?.innerText;
        if (badgeName) badges.push(badgeName);
      });
      
      // Get certifications
      const certifications = [];
      const certElements = document.querySelectorAll('div.certification-card');
      certElements.forEach(el => {
        const certName = el.querySelector('.cert-title')?.innerText;
        if (certName) certifications.push(certName);
      });
      
      return {
        problemsSolved,
        badges,
        certifications
      };
    });
    
    await browser.close();
    
    // Compile the final data object
    const hackerrankData = {
      username,
      problemsSolved: data.problemsSolved,
      badges: data.badges,
      certifications: data.certifications,
      lastUpdated: new Date().toISOString()
    };
    
    logger.info(`Completed HackerRank scraping for user: ${username}`);
    return hackerrankData;
    
  } catch (error) {
    logger.error('Error in HackerRank scraper:', error);
    throw new Error(`HackerRank scraping error: ${error.message}`);
  }
};

export default hackerrankScraper;
