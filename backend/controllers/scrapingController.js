// backend/controllers/scrapingController.js
import { db } from '../config/firebase.js';
import * as scrapers from '../scrapers/index.js';
import logger from '../utils/logger.js';

// Helper function to update the user document with scraped data
const updateUserData = async (userId, platform, data) => {
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      throw new Error('User document does not exist');
    }

    const platformData = userDoc.data().platformData || {};
    
    await userRef.update({
      [`platformData.${platform}`]: data,
      lastUpdated: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    logger.error(`Error updating user data for ${platform}:`, error);
    throw error;
  }
};

// Controller for scraping LeetCode
const scrapeLeetcode = async (req, res) => {
  try {
    const { userId, url } = req.body;
    
    if (!userId || !url) {
      return res.status(400).json({ error: 'User ID and URL are required' });
    }

    // Update scraping status
    await db.collection('users').doc(userId).update({
      scrapingStatus: {
        leetcode: 'in_progress',
        lastUpdated: new Date().toISOString()
      }
    });

    // Start the scraping
    const data = await scrapers.leetcodeScraper(url);
    
    // Update user document with the scraped data
    await updateUserData(userId, 'leetcode', data);
    
    // Update scraping status
    await db.collection('users').doc(userId).update({
      'scrapingStatus.leetcode': 'completed'
    });

    return res.status(200).json(data);
  } catch (error) {
    logger.error('Error scraping LeetCode:', error);
    
    // Update scraping status to failed
    if (req.body && req.body.userId) {
      await db.collection('users').doc(req.body.userId).update({
        'scrapingStatus.leetcode': 'failed'
      }).catch(err => logger.error('Error updating status:', err));
    }

    return res.status(500).json({ error: error.message });
  }
};

// Controller for scraping Codeforces
const scrapeCodeforces = async (req, res) => {
  try {
    const { userId, url } = req.body;
    
    if (!userId || !url) {
      return res.status(400).json({ error: 'User ID and URL are required' });
    }

    // Update scraping status
    await db.collection('users').doc(userId).update({
      scrapingStatus: {
        codeforces: 'in_progress',
        lastUpdated: new Date().toISOString()
      }
    });

    // Start the scraping
    const data = await scrapers.codeforcesScraper(url);
    
    // Update user document with the scraped data
    await updateUserData(userId, 'codeforces', data);
    
    // Update scraping status
    await db.collection('users').doc(userId).update({
      'scrapingStatus.codeforces': 'completed'
    });

    return res.status(200).json(data);
  } catch (error) {
    logger.error('Error scraping Codeforces:', error);
    
    // Update scraping status to failed
    if (req.body && req.body.userId) {
      await db.collection('users').doc(req.body.userId).update({
        'scrapingStatus.codeforces': 'failed'
      }).catch(err => logger.error('Error updating status:', err));
    }

    return res.status(500).json({ error: error.message });
  }
};

// Controller for scraping AtCoder
const scrapeAtcoder = async (req, res) => {
  try {
    const { userId, url } = req.body;
    
    if (!userId || !url) {
      return res.status(400).json({ error: 'User ID and URL are required' });
    }

    // Update scraping status
    await db.collection('users').doc(userId).update({
      scrapingStatus: {
        atcoder: 'in_progress',
        lastUpdated: new Date().toISOString()
      }
    });

    // Start the scraping
    const data = await scrapers.atcoderScraper(url);
    
    // Update user document with the scraped data
    await updateUserData(userId, 'atcoder', data);
    
    // Update scraping status
    await db.collection('users').doc(userId).update({
      'scrapingStatus.atcoder': 'completed'
    });

    return res.status(200).json(data);
  } catch (error) {
    logger.error('Error scraping AtCoder:', error);
    
    // Update scraping status to failed
    if (req.body && req.body.userId) {
      await db.collection('users').doc(req.body.userId).update({
        'scrapingStatus.atcoder': 'failed'
      }).catch(err => logger.error('Error updating status:', err));
    }

    return res.status(500).json({ error: error.message });
  }
};

// Controller for scraping HackerRank
const scrapeHackerrank = async (req, res) => {
  try {
    const { userId, url } = req.body;
    
    if (!userId || !url) {
      return res.status(400).json({ error: 'User ID and URL are required' });
    }

    // Update scraping status
    await db.collection('users').doc(userId).update({
      scrapingStatus: {
        hackerrank: 'in_progress',
        lastUpdated: new Date().toISOString()
      }
    });

    // Start the scraping
    const data = await scrapers.hackerrankScraper(url);
    
    // Update user document with the scraped data
    await updateUserData(userId, 'hackerrank', data);
    
    // Update scraping status
    await db.collection('users').doc(userId).update({
      'scrapingStatus.hackerrank': 'completed'
    });

    return res.status(200).json(data);
  } catch (error) {
    logger.error('Error scraping HackerRank:', error);
    
    // Update scraping status to failed
    if (req.body && req.body.userId) {
      await db.collection('users').doc(req.body.userId).update({
        'scrapingStatus.hackerrank': 'failed'
      }).catch(err => logger.error('Error updating status:', err));
    }

    return res.status(500).json({ error: error.message });
  }
};

// Controller for scraping GitHub
const scrapeGithub = async (req, res) => {
  try {
    const { userId, url } = req.body;
    
    if (!userId || !url) {
      return res.status(400).json({ error: 'User ID and URL are required' });
    }

    // Update scraping status
    await db.collection('users').doc(userId).update({
      scrapingStatus: {
        github: 'in_progress',
        lastUpdated: new Date().toISOString()
      }
    });

    // Start the scraping
    const data = await scrapers.githubScraper(url);
    
    // Update user document with the scraped data
    await updateUserData(userId, 'github', data);
    
    // Update scraping status
    await db.collection('users').doc(userId).update({
      'scrapingStatus.github': 'completed'
    });

    return res.status(200).json(data);
  } catch (error) {
    logger.error('Error scraping GitHub:', error);
    
    // Update scraping status to failed
    if (req.body && req.body.userId) {
      await db.collection('users').doc(req.body.userId).update({
        'scrapingStatus.github': 'failed'
      }).catch(err => logger.error('Error updating status:', err));
    }

    return res.status(500).json({ error: error.message });
  }
};

// Controller for scraping all platforms
const scrapeAll = async (req, res) => {
  try {
    const { userId, platformUrls } = req.body;
    
    if (!userId || !platformUrls) {
      return res.status(400).json({ error: 'User ID and platform URLs are required' });
    }

    // Initialize scraping status
    const scrapingStatus = {
      lastUpdated: new Date().toISOString()
    };

    // Start the scraping for each platform
    const results = {};
    
    // Update initial scraping status
    for (const platform in platformUrls) {
      if (platformUrls[platform]) {
        scrapingStatus[platform] = 'pending';
      }
    }
    
    await db.collection('users').doc(userId).update({ scrapingStatus });
    
    // Create array of scraping promises
    const scrapingPromises = [];
    
    // LeetCode
    if (platformUrls.leetcode) {
      const leetcodePromise = (async () => {
        try {
          await db.collection('users').doc(userId).update({
            'scrapingStatus.leetcode': 'in_progress'
          });
          
          const data = await scrapers.leetcodeScraper(platformUrls.leetcode);
          await updateUserData(userId, 'leetcode', data);
          
          await db.collection('users').doc(userId).update({
            'scrapingStatus.leetcode': 'completed'
          });
          
          return { platform: 'leetcode', data };
        } catch (error) {
          logger.error('Error scraping LeetCode:', error);
          
          await db.collection('users').doc(userId).update({
            'scrapingStatus.leetcode': 'failed'
          });
          
          return { platform: 'leetcode', error: error.message };
        }
      })();
      
      scrapingPromises.push(leetcodePromise);
    }
    
    // Codeforces
    if (platformUrls.codeforces) {
      const codeforcesPromise = (async () => {
        try {
          await db.collection('users').doc(userId).update({
            'scrapingStatus.codeforces': 'in_progress'
          });
          
          const data = await scrapers.codeforcesScraper(platformUrls.codeforces);
          await updateUserData(userId, 'codeforces', data);
          
          await db.collection('users').doc(userId).update({
            'scrapingStatus.codeforces': 'completed'
          });
          
          return { platform: 'codeforces', data };
        } catch (error) {
          logger.error('Error scraping Codeforces:', error);
          
          await db.collection('users').doc(userId).update({
            'scrapingStatus.codeforces': 'failed'
          });
          
          return { platform: 'codeforces', error: error.message };
        }
      })();
      
      scrapingPromises.push(codeforcesPromise);
    }
    
    // AtCoder
    if (platformUrls.atcoder) {
      const atcoderPromise = (async () => {
        try {
          await db.collection('users').doc(userId).update({
            'scrapingStatus.atcoder': 'in_progress'
          });
          
          const data = await scrapers.atcoderScraper(platformUrls.atcoder);
          await updateUserData(userId, 'atcoder', data);
          
          await db.collection('users').doc(userId).update({
            'scrapingStatus.atcoder': 'completed'
          });
          
          return { platform: 'atcoder', data };
        } catch (error) {
          logger.error('Error scraping AtCoder:', error);
          
          await db.collection('users').doc(userId).update({
            'scrapingStatus.atcoder': 'failed'
          });
          
          return { platform: 'atcoder', error: error.message };
        }
      })();
      
      scrapingPromises.push(atcoderPromise);
    }
    
    // HackerRank
    if (platformUrls.hackerrank) {
      const hackerrankPromise = (async () => {
        try {
          await db.collection('users').doc(userId).update({
            'scrapingStatus.hackerrank': 'in_progress'
          });
          
          const data = await scrapers.hackerrankScraper(platformUrls.hackerrank);
          await updateUserData(userId, 'hackerrank', data);
          
          await db.collection('users').doc(userId).update({
            'scrapingStatus.hackerrank': 'completed'
          });
          
          return { platform: 'hackerrank', data };
        } catch (error) {
          logger.error('Error scraping HackerRank:', error);
          
          await db.collection('users').doc(userId).update({
            'scrapingStatus.hackerrank': 'failed'
          });
          
          return { platform: 'hackerrank', error: error.message };
        }
      })();
      
      scrapingPromises.push(hackerrankPromise);
    }
    
    // GitHub
    if (platformUrls.github) {
      const githubPromise = (async () => {
        try {
          await db.collection('users').doc(userId).update({
            'scrapingStatus.github': 'in_progress'
          });
          
          const data = await scrapers.githubScraper(platformUrls.github);
          await updateUserData(userId, 'github', data);
          
          await db.collection('users').doc(userId).update({
            'scrapingStatus.github': 'completed'
          });
          
          return { platform: 'github', data };
        } catch (error) {
          logger.error('Error scraping GitHub:', error);
          
          await db.collection('users').doc(userId).update({
            'scrapingStatus.github': 'failed'
          });
          
          return { platform: 'github', error: error.message };
        }
      })();
      
      scrapingPromises.push(githubPromise);
    }
    
    // Wait for all scraping promises to resolve
    const scrapingResults = await Promise.allSettled(scrapingPromises);
    
    // Process results
    scrapingResults.forEach(result => {
      if (result.status === 'fulfilled') {
        const { platform, data, error } = result.value;
        results[platform] = error ? { error } : data;
      }
    });
    
    // Calculate total stats
    let totalSolved = 0;
    let streak = 0;
    
    // Get the user document to update the total stats
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (userData.platformData) {
      // Calculate total solved problems
      if (userData.platformData.leetcode?.totalSolved) {
        totalSolved += parseInt(userData.platformData.leetcode.totalSolved);
      }
      if (userData.platformData.codeforces?.problemsSolved) {
        totalSolved += parseInt(userData.platformData.codeforces.problemsSolved);
      }
      if (userData.platformData.atcoder?.problemsSolved) {
        totalSolved += parseInt(userData.platformData.atcoder.problemsSolved);
      }
      if (userData.platformData.hackerrank?.problemsSolved) {
        totalSolved += parseInt(userData.platformData.hackerrank.problemsSolved);
      }
      
      // Get max streak
      if (userData.platformData.leetcode?.streak) {
        streak = Math.max(streak, userData.platformData.leetcode.streak);
      }
    }
    
    // Update user with total stats
    await db.collection('users').doc(userId).update({
      totalSolved,
      streak,
      lastUpdated: new Date().toISOString(),
      'scrapingStatus.lastUpdated': new Date().toISOString()
    });
    
    return res.status(200).json({
      results,
      totalSolved,
      streak,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error scraping all platforms:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Controller for getting scraping status
const getScrapingStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    
    return res.status(200).json({
      scrapingStatus: userData.scrapingStatus || {},
      lastUpdated: userData.lastUpdated
    });
  } catch (error) {
    logger.error('Error getting scraping status:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Export all the controllers
export default {
  scrapeLeetcode,
  scrapeCodeforces,
  scrapeAtcoder,
  scrapeHackerrank,
  scrapeGithub,
  scrapeAll,
  getScrapingStatus
};
