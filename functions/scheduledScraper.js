const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { 
  scrapeAllPlatforms, 
  formatScrapedData 
} = require('./utils/scrapers');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Scheduled function that automatically scrapes all student data every 30 minutes
 * No admin interaction required - runs completely in background
 */
exports.scheduledStudentScraping = functions.pubsub
  .schedule('every 30 minutes') // Runs every 30 minutes
  .timeZone('America/New_York') // Adjust to your timezone
  .onRun(async (context) => {
    try {
      console.log('🔄 Starting automated student scraping...');
      
      // Get all students from Firestore
      const studentsSnapshot = await admin.firestore()
        .collection('users')
        .where('role', '==', 'student')
        .get();
      
      if (studentsSnapshot.empty) {
        console.log('No students found for scraping');
        return null;
      }
      
      const students = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter students who have platform URLs
      const studentsWithUrls = students.filter(student => 
        student.platformUrls && Object.values(student.platformUrls).some(url => url && url.trim() !== '')
      );
      
      console.log(`📊 Found ${studentsWithUrls.length} students with platform URLs`);
      
      let successCount = 0;
      let failCount = 0;
      
      // Scrape each student sequentially with delays
      for (let i = 0; i < studentsWithUrls.length; i++) {
        const student = studentsWithUrls[i];
        try {
          await scrapeStudentData(student);
          successCount++;
          console.log(`✅ Successfully updated: ${student.name || student.email}`);
        } catch (error) {
          failCount++;
          console.error(`❌ Failed to scrape ${student.name || student.email}:`, error.message);
        }
        
        // Add delay between requests to avoid rate limiting (2 seconds)
        if (i < studentsWithUrls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      console.log(`🎉 Automated scraping completed! Success: ${successCount}, Failed: ${failCount}`);
      
      // You could send a notification here (email, Slack, etc.)
      
      return null;
      
    } catch (error) {
      console.error('❌ Error in scheduled scraping:', error);
      return null;
    }
  });

/**
 * Helper function to scrape data for a single student
 */
async function scrapeStudentData(student) {
  if (!student.platformUrls) return;
  
  const platformUrls = student.platformUrls;
  const updateData = {
    'scrapingStatus.lastUpdated': new Date().toISOString(),
    'scrapingStatus.lastAutoUpdate': new Date().toISOString()
  };
  
  try {
    // Scrape all platforms for this student
    const scrapedData = await scrapeAllPlatforms(platformUrls);
    const formattedData = formatScrapedData(scrapedData);
    
    // Update platform data
    Object.keys(formattedData.platformData).forEach(platform => {
      if (formattedData.platformData[platform]) {
        updateData[`platformData.${platform}`] = formattedData.platformData[platform];
      }
    });
    
    // Update scraping status
    Object.keys(formattedData.scrapingStatus).forEach(platform => {
      if (platform !== 'lastUpdated') {
        updateData[`scrapingStatus.${platform}`] = formattedData.scrapingStatus[platform];
      }
    });
    
    // Write to Firestore
    await admin.firestore()
      .collection('users')
      .doc(student.id)
      .update(updateData);
      
  } catch (error) {
    console.error(`Error scraping data for ${student.name}:`, error);
    
    // Mark all platforms as failed
    Object.keys(platformUrls).forEach(platform => {
      if (platformUrls[platform]) {
        updateData[`scrapingStatus.${platform}`] = 'failed';
      }
    });
    
    // Still update Firestore with failure status
    await admin.firestore()
      .collection('users')
      .doc(student.id)
      .update(updateData);
      
    throw error; // Re-throw to count as failure
  }
}

/**
 * Optional: Manual trigger function (can be called via HTTP)
 */
exports.manualScrapeTrigger = functions.https.onRequest(async (req, res) => {
  // Add simple authentication if needed
  const authToken = req.headers.authorization;
  if (authToken !== `Bearer ${process.env.MANUAL_TRIGGER_TOKEN}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  
  try {
    // Reuse the same logic
    await exports.scheduledStudentScraping();
    res.json({ success: true, message: 'Manual scraping triggered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});