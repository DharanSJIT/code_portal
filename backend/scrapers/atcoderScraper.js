// backend/scrapers/atcoderScraper.js
import puppeteer from 'puppeteer';
import logger from '../utils/logger.js';

const atcoderScraper = async (url) => {
  try {
    logger.info(`Starting AtCoder scraping for URL: ${url}`);
    
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
      // These selectors need to be updated based on actual AtCoder page structure
      const ratingSpan = document.querySelector('table.dl-table span.user-green')
        || document.querySelector('table.dl-table span.user-cyan')
        || document.querySelector('table.dl-table span.user-blue')
        || document.querySelector('table.dl-table span.user-yellow')
        || document.querySelector('table.dl-table span.user-orange')
        || document.querySelector('table.dl-table span.user-red')
        || document.querySelector('table.dl-table span.user-brown')
        || document.querySelector('table.dl-table span.user-gray');
        
      const rating = ratingSpan?.innerText || 'N/A';
      
      // Determine rank based on rating
      let rank = 'Unrated';
      if (rating !== 'N/A') {
        const ratingNum = parseInt(rating);
        if (ratingNum < 400) rank = 'Gray';
        else if (ratingNum < 800) rank = 'Brown';
        else if (ratingNum < 1200) rank = 'Green';
        else if (ratingNum < 1600) rank = 'Cyan';
        else if (ratingNum < 2000) rank = 'Blue';
        else if (ratingNum < 2400) rank = 'Yellow';
        else if (ratingNum < 2800) rank = 'Orange';
        else rank = 'Red';
      }
      
      // Count problems
      // This would need to be adjusted based on actual page structure
      let problemsSolved = '0';
      const problemsText = document.querySelector('div.panel-body p:contains("Accepted")');
      if (problemsText) {
        const match = problemsText.innerText.match(/(\d+)/);
        if (match && match[1]) {
          problemsSolved = match[1];
        }
      }
      
      // Get highest rating
      let highestRating = rating;
      const highestRatingText = document.querySelector('div.panel-body p:contains("Highest Rating")');
      if (highestRatingText) {
        const match = highestRatingText.innerText.match(/(\d+)/);
        if (match && match[1]) {
          highestRating = match[1];
        }
      }
      
      return {
        rating,
        rank,
        problemsSolved,
        highestRating
      };
    });
    
    await browser.close();
    
    // Compile the final data object
    const atcoderData = {
      username,
      rating: data.rating,
      rank: data.rank,
      problemsSolved: data.problemsSolved,
      highestRating: data.highestRating,
      lastUpdated: new Date().toISOString()
    };
    
    logger.info(`Completed AtCoder scraping for user: ${username}`);
    return atcoderData;
    
  } catch (error) {
    logger.error('Error in AtCoder scraper:', error);
    throw new Error(`AtCoder scraping error: ${error.message}`);
  }
};

export default atcoderScraper;
