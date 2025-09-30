// backend/scrapers/githubScraper.js
import puppeteer from 'puppeteer';
import logger from '../utils/logger.js';

const githubScraper = async (url) => {
  try {
    logger.info(`Starting GitHub scraping for URL: ${url}`);
    
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
      // These selectors need to be updated based on actual GitHub page structure
      
      // Get repositories count
      const repoCountText = document.querySelector('nav.UnderlineNav-body a[href$="/repositories"] span')?.innerText || '0';
      const repositories = repoCountText.replace(/,/g, '').trim();
      
      // Get followers count
      const followersText = document.querySelector('a[href$="/followers"] span')?.innerText || '0';
      const followers = followersText.replace(/,/g, '').trim();
      
      // Get following count
      const followingText = document.querySelector('a[href$="/following"] span')?.innerText || '0';
      const following = followingText.replace(/,/g, '').trim();
      
      // Get contributions (from contribution graph)
      let contributions = '0';
      const contributionsText = document.querySelector('.js-yearly-contributions h2')?.innerText;
      if (contributionsText) {
        const match = contributionsText.match(/(\d+)/);
        if (match && match[1]) {
          contributions = match[1].replace(/,/g, '');
        }
      }
      
      // Get stars (from pinned repositories)
      let stars = 0;
      const starElements = document.querySelectorAll('div.pinned-item-list-item .pinned-item-meta');
      starElements.forEach(el => {
        if (el.innerText.includes('★')) {
          const starCount = el.innerText.replace('★', '').replace(/,/g, '').trim();
          stars += parseInt(starCount) || 0;
        }
      });
      
      return {
        repositories,
        followers,
        following,
        contributions,
        stars: stars.toString()
      };
    });
    
    await browser.close();
    
    // Compile the final data object
    const githubData = {
      username,
      repositories: parseInt(data.repositories) || 0,
      followers: parseInt(data.followers) || 0,
      following: parseInt(data.following) || 0,
      contributions: parseInt(data.contributions) || 0,
      stars: parseInt(data.stars) || 0,
      lastUpdated: new Date().toISOString()
    };
    
    logger.info(`Completed GitHub scraping for user: ${username}`);
    return githubData;
    
  } catch (error) {
    logger.error('Error in GitHub scraper:', error);
    throw new Error(`GitHub scraping error: ${error.message}`);
  }
};

export default githubScraper;
