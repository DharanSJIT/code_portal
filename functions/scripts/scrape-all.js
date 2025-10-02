const admin = require('firebase-admin');
const { scrapeAllPlatforms, formatScrapedData } = require('../utils/scrapers');

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.log('Firebase already initialized');
}

async function scrapeAllStudents() {
  try {
    console.log('🔄 Starting automated student scraping via GitHub Actions...');
    console.log('Timestamp:', new Date().toISOString());
    
    // Get all students from Firestore
    const studentsSnapshot = await admin.firestore()
      .collection('users')
      .where('role', '==', 'student')
      .get();
    
    if (studentsSnapshot.empty) {
      console.log('❌ No students found for scraping');
      return;
    }
    
    const students = studentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`📊 Total students in database: ${students.length}`);
    
    // Filter students who have platform URLs
    const studentsWithUrls = students.filter(student => 
      student.platformUrls && Object.values(student.platformUrls).some(url => url && url.trim() !== '')
    );
    
    console.log(`🎯 Students with platform URLs: ${studentsWithUrls.length}`);
    
    if (studentsWithUrls.length === 0) {
      console.log('❌ No students with platform URLs found');
      return;
    }
    
    let successCount = 0;
    let failCount = 0;
    
    // Scrape each student sequentially with delays
    for (let i = 0; i < studentsWithUrls.length; i++) {
      const student = studentsWithUrls[i];
      const studentName = student.name || student.email || student.id;
      
      console.log(`\n--- Processing ${i + 1}/${studentsWithUrls.length}: ${studentName} ---`);
      
      try {
        await scrapeStudentData(student);
        successCount++;
        console.log(`✅ Successfully updated: ${studentName}`);
      } catch (error) {
        failCount++;
        console.error(`❌ Failed to scrape ${studentName}:`, error.message);
      }
      
      // Add delay between requests to avoid rate limiting (2 seconds)
      if (i < studentsWithUrls.length - 1) {
        console.log('⏳ Waiting 2 seconds before next student...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`\n🎉 AUTOMATED SCRAPING COMPLETED!`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📅 Next run: Every 30 minutes`);
    
  } catch (error) {
    console.error('💥 CRITICAL ERROR in scraping process:', error);
    process.exit(1);
  }
}

async function scrapeStudentData(student) {
  if (!student.platformUrls) {
    throw new Error('No platform URLs found');
  }
  
  const platformUrls = student.platformUrls;
  const updateData = {
    'scrapingStatus.lastUpdated': new Date().toISOString(),
    'scrapingStatus.lastAutoUpdate': new Date().toISOString(),
    'scrapingStatus.source': 'github-actions'
  };
  
  try {
    console.log(`   Scraping platforms for ${student.name || student.email}`);
    
    // Scrape all platforms for this student
    const scrapedData = await scrapeAllPlatforms(platformUrls);
    const formattedData = formatScrapedData(scrapedData);
    
    // Update platform data
    Object.keys(formattedData.platformData).forEach(platform => {
      if (formattedData.platformData[platform]) {
        updateData[`platformData.${platform}`] = formattedData.platformData[platform];
        console.log(`   📈 ${platform}: ${formattedData.platformData[platform].problemsSolved || formattedData.platformData[platform].repositories || 'N/A'}`);
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
      
    console.log(`   💾 Saved to Firestore`);
      
  } catch (error) {
    console.error(`   ❌ Error scraping data:`, error.message);
    
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

// Run the scraper
scrapeAllStudents()
  .then(() => {
    console.log('✨ Scraping process finished');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Scraping process failed:', error);
    process.exit(1);
  });