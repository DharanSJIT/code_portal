// backend/utils/browser.js
import puppeteer from 'puppeteer';
import logger from './logger.js';

let browser = null;
let browserCount = 0;

// Function to get a browser instance
export const getBrowser = async () => {
  try {
    if (!browser) {
      logger.info('Launching new browser instance');
      browser = await puppeteer.launch({
        headless: 'new',  // Use new headless mode
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920,1080',
        ],
        defaultViewport: {
          width: 1920,
          height: 1080
        }
      });
    }
    
    browserCount++;
    return browser;
  } catch (error) {
    logger.error('Error launching browser:', error);
    throw error;
  }
};

// Function to close the browser instance
export const closeBrowser = async () => {
  try {
    browserCount--;
    
    // Only close the browser if no pages are using it
    if (browserCount <= 0 && browser) {
      logger.info('Closing browser instance');
      await browser.close();
      browser = null;
      browserCount = 0;
    }
  } catch (error) {
    logger.error('Error closing browser:', error);
    browser = null;
    browserCount = 0;
    throw error;
  }
};

export default { getBrowser, closeBrowser };