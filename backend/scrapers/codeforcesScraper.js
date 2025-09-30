// backend/scrapers/codeforcesScraper.js
import puppeteer from 'puppeteer';
import logger from '../utils/logger.js';

const codeforcesScraper = async (url) => {
  try {
    logger.info(`Starting Codeforces scraping for URL: ${url}`);
    
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
      // These selectors need to be updated based on actual Codeforces page structure
      const rating = document.querySelector('.user-rank span')?.innerText || 'N/A';
      const rank = document.querySelector('.user-rank')?.innerText.split(' ')[0] || 'N/A';
      
      // Count problems from submissions table
      let problemsSolved = 0;
      const submissionRows = document.querySelectorAll('div.datatable table.user-contests-table tbody tr');
      
      // This is a simplified example and may need adjustment
      if (submissionRows.length > 0) {
        const uniqueProblems = new Set();
        submissionRows.forEach(row => {
          const verdict = row.querySelector('td:nth-child(6)')?.innerText;
          if (verdict === 'Accepted') {
            const problemId = row.querySelector('td:nth-child(4) a')?.innerText;
            if (problemId) uniqueProblems.add(problemId);
          }
        });
        problemsSolved = uniqueProblems.size;
      }
      
      // Count contest participation
      const contestParticipation = document.querySelectorAll('div.user-ratings table tbody tr').length;
      
      return {
        rating,
        rank,
        problemsSolved: problemsSolved.toString(),
        contestParticipation: contestParticipation.toString()
      };
    });
    
    await browser.close();
    
    // Compile the final data object
    const codeforcesData = {
      username,
      rating: data.rating,
      rank: data.rank,
      problemsSolved: data.problemsSolved,
      contestParticipation: data.contestParticipation,
      lastUpdated: new Date().toISOString()
    };
    
    logger.info(`Completed Codeforces scraping for user: ${username}`);
    return codeforcesData;
    
  } catch (error) {
    logger.error('Error in Codeforces scraper:', error);
    throw new Error(`Codeforces scraping error: ${error.message}`);
  }
};

export default codeforcesScraper;
