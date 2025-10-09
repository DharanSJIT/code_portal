const functions = require('firebase-functions');
const scheduledScraper = require('./scheduledScraper');

// Export the scheduled function
exports.scheduledStudentScraping = scheduledScraper.scheduledStudentScraping;

// Optional: Export manual trigger
exports.manualScrapeTrigger = scheduledScraper.manualScrapeTrigger;